package com.indiedev.backend.controller;

/* Until login is built, clients identify the acting account with this request header.
 * Role checks happen in AccessControlService using this id.
 */
public final class CurrentUser {

    public static final String HEADER = "X-User-Id";

    private CurrentUser() {
    }

}
