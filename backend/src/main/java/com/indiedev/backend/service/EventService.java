package com.indiedev.backend.service;

import com.indiedev.backend.model.Event;
import com.indiedev.backend.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class EventService {

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
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

    public Event createEvent(Event event) {
        validateEventInput(event);
        if (event.getStatus() == null || event.getStatus().trim().isEmpty()) {
            event.setStatus("Published");
        }
        event.setCreatedAt(LocalDateTime.now());
        event.setUpdatedAt(LocalDateTime.now());
        return eventRepository.save(event);
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
        existing.setEventType(updatedInfo.getEventType());
        existing.setTitle(updatedInfo.getTitle());
        existing.setDescription(updatedInfo.getDescription());
        existing.setEventDate(updatedInfo.getEventDate());
        existing.setLocation(updatedInfo.getLocation());
        existing.setVirtual(updatedInfo.isVirtual());
        existing.setCapacity(updatedInfo.getCapacity());
        existing.setImageUrl(updatedInfo.getImageUrl());
        if (updatedInfo.getTicketTiers() != null) {
            existing.setTicketTiers(updatedInfo.getTicketTiers());
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
        if (event.getEventDate() == null) {
            throw new IllegalArgumentException("Event date and time cannot be empty. Please correct the issue and resubmit.");
        }
    }
}
