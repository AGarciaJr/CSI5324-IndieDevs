package com.indiedev.backend.dto;

import com.indiedev.backend.model.ModerationAction;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResolveReportRequest(
        @NotNull(message = "A moderation action is required") ModerationAction action,
        @Size(max = 1000) String notes) {
}
