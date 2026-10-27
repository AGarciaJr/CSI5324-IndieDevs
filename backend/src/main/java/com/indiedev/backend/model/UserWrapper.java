/* A simple wrapper class to allow passing multiple users as a single object
 */

package com.indiedev.backend.model;

import java.util.ArrayList;

public class UserWrapper {
    private final ArrayList<User> users;

    public UserWrapper(ArrayList<User> users) { this.users = users;}

    public User getUser(int idx) { return users.get(idx); }

}
