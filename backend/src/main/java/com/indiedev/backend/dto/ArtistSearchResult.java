package com.indiedev.backend.dto;

import com.indiedev.backend.model.Artist;

/* One artist in a search result. distanceKm is only set for nearby searches. */
public record ArtistSearchResult(
        Long id,
        String name,
        String genre,
        String location,
        String profileThumbnail,
        Double distanceKm) {

    public static ArtistSearchResult of(Artist artist, Double distanceKm) {
        return new ArtistSearchResult(artist.getId(), artist.getName(), artist.getGenre(),
                artist.getLocation(), artist.getProfileThumbnail(), distanceKm);
    }

}
