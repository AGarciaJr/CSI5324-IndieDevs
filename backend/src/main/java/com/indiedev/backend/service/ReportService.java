/* Handles the Review Report use case. Only active admin accounts can view the queue or resolve reports.
 * Resolving applies the admin's decision, records who decided and when, and notifies both users.
 */

package com.indiedev.backend.service;

import com.indiedev.backend.dto.ResolveReportRequest;
import com.indiedev.backend.model.*;
import com.indiedev.backend.repository.EventRepository;
import com.indiedev.backend.repository.PostRepository;
import com.indiedev.backend.repository.ReportRepository;
import com.indiedev.backend.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final EventRepository eventRepository;
    private final UserAccountRepository userAccountRepository;
    private final AccessControlService accessControlService;
    private final NotificationService notificationService;

    public ReportService(ReportRepository reportRepository, PostRepository postRepository,
                         EventRepository eventRepository, UserAccountRepository userAccountRepository,
                         AccessControlService accessControlService, NotificationService notificationService) {
        this.reportRepository = reportRepository;
        this.postRepository = postRepository;
        this.eventRepository = eventRepository;
        this.userAccountRepository = userAccountRepository;
        this.accessControlService = accessControlService;
        this.notificationService = notificationService;
    }

    // Pending reports, optionally filtered by what was reported
    public List<Report> getPendingReports(Long adminId, ReportTargetType targetType) {
        accessControlService.requireRole(adminId, Role.ADMIN);
        return reportRepository.findQueue(ReportStatus.PENDING, targetType);
    }

    public Report getReport(Long adminId, Long reportId) {
        accessControlService.requireRole(adminId, Role.ADMIN);
        return findReport(reportId);
    }

    @Transactional
    public Report resolveReport(Long adminId, Long reportId, ResolveReportRequest request) {
        UserAccount admin = accessControlService.requireRole(adminId, Role.ADMIN);
        Report report = findReport(reportId);
        if (report.getStatus() == ReportStatus.RESOLVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This report was already resolved");
        }

        ModerationAction action = request.action();
        applyAction(report, action);

        report.setStatus(ReportStatus.RESOLVED);
        report.setAction(action);
        report.setResolvedBy(admin.getId());
        report.setResolvedAt(LocalDateTime.now());
        report.setResolutionNotes(request.notes());
        Report saved = reportRepository.save(report);

        notificationService.notify(report.getReporterId(),
                "Your report #" + report.getId() + " was reviewed. Outcome: " + describe(action) + ".");
        if (action != ModerationAction.DISMISS) {
            notificationService.notify(report.getReportedUserId(),
                    "A moderator reviewed a report about your " + report.getTargetType().name().toLowerCase()
                            + ". Action taken: " + describe(action) + ".");
        }
        return saved;
    }

    private Report findReport(Long reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
    }

    private void applyAction(Report report, ModerationAction action) {
        switch (action) {
            case DISMISS, WARN_USER -> { }
            case REMOVE_CONTENT -> removeContent(report);
            case SUSPEND_USER -> setAccountStatus(report.getReportedUserId(), AccountStatus.SUSPENDED);
            case BAN_USER -> setAccountStatus(report.getReportedUserId(), AccountStatus.BANNED);
        }
    }

    // Content that is already gone (e.g. deleted by its owner) is skipped and the report is still resolved
    private void removeContent(Report report) {
        switch (report.getTargetType()) {
            case POST -> postRepository.findById(report.getTargetId()).ifPresent(post -> {
                post.setHidden(true);
                postRepository.save(post);
            });
            case EVENT -> eventRepository.findById(report.getTargetId()).ifPresent(event -> {
                event.setStatus(EventStatus.REMOVED);
                eventRepository.save(event);
            });
            case USER -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "User reports have no content to remove; warn, suspend, or ban instead");
        }
    }

    private void setAccountStatus(Long userId, AccountStatus status) {
        UserAccount account = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reported account not found"));
        if (account.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin accounts cannot be suspended or banned here");
        }
        account.setStatus(status);
        userAccountRepository.save(account);
    }

    private String describe(ModerationAction action) {
        return switch (action) {
            case DISMISS -> "no action needed";
            case WARN_USER -> "warning issued";
            case REMOVE_CONTENT -> "content removed";
            case SUSPEND_USER -> "account suspended";
            case BAN_USER -> "account banned";
        };
    }

}
