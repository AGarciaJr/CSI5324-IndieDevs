package com.indiedev.backend.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationDTO {

    private boolean hasInteractions;
    private String message;
    private Map<String, Double> genreAffinityScores;
    private List<ArtistRecommendation> recommendations;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArtistRecommendation {
        private Artist artist;
        private double matchPercentage;
        private List<String> matchingGenres;
        private String reason;
        private String latentFeatureSummary;
    }
}
