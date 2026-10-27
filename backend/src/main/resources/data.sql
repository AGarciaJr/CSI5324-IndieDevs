DELETE FROM user_interactions;
DELETE FROM ban_appeals;
DELETE FROM fans;
DELETE FROM event_ticket_tiers;
DELETE FROM reports;
DELETE FROM notifications;
DELETE FROM posts;
DELETE FROM conversations;
DELETE FROM user_accounts;
DELETE FROM events;
DELETE FROM artist_applications;
DELETE FROM artists;

INSERT INTO artists (id, name, genre, location, profile_thumbnail, bio, tags, is_suspended, latitude, longitude) VALUES
    (1, 'Luna Park', 'Indie Folk', 'Austin, TX', 'https://example.com/thumbnails/luna-park.jpg', 'Intimate acoustic melodies and story-driven songwriting rooted in the Texas Hill Country.', 'Indie, Folk, Acoustic, Songwriter, Austin', false, 30.2672, -97.7431),
    (2, 'The Riverbeds', 'Indie Rock', 'Nashville, TN', 'https://example.com/thumbnails/the-riverbeds.jpg', 'Gritty guitars, driving drums, and energetic rock anthems from East Nashville.', 'Rock, Indie, Alternative, Nashville, Band', false, 36.1627, -86.7816),
    (3, 'Marisol Vega', 'Latin Pop', 'Miami, FL', 'https://example.com/thumbnails/marisol-vega.jpg', 'Sun-soaked Latin rhythms blended with modern electronic synths and soulful bilingual vocals.', 'Latin, Pop, Electronic, Dance, Miami', false, 25.7617, -80.1918),
    (4, 'Northside Brass', 'Jazz', 'Chicago, IL', 'https://example.com/thumbnails/northside-brass.jpg', 'Classic Chicago brass quintet fusing traditional jazz standards with modern improv.', 'Jazz, Brass, Instrumental, Chicago, Improv', false, 41.8781, -87.6298),
    (5, 'Brazos Static', 'Electronic', 'Waco, TX', 'https://example.com/thumbnails/brazos-static.jpg', 'Atmospheric synthscapes and ambient electronic beats crafted along the Brazos river.', 'Electronic, Ambient, Synth, Waco', false, 31.5493, -97.1467),
    (6, 'Cottonland Strings', 'Bluegrass', 'Temple, TX', 'https://example.com/thumbnails/cottonland-strings.jpg', 'High-energy bluegrass pickers bringing classic mountain acoustics to Central Texas.', 'Bluegrass, Acoustic, Country, Strings, Temple', false, 31.0982, -97.3428);

-- Demo accounts, one per role. Clients send the account id in the X-User-Id header.
-- 1 = fan living in Waco, 2 = artist (Luna Park), 3 = admin, 4 = artist (Brazos Static), 5 = second fan
INSERT INTO user_accounts (id, username, display_name, role, status, artist_id, latitude, longitude, search_radius_km) VALUES
    (1, 'demo-fan', 'Demo Fan', 'FAN', 'ACTIVE', NULL, 31.5493, -97.1467, 50),
    (2, 'luna-park', 'Luna Park', 'ARTIST', 'ACTIVE', 1, NULL, NULL, NULL),
    (3, 'demo-admin', 'Demo Admin', 'ADMIN', 'ACTIVE', NULL, NULL, NULL, NULL),
    (4, 'brazos-static', 'Brazos Static', 'ARTIST', 'ACTIVE', 5, NULL, NULL, NULL),
    (5, 'second-fan', 'Second Fan', 'FAN', 'ACTIVE', NULL, NULL, NULL, NULL);

INSERT INTO posts (id, poster_id, post_date, is_public, comments_allowed, post_text, hidden) VALUES
    (1000, 4, CURRENT_TIMESTAMP, TRUE, TRUE, 'New single out Friday!', FALSE);

INSERT INTO events (id, artist_id, event_type, title, description, starts_at, location, virtual, capacity, status, reviewed_acknowledgment, created_at, updated_at) VALUES
    (1, 5, 'Concert', 'Free Tickets Giveaway', 'Click this link to claim free tickets', DATEADD('DAY', 30, CURRENT_TIMESTAMP), 'Waco, TX', FALSE, 100, 'PENDING_APPROVAL', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 1, 'Concert', 'Austin Acoustic Night', 'An intimate evening of acoustic songs and storytelling at the historic Paramount Theatre.', DATEADD('DAY', 15, CURRENT_TIMESTAMP), 'Paramount Theatre, Austin, TX', FALSE, 120, 'PUBLISHED', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 1, 'Workshop', 'Songwriting from the Heart', 'Hands-on interactive lyric writing and song arrangement workshop for local independent artists.', DATEADD('DAY', 25, CURRENT_TIMESTAMP), 'Downtown Cultural Arts Center, Austin, TX', FALSE, 35, 'DRAFT', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (4, 4, 'Showcase', 'Windy City Jazz Showcase', 'A two-hour evening jazz session celebrating the rich history of Chicago brass music.', DATEADD('DAY', 20, CURRENT_TIMESTAMP), 'Green Mill Jazz Club, Chicago, IL', FALSE, 150, 'PUBLISHED', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO event_ticket_tiers (event_id, name, price) VALUES
    (1, 'General admission', 0.00),
    (2, 'Standard', 25.00),
    (2, 'VIP Front Row', 55.00),
    (3, 'Workshop Pass', 35.00),
    (4, 'General Admission', 20.00);

INSERT INTO reports (id, reporter_id, target_type, target_id, reported_user_id, reason, status, created_at) VALUES
    (1, 1, 'POST', 1000, 4, 'Spam link in post', 'PENDING', DATEADD('HOUR', -3, CURRENT_TIMESTAMP)),
    (2, 5, 'EVENT', 1, 4, 'Event looks like a scam', 'PENDING', DATEADD('HOUR', -2, CURRENT_TIMESTAMP)),
    (3, 1, 'USER', 4, 4, 'Harassing messages', 'PENDING', DATEADD('HOUR', -1, CURRENT_TIMESTAMP));

-- Conversations between demo accounts (fan 1 <-> artist 2, admin 3 <-> artist 2)
INSERT INTO conversations (user1_id, user2_id) VALUES
    (1, 2),
    (3, 2);

INSERT INTO fans (id, username, email, banned, can_login, can_appeal) VALUES
    (1, 'nicholas_fan', 'nicholas@indiedev.com', false, true, false),
    (2, 'new_fan_user', 'newfan@indiedev.com', false, true, false),
    (3, 'cosmic_surfer', 'surfer@test.com', true, false, true),
    (4, 'beats_by_dre77', 'dre77@test.com', true, false, true);

INSERT INTO ban_appeals (id, fan_id, fan_username, banning_admin_id, banning_admin_name, reason, offending_content, report_material, ai_recommendation, status, created_at) VALUES
    (1, 3, 'cosmic_surfer', 101, 'Admin Alex',
     'I was banned for alleged spam, but I was just excited about the album drop and my browser lagged sending duplicate comments. I love this community and apologize for the glitch.',
     'some sentence breaking ToS',
     'Report #104: 4 identical messages posted in 8 seconds under Marisol Vega preview. System auto-flagged duplicate content as spam bot.',
     'AI ToS Evaluation (ToS §3.2 - Automated Activity): Timestamp analysis confirms sub-second duplicate submission matching network packet retry or client lag. No malicious links or abusive language detected. Recommendation: Lift ban; fan account in good standing prior to incident.',
     'OPEN', CURRENT_TIMESTAMP),
    (2, 4, 'beats_by_dre77', 102, 'Admin Garrett',
     'I got into a heated debate about mixing styles in the comment section. I admit I got frustrated, but I didn''t threaten anyone and I promise to keep comments respectful going forward.',
     'some sentence breaking ToS',
     'Report #112: Aggressive language and insults directed at another commenter regarding audio mastering quality. Warned once previously.',
     'AI ToS Evaluation (ToS §5.1 - Community Conduct): Language violates civility guidelines. However, no hate speech, doxxing, or harassment occurred. Second infraction. Recommendation: Admin discretion; consider 7-day temporary suspension instead of permanent ban.',
     'OPEN', CURRENT_TIMESTAMP);

INSERT INTO user_interactions (id, fan_id, artist_id, interaction_type, genre, weight, timestamp) VALUES
    (1, 1, 1, 'FOLLOW', 'Indie Folk', 5.0, CURRENT_TIMESTAMP),
    (2, 1, 4, 'VIEW', 'Jazz', 1.0, CURRENT_TIMESTAMP),
    (3, 1, 2, 'LIKE', 'Indie Rock', 3.0, CURRENT_TIMESTAMP);

INSERT INTO artist_applications (id, fan_id, applicant_name, proposed_genre, portfolio_links, status, submitted_at) VALUES
    (1, 5, 'Elena Rodriguez', 'Synth-Pop', 'https://soundcloud.com/elena-synth, https://instagram.com/elenacreates', 'PENDING', CURRENT_TIMESTAMP),
    (2, 6, 'Marcus Thorne', 'Indie Rock', 'https://youtube.com/@marcusthorne', 'PENDING', CURRENT_TIMESTAMP);

ALTER TABLE artists ALTER COLUMN id RESTART WITH 100;
ALTER TABLE user_accounts ALTER COLUMN id RESTART WITH 100;
ALTER TABLE events ALTER COLUMN id RESTART WITH 100;
ALTER TABLE reports ALTER COLUMN id RESTART WITH 100;
ALTER TABLE posts ALTER COLUMN id RESTART WITH 2000;
ALTER TABLE artist_applications ALTER COLUMN id RESTART WITH 100;
ALTER TABLE ban_appeals ALTER COLUMN id RESTART WITH 100;
ALTER TABLE fans ALTER COLUMN id RESTART WITH 100;
ALTER TABLE user_interactions ALTER COLUMN id RESTART WITH 100;
