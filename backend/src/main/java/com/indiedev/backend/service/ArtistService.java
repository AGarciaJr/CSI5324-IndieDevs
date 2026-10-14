/* The service that sits between the api and the actual artist repository
 */

package com.indiedev.backend.service;

import com.indiedev.backend.model.Artist;
import com.indiedev.backend.repository.ArtistRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ArtistService {

    private final ArtistRepository artistRepository;

    public ArtistService(ArtistRepository artistRepository) {
        this.artistRepository = artistRepository;
    }

    public Artist saveArtist(Artist artist) {
        return artistRepository.save(artist);
    }

    public List<Artist> getAllArtists() {
        return artistRepository.findAll();
    }

    public Artist getArtistById(Long artistId) {
        return artistRepository.findArtistById(artistId);
    }

    public List<Artist> searchArtists(String name, String genre, String location) {
        return artistRepository.search(blankToNull(name), blankToNull(genre), blankToNull(location));
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

}
