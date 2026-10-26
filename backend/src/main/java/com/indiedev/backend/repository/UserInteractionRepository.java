package com.indiedev.backend.repository;

import com.indiedev.backend.model.UserInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserInteractionRepository extends JpaRepository<UserInteraction, Long> {
    List<UserInteraction> findByFanId(Long fanId);
    List<UserInteraction> findByFanIdAndArtistId(Long fanId, Long artistId);
    boolean existsByFanIdAndArtistIdAndInteractionType(Long fanId, Long artistId, String interactionType);
    void deleteByFanId(Long fanId);
}
