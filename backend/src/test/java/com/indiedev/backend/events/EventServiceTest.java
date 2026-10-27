package com.indiedev.backend.events;

import com.indiedev.backend.model.Event;
import com.indiedev.backend.repository.EventRepository;
import com.indiedev.backend.service.EventService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class EventServiceTest {

    @Autowired
    private EventService eventService;

    @Autowired
    private EventRepository eventRepository;

    private Event testEvent;

    @BeforeEach
    void setUp() {
        eventRepository.deleteAll();

        Event event = new Event();
        event.setArtistId(10L);
        event.setEventType("Concert");
        event.setTitle("Fall Tour Premiere");
        event.setDescription("Opening night of the fall tour with special acoustic guests.");
        event.setEventDate(LocalDateTime.now().plusDays(14));
        event.setLocation("The Loft, Austin, TX");
        event.setVirtual(false);
        event.setCapacity(250);
        event.setImageUrl("https://example.com/tour.jpg");
        event.setReviewedAcknowledgment(true);

        testEvent = eventRepository.save(event);
    }

    @Test
    @DisplayName("Update Event: Successfully updates all event details when acknowledged")
    void testUpdateEventSuccess() {
        Event updatedInfo = new Event();
        updatedInfo.setArtistId(10L);
        updatedInfo.setEventType("Festival");
        updatedInfo.setTitle("Fall Tour Premiere (Venue Upgrade)");
        updatedInfo.setDescription("Due to demand, moved to Main Stage!");
        updatedInfo.setEventDate(LocalDateTime.now().plusDays(15));
        updatedInfo.setLocation("Austin City Music Hall");
        updatedInfo.setVirtual(false);
        updatedInfo.setCapacity(600);
        updatedInfo.setImageUrl("https://example.com/tour_upgraded.jpg");
        updatedInfo.setReviewedAcknowledgment(true);

        Event result = eventService.updateEvent(testEvent.getId(), updatedInfo);

        assertNotNull(result);
        assertEquals("Festival", result.getEventType());
        assertEquals("Fall Tour Premiere (Venue Upgrade)", result.getTitle());
        assertEquals("Austin City Music Hall", result.getLocation());
        assertEquals(600, result.getCapacity());
        assertTrue(result.isReviewedAcknowledgment());
        assertNotNull(result.getUpdatedAt());
    }

    @Test
    @DisplayName("Update Event: Throws IllegalStateException when reviewedAcknowledgment is false (Extension 6a)")
    void testUpdateEventWithoutAcknowledgment() {
        Event updatedInfo = new Event();
        updatedInfo.setArtistId(10L);
        updatedInfo.setEventType("Concert");
        updatedInfo.setTitle("Updated Title");
        updatedInfo.setDescription("Valid description");
        updatedInfo.setEventDate(LocalDateTime.now().plusDays(2));
        updatedInfo.setReviewedAcknowledgment(false); // Artist failed to acknowledge

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                eventService.updateEvent(testEvent.getId(), updatedInfo));

        assertTrue(ex.getMessage().contains("Artist must acknowledge they have reviewed the details"));
    }

    @Test
    @DisplayName("Update Event: Throws IllegalArgumentException on invalid input (Extension 5a)")
    void testUpdateEventInvalidInput() {
        Event missingTitle = new Event();
        missingTitle.setArtistId(10L);
        missingTitle.setEventType("Concert");
        missingTitle.setTitle(""); // Invalid empty title
        missingTitle.setDescription("Valid description");
        missingTitle.setEventDate(LocalDateTime.now().plusDays(2));
        missingTitle.setReviewedAcknowledgment(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                eventService.updateEvent(testEvent.getId(), missingTitle));

        assertTrue(ex.getMessage().contains("Event title cannot be empty"));
    }

    @Test
    @DisplayName("Update Event: Rejects update when artist ID does not match owner")
    void testUpdateEventArtistMismatch() {
        Event mismatchedArtist = new Event();
        mismatchedArtist.setArtistId(999L); // Not owner (10)
        mismatchedArtist.setEventType("Concert");
        mismatchedArtist.setTitle("Valid Title");
        mismatchedArtist.setDescription("Valid description");
        mismatchedArtist.setEventDate(LocalDateTime.now().plusDays(2));
        mismatchedArtist.setReviewedAcknowledgment(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                eventService.updateEvent(testEvent.getId(), mismatchedArtist));

        assertTrue(ex.getMessage().contains("Unauthorized to edit this event"));
    }

    @Test
    @DisplayName("Update Event: Throws NoSuchElementException for nonexistent event ID")
    void testUpdateNonexistentEvent() {
        Event updatedInfo = new Event();
        updatedInfo.setEventType("Concert");
        updatedInfo.setTitle("Valid Title");
        updatedInfo.setDescription("Valid description");
        updatedInfo.setEventDate(LocalDateTime.now().plusDays(2));
        updatedInfo.setReviewedAcknowledgment(true);

        assertThrows(NoSuchElementException.class, () ->
                eventService.updateEvent(99999L, updatedInfo));
    }
}
