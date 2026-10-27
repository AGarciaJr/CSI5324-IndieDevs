/* The api for the Review Report use case (admins only) */

package com.indiedev.backend.controller;

import com.indiedev.backend.dto.ResolveReportRequest;
import com.indiedev.backend.model.Report;
import com.indiedev.backend.model.ReportTargetType;
import com.indiedev.backend.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // The queue of pending reports, optionally filtered by type (POST, EVENT, USER)
    @GetMapping
    public List<Report> getPendingReports(@RequestHeader(name = CurrentUser.HEADER, required = false) Long adminId,
                                          @RequestParam(required = false) ReportTargetType type) {
        return reportService.getPendingReports(adminId, type);
    }

    @GetMapping(path = "/{reportId}")
    public Report getReport(@RequestHeader(name = CurrentUser.HEADER, required = false) Long adminId,
                            @PathVariable Long reportId) {
        return reportService.getReport(adminId, reportId);
    }

    @PostMapping(path = "/{reportId}/resolution")
    public Report resolveReport(@RequestHeader(name = CurrentUser.HEADER, required = false) Long adminId,
                                @PathVariable Long reportId,
                                @Valid @RequestBody ResolveReportRequest request) {
        return reportService.resolveReport(adminId, reportId, request);
    }

}
