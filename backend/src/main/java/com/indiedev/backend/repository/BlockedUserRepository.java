package com.indiedev.backend.repository;

import com.indiedev.backend.model.BlockedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlockedUserRepository extends JpaRepository<BlockedUser, Long> {
    boolean existsByArtistIdAndBlockedUserId(Long artistId, Long blockedUserId);
    List<BlockedUser> findByArtistIdOrderByBlockedAtDesc(Long artistId);
    void deleteByArtistIdAndBlockedUserId(Long artistId, Long blockedUserId);
}
