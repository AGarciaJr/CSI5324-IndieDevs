package com.indiedev.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("!test")
public class DatabaseSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);
    private final JdbcTemplate jdbc;

    public DatabaseSeeder(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Integer existingUsers = jdbc.queryForObject("SELECT COUNT(*) FROM user_accounts", Integer.class);
        if (existingUsers != null && existingUsers > 0) {
            log.info("Database already initialized ({} user accounts). Skipping seed.", existingUsers);
            return;
        }

        log.info("Empty database detected. Seeding initial consistent dataset...");

        // 1. Artists (IDs 1..6)
        jdbc.execute("""
            INSERT INTO artists (id, name, genre, location, profile_thumbnail, bio, tags, is_suspended, latitude, longitude) VALUES
                (1, 'Luna Park', 'Indie Folk', 'Austin, TX', 'https://example.com/thumbnails/luna-park.jpg', 'Intimate acoustic melodies and story-driven songwriting rooted in the Texas Hill Country.', 'Indie, Folk, Acoustic, Songwriter, Austin', FALSE, 30.2672, -97.7431),
                (2, 'The Riverbeds', 'Indie Rock', 'Nashville, TN', 'https://example.com/thumbnails/the-riverbeds.jpg', 'Gritty guitars, driving drums, and energetic rock anthems from East Nashville.', 'Rock, Indie, Alternative, Nashville, Band', FALSE, 36.1627, -86.7816),
                (3, 'Marisol Vega', 'Latin Pop', 'Miami, FL', 'https://example.com/thumbnails/marisol-vega.jpg', 'Sun-soaked Latin rhythms blended with modern electronic synths and soulful bilingual vocals.', 'Latin, Pop, Electronic, Dance, Miami', FALSE, 25.7617, -80.1918),
                (4, 'Northside Brass', 'Jazz', 'Chicago, IL', 'https://example.com/thumbnails/northside-brass.jpg', 'Classic Chicago brass quintet fusing traditional jazz standards with modern improv.', 'Jazz, Brass, Instrumental, Chicago, Improv', FALSE, 41.8781, -87.6298),
                (5, 'Brazos Static', 'Electronic', 'Waco, TX', 'https://example.com/thumbnails/brazos-static.jpg', 'Atmospheric synthscapes and ambient electronic beats crafted along the Brazos river.', 'Electronic, Ambient, Synth, Waco', FALSE, 31.5493, -97.1467),
                (6, 'Cottonland Strings', 'Bluegrass', 'Temple, TX', 'https://example.com/thumbnails/cottonland-strings.jpg', 'High-energy bluegrass pickers bringing classic mountain acoustics to Central Texas.', 'Bluegrass, Acoustic, Country, Strings, Temple', FALSE, 31.0982, -97.3428)
            """);

        // 2. Unified User Accounts (single source of truth for all IDs: 1..14)
        // IDs 1..5 preserved for existing demo/header compatibility
        jdbc.execute("""
            INSERT INTO user_accounts (id, username, display_name, role, status, artist_id, latitude, longitude, search_radius_km) VALUES
                (1,  'demo-fan',           'Demo Fan',           'FAN',    'ACTIVE', NULL, 31.5493, -97.1467, 50),
                (2,  'luna-park',          'Luna Park',          'ARTIST', 'ACTIVE', 1,    NULL,    NULL,     NULL),
                (3,  'demo-admin',         'Demo Admin',         'ADMIN',  'ACTIVE', NULL, NULL,    NULL,     NULL),
                (4,  'brazos-static',      'Brazos Static',      'ARTIST', 'ACTIVE', 5,    NULL,    NULL,     NULL),
                (5,  'elena-rodriguez',    'Elena Rodriguez',    'FAN',    'ACTIVE', NULL, NULL,    NULL,     NULL),
                (6,  'marcus-thorne',      'Marcus Thorne',      'FAN',    'ACTIVE', NULL, NULL,    NULL,     NULL),
                (7,  'cosmic_surfer',      'Cosmic Surfer',      'FAN',    'BANNED', NULL, NULL,    NULL,     NULL),
                (8,  'beats_by_dre77',     'Beats By Dre77',     'FAN',    'BANNED', NULL, NULL,    NULL,     NULL),
                (9,  'the-riverbeds',      'The Riverbeds',      'ARTIST', 'ACTIVE', 2,    NULL,    NULL,     NULL),
                (10, 'marisol-vega',       'Marisol Vega',       'ARTIST', 'ACTIVE', 3,    NULL,    NULL,     NULL),
                (11, 'northside-brass',    'Northside Brass',    'ARTIST', 'ACTIVE', 4,    NULL,    NULL,     NULL),
                (12, 'cottonland-strings', 'Cottonland Strings', 'ARTIST', 'ACTIVE', 6,    NULL,    NULL,     NULL),
                (13, 'admin-alex',         'Admin Alex',         'ADMIN',  'ACTIVE', NULL, NULL,    NULL,     NULL),
                (14, 'admin-garrett',      'Admin Garrett',      'ADMIN',  'ACTIVE', NULL, NULL,    NULL,     NULL)
            """);

        // 3. Fans (IDs strictly aligned 1-to-1 with FAN user_accounts)
        jdbc.execute("""
            INSERT INTO fans (id, username, email, banned, can_login, can_appeal) VALUES
                (1, 'demo-fan',        'demo-fan@indiedev.com', FALSE, TRUE,  FALSE),
                (5, 'elena-rodriguez', 'elena@indiedev.com',    FALSE, TRUE,  FALSE),
                (6, 'marcus-thorne',   'marcus@indiedev.com',   FALSE, TRUE,  FALSE),
                (7, 'cosmic_surfer',   'surfer@test.com',       TRUE,  FALSE, TRUE),
                (8, 'beats_by_dre77',  'dre77@test.com',        TRUE,  FALSE, TRUE)
            """);

        // 4. Posts (poster_id = 4 -> Brazos Static)
        jdbc.execute("""
            INSERT INTO posts (id, poster_id, post_date, is_public, comments_allowed, post_text, hidden) VALUES
                (1000, 4, NOW(), TRUE, TRUE, 'New single out Friday!', FALSE)
            """);

        // 5. Events & Ticket Tiers (uses is_virtual instead of reserved keyword virtual)
        jdbc.execute("""
            INSERT INTO events (id, artist_id, event_type, title, description, starts_at, location, is_virtual, capacity, status, reviewed_acknowledgment, created_at, updated_at) VALUES
                (1, 5, 'Concert',  'Free Tickets Giveaway',      'Click this link to claim free tickets',                                                            DATE_ADD(NOW(), INTERVAL 30 DAY), 'Waco, TX',                                  FALSE, 100, 'PENDING_APPROVAL', TRUE, NOW(), NOW()),
                (2, 1, 'Concert',  'Austin Acoustic Night',      'An intimate evening of acoustic songs and storytelling at the historic Paramount Theatre.',         DATE_ADD(NOW(), INTERVAL 15 DAY), 'Paramount Theatre, Austin, TX',             FALSE, 120, 'PUBLISHED',        TRUE, NOW(), NOW()),
                (3, 1, 'Workshop', 'Songwriting from the Heart', 'Hands-on interactive lyric writing and song arrangement workshop for local independent artists.',  DATE_ADD(NOW(), INTERVAL 25 DAY), 'Downtown Cultural Arts Center, Austin, TX', FALSE, 35,  'DRAFT',            TRUE, NOW(), NOW()),
                (4, 4, 'Showcase', 'Windy City Jazz Showcase',   'A two-hour evening jazz session celebrating the rich history of Chicago brass music.',             DATE_ADD(NOW(), INTERVAL 20 DAY), 'Green Mill Jazz Club, Chicago, IL',         FALSE, 150, 'PUBLISHED',        TRUE, NOW(), NOW())
            """);

        jdbc.execute("""
            INSERT INTO event_ticket_tiers (event_id, name, price) VALUES
                (1, 'General admission', 0.00),
                (2, 'Standard', 25.00),
                (2, 'VIP Front Row', 55.00),
                (3, 'Workshop Pass', 35.00),
                (4, 'General Admission', 20.00)
            """);

        // 6. Reports (valid reporter_id, target_id, reported_user_id)
        jdbc.execute("""
            INSERT INTO reports (id, reporter_id, target_type, target_id, reported_user_id, reason, status, created_at) VALUES
                (1, 1, 'POST',  1000, 4, 'Spam link in post',       'PENDING', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
                (2, 5, 'EVENT', 1,    4, 'Event looks like a scam', 'PENDING', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
                (3, 1, 'USER',  4,    4, 'Harassing messages',      'PENDING', DATE_SUB(NOW(), INTERVAL 1 HOUR))
            """);

        // 7. Conversations & Messages (IDs and display names strictly match user_accounts)
        jdbc.execute("""
            INSERT INTO conversations (id, user1_id, user1_name, user2_id, user2_name, last_message_text, last_message_at) VALUES
                (1, 1, 'Demo Fan', 2, 'Luna Park',     'Thanks! We have a special acoustic encore planned for the community.', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
                (2, 1, 'Demo Fan', 4, 'Brazos Static', 'Loved your ambient release! Do you have prints of the cover art?',     DATE_SUB(NOW(), INTERVAL 1 HOUR))
            """);

        jdbc.execute("""
            INSERT INTO messages (id, conversation_id, sender_id, sender_name, recipient_id, recipient_name, message_text, timestamp) VALUES
                (1, 1, 1, 'Demo Fan',  2, 'Luna Park',     'Hey! Really looking forward to your live set this Friday.',          DATE_SUB(NOW(), INTERVAL 5 HOUR)),
                (2, 1, 2, 'Luna Park', 1, 'Demo Fan',      'Thanks! We have a special acoustic encore planned for the community.', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
                (3, 2, 1, 'Demo Fan',  4, 'Brazos Static', 'Loved your ambient release! Do you have prints of the cover art?',   DATE_SUB(NOW(), INTERVAL 1 HOUR))
            """);

        // 8. Ban Appeals (fan_id -> fans/user_accounts 7 & 8; banning_admin_id -> admins 13 & 14)
        jdbc.execute("""
            INSERT INTO ban_appeals (id, fan_id, fan_username, banning_admin_id, banning_admin_name, reason, offending_content, report_material, ai_recommendation, status, created_at) VALUES
                (1, 7, 'cosmic_surfer', 13, 'Admin Alex',
                 'I was banned for alleged spam, but I was just excited about the album drop and my browser lagged sending duplicate comments. I love this community and apologize for the glitch.',
                 'some sentence breaking ToS',
                 'Auto-flag incident: 4 identical messages posted in 8 seconds under Marisol Vega preview. System auto-flagged duplicate content as spam bot.',
                 'AI ToS Evaluation (ToS §3.2 - Automated Activity): Timestamp analysis confirms sub-second duplicate submission matching network packet retry or client lag. No malicious links or abusive language detected. Recommendation: Lift ban; fan account in good standing prior to incident.',
                 'OPEN', NOW()),
                (2, 8, 'beats_by_dre77', 14, 'Admin Garrett',
                 'I got into a heated debate about mixing styles in the comment section. I admit I got frustrated, but I didn''t threaten anyone and I promise to keep comments respectful going forward.',
                 'some sentence breaking ToS',
                 'Moderation log: Aggressive language and insults directed at another commenter regarding audio mastering quality. Warned once previously.',
                 'AI ToS Evaluation (ToS §5.1 - Community Conduct): Language violates civility guidelines. However, no hate speech, doxxing, or harassment occurred. Second infraction. Recommendation: Admin discretion; consider 7-day temporary suspension instead of permanent ban.',
                 'OPEN', NOW())
            """);

        // 9. User Interactions & Matching Artist Follows
        jdbc.execute("""
            INSERT INTO user_interactions (id, fan_id, artist_id, interaction_type, genre, weight, timestamp) VALUES
                (1, 1, 1, 'FOLLOW', 'Indie Folk', 5.0, NOW()),
                (2, 1, 4, 'VIEW',   'Jazz',       1.0, NOW()),
                (3, 1, 2, 'LIKE',   'Indie Rock', 3.0, NOW())
            """);

        jdbc.execute("""
            INSERT INTO artist_follows (id, fan_id, artist_id, created_at) VALUES
                (1, 1, 1, NOW())
            """);

        // 10. Artist Applications (fan_id 5 & 6 now exist in both user_accounts and fans)
        jdbc.execute("""
            INSERT INTO artist_applications (id, fan_id, applicant_name, proposed_genre, portfolio_links, description, status, submitted_at) VALUES
                (1, 5, 'Elena Rodriguez', 'Synth-Pop',  'https://soundcloud.com/elena-synth, https://instagram.com/elenacreates', 'Independent synth-pop producer creating retro-futuristic soundscapes and live analog synth sets.', 'PENDING', NOW()),
                (2, 6, 'Marcus Thorne',   'Indie Rock', 'https://youtube.com/@marcusthorne', 'East Nashville indie rock guitarist and songwriter preparing debut community release.', 'PENDING', NOW())
            """);

        // 11. Advance MySQL AUTO_INCREMENT safely past all seeded IDs
        String[] tablesTo1000 = {
                "artists", "user_accounts", "events", "reports",
                "artist_applications", "artist_follows", "ban_appeals", "fans",
                "user_interactions", "conversations", "messages",
                "comments", "blocked_users"
        };
        for (String table : tablesTo1000) {
            jdbc.execute("ALTER TABLE " + table + " AUTO_INCREMENT = 1000");
        }
        jdbc.execute("ALTER TABLE posts AUTO_INCREMENT = 2000");

        log.info("Initial seed completed successfully.");
    }
}