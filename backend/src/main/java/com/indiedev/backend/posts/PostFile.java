package com.indiedev.backend.posts;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
//import org.springframework.web.multipart.MultipartFile;

@Entity
@Table(name = "files")
@Getter
@Setter
public class PostFile {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private Long postId;

    private String type;
    private String content;

    public PostFile() {}

}
