package com.indiedev.backend.repository;

import com.indiedev.backend.model.Fan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FanRepository extends JpaRepository<Fan, Long> {
    Optional<Fan> findByUsername(String username);
}
