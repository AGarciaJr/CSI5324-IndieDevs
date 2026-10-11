/* The service that sits between the api and the actual post repository
 */

package com.indiedev.backend.posts;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PostService {

    private final PostRepository postRepository;

    public PostService(PostRepository postRepository) { this.postRepository = postRepository; }

    public Post savePost(Post post) { return postRepository.save(post); }

    public List<Post> getAllPosts() {return postRepository.findAll(); }

    public List<Post> getAllPostsByUser(Long posterId) { return postRepository.findByPosterId(posterId); }

    public Post getPostById(Long postId) { return postRepository.findPostById(postId); }
}
