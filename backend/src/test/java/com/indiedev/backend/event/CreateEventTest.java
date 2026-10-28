package com.indiedev.backend.event;

import com.indiedev.backend.model.AccountStatus;
import com.indiedev.backend.repository.EventRepository;
import com.indiedev.backend.repository.UserAccountRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CreateEventTest {

    @org.junit.jupiter.api.BeforeEach
    void isolateArtistEvents() {
        // Event creation assertions start with an empty artist event list, independent of demo seeds.
        eventRepository.deleteAll();
    }

    private static final long FAN = 1L;
    private static final long ARTIST = 2L; // Luna Park, artist profile 1
    private static final long ADMIN = 3L;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    private static String eventJson(LocalDateTime startsAt, String location, boolean virtual,
                                    int capacity, String tiers, boolean draft) {
        return """
                {"title": "Album Release Show", "description": "Playing the new record front to back",
                 "startsAt": "%s", "location": "%s", "virtual": %s, "capacity": %d,
                 "ticketTiers": %s, "saveAsDraft": %s}
                """.formatted(startsAt.truncatedTo(ChronoUnit.MINUTES), location, virtual, capacity, tiers, draft);
    }

    private static String validEvent(boolean draft) {
        return eventJson(LocalDateTime.now().plusDays(14), "Mohawk, Austin TX", false, 250,
                "[{\"name\": \"General admission\", \"price\": 20.00}, {\"name\": \"VIP\", \"price\": 55.00}]", draft);
    }

    private static MockHttpServletRequestBuilder createAs(Long userId, String body) {
        MockHttpServletRequestBuilder request = post("/api/events").contentType(MediaType.APPLICATION_JSON).content(body);
        return userId == null ? request : request.header("X-User-Id", userId);
    }

    @Test
    void artistCreatesEventThatWaitsForApproval() throws Exception {
        mockMvc.perform(createAs(ARTIST, validEvent(false)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.artistId").value(1))
                .andExpect(jsonPath("$.status").value("PENDING_APPROVAL"))
                .andExpect(jsonPath("$.ticketTiers.length()").value(2))
                .andExpect(jsonPath("$.ticketTiers[1].name").value("VIP"));

        assertThat(eventRepository.findByArtistIdOrderByStartsAtAsc(1L)).hasSize(1);
    }

    @Test
    void artistCanSaveADraft() throws Exception {
        mockMvc.perform(createAs(ARTIST, validEvent(true)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        mockMvc.perform(get("/api/events/mine").header("X-User-Id", ARTIST))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("DRAFT"));
    }

    @Test
    void onlyArtistsCanCreateEvents() throws Exception {
        mockMvc.perform(createAs(null, validEvent(false))).andExpect(status().isUnauthorized());
        mockMvc.perform(createAs(FAN, validEvent(false))).andExpect(status().isForbidden());
        mockMvc.perform(createAs(ADMIN, validEvent(false))).andExpect(status().isForbidden());
        mockMvc.perform(createAs(999L, validEvent(false))).andExpect(status().isUnauthorized());

        assertThat(eventRepository.findByArtistIdOrderByStartsAtAsc(1L)).isEmpty();
    }

    @Test
    void suspendedArtistCannotCreateEvents() throws Exception {
        var artist = userAccountRepository.findById(ARTIST).orElseThrow();
        artist.setStatus(AccountStatus.SUSPENDED);
        userAccountRepository.save(artist);

        mockMvc.perform(createAs(ARTIST, validEvent(false))).andExpect(status().isForbidden());
    }

    @Test
    void invalidEventDetailsAreRejected() throws Exception {
        String tiers = "[{\"name\": \"GA\", \"price\": 10}]";
        // Missing title
        mockMvc.perform(createAs(ARTIST, validEvent(false).replace("Album Release Show", "")))
                .andExpect(status().isBadRequest());
        // Date in the past
        mockMvc.perform(createAs(ARTIST, eventJson(LocalDateTime.now().minusDays(1), "Austin", false, 10, tiers, false)))
                .andExpect(status().isBadRequest());
        // No ticket tiers
        mockMvc.perform(createAs(ARTIST, eventJson(LocalDateTime.now().plusDays(1), "Austin", false, 10, "[]", false)))
                .andExpect(status().isBadRequest());
        // Negative price
        mockMvc.perform(createAs(ARTIST, eventJson(LocalDateTime.now().plusDays(1), "Austin", false, 10,
                        "[{\"name\": \"GA\", \"price\": -5}]", false)))
                .andExpect(status().isBadRequest());
        // Zero capacity
        mockMvc.perform(createAs(ARTIST, eventJson(LocalDateTime.now().plusDays(1), "Austin", false, 0, tiers, false)))
                .andExpect(status().isBadRequest());
        // Virtual event without a link
        mockMvc.perform(createAs(ARTIST, eventJson(LocalDateTime.now().plusDays(1), "my living room", true, 10, tiers, false)))
                .andExpect(status().isBadRequest());

        assertThat(eventRepository.findByArtistIdOrderByStartsAtAsc(1L)).isEmpty();
    }

    @Test
    void virtualEventWithALinkIsAccepted() throws Exception {
        mockMvc.perform(createAs(ARTIST, eventJson(LocalDateTime.now().plusDays(3), "https://stream.example.com/luna",
                        true, 1000, "[{\"name\": \"Stream pass\", \"price\": 0}]", false)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.virtual").value(true));
    }

}
