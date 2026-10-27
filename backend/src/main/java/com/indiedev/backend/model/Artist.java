package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "artists")
@Getter
@Setter
public class Artist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String genre;
    private String location;
    private String profileThumbnail;

    @Column(length = 2000)
    private String bio;

    private String tags;

    @Column(name = "is_suspended")
    private boolean isSuspended = false;

    public Artist() {
    }

    public Artist(String name, String genre, String location, String profileThumbnail, String bio, String tags, Boolean isSuspended) {
        this.name = name;
        this.genre = genre;
        this.location = location;
        this.profileThumbnail = profileThumbnail;
        this.bio = bio;
        this.tags = tags;
        this.isSuspended = isSuspended;
    }
}
