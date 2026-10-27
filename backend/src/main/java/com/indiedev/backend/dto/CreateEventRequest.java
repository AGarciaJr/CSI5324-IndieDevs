/* The details an artist fills in to create an event.
 * saveAsDraft = true keeps the event private as a draft instead of submitting it for review.
 */

package com.indiedev.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public record CreateEventRequest(
        @NotBlank(message = "Title is required") @Size(max = 120) String title,
        @Size(max = 2000) String description,
        @NotNull(message = "Date and time are required") LocalDateTime startsAt,
        @NotBlank(message = "Location or virtual link is required") String location,
        boolean virtual,
        @NotNull(message = "Capacity is required") @Positive(message = "Capacity must be greater than zero") Integer capacity,
        @NotEmpty(message = "At least one ticket tier is required") List<@Valid TicketTierRequest> ticketTiers,
        boolean saveAsDraft) {
}
