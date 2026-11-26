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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long posterId;
    private LocalDateTime postDate;

    private boolean isPublic;
    private boolean commentsAllowed;

    public boolean isPublic() {
        return isPublic;
    }

    public boolean getIsPublic() {
        return isPublic;
    }

    public void setPublic(boolean isPublic) {
        this.isPublic = isPublic;
    }

    public void setIsPublic(boolean isPublic) {
        this.isPublic = isPublic;
    }

    private String postText;

    // Set when an admin removes the post after a report
    private boolean hidden;

    public Post() {
        postDate = LocalDateTime.now();
    }

}
