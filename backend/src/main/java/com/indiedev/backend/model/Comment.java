package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    private Long authorId;
    private String authorName;
    private String authorRole; // "Fan", "Artist"

    @Column(length = 2000, nullable = false)
    private String content;

    private LocalDateTime createdAt;

    // Visibility status: "VISIBLE", "HIDDEN"
    private String visibilityStatus = "VISIBLE";
    private boolean hidden = false;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (visibilityStatus == null) {
            visibilityStatus = hidden ? "HIDDEN" : "VISIBLE";
        }
    }
}
