package com.indiedev.backend.artist;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "artists")
@Getter
@Setter
public class Artist {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;
    private String genre;
    private String location;
    private String profileThumbnail;

    public Artist() {
    }

}
