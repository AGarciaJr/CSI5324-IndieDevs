package com.indiedev.backend.model;

/* Whether an account is in good standing. Only ACTIVE accounts can use role-restricted features. */
public enum AccountStatus {
    ACTIVE,
    SUSPENDED,
    BANNED
}
