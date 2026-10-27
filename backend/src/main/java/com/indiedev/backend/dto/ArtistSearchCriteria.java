/* What a fan can search by. Text filters match partially and ignore case.
 * Setting radiusKm turns on a nearby search around (latitude, longitude),
 * or around the fan's saved home location when no coordinates are sent.
 */

package com.indiedev.backend.dto;

public record ArtistSearchCriteria(
        String name,
        String genre,
        String location,
        Double latitude,
        Double longitude,
        Double radiusKm) {

    public static ArtistSearchCriteria byText(String name, String genre, String location) {
        return new ArtistSearchCriteria(name, genre, location, null, null, null);
    }

    public static ArtistSearchCriteria nearby(Double latitude, Double longitude, Double radiusKm) {
        return new ArtistSearchCriteria(null, null, null, latitude, longitude, radiusKm);
    }

}
