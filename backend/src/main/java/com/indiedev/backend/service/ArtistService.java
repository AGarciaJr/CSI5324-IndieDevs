/* The service that sits between the api and the actual artist repository.
 * Also handles the Search for Artist use case, which only fans can perform.
 */

package com.indiedev.backend.service;

import com.indiedev.backend.dto.ArtistSearchCriteria;
import com.indiedev.backend.dto.ArtistSearchResult;
import com.indiedev.backend.model.Artist;
import com.indiedev.backend.model.Role;
import com.indiedev.backend.model.UserAccount;
import com.indiedev.backend.repository.ArtistRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@Service
public class ArtistService {

    static final double MAX_RADIUS_KM = 500;
    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double KM_PER_DEGREE_LATITUDE = 111.32;

    private final ArtistRepository artistRepository;
    private final AccessControlService accessControlService;

    public ArtistService(ArtistRepository artistRepository, AccessControlService accessControlService) {
        this.artistRepository = artistRepository;
        this.accessControlService = accessControlService;
    }

    public Artist saveArtist(Artist artist) {
        return artistRepository.save(artist);
    }

    public List<Artist> getAllArtists() {
        return getAllArtists(false);
    }

    public List<Artist> getAllArtists(boolean includeSuspended) {
        List<Artist> artists = artistRepository.findAll();
        if (!includeSuspended) {
            return artists.stream().filter(a -> !a.isSuspended()).toList();
        }
        return artists;
    }

    public Artist getArtistById(Long artistId) {
        return artistRepository.findArtistById(artistId);
    }

    public List<ArtistSearchResult> searchArtists(Long fanId, ArtistSearchCriteria criteria) {
        return searchArtists(fanId, criteria, false);
    }

    public List<ArtistSearchResult> searchArtists(Long fanId, ArtistSearchCriteria criteria, boolean includeSuspended) {
        UserAccount fan = accessControlService.requireRole(fanId, Role.FAN);

        String name = blankToNull(criteria.name());
        String genre = blankToNull(criteria.genre());
        String location = blankToNull(criteria.location());

        if (criteria.radiusKm() == null) {
            if (name == null && genre == null && location == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter at least one search criterion");
            }
            return artistRepository.search(name, genre, location).stream()
                    .filter(artist -> includeSuspended || !artist.isSuspended())
                    .map(artist -> ArtistSearchResult.of(artist, null))
                    .toList();
        }

        double radiusKm = criteria.radiusKm();
        if (radiusKm <= 0 || radiusKm > MAX_RADIUS_KM) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Search radius must be between 0 and " + (int) MAX_RADIUS_KM + " km");
        }
        double[] origin = resolveOrigin(fan, criteria);
        return searchNearby(name, genre, location, origin[0], origin[1], radiusKm, includeSuspended);
    }

    // Use the coordinates sent with the search, or fall back to the fan's saved home location
    private double[] resolveOrigin(UserAccount fan, ArtistSearchCriteria criteria) {
        Double latitude = criteria.latitude();
        Double longitude = criteria.longitude();
        if ((latitude == null) != (longitude == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Send both latitude and longitude, or neither");
        }
        if (latitude == null) {
            latitude = fan.getLatitude();
            longitude = fan.getLongitude();
        }
        if (latitude == null || longitude == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Share your location or save a home location to search nearby");
        }
        if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coordinates are out of range");
        }
        return new double[] {latitude, longitude};
    }

    // Narrow down with a cheap box query in the database, then keep only artists inside the exact radius
    private List<ArtistSearchResult> searchNearby(String name, String genre, String location,
                                                  double latitude, double longitude, double radiusKm,
                                                  boolean includeSuspended) {
        double latitudeDelta = radiusKm / KM_PER_DEGREE_LATITUDE;
        double longitudeDelta = radiusKm / (KM_PER_DEGREE_LATITUDE * Math.max(Math.cos(Math.toRadians(latitude)), 0.01));

        return artistRepository.searchWithinBounds(name, genre, location,
                        latitude - latitudeDelta, latitude + latitudeDelta,
                        longitude - longitudeDelta, longitude + longitudeDelta).stream()
                .filter(artist -> includeSuspended || !artist.isSuspended())
                .map(artist -> ArtistSearchResult.of(artist,
                        distanceKm(latitude, longitude, artist.getLatitude(), artist.getLongitude())))
                .filter(result -> result.distanceKm() <= radiusKm)
                .sorted(Comparator.comparingDouble(ArtistSearchResult::distanceKm))
                .map(result -> new ArtistSearchResult(result.id(), result.name(), result.genre(), result.location(),
                        result.profileThumbnail(), Math.round(result.distanceKm() * 10) / 10.0))
                .toList();
    }

    // Great-circle distance between two points (haversine formula)
    static double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
