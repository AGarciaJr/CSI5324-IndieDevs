package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "artist_follows", uniqueConstraints = @UniqueConstraint(columnNames = {"fan_id", "artist_id"}))
@Getter @Setter
public class ArtistFollow {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "fan_id", nullable = false)
    private Long fanId;
    @Column(name = "artist_id", nullable = false)
    private Long artistId;
    private LocalDateTime createdAt = LocalDateTime.now();
}
