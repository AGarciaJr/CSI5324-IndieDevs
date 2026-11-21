package com.indiedev.backend.post;

import com.indiedev.backend.dto.ManageCommentRequest;
import com.indiedev.backend.model.Comment;
import com.indiedev.backend.model.Post;
import com.indiedev.backend.model.PostFile;
import com.indiedev.backend.model.PostWrapper;
import com.indiedev.backend.model.UserInteraction;
import com.indiedev.backend.repository.BlockedUserRepository;
import com.indiedev.backend.repository.CommentRepository;
import com.indiedev.backend.repository.PostRepository;
import com.indiedev.backend.repository.UserInteractionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
@AutoConfigureMockMvc
class PostControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserInteractionRepository interactionRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private BlockedUserRepository blockedUserRepository;

    private static final long FAN_ID = 1L;      // Nicholas Nolen (Fan)
    private static final long ARTIST_ID = 2L;   // Luna Park (Artist)
    private static final long SECOND_FAN = 5L;  // Second Fan

    @BeforeEach
    void setUp() {
        interactionRepository.deleteAll();
        commentRepository.deleteAll();
        blockedUserRepository.deleteAll();
    }

    // =========================================================================
    // 1. MAKE A POST USE CASE (Garrett DeYong)
    // =========================================================================

    @Test
    @DisplayName("GD-MP-01: Artist creates a new post with text and attached media files")
    void testArtistCreatesPostWithMediaFiles() throws Exception {
        String postPayload = """
                {
                    "post": {
                        "posterId": 2,
                        "postText": "Studio session preview: new acoustic tracking",
                        "isPublic": true,
                        "commentsAllowed": true
                    },
                    "files": [
                        {
                            "type": "image/png",
                            "content": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
                        }
                    ]
                }
                """;

        mockMvc.perform(post("/api/posts")
                        .header("X-User-Id", ARTIST_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(postPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.post.id").isNumber())
                .andExpect(jsonPath("$.post.posterId").value(ARTIST_ID))
                .andExpect(jsonPath("$.post.postText").value("Studio session preview: new acoustic tracking"))
                .andExpect(jsonPath("$.post.public").value(true))
                .andExpect(jsonPath("$.post.commentsAllowed").value(true))
                .andExpect(jsonPath("$.files.length()").value(1))
                .andExpect(jsonPath("$.files[0].type").value("image/png"));
    }

    @Test
    @DisplayName("GD-MP-02: Reject post creation when required content is missing (Extension 4a) and reject non-artists")
    void testRejectEmptyPostContentAndNonArtists() throws Exception {
        // 1. Extension 4a: Empty post content rejected with 400 Bad Request
        String emptyPayload = """
                {
                    "post": {
                        "posterId": 2,
                        "postText": "   ",
                        "isPublic": true,
                        "commentsAllowed": true
                    },
                    "files": []
                }
                """;

        mockMvc.perform(post("/api/posts")
                        .header("X-User-Id", ARTIST_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(emptyPayload))
                .andExpect(status().isBadRequest());

        // 2. Access control: Fans cannot create artist posts (403 Forbidden)
        String validContentFromFan = """
                {
                    "post": {
                        "posterId": 1,
                        "postText": "Fan trying to make a post",
                        "isPublic": true,
                        "commentsAllowed": true
                    },
                    "files": []
                }
                """;

        mockMvc.perform(post("/api/posts")
                        .header("X-User-Id", FAN_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validContentFromFan))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GD-MP-03: Retrieve all published posts by artist profile ID")
    void testRetrievePublishedPostsByArtistId() throws Exception {
        // Arrange: Create a post for artist 2
        Post post = new Post();
        post.setPosterId(ARTIST_ID);
        post.setPostText("Live from the rehearsal room");
        post.setPublic(true);
        post.setCommentsAllowed(true);
        postRepository.save(post);

        mockMvc.perform(get("/api/posts/byuserid/" + ARTIST_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].posterId").value(ARTIST_ID))
                .andExpect(jsonPath("$[0].postText").value("Live from the rehearsal room"));
    }

    // =========================================================================
    // 2. MONITOR COMMENTS USE CASE (Garrett DeYong)
    // =========================================================================

    @Test
    @DisplayName("GD-MC-01: Retrieve post details and comment preferences for artist monitoring")
    void testRetrievePostDetailsForMonitoring() throws Exception {
        Post post = new Post();
        post.setPosterId(ARTIST_ID);
        post.setPostText("Album cover concepts for upcoming LP");
        post.setPublic(true);
        post.setCommentsAllowed(true);
        Post saved = postRepository.save(post);

        mockMvc.perform(get("/api/posts/bypostid/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.posterId").value(ARTIST_ID))
                .andExpect(jsonPath("$.commentsAllowed").value(true))
                .andExpect(jsonPath("$.postText").value("Album cover concepts for upcoming LP"));
    }

    @Test
    @DisplayName("GD-MC-02: Fan comment on post artwork generates weighted taste profile interaction")
    void testAddCommentInteraction() throws Exception {
        // Arrange
        Post post = new Post();
        post.setPosterId(ARTIST_ID);
        post.setPostText("Check out our new track");
        post.setPublic(true);
        post.setCommentsAllowed(true);
        Post savedPost = postRepository.save(post);

        long dummyPostId = savedPost.getId();
        String genre = "Indie Rock";
        String content = "This artwork is absolutely stunning! Love the composition.";

        // Base state assertion: Guarantee no comments exist for this fan yet
        assertEquals(0, interactionRepository.count());
        assertEquals(0, commentRepository.count());

        // Act & Assert (HTTP Layer)
        mockMvc.perform(post("/api/posts/" + dummyPostId + "/comments")
                        .param("fanId", String.valueOf(SECOND_FAN))
                        .param("artistId", String.valueOf(ARTIST_ID))
                        .param("genre", genre)
                        .content(content)
                        .contentType(MediaType.TEXT_PLAIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.interactionType").value("COMMENT"))
                .andExpect(jsonPath("$.content").value(content))
                .andExpect(jsonPath("$.weight").value(3.0)) // Validates the @PrePersist weighting rule
                .andExpect(jsonPath("$.postId").value(dummyPostId))
                .andExpect(jsonPath("$.fanId").value(SECOND_FAN))
                .andExpect(jsonPath("$.artistId").value(ARTIST_ID));

        // Assert (Database Layer)
        assertEquals(1, interactionRepository.count());
        assertEquals(1, commentRepository.count());

        List<UserInteraction> interactions = interactionRepository.findByFanId(SECOND_FAN);
        assertEquals(1, interactions.size());

        UserInteraction savedInteraction = interactions.get(0);
        assertEquals("COMMENT", savedInteraction.getInteractionType());
        assertEquals(content, savedInteraction.getContent());
        assertEquals(3.0, savedInteraction.getWeight());
        assertNotNull(savedInteraction.getTimestamp());

        // Assert Comment JPA entity was also created and visible
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(dummyPostId);
        assertEquals(1, comments.size());
        assertEquals(content, comments.get(0).getContent());
        assertEquals("VISIBLE", comments.get(0).getVisibilityStatus());
        assertThat(comments.get(0).isHidden()).isFalse();
    }

    @Test
    @DisplayName("GD-MC-03: Hide offensive comment from public view without deleting from audit log")
    void testHideCommentFromPublicView() throws Exception {
        // Arrange: Create a post and a comment
        Post post = new Post();
        post.setPosterId(ARTIST_ID);
        post.setPostText("Post to be moderated");
        post.setPublic(true);
        post.setCommentsAllowed(true);
        Post savedPost = postRepository.save(post);

        Comment comment = new Comment();
        comment.setPostId(savedPost.getId());
        comment.setAuthorId(SECOND_FAN);
        comment.setAuthorName("Second Fan");
        comment.setContent("Offensive spam comment");
        comment.setHidden(false);
        comment.setVisibilityStatus("VISIBLE");
        Comment savedComment = commentRepository.save(comment);

        // 1. Verify comment is initially in public list
        mockMvc.perform(get("/api/posts/" + savedPost.getId() + "/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].content").value("Offensive spam comment"));

        // 2. Hide comment via PUT hide endpoint
        mockMvc.perform(put("/api/posts/" + savedPost.getId() + "/comments/" + savedComment.getId() + "/hide")
                        .param("hidden", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hidden").value(true))
                .andExpect(jsonPath("$.visibilityStatus").value("HIDDEN"));

        // 3. Verify comment is omitted from default public list
        mockMvc.perform(get("/api/posts/" + savedPost.getId() + "/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // 4. Verify comment is retained in database and accessible when includeHidden=true (audit log)
        mockMvc.perform(get("/api/posts/" + savedPost.getId() + "/comments").param("includeHidden", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].hidden").value(true))
                .andExpect(jsonPath("$[0].visibilityStatus").value("HIDDEN"));
    }

    @Test
    @DisplayName("GD-MC-04: Artist manages comment with block user and reports options")
    void testArtistBlocksUserAndSubsequentCommentRejected() throws Exception {
        // Arrange: Create a post and an abusive comment
        Post post = new Post();
        post.setPosterId(ARTIST_ID);
        post.setPostText("Post with abusive commenter");
        post.setPublic(true);
        post.setCommentsAllowed(true);
        Post savedPost = postRepository.save(post);

        Comment comment = new Comment();
        comment.setPostId(savedPost.getId());
        comment.setAuthorId(SECOND_FAN);
        comment.setAuthorName("Abusive User");
        comment.setContent("Harassing message");
        Comment savedComment = commentRepository.save(comment);

        // Manage comment: hide, report, and block the user
        String managePayload = """
                {
                    "hide": true,
                    "report": true,
                    "reportReason": "Harassment and abusive language",
                    "blockUser": true,
                    "blockReason": "Repeated harassment"
                }
                """;

        mockMvc.perform(post("/api/posts/" + savedPost.getId() + "/comments/" + savedComment.getId() + "/manage")
                        .header("X-User-Id", ARTIST_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(managePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hidden").value(true));

        // Verify user is recorded in blocked users repository
        assertThat(blockedUserRepository.existsByArtistIdAndBlockedUserId(ARTIST_ID, SECOND_FAN)).isTrue();

        // Verify blocked user cannot post new comments to this artist's posts (403 Forbidden)
        mockMvc.perform(post("/api/posts/" + savedPost.getId() + "/comments")
                        .param("fanId", String.valueOf(SECOND_FAN))
                        .param("artistId", String.valueOf(ARTIST_ID))
                        .content("Trying to comment again after block")
                        .contentType(MediaType.TEXT_PLAIN))
                .andExpect(status().isForbidden());
    }
}
