"use client";
import Link from "next/link";
import { FanCommunityProvider, FollowButton, FollowingPanel, FanProfilePanel, FanReportsPanel, ReportArtistButton, AdminReportsPanel } from "../components/fan-community";
import { useEffect, useState, type FormEvent } from "react";

type Role = "Fan" | "Artist" | "Admin";

type UserPersona = {
    id: number;
    name: string;
    role: Role;
    avatar: string;
    description: string;
};

const PERSONAS: UserPersona[] = [
    { id: 1, name: "Nicholas Nolen", role: "Fan", avatar: "NN", description: "Active Fan · Austin, TX" },
    { id: 2, name: "Jordan Smith", role: "Fan", avatar: "JS", description: "New Fan (0 interactions) · Waco, TX" },
    { id: 9, name: "William Waweru", role: "Artist", avatar: "WW", description: "Independent Artist · Waco, TX" },
    { id: 101, name: "Admin Alex", role: "Admin", avatar: "AA", description: "System Administrator (Reviewer 1)" },
    { id: 102, name: "Admin Garrett", role: "Admin", avatar: "AG", description: "System Administrator (Reviewer 2)" },
];

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
    text: string;
    public: boolean;
    comments: boolean;
    files: {
        name: string;
        type: string;
        data: string;
    }[];
};

type UserWrapper = {
    users: Artist[];
}

type Message = {
    senderId: number;
    messageText: string;
}

type MessageWrapper = {
    userWrapper: UserWrapper;
    message: Message
}

type LocalStore = {
    posts: Post[];
    follows: number[];
    chats: Record<string, string[]>;
    bookings: { artistId: number; details: string }[];
};
const initialStore: LocalStore = { posts: [], follows: [], chats: {}, bookings: [] };

const sampleArtists: Artist[] = [
    { id: 1, name: "Luna Park", genre: "Indie Folk", location: "Austin, TX", bio: "Intimate acoustic melodies and story-driven songwriting rooted in the Texas Hill Country.", tags: "Indie, Folk, Acoustic, Songwriter, Austin" },
    { id: 2, name: "The Riverbeds", genre: "Indie Rock", location: "Nashville, TN", bio: "Gritty guitars, driving drums, and energetic rock anthems from East Nashville.", tags: "Rock, Indie, Alternative, Nashville, Band" },
    { id: 3, name: "Marisol Vega", genre: "Latin Pop", location: "Miami, FL", bio: "Sun-soaked Latin rhythms blended with modern electronic synths and soulful bilingual vocals.", tags: "Latin, Pop, Electronic, Dance, Miami" },
    { id: 4, name: "Northside Brass", genre: "Jazz", location: "Chicago, IL", bio: "Classic Chicago brass quintet fusing traditional jazz standards with modern improv.", tags: "Jazz, Brass, Instrumental, Chicago, Improv" },
    { id: 5, name: "The Juniper Collective", genre: "Indie Folk", location: "Waco, TX", bio: "Harmonies, banjos, and campfire ballads created by a community of Central Texas artists.", tags: "Indie, Folk, Acoustic, Harmony, Texas" },
    { id: 6, name: "Miles Bennett", genre: "Jazz", location: "Austin, TX", bio: "Neo-soul saxophone player and producer creating smooth late-night soundscapes.", tags: "Jazz, Soul, Neo-Soul, Saxophone, Chill" },
    { id: 7, name: "Amara Studio", genre: "Visual Art", location: "Dallas, TX", bio: "Abstract oil painter and digital illustrator capturing organic shapes and urban textures.", tags: "Visual Art, Painting, Illustration, Dallas" },
    { id: 8, name: "Sage & Sound", genre: "Alternative", location: "Portland, OR", bio: "Ethereal dreampop and indie-electronic textures for introspective listeners.", tags: "Alternative, Dreampop, Ambient, Electronic" },
    { id: 9, name: "William Waweru", genre: "Indie Folk", location: "Waco, TX", bio: "Acoustic storytelling, heartfelt guitar work, and community-driven indie sessions.", tags: "Indie, Folk, Acoustic, Singer, Storyteller" },
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
function userAccountId(user: UserPersona) {
    return user.role === "Fan" ? (user.id === 1 ? 1 : 5) : user.role === "Artist" ? 2 : 3;
}
export default function Home() {
    // Current Active Persona
    const [currentUser, setCurrentUser] = useState<UserPersona>(PERSONAS[0]); // Nicholas Nolen (Fan)
    const [showAccountMenu, setShowAccountMenu] = useState(false);

    // Active Navigation Tab
    const [tab, setTab] = useState("Discover");

    // General app state
    const [store, setStore] = useState<LocalStore>(initialStore);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");
    const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

    // Discover Tab State
    const [criteria, setCriteria] = useState({ name: "", genre: "", location: "" });
    const [artistResults, setArtistResults] = useState<Artist[]>(sampleArtists);
    const [busySearch, setBusySearch] = useState(false);
    const [searched, setSearched] = useState(false);
    const [source, setSource] = useState("api");
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [modalAction, setModalAction] = useState("");
    const [modalMessage, setModalMessage] = useState("");

    // Make a Post Tab State
    const [postText, setPostText] = useState("");
    const [isPublic, setPublic] = useState(true);
    const [commentsAllowed, setCommentsAllowed] = useState(true);

    // Use Case 3: Admin Verifications State
    const [applicationsList, setApplicationsList] = useState<ArtistApplication[]>([]);
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

    // Initialize local demo data & verify backend connection
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

        // Test backend connectivity
        fetch(`${API_BASE}/api/artists`, { signal: AbortSignal.timeout(3000) })
            .then(res => {
                if (res.ok) setBackendConnected(true);
                else setBackendConnected(false);
            })
            .catch(() => setBackendConnected(false));
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    // When active persona or tab changes, load appropriate data
    useEffect(() => {
        const timer = setTimeout(() => {
        if (currentUser.role === "Fan") {
            if (["Manage Events", "Ban Appeals", "Report Queue", "Artist Directory", "Verifications", "Make a post"].includes(tab)) {
                setTab("Recommendations");
            }
        } else if (currentUser.role === "Artist") {
            if (["Recommendations", "Ban Appeals", "Following", "Fan Profile", "Fan Reports", "Report Queue", "Artist Directory", "Verifications"].includes(tab)) {
                setTab("Manage Events");
            }
        } else if (currentUser.role === "Admin") {
            if (["Recommendations", "Manage Events", "Make a post", "Discover", "Following", "Fan Profile", "Fan Reports"].includes(tab)) {
                setTab("Ban Appeals");
            }
        }
        }, 0);
        return () => clearTimeout(timer);
    }, [currentUser, tab]);

    // Load recommendations when on Recommendations tab or fan changes
    useEffect(() => {
        if (tab === "Recommendations" && currentUser.role === "Fan") {
            loadRecommendations(userAccountId(currentUser));
        }
    }, [tab, currentUser]);

    useEffect(() => {
        const refresh = () => {
            if (currentUser.role === "Fan" && tab === "Recommendations") {
                void loadRecommendations(userAccountId(currentUser));
            }
        };
        window.addEventListener("fan-community-changed", refresh);
        return () => window.removeEventListener("fan-community-changed", refresh);
    }, [currentUser, tab]);

    // Load events when on Manage Events tab
    useEffect(() => {
        if (tab === "Manage Events") {
            loadEvents();
        }
    }, [tab]);

    // Load appeals when on Ban Appeals tab
    useEffect(() => {
        if (tab === "Ban Appeals" && currentUser.role === "Admin") {
            loadAppeals();
        }
    }, [tab, currentUser, appealsViewMode]);

    // Keep both the fan/artist discovery page and the admin moderation directory populated.
    useEffect(() => {
        if (tab === "Discover") {
            loadDiscoverArtists();
        } else if (tab === "Artist Directory" && currentUser.role === "Admin") {
            const controller = new AbortController();
            fetch(`${API_BASE}/api/artists?includeSuspended=true`, { signal: controller.signal })
                .then(async response => { if (!response.ok) throw new Error(); setArtistResults(await response.json()); })
                .catch(() => { if (!controller.signal.aborted) setError("Could not load the artist moderation directory. Please try again."); });
            return () => controller.abort();
        }
    }, [tab, currentUser, source]);

    // Load pending applications when on Verifications tab (Admin)
    useEffect(() => {
        if (tab === "Verifications" && currentUser.role === "Admin") {
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
            // Fallback for offline demo
            setRecommendationData({
                hasInteractions: fanId === 1,
                message: fanId === 1
                    ? "Personalized recommendations computed from your platform interactions."
                    : "Welcome! You haven't interacted with any artists yet.",
                genreAffinityScores: fanId === 1 ? { "Indie Folk": 75.0, "Jazz": 25.0 } : {},
                recommendations: sampleArtists.map((a, i) => ({
                    artist: a,
                    matchPercentage: 95 - i * 4,
                    matchingGenres: [a.genre],
                    reason: `Matched based on ${a.genre} affinity.`,
                    latentFeatureSummary: `Latent profile: [${a.genre} Affinity: High]`
                }))
            });
        } finally {
            setLoadingRecs(false);
        }
    }

    async function recordFanInteraction(artistId: number, type: string) {
        if (currentUser.role !== "Fan") return;
        try {
            await fetch(`${API_BASE}/api/recommendations/interactions?fanId=${userAccountId(currentUser)}&artistId=${artistId}&interactionType=${type}`, {
                method: "POST"
            });
            if (currentUser.role === "Fan") {
                loadRecommendations(userAccountId(currentUser));
            }
        } catch {
            // ignore offline
        }
    }

    async function clearFanInteractions() {
        try {
            await fetch(`${API_BASE}/api/recommendations/interactions/fan/${userAccountId(currentUser)}`, {
                method: "DELETE"
            });
            setNotice("Interaction history cleared! You are now experiencing the New Fan (cold-start) view.");
            loadRecommendations(userAccountId(currentUser));
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
                    reviewedAcknowledgment: true
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
                    reviewedAcknowledgment: true
                }
            ]);
        } finally {
            setLoadingEvents(false);
        }
    }

    function startEditEvent(ev: EventItem) {
        setEditingEventId(ev.id);
        setEventForm({
            ...ev,
            // Format datetime-local if necessary
            eventDate: ev.eventDate ? ev.eventDate.substring(0, 16) : "",
            reviewedAcknowledgment: false // Reset acknowledgment so artist reviews updated details!
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
            artistId: currentUser.id === 9 ? 9 : 1
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

        // Extension 6a: Check acknowledgment
        if (!eventForm.reviewedAcknowledgment) {
            setError("Error: Artist must acknowledge they have reviewed the details of their submission before submitting (Extension 6a).");
            return;
        }

        try {
            const payload = {
                artistId: eventForm.artistId || currentUser.id,
                eventType: eventForm.eventType,
                title: eventForm.title,
                description: eventForm.description,
                eventDate: eventForm.eventDate ? new Date(eventForm.eventDate).toISOString() : new Date().toISOString(),
                location: eventForm.location,
                virtual: !!eventForm.virtual,
                capacity: Number(eventForm.capacity),
                imageUrl: eventForm.imageUrl || "",
                status: eventForm.status || "Published",
                reviewedAcknowledgment: true
            };

            const res = await fetch(`${API_BASE}/api/events/${editingEventId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
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
                artistId: currentUser.id === 9 ? 9 : 1,
                eventType: eventForm.eventType,
                title: eventForm.title,
                description: eventForm.description,
                eventDate: eventForm.eventDate ? new Date(eventForm.eventDate).toISOString() : new Date().toISOString(),
                location: eventForm.location,
                virtual: !!eventForm.virtual,
                capacity: Number(eventForm.capacity),
                imageUrl: eventForm.imageUrl || "",
                status: eventForm.status || "Published",
                reviewedAcknowledgment: true
            };

            const res = await fetch(`${API_BASE}/api/events`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
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
            const url = appealsViewMode === "eligible"
                ? `${API_BASE}/api/moderation/appeals/open?adminId=${currentUser.id}`
                : `${API_BASE}/api/moderation/appeals`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch ban appeals");
            const data: BanAppeal[] = await res.json();
            setAppealsList(data);
            if (data.length > 0 && (!selectedAppeal || !data.some(a => a.id === selectedAppeal.id))) {
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
                    aiRecommendation: "AI ToS Evaluation (ToS §3.2 - Automated Activity): Timestamp analysis confirms sub-second duplicate submission matching network packet retry or client lag. Recommendation: Lift ban; fan account in good standing prior to incident.",
                    status: "OPEN"
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
                    aiRecommendation: "AI ToS Evaluation (ToS §5.1 - Community Conduct): Language violates civility guidelines. Second infraction. Recommendation: Admin discretion; consider 7-day temporary suspension instead of permanent ban.",
                    status: "OPEN"
                }
            ]);
        } finally {
            setLoadingAppeals(false);
        }
    }

    async function handleUnbanFan(appealId: number) {
        setError("");
        setNotice("");
        try {
            const res = await fetch(`${API_BASE}/api/moderation/appeals/${appealId}/unban?adminId=${currentUser.id}&notes=${encodeURIComponent(adminNotes || "Reviewed and approved by admin.")}`, {
                method: "POST"
            });
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
            const res = await fetch(`${API_BASE}/api/moderation/appeals/${appealId}/invalidate?adminId=${currentUser.id}&notes=${encodeURIComponent(adminNotes || "Marked invalid per policy.")}`, {
                method: "POST"
            });
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
                method: "PUT"
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Could not suspend artist.");
            }
            
            // Refresh the artist results so the UI shows them as suspended
            setNotice(`Success! Artist ID ${artistId} has been suspended.`);
            
            // Re-fetch the artists list to reflect changes
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
            if (!res.ok) throw new Error("Failed to load applications");
            setApplicationsList(await res.json());
        } catch {
            setApplicationsList([]); // Fails silently to empty queue if backend is missing
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
        if (source !== "api") return; // Only fetch if we are using the live backend
        setBusySearch(true);
        try {
            // This hits the GET /api/artists endpoint. 
            // Because we don't pass includeSuspended=true, it safely filters on the backend!
            const res = await fetch(`${API_BASE}/api/artists`);
            if (res.ok) {
                setArtistResults(await res.json());
                setSearched(false); // Reverts the UI title back to "Meet The Community"
            }
        } catch {
            // Fail silently on network errors so it doesn't interrupt the demo
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
        if (!Object.values(criteria).some(v => v.trim())) {
            setError("Enter a name, genre, or location to search.");
            return;
        }
        setBusySearch(true);
        try {
            if (source === "api") {
                const params = new URLSearchParams(Object.entries(criteria).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()]));
                // Fan search retains its role-checked endpoint. Artist browsing filters the
                // public directory without impersonating a fan.
                const url = currentUser.role === "Fan" ? `${API_BASE}/api/artists/search?${params}` : `${API_BASE}/api/artists`;
                const res = await fetch(url, { headers: { "X-User-Id": String(userAccountId(currentUser)) } });
                if (!res.ok) throw new Error();
                const found: Artist[] = await res.json();
                setArtistResults(currentUser.role === "Fan" ? found : found.filter(a =>
                    Object.entries(criteria).every(([key, value]) => !value.trim() || String(a[key as keyof Artist]).toLowerCase().includes(value.trim().toLowerCase()))));
            } else {
                const filtered = sampleArtists.filter(a =>
                    Object.entries(criteria).every(([k, v]) =>
                        !v.trim() || String(a[k as keyof Artist]).toLowerCase().includes(v.trim().toLowerCase())
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

    // Make a Post Handler
    function handlePublishPost(e: FormEvent) {
        e.preventDefault();
        if (!postText.trim()) {
            setError("Please write some text before publishing.");
            return;
        }
        const newPost: Post = {
            id: crypto.randomUUID(),
            text: postText.trim(),
            public: isPublic,
            comments: commentsAllowed,
            files: []
        };
        persistStore({ ...store, posts: [newPost, ...store.posts] });
        setPostText("");
        setNotice("Your post has been published to your profile!");
    }

    // Start a new conversation
    async function startConversation(e: FormEvent) {
        e.preventDefault();

        try {
            const recipient_res = await fetch(`${API_BASE}/api/artists/${recipientId}`);
            if (!recipient_res.ok) throw new Error("Could not find recipient.");
            const recipient = await recipient_res.json();

            const userWrapper: UserWrapper = {
                users: [currentUser, recipient],
            };

            const response = await fetch(
                `${API_BASE}/api/conversations`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(userWrapper),
                }
            );

        } catch {}
    }


    // Map legacy UI personas to UserAccount ids for the header-based account mechanism.
    const backendAccountId = userAccountId(currentUser);

    // Role-specific navigation items
    const navItems = currentUser.role === "Fan"
        ? [
            { label: "For You", icon: "✳", tabName: "Recommendations" },
            { label: "Discover", icon: "⌕", tabName: "Discover" },
            { label: "Following", icon: "♡", tabName: "Following" },
            { label: "My profile", icon: "◎", tabName: "Fan Profile" },
            { label: "Report content", icon: "⚑", tabName: "Fan Reports" },
        ]
        : currentUser.role === "Artist"
            ? [
                { label: "Discover", icon: "⌕", tabName: "Discover" },
                { label: "Make a post", icon: "＋", tabName: "Make a post" },
                { label: "Manage Events", icon: "▦", tabName: "Manage Events" },
                { label: "Messages", icon: "✉", tabName: "Messages"},
            ]
            : [
                { label: "Ban Appeals", icon: "⚖", tabName: "Ban Appeals" },
                { label: "Artist Directory", icon: "🛡️", tabName: "Artist Directory" },
                { label: "Verifications", icon: "✓", tabName: "Verifications" },
                { label: "Report queue", icon: "⚑", tabName: "Report Queue" },
            ];

    return (
        <FanCommunityProvider key={`${backendAccountId}-${currentUser.role}`} accountId={backendAccountId} role={currentUser.role}>
        <div className="app-shell">
            {/* SIDEBAR */}
            <aside>
                <Link className="brand" href="/">
                    a<span>ArtistConnect</span><i>●</i>
                </Link>

                {/* ACCOUNT PROFILE BUTTON & SWITCHER */}
                <div className="account-switcher">
                    {showAccountMenu && (
                        <div className="account-menu" id="demo-account-menu">
                            <small style={{ fontWeight: 700, padding: "4px 8px", color: "var(--muted)" }}>
                                PRESENTATION DEMO ACCOUNTS
                            </small>
                            {PERSONAS.map(p => (
                                <button
                                    key={p.id}
                                    className={`account-menu-item ${currentUser.id === p.id ? "active" : ""}`}
                                    onClick={() => {
                                        setCurrentUser(p);
                                        setTab(p.role === "Fan" ? "Discover" : p.role === "Artist" ? "Manage Events" : "Ban Appeals");
                                        setError("");
                                        setSelectedArtist(null);
                                        setShowAccountMenu(false);
                                        setNotice(`Switched active account to ${p.name} (${p.role})`);
                                    }}
                                >
                                    <div className="avatar">{p.avatar}</div>
                                    <div>
                                        <b style={{ fontSize: "12px", display: "block" }}>{p.name}</b>
                                        <small>{p.description}</small>
                                    </div>
                                    <span className={`role-badge ${p.role.toLowerCase()}`}>{p.role}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <button
                        className="account-btn"
                        onClick={() => setShowAccountMenu(!showAccountMenu)}
                        aria-expanded={showAccountMenu}
                        aria-controls="demo-account-menu"
                        title="Switch demo account"
                    >
                        <div className="avatar">{currentUser.avatar}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {currentUser.name}
                            </b>
                            <small>{currentUser.role} · switch demo account ▾</small>
                        </div>
                        <span className={`role-badge ${currentUser.role.toLowerCase()}`}>
                            {currentUser.role}
                        </span>
                    </button>
                </div>

                <p className="nav-label">
                    {currentUser.role.toUpperCase()} WORKSPACE
                </p>

                <nav>
                    {navItems.map(item => (
                        <button
                            key={item.tabName}
                            className={tab === item.tabName ? "active" : ""}
                            onClick={() => { setTab(item.tabName); setError(""); setNotice(""); }}
                        >
                            <span>{item.icon}</span>{item.label}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-note">
                    <span className="spark">✳</span>
                    <h3>Good art starts<br />with connection.</h3>
                    <p>Designed for independent artists, fans, and administrators.</p>
                </div>

            </aside>

            {/* MAIN WORKSPACE */}
            <div className="workspace">
                <header>
                    <span>Independent art. Shared experiences. Full-stack verified.</span>
                    <span className="status-dot">
                        Backend ({API_BASE}):{" "}
                        <strong style={{ color: backendConnected ? "#2c604c" : "#9e3926" }}>
                            {backendConnected ? "Live Connected ●" : "Connecting/Offline ○"}
                        </strong>
                    </span>
                </header>

                <main>
                    <div className="eyebrow">
                        LOGGED IN AS {currentUser.name.toUpperCase()} ({currentUser.role.toUpperCase()})
                    </div>

                    <div className="page-heading">
                        <div>
                            <h1>
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
                                {tab === "Recommendations" && "Personalized artist matches constructed from your platform interaction history and genre affinities."}
                                {tab === "Discover" && "Discover independent artists, view profiles, and engage with emerging communities."}
                                {tab === "Make a post" && "Share your art, creative process, and updates with your followers."}
                                {tab === "Manage Events" && "Create, review, and update your upcoming concerts, workshops, and exhibitions."}
                                {tab === "Ban Appeals" && "Review fan ban appeals, inspect report evidence, and evaluate automated AI Terms of Service recommendations."}
                            </p>
                        </div>

                        <span className="pill">
                            {["Following", "Fan Profile", "Fan Reports"].includes(tab) && "FAN COMMUNITY"}
                            {tab === "Report Queue" && "ADMIN REVIEW"}
                            {tab === "Recommendations" && "USE CASE: RECEIVE RECOMMENDATION"}
                            {tab === "Manage Events" && "USE CASE: UPDATE EVENT"}
                            {tab === "Ban Appeals" && "USE CASE: UNBAN FAN"}
                            {tab === "Discover" && "COMMUNITY EXPLORER"}
                            {tab === "Make a post" && "ARTIST STUDIO"}
                        </span>
                    </div>

                    {notice && <div className="notice" role="status">{notice}</div>}
                    {error && <div className="error" role="alert">{error}</div>}

                    {currentUser.role === "Fan" && tab === "Following" && <FollowingPanel/>}
                    {currentUser.role === "Fan" && tab === "Fan Profile" && <FanProfilePanel/>}
                    {currentUser.role === "Fan" && tab === "Fan Reports" && <FanReportsPanel/>}
                    {currentUser.role === "Admin" && tab === "Report Queue" && <AdminReportsPanel/>}


                    {/* ========================================================================= */}
                    {/* TAB: RECOMMENDATIONS (USE CASE: RECEIVE RECOMMENDATION - FAN)             */}
                    {/* ========================================================================= */}
                    {tab === "Recommendations" && (
                        <div>
                            {loadingRecs ? (
                                <div className="empty"><p>Calculating numerical genre affinities and latent AI features…</p></div>
                            ) : recommendationData ? (
                                <>
                                    {/* Taste Profile Affinity Breakdown */}
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
                                                    title="Clear interaction records to test the New Fan cold-start view"
                                                >
                                                    Clear history (Test Cold-Start)
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
                                        /* Extension 1a: Cold-start for New Fan */
                                        <div className="panel" style={{ marginBottom: "24px", background: "#f8faf5", borderColor: "#cbd6c5" }}>
                                            <div className="section-title">
                                                <div>
                                                    <span className="pill" style={{ background: "#e8efe1", color: "#325c41" }}>EXTENSION 1A: NEW FAN</span>
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
                                                <button
                                                    className="btn-secondary"
                                                    onClick={async () => {
                                                        // Seed some quick interactions to demonstrate real-time update
                                                        await recordFanInteraction(1, "FOLLOW");
                                                        await recordFanInteraction(5, "LIKE");
                                                        setNotice("Sample interactions recorded! Recommendations generated.");
                                                        loadRecommendations(userAccountId(currentUser));
                                                    }}
                                                >
                                                    Simulate Sample Fan Activity
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Recommendations Grid */}
                                    <div className="results-heading">
                                        <h2>
                                            {recommendationData.hasInteractions ? "Recommended Artists" : "Popular In Community"}{" "}
                                            <span>{recommendationData.recommendations.length}</span>
                                        </h2>
                                        <span>Personalized algorithmic matching</span>
                                    </div>

                                    <div className="artist-grid">
                                        {recommendationData.recommendations.map(({ artist, matchPercentage, reason, latentFeatureSummary }, i) => (
                                            <div className="artist-card" key={artist.id} style={{ display: "flex", flexDirection: "column" }}>
                                                <div className={`art-cover art-${i % 6}`}>
                                                    <span className="match-pill" style={{ position: "absolute", top: "12px", right: "12px" }}>
                                                        {matchPercentage.toFixed(0)}% Match
                                                    </span>
                                                    <small>{artist.genre}</small>
                                                </div>

                                                <div className="artist-info" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                                    <div className="avatar">
                                                        {artist.name.split(" ").map(s => s[0]).slice(0, 2).join("")}
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
                                                        <FollowButton artistId={artist.id}/>
                                                        <button
                                                            className="btn-secondary"
                                                            style={{ fontSize: "11px", padding: "6px 10px" }}
                                                            onClick={() => { setSelectedArtist(artist); setModalAction(""); setModalMessage(""); }}
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
                    )}

                    {/* ========================================================================= */}
                    {/* TAB: MANAGE EVENTS (USE CASE: UPDATE EVENT - ARTIST)                      */}
                    {/* ========================================================================= */}
                    {tab === "Manage Events" && (
                        <div>
                            {/* Sub-navigation */}
                            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                                <button
                                    className={eventSubTab === "list" ? "primary" : "btn-secondary"}
                                    onClick={() => { setEventSubTab("list"); setShowReviewStep(false); }}
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

                            {/* View 1: Events List */}
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
                                            {eventsList.map(ev => (
                                                <article key={ev.id} className="panel" style={{ display: "flex", flexDirection: "column" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                                        <span className="pill">{ev.eventType || "Event"}</span>
                                                        <span className="pill" style={{ background: ev.status === "Published" ? "#e7f2e4" : "#f5f5ea", color: ev.status === "Published" ? "#2b614c" : "#757f6b" }}>
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

                                                    <button
                                                        className="primary full"
                                                        onClick={() => startEditEvent(ev)}
                                                    >
                                                        Edit / Update Event ↗
                                                    </button>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* View 2: Edit / Update Event (Use Case Implementation) */}
                            {eventSubTab === "edit" && (
                                <div className="panel" style={{ maxWidth: "780px" }}>
                                    <div className="section-title">
                                        <div>
                                            <span className="eyebrow">STEP 1 & 2: MODIFY EVENT INFORMATION</span>
                                            <h2>Edit Event: {eventForm.title || "Existing Event"}</h2>
                                        </div>
                                        <button className="btn-secondary" onClick={() => setEventSubTab("list")}>Cancel</button>
                                    </div>

                                    {!showReviewStep ? (
                                        <form onSubmit={e => { e.preventDefault(); handleReviewStep(); }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                                                <label>
                                                    Event Title
                                                    <input
                                                        type="text"
                                                        value={eventForm.title || ""}
                                                        onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                                        placeholder="e.g. Austin Folk & Canvas"
                                                    />
                                                    {eventFormErrors.title && <small className="field-error">{eventFormErrors.title}</small>}
                                                </label>

                                                <label>
                                                    Event Type
                                                    <select
                                                        value={eventForm.eventType || "Concert"}
                                                        onChange={e => setEventForm({ ...eventForm, eventType: e.target.value })}
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
                                                        onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })}
                                                    />
                                                    {eventFormErrors.eventDate && <small className="field-error">{eventFormErrors.eventDate}</small>}
                                                </label>

                                                <label>
                                                    Capacity (Attendees)
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={eventForm.capacity || ""}
                                                        onChange={e => setEventForm({ ...eventForm, capacity: e.target.value })}
                                                    />
                                                    {eventFormErrors.capacity && <small className="field-error">{eventFormErrors.capacity}</small>}
                                                </label>
                                            </div>

                                            <label style={{ marginTop: "14px" }}>
                                                Location or Venue
                                                <input
                                                    type="text"
                                                    value={eventForm.location || ""}
                                                    onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                                                    placeholder="Venue name & address, or stream link"
                                                />
                                                {eventFormErrors.location && <small className="field-error">{eventFormErrors.location}</small>}
                                            </label>

                                            <label className="check-label" style={{ margin: "12px 0" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={!!eventForm.virtual}
                                                    onChange={e => setEventForm({ ...eventForm, virtual: e.target.checked })}
                                                />
                                                This is a virtual / livestreamed event
                                            </label>

                                            <label>
                                                Description & Program
                                                <textarea
                                                    rows={4}
                                                    value={eventForm.description || ""}
                                                    onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                                                    placeholder="Tell fans what to expect, band lineups, and schedule..."
                                                />
                                                {eventFormErrors.description && <small className="field-error">{eventFormErrors.description}</small>}
                                            </label>

                                            <label style={{ marginTop: "12px" }}>
                                                Promotional Image / Flyer URL
                                                <input
                                                    type="text"
                                                    value={eventForm.imageUrl || ""}
                                                    onChange={e => setEventForm({ ...eventForm, imageUrl: e.target.value })}
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
                                        /* Step 5 & 6: Review & Acknowledge Updated Details */
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

                                            {/* Mandatory Acknowledgment Checkbox (Extension 6a) */}
                                            <label className="ack-label">
                                                <input
                                                    type="checkbox"
                                                    checked={!!eventForm.reviewedAcknowledgment}
                                                    onChange={e => setEventForm({ ...eventForm, reviewedAcknowledgment: e.target.checked })}
                                                />
                                                <span>
                                                    I acknowledge that I have reviewed the details of my submission before submitting (Required).
                                                </span>
                                            </label>

                                            <div className="form-actions" style={{ marginTop: "20px" }}>
                                                <button type="button" className="btn-secondary" onClick={() => setShowReviewStep(false)}>
                                                    ← Back to Editing
                                                </button>
                                                <button
                                                    type="button"
                                                    className="primary"
                                                    onClick={submitUpdateEvent}
                                                >
                                                    Confirm & Submit Update ↗
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* View 3: Create Event Form */}
                            {eventSubTab === "create" && (
                                <div className="panel" style={{ maxWidth: "780px" }}>
                                    <div className="section-title">
                                        <div>
                                            <span className="eyebrow">NEW EVENT</span>
                                            <h2>Create an Event</h2>
                                        </div>
                                        <button className="btn-secondary" onClick={() => setEventSubTab("list")}>Cancel</button>
                                    </div>

                                    <form onSubmit={e => { e.preventDefault(); submitCreateEvent(); }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                                            <label>
                                                Event Title
                                                <input
                                                    type="text"
                                                    value={eventForm.title || ""}
                                                    onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                                    placeholder="e.g. Austin Folk & Canvas"
                                                />
                                                {eventFormErrors.title && <small className="field-error">{eventFormErrors.title}</small>}
                                            </label>

                                            <label>
                                                Event Type
                                                <select
                                                    value={eventForm.eventType || "Concert"}
                                                    onChange={e => setEventForm({ ...eventForm, eventType: e.target.value })}
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
                                                    onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })}
                                                />
                                                {eventFormErrors.eventDate && <small className="field-error">{eventFormErrors.eventDate}</small>}
                                            </label>

                                            <label>
                                                Capacity (Attendees)
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={eventForm.capacity || ""}
                                                    onChange={e => setEventForm({ ...eventForm, capacity: e.target.value })}
                                                />
                                            </label>
                                        </div>

                                        <label style={{ marginTop: "14px" }}>
                                            Location or Venue
                                            <input
                                                type="text"
                                                value={eventForm.location || ""}
                                                onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                                                placeholder="Venue name and city"
                                            />
                                            {eventFormErrors.location && <small className="field-error">{eventFormErrors.location}</small>}
                                        </label>

                                        <label>
                                            Description
                                            <textarea
                                                rows={4}
                                                value={eventForm.description || ""}
                                                onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
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

                    {/* ========================================================================= */}
                    {/* TAB: BAN APPEALS (USE CASE: UNBAN FAN - ADMIN)                            */}
                    {/* ========================================================================= */}
                    {tab === "Ban Appeals" && (
                        <div>
                            {/* Admin Context Header */}
                            <div className="panel" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fcfaf7" }}>
                                <div>
                                    <span className="eyebrow">MODERATOR SESSION</span>
                                    <h3 style={{ margin: "4px 0" }}>Logged in as {currentUser.name} (Admin ID: {currentUser.id})</h3>
                                    <small>Policy: A different admin than the banning admin must review appeals (conflict of interest prevention).</small>
                                </div>

                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => {
                                            // Toggle between Admin Alex (101) and Admin Garrett (102)
                                            const otherAdmin = currentUser.id === 101 ? PERSONAS[4] : PERSONAS[3];
                                            setCurrentUser(otherAdmin);
                                            setNotice(`Switched to ${otherAdmin.name} (Admin ID: ${otherAdmin.id}) to test reviewer perspective.`);
                                        }}
                                    >
                                        Switch to {currentUser.id === 101 ? "Admin Garrett (102)" : "Admin Alex (101)"} ⇄
                                    </button>

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
                                /* Extension 1a: No appeals */
                                <div className="empty">
                                    <h3>No open appeals</h3>
                                    <p>All ban appeals have been processed or there are no open appeals assigned to your queue.</p>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "24px", alignItems: "start" }}>
                                    {/* Appeals Queue List */}
                                    <div>
                                        <div className="results-heading">
                                            <h2>Queue <span>{appealsList.length}</span></h2>
                                        </div>

                                        {appealsList.map(appeal => (
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

                                    {/* Appeal Detail & Action Panel */}
                                    {selectedAppeal ? (
                                        <div className="panel">
                                            <div className="section-title">
                                                <div>
                                                    <span className="eyebrow">APPEAL CASE #{selectedAppeal.id}</span>
                                                    <h2>Review Fan Appeal: @{selectedAppeal.fanUsername}</h2>
                                                </div>
                                                <span className="pill">{selectedAppeal.status}</span>
                                            </div>

                                            {/* Conflict of Interest Warning if same admin */}
                                            {selectedAppeal.banningAdminId === currentUser.id && (
                                                <div className="conflict-warning">
                                                    ⚠️ <b>Conflict of Interest Warning:</b> You were the administrator who issued this initial ban ({selectedAppeal.banningAdminName}). Under system rules, another administrator must review and process this appeal.
                                                </div>
                                            )}

                                            {/* Fan Reasoning (Main Flow Step 3) */}
                                            <div style={{ marginTop: "16px" }}>
                                                <b style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Fan&apos;s Submitted Reason for Appeal:</b>
                                                <p style={{ background: "#f8faf5", padding: "14px", borderRadius: "8px", border: "1px solid #dce5dc", margin: "6px 0 16px", fontSize: "13px" }}>
                                                    &ldquo;{selectedAppeal.reason}&rdquo;
                                                </p>
                                            </div>

                                            {/* Offending Content (Reported Post/Comment) */}
                                            <div>
                                                <b style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Offending Content (Flagged Violation):</b>
                                                <div style={{ background: "#fffaf7", padding: "12px 14px", borderRadius: "8px", border: "1px dashed #e8c5ba", margin: "6px 0 16px", fontSize: "13px", color: "#8a3525", fontStyle: "italic" }}>
                                                    &ldquo;{selectedAppeal.offendingContent || "some sentence breaking ToS"}&rdquo;
                                                </div>
                                            </div>

                                            {/* Report Material Evidence (Main Flow Step 3) */}
                                            <div>
                                                <b style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Incident Report Material & Evidence:</b>
                                                <div style={{ background: "#fff5f2", padding: "12px 14px", borderRadius: "8px", border: "1px solid #f2dbd5", margin: "6px 0 16px", fontSize: "12px", fontFamily: "monospace", color: "#8a3525" }}>
                                                    {selectedAppeal.reportMaterial}
                                                </div>
                                            </div>

                                            {/* Automated AI Recommendation (Main Flow Step 4) */}
                                            <div className="ai-box">
                                                <h4><span>✳</span> Automated AI ToS Evaluation</h4>
                                                <p>{selectedAppeal.aiRecommendation}</p>
                                            </div>

                                            {/* Admin Review Notes & Actions */}
                                            {selectedAppeal.status === "OPEN" && (
                                                <div style={{ marginTop: "20px", borderTop: "1px solid var(--line)", paddingTop: "18px" }}>
                                                    <label>
                                                        Review Notes (Optional)
                                                        <textarea
                                                            rows={3}
                                                            value={adminNotes}
                                                            onChange={e => setAdminNotes(e.target.value)}
                                                            placeholder="Add internal notes on your moderation decision..."
                                                        />
                                                    </label>

                                                    <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                                                        <button
                                                            className="primary"
                                                            disabled={selectedAppeal.banningAdminId === currentUser.id}
                                                            onClick={() => handleUnbanFan(selectedAppeal.id)}
                                                        >
                                                            Unban Fan & Restore Login ↗
                                                        </button>

                                                        <button
                                                            className="btn-danger"
                                                            disabled={selectedAppeal.banningAdminId === currentUser.id}
                                                            onClick={() => handleInvalidateAppeal(selectedAppeal.id)}
                                                        >
                                                            Mark Appeal Invalid & Uphold Ban ✕
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

                    {/* ========================================================================= */}
                    {/* TAB: ARTIST DIRECTORY (USE CASE: SUSPEND ARTIST - ADMIN)                  */}
                    {/* ========================================================================= */}
                    {tab === "Artist Directory" && currentUser.role === "Admin" && (
                        <div className="panel">
                            <div className="section-title">
                                <div>
                                    <span className="eyebrow">MODERATOR CONTROLS</span>
                                    <h2>Platform Artists</h2>
                                </div>
                                <button className="btn-secondary" onClick={async () => {
                                    const res = await fetch(`${API_BASE}/api/artists?includeSuspended=true`);
                                    if (res.ok) setArtistResults(await res.json());
                                }}>
                                    Refresh Directory ↻
                                </button>
                            </div>

                            <div className="artist-grid" style={{ marginTop: "20px" }}>
                                {artistResults.map((a, i) => (
                                    <div className="artist-card" key={a.id} style={{ display: "flex", flexDirection: "column", opacity: a.suspended ? 0.6 : 1 }}>
                                        <div className={`art-cover art-${i % 6}`}>
                                            <span>{["◒", "〰", "◐", "✳", "◬", "◎"][i % 6]}</span>
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
                                                {a.suspended ? "Account Suspended ✕" : "Suspend Artist ⚠"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB: DISCOVER                                                             */}
                    {/* ========================================================================= */}
                    {tab === "Discover" && currentUser.role !== "Admin" && (
                        <>
                            <section className="search-panel">
                                <div className="section-title">
                                    <h2>Discover artists</h2>
                                    <label className="source">
                                        Source:{" "}
                                        <select value={source} onChange={e => { setSource(e.target.value); setArtistResults(e.target.value === "demo" ? sampleArtists : []); setSearched(false); }}>
                                            <option value="api">Live Backend (H2)</option>
                                            <option value="demo">Demo Catalog</option>
                                        </select>
                                    </label>
                                </div>

                                <form onSubmit={handleSearch} className="search-grid">
                                    <label>
                                        Artist name
                                        <input
                                            placeholder="Who are you looking for?"
                                            value={criteria.name}
                                            onChange={e => setCriteria({ ...criteria, name: e.target.value })}
                                        />
                                    </label>
                                    <label>
                                        Genre / style
                                        <input
                                            placeholder="e.g. Indie Folk, Jazz"
                                            value={criteria.genre}
                                            onChange={e => setCriteria({ ...criteria, genre: e.target.value })}
                                        />
                                    </label>
                                    <label>
                                        Location
                                        <input
                                            placeholder="City or state"
                                            value={criteria.location}
                                            onChange={e => setCriteria({ ...criteria, location: e.target.value })}
                                        />
                                    </label>
                                    <button className="primary" disabled={busySearch}>
                                        {busySearch ? "Searching…" : "Search artists ↗"}
                                    </button>
                                </form>
                            </section>

                            <div className="results-heading">
                                <h2>
                                    {searched ? "Search Results" : "Meet The Community"}{" "}
                                    <span>{artistResults.length}</span>
                                </h2>
                                <span>{source === "api" ? "Registered Database Artists" : "Sample Artists"}</span>
                            </div>

                            <div className="artist-grid">
                                {artistResults.map((a, i) => (
                                    <button
                                        className="artist-card"
                                        key={a.id}
                                        onClick={async () => {
                                            setSelectedArtist(a);
                                            setModalAction("");
                                            setModalMessage("");
                                            // Record View interaction
                                            if (currentUser.role === "Fan") {
                                                await recordFanInteraction(a.id, "VIEW");
                                            }
                                        }}
                                    >
                                        <div className={`art-cover art-${i % 6}`}>
                                            <span>{["◒", "〰", "◐", "✳", "◬", "◎"][i % 6]}</span>
                                            <small>{a.genre}</small>
                                        </div>
                                        <div className="artist-info">
                                            <div className="avatar">{a.name.split(" ").map(s => s[0]).slice(0, 2).join("")}</div>
                                            <h3>{a.name}</h3>
                                            <p>{a.genre}</p>
                                            <div className="card-footer">
                                                <span>⌖ {a.location}</span>
                                                <b>View profile ↗</b>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {tab === "Discover" && currentUser.role === "Admin" && (
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

                    {/* ========================================================================= */}
                    {/* TAB: MAKE A POST                                                          */}
                    {/* ========================================================================= */}
                    {tab === "Make a post" && (
                        <div className="studio-grid">
                            <section className="panel">
                                <h2>Create a post</h2>
                                <div className="byline">
                                    <div className="avatar">{currentUser.avatar}</div>
                                    <div>
                                        <b>{currentUser.name}</b>
                                        <small>Sharing from your {currentUser.role.toLowerCase()} profile</small>
                                    </div>
                                </div>

                                <form onSubmit={handlePublishPost}>
                                    <label>
                                        Your story
                                        <textarea
                                            rows={7}
                                            maxLength={5000}
                                            placeholder="What have you been creating?"
                                            value={postText}
                                            onChange={e => setPostText(e.target.value)}
                                        />
                                    </label>
                                    <small>{postText.length} / 5,000 characters</small>

                                    <div className="setting" style={{ marginTop: "16px" }}>
                                        <div>
                                            <b>Public post</b>
                                            <p>Visible to everyone. Turn off for a private post.</p>
                                        </div>
                                        <input
                                            aria-label="Public post"
                                            type="checkbox"
                                            checked={isPublic}
                                            onChange={e => setPublic(e.target.checked)}
                                        />
                                    </div>

                                    <div className="setting">
                                        <div>
                                            <b>Allow comments</b>
                                            <p>Make room for a conversation around your work.</p>
                                        </div>
                                        <input
                                            aria-label="Allow comments"
                                            type="checkbox"
                                            checked={commentsAllowed}
                                            onChange={e => setCommentsAllowed(e.target.checked)}
                                        />
                                    </div>

                                    <button className="primary full">Publish post ↗</button>
                                </form>
                            </section>

                            <section>
                                <h2 className="preview-heading">YOUR POSTS · {store.posts.length}</h2>
                                {store.posts.length === 0 ? (
                                    <div className="panel"><p>Your published posts will appear here.</p></div>
                                ) : (
                                    store.posts.map(p => (
                                        <article key={p.id} className="panel saved-post">
                                            <small>{currentUser.name} · {p.public ? "Public" : "Private"}</small>
                                            <p className="post-text">{p.text}</p>
                                        </article>
                                    ))
                                )}
                            </section>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB: VERIFICATIONS */}
                    {/* ========================================================================= */}
                    {tab === "Verifications" && currentUser.role === "Admin" && (
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
                                    Refresh Queue ↻
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
                                    {applicationsList.map(app => (
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
                                                <p style={{ fontSize: "13px", whiteSpace: "pre-line", margin: "8px 0 0", color: "#2c4538" }}>
                                                    {app.portfolioLinks}
                                                </p>
                                            </div>

                                            <div style={{ display: "flex", gap: "12px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                                                <button 
                                                    className="primary" 
                                                    onClick={() => handleApproveApplication(app.id, app.applicantName)}
                                                >
                                                    Approve & Provision Artist Profile ✓
                                                </button>
                                                <button 
                                                    className="btn-secondary" 
                                                    onClick={() => handleRejectApplication(app.id, app.applicantName)}
                                                    style={{ color: "#9e3926", borderColor: "#eccdc6" }}
                                                >
                                                    Reject Application ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {tab === "Messages" && (
                        <div className="studio-grid">

                            <form onSubmit={startConversation}>
                                <label>Start a new conversation</label>

                                <textarea
                                    rows={7}
                                    maxLength={5000}
                                    placeholder={"Type your message here..."}
                                    value={messageText}
                                    onChange={e => setMessageText(e.target.value)}
                                />

                                <input
                                    aria-label={"Recipient ID"}
                                    type={"text"}
                                    placeholder={"ID of the user to send the message to"}
                                    onChange={e => setRecipientId(e.target.valueAsNumber)}
                                />

                                <button className={"primary full"}>Send message</button>

                            </form>

                        </div>
                    )}

                </main>

                <footer>
                    <b>ArtistConnect</b>
                    <span>A home for independent expression.</span>
                    <span>Pair programming with Nicholas Nolen · Full-Stack Integration Complete</span>
                </footer>
            </div>

            {/* ARTIST PROFILE MODAL */}
            {selectedArtist && (
                <dialog open aria-modal="true" aria-labelledby="profile-title" className="modal">
                    <div className="modal-heading">
                        <span className="eyebrow">ARTIST PROFILE</span>
                        <button aria-label="Close artist profile" onClick={() => setSelectedArtist(null)}>×</button>
                    </div>

                    <div className="profile-art">✳</div>
                    <h2 id="profile-title">{selectedArtist.name}</h2>
                    <p>{selectedArtist.genre} · {selectedArtist.location}</p>
                    {selectedArtist.bio && <p style={{ fontSize: "13px", color: "#3e4d44" }}>{selectedArtist.bio}</p>}
                    {selectedArtist.tags && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "10px 0" }}>
                            {selectedArtist.tags.split(",").map((t, idx) => (
                                <span key={idx} className="pill" style={{ fontSize: "9px" }}>#{t.trim()}</span>
                            ))}
                        </div>
                    )}

                    <div className="profile-actions">
                        <FollowButton artistId={selectedArtist.id}/>
                        <button onClick={() => { setModalAction("chat"); setModalMessage(""); }}>Start chat</button>
                        <button className="primary" onClick={() => { setModalAction("book"); setModalMessage(""); }}>Book artist ↗</button>

                        {currentUser.role === "Fan" && (
                            <button 
                                className="primary" 
                                style={{ background: "#4a5b66", borderColor: "#4a5b66" }} 
                                onClick={() => { setModalAction("comment"); setModalMessage(""); }}
                            >
                                Comment on Artwork 💬
                            </button>
                        )}
                    </div>

                    <ReportArtistButton artistId={selectedArtist.id}/>

                    {modalAction && (
                        <form
                            onSubmit={async e => {
                                e.preventDefault();
                                if (!modalMessage.trim()) return;
                                if (modalAction === "chat") {
                                    const nextChats = {
                                        ...store.chats,
                                        [selectedArtist.id]: [...(store.chats[selectedArtist.id] || []), modalMessage.trim()]
                                    };
                                    persistStore({ ...store, chats: nextChats });
                                } else if (modalAction === "book") {
                                    const nextBookings = [...store.bookings, { artistId: selectedArtist.id, details: modalMessage.trim() }];
                                    persistStore({ ...store, bookings: nextBookings });
                                    await recordFanInteraction(selectedArtist.id, "BOOKING");
                                } else if (modalAction === "comment") {
                                    try {
                                        const dummyPostId = 101; // Targeting a featured artwork post
                                        const res = await fetch(`${API_BASE}/api/posts/${dummyPostId}/comments?fanId=${userAccountId(currentUser)}&artistId=${selectedArtist.id}&genre=${encodeURIComponent(selectedArtist.genre)}`, {
                                            method: "POST",
                                            headers: { "Content-Type": "text/plain" }, // Matches backend @RequestBody String
                                            body: modalMessage.trim()
                                        });
                                        
                                        if (!res.ok) throw new Error("Failed to post comment.");
                                        
                                        // Refresh the Fan's recommendations so the 3.0 weight immediately updates their taste profile
                                        loadRecommendations(userAccountId(currentUser));
                                        setModalMessage("");
                                        setModalAction("");
                                        setNotice(`Comment posted on ${selectedArtist.name}'s artwork! Your taste profile affinity for ${selectedArtist.genre} has increased.`);
                                    } catch (err: unknown) {
                                        const msg = err instanceof Error ? err.message : String(err);
                                        setError(`Could not post comment: ${msg}`);
                                    }
                                }
                                setModalMessage("");
                                setNotice(modalAction === "chat" ? "Message saved." : "Booking request recorded!");
                            }}
                        >
                            <h3>
                                {modalAction === "chat" ? "Your conversation" : 
                                modalAction === "book" ? "Booking request" : 
                                "Comment on featured artwork"}
                            </h3>
                            <label>
                                {modalAction === "chat" ? "Message" : 
                                modalAction === "book" ? "Event details, date, and contact information" : 
                                "Leave a comment on this artist's recent post"}
                                <textarea
                                    required
                                    value={modalMessage}
                                    onChange={e => setModalMessage(e.target.value)}
                                    rows={3}
                                />
                            </label>
                            <button className="primary">
                                {modalAction === "chat" ? "Send message" : 
                                modalAction === "book" ? "Submit booking request" : 
                                "Post comment ↗"}
                            </button>
                        </form>
                    )}
                </dialog>
            )}
        </div>
        </FanCommunityProvider>
    );
}
