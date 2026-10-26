package com.indiedev.backend.repository;

import com.indiedev.backend.model.BanAppeal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BanAppealRepository extends JpaRepository<BanAppeal, Long> {
    List<BanAppeal> findByStatus(BanAppeal.AppealStatus status);

    @Query("SELECT b FROM BanAppeal b WHERE b.status = :status AND (b.banningAdminId IS NULL OR b.banningAdminId <> :adminId)")
    List<BanAppeal> findOpenAppealsNotBannedByAdmin(@Param("status") BanAppeal.AppealStatus status, @Param("adminId") Long adminId);
}
