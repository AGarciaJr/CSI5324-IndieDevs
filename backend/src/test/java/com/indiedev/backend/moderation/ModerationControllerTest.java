package com.indiedev.backend.moderation;

import com.indiedev.backend.model.BanAppeal;
import com.indiedev.backend.model.Fan;
import com.indiedev.backend.repository.BanAppealRepository;
import com.indiedev.backend.repository.FanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@org.springframework.transaction.annotation.Transactional
@AutoConfigureMockMvc
class ModerationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FanRepository fanRepository;

    @Autowired
    private BanAppealRepository banAppealRepository;

    private Fan testFan;
    private BanAppeal testAppeal;

    @BeforeEach
    void setUp() {
        banAppealRepository.deleteAll();
        fanRepository.deleteAll();

        Fan fan = new Fan("banned_user_1", "banned1@test.com");
        testFan = fanRepository.save(fan);

        BanAppeal appeal = new BanAppeal();
        appeal.setFanId(testFan.getId());
        appeal.setBanningAdminId(50L);
        appeal.setReason("Accidental duplicate message flagged as bot.");
        appeal.setReportMaterial("Report #33: Multiple comments within seconds.");
        appeal.setAiRecommendation("Automated AI ToS Recommendation: Behavior appears to be lag-induced duplication. Recommendation: Unban.");
        appeal.setStatus(BanAppeal.AppealStatus.OPEN);
        testAppeal = banAppealRepository.save(appeal);
    }

    @Test
    @DisplayName("GET /api/moderation/appeals/open - Filters out bans by the requesting admin")
    void testGetOpenAppealsFilter() throws Exception {
        // Calling as banning admin (50) returns 0 results
        mockMvc.perform(get("/api/moderation/appeals/open").param("adminId", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // Calling as different admin (60) returns 1 result
        mockMvc.perform(get("/api/moderation/appeals/open").param("adminId", "60"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(testAppeal.getId()));
    }

    @Test
    @DisplayName("GET /api/moderation/appeals/{id} - Returns appeal details with reasoning and AI recommendation")
    void testGetAppealDetails() throws Exception {
        mockMvc.perform(get("/api/moderation/appeals/" + testAppeal.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reason").value("Accidental duplicate message flagged as bot."))
                .andExpect(jsonPath("$.aiRecommendation").exists());
    }

    @Test
    @DisplayName("POST /api/moderation/appeals/{id}/unban - Successfully unbans fan when reviewed by different admin")
    void testUnbanFanSuccess() throws Exception {
        mockMvc.perform(post("/api/moderation/appeals/" + testAppeal.getId() + "/unban")
                        .param("adminId", "60")
                        .param("notes", "Restoring account as requested."))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.reviewingAdminId").value(60));

        // Verify Fan is unbanned
        mockMvc.perform(get("/api/moderation/fans/" + testFan.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.banned").value(false))
                .andExpect(jsonPath("$.canLogin").value(true));
    }

    @Test
    @DisplayName("POST /api/moderation/appeals/{id}/unban - Rejects review by same banning admin")
    void testUnbanFanRejectSameAdmin() {
        Exception exception = assertThrows(Exception.class, () ->
                mockMvc.perform(post("/api/moderation/appeals/" + testAppeal.getId() + "/unban")
                        .param("adminId", "50")) // Admin 50 issued the ban
        );

        assertTrue(exception.getCause() instanceof IllegalArgumentException);
        assertTrue(exception.getCause().getMessage().contains("A different admin than the banning admin must review the appeal"));
    }

    @Test
    @DisplayName("POST /api/moderation/appeals/{id}/invalidate - Marks appeal invalid and removes appeal privileges")
    void testInvalidateAppeal() throws Exception {
        mockMvc.perform(post("/api/moderation/appeals/" + testAppeal.getId() + "/invalidate")
                        .param("adminId", "60")
                        .param("notes", "Appeal is frivolous."))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INVALID"));

        // Verify Fan cannot appeal further
        mockMvc.perform(get("/api/moderation/fans/" + testFan.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.banned").value(true))
                .andExpect(jsonPath("$.canLogin").value(false))
                .andExpect(jsonPath("$.canAppeal").value(false));
    }
}
