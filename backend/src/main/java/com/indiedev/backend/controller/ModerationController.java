package com.indiedev.backend.controller;

import com.indiedev.backend.model.BanAppeal;
import com.indiedev.backend.model.Fan;
import com.indiedev.backend.model.Artist;
import com.indiedev.backend.service.ModerationService;
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
     * Use Case: Unban Fan - Main flow step 1.
     * Retrieves open appeals. If adminId is provided, filters out appeals from bans
     * performed by this admin to prevent conflict of interest.
     */
    @GetMapping("/appeals/open")
    public List<BanAppeal> getOpenAppeals(@RequestParam(required = false) Long adminId) {
        return moderationService.getOpenAppealsForAdmin(adminId);
    }

    /**
     * Main flow steps 2, 3, 4.
     * Retrieves details for a specific appeal (reasoning, report material, AI recommendation).
     */
    @GetMapping("/appeals/{id}")
    public BanAppeal getAppealById(@PathVariable Long id) {
        return moderationService.getAppealById(id);
    }

    /**
     * Main flow steps 5, 6, 7.
     * Unbans the fan and marks the appeal approved.
     */
    @PostMapping("/appeals/{id}/unban")
    public BanAppeal unbanFan(
            @PathVariable Long id,
            @RequestParam Long adminId,
            @RequestParam(required = false) String notes) {
        return moderationService.unbanFan(id, adminId, notes);
    }

    /**
     * Extension 5a.
     * Marks the appeal as invalid and removes user's ability to submit further appeals.
     */
    @PostMapping("/appeals/{id}/invalidate")
    public BanAppeal markAppealInvalid(
            @PathVariable Long id,
            @RequestParam Long adminId,
            @RequestParam(required = false) String notes) {
        return moderationService.markAppealInvalid(id, adminId, notes);
    }

    /**
     * Use Case: Admin - Suspend artist account
     * Toggles the isSuspended flag to true for a given artist ID.
     */
    @PutMapping("/artists/{artistId}/suspend")
    public Artist suspendArtist(@PathVariable Long artistId) {
        return moderationService.suspendArtist(artistId);
    }
}
