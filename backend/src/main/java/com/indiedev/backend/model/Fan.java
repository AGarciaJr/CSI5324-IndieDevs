package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "fans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Fan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String email;

    private Boolean banned = true;
    private Boolean canLogin = false;
    private Boolean canAppeal = true;

    public Fan(String username, String email) {
        this.username = username;
        this.email = email;
        this.banned = true;
        this.canLogin = false;
        this.canAppeal = true;
    }

    public boolean isBanned() {
        return banned != null && banned;
    }

    public boolean isCanLogin() {
        return canLogin != null && canLogin;
    }

    public boolean isCanAppeal() {
        return canAppeal != null && canAppeal;
    }
}
