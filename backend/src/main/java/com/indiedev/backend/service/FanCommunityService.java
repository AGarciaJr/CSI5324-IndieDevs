package com.indiedev.backend.service;

import com.indiedev.backend.dto.CommunityDtos.*;
import com.indiedev.backend.model.*;
import com.indiedev.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import javax.imageio.ImageIO;
import javax.imageio.stream.MemoryCacheImageInputStream;
import java.io.ByteArrayInputStream;
import java.util.*;
import java.util.regex.Pattern;

@Service
@Transactional
public class FanCommunityService {
    private final AccessControlService access;
    private final UserAccountRepository accounts;
    private final ArtistRepository artists;
    private final ArtistFollowRepository follows;
    private final FanProfileRepository profiles;
    private final ReportRepository reports;
    private final ReportEvidenceRepository evidence;
    private final PostRepository posts;
    private final EventRepository events;
    private final UserInteractionRepository interactions;
    private static final Pattern PROHIBITED = Pattern.compile("(?is)<[^>]+>|javascript\\s*:|\\b(?:kill yourself|i will kill you)\\b");

    public FanCommunityService(AccessControlService access, UserAccountRepository accounts,
            ArtistRepository artists, ArtistFollowRepository follows, FanProfileRepository profiles,
            ReportRepository reports, ReportEvidenceRepository evidence, PostRepository posts,
            EventRepository events, UserInteractionRepository interactions) {
        this.access = access; this.accounts = accounts; this.artists = artists; this.follows = follows;
        this.profiles = profiles; this.reports = reports; this.evidence = evidence;
        this.posts = posts; this.events = events; this.interactions = interactions;
    }
    private static ResponseStatusException fail(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }
    private UserAccount fan(Long id) { return access.requireRole(id, Role.FAN); }
    private UserAccount lockedFan(Long id) {
        fan(id);
        accounts.lockById(id).orElseThrow(() -> fail(HttpStatus.UNAUTHORIZED, "Unknown account"));
        return fan(id);
    }
    private Artist artist(Long id) {
        return artists.findById(id).orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Artist not found"));
    }
    private boolean available(Artist artist) {
        return !artist.isSuspended() && accounts.findByArtistId(artist.getId()).stream().allMatch(UserAccount::isActive);
    }
    private FollowView view(Long fanId, Artist artist) {
        return new FollowView(artist.getId(), artist.getName(), artist.getGenre(), artist.getLocation(),
                artist.getProfileThumbnail(), available(artist), follows.countByArtistId(artist.getId()),
                follows.existsByFanIdAndArtistId(fanId, artist.getId()));
    }
    public FollowView followState(Long fanId, Long artistId) {
        fan(fanId); return view(fanId, artist(artistId));
    }
    public List<FollowView> following(Long fanId) { fan(fanId); return followList(fanId); }
    private List<FollowView> followList(Long fanId) {
        return follows.findByFanIdOrderByCreatedAtDesc(fanId).stream()
                .map(f -> artists.findById(f.getArtistId()).map(a -> view(fanId, a)).orElse(null))
                .filter(Objects::nonNull).toList();
    }
    public FollowView follow(Long fanId, Long artistId) {
        // Serializes same-account mutations. The unique constraint also protects the relationship.
        lockedFan(fanId);
        Artist artist = artist(artistId);
        if (!available(artist)) throw fail(HttpStatus.CONFLICT, "This artist is unavailable and cannot be followed");
        if (!follows.existsByFanIdAndArtistId(fanId, artistId)) {
            ArtistFollow follow = new ArtistFollow(); follow.setFanId(fanId); follow.setArtistId(artistId);
            follows.saveAndFlush(follow);
            if (!interactions.existsByFanIdAndArtistIdAndInteractionType(fanId, artistId, "FOLLOW")) {
                UserInteraction interaction = new UserInteraction();
                interaction.setFanId(fanId); interaction.setArtistId(artistId);
                interaction.setInteractionType("FOLLOW"); interaction.setGenre(artist.getGenre());
                interactions.save(interaction);
            }
        }
        return view(fanId, artist);
    }
    public void unfollow(Long fanId, Long artistId) {
        lockedFan(fanId); follows.deleteByFanIdAndArtistId(fanId, artistId);
        interactions.deleteAll(interactions.findByFanIdAndArtistId(fanId, artistId).stream()
                .filter(i -> "FOLLOW".equals(i.getInteractionType())).toList());
    }
    private FanProfile profile(UserAccount account) {
        return profiles.findById(account.getId()).orElseGet(() -> {
            FanProfile p = new FanProfile(); p.setUserId(account.getId());
            p.setDisplayName(account.getDisplayName()); return p;
        });
    }
    private ProfileView profileView(FanProfile p, boolean owner) {
        return new ProfileView(p.getUserId(), owner ? (p.getVersion() == null ? 0L : p.getVersion()) : null, p.getDisplayName(), p.getBiography(),
                owner || p.isShowInterests() ? p.getInterests() : null, p.getImage(), p.isPublicProfile(),
                p.isShowInterests(), p.isShowFollowing(), owner ? followList(p.getUserId())
                        : p.isShowFollowing() ? followList(p.getUserId()).stream().filter(FollowView::available).toList() : null);
    }
    public ProfileView ownProfile(Long id) { return profileView(profile(fan(id)), true); }
    public List<FanSummary> fanDirectory(Long id) {
        fan(id);
        return accounts.findAll().stream().filter(a -> a.getRole() == Role.FAN && a.isActive())
                .filter(a -> a.getId().equals(id) || profile(a).isPublicProfile())
                .map(a -> new FanSummary(a.getId(), profile(a).getDisplayName())).toList();
    }
    public ProfileView publicProfile(Long viewerId, Long fanId) {
        if (viewerId == null) throw fail(HttpStatus.UNAUTHORIZED, "Sign in to view profiles");
        UserAccount viewer = accounts.findById(viewerId).filter(UserAccount::isActive)
                .orElseThrow(() -> fail(HttpStatus.UNAUTHORIZED, "Sign in with an active account"));
        UserAccount target = accounts.findById(fanId).filter(a -> a.isActive() && a.getRole() == Role.FAN)
                .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Fan profile not found"));
        FanProfile p = profile(target); boolean owner = viewer.getId().equals(fanId);
        if (!owner && !p.isPublicProfile()) throw fail(HttpStatus.NOT_FOUND, "This profile is private or unavailable");
        return profileView(p, owner);
    }
    public ProfileView updateProfile(Long id, ProfileUpdate request) {
        UserAccount account = lockedFan(id); FanProfile p = profile(account);
        if (!Objects.equals(p.getVersion() == null ? 0L : p.getVersion(), request.version()))
            throw fail(HttpStatus.CONFLICT, "Your profile changed in another session. Reload before saving again");
        checkContent("Display name", request.displayName()); checkContent("Biography", request.biography());
        checkContent("Artistic interests", request.interests()); validateImage(request.image());
        // Mutate only after all validation passes; rollback preserves the previous values on storage failure.
        p.setDisplayName(request.displayName().trim()); p.setBiography(request.biography().trim());
        p.setInterests(request.interests().trim()); p.setImage(request.image());
        p.setPublicProfile(request.publicProfile()); p.setShowInterests(request.showInterests()); p.setShowFollowing(request.showFollowing());
        account.setDisplayName(p.getDisplayName()); accounts.save(account);
        return profileView(profiles.saveAndFlush(p), true);
    }
    private void checkContent(String field, String text) {
        if (PROHIBITED.matcher(text).find()) throw fail(HttpStatus.BAD_REQUEST,
                field + " violates profile content rules: no markup, script links, or threats");
    }
    private void validateImage(String image) {
        if (image.isEmpty()) return;
        if (!(image.startsWith("data:image/png;base64,") || image.startsWith("data:image/jpeg;base64,")))
            throw fail(HttpStatus.BAD_REQUEST, "Profile image must be a PNG or JPEG upload");
        try {
            byte[] bytes = Base64.getDecoder().decode(image.substring(image.indexOf(',') + 1));
            if (bytes.length > 512000) throw new IllegalArgumentException();
            try (var input = new MemoryCacheImageInputStream(new ByteArrayInputStream(bytes))) {
                var readers = ImageIO.getImageReaders(input);
                if (!readers.hasNext()) throw new IllegalArgumentException();
                var reader = readers.next();
                try {
                    reader.setInput(input); String format = reader.getFormatName();
                    if (!(format.equalsIgnoreCase("png") || format.equalsIgnoreCase("jpeg")) ||
                            reader.getWidth(0) > 4096 || reader.getHeight(0) > 4096) throw new IllegalArgumentException();
                } finally { reader.dispose(); }
            }
        } catch (Exception e) { throw fail(HttpStatus.BAD_REQUEST,
                "Profile image must be a valid PNG/JPEG, up to 500 KB and 4096 pixels per side"); }
    }
    private UserAccount artistOwner(Long id) {
        return accounts.findByArtistId(id).stream().filter(a -> a.getRole() == Role.ARTIST).findFirst()
                .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "The artist account is no longer available"));
    }
    private record Target(Long ownerId, String snapshot) {}
    // Owner and accessibility are resolved from records, never supplied by the caller.
    private Target target(Long fanId, ReportTargetType type, Long id) {
        return switch (type) {
            case USER -> {
                UserAccount user = accounts.findById(id).filter(UserAccount::isActive)
                        .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Account is unavailable"));
                if (user.getRole() == Role.ADMIN || user.getId().equals(fanId))
                    throw fail(HttpStatus.BAD_REQUEST, "Choose another fan or artist account to report");
                if (user.getRole() == Role.ARTIST && (user.getArtistId() == null || !available(artist(user.getArtistId()))))
                    throw fail(HttpStatus.NOT_FOUND, "Artist is unavailable");
                if (user.getRole() == Role.FAN && !profile(user).isPublicProfile())
                    throw fail(HttpStatus.NOT_FOUND, "Account is private or unavailable");
                yield new Target(user.getId(), user.getDisplayName() + " (@" + user.getUsername() + ")");
            }
            case POST -> {
                Post post = posts.findById(id).filter(p -> p.isPublic() && !p.isHidden())
                        .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Post is no longer publicly available"));
                UserAccount owner = accounts.findById(post.getPosterId()).filter(UserAccount::isActive)
                        .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Post author is unavailable"));
                if (owner.getArtistId() != null && !available(artist(owner.getArtistId())))
                    throw fail(HttpStatus.NOT_FOUND, "Post author is unavailable");
                yield new Target(owner.getId(), "Post #" + id + " by " + owner.getDisplayName() + ": " + post.getPostText());
            }
            case EVENT -> {
                Event event = events.findById(id).filter(e -> e.getStatus() == EventStatus.PUBLISHED)
                        .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Event is no longer publicly available"));
                Artist artist = artist(event.getArtistId());
                if (!available(artist)) throw fail(HttpStatus.NOT_FOUND, "Artist is unavailable");
                yield new Target(artistOwner(artist.getId()).getId(), "Event #" + id + ": " + event.getTitle() + " — " + event.getDescription());
            }
        };
    }
    public List<TargetView> reportableTargets(Long id) {
        fan(id); List<TargetView> result = new ArrayList<>();
        for (UserAccount a : accounts.findAll()) addTarget(result, id, ReportTargetType.USER, a.getId());
        for (Post p : posts.findAll()) addTarget(result, id, ReportTargetType.POST, p.getId());
        for (Event e : events.findAll()) addTarget(result, id, ReportTargetType.EVENT, e.getId());
        return result;
    }
    private void addTarget(List<TargetView> list, Long fanId, ReportTargetType type, Long id) {
        try { list.add(new TargetView(type, id, target(fanId, type, id).snapshot())); }
        catch (ResponseStatusException unavailable) { /* Inaccessible records are never exposed. */ }
    }
    public EvidenceView artistEvidence(Long id, Long artistId) {
        fan(id);
        return captureEvidence(id, new EvidenceRequest(ReportTargetType.USER, artistOwner(artistId).getId()));
    }
    public EvidenceView captureEvidence(Long id, EvidenceRequest request) {
        fan(id); Target target = target(id, request.targetType(), request.targetId());
        ReportEvidence item = new ReportEvidence(); item.setId(UUID.randomUUID().toString());
        item.setFanId(id); item.setTargetType(request.targetType()); item.setTargetId(request.targetId());
        item.setReportedUserId(target.ownerId()); item.setSnapshot(truncate(target.snapshot())); evidence.save(item);
        return new EvidenceView(item.getId(), item.getTargetType(), item.getTargetId(), item.getSnapshot());
    }
    public Report submitReport(Long id, SubmitReport request) {
        lockedFan(id);
        if (reports.existsByReporterIdAndTargetTypeAndTargetIdAndStatus(id, request.targetType(), request.targetId(), ReportStatus.PENDING))
            throw fail(HttpStatus.CONFLICT, "You have already reported this content or account; your report is pending review");
        Target target;
        if (request.evidenceId() != null && !request.evidenceId().isBlank()) {
            ReportEvidence saved = evidence.findById(request.evidenceId())
                    .filter(e -> e.getFanId().equals(id) && e.getTargetType() == request.targetType() && e.getTargetId().equals(request.targetId()))
                    .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Report evidence is missing or belongs to another account"));
            target = new Target(saved.getReportedUserId(), saved.getSnapshot());
        } else target = target(id, request.targetType(), request.targetId());
        Report report = new Report(); report.setReporterId(id); report.setTargetType(request.targetType()); report.setTargetId(request.targetId());
        report.setReportedUserId(target.ownerId()); report.setReason(request.reason().trim()); report.setDetails(request.details().trim());
        report.setTargetSnapshot(truncate(target.snapshot())); report.setStatus(ReportStatus.PENDING);
        return reports.saveAndFlush(report);
    }
    public List<Report> ownReports(Long id) { fan(id); return reports.findByReporterIdOrderByCreatedAtDesc(id); }
    private String truncate(String text) { return text.length() > 4500 ? text.substring(0, 4500) : text; }
}
