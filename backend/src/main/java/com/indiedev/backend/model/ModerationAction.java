package com.indiedev.backend.model;

/* The decision an admin makes when resolving a report. */
public enum ModerationAction {
    DISMISS,
    WARN_USER,
    REMOVE_CONTENT,
    SUSPEND_USER,
    BAN_USER
}
