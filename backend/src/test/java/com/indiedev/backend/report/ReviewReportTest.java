package com.indiedev.backend.report;

import com.indiedev.backend.model.AccountStatus;
import com.indiedev.backend.model.EventStatus;
import com.indiedev.backend.repository.EventRepository;
import com.indiedev.backend.repository.NotificationRepository;
import com.indiedev.backend.repository.PostRepository;
import com.indiedev.backend.repository.UserAccountRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ReviewReportTest {

    // Seeded data (see data.sql)
    private static final long FAN = 1L;
    private static final long ARTIST = 2L;
    private static final long ADMIN = 3L;
    private static final long REPORTED_ARTIST = 4L;
    private static final long POST_REPORT = 1L;
    private static final long EVENT_REPORT = 2L;
    private static final long USER_REPORT = 3L;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private ResultActions resolve(Long userId, long reportId, String action) throws Exception {
        return mockMvc.perform(post("/api/reports/{id}/resolution", reportId)
                .header("X-User-Id", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\": \"" + action + "\", \"notes\": \"Checked against guidelines\"}"));
    }

    @Test
    void adminSeesPendingReportsOldestFirstAndCanFilterByType() throws Exception {
        mockMvc.perform(get("/api/reports").header("X-User-Id", ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].targetType").value("POST"))
                .andExpect(jsonPath("$[2].targetType").value("USER"));

        mockMvc.perform(get("/api/reports").param("type", "EVENT").header("X-User-Id", ADMIN))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].reason").value("Event looks like a scam"));
    }

    @Test
    void onlyAdminsCanReviewReports() throws Exception {
        mockMvc.perform(get("/api/reports")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/reports").header("X-User-Id", FAN)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/reports/{id}", POST_REPORT).header("X-User-Id", ARTIST)).andExpect(status().isForbidden());
        resolve(FAN, POST_REPORT, "DISMISS").andExpect(status().isForbidden());
        resolve(ARTIST, POST_REPORT, "REMOVE_CONTENT").andExpect(status().isForbidden());

        assertThat(postRepository.findById(1000L).orElseThrow().isHidden()).isFalse();
    }

    @Test
    void removingAReportedPostHidesItAndNotifiesBothUsers() throws Exception {
        resolve(ADMIN, POST_REPORT, "REMOVE_CONTENT")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.action").value("REMOVE_CONTENT"))
                .andExpect(jsonPath("$.resolvedBy").value(ADMIN))
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty());

        assertThat(postRepository.findById(1000L).orElseThrow().isHidden()).isTrue();
        assertThat(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(FAN)).hasSize(1);
        assertThat(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(REPORTED_ARTIST)).hasSize(1);
    }

    @Test
    void removingAReportedEventTakesItDown() throws Exception {
        resolve(ADMIN, EVENT_REPORT, "REMOVE_CONTENT").andExpect(status().isOk());

        assertThat(eventRepository.findById(1L).orElseThrow().getStatus()).isEqualTo(EventStatus.REMOVED);
    }

    @Test
    void dismissingOnlyNotifiesTheReporter() throws Exception {
        resolve(ADMIN, POST_REPORT, "DISMISS").andExpect(status().isOk());

        assertThat(postRepository.findById(1000L).orElseThrow().isHidden()).isFalse();
        assertThat(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(FAN)).hasSize(1);
        assertThat(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(REPORTED_ARTIST)).isEmpty();
    }

    @Test
    void banningAUserBlocksTheirAccount() throws Exception {
        resolve(ADMIN, USER_REPORT, "BAN_USER").andExpect(status().isOk());

        assertThat(userAccountRepository.findById(REPORTED_ARTIST).orElseThrow().getStatus())
                .isEqualTo(AccountStatus.BANNED);
        // The banned artist can no longer create events
        mockMvc.perform(get("/api/events/mine").header("X-User-Id", REPORTED_ARTIST))
                .andExpect(status().isForbidden());
    }

    @Test
    void aResolvedReportCannotBeResolvedAgain() throws Exception {
        resolve(ADMIN, POST_REPORT, "WARN_USER").andExpect(status().isOk());
        resolve(ADMIN, POST_REPORT, "BAN_USER").andExpect(status().isConflict());

        mockMvc.perform(get("/api/reports").header("X-User-Id", ADMIN))
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void invalidResolutionsAreRejected() throws Exception {
        resolve(ADMIN, USER_REPORT, "REMOVE_CONTENT").andExpect(status().isBadRequest());
        resolve(ADMIN, 999L, "DISMISS").andExpect(status().isNotFound());
        mockMvc.perform(post("/api/reports/{id}/resolution", POST_REPORT).header("X-User-Id", ADMIN)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

}
