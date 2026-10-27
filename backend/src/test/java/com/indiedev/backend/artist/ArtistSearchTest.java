package com.indiedev.backend.artist;

import com.indiedev.backend.dto.ArtistSearchCriteria;
import com.indiedev.backend.dto.ArtistSearchResult;
import com.indiedev.backend.model.Artist;
import com.indiedev.backend.service.ArtistService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ArtistSearchTest {

    // Seeded accounts (see data.sql)
    private static final long FAN_IN_WACO = 1L;
    private static final long ARTIST = 2L;
    private static final long ADMIN = 3L;
    private static final long FAN_WITHOUT_LOCATION = 5L;

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
                        "Northside Brass",
                        "Brazos Static",
                        "Cottonland Strings");
    }

    @Test
    void searchByNameFindsAGivenArtist() {
        List<ArtistSearchResult> results = artistService.searchArtists(FAN_IN_WACO,
                ArtistSearchCriteria.byText("Luna", null, null));

        assertThat(results).hasSize(1);
        assertThat(results.getFirst().name()).isEqualTo("Luna Park");
        assertThat(results.getFirst().genre()).isEqualTo("Indie Folk");
        assertThat(results.getFirst().location()).isEqualTo("Austin, TX");
        assertThat(results.getFirst().distanceKm()).isNull();
    }

    @Test
    void searchByGenreAndLocationNarrowsResults() {
        List<ArtistSearchResult> indieArtists = artistService.searchArtists(FAN_IN_WACO,
                ArtistSearchCriteria.byText(null, "Indie", null));
        List<ArtistSearchResult> miamiArtists = artistService.searchArtists(FAN_IN_WACO,
                ArtistSearchCriteria.byText(null, null, "Miami"));

        assertThat(indieArtists).extracting(ArtistSearchResult::name)
                .containsExactly("Luna Park", "The Riverbeds");
        assertThat(miamiArtists).extracting(ArtistSearchResult::name)
                .containsExactly("Marisol Vega");
    }

    @Test
    void searchWithNoCriteriaIsRejected() {
        assertThatThrownBy(() -> artistService.searchArtists(FAN_IN_WACO,
                ArtistSearchCriteria.byText(" ", null, "")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("at least one search criterion");
    }

    @Test
    void nearbySearchUsesTheFansSavedLocationAndSortsByDistance() {
        // Waco -> Brazos Static (0 km), Cottonland Strings in Temple (~55 km), Luna Park in Austin (~150 km)
        List<ArtistSearchResult> within100 = artistService.searchArtists(FAN_IN_WACO,
                ArtistSearchCriteria.nearby(null, null, 100.0));
        List<ArtistSearchResult> within200 = artistService.searchArtists(FAN_IN_WACO,
                ArtistSearchCriteria.nearby(null, null, 200.0));

        assertThat(within100).extracting(ArtistSearchResult::name)
                .containsExactly("Brazos Static", "Cottonland Strings");
        assertThat(within200).extracting(ArtistSearchResult::name)
                .containsExactly("Brazos Static", "Cottonland Strings", "Luna Park");
        assertThat(within200.get(2).distanceKm()).isBetween(140.0, 160.0);
    }

    @Test
    void nearbySearchAroundSharedCoordinatesCanBeCombinedWithFilters() {
        // Fan shares a location in downtown Austin and only wants folk artists
        List<ArtistSearchResult> results = artistService.searchArtists(FAN_WITHOUT_LOCATION,
                new ArtistSearchCriteria(null, "folk", null, 30.27, -97.74, 25.0));

        assertThat(results).extracting(ArtistSearchResult::name).containsExactly("Luna Park");
        assertThat(results.getFirst().distanceKm()).isLessThan(1.0);
    }

    @Test
    void nearbySearchNeedsALocation() {
        assertThatThrownBy(() -> artistService.searchArtists(FAN_WITHOUT_LOCATION,
                ArtistSearchCriteria.nearby(null, null, 50.0)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("location");
    }

    @Test
    void nearbySearchRejectsAnInvalidRadius() {
        assertThatThrownBy(() -> artistService.searchArtists(FAN_IN_WACO,
                ArtistSearchCriteria.nearby(null, null, 0.0)))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> artistService.searchArtists(FAN_IN_WACO,
                ArtistSearchCriteria.nearby(null, null, 5000.0)))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void searchEndpointReturnsTheMatchingArtist() throws Exception {
        mockMvc.perform(get("/api/artists/search").param("name", "Marisol")
                        .header("X-User-Id", FAN_IN_WACO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Marisol Vega"))
                .andExpect(jsonPath("$[0].genre").value("Latin Pop"))
                .andExpect(jsonPath("$[0].location").value("Miami, FL"))
                .andExpect(jsonPath("$[1]").doesNotExist());
    }

    @Test
    void searchEndpointSupportsNearbySearch() throws Exception {
        mockMvc.perform(get("/api/artists/search").param("radiusKm", "25")
                        .header("X-User-Id", FAN_IN_WACO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Brazos Static"))
                .andExpect(jsonPath("$[0].distanceKm").value(0.0))
                .andExpect(jsonPath("$[1]").doesNotExist());
    }

    @Test
    void onlyFansCanSearch() throws Exception {
        mockMvc.perform(get("/api/artists/search").param("name", "Luna"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/artists/search").param("name", "Luna").header("X-User-Id", ARTIST))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/artists/search").param("name", "Luna").header("X-User-Id", ADMIN))
                .andExpect(status().isForbidden());
    }

}
