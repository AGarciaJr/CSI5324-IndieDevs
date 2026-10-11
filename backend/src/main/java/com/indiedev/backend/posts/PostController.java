/* The api for creating and retrieving posts of any type
 */

package com.indiedev.backend.posts;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping
    public Post savePost(@RequestBody Post post) {return postService.savePost(post); }

    @GetMapping
    public List<Post> getAllPosts() { return postService.getAllPosts(); }

    @GetMapping(path = "/byuserid/{posterId}")
    public List<Post> getAllPostsByUser(@PathVariable Long posterId) { return postService.getAllPostsByUser(posterId); }

    @GetMapping(path = "/bypostid/{postId}")
    public Post getPostById(@PathVariable Long postId) { return postService.getPostById(postId); }

}
