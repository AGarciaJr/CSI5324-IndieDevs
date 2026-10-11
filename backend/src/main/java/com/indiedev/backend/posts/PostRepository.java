package com.indiedev.backend.posts;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("select p from Post p where p.posterId = ?1")
    List<Post> findByPosterId(Long posterId);

    @Query("select p from Post p where p.id = ?1")
    Post findPostById(Long postId);

}
