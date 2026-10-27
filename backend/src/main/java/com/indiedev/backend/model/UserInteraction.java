package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_interactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long fanId;
    private Long artistId;
    private String interactionType; // "FOLLOW", "LIKE", "VIEW", "COMMENT", "BOOKING"
    private String genre;
    private Double weight;

    private LocalDateTime timestamp;

    @Column(name = "post_id")
    private Long postId;

    @Column(length = 2000)
    private String content;

    @PrePersist
    public void prePersist() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
        if (weight == null) {
            weight = switch (interactionType != null ? interactionType.toUpperCase() : "VIEW") {
                case "FOLLOW", "BOOKING" -> 5.0;
                case "LIKE", "COMMENT" -> 3.0;
                default -> 1.0;
            };
        }
    }
}
