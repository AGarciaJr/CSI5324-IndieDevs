import type { UserPersona, Artist, LocalStore, EventItem } from "../types/index";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export const STORE_KEY = "artistconnect-ui-v2";
export const initialStore: LocalStore = { posts: [], follows: [], chats: {}, bookings: [] };

export const PERSONAS: UserPersona[] = [
    { id: 1, name: "Nicholas Nolen", role: "Fan", avatar: "NN", description: "Active Fan · Austin, TX" },
    { id: 2, name: "Jordan Smith", role: "Fan", avatar: "JS", description: "New Fan (0 interactions) · Waco, TX" },
    { id: 9, name: "William Waweru", role: "Artist", avatar: "WW", description: "Independent Artist · Waco, TX" },
    { id: 101, name: "Admin Alex", role: "Admin", avatar: "AA", description: "System Administrator (Reviewer 1)" },
    { id: 102, name: "Admin Garrett", role: "Admin", avatar: "AG", description: "System Administrator (Reviewer 2)" },
];

export const sampleArtists: Artist[] = [
    { id: 1, name: "Luna Park", genre: "Indie Folk", location: "Austin, TX", bio: "Intimate acoustic melodies...", tags: "Indie, Folk, Acoustic" },
    { id: 9, name: "William Waweru", genre: "Indie Folk", location: "Waco, TX", bio: "Acoustic storytelling...", tags: "Indie, Folk, Acoustic" },
    // ... rest of sample artists
];

export const emptyEventForm = (): Partial<EventItem> => ({
    artistId: 9,
    eventType: "Concert",
    title: "",
    description: "",
    eventDate: "",
    location: "",
    virtual: false,
    capacity: 100,
    imageUrl: "",
    status: "Published",
    reviewedAcknowledgment: false,
});