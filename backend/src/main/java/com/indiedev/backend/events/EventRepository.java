package com.indiedev.backend.events;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    @Query("select e from Event e where e.artistId = ?1")
    List<Event> findByArtistId(Long artistId);

    @Query("select e from Event e where e.id = ?1")
    Event findEventById(Long eventId);
}
