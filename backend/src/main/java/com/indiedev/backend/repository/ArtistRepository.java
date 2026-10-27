package com.indiedev.backend.repository;

import com.indiedev.backend.model.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ArtistRepository extends JpaRepository<Artist, Long> {

    @Query("select a from Artist a where a.id = ?1")
    Artist findArtistById(Long artistId);

    @Query("""
            select a from Artist a
            where (?1 is null or lower(a.name) like lower(concat('%', ?1, '%')))
              and (?2 is null or lower(a.genre) like lower(concat('%', ?2, '%')))
              and (?3 is null or lower(a.location) like lower(concat('%', ?3, '%')))
            order by a.name
            """)
    List<Artist> search(String name, String genre, String location);

    // Same filters as search, limited to artists inside a latitude/longitude box.
    // The service then trims the box down to an exact radius.
    @Query("""
            select a from Artist a
            where (?1 is null or lower(a.name) like lower(concat('%', ?1, '%')))
              and (?2 is null or lower(a.genre) like lower(concat('%', ?2, '%')))
              and (?3 is null or lower(a.location) like lower(concat('%', ?3, '%')))
              and a.latitude between ?4 and ?5
              and a.longitude between ?6 and ?7
            """)
    List<Artist> searchWithinBounds(String name, String genre, String location,
                                    double minLatitude, double maxLatitude,
                                    double minLongitude, double maxLongitude);

}
