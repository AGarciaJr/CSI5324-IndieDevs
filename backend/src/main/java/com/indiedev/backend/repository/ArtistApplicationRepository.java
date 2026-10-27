package com.indiedev.backend.repository;

import com.indiedev.backend.model.ArtistApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArtistApplicationRepository extends JpaRepository<ArtistApplication, Long> {
    List<ArtistApplication> findByStatus(String status);
}