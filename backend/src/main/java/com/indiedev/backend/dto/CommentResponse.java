package com.indiedev.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private Long postId;
    private Long fanId;
    private Long artistId;
    private Long authorId;
    private String authorName;
    private String authorRole;
    private String content;
    private String interactionType = "COMMENT";
    private Double weight = 3.0;
    private String genre;
    private boolean hidden = false;
    private String visibilityStatus = "VISIBLE";
    private LocalDateTime createdAt;
    private LocalDateTime timestamp;
}
