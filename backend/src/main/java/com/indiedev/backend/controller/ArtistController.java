/* The api for creating, retrieving, and searching artists */

package com.indiedev.backend.controller;

import com.indiedev.backend.dto.ArtistSearchCriteria;
import com.indiedev.backend.dto.ArtistSearchResult;
import com.indiedev.backend.model.Artist;
import com.indiedev.backend.service.ArtistService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/artists")
public class ArtistController {

    private final ArtistService artistService;

    public ArtistController(ArtistService artistService) {
        this.artistService = artistService;
    }

    @PostMapping
    public Artist saveArtist(@RequestBody Artist artist) {
        return artistService.saveArtist(artist);
    }

    @GetMapping
    public List<Artist> getAllArtists(
            @RequestParam(required = false, defaultValue = "false") boolean includeSuspended) {
        return artistService.getAllArtists(includeSuspended);
    }

    @GetMapping(path = "/{artistId}")
    public Artist getArtistById(@PathVariable Long artistId) {
        return artistService.getArtistById(artistId);
    }

    // Search for Artist (fans only). Add radiusKm for a nearby search around lat/lng,
    // or around the fan's saved home location when lat/lng are left out.
    @GetMapping(path = "/search")
    public List<ArtistSearchResult> searchArtists(
            @RequestHeader(name = CurrentUser.HEADER, required = false) Long fanId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false, defaultValue = "false") boolean includeSuspended) {
        return artistService.searchArtists(fanId,
                new ArtistSearchCriteria(name, genre, location, lat, lng, radiusKm), includeSuspended);
    }
}
