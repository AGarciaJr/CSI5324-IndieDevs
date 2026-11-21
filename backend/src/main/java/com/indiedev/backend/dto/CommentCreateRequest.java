package com.indiedev.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommentCreateRequest {
    private String content;
    private Long fanId;
    private Long artistId;
    private String authorName;
    private String authorRole;
    private String genre = "General";
}
