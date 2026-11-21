/* The api for creating and retrieving posts of any type
 */

package com.indiedev.backend.controller;

import com.indiedev.backend.dto.CommentResponse;
import com.indiedev.backend.dto.ManageCommentRequest;
import com.indiedev.backend.model.*;
import com.indiedev.backend.service.PostService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping
    public PostWrapper savePost(
            @RequestBody PostWrapper postWrapper,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return postService.savePost(postWrapper, userId);
    }

    // Get posts by criteria
    @GetMapping
    public List<Post> getAllPosts() {
        return postService.getAllPosts();
    }

    @GetMapping(path = "/byuserid/{posterId}")
    public List<Post> getAllPostsByUser(@PathVariable Long posterId) {
        return postService.getAllPostsByUser(posterId);
    }

    @GetMapping(path = "/bypostid/{postId}")
    public Post getPostById(@PathVariable Long postId) {
        return postService.getPostById(postId);
    }

    // Get files by criteria
    @GetMapping(path = "/files")
    public List<PostFile> getAllFiles() {
        return postService.getAllFiles();
    }

    @GetMapping(path = "/files/bypostid/{postId}")
    public List<PostFile> getFilesByPostId(@PathVariable Long postId) {
        return postService.getFilesByPostId(postId);
    }

    @GetMapping(path = "/files/byfileid/{fileId}")
    public PostFile getFileById(@PathVariable Long fileId) {
        return postService.getFileById(fileId);
    }

    // Get comments for a post
    @GetMapping("/{postId}/comments")
    public List<Comment> getComments(
            @PathVariable Long postId,
            @RequestParam(required = false, defaultValue = "false") boolean includeHidden) {
        return postService.getCommentsForPost(postId, includeHidden);
    }

    // Add comment to artwork/post
    @PostMapping(path = "/{postId}/comments", consumes = {org.springframework.http.MediaType.ALL_VALUE})
    public CommentResponse commentOnArtwork(
            @PathVariable Long postId,
            @RequestParam(required = false) Long fanId,
            @RequestParam(required = false) Long artistId,
            @RequestParam(required = false, defaultValue = "General") String genre,
            @RequestParam(required = false) String authorName,
            @RequestParam(required = false) String authorRole,
            @RequestBody(required = false) String rawBody) {

        String contentText = "";
        if (rawBody != null) {
            String trimmed = rawBody.trim();
            if (trimmed.startsWith("{") && trimmed.contains("\"content\"")) {
                int start = trimmed.indexOf("\"content\"");
                int colon = trimmed.indexOf(":", start);
                int firstQuote = trimmed.indexOf("\"", colon);
                int secondQuote = trimmed.indexOf("\"", firstQuote + 1);
                if (firstQuote != -1 && secondQuote != -1) {
                    contentText = trimmed.substring(firstQuote + 1, secondQuote);
                } else {
                    contentText = trimmed;
                }
            } else {
                contentText = trimmed;
            }
        }

        Comment comment = postService.addComment(postId, fanId, artistId, genre, contentText, authorName, authorRole);

        CommentResponse res = new CommentResponse();
        res.setId(comment.getId());
        res.setPostId(postId);
        res.setFanId(fanId);
        res.setArtistId(artistId);
        res.setAuthorId(fanId);
        res.setAuthorName(comment.getAuthorName());
        res.setAuthorRole(comment.getAuthorRole());
        res.setContent(comment.getContent());
        res.setInteractionType("COMMENT");
        res.setWeight(3.0);
        res.setGenre(genre);
        res.setHidden(comment.isHidden());
        res.setVisibilityStatus(comment.getVisibilityStatus());
        res.setCreatedAt(comment.getCreatedAt());
        res.setTimestamp(comment.getCreatedAt());
        return res;
    }

    // Hide or unhide comment
    @PutMapping(path = {"/{postId}/comments/{commentId}/hide", "/comments/{commentId}/hide"})
    public Comment hideComment(
            @PathVariable(required = false) Long postId,
            @PathVariable Long commentId,
            @RequestParam(required = false, defaultValue = "true") boolean hidden) {
        return postService.hideComment(commentId, hidden);
    }

    // Monitor / Manage comment (hide, report, and/or block user)
    @PostMapping("/{postId}/comments/{commentId}/manage")
    public Comment manageComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @RequestHeader(value = "X-User-Id", required = false) Long callerId,
            @RequestBody ManageCommentRequest request) {
        return postService.manageComment(commentId, callerId, request);
    }

    // Blocked users management for artists
    @GetMapping("/artists/{artistId}/blocked-users")
    public List<BlockedUser> getBlockedUsers(@PathVariable Long artistId) {
        return postService.getBlockedUsers(artistId);
    }

    @PostMapping("/artists/{artistId}/blocked-users")
    public BlockedUser blockUser(
            @PathVariable Long artistId,
            @RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        String userName = payload.get("userName") != null ? payload.get("userName").toString() : "User #" + userId;
        String reason = payload.get("reason") != null ? payload.get("reason").toString() : "Blocked by artist";
        return postService.blockUser(artistId, userId, userName, reason);
    }

    @DeleteMapping("/artists/{artistId}/blocked-users/{userId}")
    public ResponseEntity<Void> unblockUser(
            @PathVariable Long artistId,
            @PathVariable Long userId) {
        postService.unblockUser(artistId, userId);
        return ResponseEntity.ok().build();
    }
}
