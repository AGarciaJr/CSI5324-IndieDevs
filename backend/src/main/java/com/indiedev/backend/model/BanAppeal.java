package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "ban_appeals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BanAppeal {

    public enum AppealStatus {
        OPEN,
        APPROVED,
        INVALID
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long fanId;
    private String fanUsername;
    private Long banningAdminId;
    private String banningAdminName;
    private Long reviewingAdminId;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String offendingContent;

    @Column(columnDefinition = "TEXT")
    private String reportMaterial;

    @Column(columnDefinition = "TEXT")
    private String aiRecommendation;

    @Enumerated(EnumType.STRING)
    private AppealStatus status = AppealStatus.OPEN;

    @Column(columnDefinition = "TEXT")
    private String reviewNotes;

    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = AppealStatus.OPEN;
        }
    }
}
