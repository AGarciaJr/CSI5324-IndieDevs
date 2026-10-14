package com.indiedev.backend;

import com.indiedev.backend.events.Event;
import com.indiedev.backend.events.EventRepository;
import com.indiedev.backend.moderation.BanAppeal;
import com.indiedev.backend.moderation.BanAppealRepository;
import com.indiedev.backend.moderation.Fan;
import com.indiedev.backend.moderation.FanRepository;
import com.indiedev.backend.posts.Post;
import com.indiedev.backend.posts.PostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Simple, working H2 database integration tests.
 * Demonstrates:
 * 1. Verifying H2 database connection & metadata.
 * 2. Inspecting created H2 tables.
 * 3. Performing direct SQL queries with JdbcTemplate.
 * 4. Storing, retrieving, updating, and deleting Event records in H2.
 * 5. Storing, retrieving, and updating Moderation (Fan & BanAppeal) records in H2.
 * 6. Storing and retrieving Post records in H2.
 */
@SpringBootTest
public class H2DatabaseTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private FanRepository fanRepository;

    @Autowired
    private BanAppealRepository banAppealRepository;

    @Autowired
    private PostRepository postRepository;

    @BeforeEach
    void cleanDatabase() {
        banAppealRepository.deleteAll();
        fanRepository.deleteAll();
        eventRepository.deleteAll();
        postRepository.deleteAll();
    }

    @Test
    @DisplayName("H2 Connection: Verify connection is active and connected to H2 in-memory DB")
    void testH2ConnectionAndProduct() throws SQLException {
        assertNotNull(dataSource, "DataSource should be configured");

        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection, "Database connection should not be null");
            assertFalse(connection.isClosed(), "Database connection should be open");

            DatabaseMetaData metaData = connection.getMetaData();
            String productName = metaData.getDatabaseProductName();
            String url = metaData.getURL();

            assertEquals("H2", productName, "Database should be H2");
            assertTrue(url.contains("jdbc:h2:mem:"), "Database URL should be an in-memory H2 database: " + url);
        }
    }

    @Test
    @DisplayName("H2 Schema: Verify JPA entities created the corresponding H2 tables")
    void testH2TablesExist() throws SQLException {
        List<String> tables = new ArrayList<>();

        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            try (ResultSet rs = metaData.getTables(null, "PUBLIC", "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    tables.add(rs.getString("TABLE_NAME").toLowerCase());
                }
            }
        }

        assertTrue(tables.contains("events"), "H2 should contain 'events' table");
        assertTrue(tables.contains("fans"), "H2 should contain 'fans' table");
        assertTrue(tables.contains("ban_appeals"), "H2 should contain 'ban_appeals' table");
        assertTrue(tables.contains("posts"), "H2 should contain 'posts' table");
    }

    @Test
    @DisplayName("H2 SQL: Run direct SQL insert and select queries using JdbcTemplate")
    void testRawSqlQueriesWithJdbcTemplate() {
        // Direct SQL insert into events table in H2
        jdbcTemplate.update("""
                INSERT INTO events (id, artist_id, event_type, title, description, reviewed_acknowledgment, created_at, updated_at)
                VALUES (999, 42, 'Festival', 'H2 Direct SQL Festival', 'Inserted via raw SQL', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        // Direct SQL select count
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM events WHERE artist_id = ?", Integer.class, 42);
        assertNotNull(count);
        assertEquals(1, count);

        // Direct SQL select title
        String title = jdbcTemplate.queryForObject("SELECT title FROM events WHERE id = ?", String.class, 999);
        assertEquals("H2 Direct SQL Festival", title);
    }

    @Test
    @DisplayName("H2 Event CRUD: Test basic data storage operations for Events in H2")
    void testEventDataStorageInH2() {
        // 1. Create & Insert
        Event event = new Event();
        event.setArtistId(200L);
        event.setEventType("Workshop");
        event.setTitle("Songwriting 101");
        event.setDescription("Beginner music workshop.");
        event.setEventDate(LocalDateTime.now().plusDays(3));
        event.setLocation("Studio B");
        event.setReviewedAcknowledgment(true);

        Event saved = eventRepository.save(event);
        assertNotNull(saved.getId(), "Generated ID should be assigned by H2");

        // 2. Read from H2
        Event fetched = eventRepository.findEventById(saved.getId());
        assertNotNull(fetched);
        assertEquals("Songwriting 101", fetched.getTitle());
        assertEquals("Studio B", fetched.getLocation());

        // 3. Update in H2
        fetched.setTitle("Advanced Songwriting Masterclass");
        fetched.setLocation("Main Hall");
        Event updated = eventRepository.save(fetched);
        assertEquals("Advanced Songwriting Masterclass", updated.getTitle());
        assertEquals("Main Hall", updated.getLocation());

        // 4. Delete from H2
        eventRepository.deleteById(updated.getId());
        assertNull(eventRepository.findEventById(saved.getId()), "Event should be removed from H2");
    }

    @Test
    @DisplayName("H2 Moderation CRUD: Test basic data storage operations for Fans & Ban Appeals in H2")
    void testModerationDataStorageInH2() {
        // 1. Create Fan in H2
        Fan fan = new Fan();
        fan.setUsername("h2_fan_user");
        fan.setEmail("h2_fan@test.com");
        fan.setBanned(true);
        fan.setCanLogin(false);
        fan.setCanAppeal(true);
        Fan savedFan = fanRepository.save(fan);
        assertNotNull(savedFan.getId());

        // 2. Create Ban Appeal in H2
        BanAppeal appeal = new BanAppeal();
        appeal.setFanId(savedFan.getId());
        appeal.setBanningAdminId(88L);
        appeal.setReason("Testing H2 ban appeal storage");
        appeal.setReportMaterial("H2 test log report");
        appeal.setAiRecommendation("Automated AI ToS Recommendation: Test recommendation");
        appeal.setStatus(BanAppeal.AppealStatus.OPEN);

        BanAppeal savedAppeal = banAppealRepository.save(appeal);
        assertNotNull(savedAppeal.getId());

        // 3. Query from H2
        List<BanAppeal> openAppeals = banAppealRepository.findByStatus(BanAppeal.AppealStatus.OPEN);
        assertEquals(1, openAppeals.size());
        assertEquals(savedFan.getId(), openAppeals.get(0).getFanId());

        // 4. Update status in H2
        savedAppeal.setStatus(BanAppeal.AppealStatus.APPROVED);
        savedAppeal.setReviewingAdminId(99L);
        savedAppeal.setReviewedAt(LocalDateTime.now());
        banAppealRepository.save(savedAppeal);

        savedFan.setBanned(false);
        savedFan.setCanLogin(true);
        fanRepository.save(savedFan);

        // Verify updated records in H2
        Fan refreshedFan = fanRepository.findById(savedFan.getId()).orElseThrow();
        assertFalse(refreshedFan.isBanned(), "Fan should be unbanned in H2");
        assertTrue(refreshedFan.isCanLogin(), "Fan can now log in in H2");

        BanAppeal refreshedAppeal = banAppealRepository.findById(savedAppeal.getId()).orElseThrow();
        assertEquals(BanAppeal.AppealStatus.APPROVED, refreshedAppeal.getStatus());
        assertEquals(99L, refreshedAppeal.getReviewingAdminId());
    }

    @Test
    @DisplayName("H2 Post CRUD: Test basic data storage operations for Posts in H2")
    void testPostDataStorageInH2() {
        Post post = new Post();
        post.setPosterId(300L);
        post.setPostText("Hello H2 database!");

        Post savedPost = postRepository.save(post);
        assertNotNull(savedPost.getId(), "Post should have generated ID from H2");

        List<Post> postsByArtist = postRepository.findByPosterId(300L);
        assertEquals(1, postsByArtist.size());
        assertEquals("Hello H2 database!", postsByArtist.get(0).getPostText());

        Post byId = postRepository.findPostById(savedPost.getId());
        assertNotNull(byId);
        assertEquals("Hello H2 database!", byId.getPostText());
    }
}
