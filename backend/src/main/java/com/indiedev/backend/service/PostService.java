/* The service that sits between the api and the actual post repository
 */

package com.indiedev.backend.service;

import com.indiedev.backend.dto.ManageCommentRequest;
import com.indiedev.backend.model.*;
import com.indiedev.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final FileRepository fileRepository;
    private final UserInteractionRepository interactionRepository;
    private final CommentRepository commentRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final ReportRepository reportRepository;
    private final AccessControlService accessControlService;

    public PostService(
            PostRepository postRepository,
            FileRepository fileRepository,
            UserInteractionRepository interactionRepository,
            CommentRepository commentRepository,
            BlockedUserRepository blockedUserRepository,
            ReportRepository reportRepository,
            AccessControlService accessControlService) {
        this.postRepository = postRepository;
        this.fileRepository = fileRepository;
        this.interactionRepository = interactionRepository;
        this.commentRepository = commentRepository;
        this.blockedUserRepository = blockedUserRepository;
        this.reportRepository = reportRepository;
        this.accessControlService = accessControlService;
    }

    // Save a Post and a PostFile (stored together in a wrapper) with validation and role checking
    public PostWrapper savePost(PostWrapper postWrapper, Long callerUserId) {
        if (postWrapper == null || postWrapper.getPost() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Post content is required");
        }

        Post post = postWrapper.getPost();

        // Determine effective poster ID: caller header or wrapper posterId
        Long effectivePosterId = callerUserId != null ? callerUserId : post.getPosterId();
        if (effectivePosterId != null) {
            // Require ARTIST role
            accessControlService.requireRole(effectivePosterId, Role.ARTIST);
            post.setPosterId(effectivePosterId);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Poster ID is required");
        }

        // Extension 4a: Validate content presence
        boolean hasText = post.getPostText() != null && !post.getPostText().trim().isEmpty();
        boolean hasFiles = postWrapper.getFiles() != null && !postWrapper.getFiles().isEmpty();
        if (!hasText && !hasFiles) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Post content (text or files) is required");
        }

        PostWrapper confirmationWrapper = new PostWrapper();
        confirmationWrapper.setPost(postRepository.save(post));

        List<PostFile> files = postWrapper.getFiles();
        List<PostFile> newFiles = new ArrayList<>();
        if (files != null) {
            for (PostFile f : files) {
                f.setPostId(post.getId());
                newFiles.add(fileRepository.save(f));
            }
        }

        confirmationWrapper.setFiles(newFiles);
        return confirmationWrapper;
    }

    // Overload for backward compatibility
    public PostWrapper savePost(PostWrapper postWrapper) {
        return savePost(postWrapper, null);
    }

    // Get posts by criteria
    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    public List<Post> getAllPostsByUser(Long posterId) {
        return postRepository.findByPosterId(posterId);
    }

    public Post getPostById(Long postId) {
        Post post = postRepository.findPostById(postId);
        if (post == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found with ID " + postId);
        }
        return post;
    }

    // Get files by criteria
    public List<PostFile> getAllFiles() {
        return fileRepository.findAll();
    }

    public List<PostFile> getFilesByPostId(Long postId) {
        return fileRepository.findByPostId(postId);
    }

    public PostFile getFileById(Long fileId) {
        return fileRepository.findFileById(fileId);
    }

    // Comment Management
    public Comment addComment(Long postId, Long fanId, Long artistId, String genre, String content, String authorName, String authorRole) {
        if (content == null || content.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment content cannot be empty");
        }

        // Validate post exists and accepts comments
        Post post = postRepository.findPostById(postId);
        if (post != null && !post.isCommentsAllowed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comments are disabled for this post");
        }

        // Check if author is blocked by this artist
        if (artistId != null && fanId != null && blockedUserRepository.existsByArtistIdAndBlockedUserId(artistId, fanId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is blocked from commenting on this artist's posts");
        }

        // 1. Persist JPA Comment entity
        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setAuthorId(fanId);
        comment.setAuthorName(authorName != null && !authorName.isBlank() ? authorName : "Fan #" + fanId);
        comment.setAuthorRole(authorRole != null && !authorRole.isBlank() ? authorRole : "Fan");
        comment.setContent(content.trim());
        comment.setVisibilityStatus("VISIBLE");
        comment.setHidden(false);
        comment.setCreatedAt(LocalDateTime.now());
        Comment savedComment = commentRepository.save(comment);

        // 2. Persist UserInteraction for algorithmic recommendation weighting (weight = 3.0)
        UserInteraction interaction = new UserInteraction();
        interaction.setPostId(postId);
        interaction.setFanId(fanId);
        interaction.setArtistId(artistId);
        interaction.setInteractionType("COMMENT");
        interaction.setGenre(genre != null && !genre.isBlank() ? genre : "General");
        interaction.setContent(content.trim());
        interactionRepository.save(interaction);

        return savedComment;
    }

    // Backward compatible addComment returning UserInteraction
    public UserInteraction addCommentLegacy(Long postId, Long fanId, Long artistId, String genre, String content) {
        addComment(postId, fanId, artistId, genre, content, null, null);
        List<UserInteraction> interactions = interactionRepository.findByFanId(fanId);
        if (!interactions.isEmpty()) {
            return interactions.get(interactions.size() - 1);
        }
        UserInteraction fallback = new UserInteraction();
        fallback.setPostId(postId);
        fallback.setFanId(fanId);
        fallback.setArtistId(artistId);
        fallback.setInteractionType("COMMENT");
        fallback.setContent(content);
        return fallback;
    }

    public List<Comment> getCommentsForPost(Long postId, boolean includeHidden) {
        if (includeHidden) {
            return commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        }
        return commentRepository.findByPostIdAndHiddenFalseOrderByCreatedAtAsc(postId);
    }

    public Comment hideComment(Long commentId, boolean hidden) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        comment.setHidden(hidden);
        comment.setVisibilityStatus(hidden ? "HIDDEN" : "VISIBLE");
        return commentRepository.save(comment);
    }

    public Comment manageComment(Long commentId, Long artistId, ManageCommentRequest request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (request.isHide()) {
            comment.setHidden(true);
            comment.setVisibilityStatus("HIDDEN");
            comment = commentRepository.save(comment);
        }

        if (request.isBlockUser() && comment.getAuthorId() != null && artistId != null) {
            if (!blockedUserRepository.existsByArtistIdAndBlockedUserId(artistId, comment.getAuthorId())) {
                BlockedUser blockedUser = new BlockedUser();
                blockedUser.setArtistId(artistId);
                blockedUser.setBlockedUserId(comment.getAuthorId());
                blockedUser.setBlockedUserName(comment.getAuthorName());
                blockedUser.setReason(request.getBlockReason() != null ? request.getBlockReason() : "Abusive comments");
                blockedUser.setBlockedAt(LocalDateTime.now());
                blockedUserRepository.save(blockedUser);
            }
        }

        if (request.isReport() && artistId != null) {
            Report report = new Report();
            report.setReporterId(artistId);
            report.setTargetType(ReportTargetType.POST);
            report.setTargetId(comment.getPostId());
            report.setReportedUserId(comment.getAuthorId() != null ? comment.getAuthorId() : 0L);
            report.setReason(request.getReportReason() != null ? request.getReportReason() : "Inappropriate comment");
            report.setDetails(comment.getContent());
            report.setTargetSnapshot("Flagged comment: \"" + comment.getContent() + "\" by " + comment.getAuthorName());
            report.setStatus(ReportStatus.PENDING);
            report.setCreatedAt(LocalDateTime.now());
            reportRepository.save(report);
        }

        return comment;
    }

    public List<BlockedUser> getBlockedUsers(Long artistId) {
        return blockedUserRepository.findByArtistIdOrderByBlockedAtDesc(artistId);
    }

    public BlockedUser blockUser(Long artistId, Long userId, String userName, String reason) {
        if (blockedUserRepository.existsByArtistIdAndBlockedUserId(artistId, userId)) {
            return blockedUserRepository.findByArtistIdOrderByBlockedAtDesc(artistId).stream()
                    .filter(b -> b.getBlockedUserId().equals(userId))
                    .findFirst()
                    .orElse(null);
        }
        BlockedUser blockedUser = new BlockedUser();
        blockedUser.setArtistId(artistId);
        blockedUser.setBlockedUserId(userId);
        blockedUser.setBlockedUserName(userName);
        blockedUser.setReason(reason != null ? reason : "Artist block");
        blockedUser.setBlockedAt(LocalDateTime.now());
        return blockedUserRepository.save(blockedUser);
    }

    public void unblockUser(Long artistId, Long userId) {
        blockedUserRepository.deleteByArtistIdAndBlockedUserId(artistId, userId);
    }
}
