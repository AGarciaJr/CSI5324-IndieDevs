package com.indiedev.backend.posts;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class PostWrapper {
    private Post post;
    private List<PostFile> files;
}
