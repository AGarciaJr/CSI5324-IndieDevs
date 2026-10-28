package com.indiedev.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Getter
@Setter
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String tempId;

    private Long posterId;
    private LocalDateTime postDate;

    private boolean isPublic;
    private boolean commentsAllowed;

    private String postText;

    // Set when an admin removes the post after a report
    private boolean hidden = false;

    public Post() {
        postDate = LocalDateTime.now();
    }

}
