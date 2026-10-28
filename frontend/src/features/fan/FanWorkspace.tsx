import { useState, useEffect, type FormEvent } from "react";
import { UserPersona, Artist, RecommendationData, LocalStore } from "../../types";
import { sampleArtists } from "../../constants";
import { API_BASE } from "../../constants/index";

export default function FanWorkspace({ 
    currentUser, tab, onSelectArtist, store, setTab 
}: { 
    currentUser: UserPersona; tab: string; 
    onSelectArtist: (a: Artist) => void; store: LocalStore; setTab: (t: string) => void; 
}) {
     // 1. FAN DOMAIN STATE
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    // Discover State
    const [criteria, setCriteria] = useState({ name: "", genre: "", location: "" });
    const [artistResults, setArtistResults] = useState<Artist[]>(sampleArtists);
    const [busySearch, setBusySearch] = useState(false);
    const [searched, setSearched] = useState(false);
    const [source, setSource] = useState("api");

    // Recommendations State
    const [recommendationData, setRecommendationData] = useState<RecommendationData | null>(null);
    const [loadingRecs, setLoadingRecs] = useState(false);
    

    // 2. FAN LIFECYCLE (Data fetching based on tab)
    useEffect(() => {
        if (tab === "Recommendations") loadRecommendations(currentUser.id);
        if (tab === "Discover") loadDiscoverArtists();
    }, [tab, currentUser.id, source]);

    // 3. FAN DOMAIN METHODS
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
                const params = new URLSearchParams(Object.entries(criteria).filter(([_, v]) => v.trim()).map(([k, v]) => [k, v.trim()]));
                const res = await fetch(`${API_BASE}/api/artists/search?${params}`);
                if (!res.ok) throw new Error();
                const found = await res.json();
                setArtistResults(found);
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

    async function recordFanInteraction(artistId: number, type: string) {
        try {
            await fetch(`${API_BASE}/api/recommendations/interactions?fanId=${currentUser.id}&artistId=${artistId}&interactionType=${type}`, {
                method: "POST"
            });
            if (currentUser.role === "Fan") {
                loadRecommendations(currentUser.id);
            }
        } catch {
            // ignore offline
        }
    }

    async function clearFanInteractions() {
        try {
            await fetch(`${API_BASE}/api/recommendations/interactions/fan/${currentUser.id}`, {
                method: "DELETE"
            });
            setNotice("Interaction history cleared! You are now experiencing the New Fan (cold-start) view.");
            loadRecommendations(currentUser.id);
        } catch {
            setError("Could not clear interactions on backend.");
        }
    }

    return (
        <div>
            {notice && <div className="notice">{notice}</div>}
            {error && <div className="error">{error}</div>}

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
                                                loadRecommendations(currentUser.id);
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
                                {recommendationData.recommendations.map(({ artist, matchPercentage, matchingGenres, reason, latentFeatureSummary }, i) => (
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
                                                <button
                                                    style={{ fontSize: "11px", padding: "6px 10px" }}
                                                    onClick={async () => {
                                                        await recordFanInteraction(artist.id, "FOLLOW");
                                                        setNotice(`Followed ${artist.name}! Your recommendations have been updated.`);
                                                    }}
                                                >
                                                    {store.follows.includes(artist.id) ? "Following ✓" : "Follow +"}
                                                </button>
                                                <button
                                                    className="btn-secondary"
                                                    style={{ fontSize: "11px", padding: "6px 10px" }}
                                                    onClick={() => onSelectArtist(artist)}
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
            {/* TAB: DISCOVER                                                             */}
            {/* ========================================================================= */}
            {tab === "Discover" && currentUser.role !== "Admin" &&  (
                <>
                    <section className="search-panel">
                        <div className="section-title">
                            <h2>Discover artists</h2>
                            <label className="source">
                                Source:{" "}
                                <select value={source} onChange={e => { setSource(e.target.value); setArtistResults(sampleArtists); }}>
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
                                    onSelectArtist(a);
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
        </div>
    );
}