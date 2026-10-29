package com.indiedev.backend.repository;

import com.indiedev.backend.model.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    java.util.List<UserAccount> findByArtistId(Long artistId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select u from UserAccount u where u.id = :id")
    java.util.Optional<UserAccount> lockById(@org.springframework.data.repository.query.Param("id") Long id);

}
