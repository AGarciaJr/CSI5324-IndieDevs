package com.indiedev.backend.events;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class EventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EventRepository eventRepository;

    private Event existingEvent;

    @BeforeEach
    void setUp() {
        eventRepository.deleteAll();

        Event event = new Event();
        event.setArtistId(101L);
        event.setEventType("Concert");
        event.setTitle("Spring Showcase");
        event.setDescription("Original Showcase description.");
        event.setEventDate(LocalDateTime.now().plusDays(7));
        event.setLocation("The Arena");
        event.setImageUrl("https://example.com/spring.png");
        event.setReviewedAcknowledgment(true);

        existingEvent = eventRepository.save(event);
    }

    @Test
    @DisplayName("PUT /api/events/{id} - Successfully updates event")
    void testUpdateEventEndpointSuccess() throws Exception {
        String jsonPayload = """
                {
                    "artistId": 101,
                    "eventType": "Concert & Festival",
                    "title": "Spring Showcase Revamped",
                    "description": "Updated description with full band lineup.",
                    "eventDate": "2026-11-20T20:00:00",
                    "location": "The Grand Arena",
                    "imageUrl": "https://example.com/revamped.png",
                    "reviewedAcknowledgment": true
                }
                """;

        mockMvc.perform(put("/api/events/" + existingEvent.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Spring Showcase Revamped"))
                .andExpect(jsonPath("$.eventType").value("Concert & Festival"))
                .andExpect(jsonPath("$.reviewedAcknowledgment").value(true));
    }

    @Test
    @DisplayName("PUT /api/events/{id} - Rejects update without review acknowledgment")
    void testUpdateEventWithoutAcknowledgment() {
        String jsonPayload = """
                {
                    "artistId": 101,
                    "eventType": "Concert & Festival",
                    "title": "Spring Showcase Revamped",
                    "description": "Updated description.",
                    "eventDate": "2026-11-20T20:00:00",
                    "reviewedAcknowledgment": false
                }
                """;

        Exception exception = assertThrows(Exception.class, () ->
                mockMvc.perform(put("/api/events/" + existingEvent.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
        );

        assertTrue(exception.getCause() instanceof IllegalStateException);
        assertTrue(exception.getCause().getMessage().contains("Artist must acknowledge they have reviewed the details"));
    }

    @Test
    @DisplayName("GET /api/events/artist/{artistId} - Retrieves events for artist profile")
    void testGetEventsByArtist() throws Exception {
        mockMvc.perform(get("/api/events/artist/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Spring Showcase"))
                .andExpect(jsonPath("$[0].artistId").value(101));
    }
}
