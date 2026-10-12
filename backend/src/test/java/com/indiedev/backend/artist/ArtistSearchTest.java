package com.indiedev.backend.artist;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ArtistSearchTest {

    @Autowired
    private ArtistService artistService;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void sampleArtistsAreLoaded() {
        List<Artist> artists = artistService.getAllArtists();

        assertThat(artists).extracting(Artist::getName)
                .containsExactlyInAnyOrder(
                        "Luna Park",
                        "The Riverbeds",
                        "Marisol Vega",
                        "Northside Brass");
    }

    @Test
    void searchByNameFindsAGivenArtist() {
        List<Artist> results = artistService.searchArtists("Luna", null, null);

        assertThat(results).hasSize(1);
        assertThat(results.getFirst().getName()).isEqualTo("Luna Park");
        assertThat(results.getFirst().getGenre()).isEqualTo("Indie Folk");
        assertThat(results.getFirst().getLocation()).isEqualTo("Austin, TX");
    }

    @Test
    void searchByGenreAndLocationNarrowsResults() {
        List<Artist> indieArtists = artistService.searchArtists(null, "Indie", null);
        List<Artist> miamiArtists = artistService.searchArtists(null, null, "Miami");

        assertThat(indieArtists).extracting(Artist::getName)
                .containsExactly("Luna Park", "The Riverbeds");
        assertThat(miamiArtists).extracting(Artist::getName)
                .containsExactly("Marisol Vega");
    }

    @Test
    void searchEndpointReturnsTheMatchingArtist() throws Exception {
        mockMvc.perform(get("/api/artists/search").param("name", "Marisol"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Marisol Vega"))
                .andExpect(jsonPath("$[0].genre").value("Latin Pop"))
                .andExpect(jsonPath("$[0].location").value("Miami, FL"))
                .andExpect(jsonPath("$[1]").doesNotExist());
    }

}
