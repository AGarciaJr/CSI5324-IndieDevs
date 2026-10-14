package com.indiedev.backend.events;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.List;
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
        event.setArtistId(100L);
        event.setEventType("Concert");
        event.setTitle("Original Concert Title");
        event.setDescription("Original description of the concert.");
        event.setEventDate(LocalDateTime.now().plusDays(5));
        event.setLocation("The Stage");
        event.setImageUrl("https://example.com/stage.jpg");
        event.setReviewedAcknowledgment(true);

        testEvent = eventRepository.save(event);
    }

    @Test
    @DisplayName("Main Flow: Artist successfully updates existing event with reviewed acknowledgment")
    void testUpdateEventSuccess() {
        Event updatedDetails = new Event();
        updatedDetails.setArtistId(100L);
        updatedDetails.setEventType("Album Launch Party");
        updatedDetails.setTitle("Updated Album Launch Title");
        updatedDetails.setDescription("Updated description with guest performers.");
        LocalDateTime newDate = LocalDateTime.now().plusDays(10);
        updatedDetails.setEventDate(newDate);
        updatedDetails.setLocation("Main Hall");
        updatedDetails.setImageUrl("https://example.com/album_launch.jpg");
        updatedDetails.setReviewedAcknowledgment(true);

        Event result = eventService.updateEvent(testEvent.getId(), updatedDetails);

        assertNotNull(result);
        assertEquals("Album Launch Party", result.getEventType());
        assertEquals("Updated Album Launch Title", result.getTitle());
        assertEquals("Updated description with guest performers.", result.getDescription());
        assertEquals("Main Hall", result.getLocation());
        assertTrue(result.isReviewedAcknowledgment());

        // Verify it displays on the artist's profile
        List<Event> artistEvents = eventService.getEventsByArtist(100L);
        assertEquals(1, artistEvents.size());
        assertEquals("Updated Album Launch Title", artistEvents.get(0).getTitle());
    }

    @Test
    @DisplayName("Extension 5a: Updating event fails when input is invalid (empty description)")
    void testUpdateEventInvalidInput() {
        Event invalidDetails = new Event();
        invalidDetails.setArtistId(100L);
        invalidDetails.setEventType("Concert");
        invalidDetails.setTitle("New Title");
        invalidDetails.setDescription(""); // Invalid: empty description
        invalidDetails.setEventDate(LocalDateTime.now().plusDays(10));
        invalidDetails.setReviewedAcknowledgment(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                eventService.updateEvent(testEvent.getId(), invalidDetails)
        );

        assertTrue(exception.getMessage().contains("Event description cannot be empty"));
    }

    @Test
    @DisplayName("Extension 6a: Updating event fails when artist fails to acknowledge reviewing details")
    void testUpdateEventFailsWithoutAcknowledgment() {
        Event unacknowledgedDetails = new Event();
        unacknowledgedDetails.setArtistId(100L);
        unacknowledgedDetails.setEventType("Concert");
        unacknowledgedDetails.setTitle("New Title");
        unacknowledgedDetails.setDescription("New Description");
        unacknowledgedDetails.setEventDate(LocalDateTime.now().plusDays(10));
        unacknowledgedDetails.setReviewedAcknowledgment(false); // Artist fails to acknowledge

        IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                eventService.updateEvent(testEvent.getId(), unacknowledgedDetails)
        );

        assertEquals("Artist must acknowledge they have reviewed the details of their submission before submitting.",
                exception.getMessage());
    }

    @Test
    @DisplayName("Precondition: Updating non-existent event throws NoSuchElementException")
    void testUpdateNonExistentEvent() {
        Event updateInfo = new Event();
        updateInfo.setArtistId(100L);
        updateInfo.setEventType("Concert");
        updateInfo.setTitle("Title");
        updateInfo.setDescription("Description");
        updateInfo.setEventDate(LocalDateTime.now().plusDays(10));
        updateInfo.setReviewedAcknowledgment(true);

        assertThrows(NoSuchElementException.class, () ->
                eventService.updateEvent(99999L, updateInfo)
        );
    }

    @Test
    @DisplayName("Security: Different artist cannot update another artist's event")
    void testUnauthorizedArtistCannotUpdate() {
        Event foreignArtistDetails = new Event();
        foreignArtistDetails.setArtistId(999L); // Different artist
        foreignArtistDetails.setEventType("Concert");
        foreignArtistDetails.setTitle("Hijacked Title");
        foreignArtistDetails.setDescription("Hijacked Description");
        foreignArtistDetails.setEventDate(LocalDateTime.now().plusDays(10));
        foreignArtistDetails.setReviewedAcknowledgment(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                eventService.updateEvent(testEvent.getId(), foreignArtistDetails)
        );

        assertTrue(exception.getMessage().contains("Unauthorized to edit this event"));
    }
}
