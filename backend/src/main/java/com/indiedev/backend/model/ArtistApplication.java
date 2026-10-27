package com.indiedev.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "artist_applications")
@Getter
@Setter
public class ArtistApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fan_id")
    private Long fanId;

    @Column(name = "applicant_name")
    private String applicantName;

    @Column(name = "proposed_genre")
    private String proposedGenre;

    @Column(name = "portfolio_links", length = 1000)
    private String portfolioLinks;

    @Column(name = "status", length = 20)
    private String status = "PENDING";

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @PrePersist
    public void prePersist() {
        if (submittedAt == null) submittedAt = LocalDateTime.now();
    }
}