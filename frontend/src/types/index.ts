export type Role = "Fan" | "Artist" | "Admin";

export type UserPersona = {
    id: number;
    name: string;
    role: Role;
    avatar: string;
    description: string;
};

export type Artist = {
    id: number;
    name: string;
    genre: string;
    location: string;
    profileThumbnail?: string;
    bio?: string;
    tags?: string;
    suspended?: boolean;
    distanceKm?: number | null;
};

export type ArtistApplication = {
    id: number;
    fanId: number;
    applicantName: string;
    proposedGenre: string;
    portfolioLinks: string;
    status: string;
    submittedAt?: string;
};

export type EventItem = {
    id: number;
    artistId: number;
    eventType: string;
    title: string;
    description: string;
    eventDate: string;
    location: string;
    virtual: boolean;
    capacity: number | string;
    imageUrl?: string;
    ticketTiers?: string;
    status: string;
    reviewedAcknowledgment: boolean;
};

export type BanAppeal = {
    id: number;
    fanId: number;
    fanUsername: string;
    banningAdminId: number;
    banningAdminName: string;
    reason: string;
    offendingContent?: string;
    reportMaterial: string;
    aiRecommendation: string;
    status: "OPEN" | "APPROVED" | "INVALID";
    reviewNotes?: string;
    createdAt?: string;
};

export type RecommendationData = {
    hasInteractions: boolean;
    message: string;
    genreAffinityScores: Record<string, number>;
    recommendations: {
        artist: Artist;
        matchPercentage: number;
        matchingGenres: string[];
        reason: string;
        latentFeatureSummary: string;
    }[];
};

export type Post = {
    id: string;
    text: string;
    public: boolean;
    comments: boolean;
    files: { name: string; type: string; data: string; }[];
};

export type LocalStore = {
    posts: Post[];
    follows: number[];
    chats: Record<string, string[]>;
    bookings: { artistId: number; details: string }[];
};