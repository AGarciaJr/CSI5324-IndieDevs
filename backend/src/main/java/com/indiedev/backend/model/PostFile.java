package com.indiedev.backend.model;

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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long postId;

    private String type;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    public PostFile() {}

}
