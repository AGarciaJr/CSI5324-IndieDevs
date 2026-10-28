package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

// Uses UserAccount ids, not the legacy appeals-only Fan table.
@Entity @Table(name = "fan_profiles") @Getter @Setter
public class FanProfile {
    @Id private Long userId;
    @Version private Long version;
    @Column(length = 80) private String displayName;
    @Column(length = 2000) private String biography = "";
    @Column(length = 300) private String interests = "";
    @Column(length = 700000) private String image = "";
    private boolean publicProfile = true;
    private boolean showInterests = true;
    private boolean showFollowing = true;
}
