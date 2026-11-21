package com.indiedev.backend.repository;

import com.indiedev.backend.model.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    List<UserAccount> findByArtistId(Long artistId);

    Optional<UserAccount> findByUsernameIgnoreCase(String username);

    Optional<UserAccount> findByDisplayNameIgnoreCase(String displayName);

    List<UserAccount> findByDisplayNameContainingIgnoreCaseOrUsernameContainingIgnoreCase(String q1, String q2);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from UserAccount u where u.id = :id")
    Optional<UserAccount> lockById(@Param("id") Long id);
}
