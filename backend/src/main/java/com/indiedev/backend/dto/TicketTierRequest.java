package com.indiedev.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record TicketTierRequest(
        @NotBlank(message = "Ticket tier name is required") String name,
        @NotNull(message = "Ticket price is required")
        @DecimalMin(value = "0.00", message = "Ticket price cannot be negative") BigDecimal price) {
}
