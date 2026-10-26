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

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    /**
     * Use Case: Receive Recommendation (Nicholas Nolen)
     * Returns tailored artist recommendations and genre affinity scores for a fan.
     */
    @GetMapping("/fan/{fanId}")
    public RecommendationDTO getRecommendationsForFan(@PathVariable Long fanId) {
        return recommendationService.getRecommendations(fanId);
    }

    /**
     * Records a fan interaction with an artist (view, follow, like, comment, booking).
     */
    @PostMapping("/interactions")
    public UserInteraction recordInteraction(
            @RequestParam Long fanId,
            @RequestParam Long artistId,
            @RequestParam(defaultValue = "VIEW") String interactionType) {
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
