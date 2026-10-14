package com.indiedev.backend.repository;

import com.indiedev.backend.model.PostFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface FileRepository extends JpaRepository<PostFile, Long> {

    @Query("select f from PostFile f where f.postId = ?1")
    List<PostFile> findByPostId(Long postId);

    @Query("select f from PostFile f where f.id = ?1")
    PostFile findFileById(Long fileId);

}
