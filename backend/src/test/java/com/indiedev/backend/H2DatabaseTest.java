package com.indiedev.backend;

import com.indiedev.backend.model.BanAppeal;
import com.indiedev.backend.model.Event;
import com.indiedev.backend.model.Fan;
import com.indiedev.backend.model.UserInteraction;
import com.indiedev.backend.repository.BanAppealRepository;
import com.indiedev.backend.repository.EventRepository;
import com.indiedev.backend.repository.FanRepository;
import com.indiedev.backend.repository.UserInteractionRepository;
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

@SpringBootTest
@org.springframework.transaction.annotation.Transactional
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
    private UserInteractionRepository userInteractionRepository;

    @BeforeEach
    void cleanDatabase() {
        userInteractionRepository.deleteAll();
        banAppealRepository.deleteAll();
        fanRepository.deleteAll();
        eventRepository.deleteAll();
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
        assertTrue(tables.contains("user_interactions"), "H2 should contain 'user_interactions' table");
        assertTrue(tables.contains("artists"), "H2 should contain 'artists' table");
        assertTrue(tables.contains("posts"), "H2 should contain 'posts' table");
    }

    @Test
    @DisplayName("H2 Event CRUD: Test data persistence and updating for Events in H2")
    void testEventDataStorageInH2() {
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

        Event fetched = eventRepository.findEventById(saved.getId());
        assertNotNull(fetched);
        assertEquals("Songwriting 101", fetched.getTitle());

        fetched.setTitle("Advanced Songwriting Masterclass");
        Event updated = eventRepository.save(fetched);
        assertEquals("Advanced Songwriting Masterclass", updated.getTitle());

        eventRepository.deleteById(updated.getId());
        assertNull(eventRepository.findEventById(saved.getId()));
    }

    @Test
    @DisplayName("H2 Moderation CRUD: Test Fans and Ban Appeals in H2")
    void testModerationDataStorageInH2() {
        Fan fan = new Fan("h2_fan_user", "h2_fan@test.com");
        Fan savedFan = fanRepository.save(fan);
        assertNotNull(savedFan.getId());

        BanAppeal appeal = new BanAppeal();
        appeal.setFanId(savedFan.getId());
        appeal.setBanningAdminId(88L);
        appeal.setReason("Testing H2 ban appeal storage");
        appeal.setReportMaterial("H2 test log report");
        appeal.setAiRecommendation("Automated AI ToS Recommendation: Test");
        appeal.setStatus(BanAppeal.AppealStatus.OPEN);

        BanAppeal savedAppeal = banAppealRepository.save(appeal);
        assertNotNull(savedAppeal.getId());

        List<BanAppeal> openAppeals = banAppealRepository.findByStatus(BanAppeal.AppealStatus.OPEN);
        assertEquals(1, openAppeals.size());

        savedAppeal.setStatus(BanAppeal.AppealStatus.APPROVED);
        savedAppeal.setReviewingAdminId(99L);
        banAppealRepository.save(savedAppeal);

        savedFan.setBanned(false);
        savedFan.setCanLogin(true);
        fanRepository.save(savedFan);

        Fan refreshedFan = fanRepository.findById(savedFan.getId()).orElseThrow();
        assertFalse(refreshedFan.isBanned());
        assertTrue(refreshedFan.isCanLogin());
    }

    @Test
    @DisplayName("H2 UserInteraction CRUD: Test recording user interactions in H2")
    void testUserInteractionStorageInH2() {
        UserInteraction ui = new UserInteraction();
        ui.setFanId(1L);
        ui.setArtistId(5L);
        ui.setInteractionType("FOLLOW");
        ui.setGenre("Indie Folk");
        ui.setWeight(5.0);

        UserInteraction saved = userInteractionRepository.save(ui);
        assertNotNull(saved.getId());

        List<UserInteraction> list = userInteractionRepository.findByFanId(1L);
        assertEquals(1, list.size());
        assertEquals("Indie Folk", list.get(0).getGenre());
    }
}
