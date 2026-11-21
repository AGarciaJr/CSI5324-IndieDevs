import { Artist, ArtistPost } from "../types/artist";

export const SAMPLE_ARTISTS: Artist[] = [
    {
        id: 1,
        name: "Luna Park",
        genre: "Indie Folk",
        location: "Austin, TX",
        bio: "Intimate acoustic melodies and story-driven songwriting rooted in the Texas Hill Country.",
        tags: "Music, Indie Folk, Acoustic, Songwriter, Austin",
        profileThumbnail: "https://example.com/thumbnails/luna-park.jpg",
    },
    {
        id: 2,
        name: "The Riverbeds",
        genre: "Indie Rock",
        location: "Nashville, TN",
        bio: "Gritty guitars, driving drums, and energetic rock anthems from East Nashville.",
        tags: "Music, Rock, Indie Rock, Alternative, Nashville, Band",
    },
    {
        id: 3,
        name: "Marisol Vega",
        genre: "Latin Pop",
        location: "Miami, FL",
        bio: "Sun-soaked Latin rhythms blended with modern electronic synths and soulful bilingual vocals.",
        tags: "Music, Latin Pop, Electronic, Dance, Miami",
    },
    {
        id: 4,
        name: "Northside Brass",
        genre: "Jazz",
        location: "Chicago, IL",
        bio: "Classic Chicago brass quintet fusing traditional jazz standards with modern improv.",
        tags: "Music, Jazz, Brass, Instrumental, Chicago, Improv",
    },
    {
        id: 5,
        name: "The Juniper Collective",
        genre: "Indie Folk",
        location: "Waco, TX",
        bio: "Harmonies, banjos, and campfire ballads created by a community of Central Texas artists.",
        tags: "Music, Indie Folk, Acoustic, Harmony, Texas",
    },
    {
        id: 6,
        name: "Miles Bennett",
        genre: "Jazz",
        location: "Austin, TX",
        bio: "Neo-soul saxophone player and producer creating smooth late-night soundscapes.",
        tags: "Music, Jazz, Neo-Soul, Saxophone, Chill",
    },
    {
        id: 7,
        name: "Amara Studio",
        genre: "Visual Art",
        location: "Dallas, TX",
        bio: "Abstract oil painter and digital illustrator capturing organic shapes and urban textures.",
        tags: "Visual Media, Fine Art, Oil Painting, Illustration, Dallas",
    },
    {
        id: 8,
        name: "Sage & Sound",
        genre: "Alternative",
        location: "Portland, OR",
        bio: "Ethereal dreampop and indie-electronic textures for introspective listeners.",
        tags: "Mixed-Media, Audio-Visual, Dreampop, Ambient, Electronic",
    },
    {
        id: 9,
        name: "William Waweru",
        genre: "Indie Folk",
        location: "Waco, TX",
        bio: "Acoustic storytelling, heartfelt guitar work, and community-driven indie sessions.",
        tags: "Music, Acoustic, Singer, Storyteller, Live Sessions",
    },
    {
        id: 10,
        name: "Mateo Cruz",
        genre: "Street Art",
        location: "Austin, TX",
        bio: "Large-scale urban murals, aerosol spray typography, and stencil graffiti blending street culture with gallery fine art.",
        tags: "Street Art / Graffiti, Murals, Spray Art, Urban Stencils, Austin",
    },
    {
        id: 11,
        name: "Kora Lin",
        genre: "Digital Art",
        location: "San Francisco, CA",
        bio: "Futuristic cyberpunk 3D motion graphics, procedural generative animations, and interactive shader art.",
        tags: "Digital Art, 3D Render, Motion Graphics, Generative Art",
    },
    {
        id: 12,
        name: "Elena Rostova",
        genre: "Photography",
        location: "New York, NY",
        bio: "Medium format film photography, street documentary portraiture, and architectural chiaroscuro.",
        tags: "Photography, Film Photography, 35mm, Documentary, Black & White",
    },
];

export async function fetchArtistById(id: number | string): Promise<Artist | null> {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    try {
        const res = await fetch(`${apiBase}/api/artists/${id}`, {
            signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
            return await res.json();
        }
    } catch {
        // Fallback to sample catalog if offline
    }
    const numId = Number(id);
    return SAMPLE_ARTISTS.find((a) => a.id === numId) || null;
}

export const SAMPLE_ARTIST_POSTS: ArtistPost[] = [
    {
        id: "post-ww-1",
        artistId: 9,
        authorName: "William Waweru",
        authorAvatar: "WW",
        text: "Late night acoustic session in the studio. Working on a new single exploring the Texas sunset and warm analog tape warmth. Here is a preview snapshot of the setup!",
        public: true,
        comments: true,
        createdAt: "2026-11-20T22:30:00Z",
        files: [
            {
                name: "acoustic-session-sunset.png",
                type: "image/png",
                data: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
            },
        ],
    },
    {
        id: "post-ww-2",
        artistId: 9,
        authorName: "William Waweru",
        authorAvatar: "WW",
        text: "Thank you to everyone who joined us for the Waco acoustic night! Grateful for this community and our shared love for grassroots storytelling.",
        public: true,
        comments: true,
        createdAt: "2026-11-18T19:15:00Z",
        files: [
            {
                name: "live-session-crowd.png",
                type: "image/png",
                data: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80",
            },
        ],
    },
    {
        id: "post-lp-1",
        artistId: 1,
        authorName: "Luna Park",
        authorAvatar: "LP",
        text: "New EP artwork unveiling: 'Hill Country Echoes'. Recorded live in a cedar cabin in Dripping Springs.",
        public: true,
        comments: true,
        createdAt: "2026-11-19T14:00:00Z",
        files: [
            {
                name: "ep-artwork.png",
                type: "image/png",
                data: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
            },
        ],
    },
];

export function getPostsForArtist(artistId: number): ArtistPost[] {
    if (typeof window === "undefined") {
        return SAMPLE_ARTIST_POSTS.filter((p) => p.artistId === artistId);
    }
    try {
        const stored = localStorage.getItem("artistconnect-ui-v2");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && Array.isArray(parsed.posts)) {
                const userPosts: ArtistPost[] = parsed.posts
                    .filter((p: { artistId?: number }) => !p.artistId || p.artistId === artistId)
                    .map((p: ArtistPost) => ({
                        ...p,
                        artistId: p.artistId || artistId,
                        authorName: p.authorName || (artistId === 9 ? "William Waweru" : "Artist"),
                        authorAvatar: p.authorAvatar || "WW",
                    }));
                const samples = SAMPLE_ARTIST_POSTS.filter((p) => p.artistId === artistId);
                const combined = [...userPosts, ...samples];
                const seen = new Set<string>();
                return combined.filter((p) => {
                    if (seen.has(p.id)) return false;
                    seen.add(p.id);
                    return true;
                });
            }
        }
    } catch {
        // Ignore parse error
    }
    return SAMPLE_ARTIST_POSTS.filter((p) => p.artistId === artistId);
}
