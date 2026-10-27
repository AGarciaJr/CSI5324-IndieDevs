/* The api for creating, retrieving, and searching artists
 */

package com.indiedev.backend.controller;

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
    public Artist saveArtist(@RequestBody Artist artist) { return artistService.saveArtist(artist); }

    @GetMapping
    public List<Artist> getAllArtists(
            @RequestParam(required = false, defaultValue = "false") boolean includeSuspended) {
        return artistService.getAllArtists(includeSuspended);
    }
    @GetMapping(path = "/{artistId}")
    public Artist getArtistById(@PathVariable Long artistId) { return artistService.getArtistById(artistId); }

    @GetMapping(path = "/search")
    public List<Artist> searchArtists(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String location,
            @RequestParam(required = false, defaultValue = "false") boolean includeSuspended) { // <-- NEW
        return artistService.searchArtists(name, genre, location, includeSuspended);
    }

}
