package com.indiedev.backend.moderation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BanAppealRepository extends JpaRepository<BanAppeal, Long> {

    List<BanAppeal> findByStatus(BanAppeal.AppealStatus status);

    @Query("select a from BanAppeal a where a.status = :status and a.banningAdminId != :adminId")
    List<BanAppeal> findOpenAppealsNotBannedByAdmin(@Param("status") BanAppeal.AppealStatus status, @Param("adminId") Long adminId);

    List<BanAppeal> findByFanId(Long fanId);
}
