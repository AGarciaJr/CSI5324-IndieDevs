package com.indiedev.backend.model;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum EventStatus {
    DRAFT,
    PENDING_APPROVAL,
    PUBLISHED,
    REMOVED;

    @JsonCreator
    public static EventStatus fromString(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toUpperCase().replace(" ", "_");
        for (EventStatus status : values()) {
            if (status.name().equalsIgnoreCase(normalized)) {
                return status;
            }
        }
        return DRAFT;
    }
}
