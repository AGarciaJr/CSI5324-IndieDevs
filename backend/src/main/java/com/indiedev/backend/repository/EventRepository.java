package com.indiedev.backend.repository;

import com.indiedev.backend.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByArtistIdOrderByStartsAtAsc(Long artistId);

}
