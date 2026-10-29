package com.indiedev.backend.repository;
import com.indiedev.backend.model.ArtistFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ArtistFollowRepository extends JpaRepository<ArtistFollow, Long> {
    boolean existsByFanIdAndArtistId(Long fanId, Long artistId);
    List<ArtistFollow> findByFanIdOrderByCreatedAtDesc(Long fanId);
    long countByArtistId(Long artistId);
    void deleteByFanIdAndArtistId(Long fanId, Long artistId);
}
