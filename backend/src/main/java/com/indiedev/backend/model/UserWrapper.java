/* A simple wrapper class to allow passing multiple users as a single object
 */

package com.indiedev.backend.model;

import java.util.ArrayList;

public class UserWrapper {
    private final ArrayList<Artist> users;

    public UserWrapper(ArrayList<Artist> users) { this.users = users;}

    public Artist getUser(int idx) { return users.get(idx); }

}
