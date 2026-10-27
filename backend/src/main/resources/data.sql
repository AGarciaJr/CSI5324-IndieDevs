DELETE FROM user_interactions;
DELETE FROM ban_appeals;
DELETE FROM fans;
DELETE FROM events;
DELETE FROM artists;

INSERT INTO artists (id, name, genre, location, profile_thumbnail, bio, tags, is_suspended) VALUES
    (1, 'Luna Park', 'Indie Folk', 'Austin, TX', 'https://example.com/thumbnails/luna-park.jpg', 'Intimate acoustic melodies and story-driven songwriting rooted in the Texas Hill Country.', 'Indie, Folk, Acoustic, Songwriter, Austin', false),
    (2, 'The Riverbeds', 'Indie Rock', 'Nashville, TN', 'https://example.com/thumbnails/the-riverbeds.jpg', 'Gritty guitars, driving drums, and energetic rock anthems from East Nashville.', 'Rock, Indie, Alternative, Nashville, Band', false),
    (3, 'Marisol Vega', 'Latin Pop', 'Miami, FL', 'https://example.com/thumbnails/marisol-vega.jpg', 'Sun-soaked Latin rhythms blended with modern electronic synths and soulful bilingual vocals.', 'Latin, Pop, Electronic, Dance, Miami', false),
    (4, 'Northside Brass', 'Jazz', 'Chicago, IL', 'https://example.com/thumbnails/northside-brass.jpg', 'Classic Chicago brass quintet fusing traditional jazz standards with modern improv.', 'Jazz, Brass, Instrumental, Chicago, Improv', false),
    (5, 'The Juniper Collective', 'Indie Folk', 'Waco, TX', 'https://example.com/thumbnails/juniper.jpg', 'Harmonies, banjos, and campfire ballads created by a community of Central Texas artists.', 'Indie, Folk, Acoustic, Harmony, Texas', false),
    (6, 'Miles Bennett', 'Jazz', 'Austin, TX', 'https://example.com/thumbnails/miles.jpg', 'Neo-soul saxophone player and producer creating smooth late-night soundscapes.', 'Jazz, Soul, Neo-Soul, Saxophone, Chill', false),
    (7, 'Amara Studio', 'Visual Art', 'Dallas, TX', 'https://example.com/thumbnails/amara.jpg', 'Abstract oil painter and digital illustrator capturing organic shapes and urban textures.', 'Visual Art, Painting, Illustration, Dallas', false),
    (8, 'Sage & Sound', 'Alternative', 'Portland, OR', 'https://example.com/thumbnails/sage.jpg', 'Ethereal dreampop and indie-electronic textures for introspective listeners.', 'Alternative, Dreampop, Ambient, Electronic', false),
    (9, 'William Waweru', 'Indie Folk', 'Waco, TX', 'https://example.com/thumbnails/william.jpg', 'Acoustic storytelling, heartfelt guitar work, and community-driven indie sessions.', 'Indie, Folk, Acoustic, Singer, Storyteller', false);

INSERT INTO events (id, artist_id, event_type, title, description, event_date, location, virtual, capacity, status, reviewed_acknowledgment, created_at, updated_at) VALUES
    (1, 9, 'Concert', 'Waco Acoustic Night', 'An intimate evening of acoustic songs and storytelling at Common Grounds in Waco.', '2026-11-15T19:30:00', 'Common Grounds, Waco, TX', false, 120, 'Published', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 9, 'Workshop', 'Songwriting from the Heart', 'Hands-on interactive lyric writing and song arrangement workshop for local independent artists.', '2026-12-05T14:00:00', 'Downtown Cultural Arts Center, Waco, TX', false, 35, 'Draft', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 1, 'Exhibition & Live Set', 'Austin Folk & Canvas', 'Live acoustic performance accompanied by local painters producing canvas art live during the show.', '2026-11-28T18:00:00', 'The Canopy, Austin, TX', false, 200, 'Published', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (4, 4, 'Showcase', 'Windy City Jazz Showcase', 'A two-hour evening jazz session celebrating the rich history of Chicago brass music.', '2026-11-20T20:00:00', 'Green Mill Jazz Club, Chicago, IL', false, 150, 'Published', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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
    (2, 1, 5, 'LIKE', 'Indie Folk', 3.0, CURRENT_TIMESTAMP),
    (3, 1, 9, 'BOOKING', 'Indie Folk', 5.0, CURRENT_TIMESTAMP),
    (4, 1, 4, 'VIEW', 'Jazz', 1.0, CURRENT_TIMESTAMP);

INSERT INTO artist_applications (fan_id, applicant_name, proposed_genre, portfolio_links, status, submitted_at) VALUES
    (5, 'Elena Rodriguez', 'Synth-Pop', 'https://soundcloud.com/elena-synth, https://instagram.com/elenacreates', 'PENDING', CURRENT_TIMESTAMP),
    (6, 'Marcus Thorne', 'Indie Rock', 'https://youtube.com/@marcusthorne', 'PENDING', CURRENT_TIMESTAMP);

-- Fast-forward the auto-increment sequences to prevent Primary Key collisions with seeded data
ALTER TABLE artists ALTER COLUMN id RESTART WITH 100;
ALTER TABLE artist_applications ALTER COLUMN id RESTART WITH 100;