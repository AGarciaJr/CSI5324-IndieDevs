package com.indiedev.backend.dto;

import com.indiedev.backend.model.ReportTargetType;
import jakarta.validation.constraints.*;
import java.util.List;

public final class CommunityDtos {
    private CommunityDtos() {}
    public record ProfileUpdate(
        @NotBlank @Size(max = 80) String displayName,
        @NotNull @Size(max = 2000) String biography,
        @NotNull @Size(max = 300) String interests,
        @NotNull @Size(max = 700000) String image,
        @NotNull Boolean publicProfile, @NotNull Boolean showInterests, @NotNull Boolean showFollowing,
        @NotNull @PositiveOrZero Long version) {}
    public record FanSummary(Long userId, String displayName) {}
    public record FollowView(Long artistId, String name, String genre, String location,
                             String profileThumbnail, boolean available, long followerCount, boolean following) {}
    public record ProfileView(Long userId, Long version, String displayName, String biography,
                              String interests, String image, boolean publicProfile, boolean showInterests,
                              boolean showFollowing, List<FollowView> supportedArtists) {}
    public record TargetView(ReportTargetType type, Long id, String title) {}
    public record EvidenceRequest(@NotNull ReportTargetType targetType, @NotNull @Positive Long targetId) {}
    public record EvidenceView(String evidenceId, ReportTargetType targetType, Long targetId, String snapshot) {}
    public record SubmitReport(@NotNull ReportTargetType targetType, @NotNull @Positive Long targetId,
                               @NotBlank @Size(max = 120) String reason,
                               @NotNull @Size(max = 2000) String details,
                               @Size(max = 36) String evidenceId) {}
}
