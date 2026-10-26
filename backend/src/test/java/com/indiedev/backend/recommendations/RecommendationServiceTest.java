package com.indiedev.backend.recommendations;

import com.indiedev.backend.model.Artist;
import com.indiedev.backend.model.RecommendationDTO;
import com.indiedev.backend.model.UserInteraction;
import com.indiedev.backend.repository.ArtistRepository;
import com.indiedev.backend.repository.UserInteractionRepository;
import com.indiedev.backend.service.RecommendationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class RecommendationServiceTest {

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private UserInteractionRepository userInteractionRepository;

    @Autowired
    private ArtistRepository artistRepository;

    private Long activeFanId = 100L;
    private Long newFanId = 200L;
    private Artist indieArtist;
    private Artist jazzArtist;

    @BeforeEach
    void setUp() {
        userInteractionRepository.deleteAll();

        indieArtist = artistRepository.findAll().stream()
                .filter(a -> "Indie Folk".equalsIgnoreCase(a.getGenre()))
                .findFirst()
                .orElseGet(() -> artistRepository.save(new Artist("Luna Park", "Indie Folk", "Austin, TX", "thumb1.jpg", "Acoustic songs", "Folk, Acoustic, Indie")));

        jazzArtist = artistRepository.findAll().stream()
                .filter(a -> "Jazz".equalsIgnoreCase(a.getGenre()))
                .findFirst()
                .orElseGet(() -> artistRepository.save(new Artist("Miles Bennett", "Jazz", "Chicago, IL", "thumb2.jpg", "Smooth horns", "Jazz, Brass, Instrumental")));
    }

    @Test
    @DisplayName("Receive Recommendation - Extension 1a: New Fan with no interactions receives cold-start message")
    void testNewFanColdStart() {
        RecommendationDTO result = recommendationService.getRecommendations(newFanId);

        assertNotNull(result);
        assertFalse(result.isHasInteractions(), "New fan must have hasInteractions = false");
        assertTrue(result.getMessage().contains("haven't interacted with any artists yet"));
        assertFalse(result.getRecommendations().isEmpty(), "Cold start should offer starter discovery artists");
    }

    @Test
    @DisplayName("Receive Recommendation: Active Fan receives personalized numerical scores and ranked recommendations")
    void testActiveFanPersonalizedRecommendations() {
        // Record interactions for activeFan: 1 Follow on Indie (weight 5), 1 Like on Indie (weight 3), 1 View on Jazz (weight 1)
        recommendationService.recordInteraction(activeFanId, indieArtist.getId(), "FOLLOW");
        recommendationService.recordInteraction(activeFanId, indieArtist.getId(), "LIKE");
        recommendationService.recordInteraction(activeFanId, jazzArtist.getId(), "VIEW");

        RecommendationDTO result = recommendationService.getRecommendations(activeFanId);

        assertNotNull(result);
        assertTrue(result.isHasInteractions(), "Active fan should have hasInteractions = true");
        assertNotNull(result.getGenreAffinityScores());
        assertTrue(result.getGenreAffinityScores().containsKey("Indie Folk"));
        assertTrue(result.getGenreAffinityScores().get("Indie Folk") > result.getGenreAffinityScores().get("Jazz"));

        // Verify top recommendation is the Indie artist with highest match
        assertFalse(result.getRecommendations().isEmpty());
        RecommendationDTO.ArtistRecommendation top = result.getRecommendations().get(0);
        assertEquals("Luna Park", top.getArtist().getName());
        assertTrue(top.getMatchPercentage() > 80.0);
        assertNotNull(top.getReason());
    }

    @Test
    @DisplayName("Record Interaction: Correctly increments user interaction records")
    void testRecordInteraction() {
        UserInteraction ui = recommendationService.recordInteraction(activeFanId, indieArtist.getId(), "BOOKING");
        assertNotNull(ui.getId());
        assertEquals("BOOKING", ui.getInteractionType());
        assertEquals(5.0, ui.getWeight());
        assertEquals("Indie Folk", ui.getGenre());
    }
}
