/* The api for the Create Event use case (artists only) */

package com.indiedev.backend.controller;

import com.indiedev.backend.dto.CreateEventRequest;
import com.indiedev.backend.model.Event;
import com.indiedev.backend.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Event createEvent(@RequestHeader(name = CurrentUser.HEADER, required = false) Long userId,
                             @Valid @RequestBody CreateEventRequest request) {
        return eventService.createEvent(userId, request);
    }

    // The signed-in artist's own events, including drafts
    @GetMapping(path = "/mine")
    public List<Event> getMyEvents(@RequestHeader(name = CurrentUser.HEADER, required = false) Long userId) {
        return eventService.getEventsForArtist(userId);
    }

}
