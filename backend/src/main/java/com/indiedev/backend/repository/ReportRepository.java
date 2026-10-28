package com.indiedev.backend.repository;

import com.indiedev.backend.model.Report;
import com.indiedev.backend.model.ReportStatus;
import com.indiedev.backend.model.ReportTargetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByReporterIdAndTargetTypeAndTargetIdAndStatus(Long reporterId, ReportTargetType targetType,
                                                               Long targetId, ReportStatus status);
    List<Report> findByReporterIdOrderByCreatedAtDesc(Long reporterId);

    // Oldest first so the queue is worked in the order reports came in
    @Query("""
            select r from Report r
            where r.status = ?1
              and (?2 is null or r.targetType = ?2)
            order by r.createdAt asc, r.id asc
            """)
    List<Report> findQueue(ReportStatus status, ReportTargetType targetType);

}
