/* Handles the Create Event and Update Event use cases. Only active artist accounts can create/update events.
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
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final AccessControlService accessControlService;

    public EventService(EventRepository eventRepository, AccessControlService accessControlService) {
        this.eventRepository = eventRepository;
        this.accessControlService = accessControlService;
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public Event getEventById(Long eventId) {
        Event event = eventRepository.findEventById(eventId);
        if (event == null) {
            throw new NoSuchElementException("Event with ID " + eventId + " not found.");
        }
        return event;
    }

    public List<Event> getEventsByArtist(Long artistId) {
        return eventRepository.findByArtistId(artistId);
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
        if (request.ticketTiers() != null) {
            event.setTicketTiers(request.ticketTiers().stream()
                    .map(t -> new TicketTier(t.name().trim(), t.price()))
                    .toList());
        }
        event.setStatus(request.saveAsDraft() ? EventStatus.DRAFT : EventStatus.PENDING_APPROVAL);

        return eventRepository.save(event);
    }

    public Event createEvent(Event event) {
        validateEventInput(event);
        if (event.getStatus() == null) {
            event.setStatus(EventStatus.PUBLISHED);
        }
        event.setCreatedAt(LocalDateTime.now());
        event.setUpdatedAt(LocalDateTime.now());
        return eventRepository.save(event);
    }

    public List<Event> getEventsForArtist(Long userId) {
        UserAccount artist = accessControlService.requireRole(userId, Role.ARTIST);
        if (artist.getArtistId() == null) {
            return List.of();
        }
        return eventRepository.findByArtistIdOrderByStartsAtAsc(artist.getArtistId());
    }

    /**
     * Use Case: Update Event (Nicholas Nolen)
     * Updates an existing event, validating input details (Extension 5a)
     * and verifying that the artist has acknowledged reviewing the submission details (Extension 6a).
     */
    public Event updateEvent(Long eventId, Event updatedInfo) {
        Event existing = eventRepository.findById(eventId)
                .orElseThrow(() -> new NoSuchElementException("Event with ID " + eventId + " not found."));

        // Extension 5a: Detect and reject invalid input
        validateEventInput(updatedInfo);

        // Verify artist ownership if provided
        if (updatedInfo.getArtistId() != null && existing.getArtistId() != null
                && !updatedInfo.getArtistId().equals(existing.getArtistId())) {
            throw new IllegalArgumentException("Artist ID " + updatedInfo.getArtistId()
                    + " does not match event owner. Unauthorized to edit this event.");
        }

        // Extension 6a: Artist must acknowledge reviewing details before submitting
        if (!updatedInfo.isReviewedAcknowledgment()) {
            throw new IllegalStateException("Artist must acknowledge they have reviewed the details of their submission before submitting.");
        }

        // Write over the event information (Main flow steps 2 & 3)
        if (updatedInfo.getEventType() != null) {
            existing.setEventType(updatedInfo.getEventType());
        }
        existing.setTitle(updatedInfo.getTitle());
        existing.setDescription(updatedInfo.getDescription());
        if (updatedInfo.getStartsAt() != null) {
            existing.setStartsAt(updatedInfo.getStartsAt());
        }
        existing.setLocation(updatedInfo.getLocation());
        existing.setVirtual(updatedInfo.isVirtual());
        existing.setCapacity(updatedInfo.getCapacity());
        if (updatedInfo.getImageUrl() != null) {
            existing.setImageUrl(updatedInfo.getImageUrl());
        }
        if (updatedInfo.getTicketTiers() != null && !updatedInfo.getTicketTiers().isEmpty()) {
            existing.setTicketTiers(new ArrayList<>(updatedInfo.getTicketTiers()));
        }
        if (updatedInfo.getStatus() != null) {
            existing.setStatus(updatedInfo.getStatus());
        }
        existing.setReviewedAcknowledgment(true);
        existing.setUpdatedAt(LocalDateTime.now());

        return eventRepository.save(existing);
    }

    public void deleteEvent(Long eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new NoSuchElementException("Event with ID " + eventId + " not found.");
        }
        eventRepository.deleteById(eventId);
    }

    private void validateEventInput(Event event) {
        if (event == null) {
            throw new IllegalArgumentException("Event information must be provided. Please correct the issue and resubmit.");
        }
        if (event.getEventType() == null || event.getEventType().trim().isEmpty()) {
            throw new IllegalArgumentException("Event type cannot be empty. Please correct the issue and resubmit.");
        }
        if (event.getTitle() == null || event.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Event title cannot be empty. Please correct the issue and resubmit.");
        }
        if (event.getDescription() == null || event.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Event description cannot be empty. Please correct the issue and resubmit.");
        }
        if (event.getStartsAt() == null) {
            throw new IllegalArgumentException("Event date and time cannot be empty. Please correct the issue and resubmit.");
        }
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
