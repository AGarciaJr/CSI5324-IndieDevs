package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long artistId;
    private String eventType;
    private String title;

    @Column(length = 4000)
    private String description;

    private LocalDateTime eventDate;
    private String location;
    private Boolean virtual = false;
    private Integer capacity;
    private String imageUrl;

    @Column(length = 2000)
    private String ticketTiers;

    private String status; // "Draft", "Pending Approval", "Published"

    private Boolean reviewedAcknowledgment = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public boolean isVirtual() {
        return virtual != null && virtual;
    }

    public boolean isReviewedAcknowledgment() {
        return reviewedAcknowledgment != null && reviewedAcknowledgment;
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "Draft";
        }
        if (virtual == null) {
            virtual = false;
        }
        if (reviewedAcknowledgment == null) {
            reviewedAcknowledgment = false;
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
