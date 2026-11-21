import { Artist } from "../types/artist";

export const SAMPLE_ARTISTS: Artist[] = [
    {
        id: 1,
        name: "Luna Park",
        genre: "Indie Folk",
        location: "Austin, TX",
        bio: "Intimate acoustic melodies and story-driven songwriting rooted in the Texas Hill Country.",
        tags: "Indie, Folk, Acoustic, Songwriter, Austin",
        profileThumbnail: "https://example.com/thumbnails/luna-park.jpg",
    },
    {
        id: 2,
        name: "The Riverbeds",
        genre: "Indie Rock",
        location: "Nashville, TN",
        bio: "Gritty guitars, driving drums, and energetic rock anthems from East Nashville.",
        tags: "Rock, Indie, Alternative, Nashville, Band",
    },
    {
        id: 3,
        name: "Marisol Vega",
        genre: "Latin Pop",
        location: "Miami, FL",
        bio: "Sun-soaked Latin rhythms blended with modern electronic synths and soulful bilingual vocals.",
        tags: "Latin, Pop, Electronic, Dance, Miami",
    },
    {
        id: 4,
        name: "Northside Brass",
        genre: "Jazz",
        location: "Chicago, IL",
        bio: "Classic Chicago brass quintet fusing traditional jazz standards with modern improv.",
        tags: "Jazz, Brass, Instrumental, Chicago, Improv",
    },
    {
        id: 5,
        name: "The Juniper Collective",
        genre: "Indie Folk",
        location: "Waco, TX",
        bio: "Harmonies, banjos, and campfire ballads created by a community of Central Texas artists.",
        tags: "Indie, Folk, Acoustic, Harmony, Texas",
    },
    {
        id: 6,
        name: "Miles Bennett",
        genre: "Jazz",
        location: "Austin, TX",
        bio: "Neo-soul saxophone player and producer creating smooth late-night soundscapes.",
        tags: "Jazz, Soul, Neo-Soul, Saxophone, Chill",
    },
    {
        id: 7,
        name: "Amara Studio",
        genre: "Visual Art",
        location: "Dallas, TX",
        bio: "Abstract oil painter and digital illustrator capturing organic shapes and urban textures.",
        tags: "Visual Art, Painting, Illustration, Dallas",
    },
    {
        id: 8,
        name: "Sage & Sound",
        genre: "Alternative",
        location: "Portland, OR",
        bio: "Ethereal dreampop and indie-electronic textures for introspective listeners.",
        tags: "Alternative, Dreampop, Ambient, Electronic",
    },
    {
        id: 9,
        name: "William Waweru",
        genre: "Indie Folk",
        location: "Waco, TX",
        bio: "Acoustic storytelling, heartfelt guitar work, and community-driven indie sessions.",
        tags: "Indie, Folk, Acoustic, Singer, Storyteller",
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
