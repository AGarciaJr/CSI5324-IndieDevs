package com.indiedev.backend.moderation;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/moderation")
public class ModerationController {

    private final ModerationService moderationService;

    public ModerationController(ModerationService moderationService) {
        this.moderationService = moderationService;
    }

    @GetMapping("/fans")
    public List<Fan> getAllFans() {
        return moderationService.getAllFans();
    }

    @GetMapping("/fans/{id}")
    public Fan getFanById(@PathVariable Long id) {
        return moderationService.getFanById(id);
    }

    @GetMapping("/appeals")
    public List<BanAppeal> getAllAppeals() {
        return moderationService.getAllAppeals();
    }

    /**
     * Retrieves open appeals. If adminId is provided, filters out appeals from bans
     * performed by this admin.
     * Main flow step 1.
     */
    @GetMapping("/appeals/open")
    public List<BanAppeal> getOpenAppeals(@RequestParam(required = false) Long adminId) {
        return moderationService.getOpenAppealsForAdmin(adminId);
    }

    /**
     * Retrieves details for a specific appeal (reasoning, report material, AI recommendation).
     * Main flow steps 2, 3, 4.
     */
    @GetMapping("/appeals/{id}")
    public BanAppeal getAppealById(@PathVariable Long id) {
        return moderationService.getAppealById(id);
    }

    /**
     * Unbans the fan and marks the appeal approved (updates appeal and fan status).
     * Main flow steps 5, 6, 7.
     */
    @PostMapping("/appeals/{id}/unban")
    public BanAppeal unbanFan(
            @PathVariable Long id,
            @RequestParam Long adminId,
            @RequestParam(required = false) String notes) {
        return moderationService.unbanFan(id, adminId, notes);
    }

    /**
     * Marks the appeal as invalid and removes user's ability to submit further appeals.
     * Extension 5a.
     */
    @PostMapping("/appeals/{id}/invalidate")
    public BanAppeal markAppealInvalid(
            @PathVariable Long id,
            @RequestParam Long adminId,
            @RequestParam(required = false) String notes) {
        return moderationService.markAppealInvalid(id, adminId, notes);
    }
}
