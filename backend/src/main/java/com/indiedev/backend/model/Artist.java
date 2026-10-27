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

    // Coordinates of the artist's home base, used for nearby searches
    private Double latitude;
    private Double longitude;

    public Artist() {
    }

}
