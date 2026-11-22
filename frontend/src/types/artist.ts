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

export type ArtistEvent = {
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
};

export type MediaFile = {
    name: string;
    type: string;
    data: string;
};

export type ArtistPost = {
    id: string;
    artistId?: number;
    authorName?: string;
    authorAvatar?: string;
    text: string;
    public: boolean;
    comments: boolean;
    createdAt?: string;
    files?: MediaFile[];
    likesCount?: number;
};
