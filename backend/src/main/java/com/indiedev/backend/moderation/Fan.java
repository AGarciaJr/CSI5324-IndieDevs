package com.indiedev.backend.moderation;

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
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String username;
    private String email;

    private boolean banned;
    private boolean canLogin;
    private boolean canAppeal;

    public Fan(String username, String email) {
        this.username = username;
        this.email = email;
        this.banned = true;
        this.canLogin = false;
        this.canAppeal = true;
    }
}
