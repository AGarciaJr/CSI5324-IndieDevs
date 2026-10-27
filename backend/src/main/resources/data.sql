INSERT INTO artists (name, genre, location, profile_thumbnail, latitude, longitude) VALUES
    ('Luna Park', 'Indie Folk', 'Austin, TX', 'https://example.com/thumbnails/luna-park.jpg', 30.2672, -97.7431),
    ('The Riverbeds', 'Indie Rock', 'Nashville, TN', 'https://example.com/thumbnails/the-riverbeds.jpg', 36.1627, -86.7816),
    ('Marisol Vega', 'Latin Pop', 'Miami, FL', 'https://example.com/thumbnails/marisol-vega.jpg', 25.7617, -80.1918),
    ('Northside Brass', 'Jazz', 'Chicago, IL', 'https://example.com/thumbnails/northside-brass.jpg', 41.8781, -87.6298),
    ('Brazos Static', 'Electronic', 'Waco, TX', 'https://example.com/thumbnails/brazos-static.jpg', 31.5493, -97.1467),
    ('Cottonland Strings', 'Bluegrass', 'Temple, TX', 'https://example.com/thumbnails/cottonland-strings.jpg', 31.0982, -97.3428);

-- Demo accounts, one per role. Clients send the account id in the X-User-Id header.
-- 1 = fan living in Waco, 2 = artist (Luna Park), 3 = admin, 4 = artist (Brazos Static), 5 = second fan
INSERT INTO user_accounts (username, display_name, role, status, artist_id, latitude, longitude, search_radius_km) VALUES
    ('demo-fan', 'Demo Fan', 'FAN', 'ACTIVE', NULL, 31.5493, -97.1467, 50),
    ('luna-park', 'Luna Park', 'ARTIST', 'ACTIVE', 1, NULL, NULL, NULL),
    ('demo-admin', 'Demo Admin', 'ADMIN', 'ACTIVE', NULL, NULL, NULL, NULL),
    ('brazos-static', 'Brazos Static', 'ARTIST', 'ACTIVE', 5, NULL, NULL, NULL),
    ('second-fan', 'Second Fan', 'FAN', 'ACTIVE', NULL, NULL, NULL, NULL);

INSERT INTO posts (id, poster_id, post_date, is_public, comments_allowed, post_text, hidden) VALUES
    (1000, 4, CURRENT_TIMESTAMP, TRUE, TRUE, 'New single out Friday!', FALSE);

INSERT INTO events (artist_id, title, description, starts_at, location, virtual, capacity, status, created_at) VALUES
    (5, 'Free Tickets Giveaway', 'Click this link to claim free tickets', DATEADD('DAY', 30, CURRENT_TIMESTAMP), 'Waco, TX', FALSE, 100, 'PENDING_APPROVAL', CURRENT_TIMESTAMP);

INSERT INTO reports (reporter_id, target_type, target_id, reported_user_id, reason, status, created_at) VALUES
    (1, 'POST', 1000, 4, 'Spam link in post', 'PENDING', DATEADD('HOUR', -3, CURRENT_TIMESTAMP)),
    (5, 'EVENT', 1, 4, 'Event looks like a scam', 'PENDING', DATEADD('HOUR', -2, CURRENT_TIMESTAMP)),
    (1, 'USER', 4, 4, 'Harassing messages', 'PENDING', DATEADD('HOUR', -1, CURRENT_TIMESTAMP));

-- Conversations between demo accounts (fan 1 <-> artist 2, admin 3 <-> artist 2)
INSERT INTO conversations (user1_id, user2_id) VALUES
    (1, 2),
    (3, 2);
