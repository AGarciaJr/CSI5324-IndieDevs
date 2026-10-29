package com.indiedev.backend.controller;
import com.indiedev.backend.dto.CommunityDtos.*;
import com.indiedev.backend.model.Report;
import com.indiedev.backend.service.FanCommunityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/fan-community")
public class FanCommunityController {
    private final FanCommunityService service;
    public FanCommunityController(FanCommunityService service) { this.service = service; }
    @GetMapping("/following")
    public List<FollowView> following(@RequestHeader(name = CurrentUser.HEADER, required = false) Long id) { return service.following(id); }
    @GetMapping("/artists/{artistId}/follow")
    public FollowView state(@RequestHeader(name = CurrentUser.HEADER, required = false) Long id, @PathVariable Long artistId) { return service.followState(id, artistId); }
    @PutMapping("/artists/{artistId}/follow")
    public FollowView follow(@RequestHeader(name = CurrentUser.HEADER, required = false) Long id, @PathVariable Long artistId) { return service.follow(id, artistId); }
    @DeleteMapping("/artists/{artistId}/follow") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfollow(@RequestHeader(name = CurrentUser.HEADER, required = false) Long id, @PathVariable Long artistId) { service.unfollow(id, artistId); }
    @GetMapping("/profile")
    public ProfileView ownProfile(@RequestHeader(name = CurrentUser.HEADER, required = false) Long id) { return service.ownProfile(id); }
    @PutMapping("/profile")
    public ProfileView update(@RequestHeader(name = CurrentUser.HEADER, required = false) Long id, @Valid @RequestBody ProfileUpdate request) { return service.updateProfile(id, request); }
    @GetMapping("/profiles")
    public List<FanSummary> directory(@RequestHeader(name = CurrentUser.HEADER, required = false) Long id) { return service.fanDirectory(id); }
    @GetMapping("/profiles/{fanId}")
    public ProfileView publicProfile(@RequestHeader(name = CurrentUser.HEADER, required = false) Long id, @PathVariable Long fanId) { return service.publicProfile(id, fanId); }
    @PostMapping("/artists/{artistId}/report-evidence") @ResponseStatus(HttpStatus.CREATED)
    public EvidenceView artistEvidence(@RequestHeader(name = CurrentUser.HEADER, required = false) Long id, @PathVariable Long artistId) {
        return service.artistEvidence(id, artistId);
    }
    @GetMapping("/report-targets")
    public List<TargetView> targets(@RequestHeader(name = CurrentUser.HEADER, required = false) Long id) { return service.reportableTargets(id); }
    @PostMapping("/report-evidence") @ResponseStatus(HttpStatus.CREATED)
    public EvidenceView capture(@RequestHeader(name = CurrentUser.HEADER, required = false) Long id, @Valid @RequestBody EvidenceRequest request) { return service.captureEvidence(id, request); }
    @PostMapping("/reports") @ResponseStatus(HttpStatus.CREATED)
    public Report submit(@RequestHeader(name = CurrentUser.HEADER, required = false) Long id, @Valid @RequestBody SubmitReport request) { return service.submitReport(id, request); }
    @GetMapping("/reports")
    public List<Report> ownReports(@RequestHeader(name = CurrentUser.HEADER, required = false) Long id) { return service.ownReports(id); }
}
