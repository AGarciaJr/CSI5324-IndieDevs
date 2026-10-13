package com.indiedev.backend.posts;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class PostWrapper {
    private Post post;
    private PostFile file;
}
