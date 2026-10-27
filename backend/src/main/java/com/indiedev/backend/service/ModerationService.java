package com.indiedev.backend.service;

import com.indiedev.backend.model.BanAppeal;
import com.indiedev.backend.model.Fan;
import com.indiedev.backend.repository.BanAppealRepository;
import com.indiedev.backend.repository.FanRepository;
import com.indiedev.backend.model.Artist;
import com.indiedev.backend.repository.ArtistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class ModerationService {

    private final FanRepository fanRepository;
    private final BanAppealRepository banAppealRepository;
    private final ArtistRepository artistRepository;

    public ModerationService(FanRepository fanRepository, BanAppealRepository banAppealRepository, ArtistRepository artistRepository) {
        this.fanRepository = fanRepository;
        this.banAppealRepository = banAppealRepository;
        this.artistRepository = artistRepository;
    }

    public Fan getFanById(Long fanId) {
        return fanRepository.findById(fanId)
                .orElseThrow(() -> new NoSuchElementException("Fan with ID " + fanId + " not found."));
    }

    public List<Fan> getAllFans() {
        return fanRepository.findAll();
    }

    public Fan saveFan(Fan fan) {
        return fanRepository.save(fan);
    }

    public List<BanAppeal> getAllAppeals() {
        return banAppealRepository.findAll();
    }

    /**
     * Use Case: Unban Fan (Nicholas Nolen)
     * Reviews open appeals from bans performed by admins other than the requesting admin.
     * Main flow step 1.
     */
    public List<BanAppeal> getOpenAppealsForAdmin(Long adminId) {
        if (adminId == null) {
            return banAppealRepository.findByStatus(BanAppeal.AppealStatus.OPEN);
        }
        return banAppealRepository.findOpenAppealsNotBannedByAdmin(BanAppeal.AppealStatus.OPEN, adminId);
    }

    /**
     * Retrieves a specific appeal by ID so the admin can review fan reasoning,
     * report material, and automated AI recommendation.
     * Main flow steps 2, 3, 4.
     */
    public BanAppeal getAppealById(Long appealId) {
        return banAppealRepository.findById(appealId)
                .orElseThrow(() -> new NoSuchElementException("Ban appeal with ID " + appealId + " not found."));
    }

    /**
     * Resolves the appeal by unbanning the fan (updating appeal and fan status).
     * Enforces that a different admin than the banning admin must review the appeal.
     * Main flow steps 5, 6, 7.
     */
    public BanAppeal unbanFan(Long appealId, Long reviewingAdminId, String reviewNotes) {
        BanAppeal appeal = getAppealById(appealId);

        validateReviewer(appeal, reviewingAdminId);

        appeal.setStatus(BanAppeal.AppealStatus.APPROVED);
        appeal.setReviewingAdminId(reviewingAdminId);
        appeal.setReviewedAt(LocalDateTime.now());
        if (reviewNotes != null && !reviewNotes.trim().isEmpty()) {
            appeal.setReviewNotes(reviewNotes);
        }
        BanAppeal savedAppeal = banAppealRepository.save(appeal);

        // Main flow steps 6 & 7: Remove ban and grant login access
        fanRepository.findById(appeal.getFanId()).ifPresent(fan -> {
            fan.setBanned(false);
            fan.setCanLogin(true);
            fanRepository.save(fan);
        });

        return savedAppeal;
    }

    /**
     * Marks the appeal as invalid and upholds the ban.
     * Removes the appeal from open appeals and revokes the user's ability to make further appeals.
     * Extension 5a (5a1, 5a2, 5a3).
     */
    public BanAppeal markAppealInvalid(Long appealId, Long reviewingAdminId, String reviewNotes) {
        BanAppeal appeal = getAppealById(appealId);

        validateReviewer(appeal, reviewingAdminId);

        // 5a2: Log appeal as invalid and remove from open appeals list
        appeal.setStatus(BanAppeal.AppealStatus.INVALID);
        appeal.setReviewingAdminId(reviewingAdminId);
        appeal.setReviewedAt(LocalDateTime.now());
        if (reviewNotes != null && !reviewNotes.trim().isEmpty()) {
            appeal.setReviewNotes(reviewNotes);
        }
        BanAppeal savedAppeal = banAppealRepository.save(appeal);

        // 5a3: Remove the user's ability to make further appeals
        fanRepository.findById(appeal.getFanId()).ifPresent(fan -> {
            fan.setCanAppeal(false);
            fanRepository.save(fan);
        });

        return savedAppeal;
    }

    /**
     * Use Case: Admin - Suspend artist account
     * Fetches the artist by ID, flips the suspension flag to true, and saves to the database.
     */
    public Artist suspendArtist(Long artistId) {
        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new NoSuchElementException("Artist with ID " + artistId + " not found."));

        artist.setSuspended(true);
        return artistRepository.save(artist);
    }

    private void validateReviewer(BanAppeal appeal, Long reviewingAdminId) {
        if (reviewingAdminId == null) {
            throw new IllegalArgumentException("Reviewing admin ID is required.");
        }
        if (appeal.getStatus() != BanAppeal.AppealStatus.OPEN) {
            throw new IllegalStateException("Appeal with ID " + appeal.getId()
                    + " has already been resolved with status: " + appeal.getStatus());
        }
        // Precondition & Postcondition 1: A different admin than the banning admin must review the appeal
        if (reviewingAdminId.equals(appeal.getBanningAdminId())) {
            throw new IllegalArgumentException("Conflict of interest: A different admin than the banning admin must review the appeal. Banning admin was: "
                    + appeal.getBanningAdminId());
        }
    }
}
