package com.indiedev.backend.moderation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ModerationServiceTest {

    @Autowired
    private ModerationService moderationService;

    @Autowired
    private BanAppealRepository banAppealRepository;

    @Autowired
    private FanRepository fanRepository;

    private Fan bannedFan;
    private BanAppeal appealByAdmin1;

    @BeforeEach
    void setUp() {
        banAppealRepository.deleteAll();
        fanRepository.deleteAll();

        bannedFan = new Fan();
        bannedFan.setUsername("test_banned_user");
        bannedFan.setEmail("test_fan@example.com");
        bannedFan.setBanned(true);
        bannedFan.setCanLogin(false);
        bannedFan.setCanAppeal(true);
        bannedFan = fanRepository.save(bannedFan);

        BanAppeal appeal = new BanAppeal();
        appeal.setFanId(bannedFan.getId());
        appeal.setBanningAdminId(1L); // Admin 1 issued the ban
        appeal.setReason("I didn't mean to violate ToS, it was my first post.");
        appeal.setReportMaterial("Report #12: Minor spam link in comment section.");
        appeal.setAiRecommendation("Automated AI ToS Recommendation: First offense appeal reviewed against Terms of Service §4.2 (Conduct). Mitigating circumstances detected. Recommended action: Eligible for unban with warning.");
        appeal.setStatus(BanAppeal.AppealStatus.OPEN);
        appealByAdmin1 = banAppealRepository.save(appeal);
    }

    @Test
    @DisplayName("Main Flow 1: Admin reviews open appeals from bans performed by admins other than themselves")
    void testGetOpenAppealsExcludesSelfBans() {
        // When Admin 1 (the banning admin) looks for open appeals, they should NOT see appealByAdmin1
        List<BanAppeal> appealsForAdmin1 = moderationService.getOpenAppealsForAdmin(1L);
        assertTrue(appealsForAdmin1.isEmpty(), "Admin 1 should not see appeals from bans they performed");

        // When Admin 2 (a different admin) requests open appeals, they should see it
        List<BanAppeal> appealsForAdmin2 = moderationService.getOpenAppealsForAdmin(2L);
        assertEquals(1, appealsForAdmin2.size());
        assertEquals(appealByAdmin1.getId(), appealsForAdmin2.get(0).getId());
    }

    @Test
    @DisplayName("Extension 1a: System returns empty list when there are no eligible open appeals")
    void testNoOpenAppeals() {
        List<BanAppeal> appeals = moderationService.getOpenAppealsForAdmin(1L);
        assertNotNull(appeals);
        assertTrue(appeals.isEmpty());
    }

    @Test
    @DisplayName("Main Flow 2-4: Admin reviews reasoning, report material, and automated AI recommendation")
    void testReviewAppealDetails() {
        BanAppeal appeal = moderationService.getAppealById(appealByAdmin1.getId());
        assertNotNull(appeal);
        assertEquals("I didn't mean to violate ToS, it was my first post.", appeal.getReason());
        assertEquals("Report #12: Minor spam link in comment section.", appeal.getReportMaterial());
        assertNotNull(appeal.getAiRecommendation(), "Automated AI recommendation should be present");
        assertTrue(appeal.getAiRecommendation().contains("Automated AI ToS Recommendation"));
    }

    @Test
    @DisplayName("Main Flow 5-7: Admin unbans user, removing ban and granting login access")
    void testUnbanFanSuccess() {
        Long reviewingAdminId = 2L; // Different admin than Admin 1
        String notes = "User acknowledged violation and committed to follow ToS.";

        BanAppeal resolvedAppeal = moderationService.unbanFan(appealByAdmin1.getId(), reviewingAdminId, notes);

        assertEquals(BanAppeal.AppealStatus.APPROVED, resolvedAppeal.getStatus());
        assertEquals(reviewingAdminId, resolvedAppeal.getReviewingAdminId());
        assertNotNull(resolvedAppeal.getReviewedAt());
        assertEquals(notes, resolvedAppeal.getReviewNotes());

        // Verify Fan is unbanned and can login
        Fan updatedFan = moderationService.getFanById(bannedFan.getId());
        assertFalse(updatedFan.isBanned(), "Fan should no longer be banned");
        assertTrue(updatedFan.isCanLogin(), "Fan should now be granted ability to log in");
    }

    @Test
    @DisplayName("Precondition/Postcondition 1: Banning admin cannot review their own ban")
    void testBanningAdminCannotReviewSelfBan() {
        Long reviewingAdminId = 1L; // Same as banningAdminId

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                moderationService.unbanFan(appealByAdmin1.getId(), reviewingAdminId, "Self review")
        );

        assertTrue(exception.getMessage().contains("A different admin than the banning admin must review the appeal"));
    }

    @Test
    @DisplayName("Extension 5a: Admin marks appeal as invalid, logging it as invalid and removing appeal rights")
    void testMarkAppealInvalid() {
        Long reviewingAdminId = 2L;
        String notes = "Blatant repeat ToS violation. Appeal rejected.";

        BanAppeal result = moderationService.markAppealInvalid(appealByAdmin1.getId(), reviewingAdminId, notes);

        // 5a2: Status is INVALID and removed from open appeals
        assertEquals(BanAppeal.AppealStatus.INVALID, result.getStatus());
        List<BanAppeal> openAppeals = moderationService.getOpenAppealsForAdmin(2L);
        assertTrue(openAppeals.isEmpty(), "Appeal should no longer be in open appeals list");

        // 5a3: Fan ability to make further appeals is removed
        Fan updatedFan = moderationService.getFanById(bannedFan.getId());
        assertTrue(updatedFan.isBanned(), "Fan should remain banned");
        assertFalse(updatedFan.isCanLogin(), "Fan should not be able to log in");
        assertFalse(updatedFan.isCanAppeal(), "Fan must not be able to make further appeals");
    }
}
