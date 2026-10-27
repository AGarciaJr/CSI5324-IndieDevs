/* An account that can act in the system, with the role that decides which use cases it may perform.
 * Fans can store a home location and a preferred search radius for nearby artist searches.
 * Artist accounts point at their public Artist profile.
 */

package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_accounts")
@Getter
@Setter
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountStatus status = AccountStatus.ACTIVE;

    // Set only for ARTIST accounts
    private Long artistId;

    // Fan's saved home location and default radius for nearby searches
    private Double latitude;
    private Double longitude;
    private Double searchRadiusKm;

    public UserAccount() {
    }

    public boolean isActive() {
        return status == AccountStatus.ACTIVE;
    }

}
