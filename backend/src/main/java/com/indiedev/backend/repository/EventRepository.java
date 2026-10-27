package com.indiedev.backend.repository;

import com.indiedev.backend.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByArtistId(Long artistId);

    Event findEventById(Long id);

    List<Event> findByArtistIdOrderByStartsAtAsc(Long artistId);
}
