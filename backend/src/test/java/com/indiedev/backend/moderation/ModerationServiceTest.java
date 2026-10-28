package com.indiedev.backend.moderation;

import com.indiedev.backend.model.BanAppeal;
import com.indiedev.backend.model.Fan;
import com.indiedev.backend.repository.BanAppealRepository;
import com.indiedev.backend.repository.FanRepository;
import com.indiedev.backend.service.ModerationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@org.springframework.transaction.annotation.Transactional
class ModerationServiceTest {

    @Autowired
    private ModerationService moderationService;

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

        Fan fan = new Fan("test_fan_user", "testfan@example.com");
        testFan = fanRepository.save(fan);

        BanAppeal appeal = new BanAppeal();
        appeal.setFanId(testFan.getId());
        appeal.setBanningAdminId(1L); // Admin 1 issued the ban
        appeal.setReason("Account was banned by mistake during spam wave.");
        appeal.setReportMaterial("Report #42: Multiple rapid comments.");
        appeal.setAiRecommendation("AI ToS Evaluation: Minor false positive flag. Recommendation: Unban.");
        appeal.setStatus(BanAppeal.AppealStatus.OPEN);

        testAppeal = banAppealRepository.save(appeal);
    }

    @Test
    @DisplayName("Unban Fan: Successfully unbans fan and updates appeal when reviewed by DIFFERENT admin")
    void testUnbanFanSuccess() {
        Long differentAdminId = 2L; // Admin 2 is different from banning Admin 1

        BanAppeal resolvedAppeal = moderationService.unbanFan(testAppeal.getId(), differentAdminId, "Reviewed and verified false positive.");

        assertNotNull(resolvedAppeal);
        assertEquals(BanAppeal.AppealStatus.APPROVED, resolvedAppeal.getStatus());
        assertEquals(differentAdminId, resolvedAppeal.getReviewingAdminId());
        assertNotNull(resolvedAppeal.getReviewedAt());

        Fan updatedFan = moderationService.getFanById(testFan.getId());
        assertFalse(updatedFan.isBanned(), "Fan should no longer be banned.");
        assertTrue(updatedFan.isCanLogin(), "Fan must be granted ability to log in.");
    }

    @Test
    @DisplayName("Unban Fan: Rejects review if attempting to review own ban (Conflict of Interest)")
    void testUnbanFanConflictOfInterest() {
        Long sameAdminId = 1L; // Admin 1 was the banning admin

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                moderationService.unbanFan(testAppeal.getId(), sameAdminId, "Self-review"));

        assertTrue(ex.getMessage().contains("Conflict of interest: A different admin than the banning admin must review the appeal"));
    }

    @Test
    @DisplayName("Unban Fan: Filter open appeals to exclude bans performed by the requesting admin")
    void testGetOpenAppealsForAdmin() {
        // Admin 1 should see 0 appeals (since they issued the ban)
        List<BanAppeal> forAdmin1 = moderationService.getOpenAppealsForAdmin(1L);
        assertTrue(forAdmin1.isEmpty());

        // Admin 2 should see the appeal
        List<BanAppeal> forAdmin2 = moderationService.getOpenAppealsForAdmin(2L);
        assertEquals(1, forAdmin2.size());
        assertEquals(testAppeal.getId(), forAdmin2.get(0).getId());
    }

    @Test
    @DisplayName("Unban Fan - Extension 5a: Marking appeal invalid upholds ban and removes future appeal rights")
    void testMarkAppealInvalid() {
        Long differentAdminId = 2L;

        BanAppeal resolved = moderationService.markAppealInvalid(testAppeal.getId(), differentAdminId, "Appeal lacks merit.");

        assertEquals(BanAppeal.AppealStatus.INVALID, resolved.getStatus());

        Fan updatedFan = moderationService.getFanById(testFan.getId());
        assertTrue(updatedFan.isBanned(), "Fan remains banned.");
        assertFalse(updatedFan.isCanAppeal(), "Fan ability to make further appeals must be revoked (Extension 5a3).");
    }
}
