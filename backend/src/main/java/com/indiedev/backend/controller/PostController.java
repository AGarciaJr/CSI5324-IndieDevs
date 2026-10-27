/* The api for creating and retrieving posts of any type
 */

/* NOTE:
 * To add a post to the backend, format the JSON as follows:
 * {"post" : {"posterId":#, "postText":"#", "isPublic":bool, "commentsAllowed":bool},
 * "files" : [ {"type":"#", "content":"#"}, {"type":"#", "content":"#"}, {etc.} ] }'
 */

package com.indiedev.backend.controller;

import com.indiedev.backend.model.Post;
import com.indiedev.backend.model.PostFile;
import com.indiedev.backend.service.PostService;
import com.indiedev.backend.model.PostWrapper;
import com.indiedev.backend.model.UserInteraction;
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

    @PostMapping("/{postId}/comments")
    public UserInteraction commentOnArtwork(
            @PathVariable Long postId,
            @RequestParam Long fanId,
            @RequestParam Long artistId,
            @RequestParam(required = false, defaultValue = "General") String genre,
            @RequestBody String content) {

        return postService.addComment(postId, fanId, artistId, genre, content);
    }
}
