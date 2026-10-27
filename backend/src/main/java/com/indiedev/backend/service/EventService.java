/* Handles the Create Event use case. Only active artist accounts can create events.
 * A submitted event waits in PENDING_APPROVAL for an admin; approving it is a separate use case.
 */

package com.indiedev.backend.service;

import com.indiedev.backend.dto.CreateEventRequest;
import com.indiedev.backend.model.*;
import com.indiedev.backend.repository.EventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final AccessControlService accessControlService;

    public EventService(EventRepository eventRepository, AccessControlService accessControlService) {
        this.eventRepository = eventRepository;
        this.accessControlService = accessControlService;
    }

    @Transactional
    public Event createEvent(Long userId, CreateEventRequest request) {
        UserAccount artist = accessControlService.requireRole(userId, Role.ARTIST);
        if (artist.getArtistId() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Create your artist profile before adding events");
        }

        validateEvent(request);

        Event event = new Event();
        event.setArtistId(artist.getArtistId());
        event.setTitle(request.title().trim());
        event.setDescription(request.description());
        event.setStartsAt(request.startsAt());
        event.setLocation(request.location().trim());
        event.setVirtual(request.virtual());
        event.setCapacity(request.capacity());
        event.setTicketTiers(request.ticketTiers().stream()
                .map(t -> new TicketTier(t.name().trim(), t.price()))
                .toList());
        event.setStatus(request.saveAsDraft() ? EventStatus.DRAFT : EventStatus.PENDING_APPROVAL);

        return eventRepository.save(event);
    }

    public List<Event> getEventsForArtist(Long userId) {
        UserAccount artist = accessControlService.requireRole(userId, Role.ARTIST);
        if (artist.getArtistId() == null) {
            return List.of();
        }
        return eventRepository.findByArtistIdOrderByStartsAtAsc(artist.getArtistId());
    }

    // Rules that field annotations on the request cannot express
    void validateEvent(CreateEventRequest request) {
        if (!request.startsAt().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event date must be in the future");
        }
        if (request.virtual() && !request.location().trim().matches("(?i)^https?://\\S+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Virtual events need an http(s) link as the location");
        }
    }

}
