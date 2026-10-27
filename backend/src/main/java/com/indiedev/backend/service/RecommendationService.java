package com.indiedev.backend.service;

import com.indiedev.backend.model.Artist;
import com.indiedev.backend.model.RecommendationDTO;
import com.indiedev.backend.model.UserInteraction;
import com.indiedev.backend.repository.ArtistRepository;
import com.indiedev.backend.repository.UserInteractionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final UserInteractionRepository userInteractionRepository;
    private final ArtistRepository artistRepository;

    public RecommendationService(UserInteractionRepository userInteractionRepository, ArtistRepository artistRepository) {
        this.userInteractionRepository = userInteractionRepository;
        this.artistRepository = artistRepository;
    }

    /**
     * Records a fan interaction with an artist (View, Follow, Like, Comment, Booking).
     */
    public UserInteraction recordInteraction(Long fanId, Long artistId, String interactionType) {
        Artist artist = artistRepository.findById(artistId).orElse(null);
        String genre = artist != null ? artist.getGenre() : "General";

        double weight = switch (interactionType != null ? interactionType.toUpperCase() : "VIEW") {
            case "FOLLOW", "BOOKING" -> 5.0;
            case "LIKE", "COMMENT" -> 3.0;
            default -> 1.0;
        };

        UserInteraction interaction = new UserInteraction();
        interaction.setFanId(fanId);
        interaction.setArtistId(artistId);
        interaction.setInteractionType(interactionType != null ? interactionType.toUpperCase() : "VIEW");
        interaction.setGenre(genre);
        interaction.setWeight(weight);
        interaction.setTimestamp(LocalDateTime.now());

        return userInteractionRepository.save(interaction);
    }

    public List<UserInteraction> getUserInteractions(Long fanId) {
        return userInteractionRepository.findByFanId(fanId);
    }

    @Transactional
    public void clearInteractions(Long fanId) {
        userInteractionRepository.deleteByFanId(fanId);
    }

    /**
     * Use Case: Receive Recommendation (Nicholas Nolen)
     * Main Flow:
     * 1. A fan selects the option to display artists they might like.
     * 2. The system retrieves artists a fan has previously interacted with (views, likes, comments, follows).
     * 3. The system constructs a numerical score for each of the types and genres of content the user interacts with.
     * 4. The system matches content affinity and latent features to recommend similar artists.
     * 5. The system displays the list of recommendations to the user.
     *
     * Extension 1a: New Fan (no interactions) -> The system detects no prior interactions,
     * informs the user, and presents curated starting recommendations.
     */
    public RecommendationDTO getRecommendations(Long fanId) {
        List<UserInteraction> interactions = userInteractionRepository.findByFanId(fanId);
        List<Artist> allArtists = artistRepository.findAll().stream()
                .filter(artist -> !artist.isSuspended())
                .collect(Collectors.toList());

        // Extension 1a: New Fan check
        if (interactions.isEmpty()) {
            List<RecommendationDTO.ArtistRecommendation> coldStartList = allArtists.stream()
                    .limit(6)
                    .map(artist -> new RecommendationDTO.ArtistRecommendation(
                            artist,
                            70.0,
                            Collections.singletonList(artist.getGenre()),
                            "Popular in " + artist.getGenre() + " · Start interacting to customize your recommendations!",
                            "Latent Features: [Genre: " + artist.getGenre() + ", Community Engagement: High]"
                    ))
                    .collect(Collectors.toList());

            return new RecommendationDTO(
                    false,
                    "Welcome! You haven't interacted with any artists yet. Explore artists, listen to music, or follow creators to generate your personalized AI recommendations.",
                    Collections.emptyMap(),
                    coldStartList
            );
        }

        // Step 3: Construct numerical scores for genres/types
        Map<String, Double> genreWeights = new HashMap<>();
        double totalWeight = 0.0;

        for (UserInteraction ui : interactions) {
            String g = ui.getGenre() != null ? ui.getGenre().trim() : "Other";
            double w = ui.getWeight() != null ? ui.getWeight() : 1.0;
            genreWeights.put(g, genreWeights.getOrDefault(g, 0.0) + w);
            totalWeight += w;
        }

        // Normalize affinity scores (percentages)
        Map<String, Double> normalizedAffinity = new LinkedHashMap<>();
        if (totalWeight > 0) {
            for (Map.Entry<String, Double> entry : genreWeights.entrySet()) {
                double pct = Math.round((entry.getValue() / totalWeight) * 1000.0) / 10.0;
                normalizedAffinity.put(entry.getKey(), pct);
            }
        }

        // Artists already followed by the fan
        Set<Long> followedArtistIds = interactions.stream()
                .filter(i -> "FOLLOW".equalsIgnoreCase(i.getInteractionType()))
                .map(UserInteraction::getArtistId)
                .collect(Collectors.toSet());

        // Step 4: Use affinity and latent features to rank artists
        List<RecommendationDTO.ArtistRecommendation> ranked = new ArrayList<>();

        for (Artist artist : allArtists) {
            String artistGenre = artist.getGenre() != null ? artist.getGenre().trim() : "";
            double baseAffinity = genreWeights.getOrDefault(artistGenre, 0.0);

            // Compute tag/keyword matches
            int tagBonus = 0;
            if (artist.getTags() != null) {
                for (String userGenre : genreWeights.keySet()) {
                    if (artist.getTags().toLowerCase().contains(userGenre.toLowerCase())) {
                        tagBonus += 2;
                    }
                }
            }

            // Raw affinity score
            double rawScore = baseAffinity + tagBonus;

            // Normalized match percentage between 50% and 99%
            double matchPct;
            if (totalWeight > 0 && rawScore > 0) {
                double ratio = Math.min(1.0, rawScore / Math.max(1.0, totalWeight * 0.7));
                matchPct = Math.round((60.0 + ratio * 38.0) * 10.0) / 10.0;
            } else {
                matchPct = 52.0; // Baseline discovery
            }

            // Determine matching genres
            List<String> matching = new ArrayList<>();
            if (genreWeights.containsKey(artistGenre)) {
                matching.add(artistGenre);
            }
            if (artist.getTags() != null) {
                for (String userGenre : genreWeights.keySet()) {
                    if (!matching.contains(userGenre) && artist.getTags().toLowerCase().contains(userGenre.toLowerCase())) {
                        matching.add(userGenre);
                    }
                }
            }
            if (matching.isEmpty()) {
                matching.add(artistGenre);
            }

            String reason;
            if (followedArtistIds.contains(artist.getId())) {
                reason = "Based on your continued interest in " + artistGenre + " (You already follow " + artist.getName() + ").";
            } else if (rawScore > 0) {
                reason = "Matched with your interest in " + artistGenre + " (" + String.format("%.0f", normalizedAffinity.getOrDefault(artistGenre, matchPct)) + "% affinity).";
            } else {
                reason = "Fresh discovery based on trending independent community activity in " + artist.getLocation() + ".";
            }

            String latentSummary = "Latent profile: [" + artistGenre + " Affinity: " + String.format("%.2f", matchPct / 100.0)
                    + ", Tag Affinity: " + (tagBonus > 0 ? "High" : "Standard") + "]";

            ranked.add(new RecommendationDTO.ArtistRecommendation(
                    artist,
                    matchPct,
                    matching,
                    reason,
                    latentSummary
            ));
        }

        // Sort by match percentage descending
        ranked.sort((a, b) -> Double.compare(b.getMatchPercentage(), a.getMatchPercentage()));

        return new RecommendationDTO(
                true,
                "Personalized recommendations computed from your " + interactions.size() + " platform interactions.",
                normalizedAffinity,
                ranked
        );
    }
}
