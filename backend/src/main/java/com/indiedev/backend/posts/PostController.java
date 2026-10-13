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
    public PostWrapper savePost(@RequestBody PostWrapper postWrapper) { return postService.savePost(postWrapper); }

    // Get posts by criteria

    @GetMapping
    public List<Post> getAllPosts() { return postService.getAllPosts(); }

    @GetMapping(path = "/byuserid/{posterId}")
    public List<Post> getAllPostsByUser(@PathVariable Long posterId) { return postService.getAllPostsByUser(posterId); }

    @GetMapping(path = "/bypostid/{postId}")
    public Post getPostById(@PathVariable Long postId) { return postService.getPostById(postId); }

    // Get files by criteria

    @GetMapping(path = "/files")
    public List<PostFile> getAllFiles() { return postService.getAllFiles(); }

    @GetMapping(path = "/files/bypostid/{postId}")
    public List<PostFile> getFilesByPostId(@PathVariable Long postId) { return postService.getFilesByPostId(postId); }

    @GetMapping(path = "/files/byfileid/{fileId}")
    public PostFile getFileById(@PathVariable Long fileId) { return postService.getFileById(fileId); }

}
