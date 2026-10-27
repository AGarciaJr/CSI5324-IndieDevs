/* A report filed by a fan or artist against a post, event, or user.
 * When an admin resolves it, the decision, the admin, and the time are kept for auditing.
 */

package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Getter
@Setter
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long reporterId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportTargetType targetType;

    @Column(nullable = false)
    private Long targetId;

    // The account responsible for the reported content (the user itself for USER reports)
    @Column(nullable = false)
    private Long reportedUserId;

    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING;

    private LocalDateTime createdAt;

    // Resolution details, set once by an admin
    @Enumerated(EnumType.STRING)
    private ModerationAction action;
    private Long resolvedBy;
    private LocalDateTime resolvedAt;
    private String resolutionNotes;

    public Report() {
        createdAt = LocalDateTime.now();
    }

}
