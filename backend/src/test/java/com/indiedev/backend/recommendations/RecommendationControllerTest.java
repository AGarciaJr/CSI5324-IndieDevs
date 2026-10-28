package com.indiedev.backend.recommendations;

import com.indiedev.backend.model.Artist;
import com.indiedev.backend.repository.ArtistRepository;
import com.indiedev.backend.repository.UserInteractionRepository;
import com.indiedev.backend.service.RecommendationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@org.springframework.transaction.annotation.Transactional
@AutoConfigureMockMvc
class RecommendationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserInteractionRepository userInteractionRepository;

    @Autowired
    private ArtistRepository artistRepository;

    @Autowired
    private RecommendationService recommendationService;

    private Artist artist;

    @BeforeEach
    void setUp() {
        userInteractionRepository.deleteAll();

        artist = artistRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> artistRepository.save(new Artist("Luna Park", "Indie Folk", "Austin, TX", "thumb.jpg", "Acoustic indie", "Folk, Acoustic")));
    }

    @Test
    @DisplayName("GET /api/recommendations/fan/{fanId} - Returns cold start for new fan")
    void testGetColdStartRecommendations() throws Exception {
        mockMvc.perform(get("/api/recommendations/fan/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasInteractions").value(false))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("POST /api/recommendations/interactions - Records fan interaction and reflects in recommendations")
    void testRecordInteractionEndpoint() throws Exception {
        mockMvc.perform(post("/api/recommendations/interactions")
                        .param("fanId", "888")
                        .param("artistId", artist.getId().toString())
                        .param("interactionType", "FOLLOW"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.interactionType").value("FOLLOW"))
                .andExpect(jsonPath("$.weight").value(5.0));

        // Now fan 888 has interactions
        mockMvc.perform(get("/api/recommendations/fan/888"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasInteractions").value(true))
                .andExpect(jsonPath("$.recommendations[0].artist.name").exists());
    }
}
