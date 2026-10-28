package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

// An immutable server-captured snapshot scoped to the viewer, retained if the source is removed.
@Entity @Table(name = "report_evidence") @Getter @Setter
public class ReportEvidence {
    @Id private String id;
    @Column(nullable = false) private Long fanId;
    @Enumerated(EnumType.STRING) private ReportTargetType targetType;
    private Long targetId;
    private Long reportedUserId;
    @Column(length = 4500) private String snapshot;
    private LocalDateTime capturedAt = LocalDateTime.now();
}
