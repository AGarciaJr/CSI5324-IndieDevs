"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    FanCommunityProvider,
    FollowButton,
    FollowingPanel,
    FanProfilePanel,
    FanReportsPanel,
    AdminReportsPanel,
} from "../fan-community";
import { useEffect, useState, type FormEvent } from "react";
import { Role, UserPersona, getBackendAccountId, getActorHomePage } from "../../lib/auth";
import { useAuth } from "../../context/AuthContext";
import { ArtistProfileView } from "../artist/ArtistProfileView";

type Artist = {
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

type ArtistApplication = {
    id: number;
    fanId: number;
    applicantName: string;
    proposedGenre: string;
    portfolioLinks: string;
    description?: string;
    status: string;
    submittedAt?: string;
};

type EventItem = {
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

type BanAppeal = {
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

type RecommendationData = {
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

type Post = {
    id: string;
    artistId?: number;
    authorName?: string;
    authorAvatar?: string;
    text: string;
    public: boolean;
    comments: boolean;
    createdAt?: string;
    files: {
        name: string;
        type: string;
        data: string;
    }[];
};

type UserWrapper = {
    users: (UserPersona | Artist)[];
};

type LocalStore = {
    posts: Post[];
    follows: number[];
    chats: Record<string, string[]>;
    bookings: { artistId: number; details: string }[];
};

const initialStore: LocalStore = { posts: [], follows: [], chats: {}, bookings: [] };

const sampleArtists: Artist[] = [
    { id: 1, name: "Luna Park", genre: "Indie Folk", location: "Austin, TX", bio: "Intimate acoustic melodies and story-driven songwriting rooted in the Texas Hill Country.", tags: "Music, Indie Folk, Acoustic, Songwriter, Austin" },
    { id: 2, name: "The Riverbeds", genre: "Indie Rock", location: "Nashville, TN", bio: "Gritty guitars, driving drums, and energetic rock anthems from East Nashville.", tags: "Music, Rock, Indie Rock, Nashville, Band" },
    { id: 3, name: "Marisol Vega", genre: "Latin Pop", location: "Miami, FL", bio: "Sun-soaked Latin rhythms blended with modern electronic synths and soulful bilingual vocals.", tags: "Music, Latin Pop, Electronic, Dance, Miami" },
    { id: 4, name: "Northside Brass", genre: "Jazz", location: "Chicago, IL", bio: "Classic Chicago brass quintet fusing traditional jazz standards with modern improv.", tags: "Music, Jazz, Brass, Chicago, Improv" },
    { id: 5, name: "The Juniper Collective", genre: "Indie Folk", location: "Waco, TX", bio: "Harmonies, banjos, and campfire ballads created by a community of Central Texas artists.", tags: "Music, Indie Folk, Banjo, Harmony, Texas" },
    { id: 6, name: "Miles Bennett", genre: "Jazz", location: "Austin, TX", bio: "Neo-soul saxophone player and producer creating smooth late-night soundscapes.", tags: "Music, Jazz, Neo-Soul, Saxophone, Chill" },
    { id: 7, name: "Amara Studio", genre: "Visual Art", location: "Dallas, TX", bio: "Abstract oil painter and digital illustrator capturing organic shapes and urban textures.", tags: "Visual Media, Fine Art, Oil Painting, Illustration, Dallas" },
    { id: 8, name: "Sage & Sound", genre: "Alternative", location: "Portland, OR", bio: "Ethereal dreampop and indie-electronic textures for introspective listeners.", tags: "Mixed-Media, Audio-Visual, Dreampop, Ambient, Electronic" },
    { id: 9, name: "William Waweru", genre: "Indie Folk", location: "Waco, TX", bio: "Acoustic storytelling, heartfelt guitar work, and community-driven indie sessions.", tags: "Music, Acoustic, Singer, Storyteller, Live Sessions" },
    { id: 10, name: "Mateo Cruz", genre: "Street Art", location: "Austin, TX", bio: "Large-scale urban murals, aerosol spray typography, and stencil graffiti blending street culture with gallery fine art.", tags: "Street Art / Graffiti, Murals, Spray Art, Urban Stencils, Austin" },
    { id: 11, name: "Kora Lin", genre: "Digital Art", location: "San Francisco, CA", bio: "Futuristic cyberpunk 3D motion graphics, procedural generative animations, and interactive shader art.", tags: "Digital Art, 3D Render, Motion Graphics, Generative Art" },
    { id: 12, name: "Elena Rostova", genre: "Photography", location: "New York, NY", bio: "Medium format film photography, street documentary portraiture, and architectural chiaroscuro.", tags: "Photography, Film Photography, 35mm, Documentary, Black & White" },
];

const emptyEventForm = (): Partial<EventItem> => ({
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const STORE_KEY = "artistconnect-ui-v2";

interface ArtistConnectWorkspaceProps {
    currentPath?: string;
    initialFlashLogin?: boolean;
    guestRole?: Role;
}

export function ArtistConnectWorkspace({ currentPath, initialFlashLogin, guestRole }: ArtistConnectWorkspaceProps) {
    const { currentUser, login, logout } = useAuth();
    return (
        <ArtistConnectWorkspaceInner
            currentUser={currentUser}
            login={login}
            logout={logout}
            currentPath={currentPath}
            initialFlashLogin={initialFlashLogin}
            guestRole={guestRole}
        />
    );
}

interface InnerWorkspaceProps {
    currentUser: UserPersona | null;
    login: (username: string, password?: string, requiredRole?: Role) => { success: boolean; error?: string };
    logout: () => void;
    currentPath?: string;
    initialFlashLogin?: boolean;
    guestRole?: Role;
}

function ArtistConnectWorkspaceInner({ currentUser, login, logout, currentPath, initialFlashLogin, guestRole }: InnerWorkspaceProps) {
    const router = useRouter();

    const isGuest = !currentUser;
    const guestPersona: UserPersona = {
        id: 0,
        username: "guest",
        email: "guest@test.com",
        name: "Guest Visitor",
        role: guestRole || "Fan",
        avatar: "?",
        description: "Guest Visitor",
    };
    const effectiveUser: UserPersona = currentUser || guestPersona;
    const backendAccountId = currentUser ? getBackendAccountId(currentUser) : 0;

    // Flash Login Modal state
    const [showLoginModal, setShowLoginModal] = useState(() => (isGuest && (initialFlashLogin ?? true)));
    const [loginModalMessage, setLoginModalMessage] = useState("");
    const [modalRole, setModalRole] = useState<Role>(guestRole || "Fan");
    const [modalUsername, setModalUsername] = useState("");
    const [modalPassword, setModalPassword] = useState("");
    const [modalError, setModalError] = useState("");
    const [modalNotice, setModalNotice] = useState("");

    function triggerGuestLogin(message: string, role: Role = "Fan") {
        setModalRole(role);
        setLoginModalMessage(message);
        setModalError("");
        setModalNotice("");
        setShowLoginModal(true);
    }

    function handleModalLogin(e: FormEvent) {
        e.preventDefault();
        setModalError("");
        setModalNotice("");

        if (!modalUsername.trim()) {
            setModalError("Please enter your username.");
            return;
        }

        const result = login(modalUsername.trim(), modalPassword, modalRole);
        if (result.success) {
            setModalNotice(`Signed in as ${modalUsername}! Redirecting…`);
            setTimeout(() => {
                setShowLoginModal(false);
                if (currentPath === "/fan" || currentPath === "/artist" || currentPath === "/") {
                    router.push(getActorHomePage(modalRole));
                }
            }, 300);
        } else {
            setModalError(result.error || `Invalid credentials for ${modalRole} sign in.`);
        }
    }

    // Active Navigation Tab
    const [tab, setTab] = useState(() => (currentUser?.role === "Artist" ? "Artist Home" : currentUser?.role === "Admin" ? "Ban Appeals" : "Discover"));

    // General app state
    const [store, setStore] = useState<LocalStore>(initialStore);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    // Discover Tab State
    const [criteria, setCriteria] = useState({ name: "", genre: "", location: "" });
    const [artistResults, setArtistResults] = useState<Artist[]>(sampleArtists);
    const [busySearch, setBusySearch] = useState(false);
    const [searched, setSearched] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string>("All Tags");
    const source = "api";
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

    const ARTIST_TAG_FILTERS = [
        "All Tags",
        "Music",
        "Visual Media",
        "Mixed-Media",
        "Street Art / Graffiti",
        "Digital Art",
        "Photography",
    ] as const;

    function handleTagFilter(tag: string) {
        setSelectedTag(tag);
        if (tag === "All Tags") {
            setArtistResults(sampleArtists);
            setSearched(false);
            return;
        }
        const filtered = sampleArtists.filter((a) => {
            const t = (a.tags || "").toLowerCase();
            const g = (a.genre || "").toLowerCase();
            const query = tag.toLowerCase();
            if (query === "street art / graffiti") {
                return t.includes("street art") || t.includes("graffiti") || t.includes("mural");
            }
            if (query === "visual media") {
                return t.includes("visual") || t.includes("painting") || t.includes("illustration") || g.includes("visual");
            }
            if (query === "mixed-media") {
                return t.includes("mixed-media") || t.includes("audio-visual") || g.includes("alternative");
            }
            if (query === "photography") {
                return t.includes("photography") || t.includes("photo") || g.includes("photo");
            }
            if (query === "digital art") {
                return t.includes("digital") || t.includes("3d") || g.includes("digital");
            }
            if (query === "music") {
                return t.includes("music") || (!t.includes("visual") && !t.includes("photo") && !t.includes("digital") && !t.includes("street"));
            }
            return t.includes(query) || g.includes(query);
        });
        setArtistResults(filtered);
        setSearched(true);
    }

    // Settings Tab State
    const [settings, setSettings] = useState(() => {
        if (typeof window !== "undefined") {
            try {
                const s = localStorage.getItem("artistconnect-settings");
                if (s) return JSON.parse(s);
            } catch {}
        }
        return {
            nickname: currentUser?.name || "Member",
            bio: "Community supporter and music lover.",
            messagingPermission: "everyone",
            theme: "dark",
            emailNotifications: true,
            allowCommentsOnPosts: true,
        };
    });

    useEffect(() => {
        if (typeof document !== "undefined") {
            if (settings.theme === "light") {
                document.body.classList.add("light-theme");
            } else {
                document.body.classList.remove("light-theme");
            }
        }
    }, [settings.theme]);

    function handleSaveSettings(e: FormEvent) {
        e.preventDefault();
        try {
            localStorage.setItem("artistconnect-settings", JSON.stringify(settings));
            setNotice("Settings updated successfully! Preferences saved.");
        } catch {
            setError("Could not save settings to local storage.");
        }
    }

    // Make a Post Tab State
    const [postText, setPostText] = useState("");
    const [isPublic, setPublic] = useState(true);
    const [commentsAllowed, setCommentsAllowed] = useState(true);
    const [mediaFiles, setMediaFiles] = useState<{ name: string; type: string; data: string }[]>([]);
    const [mediaUrlInput, setMediaUrlInput] = useState("");

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = event.target?.result as string;
                setMediaFiles((prev) => [
                    ...prev,
                    { name: file.name, type: file.type || "image/png", data },
                ]);
            };
            reader.readAsDataURL(file);
        });
    }

    function handleAddMediaUrl() {
        if (!mediaUrlInput.trim()) return;
        const url = mediaUrlInput.trim();
        const isAudio = /\.(mp3|wav|ogg|m4a)($|\?)/i.test(url);
        const isVideo = /\.(mp4|webm|mov)($|\?)/i.test(url);
        const type = isAudio ? "audio/mpeg" : isVideo ? "video/mp4" : "image/jpeg";
        setMediaFiles((prev) => [
            ...prev,
            { name: url.split("/").pop() || "media-attachment", type, data: url },
        ]);
        setMediaUrlInput("");
    }

    // Use Case 3: Admin Verifications State
    const [applicationsList, setApplicationsList] = useState<ArtistApplication[]>([]);
    const [recFormatFilter, setRecFormatFilter] = useState("All Formats");
    const [loadingApps, setLoadingApps] = useState(false);

    // Use Case 1: Update Event State (Artist)
    const [eventsList, setEventsList] = useState<EventItem[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [eventSubTab, setEventSubTab] = useState<"list" | "edit" | "create">("list");
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [eventForm, setEventForm] = useState<Partial<EventItem>>(emptyEventForm());
    const [eventFormErrors, setEventFormErrors] = useState<Record<string, string>>({});
    const [showReviewStep, setShowReviewStep] = useState(false);

    // Use Case 2: Unban Fan State (Admin)
    const [appealsList, setAppealsList] = useState<BanAppeal[]>([]);
    const [selectedAppeal, setSelectedAppeal] = useState<BanAppeal | null>(null);
    const [adminNotes, setAdminNotes] = useState("");
    const [loadingAppeals, setLoadingAppeals] = useState(false);
    const [appealsViewMode, setAppealsViewMode] = useState<"eligible" | "all">("eligible");

    // Use Case 3: Receive Recommendation State (Fan)
    const [recommendationData, setRecommendationData] = useState<RecommendationData | null>(null);
    const [loadingRecs, setLoadingRecs] = useState(false);

    // Message states
    const [recipientId, setRecipientId] = useState(0);
    const [messageText, setMessageText] = useState("");

    // Initialize local storage store & verify backend connection
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                const saved = localStorage.getItem(STORE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && Array.isArray(parsed.posts)) {
                        setStore(parsed);
                    }
                }
            } catch {
                // ignore
            }
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    // When active persona or tab changes, load appropriate data
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentUser?.role === "Fan") {
                if (["Manage Events", "Ban Appeals", "Report Queue", "Artist Directory", "Verifications", "Make a post"].includes(tab)) {
                    setTab("Recommendations");
                }
            } else if (currentUser?.role === "Artist") {
                if (["Ban Appeals", "Report Queue", "Artist Directory", "Verifications"].includes(tab)) {
                    setTab("Artist Home");
                }
            } else if (currentUser?.role === "Admin") {
                if (["Artist Home", "Recommendations", "Manage Events", "Make a post", "Discover", "Following", "Fan Profile", "Fan Reports"].includes(tab)) {
                    setTab("Ban Appeals");
                }
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [currentUser, tab]);

    // Load recommendations when on Recommendations tab or member changes
    useEffect(() => {
        if (tab === "Recommendations" && (currentUser?.role === "Fan" || currentUser?.role === "Artist")) {
            loadRecommendations(backendAccountId);
        }
    }, [tab, currentUser, backendAccountId]);

    useEffect(() => {
        const refresh = () => {
            if (currentUser?.role === "Fan" && tab === "Recommendations") {
                void loadRecommendations(backendAccountId);
            }
        };
        window.addEventListener("fan-community-changed", refresh);
        return () => window.removeEventListener("fan-community-changed", refresh);
    }, [currentUser, tab, backendAccountId]);

    // Load events when on Manage Events tab
    useEffect(() => {
        if (tab === "Manage Events") {
            loadEvents();
        }
    }, [tab]);

    // Load appeals when on Ban Appeals tab
    useEffect(() => {
        if (tab === "Ban Appeals" && currentUser?.role === "Admin") {
            loadAppeals();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, currentUser, appealsViewMode]);

    // Keep both the fan/artist discovery page and the admin moderation directory populated.
    useEffect(() => {
        if (tab === "Discover") {
            loadDiscoverArtists();
        } else if (tab === "Artist Directory" && currentUser?.role === "Admin") {
            const controller = new AbortController();
            fetch(`${API_BASE}/api/artists?includeSuspended=true`, { signal: controller.signal })
                .then(async (response) => {
                    if (!response.ok) throw new Error();
                    setArtistResults(await response.json());
                })
                .catch(() => {
                    if (!controller.signal.aborted) setError("Could not load the artist moderation directory. Please try again.");
                });
            return () => controller.abort();
        }
    }, [tab, currentUser, source]);

    // Load pending applications when on Verifications tab (Admin)
    useEffect(() => {
        if (tab === "Verifications" && currentUser?.role === "Admin") {
            loadApplications();
        }
    }, [tab, currentUser]);

    function persistStore(next: LocalStore) {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify(next));
            setStore(next);
            return true;
        } catch {
            return false;
        }
    }

    // ----------------------------------------------------
    // API CALLS: Recommendations (Use Case 3)
    // ----------------------------------------------------
    async function loadRecommendations(fanId: number) {
        setLoadingRecs(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/api/recommendations/fan/${fanId}`);
            if (!res.ok) throw new Error("Failed to load recommendations");
            const data: RecommendationData = await res.json();
            setRecommendationData(data);
        } catch {
            // Fallback if recommendations service is unavailable
            setRecommendationData({
                hasInteractions: fanId === 1,
                message:
                    fanId === 1
                        ? "Personalized recommendations computed from your platform interactions."
                        : "Welcome! You haven't interacted with any artists yet.",
                genreAffinityScores: fanId === 1 ? { "Indie Folk": 75.0, Jazz: 25.0 } : {},
                recommendations: sampleArtists.map((a, i) => ({
                    artist: a,
                    matchPercentage: 95 - i * 4,
                    matchingGenres: [a.genre],
                    reason: `Matched based on ${a.genre} affinity.`,
                    latentFeatureSummary: `Latent profile: [${a.genre} Affinity: High]`,
                })),
            });
        } finally {
            setLoadingRecs(false);
        }
    }

    async function recordFanInteraction(artistId: number, type: string) {
        if (!currentUser || currentUser.role !== "Fan") return;
        try {
            await fetch(
                `${API_BASE}/api/recommendations/interactions?fanId=${backendAccountId}&artistId=${artistId}&interactionType=${type}`,
                {
                    method: "POST",
                }
            );
            loadRecommendations(backendAccountId);
        } catch {
            // ignore offline
        }
    }

    async function clearFanInteractions() {
        if (!currentUser || currentUser.role !== "Fan") return;
        try {
            await fetch(`${API_BASE}/api/recommendations/interactions/fan/${backendAccountId}`, {
                method: "DELETE",
            });
            setNotice("Interaction history cleared! You are now experiencing the New Fan (cold-start) view.");
            loadRecommendations(backendAccountId);
        } catch {
            setError("Could not clear interactions on backend.");
        }
    }

    // ----------------------------------------------------
    // API CALLS: Events & Update Event (Use Case 1)
    // ----------------------------------------------------
    async function loadEvents() {
        setLoadingEvents(true);
        try {
            const res = await fetch(`${API_BASE}/api/events`);
            if (!res.ok) throw new Error("Failed to load events");
            const data: EventItem[] = await res.json();
            setEventsList(data);
        } catch {
            // Fallback
            setEventsList([
                {
                    id: 1,
                    artistId: 9,
                    eventType: "Concert",
                    title: "Waco Acoustic Night",
                    description: "An intimate evening of acoustic songs and storytelling at Common Grounds in Waco.",
                    eventDate: "2026-11-15T19:30:00",
                    location: "Common Grounds, Waco, TX",
                    virtual: false,
                    capacity: 120,
                    status: "Published",
                    reviewedAcknowledgment: true,
                },
                {
                    id: 2,
                    artistId: 9,
                    eventType: "Workshop",
                    title: "Songwriting from the Heart",
                    description: "Hands-on interactive lyric writing and song arrangement workshop for local independent artists.",
                    eventDate: "2026-12-05T14:00:00",
                    location: "Downtown Cultural Arts Center, Waco, TX",
                    virtual: false,
                    capacity: 35,
                    status: "Draft",
                    reviewedAcknowledgment: true,
                },
            ]);
        } finally {
            setLoadingEvents(false);
        }
    }

    function startEditEvent(ev: EventItem) {
        setEditingEventId(ev.id);
        setEventForm({
            ...ev,
            eventDate: ev.eventDate ? ev.eventDate.substring(0, 16) : "",
            reviewedAcknowledgment: false,
        });
        setEventFormErrors({});
        setShowReviewStep(false);
        setEventSubTab("edit");
        setNotice("");
        setError("");
    }

    function startCreateEvent() {
        setEditingEventId(null);
        setEventForm({
            ...emptyEventForm(),
            artistId: currentUser?.id === 9 ? 9 : 1,
        });
        setEventFormErrors({});
        setShowReviewStep(false);
        setEventSubTab("create");
        setNotice("");
        setError("");
    }

    function validateEventForm(): boolean {
        const errors: Record<string, string> = {};
        if (!eventForm.title || !eventForm.title.trim()) {
            errors.title = "Event title cannot be empty.";
        }
        if (!eventForm.eventType || !eventForm.eventType.trim()) {
            errors.eventType = "Event type cannot be empty.";
        }
        if (!eventForm.description || !eventForm.description.trim()) {
            errors.description = "Event description cannot be empty.";
        }
        if (!eventForm.eventDate) {
            errors.eventDate = "Choose an event date and time.";
        }
        if (!eventForm.location || !eventForm.location.trim()) {
            errors.location = eventForm.virtual ? "Provide a virtual streaming URL." : "Provide a venue location.";
        }
        if (!eventForm.capacity || Number(eventForm.capacity) < 1) {
            errors.capacity = "Capacity must be at least 1 attendee.";
        }
        setEventFormErrors(errors);
        return Object.keys(errors).length === 0;
    }

    function handleReviewStep() {
        setError("");
        if (!validateEventForm()) {
            setError("Please fill out all required event fields before proceeding to review.");
            return;
        }
        setShowReviewStep(true);
    }

    async function submitUpdateEvent() {
        setError("");
        setNotice("");

        // Check review acknowledgment
        if (!eventForm.reviewedAcknowledgment) {
            setError("Please acknowledge you have reviewed the details of your event submission before submitting.");
            return;
        }

        try {
            const payload = {
                artistId: eventForm.artistId || currentUser?.id || 9,
                eventType: eventForm.eventType,
                title: eventForm.title,
                description: eventForm.description,
                eventDate: eventForm.eventDate ? new Date(eventForm.eventDate).toISOString() : new Date().toISOString(),
                location: eventForm.location,
                virtual: !!eventForm.virtual,
                capacity: Number(eventForm.capacity),
                imageUrl: eventForm.imageUrl || "",
                status: eventForm.status || "Published",
                reviewedAcknowledgment: true,
            };

            const res = await fetch(`${API_BASE}/api/events/${editingEventId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Id": String(backendAccountId),
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to update event on backend.");
            }

            const updated = await res.json();
            setNotice(`Success! Event "${updated.title}" has been updated and is live on your profile.`);
            setEventSubTab("list");
            loadEvents();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Failed to update event: ${msg}`);
        }
    }

    async function submitCreateEvent() {
        setError("");
        setNotice("");

        if (!validateEventForm()) {
            setError("Please correct the errors before submitting.");
            return;
        }

        try {
            const payload = {
                artistId: currentUser?.id === 9 ? 9 : 1,
                eventType: eventForm.eventType,
                title: eventForm.title,
                description: eventForm.description,
                eventDate: eventForm.eventDate ? new Date(eventForm.eventDate).toISOString() : new Date().toISOString(),
                location: eventForm.location,
                virtual: !!eventForm.virtual,
                capacity: Number(eventForm.capacity),
                imageUrl: eventForm.imageUrl || "",
                status: eventForm.status || "Published",
                reviewedAcknowledgment: true,
            };

            const res = await fetch(`${API_BASE}/api/events`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Id": String(backendAccountId),
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error("Failed to create event on backend.");
            }

            const created = await res.json();
            setNotice(`Event "${created.title}" successfully created and saved to database!`);
            setEventSubTab("list");
            loadEvents();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Failed to create event: ${msg}`);
        }
    }

    // ----------------------------------------------------
    // API CALLS: Moderation & Unban Fan (Use Case 2)
    // ----------------------------------------------------
    async function loadAppeals() {
        setLoadingAppeals(true);
        setError("");
        try {
            const url =
                appealsViewMode === "eligible"
                    ? `${API_BASE}/api/moderation/appeals/open?adminId=${effectiveUser.id}`
                    : `${API_BASE}/api/moderation/appeals`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch ban appeals");
            const data: BanAppeal[] = await res.json();
            setAppealsList(data);
            if (data.length > 0 && (!selectedAppeal || !data.some((a) => a.id === selectedAppeal.id))) {
                setSelectedAppeal(data[0]);
            } else if (data.length === 0) {
                setSelectedAppeal(null);
            }
        } catch {
            // Fallback
            setAppealsList([
                {
                    id: 1,
                    fanId: 3,
                    fanUsername: "cosmic_surfer",
                    banningAdminId: 101,
                    banningAdminName: "Admin Alex",
                    reason: "I was banned for alleged spam, but I was just excited about the album drop and my browser lagged sending duplicate comments.",
                    offendingContent: "some sentence breaking ToS",
                    reportMaterial: "Report #104: 4 identical messages posted in 8 seconds under Marisol Vega preview.",
                    aiRecommendation:
                        "AI ToS Evaluation (ToS §3.2 - Automated Activity): Timestamp analysis confirms sub-second duplicate submission matching network packet retry or client lag. Recommendation: Lift ban; fan account in good standing prior to incident.",
                    status: "OPEN",
                },
                {
                    id: 2,
                    fanId: 4,
                    fanUsername: "beats_by_dre77",
                    banningAdminId: 102,
                    banningAdminName: "Admin Garrett",
                    reason: "I got into a heated debate about audio mixing styles. I got frustrated, but didn't threaten anyone and promise to keep comments respectful.",
                    offendingContent: "some sentence breaking ToS",
                    reportMaterial: "Report #112: Aggressive language and insults directed at another commenter regarding audio mastering quality.",
                    aiRecommendation:
                        "AI ToS Evaluation (ToS §5.1 - Community Conduct): Language violates civility guidelines. Second infraction. Recommendation: Admin discretion; consider 7-day temporary suspension instead of permanent ban.",
                    status: "OPEN",
                },
            ]);
        } finally {
            setLoadingAppeals(false);
        }
    }

    async function handleUnbanFan(appealId: number) {
        setError("");
        setNotice("");
        try {
            const res = await fetch(
                `${API_BASE}/api/moderation/appeals/${appealId}/unban?adminId=${effectiveUser.id}&notes=${encodeURIComponent(adminNotes || "Reviewed and approved by admin.")}`,
                {
                    method: "POST",
                }
            );
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Could not unban fan.");
            }
            const updated: BanAppeal = await res.json();
            setNotice(`Success! Fan @${updated.fanUsername} has been unbanned and restored login access.`);
            setAdminNotes("");
            loadAppeals();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Moderation action rejected: ${msg}`);
        }
    }

    async function handleInvalidateAppeal(appealId: number) {
        setError("");
        setNotice("");
        try {
            const res = await fetch(
                `${API_BASE}/api/moderation/appeals/${appealId}/invalidate?adminId=${effectiveUser.id}&notes=${encodeURIComponent(adminNotes || "Marked invalid per policy.")}`,
                {
                    method: "POST",
                }
            );
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Could not invalidate appeal.");
            }
            const updated: BanAppeal = await res.json();
            setNotice(`Appeal #${updated.id} marked INVALID. Ban is upheld and user @${updated.fanUsername}'s ability to submit further appeals has been revoked.`);
            setAdminNotes("");
            loadAppeals();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Moderation action rejected: ${msg}`);
        }
    }

    async function handleSuspendArtist(artistId: number) {
        setError("");
        setNotice("");
        if (!confirm("Are you sure you want to suspend this artist? This will hide their profile.")) return;

        try {
            const res = await fetch(`${API_BASE}/api/moderation/artists/${artistId}/suspend`, {
                method: "PUT",
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Could not suspend artist.");
            }

            setNotice(`Success! Artist ID ${artistId} has been suspended.`);
            const refreshRes = await fetch(`${API_BASE}/api/artists/search?`);
            if (refreshRes.ok) {
                setArtistResults(await refreshRes.json());
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Suspension failed: ${msg}`);
        }
    }

    async function loadApplications() {
        setLoadingApps(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/api/moderation/applications/pending`);
            let list: ArtistApplication[] = [];
            if (res.ok) {
                list = await res.json();
            }
            if (typeof window !== "undefined") {
                const local = localStorage.getItem("artistconnect-pending-applications");
                if (local) {
                    try {
                        const localApps: ArtistApplication[] = JSON.parse(local);
                        const seen = new Set(list.map((a) => a.id));
                        localApps.forEach((a) => {
                            if (!seen.has(a.id)) list.push(a);
                        });
                    } catch {}
                }
            }
            setApplicationsList(list);
        } catch {
            setApplicationsList([]);
        } finally {
            setLoadingApps(false);
        }
    }

    async function handleApproveApplication(appId: number, applicantName: string) {
        setError("");
        setNotice("");
        try {
            const res = await fetch(`${API_BASE}/api/moderation/applications/${appId}/approve`, { method: "PUT" });
            if (!res.ok) throw new Error("Failed to approve application");
            setNotice(`Success! ${applicantName} has been verified and their Artist profile is provisioned.`);
            loadApplications();
        } catch (err: unknown) {
            setError(`Approval failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    async function handleRejectApplication(appId: number, applicantName: string) {
        setError("");
        setNotice("");
        if (!confirm(`Are you sure you want to reject ${applicantName}'s application?`)) return;
        try {
            const res = await fetch(`${API_BASE}/api/moderation/applications/${appId}/reject`, { method: "PUT" });
            if (!res.ok) throw new Error("Failed to reject application");
            setNotice(`Application for ${applicantName} marked as REJECTED.`);
            loadApplications();
        } catch (err: unknown) {
            setError(`Rejection failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    async function loadDiscoverArtists() {
        if (source !== "api") return;
        setBusySearch(true);
        try {
            const res = await fetch(`${API_BASE}/api/artists`);
            if (res.ok) {
                setArtistResults(await res.json());
                setSearched(false);
            }
        } catch {
            // Fail silently on network errors
        } finally {
            setBusySearch(false);
        }
    }

    // ----------------------------------------------------
    // Artist Search (Discover Tab)
    // ----------------------------------------------------
    async function handleSearch(e: FormEvent) {
        e.preventDefault();
        setError("");
        if (!Object.values(criteria).some((v) => v.trim())) {
            setError("Enter a name, genre, or location to search.");
            return;
        }
        setBusySearch(true);
        try {
            if (source === "api") {
                const params = new URLSearchParams(
                    Object.entries(criteria)
                        .filter(([, v]) => v.trim())
                        .map(([k, v]) => [k, v.trim()])
                );
                const url = currentUser?.role === "Fan" ? `${API_BASE}/api/artists/search?${params}` : `${API_BASE}/api/artists`;
                const headers: Record<string, string> = {};
                if (backendAccountId > 0) headers["X-User-Id"] = String(backendAccountId);
                const res = await fetch(url, { headers });
                if (!res.ok) throw new Error();
                const found: Artist[] = await res.json();
                setArtistResults(
                    currentUser?.role === "Fan"
                        ? found
                        : found.filter((a) =>
                              Object.entries(criteria).every(
                                  ([key, value]) =>
                                      !value.trim() ||
                                      String(a[key as keyof Artist])
                                          .toLowerCase()
                                          .includes(value.trim().toLowerCase())
                              )
                          )
                );
            } else {
                const filtered = sampleArtists.filter((a) =>
                    Object.entries(criteria).every(
                        ([k, v]) => !v.trim() || String(a[k as keyof Artist]).toLowerCase().includes(v.trim().toLowerCase())
                    )
                );
                setArtistResults(filtered);
            }
            setSearched(true);
        } catch {
            setError("Search service unavailable. Ensure backend is running at localhost:8080.");
        } finally {
            setBusySearch(false);
        }
    }

    function handlePublishPost(e: FormEvent) {
        e.preventDefault();
        if (!postText.trim() && mediaFiles.length === 0) {
            setError("Please write some text or attach media before publishing.");
            return;
        }
        const newPost: Post = {
            id: crypto.randomUUID(),
            artistId: effectiveUser.role === "Artist" ? effectiveUser.id : undefined,
            authorName: effectiveUser.name,
            authorAvatar: effectiveUser.avatar,
            text: postText.trim(),
            public: isPublic,
            comments: commentsAllowed,
            createdAt: new Date().toISOString(),
            files: mediaFiles,
        };
        persistStore({ ...store, posts: [newPost, ...store.posts] });
        setPostText("");
        setMediaFiles([]);
        setNotice("Your creative post has been published to your artist feed!");
        if (effectiveUser.role === "Artist") {
            setTab("Artist Home");
        }
    }

    async function startConversation(e: FormEvent) {
        e.preventDefault();
        try {
            if (!currentUser) return;
            const recipient_res = await fetch(`${API_BASE}/api/artists/${recipientId}`);
            if (!recipient_res.ok) throw new Error("Could not find recipient.");
            const recipient = await recipient_res.json();

            const userWrapper: UserWrapper = {
                users: [currentUser, recipient],
            };

            await fetch(`${API_BASE}/api/conversations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userWrapper),
            });
        } catch {}
    }

    const navItems = isGuest
        ? [
              { label: "Discover", icon: "", tabName: "Discover" },
              { label: "Following", icon: "", tabName: "Following" },
              { label: "For You", icon: "", tabName: "Recommendations" },
          ]
        : currentUser.role === "Fan"
        ? [
              { label: "For You", icon: "", tabName: "Recommendations" },
              { label: "Discover", icon: "", tabName: "Discover" },
              { label: "Following", icon: "", tabName: "Following" },
              { label: "My Profile", icon: "", tabName: "Fan Profile" },
              { label: "Settings", icon: "", tabName: "Settings" },
          ]
        : currentUser.role === "Artist"
        ? [
              { label: "My Profile", icon: "", tabName: "Artist Home" },
              { label: "For You", icon: "", tabName: "Recommendations" },
              { label: "Discover", icon: "", tabName: "Discover" },
              { label: "Following", icon: "", tabName: "Following" },
              { label: "Create Post", icon: "", tabName: "Make a post" },
              { label: "Manage Events", icon: "", tabName: "Manage Events" },
              { label: "Messages", icon: "", tabName: "Messages" },
              { label: "Settings", icon: "", tabName: "Settings" },
          ]
        : [
              { label: "Ban Appeals", icon: "", tabName: "Ban Appeals" },
              { label: "Artist Directory", icon: "", tabName: "Artist Directory" },
              { label: "Verifications", icon: "", tabName: "Verifications" },
              { label: "Report Queue", icon: "", tabName: "Report Queue" },
          ];

    return (
        <FanCommunityProvider key={`${backendAccountId}-${isGuest ? "Guest" : currentUser.role}`} accountId={backendAccountId} role={isGuest ? "Guest" : currentUser.role}>
            <div className="app-shell">
                {/* SIDEBAR */}
                <aside>
                    <Link className="brand" href="/">
                        a<span>ArtistConnect</span><i>●</i>
                    </Link>

                    {/* AUTHENTICATED USER PROFILE OR GUEST CARD */}
                    {isGuest ? (
                        <div
                            className="account-switcher"
                            style={{
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid var(--line-strong)",
                                backdropFilter: "blur(16px)",
                                borderRadius: "12px",
                                padding: "14px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                                boxShadow: "var(--glass-specular), 0 8px 20px rgba(0,0,0,0.4)",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div
                                    className="avatar"
                                    style={{
                                        background: "linear-gradient(135deg, rgba(6, 182, 212, 0.35), rgba(244, 63, 94, 0.35))",
                                        border: "1px solid var(--spray-cyan)",
                                        color: "#ffffff",
                                        fontWeight: 800,
                                        fontSize: "14px",
                                        boxShadow: "0 0 12px rgba(6, 182, 212, 0.4)",
                                    }}
                                >
                                    ?
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <b style={{ display: "block", fontSize: "13px", color: "#ffffff", fontWeight: 700 }}>Guest Fan</b>
                                    <small style={{ color: "var(--ink-secondary)", fontSize: "11px", display: "block", marginTop: "2px" }}>Browsing artists</small>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="primary"
                                onClick={() => triggerGuestLogin("Sign in to follow creators, save favorites, and interact with the community.")}
                                style={{ width: "100%", padding: "8px 12px", fontSize: "12px", textAlign: "center", fontWeight: 700 }}
                            >
                                Sign In / Register →
                            </button>
                        </div>
                    ) : (
                        <div
                            className="account-switcher"
                            style={{
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid var(--line-strong)",
                                backdropFilter: "blur(16px)",
                                borderRadius: "12px",
                                padding: "14px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                                boxShadow: "var(--glass-specular), 0 8px 20px rgba(0,0,0,0.4)",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div className="avatar">{currentUser.avatar}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "13px", color: "#ffffff", fontWeight: 700 }}>
                                        {currentUser.name}
                                    </b>
                                    <span className={`role-badge ${currentUser.role.toLowerCase()}`} style={{ marginTop: "4px", display: "inline-block" }}>
                                        {currentUser.role}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                    logout();
                                    router.push(currentUser.role === "Admin" ? "/admin" : "/login");
                                }}
                                style={{ width: "100%", padding: "6px 8px", fontSize: "11px", textAlign: "center" }}
                                title="Sign out of your session"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}

                    <p className="nav-label">
                        {isGuest ? "FAN DISCOVERY" : `${currentUser.role.toUpperCase()} WORKSPACE`}
                    </p>

                    <nav>
                        {navItems.map((item) => (
                            <button
                                key={item.tabName}
                                className={tab === item.tabName ? "active" : ""}
                                onClick={() => {
                                    setTab(item.tabName);
                                    setError("");
                                    setNotice("");
                                }}
                            >
                                {item.icon ? <span>{item.icon}</span> : null}{item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="sidebar-note">
                        
                        <h3>Good art starts<br />with connection.</h3>
                        <p>Designed for independent artists, fans, and administrators.</p>
                    </div>
                </aside>

                {/* MAIN WORKSPACE */}
                <div className="workspace">
                    <header>
                        <span>ArtistConnect · The Independent Music & Art Community</span>
                    </header>

                    <main>
                        <div className="eyebrow">
                            {isGuest ? "BROWSING AS GUEST VISITOR" : `LOGGED IN AS ${currentUser.name.toUpperCase()} (${currentUser.role.toUpperCase()})`}
                        </div>

                        <div className="page-heading">
                            <div>
                                <h1>
                                    {tab === "Artist Home" && "Your creative sanctuary."}
                                    {tab === "Settings" && "Customize your workspace."}
                                    {tab === "Following" && "Your creative community."}
                                    {tab === "Fan Profile" && "Make yourself at home."}
                                    {tab === "Fan Reports" && "Help keep the community safe."}
                                    {tab === "Report Queue" && "Community report review."}
                                    {tab === "Recommendations" && "Tailored for your sound."}
                                    {tab === "Discover" && "Find your next inspiration."}
                                    {tab === "Make a post" && "Let your work speak."}
                                    {tab === "Manage Events" && "Curate your live shows."}
                                    {tab === "Ban Appeals" && "Moderation & appeal reviews."}
                                </h1>
                                <p>
                                    {tab === "Artist Home" && "Your continuous feed of live events, exhibitions, and media-rich creative posts."}
                                    {tab === "Settings" && "Manage who can message you, change your display nickname, and customize light vs dark appearance."}
                                    {tab === "Recommendations" && "Personalized artist matches constructed from your platform interaction history and genre affinities."}
                                    {tab === "Discover" && "Discover independent artists, view profiles, and engage with emerging communities."}
                                    {tab === "Make a post" && "Share your art, creative process, and multimedia updates with your community."}
                                    {tab === "Manage Events" && "Create, review, and update your upcoming concerts, workshops, and exhibitions."}
                                    {tab === "Ban Appeals" && "Review fan ban appeals, inspect report evidence, and evaluate automated AI Terms of Service recommendations."}
                                </p>
                            </div>
                        </div>

                        {notice && <div className="notice" role="status">{notice}</div>}
                        {error && <div className="error" role="alert">{error}</div>}

                        {/* TAB: ARTIST HOME (CONTINUOUS STREAM OF EVENTS & POSTS) */}
                        {((tab === "Artist Home" && currentUser?.role === "Artist") || (tab === "Fan Profile" && currentUser?.role === "Artist")) && (
                            <div style={{ display: "grid", gap: "20px" }}>
                                <div
                                    style={{
                                        background: "linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(244, 63, 94, 0.1))",
                                        border: "1px solid var(--line-strong)",
                                        backdropFilter: "blur(16px)",
                                        borderRadius: "14px",
                                        padding: "20px 24px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: "16px",
                                    }}
                                >
                                    <div>
                                        <span className="eyebrow" style={{ color: "var(--spray-cyan)" }}>
                                            ARTIST STUDIO & SHOWCASE
                                        </span>
                                        <h2 style={{ margin: "2px 0 0", fontSize: "20px" }}>
                                            {currentUser.name} — Artist Profile
                                        </h2>
                                        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted)" }}>
                                            Your live artist showcase, continuous media feed, and event curator workspace.
                                        </p>
                                    </div>
                                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                        <button
                                            type="button"
                                            className="primary"
                                            onClick={() => setTab("Make a post")}
                                            style={{ padding: "10px 18px", fontSize: "13px", fontWeight: 700 }}
                                        >
                                            ＋ Create Post
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setTab("Manage Events")}
                                            style={{ padding: "10px 18px", fontSize: "13px", fontWeight: 700 }}
                                        >
                                            Manage Events
                                        </button>
                                    </div>
                                </div>

                                <div className="panel" style={{ padding: "32px" }}>
                                    <ArtistProfileView
                                        artist={sampleArtists.find((a) => a.id === effectiveUser.id) || sampleArtists.find((a) => a.id === 9) || sampleArtists[8]}
                                        isModal={false}
                                        onNavigateTab={(targetTab) => setTab(targetTab)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB: SETTINGS */}
                        {!isGuest && tab === "Settings" && (
                            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                                <section className="panel" style={{ padding: "32px" }}>
                                    <div className="section-title">
                                        <div>
                                            <span className="eyebrow">ACCOUNT SETTINGS & PREFERENCES</span>
                                            <h2 style={{ margin: "4px 0 0" }}>Preferences & Privacy</h2>
                                            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "4px 0 0" }}>
                                                Customize who can message you, change your nickname, and toggle light vs dark appearance.
                                            </p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSaveSettings} style={{ display: "grid", gap: "22px", marginTop: "16px" }}>
                                        {/* Profile Nickname */}
                                        <div>
                                            <label style={{ display: "block", marginBottom: "6px" }}>
                                                Display Nickname / Alias
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.nickname}
                                                onChange={(e) => setSettings({ ...settings, nickname: e.target.value })}
                                                placeholder="Enter your public nickname"
                                            />
                                            <small style={{ color: "var(--muted)", display: "block", marginTop: "4px" }}>
                                                This name appears on your public comments and profile activities.
                                            </small>
                                        </div>

                                        {/* Bio */}
                                        <div>
                                            <label style={{ display: "block", marginBottom: "6px" }}>
                                                Status / About Excerpt
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.bio}
                                                onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                                                placeholder="Tell the community about your artistic taste"
                                            />
                                        </div>

                                        {/* Messaging Permissions */}
                                        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "18px" }}>
                                            <label style={{ display: "block", marginBottom: "6px" }}>
                                                Who Can Direct Message You?
                                            </label>
                                            <select
                                                value={settings.messagingPermission}
                                                onChange={(e) => setSettings({ ...settings, messagingPermission: e.target.value })}
                                            >
                                                <option value="everyone">Everyone (Fans, Artists, and Community Members)</option>
                                                <option value="followed">Only Followed Creators & Booked Contacts</option>
                                                <option value="nobody">Nobody (Disable Incoming Direct Messages)</option>
                                            </select>
                                            <small style={{ color: "var(--muted)", display: "block", marginTop: "4px" }}>
                                                Control message requests and unsolicited artist inquiries.
                                            </small>
                                        </div>

                                        {/* Appearance: Light Mode vs Dark Mode */}
                                        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "18px" }}>
                                            <label style={{ display: "block", marginBottom: "10px" }}>
                                                Appearance Theme (Light Mode vs Dark Mode)
                                            </label>
                                            <div style={{ display: "flex", gap: "12px" }}>
                                                <button
                                                    type="button"
                                                    className={settings.theme === "dark" ? "primary" : "btn-secondary"}
                                                    style={{ flex: 1, padding: "12px", borderRadius: "10px", fontSize: "13px" }}
                                                    onClick={() => setSettings({ ...settings, theme: "dark" })}
                                                >
                                                    Dark Mode (Obsidian & Neon Glow)
                                                </button>
                                                <button
                                                    type="button"
                                                    className={settings.theme === "light" ? "primary" : "btn-secondary"}
                                                    style={{ flex: 1, padding: "12px", borderRadius: "10px", fontSize: "13px" }}
                                                    onClick={() => setSettings({ ...settings, theme: "light" })}
                                                >
                                                    Light Mode (Studio White Canvas)
                                                </button>
                                            </div>
                                        </div>

                                        {/* Notifications & Comments */}
                                        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "18px" }}>
                                            <div className="setting" style={{ padding: "10px 0" }}>
                                                <div>
                                                    <b>Allow Comments on Activity</b>
                                                    <p>Allow fans and artists to comment on your profile posts and artwork.</p>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={settings.allowCommentsOnPosts}
                                                    onChange={(e) => setSettings({ ...settings, allowCommentsOnPosts: e.target.checked })}
                                                />
                                            </div>

                                            <div className="setting" style={{ padding: "10px 0" }}>
                                                <div>
                                                    <b>Email Show & Booking Alerts</b>
                                                    <p>Receive email digests when followed creators schedule live shows near you.</p>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={settings.emailNotifications}
                                                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                                />
                                            </div>
                                        </div>

                                        <button type="submit" className="primary" style={{ padding: "12px 24px", marginTop: "10px" }}>
                                            Save Settings & Preferences
                                        </button>
                                    </form>

                                    {/* Moderation & Active Reports Section */}
                                    <div style={{ borderTop: "1px solid var(--line)", paddingTop: "24px", marginTop: "24px" }}>
                                        <span className="eyebrow" style={{ color: "var(--spray-pink)" }}>SAFETY & MODERATION</span>
                                        <h3 style={{ margin: "4px 0 0", fontSize: "16px" }}>Active Moderation Reports</h3>
                                        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "4px 0 14px" }}>
                                            View the status and administrator outcomes of reports you have submitted for comments or posts.
                                        </p>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setTab("Fan Reports")}
                                            style={{ padding: "8px 16px", fontSize: "12px" }}
                                        >
                                            View Active Reports Tracker &rarr;
                                        </button>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* TAB: FOLLOWING / FAVORITES */}
                        {tab === "Following" && (
                            isGuest ? (
                                <div className="panel" style={{ textAlign: "center", padding: "48px 24px" }}>
                                    
                                    <h2>Sign In to View Favorites & Following</h2>
                                    <p style={{ color: "var(--muted)", maxWidth: "440px", margin: "8px auto 20px", fontSize: "14px", lineHeight: "1.6" }}>
                                        You must be signed in with an account to view your followed artists, liked tracks, and personalized favorites list.
                                    </p>
                                    <button
                                        type="button"
                                        className="primary"
                                        onClick={() => triggerGuestLogin("Sign in to access your followed artists and favorites list.")}
                                        style={{ padding: "10px 24px" }}
                                    >
                                        Sign In Now →
                                    </button>
                                </div>
                            ) : (
                                (currentUser?.role === "Fan" || currentUser?.role === "Artist") && <FollowingPanel />
                            )
                        )}
                        {!isGuest && currentUser?.role === "Fan" && tab === "Fan Profile" && <FanProfilePanel />}
                        {!isGuest && currentUser?.role === "Fan" && tab === "Fan Reports" && (
                            <div style={{ display: "grid", gap: "16px" }}>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setTab("Settings")}
                                    style={{ width: "fit-content", padding: "6px 14px", fontSize: "12px" }}
                                >
                                    &larr; Back to Settings
                                </button>
                                <FanReportsPanel />
                            </div>
                        )}
                        {!isGuest && currentUser?.role === "Admin" && tab === "Report Queue" && <AdminReportsPanel />}

                        {/* TAB: RECOMMENDATIONS (USE CASE: RECEIVE RECOMMENDATION) */}
                        {tab === "Recommendations" && (
                            isGuest ? (
                                <div className="panel" style={{ textAlign: "center", padding: "48px 24px" }}>
                                    
                                    <h2>Personalized Recommendations</h2>
                                    <p style={{ color: "var(--muted)", maxWidth: "440px", margin: "8px auto 20px", fontSize: "14px", lineHeight: "1.6" }}>
                                        Sign in to receive algorithmic recommendations tailored to your taste profile based on your follows, likes, and bookings.
                                    </p>
                                    <button
                                        type="button"
                                        className="primary"
                                        onClick={() => triggerGuestLogin("Sign in to receive personalized recommendations.")}
                                        style={{ padding: "10px 24px" }}
                                    >
                                        Sign In as Fan →
                                    </button>
                                </div>
                            ) : (currentUser?.role === "Fan" || currentUser?.role === "Artist") ? (
                            <div>
                                {loadingRecs ? (
                                    <div className="empty"><p>Calculating numerical genre affinities and latent AI features…</p></div>
                                ) : recommendationData ? (
                                    <>
                                        {recommendationData.hasInteractions ? (
                                            <div className="affinity-widget">
                                                <div className="section-title">
                                                    <div>
                                                        <span className="eyebrow">NUMERICAL TASTE PROFILE</span>
                                                        <h3 style={{ margin: "4px 0 0" }}>Your Genre Affinities</h3>
                                                    </div>
                                                    <button
                                                        className="btn-secondary"
                                                        style={{ fontSize: "11px", padding: "6px 12px" }}
                                                        onClick={clearFanInteractions}
                                                        title="Clear interaction history"
                                                    >
                                                        Clear history
                                                    </button>
                                                </div>

                                                <p style={{ fontSize: "12px", color: "var(--muted)", margin: "8px 0 16px" }}>
                                                    Weights computed from your follows (5.0), bookings (5.0), likes (3.0), and profile views (1.0).
                                                </p>

                                                {Object.entries(recommendationData.genreAffinityScores).map(([genre, pct]) => (
                                                    <div key={genre} className="affinity-bar-row">
                                                        <span className="affinity-label">{genre}</span>
                                                        <div className="affinity-track">
                                                            <div className="affinity-fill" style={{ width: `${pct}%` }}></div>
                                                        </div>
                                                        <span className="affinity-pct">{pct}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="panel" style={{ marginBottom: "24px", background: "#f8faf5", borderColor: "#cbd6c5" }}>
                                                <div className="section-title">
                                                    <div>
                                                        <span className="pill" style={{ background: "#e8efe1", color: "#325c41" }}>NEW FAN PROFILE</span>
                                                        <h2 style={{ margin: "8px 0 4px" }}>Start Discovering New Artists</h2>
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: "13px", color: "#45594e" }}>
                                                    {recommendationData.message}
                                                </p>
                                                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                                                    <button className="primary" onClick={() => setTab("Discover")}>
                                                        Explore Discover Directory ↗
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="results-heading">
                                            <div>
                                                <h2>
                                                    {recommendationData.hasInteractions ? "Recommended Artists" : "Popular In Community"}{" "}
                                                    <span>
                                                        {recommendationData.recommendations.filter(({ artist }) => {
                                                            if (recFormatFilter === "All Formats") return true;
                                                            const tags = (artist.tags || "").toLowerCase();
                                                            const genre = (artist.genre || "").toLowerCase();
                                                            const filter = recFormatFilter.toLowerCase();
                                                            if (filter === "music") {
                                                                return tags.includes("music") || genre.includes("folk") || genre.includes("rock") || genre.includes("pop") || genre.includes("jazz") || genre.includes("electronic");
                                                            }
                                                            if (filter === "visual media") {
                                                                return tags.includes("visual") || genre.includes("visual") || tags.includes("painting") || tags.includes("illustration");
                                                            }
                                                            if (filter === "street art / graffiti") {
                                                                return tags.includes("street art") || tags.includes("graffiti") || genre.includes("street art");
                                                            }
                                                            if (filter === "digital art") {
                                                                return tags.includes("digital art") || tags.includes("3d") || genre.includes("digital art");
                                                            }
                                                            if (filter === "photography") {
                                                                return tags.includes("photography") || genre.includes("photography");
                                                            }
                                                            if (filter === "mixed-media") {
                                                                return tags.includes("mixed-media") || genre.includes("mixed-media");
                                                            }
                                                            return tags.includes(filter) || genre.includes(filter);
                                                        }).length}
                                                    </span>
                                                </h2>
                                                <span>Base matches encompass all formats · Filter by discipline</span>
                                            </div>
                                        </div>

                                        {/* Format Filter Bar (All Formats, Music, Visual Media, etc.) */}
                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "14px 0 22px" }}>
                                            {["All Formats", "Music", "Visual Media", "Street Art / Graffiti", "Digital Art", "Photography", "Mixed-Media"].map((fmt) => (
                                                <button
                                                    key={fmt}
                                                    type="button"
                                                    className={recFormatFilter === fmt ? "primary" : "btn-secondary"}
                                                    style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "18px" }}
                                                    onClick={() => setRecFormatFilter(fmt)}
                                                >
                                                    {fmt}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="artist-grid">
                                            {recommendationData.recommendations
                                                .filter(({ artist }) => {
                                                    if (recFormatFilter === "All Formats") return true;
                                                    const tags = (artist.tags || "").toLowerCase();
                                                    const genre = (artist.genre || "").toLowerCase();
                                                    const filter = recFormatFilter.toLowerCase();
                                                    if (filter === "music") {
                                                        return tags.includes("music") || genre.includes("folk") || genre.includes("rock") || genre.includes("pop") || genre.includes("jazz") || genre.includes("electronic");
                                                    }
                                                    if (filter === "visual media") {
                                                        return tags.includes("visual") || genre.includes("visual") || tags.includes("painting") || tags.includes("illustration");
                                                    }
                                                    if (filter === "street art / graffiti") {
                                                        return tags.includes("street art") || tags.includes("graffiti") || genre.includes("street art");
                                                    }
                                                    if (filter === "digital art") {
                                                        return tags.includes("digital art") || tags.includes("3d") || genre.includes("digital art");
                                                    }
                                                    if (filter === "photography") {
                                                        return tags.includes("photography") || genre.includes("photography");
                                                    }
                                                    if (filter === "mixed-media") {
                                                        return tags.includes("mixed-media") || genre.includes("mixed-media");
                                                    }
                                                    return tags.includes(filter) || genre.includes(filter);
                                                })
                                                .map(({ artist, matchPercentage, reason, latentFeatureSummary }, i) => (
                                                <div className="artist-card" key={artist.id} style={{ display: "flex", flexDirection: "column" }}>
                                                    <div className={`art-cover art-${i % 6}`}>
                                                        <span className="match-pill" style={{ position: "absolute", top: "12px", right: "12px" }}>
                                                            {matchPercentage.toFixed(0)}% Match
                                                        </span>
                                                        <small>{artist.genre}</small>
                                                    </div>

                                                    <div className="artist-info" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                                        <div className="avatar">
                                                            {artist.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                                                        </div>
                                                        <h3>{artist.name}</h3>
                                                        <p>{artist.genre} · {artist.location}</p>

                                                        <div style={{ margin: "10px 0", flex: 1 }}>
                                                            <div style={{ background: "#f5f8f2", padding: "10px", borderRadius: "8px", border: "1px solid #e1eadc", fontSize: "11px", color: "#314b3d" }}>
                                                                <b>AI Reason:</b> {reason}
                                                            </div>
                                                            <small style={{ display: "block", marginTop: "6px", color: "#6a7c6f", fontSize: "10px" }}>
                                                                {latentFeatureSummary}
                                                            </small>
                                                        </div>

                                                        <div className="card-footer" style={{ borderTop: "1px solid var(--line)", paddingTop: "12px", marginTop: "auto" }}>
                                                            <FollowButton artistId={artist.id} />
                                                            <button
                                                                className="btn-secondary"
                                                                style={{ fontSize: "11px", padding: "6px 10px" }}
                                                                onClick={() => {
                                                                    setSelectedArtist(artist);
                                                                }}
                                                            >
                                                                View Profile ↗
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        ) : null)}

                        {/* TAB: MANAGE EVENTS (ARTIST ONLY) */}
                        {tab === "Manage Events" && currentUser?.role === "Artist" && (
                            <div>
                                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                                    <button
                                        className={eventSubTab === "list" ? "primary" : "btn-secondary"}
                                        onClick={() => {
                                            setEventSubTab("list");
                                            setShowReviewStep(false);
                                        }}
                                    >
                                        My Events Directory ({eventsList.length})
                                    </button>
                                    <button
                                        className={eventSubTab === "create" ? "primary" : "btn-secondary"}
                                        onClick={startCreateEvent}
                                    >
                                        ＋ Create New Event
                                    </button>
                                </div>

                                {eventSubTab === "list" && (
                                    <div>
                                        {loadingEvents ? (
                                            <div className="empty"><p>Loading events from database…</p></div>
                                        ) : eventsList.length === 0 ? (
                                            <div className="empty">
                                                <h3>No events created yet</h3>
                                                <p>Create your first event to announce shows and exhibitions to your fanbase.</p>
                                                <button className="primary" onClick={startCreateEvent}>Create an Event ↗</button>
                                            </div>
                                        ) : (
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
                                                {eventsList.map((ev) => (
                                                    <article key={ev.id} className="panel" style={{ display: "flex", flexDirection: "column" }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                                            <span className="pill">{ev.eventType || "Event"}</span>
                                                            <span
                                                                className="pill"
                                                                style={{
                                                                    background: ev.status === "Published" ? "#e7f2e4" : "#f5f5ea",
                                                                    color: ev.status === "Published" ? "#2b614c" : "#757f6b",
                                                                }}
                                                            >
                                                                {ev.status}
                                                            </span>
                                                        </div>

                                                        <h2 style={{ fontSize: "20px", marginBottom: "6px" }}>{ev.title}</h2>
                                                        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 10px", flex: 1 }}>
                                                            {ev.description}
                                                        </p>

                                                        <div style={{ fontSize: "12px", borderTop: "1px solid var(--line)", paddingTop: "12px", marginBottom: "16px" }}>
                                                            <div><b>Date:</b> {ev.eventDate ? new Date(ev.eventDate).toLocaleString() : "TBD"}</div>
                                                            <div><b>Venue:</b> {ev.location} {ev.virtual && "(Virtual)"}</div>
                                                            <div><b>Capacity:</b> {ev.capacity} attendees</div>
                                                        </div>

                                                        {!isGuest && currentUser?.role === "Artist" && (
                                                            <button className="primary full" onClick={() => startEditEvent(ev)}>
                                                                Edit / Update Event ↗
                                                            </button>
                                                        )}
                                                    </article>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {eventSubTab === "edit" && (
                                    <div className="panel" style={{ maxWidth: "780px" }}>
                                        <div className="section-title">
                                            <div>
                                                <span className="eyebrow">EVENT INFORMATION</span>
                                                <h2>Edit Event: {eventForm.title || "Existing Event"}</h2>
                                            </div>
                                            <button className="btn-secondary" onClick={() => setEventSubTab("list")}>Cancel</button>
                                        </div>

                                        {!showReviewStep ? (
                                            <form onSubmit={(e) => { e.preventDefault(); handleReviewStep(); }}>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                                                    <label>
                                                        Event Title
                                                        <input
                                                            type="text"
                                                            value={eventForm.title || ""}
                                                            onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                                            placeholder="e.g. Austin Folk & Canvas"
                                                        />
                                                        {eventFormErrors.title && <small className="field-error">{eventFormErrors.title}</small>}
                                                    </label>

                                                    <label>
                                                        Event Type
                                                        <select
                                                            value={eventForm.eventType || "Concert"}
                                                            onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                                                        >
                                                            <option value="Concert">Concert</option>
                                                            <option value="Workshop">Workshop</option>
                                                            <option value="Exhibition">Exhibition</option>
                                                            <option value="Showcase">Showcase</option>
                                                            <option value="Tour Date">Tour Date</option>
                                                        </select>
                                                        {eventFormErrors.eventType && <small className="field-error">{eventFormErrors.eventType}</small>}
                                                    </label>

                                                    <label>
                                                        Date & Time
                                                        <input
                                                            type="datetime-local"
                                                            value={eventForm.eventDate || ""}
                                                            onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                                                        />
                                                        {eventFormErrors.eventDate && <small className="field-error">{eventFormErrors.eventDate}</small>}
                                                    </label>

                                                    <label>
                                                        Capacity (Attendees)
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={eventForm.capacity || ""}
                                                            onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                                                        />
                                                        {eventFormErrors.capacity && <small className="field-error">{eventFormErrors.capacity}</small>}
                                                    </label>
                                                </div>

                                                <label style={{ marginTop: "14px" }}>
                                                    Location or Venue
                                                    <input
                                                        type="text"
                                                        value={eventForm.location || ""}
                                                        onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                                                        placeholder="Venue name & address, or stream link"
                                                    />
                                                    {eventFormErrors.location && <small className="field-error">{eventFormErrors.location}</small>}
                                                </label>

                                                <label className="check-label" style={{ margin: "12px 0" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!eventForm.virtual}
                                                        onChange={(e) => setEventForm({ ...eventForm, virtual: e.target.checked })}
                                                    />
                                                    This is a virtual / livestreamed event
                                                </label>

                                                <label>
                                                    Description & Program
                                                    <textarea
                                                        rows={4}
                                                        value={eventForm.description || ""}
                                                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                                        placeholder="Tell fans what to expect, band lineups, and schedule..."
                                                    />
                                                    {eventFormErrors.description && <small className="field-error">{eventFormErrors.description}</small>}
                                                </label>

                                                <label style={{ marginTop: "12px" }}>
                                                    Promotional Image / Flyer URL
                                                    <input
                                                        type="text"
                                                        value={eventForm.imageUrl || ""}
                                                        onChange={(e) => setEventForm({ ...eventForm, imageUrl: e.target.value })}
                                                        placeholder="https://example.com/flyer.jpg"
                                                    />
                                                </label>

                                                <div className="form-actions">
                                                    <button type="button" className="btn-secondary" onClick={() => setEventSubTab("list")}>
                                                        Cancel
                                                    </button>
                                                    <button type="submit" className="primary">
                                                        Proceed to Review Details ↗
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="review-box">
                                                <span className="eyebrow">STEP 5 & 6: REVIEW UPDATED EVENT DETAILS</span>
                                                <h3>Review & Confirmation</h3>
                                                <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                                                    Please review the updated details before saving changes to your public artist profile.
                                                </p>

                                                <div className="review-grid">
                                                    <div><b>Title:</b> {eventForm.title}</div>
                                                    <div><b>Type:</b> {eventForm.eventType}</div>
                                                    <div><b>Date:</b> {eventForm.eventDate}</div>
                                                    <div><b>Location:</b> {eventForm.location} {eventForm.virtual && "(Virtual)"}</div>
                                                    <div><b>Capacity:</b> {eventForm.capacity}</div>
                                                    <div><b>Status:</b> {eventForm.status}</div>
                                                </div>

                                                <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid #dbe2d4", marginBottom: "16px" }}>
                                                    <b style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Updated Description:</b>
                                                    <p style={{ fontSize: "13px", margin: "4px 0 0" }}>{eventForm.description}</p>
                                                </div>

                                                <label className="ack-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!eventForm.reviewedAcknowledgment}
                                                        onChange={(e) => setEventForm({ ...eventForm, reviewedAcknowledgment: e.target.checked })}
                                                    />
                                                    <span>
                                                        I acknowledge that I have reviewed the details of my submission before submitting (Required).
                                                    </span>
                                                </label>

                                                <div className="form-actions" style={{ marginTop: "20px" }}>
                                                    <button type="button" className="btn-secondary" onClick={() => setShowReviewStep(false)}>
                                                        ← Back to Editing
                                                    </button>
                                                    <button type="button" className="primary" onClick={submitUpdateEvent}>
                                                        Confirm & Submit Update ↗
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {eventSubTab === "create" && (
                                    <div className="panel" style={{ maxWidth: "780px" }}>
                                        <div className="section-title">
                                            <div>
                                                <span className="eyebrow">NEW EVENT</span>
                                                <h2>Create an Event</h2>
                                            </div>
                                            <button className="btn-secondary" onClick={() => setEventSubTab("list")}>Cancel</button>
                                        </div>

                                        <form onSubmit={(e) => { e.preventDefault(); submitCreateEvent(); }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                                                <label>
                                                    Event Title
                                                    <input
                                                        type="text"
                                                        value={eventForm.title || ""}
                                                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                                        placeholder="e.g. Austin Folk & Canvas"
                                                    />
                                                    {eventFormErrors.title && <small className="field-error">{eventFormErrors.title}</small>}
                                                </label>

                                                <label>
                                                    Event Type
                                                    <select
                                                        value={eventForm.eventType || "Concert"}
                                                        onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                                                    >
                                                        <option value="Concert">Concert</option>
                                                        <option value="Workshop">Workshop</option>
                                                        <option value="Exhibition">Exhibition</option>
                                                        <option value="Showcase">Showcase</option>
                                                        <option value="Tour Date">Tour Date</option>
                                                    </select>
                                                </label>

                                                <label>
                                                    Date & Time
                                                    <input
                                                        type="datetime-local"
                                                        value={eventForm.eventDate || ""}
                                                        onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                                                    />
                                                    {eventFormErrors.eventDate && <small className="field-error">{eventFormErrors.eventDate}</small>}
                                                </label>

                                                <label>
                                                    Capacity (Attendees)
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={eventForm.capacity || ""}
                                                        onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                                                    />
                                                </label>
                                            </div>

                                            <label style={{ marginTop: "14px" }}>
                                                Location or Venue
                                                <input
                                                    type="text"
                                                    value={eventForm.location || ""}
                                                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                                                    placeholder="Venue name and city"
                                                />
                                                {eventFormErrors.location && <small className="field-error">{eventFormErrors.location}</small>}
                                            </label>

                                            <label>
                                                Description
                                                <textarea
                                                    rows={4}
                                                    value={eventForm.description || ""}
                                                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                                    placeholder="Describe your event..."
                                                />
                                                {eventFormErrors.description && <small className="field-error">{eventFormErrors.description}</small>}
                                            </label>

                                            <div className="form-actions">
                                                <button type="button" className="btn-secondary" onClick={() => setEventSubTab("list")}>Cancel</button>
                                                <button type="submit" className="primary">Create Event in Database ↗</button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: BAN APPEALS (USE CASE: UNBAN FAN - ADMIN) */}
                        {tab === "Ban Appeals" && (
                            <div>
                                <div className="panel" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fcfaf7" }}>
                                    <div>
                                        <span className="eyebrow">MODERATOR SESSION</span>
                                        <h3 style={{ margin: "4px 0" }}>Logged in as {effectiveUser.name} (Admin ID: {effectiveUser.id})</h3>
                                        <small>Policy: A different admin than the banning admin must review appeals (conflict of interest prevention).</small>
                                    </div>

                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            className={appealsViewMode === "all" ? "primary" : "btn-secondary"}
                                            onClick={() => setAppealsViewMode(appealsViewMode === "all" ? "eligible" : "all")}
                                            title="Toggle viewing all appeals vs only eligible unbanned appeals"
                                        >
                                            {appealsViewMode === "all" ? "Showing All Appeals" : "Filter Eligible Only"}
                                        </button>
                                    </div>
                                </div>

                                {loadingAppeals ? (
                                    <div className="empty"><p>Loading ban appeals from moderation service…</p></div>
                                ) : appealsList.length === 0 ? (
                                    <div className="empty">
                                        <h3>No open appeals</h3>
                                        <p>All ban appeals have been processed or there are no open appeals assigned to your queue.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "24px", alignItems: "start" }}>
                                        <div>
                                            <div className="results-heading">
                                                <h2>Queue <span>{appealsList.length}</span></h2>
                                            </div>

                                            {appealsList.map((appeal) => (
                                                <div
                                                    key={appeal.id}
                                                    className={`appeal-card ${selectedAppeal?.id === appeal.id ? "selected" : ""}`}
                                                    onClick={() => { setSelectedAppeal(appeal); setAdminNotes(""); }}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <div className="appeal-meta">
                                                        <b>@{appeal.fanUsername}</b>
                                                        <span className={`pill ${appeal.status === "OPEN" ? "" : appeal.status === "APPROVED" ? "notice" : "error"}`}>
                                                            {appeal.status}
                                                        </span>
                                                    </div>
                                                    <small style={{ display: "block", marginBottom: "8px" }}>
                                                        Banned by: {appeal.banningAdminName || `Admin #${appeal.banningAdminId}`}
                                                    </small>
                                                    <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                                        {appeal.reason}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {selectedAppeal ? (
                                            <div className="panel">
                                                <div className="section-title">
                                                    <div>
                                                        <span className="eyebrow">APPEAL CASE #{selectedAppeal.id}</span>
                                                        <h2>Review Fan Appeal: @{selectedAppeal.fanUsername}</h2>
                                                    </div>
                                                    <span className="pill">{selectedAppeal.status}</span>
                                                </div>

                                                {selectedAppeal.banningAdminId === effectiveUser.id && (
                                                    <div className="conflict-warning">
                                                        <b>Conflict of Interest Warning:</b> You were the administrator who issued this initial ban ({selectedAppeal.banningAdminName}). Under system rules, another administrator must review and process this appeal.
                                                    </div>
                                                )}

                                                <div style={{ marginTop: "16px" }}>
                                                    <b style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Fan&apos;s Submitted Reason for Appeal:</b>
                                                    <p style={{ background: "#f8faf5", padding: "14px", borderRadius: "8px", border: "1px solid #dce5dc", margin: "6px 0 16px", fontSize: "13px" }}>
                                                        &ldquo;{selectedAppeal.reason}&rdquo;
                                                    </p>
                                                </div>

                                                <div>
                                                    <b style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Offending Content (Flagged Violation):</b>
                                                    <div style={{ background: "#fffaf7", padding: "12px 14px", borderRadius: "8px", border: "1px dashed #e8c5ba", margin: "6px 0 16px", fontSize: "13px", color: "#8a3525", fontStyle: "italic" }}>
                                                        &ldquo;{selectedAppeal.offendingContent || "some sentence breaking ToS"}&rdquo;
                                                    </div>
                                                </div>

                                                <div>
                                                    <b style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Incident Report Material & Evidence:</b>
                                                    <div style={{ background: "#fff5f2", padding: "12px 14px", borderRadius: "8px", border: "1px solid #f2dbd5", margin: "6px 0 16px", fontSize: "12px", fontFamily: "monospace", color: "#8a3525" }}>
                                                        {selectedAppeal.reportMaterial}
                                                    </div>
                                                </div>

                                                <div className="ai-box">
                                                    <h4>Automated AI ToS Evaluation</h4>
                                                    <p>{selectedAppeal.aiRecommendation}</p>
                                                </div>

                                                {selectedAppeal.status === "OPEN" && (
                                                    <div style={{ marginTop: "20px", borderTop: "1px solid var(--line)", paddingTop: "18px" }}>
                                                        <label>
                                                            Review Notes (Optional)
                                                            <textarea
                                                                rows={3}
                                                                value={adminNotes}
                                                                onChange={(e) => setAdminNotes(e.target.value)}
                                                                placeholder="Add internal notes on your moderation decision..."
                                                            />
                                                        </label>

                                                        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                                                            <button
                                                                className="primary"
                                                                disabled={selectedAppeal.banningAdminId === effectiveUser.id}
                                                                onClick={() => handleUnbanFan(selectedAppeal.id)}
                                                            >
                                                                Unban Fan & Restore Login ↗
                                                            </button>

                                                            <button
                                                                className="btn-danger"
                                                                disabled={selectedAppeal.banningAdminId === effectiveUser.id}
                                                                onClick={() => handleInvalidateAppeal(selectedAppeal.id)}
                                                            >
                                                                Mark Appeal Invalid & Uphold Ban
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: ARTIST DIRECTORY (USE CASE: SUSPEND ARTIST - ADMIN) */}
                        {tab === "Artist Directory" && !isGuest && effectiveUser.role === "Admin" && (
                            <div className="panel">
                                <div className="section-title">
                                    <div>
                                        <span className="eyebrow">MODERATOR CONTROLS</span>
                                        <h2>Platform Artists</h2>
                                    </div>
                                    <button
                                        className="btn-secondary"
                                        onClick={async () => {
                                            const res = await fetch(`${API_BASE}/api/artists?includeSuspended=true`);
                                            if (res.ok) setArtistResults(await res.json());
                                        }}
                                    >
                                        Refresh Directory
                                    </button>
                                </div>

                                <div className="artist-grid" style={{ marginTop: "20px" }}>
                                    {artistResults.map((a, i) => (
                                        <div className="artist-card" key={a.id} style={{ display: "flex", flexDirection: "column", opacity: a.suspended ? 0.6 : 1 }}>
                                            <div className={`art-cover art-${i % 6}`}>
                                                <span>{a.name.slice(0, 2).toUpperCase()}</span>
                                            </div>
                                            <div className="artist-info" style={{ flex: 1 }}>
                                                <h3>{a.name}</h3>
                                                <p>{a.genre} · {a.location}</p>
                                                {a.suspended && <span className="error pill" style={{ display: "inline-block", marginTop: "8px" }}>SUSPENDED</span>}
                                            </div>
                                            <div className="card-footer" style={{ borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                                                <button
                                                    className="btn-danger full"
                                                    disabled={a.suspended}
                                                    onClick={() => handleSuspendArtist(a.id)}
                                                >
                                                    {a.suspended ? "Account Suspended" : "Suspend Artist"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB: DISCOVER */}
                        {tab === "Discover" && effectiveUser.role !== "Admin" && (
                            <>
                                <section className="search-panel">
                                    <div className="section-title">
                                        <h2>Discover artists</h2>
                                    </div>

                                    <form onSubmit={handleSearch} className="search-grid">
                                        <label>
                                            Artist name
                                            <input
                                                placeholder="Who are you looking for?"
                                                value={criteria.name}
                                                onChange={(e) => setCriteria({ ...criteria, name: e.target.value })}
                                            />
                                        </label>
                                        <label>
                                            Genre / style
                                            <input
                                                placeholder="e.g. Indie Folk, Jazz"
                                                value={criteria.genre}
                                                onChange={(e) => setCriteria({ ...criteria, genre: e.target.value })}
                                            />
                                        </label>
                                        <label>
                                            Location
                                            <input
                                                placeholder="City or state"
                                                value={criteria.location}
                                                onChange={(e) => setCriteria({ ...criteria, location: e.target.value })}
                                            />
                                        </label>
                                        <button className="primary" disabled={busySearch}>
                                            {busySearch ? "Searching…" : "Search artists ↗"}
                                        </button>
                                    </form>

                                    {/* Self-Assigned Tag Filters */}
                                    <div style={{ marginTop: "18px", borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", marginRight: "4px" }}>
                                                Filter by Artist Tags:
                                            </span>
                                            {ARTIST_TAG_FILTERS.map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => handleTagFilter(tag)}
                                                    className={selectedTag === tag ? "pill" : "btn-secondary"}
                                                    style={{
                                                        fontSize: "11px",
                                                        padding: "5px 12px",
                                                        borderRadius: "20px",
                                                        cursor: "pointer",
                                                        background: selectedTag === tag ? "rgba(244, 63, 94, 0.2)" : "rgba(255, 255, 255, 0.04)",
                                                        borderColor: selectedTag === tag ? "var(--spray-pink)" : "var(--line)",
                                                        color: selectedTag === tag ? "#ffffff" : "var(--ink-secondary)",
                                                        boxShadow: selectedTag === tag ? "0 0 14px rgba(244, 63, 94, 0.3)" : "none",
                                                    }}
                                                >
                                                    {tag === "All Tags" ? "All Media" : `#${tag}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                <div className="results-heading">
                                    <h2>
                                        {searched ? "Search Results" : "Meet The Community"}{" "}
                                        <span>{artistResults.length}</span>
                                    </h2>
                                    <span>Registered Database Artists</span>
                                </div>

                                <div className="artist-grid">
                                    {artistResults.map((a, i) => (
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            className="artist-card"
                                            key={a.id}
                                            onClick={async () => {
                                                setSelectedArtist(a);
                                                if (!isGuest && effectiveUser.role === "Fan") {
                                                    await recordFanInteraction(a.id, "VIEW");
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    setSelectedArtist(a);
                                                }
                                            }}
                                            style={{ cursor: "pointer", textAlign: "left" }}
                                        >
                                            <div className={`art-cover art-${i % 6}`}>
                                                <span>{a.name.slice(0, 2).toUpperCase()}</span>
                                                <small>{a.genre}</small>
                                            </div>
                                            <div className="artist-info">
                                                <div className="avatar">{a.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}</div>
                                                <h3>{a.name}</h3>
                                                <p>{a.genre}</p>
                                                <div className="card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span>{a.location}</span>
                                                    <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                        <Link
                                                            href={`/artist/${a.id}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{ fontSize: "11px", color: "var(--primary)", textDecoration: "underline" }}
                                                        >
                                                            Artist Page ↗
                                                        </Link>
                                                        <b>Quick View</b>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {tab === "Discover" && !isGuest && effectiveUser.role === "Admin" && (
                            <div className="panel" style={{ textAlign: "center", padding: "48px 20px" }}>
                                <span className="pill" style={{ background: "#fbeee8", color: "#9c3b24" }}>ROLE ACCESS RESTRICTION</span>
                                <h2 style={{ marginTop: "14px" }}>Admin Access Restricted</h2>
                                <p style={{ color: "var(--muted)", maxWidth: "480px", margin: "8px auto 20px", fontSize: "13px" }}>
                                    System Administrators are restricted from exploring community artists or social feeds to prevent bias and ensure platform impartiality.
                                </p>
                                <button className="primary" onClick={() => setTab("Ban Appeals")}>
                                    Return to Ban Appeals Queue ↗
                                </button>
                            </div>
                        )}

                        {/* TAB: MAKE A POST */}
                        {tab === "Make a post" && (
                            isGuest ? (
                                <div className="panel" style={{ textAlign: "center", padding: "48px 24px" }}>
                                    <div style={{ fontSize: "36px", marginBottom: "12px" }}>＋</div>
                                    <h2>Artist Studio & Post Publishing</h2>
                                    <p style={{ color: "var(--muted)", maxWidth: "440px", margin: "8px auto 20px", fontSize: "14px", lineHeight: "1.6" }}>
                                        Publishing posts and sharing artwork updates is restricted to verified Artist accounts.
                                    </p>
                                    <button
                                        type="button"
                                        className="primary"
                                        onClick={() => triggerGuestLogin("Sign in as an Artist to create posts.", "Artist")}
                                        style={{ padding: "10px 24px" }}
                                    >
                                        Artist Sign In →
                                    </button>
                                </div>
                            ) : (
                                <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                                    <section className="panel">
                                        <div className="section-title">
                                            <div>
                                                <span className="eyebrow">CREATIVE STUDIO</span>
                                                <h2 style={{ margin: "4px 0 0" }}>Create a Post</h2>
                                            </div>
                                        </div>

                                        <div className="byline">
                                            <div className="avatar">{effectiveUser.avatar}</div>
                                            <div>
                                                <b>{effectiveUser.name}</b>
                                                <small>Sharing to your artist profile and continuous community stream</small>
                                            </div>
                                        </div>

                                        <form onSubmit={handlePublishPost}>
                                            <label>
                                                Your Story & Creative Process
                                                <textarea
                                                    rows={6}
                                                    maxLength={5000}
                                                    placeholder="Share your latest artwork updates, behind-the-scenes recording sessions, or creative story..."
                                                    value={postText}
                                                    onChange={(e) => setPostText(e.target.value)}
                                                />
                                            </label>
                                            <small>{postText.length} / 5,000 characters</small>

                                            {/* Media File Upload Area */}
                                            <div style={{ marginTop: "18px", border: "1px dashed var(--line-strong)", borderRadius: "12px", padding: "20px", background: "rgba(255, 255, 255, 0.02)" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                                    <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--spray-cyan)" }}>
                                                        ATTACH MEDIA (IMAGES, AUDIO CLIPS, VIDEO)
                                                    </span>
                                                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                                                        {mediaFiles.length} item{mediaFiles.length !== 1 ? "s" : ""} attached
                                                    </span>
                                                </div>

                                                <input
                                                    type="file"
                                                    id="post-media-uploader"
                                                    multiple
                                                    accept="image/*,audio/*,video/*,.mp3,.wav,.ogg,.m4a"
                                                    onChange={handleFileSelect}
                                                    style={{ display: "none" }}
                                                />
                                                <input
                                                    type="file"
                                                    id="post-audio-uploader"
                                                    multiple
                                                    accept="audio/*,.mp3,.wav,.ogg,.m4a"
                                                    onChange={handleFileSelect}
                                                    style={{ display: "none" }}
                                                />
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "0 0 14px" }}>
                                                    <label
                                                        htmlFor="post-media-uploader"
                                                        className="upload"
                                                        style={{ cursor: "pointer", display: "block", margin: 0, padding: "16px", border: "1px dashed var(--spray-pink)", background: "rgba(244, 63, 94, 0.05)", borderRadius: "10px", textAlign: "center" }}
                                                    >
                                                        <span style={{ color: "var(--spray-pink)", fontWeight: 700, fontSize: "13px", display: "block" }}>
                                                            Upload Artwork / Images
                                                        </span>
                                                        <small style={{ color: "var(--muted)", display: "block", marginTop: "4px" }}>
                                                            PNG, JPEG, WebP, MP4 video
                                                        </small>
                                                    </label>

                                                    <label
                                                        htmlFor="post-audio-uploader"
                                                        className="upload"
                                                        style={{ cursor: "pointer", display: "block", margin: 0, padding: "16px", border: "1px dashed var(--spray-cyan)", background: "rgba(6, 182, 212, 0.05)", borderRadius: "10px", textAlign: "center" }}
                                                    >
                                                        <span style={{ color: "var(--spray-cyan)", fontWeight: 700, fontSize: "13px", display: "block" }}>
                                                            Upload Music & Audio Track
                                                        </span>
                                                        <small style={{ color: "var(--muted)", display: "block", marginTop: "4px" }}>
                                                            MP3, WAV, OGG, M4A audio files
                                                        </small>
                                                    </label>
                                                </div>

                                                {/* Media URL shortcut */}
                                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Or paste media URL (e.g. image link, audio track link)"
                                                        value={mediaUrlInput}
                                                        onChange={(e) => setMediaUrlInput(e.target.value)}
                                                        style={{ flex: 1, margin: 0, padding: "8px 12px", fontSize: "12px" }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn-secondary"
                                                        onClick={handleAddMediaUrl}
                                                        style={{ padding: "8px 14px", fontSize: "11px", whiteSpace: "nowrap" }}
                                                    >
                                                        + Add Media URL
                                                    </button>
                                                </div>

                                                {/* Preview of attached media files */}
                                                {mediaFiles.length > 0 && (
                                                    <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
                                                        {mediaFiles.map((file, idx) => (
                                                            file.type.startsWith("audio/") || file.data.startsWith("data:audio") || file.name.match(/\.(mp3|wav|ogg|m4a)($|\?)/i) ? (
                                                                <div
                                                                    key={idx}
                                                                    style={{
                                                                        background: "linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(168, 85, 247, 0.08))",
                                                                        border: "1px solid var(--spray-cyan)",
                                                                        borderRadius: "10px",
                                                                        padding: "12px 16px",
                                                                    }}
                                                                >
                                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                            
                                                                            <b style={{ fontSize: "12px", color: "var(--spray-cyan)" }}>
                                                                                {file.name}
                                                                            </b>
                                                                            <span className="pill" style={{ fontSize: "9px" }}>
                                                                                AUDIO TRACK PREVIEW
                                                                            </span>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setMediaFiles((prev) => prev.filter((_, i) => i !== idx))}
                                                                            style={{ background: "none", border: "none", color: "var(--spray-pink)", cursor: "pointer", fontSize: "14px", fontWeight: 700 }}
                                                                            title="Remove audio track"
                                                                        >
                                                                            x
                                                                        </button>
                                                                    </div>
                                                                    <audio controls src={file.data} style={{ width: "100%", height: "36px" }} />
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    key={idx}
                                                                    style={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "space-between",
                                                                        background: "rgba(255, 255, 255, 0.06)",
                                                                        border: "1px solid var(--line-strong)",
                                                                        borderRadius: "8px",
                                                                        padding: "8px 12px",
                                                                        fontSize: "12px",
                                                                    }}
                                                                >
                                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                        <span>[{file.type.startsWith("image/") ? "Image" : "Video"}]</span>
                                                                        <span style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                            {file.name}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setMediaFiles((prev) => prev.filter((_, i) => i !== idx))}
                                                                        style={{ background: "none", border: "none", color: "var(--spray-pink)", cursor: "pointer", padding: "0 4px", fontSize: "13px" }}
                                                                        title="Remove attachment"
                                                                    >
                                                                        x
                                                                    </button>
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="setting" style={{ marginTop: "16px" }}>
                                                <div>
                                                    <b>Public Post</b>
                                                    <p>Visible to everyone on your endless scroll feed.</p>
                                                </div>
                                                <input
                                                    aria-label="Public post"
                                                    type="checkbox"
                                                    checked={isPublic}
                                                    onChange={(e) => setPublic(e.target.checked)}
                                                />
                                            </div>

                                            <div className="setting">
                                                <div>
                                                    <b>Allow Comments</b>
                                                    <p>Make room for a conversation around your artwork.</p>
                                                </div>
                                                <input
                                                    aria-label="Allow comments"
                                                    type="checkbox"
                                                    checked={commentsAllowed}
                                                    onChange={(e) => setCommentsAllowed(e.target.checked)}
                                                />
                                            </div>

                                            <button type="submit" className="primary full" style={{ padding: "12px", marginTop: "12px" }}>
                                                Publish to Artist Feed ↗
                                            </button>
                                        </form>
                                    </section>
                                </div>
                            )
                        )}

                        {/* TAB: VERIFICATIONS */}
                        {tab === "Verifications" && !isGuest && effectiveUser.role === "Admin" && (
                            <div className="panel">
                                <div className="section-title">
                                    <div>
                                        <span className="eyebrow">MODERATOR QUEUE</span>
                                        <h2>Artist Verifications</h2>
                                        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "4px 0 0" }}>
                                            Review portfolio links and approve or reject platform upgrades for fans.
                                        </p>
                                    </div>
                                    <button className="btn-secondary" onClick={loadApplications}>
                                        Refresh Queue
                                    </button>
                                </div>

                                {loadingApps ? (
                                    <div className="empty"><p>Loading pending applications…</p></div>
                                ) : applicationsList.length === 0 ? (
                                    <div className="empty">
                                        <h3>No pending applications</h3>
                                        <p>The verification queue is fully cleared.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
                                        {applicationsList.map((app) => (
                                            <div key={app.id} style={{ background: "#fcfaf7", border: "1px solid var(--line)", borderRadius: "12px", padding: "20px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                                                    <div>
                                                        <h3 style={{ margin: "0 0 4px" }}>{app.applicantName}</h3>
                                                        <span className="pill">Proposed Genre: {app.proposedGenre}</span>
                                                        <span className="pill" style={{ marginLeft: "8px", background: "#f5f5ea" }}>App ID: {app.id}</span>
                                                    </div>
                                                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                                                        Submitted: {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "Unknown"}
                                                    </span>
                                                </div>

                                                <div style={{ background: "white", border: "1px solid #e1eadc", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
                                                    <b style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Portfolio & Identity Links:</b>
                                                    <p style={{ fontSize: "13px", whiteSpace: "pre-line", margin: "6px 0 10px", color: "#2c4538" }}>
                                                        {app.portfolioLinks || "None provided"}
                                                    </p>
                                                    {app.description && (
                                                        <div style={{ marginTop: "10px", borderTop: "1px dashed #cbd6c5", paddingTop: "8px" }}>
                                                            <b style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Artist Statement & Application Description:</b>
                                                            <p style={{ fontSize: "13px", whiteSpace: "pre-line", margin: "4px 0 0", color: "#2c4538" }}>
                                                                {app.description}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ display: "flex", gap: "12px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                                                    <button
                                                        className="primary"
                                                        onClick={() => handleApproveApplication(app.id, app.applicantName)}
                                                    >
                                                        Approve & Provision Artist Profile
                                                    </button>
                                                    <button
                                                        className="btn-secondary"
                                                        onClick={() => handleRejectApplication(app.id, app.applicantName)}
                                                        style={{ color: "#9e3926", borderColor: "#eccdc6" }}
                                                    >
                                                        Reject Application
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: MESSAGES */}
                        {tab === "Messages" && (
                            <div className="studio-grid">
                                <form onSubmit={startConversation}>
                                    <label>Start a new conversation</label>
                                    <textarea
                                        rows={7}
                                        maxLength={5000}
                                        placeholder="Type your message here..."
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                    />
                                    <input
                                        aria-label="Recipient ID"
                                        type="number"
                                        placeholder="ID of the user to send the message to"
                                        onChange={(e) => setRecipientId(e.target.valueAsNumber || 0)}
                                    />
                                    <button className="primary full">Send message</button>
                                </form>
                            </div>
                        )}
                    </main>

                    <footer>
                        <b>ArtistConnect</b>
                        <span>A home for independent expression.</span>
                        <span>© 2026 ArtistConnect. All rights reserved.</span>
                    </footer>
                </div>

                {/* ARTIST PROFILE MODAL */}
                {selectedArtist && (
                    <dialog
                        open
                        aria-modal="true"
                        aria-labelledby="profile-title"
                        className="modal"
                        style={{ maxWidth: "640px", width: "95%", padding: "28px" }}
                    >
                        <ArtistProfileView
                            artist={selectedArtist}
                            isModal={true}
                            onCloseModal={() => setSelectedArtist(null)}
                            onTriggerLogin={triggerGuestLogin}
                        />
                    </dialog>
                )}

                {/* FLASH LOGIN SCREEN / MODAL (FOR GUEST VISITORS) */}
                {showLoginModal && (
                    <div
                        className="modal-backdrop"
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(18, 28, 20, 0.65)",
                            backdropFilter: "blur(4px)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 9999,
                            padding: "20px",
                        }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setShowLoginModal(false);
                        }}
                    >
                        <div className="panel" style={{ maxWidth: "480px", width: "100%", padding: "32px", position: "relative", boxShadow: "0 20px 40px rgba(0,0,0,0.25)" }}>
                            <button
                                type="button"
                                onClick={() => setShowLoginModal(false)}
                                style={{
                                    position: "absolute",
                                    top: "16px",
                                    right: "16px",
                                    background: "none",
                                    border: "none",
                                    fontSize: "20px",
                                    cursor: "pointer",
                                    color: "var(--muted)",
                                }}
                                aria-label="Close"
                            >
                                x
                            </button>

                            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                                <span className="brand" style={{ justifyContent: "center", display: "inline-flex" }}>
                                    a<span>ArtistConnect</span><i>●</i>
                                </span>
                                <h3 style={{ margin: "12px 0 4px", fontSize: "18px" }}>Sign In to ArtistConnect</h3>
                                <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
                                    {loginModalMessage || "Sign in to follow creators, save favorites, and interact."}
                                </p>
                            </div>

                            {/* Role Toggle: Fan / Artist */}
                            <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--line)", paddingBottom: "14px", marginBottom: "20px" }}>
                                <button
                                    type="button"
                                    className={modalRole === "Fan" ? "primary" : "btn-secondary"}
                                    style={{ flex: 1, padding: "8px", fontSize: "12px" }}
                                    onClick={() => { setModalRole("Fan"); setModalError(""); }}
                                >
                                    Fan Sign In
                                </button>
                                <button
                                    type="button"
                                    className={modalRole === "Artist" ? "primary" : "btn-secondary"}
                                    style={{ flex: 1, padding: "8px", fontSize: "12px" }}
                                    onClick={() => { setModalRole("Artist"); setModalError(""); }}
                                >
                                    Artist Sign In
                                </button>
                            </div>

                            {modalNotice && <div className="notice" role="status" style={{ marginBottom: "14px" }}>{modalNotice}</div>}
                            {modalError && <div className="error" role="alert" style={{ marginBottom: "14px" }}>{modalError}</div>}

                            <form onSubmit={handleModalLogin} style={{ display: "grid", gap: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "4px" }}>
                                        {modalRole} Email Address
                                    </label>
                                    <input
                                        type="text"
                                        value={modalUsername}
                                        onChange={(e) => setModalUsername(e.target.value)}
                                        placeholder={modalRole === "Fan" ? "fan@test.com" : "artist@test.com"}
                                        style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "6px" }}
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "12px", marginBottom: "4px" }}>
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        value={modalPassword}
                                        onChange={(e) => setModalPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "6px" }}
                                    />
                                </div>

                                <button type="submit" className="primary" style={{ padding: "10px", marginTop: "4px" }}>
                                    Sign In as {modalRole} →
                                </button>
                            </form>

                            <div style={{ marginTop: "14px", textAlign: "center", fontSize: "12px", color: "var(--muted)" }}>
                                Don&apos;t have an account?{" "}
                                <Link
                                    href={modalRole === "Artist" ? "/register/artist" : "/register/fan"}
                                    onClick={() => setShowLoginModal(false)}
                                    style={{ color: "var(--green)", fontWeight: 700, textDecoration: "underline" }}
                                >
                                    {modalRole === "Artist" ? "Apply for Artist Profile →" : "Create Fan Account →"}
                                </Link>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--line)", fontSize: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowLoginModal(false)}
                                    style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                                >
                                    Continue browsing as guest →
                                </button>
                                <Link href="/admin" style={{ color: "var(--green)", fontWeight: 600 }}>
                                    Admin portal →
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </FanCommunityProvider>
    );
}
