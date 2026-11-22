package com.indiedev.backend.controller;

import com.indiedev.backend.model.RecommendationDTO;
import com.indiedev.backend.model.UserInteraction;
import com.indiedev.backend.service.RecommendationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final com.indiedev.backend.service.AccessControlService accessControlService;

    public RecommendationController(
            RecommendationService recommendationService,
            com.indiedev.backend.service.AccessControlService accessControlService) {
        this.recommendationService = recommendationService;
        this.accessControlService = accessControlService;
    }

    /**
     * Use Case: Receive Recommendation (Nicholas Nolen)
     * Returns tailored artist recommendations and genre affinity scores for a fan.
     */
    @GetMapping("/fan/{fanId}")
    public RecommendationDTO getRecommendationsForFan(
            @PathVariable Long fanId,
            @RequestHeader(value = "X-User-Id", required = false) Long callerId) {
        Long effectiveFanId = callerId != null ? callerId : fanId;
        if (callerId != null) {
            accessControlService.requireAnyRole(effectiveFanId, com.indiedev.backend.model.Role.FAN, com.indiedev.backend.model.Role.ARTIST, com.indiedev.backend.model.Role.ADMIN);
        }
        return recommendationService.getRecommendations(fanId);
    }

    /**
     * Records a fan interaction with an artist (view, follow, like, comment, booking).
     */
    @PostMapping("/interactions")
    public UserInteraction recordInteraction(
            @RequestParam Long fanId,
            @RequestParam Long artistId,
            @RequestParam(defaultValue = "VIEW") String interactionType,
            @RequestHeader(value = "X-User-Id", required = false) Long callerId) {
        Long effectiveCallerId = callerId != null ? callerId : fanId;
        if (callerId != null) {
            accessControlService.requireAnyRole(effectiveCallerId, com.indiedev.backend.model.Role.FAN, com.indiedev.backend.model.Role.ARTIST);
        }
        return recommendationService.recordInteraction(fanId, artistId, interactionType);
    }

    @GetMapping("/interactions/fan/{fanId}")
    public List<UserInteraction> getFanInteractions(@PathVariable Long fanId) {
        return recommendationService.getUserInteractions(fanId);
    }

    @DeleteMapping("/interactions/fan/{fanId}")
    public void clearInteractions(@PathVariable Long fanId) {
        recommendationService.clearInteractions(fanId);
    }
}
