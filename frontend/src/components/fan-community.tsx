"use client";
import Link from "next/link";
import Image from "next/image";
import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const ROOT = "/api/fan-community";
type Account = {
    accountId: number;
    role: string;
};
const AccountContext = createContext<Account>({ accountId: 1, role: "Fan" });
export function FanCommunityProvider({ accountId, role, children }: Account & {
    children: ReactNode;
}) {
    return <AccountContext.Provider value={{ accountId, role }}>{children}</AccountContext.Provider>;
}
type Follow = {
    artistId: number;
    name: string;
    genre: string;
    location: string;
    available: boolean;
    followerCount: number;
    following: boolean;
};
type Profile = {
    userId: number;
    version: number;
    displayName: string;
    biography: string;
    interests: string | null;
    image: string;
    publicProfile: boolean;
    showInterests: boolean;
    showFollowing: boolean;
    supportedArtists: Follow[] | null;
};
type Target = {
    type: "USER" | "POST" | "EVENT";
    id: number;
    title: string;
};
type Evidence = {
    evidenceId: string;
    targetType: Target["type"];
    targetId: number;
    snapshot: string;
};
type Report = {
    id: number;
    reporterId: number;
    targetType: string;
    targetId: number;
    reason: string;
    details: string;
    targetSnapshot: string;
    status: string;
    resolutionNotes?: string;
    action?: string;
};
class ApiError extends Error {
    constructor(message: string, public fields: Record<string, string> = {}) { super(message); }
}
async function request<T>(id: number, path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(API + path, { ...options, signal: options.signal || AbortSignal.timeout(10000), headers: { "Content-Type": "application/json", "X-User-Id": String(id), ...options.headers } });
    if (!response.ok) {
        const problem = await response.json().catch(() => ({}));
        throw new ApiError(problem.detail || `Request failed (${response.status}). Please try again.`, problem.errors);
    }
    return response.status === 204 ? undefined as T : response.json();
}
const changed = () => window.dispatchEvent(new Event("fan-community-changed"));
const errorText = (e: unknown) => e instanceof Error ? (e.name === "TypeError" || e.name === "TimeoutError" ? "Could not reach the backend. Your changes have not been saved. Please retry." : e.message) : "Please try again.";
function Feedback({ error, notice }: {
    error: string;
    notice?: string;
}) {
    return <>{error && <p className="error" role="alert">{error}</p>}{notice && <p className="notice" role="status">{notice}</p>}</>;
}
export function FollowButton({ artistId }: {
    artistId: number;
}) {
    const { accountId, role } = useContext(AccountContext);
    const [state, setState] = useState<Follow | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    useEffect(() => {
        if (role !== "Fan" && role !== "Artist")
            return;
        const controller = new AbortController();
        const load = () => request<Follow>(accountId, `${ROOT}/artists/${artistId}/follow`, { signal: controller.signal })
            .then(value => { setState(value); setError(""); }).catch(e => { if (!controller.signal.aborted)
            setError(errorText(e)); });
        void load();
        window.addEventListener("fan-community-changed", load);
        return () => { controller.abort(); window.removeEventListener("fan-community-changed", load); };
    }, [accountId, artistId, role]);
    if (role !== "Fan" && role !== "Artist")
        return null;
    async function toggle() {
        setBusy(true);
        setError("");
        setNotice("");
        try {
            if (state?.following) {
                await request(accountId, `${ROOT}/artists/${artistId}/follow`, { method: "DELETE" });
                setNotice("Artist unfollowed.");
            }
            else {
                const value = await request<Follow>(accountId, `${ROOT}/artists/${artistId}/follow`, { method: "PUT" });
                setState(value);
                setNotice("You are now following this artist.");
            }
            changed();
        }
        catch (e) {
            setError(errorText(e));
        }
        finally {
            setBusy(false);
        }
    }
    return <div className="community-follow"><button disabled={busy || (!state?.available && !state?.following && !!state)} onClick={toggle}>
        {busy ? "Saving…" : state?.following ? "Following - Unfollow" : state && !state.available ? "Artist unavailable" : "Follow artist +"}
    </button>{state && <small>{state.followerCount} {state.followerCount === 1 ? "follower" : "followers"}</small>}<Feedback error={error} notice={notice}/></div>;
}
export function FollowingPanel() {
    const { accountId } = useContext(AccountContext);
    const [items, setItems] = useState<Follow[] | null>(null);
    const [error, setError] = useState("");
    const load = useCallback(async () => {
        try {
            setItems(await request<Follow[]>(accountId, `${ROOT}/following`));
            setError("");
        }
        catch (e) {
            setError(errorText(e));
        }
    }, [accountId]);
    useEffect(() => { const timer = setTimeout(() => void load(), 0); window.addEventListener("fan-community-changed", load); return () => { clearTimeout(timer); window.removeEventListener("fan-community-changed", load); }; }, [load]);
    return <section className="community-section"><h2>Artists you support</h2><p>Your follows are saved to your account and feed your artist recommendations.</p><Feedback error={error}/><button onClick={load}>Refresh following</button>{items === null && !error && <p role="status">Loading following…</p>}{items?.length === 0 && <div className="panel">You aren’t following any artists yet. Find someone in Discover or For You.</div>}<div className="community-grid">{items?.map(a => <article className="panel" key={a.artistId}><h3>{a.name}</h3><p>{a.genre} · {a.location}</p>{!a.available && <p>This artist is currently unavailable.</p>}<div style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "center" }}><FollowButton artistId={a.artistId}/><Link href={`/artist/${a.artistId}`} className="btn-secondary" style={{ fontSize: "11px", padding: "6px 12px", textDecoration: "none" }}>View profile ↗</Link></div></article>)}</div></section>;
}
export function FanProfilePanel() {
    const { accountId } = useContext(AccountContext);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [fields, setFields] = useState<Record<string, string>>({});
    const [mode, setMode] = useState<"edit" | "preview">("edit");
    const [showRecentInteractions, setShowRecentInteractions] = useState(() => {
        if (typeof window !== "undefined") {
            const val = localStorage.getItem("fan_pref_showInteractions");
            return val !== null ? val === "true" : true;
        }
        return true;
    });

    const load = useCallback(async () => {
        try {
            setProfile(await request<Profile>(accountId, `${ROOT}/profile`));
            setError("");
            setFields({});
        } catch (e) {
            setError(errorText(e));
        }
    }, [accountId]);

    useEffect(() => {
        const timer = setTimeout(() => void load(), 0);
        return () => clearTimeout(timer);
    }, [load]);

    async function save(e: FormEvent) {
        e.preventDefault();
        if (!profile) return;
        setBusy(true);
        setError("");
        setNotice("");
        setFields({});
        try {
            const saved = await request<Profile>(accountId, `${ROOT}/profile`, {
                method: "PUT",
                body: JSON.stringify(profile),
            });
            setProfile(saved);
            if (typeof window !== "undefined") {
                localStorage.setItem("fan_pref_showInteractions", String(showRecentInteractions));
            }
            setNotice("Your profile and preferences have been updated.");
            changed();
        } catch (e) {
            setError(errorText(e));
            if (e instanceof ApiError) setFields(e.fields);
        } finally {
            setBusy(false);
        }
    }

    async function upload(file?: File) {
        if (!file || !profile) return;
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 512000) {
            setError("Choose a PNG, JPEG, or WebP image no larger than 500 KB.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            setProfile((previous) => (previous ? { ...previous, image: data } : previous));
        } catch {
            setError("The image could not be read. Please choose it again.");
        } finally {
            setBusy(false);
        }
    }

    const quickInterests = [
        "Indie Folk",
        "Street Art / Graffiti",
        "Mixed-Media",
        "Visual Media",
        "Electronic / Synth",
        "Jazz & Soul",
        "Photography",
    ];

    function toggleQuickInterest(tag: string) {
        if (!profile) return;
        const currentTags = (profile.interests || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        const exists = currentTags.some((t) => t.toLowerCase() === tag.toLowerCase());
        const updatedTags = exists
            ? currentTags.filter((t) => t.toLowerCase() !== tag.toLowerCase())
            : [...currentTags, tag];
        setProfile({ ...profile, interests: updatedTags.join(", ") });
    }

    return (
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
            {/* PROFILE MODE SWITCHER: EDIT VS VIEW AS PUBLIC */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--line-strong)",
                    padding: "8px 16px",
                    borderRadius: "12px",
                }}
            >
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        type="button"
                        onClick={() => setMode("edit")}
                        className={mode === "edit" ? "primary" : "btn-secondary"}
                        style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 700 }}
                    >
                        Edit Profile & Bio
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("preview")}
                        className={mode === "preview" ? "primary" : "btn-secondary"}
                        style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 700 }}
                    >
                        View as Public (Preview Mode)
                    </button>
                </div>
                <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                    {mode === "preview" ? "Live Public Preview" : "Personal Profile Editor"}
                </span>
            </div>

            <Feedback error={error} notice={notice} />

            {!profile && !error && (
                <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
                    <p role="status">Loading profile…</p>
                </div>
            )}

            {/* 1. EDIT MODE */}
            {profile && mode === "edit" && (
                <section className="panel" style={{ padding: "32px" }}>
                    <div className="section-title" style={{ marginBottom: "24px" }}>
                        <div>
                            <span className="eyebrow">YOUR COMMUNITY IDENTITY</span>
                            <h2 style={{ margin: "4px 0 0" }}>Manage Fan Profile</h2>
                            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "4px 0 0" }}>
                                Share your story, curate your artistic interests, and control how other members see your activity.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={save} className="community-form">
                        {/* Display Name */}
                        <label>
                            Display Name
                            <input
                                aria-label="Display name"
                                required
                                maxLength={80}
                                value={profile.displayName}
                                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                aria-invalid={!!fields.displayName}
                                placeholder="Your public community handle"
                            />
                            <small className="field-error">{fields.displayName}</small>
                        </label>

                        {/* About Me / Bio */}
                        <label>
                            About Me & Artistic Taste
                            <textarea
                                aria-label="About Me & Biography"
                                rows={5}
                                maxLength={2000}
                                value={profile.biography}
                                onChange={(e) => setProfile({ ...profile, biography: e.target.value })}
                                aria-invalid={!!fields.biography}
                                placeholder="Tell other fans and artists what inspires you, what concerts you attend, and what kind of art you love..."
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                                <small style={{ color: "var(--muted)" }}>No HTML or script tags. Markdown supported.</small>
                                <small style={{ color: "var(--muted)" }}>{profile.biography.length} / 2,000</small>
                            </div>
                            <small className="field-error">{fields.biography}</small>
                        </label>

                        {/* Profile Image Upload */}
                        <div style={{ marginTop: "12px", border: "1px dashed var(--line-strong)", borderRadius: "12px", padding: "18px", background: "rgba(255, 255, 255, 0.02)" }}>
                            <label style={{ margin: 0, fontWeight: 700, fontSize: "13px" }}>
                                Profile Avatar Photo
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    disabled={busy}
                                    onChange={(e) => {
                                        void upload(e.target.files?.[0]);
                                        e.target.value = "";
                                    }}
                                    style={{ marginTop: "8px" }}
                                />
                                <small style={{ display: "block", color: "var(--muted)", marginTop: "4px" }}>
                                    PNG, JPEG, or WebP · 500 KB maximum · Square recommended
                                </small>
                            </label>

                            {profile.image && (
                                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "14px" }}>
                                    <Image
                                        className="fan-photo"
                                        src={profile.image}
                                        width={80}
                                        height={80}
                                        unoptimized
                                        alt="Your profile image"
                                        style={{ borderRadius: "50%", border: "2px solid var(--spray-cyan)", objectFit: "cover" }}
                                    />
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setProfile({ ...profile, image: "" })}
                                        style={{ fontSize: "11px", color: "var(--spray-pink)" }}
                                    >
                                        Remove Avatar
                                    </button>
                                </div>
                            )}
                            <small className="field-error">{fields.image}</small>
                        </div>

                        {/* Artistic Interests */}
                        <div style={{ marginTop: "16px" }}>
                            <label>
                                Artistic Interests & Tags
                                <input
                                    aria-label="Artistic interests"
                                    maxLength={300}
                                    value={profile.interests || ""}
                                    onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                                    aria-invalid={!!fields.interests}
                                    placeholder="e.g. Indie Folk, Street Art, Lo-fi Beats, Cyberpunk 3D"
                                />
                                <small className="field-error">{fields.interests}</small>
                            </label>
                            {/* Quick suggestion tags */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                                {quickInterests.map((tag) => {
                                    const selected = (profile.interests || "")
                                        .toLowerCase()
                                        .includes(tag.toLowerCase());
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleQuickInterest(tag)}
                                            style={{
                                                fontSize: "11px",
                                                padding: "4px 10px",
                                                borderRadius: "16px",
                                                border: selected ? "1px solid var(--spray-cyan)" : "1px solid var(--line)",
                                                background: selected ? "rgba(6, 182, 212, 0.15)" : "rgba(255, 255, 255, 0.04)",
                                                color: selected ? "var(--spray-cyan)" : "var(--muted)",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {selected ? "[x] " : "+ "}
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Privacy & Display Toggles */}
                        <fieldset style={{ marginTop: "24px", border: "1px solid var(--line-strong)", borderRadius: "12px", padding: "18px", background: "rgba(255, 255, 255, 0.02)" }}>
                            <legend style={{ fontWeight: 700, fontSize: "12px", color: "var(--spray-cyan)", textTransform: "uppercase", letterSpacing: "1px" }}>
                                Profile Display & Privacy Toggles
                            </legend>

                            <label className="community-check" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={profile.publicProfile}
                                    onChange={(e) => setProfile({ ...profile, publicProfile: e.target.checked })}
                                />
                                <div>
                                    <b>Make my profile visible to other community members</b>
                                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                                        Allow other fans and creators to find your profile in member lists.
                                    </p>
                                </div>
                            </label>

                            <label className="community-check" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={profile.showInterests}
                                    onChange={(e) => setProfile({ ...profile, showInterests: e.target.checked })}
                                />
                                <div>
                                    <b>Display my artistic interests</b>
                                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                                        Show your favorite art categories and genres on your public card.
                                    </p>
                                </div>
                            </label>

                            <label className="community-check" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={profile.showFollowing}
                                    onChange={(e) => setProfile({ ...profile, showFollowing: e.target.checked })}
                                />
                                <div>
                                    <b>Display the artists I support</b>
                                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                                        Show creators and independent musicians you follow.
                                    </p>
                                </div>
                            </label>

                            <label className="community-check" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={showRecentInteractions}
                                    onChange={(e) => setShowRecentInteractions(e.target.checked)}
                                />
                                <div>
                                    <b>Display my recently interacted posts & activity</b>
                                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                                        Show posts you have recently liked, comments, and booked concerts.
                                    </p>
                                </div>
                            </label>
                        </fieldset>

                        {/* Supported Artists Summary */}
                        <div style={{ marginTop: "18px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                                Currently Supported Artists
                            </span>
                            <p style={{ marginTop: "4px", fontSize: "13px" }}>
                                {profile.supportedArtists?.length
                                    ? profile.supportedArtists.map((a) => a.name).join(", ")
                                    : "You haven't followed any artists yet."}
                            </p>
                        </div>

                        {/* Save Action */}
                        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                            <button className="primary" disabled={busy} style={{ flex: 1, padding: "12px" }}>
                                {busy ? "Saving Profile…" : "Save Profile Changes"}
                            </button>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setMode("preview")}
                                style={{ padding: "12px 20px" }}
                            >
                                Preview Public View
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {/* 2. PUBLIC PREVIEW MODE ("HOW OTHER FANS WILL SEE YOUR PROFILE & POSTS") */}
            {profile && mode === "preview" && (
                <div style={{ display: "grid", gap: "24px" }}>
                    {/* Preview Mode Header banner */}
                    <div
                        style={{
                            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(244, 63, 94, 0.1))",
                            border: "1px solid var(--spray-cyan)",
                            borderRadius: "12px",
                            padding: "16px 20px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "var(--spray-cyan)" }}>
                                LIVE PUBLIC PREVIEW
                            </span>
                            <h3 style={{ margin: "2px 0 0", fontSize: "16px" }}>This is how other fans and creators see you</h3>
                            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                                Verifying your About Me, toggled interests, supported artists, and public comment identity.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="primary"
                            onClick={() => setMode("edit")}
                            style={{ padding: "8px 16px", fontSize: "12px" }}
                        >
                            Return to Editor
                        </button>
                    </div>

                    {!profile.publicProfile && (
                        <div className="notice" style={{ borderColor: "var(--spray-pink)", color: "var(--spray-pink)" }}>
                            <b>Your profile is currently Private.</b> Other community members cannot view your profile details unless you enable &quot;Make my profile visible&quot; in settings.
                        </div>
                    )}

                    {/* PUBLIC PROFILE CARD */}
                    <section className="panel" style={{ padding: "32px", position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "24px", flexWrap: "wrap" }}>
                            {profile.image ? (
                                <Image
                                    className="fan-photo"
                                    src={profile.image}
                                    width={110}
                                    height={110}
                                    unoptimized
                                    alt={`${profile.displayName}'s avatar`}
                                    style={{
                                        borderRadius: "50%",
                                        border: "3px solid var(--spray-cyan)",
                                        boxShadow: "0 0 16px rgba(6, 182, 212, 0.3)",
                                        objectFit: "cover",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "110px",
                                        height: "110px",
                                        borderRadius: "50%",
                                        background: "linear-gradient(135deg, rgba(6, 182, 212, 0.4), rgba(244, 63, 94, 0.4))",
                                        border: "2px solid var(--line-strong)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "36px",
                                        fontWeight: 800,
                                        color: "#ffffff",
                                    }}
                                >
                                    {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : "F"}
                                </div>
                            )}

                            <div style={{ flex: 1, minWidth: "260px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                    <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 800 }}>{profile.displayName || "Anonymous Fan"}</h2>
                                    <span className="pill" style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--spray-cyan)" }}>
                                        FAN · COMMUNITY MEMBER
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: "8px", marginTop: "6px", fontSize: "12px", color: "var(--muted)" }}>
                                    <span>Member ID #{profile.userId}</span>
                                    <span>•</span>
                                    <span style={{ color: profile.publicProfile ? "#4ade80" : "var(--spray-pink)" }}>
                                        {profile.publicProfile ? "Public Profile" : "Private Profile"}
                                    </span>
                                </div>

                                {/* ABOUT ME TEXT */}
                                <div style={{ marginTop: "16px" }}>
                                    <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--muted)" }}>
                                        ABOUT ME
                                    </span>
                                    <p style={{ marginTop: "6px", fontSize: "14px", lineHeight: "1.7", color: "var(--ink)", whiteSpace: "pre-line" }}>
                                        {profile.biography || "This fan has not shared an About Me bio yet."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ARTISTIC INTERESTS (TOGGLED) */}
                        <div style={{ marginTop: "28px", borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--spray-cyan)" }}>
                                    ARTISTIC INTERESTS
                                </span>
                                {!profile.showInterests && (
                                    <span style={{ fontSize: "11px", color: "var(--spray-pink)" }}>
                                        Hidden by user privacy settings
                                    </span>
                                )}
                            </div>

                            {profile.showInterests ? (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {(profile.interests || "Indie Folk, Street Art")
                                        .split(",")
                                        .map((t) => t.trim())
                                        .filter(Boolean)
                                        .map((tag) => (
                                            <span
                                                key={tag}
                                                style={{
                                                    fontSize: "12px",
                                                    padding: "4px 12px",
                                                    borderRadius: "16px",
                                                    background: "rgba(6, 182, 212, 0.12)",
                                                    border: "1px solid rgba(6, 182, 212, 0.35)",
                                                    color: "var(--spray-cyan)",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                </div>
                            ) : (
                                <p style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic", margin: 0 }}>
                                    [Artistic interests are hidden on this public profile]
                                </p>
                            )}
                        </div>

                        {/* CREATORS I SUPPORT (TOGGLED) */}
                        <div style={{ marginTop: "24px", borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--spray-pink)" }}>
                                    CREATORS & ARTISTS I SUPPORT
                                </span>
                                {!profile.showFollowing && (
                                    <span style={{ fontSize: "11px", color: "var(--spray-pink)" }}>
                                        Hidden by user privacy settings
                                    </span>
                                )}
                            </div>

                            {profile.showFollowing ? (
                                profile.supportedArtists && profile.supportedArtists.length > 0 ? (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                                        {profile.supportedArtists.map((a) => (
                                            <div
                                                key={a.artistId}
                                                style={{
                                                    background: "rgba(255, 255, 255, 0.03)",
                                                    border: "1px solid var(--line)",
                                                    borderRadius: "8px",
                                                    padding: "10px 14px",
                                                }}
                                            >
                                                <b style={{ display: "block", fontSize: "13px" }}>{a.name}</b>
                                                <small style={{ color: "var(--muted)", display: "block" }}>
                                                    {a.genre} · {a.location}
                                                </small>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                                        Not following any artists publicly yet.
                                    </p>
                                )
                            ) : (
                                <p style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic", margin: 0 }}>
                                    [Supported artists are hidden on this public profile]
                                </p>
                            )}
                        </div>

                        {/* RECENTLY INTERACTED POSTS & COMMUNITY ACTIVITY (TOGGLED) */}
                        <div style={{ marginTop: "24px", borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#a855f7" }}>
                                    RECENT INTERACTIONS & ACTIVITY
                                </span>
                                {!showRecentInteractions && (
                                    <span style={{ fontSize: "11px", color: "var(--spray-pink)" }}>
                                        Hidden by user privacy settings
                                    </span>
                                )}
                            </div>

                            {showRecentInteractions ? (
                                <div style={{ display: "grid", gap: "8px" }}>
                                    <div
                                        style={{
                                            background: "rgba(255, 255, 255, 0.02)",
                                            border: "1px solid var(--line)",
                                            borderRadius: "8px",
                                            padding: "8px 12px",
                                            fontSize: "12px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <span style={{ color: "var(--spray-pink)" }}>[Liked]</span>
                                        <span>Liked <b>William Waweru</b> &apos;s post &quot;Morning acoustic session from the hill country&quot;</span>
                                    </div>
                                    <div
                                        style={{
                                            background: "rgba(255, 255, 255, 0.02)",
                                            border: "1px solid var(--line)",
                                            borderRadius: "8px",
                                            padding: "8px 12px",
                                            fontSize: "12px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <span style={{ color: "var(--spray-cyan)" }}>[Booked]</span>
                                        <span>Booked ticket for <b>Luna Park</b> Live Concert</span>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic", margin: 0 }}>
                                    [Recent interactions and activity are hidden on this public profile]
                                </p>
                            )}
                        </div>
                    </section>

                    {/* "HOW OTHER FANS SEE YOUR POSTS & COMMENTS" PREVIEW SECTION */}
                    <section className="panel" style={{ padding: "28px" }}>
                        <div style={{ marginBottom: "16px" }}>
                            <span className="eyebrow" style={{ color: "var(--spray-cyan)" }}>PUBLIC IDENTITY VERIFICATION</span>
                            <h3 style={{ margin: "4px 0 0", fontSize: "18px" }}>How other fans will see your posts & comments</h3>
                            <p style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0 0" }}>
                                When you engage with artists, leave feedback on creative posts, or reply to community threads, this is your exact public appearance.
                            </p>
                        </div>

                        {/* Simulated public comment component */}
                        <div
                            style={{
                                background: "rgba(255, 255, 255, 0.04)",
                                border: "1px solid var(--line-strong)",
                                borderRadius: "12px",
                                padding: "16px 20px",
                                display: "flex",
                                gap: "16px",
                                alignItems: "flex-start",
                            }}
                        >
                            {profile.image ? (
                                <Image
                                    className="fan-photo"
                                    src={profile.image}
                                    width={44}
                                    height={44}
                                    unoptimized
                                    alt="Your public comment avatar"
                                    style={{ borderRadius: "50%", border: "1px solid var(--spray-cyan)", objectFit: "cover" }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "44px",
                                        height: "44px",
                                        borderRadius: "50%",
                                        background: "linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(244, 63, 94, 0.3))",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 800,
                                        fontSize: "16px",
                                    }}
                                >
                                    {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : "F"}
                                </div>
                            )}

                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                    <b style={{ fontSize: "14px" }}>{profile.displayName || "Fan"}</b>
                                    <span className="pill" style={{ fontSize: "9px", padding: "2px 8px" }}>
                                        COMMUNITY FAN
                                    </span>
                                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>Just now</span>
                                </div>
                                <p style={{ margin: "8px 0 0", fontSize: "13px", color: "var(--ink)", lineHeight: "1.6" }}>
                                    &ldquo;Stunning acoustic guitar tone! Can&apos;t wait for your upcoming live show.&rdquo;
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
function ReportForm({ evidence, onSubmitted }: {
    evidence: Evidence;
    onSubmitted: () => void;
}) {
    const { accountId } = useContext(AccountContext);
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    return <form className="community-form" onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            setNotice("");
            try {
                const report = await request<Report>(accountId, `${ROOT}/reports`, { method: "POST", body: JSON.stringify({ ...evidence, reason, details }) });
                setNotice(`Report #${report.id} submitted. Status: Pending. An administrator can now review it.`);
                setReason("");
                setDetails("");
                onSubmitted();
            }
            catch (e) {
                setError(errorText(e));
            }
            finally {
                setBusy(false);
            }
        }}><h3>Report {evidence.targetType.toLowerCase()} #{evidence.targetId}</h3><p className="community-evidence">{evidence.snapshot}</p><small>A server snapshot has been retained so your report can still be reviewed if the source is removed.</small><label>Reason<select aria-label="Reason" required value={reason} onChange={e => setReason(e.target.value)}><option value="">Choose a reason</option>{["Harassment or abuse", "Hateful content", "Spam or scam", "Impersonation", "Inappropriate content", "Other"].map(r => <option key={r}>{r}</option>)}</select></label><label>Additional details (optional)<textarea aria-label="Additional details (optional)" maxLength={2000} rows={4} value={details} onChange={e => setDetails(e.target.value)} placeholder="Explain what happened and give relevant context."/></label><Feedback error={error} notice={notice}/><button className="primary" disabled={busy || !reason.trim()}>{busy ? "Submitting…" : "Submit report"}</button></form>;
}
export function ReportArtistButton({ artistId }: {
    artistId: number;
}) {
    const { accountId, role } = useContext(AccountContext);
    const [evidence, setEvidence] = useState<Evidence | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    if (role !== "Fan")
        return null;
    return <div className="community-artist-report"><button disabled={busy} onClick={async () => { setBusy(true); setError(""); try {
        setEvidence(await request<Evidence>(accountId, `${ROOT}/artists/${artistId}/report-evidence`, { method: "POST" }));
    }
    catch (e) {
        setError(errorText(e));
    }
    finally {
        setBusy(false);
    } }}>{busy ? "Opening report…" : "Report artist account"}</button><Feedback error={error}/>{evidence && <div><button onClick={() => setEvidence(null)}>Cancel report</button><ReportForm evidence={evidence} onSubmitted={changed}/></div>}</div>;
}
export function ReportContentModal({
    targetType,
    targetId,
    contentSummary,
    authorName,
    onClose,
    onSuccess,
}: {
    targetType: "POST" | "EVENT" | "USER";
    targetId: number;
    contentSummary: string;
    authorName?: string;
    onClose: () => void;
    onSuccess?: () => void;
}) {
    const { accountId } = useContext(AccountContext);
    const [reason, setReason] = useState("Inappropriate or offensive content");
    const [details, setDetails] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const reasons = [
        "Inappropriate or offensive content",
        "Harassment or hate speech",
        "Spam, bot, or commercial advertising",
        "Threatening or violent language",
        "Impersonation or deceptive behavior",
        "Copyright or intellectual property violation",
    ];

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");
        try {
            await request<Report>(accountId, `${ROOT}/reports`, {
                method: "POST",
                body: JSON.stringify({
                    targetType,
                    targetId,
                    reason,
                    details: details.trim() || `Report on comment by ${authorName || "user"}: "${contentSummary}"`,
                }),
            });
            setNotice("Report submitted. An administrator will review this content.");
            changed();
            onSuccess?.();
            setTimeout(() => {
                onClose();
            }, 1200);
        } catch (err) {
            setError(errorText(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: "20px",
            }}
        >
            <div
                className="panel"
                style={{
                    maxWidth: "520px",
                    width: "100%",
                    padding: "28px",
                    background: "rgba(18, 22, 34, 0.95)",
                    border: "1px solid var(--line-strong)",
                    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
                    borderRadius: "14px",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                        <span className="eyebrow" style={{ color: "var(--spray-pink)" }}>CONTENT MODERATION</span>
                        <h3 style={{ margin: "2px 0 0", fontSize: "18px" }}>Report Inappropriate Comment</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary"
                        style={{ padding: "4px 10px", fontSize: "12px" }}
                    >
                        Close
                    </button>
                </div>

                <div
                    style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid var(--line)",
                        borderRadius: "8px",
                        padding: "12px 14px",
                        marginBottom: "16px",
                        fontSize: "12px",
                    }}
                >
                    <span style={{ color: "var(--muted)", display: "block", marginBottom: "4px", fontSize: "11px", textTransform: "uppercase" }}>
                        Reported Comment by {authorName || "Community Member"}
                    </span>
                    <p style={{ margin: 0, color: "var(--ink)", fontStyle: "italic", lineHeight: "1.5" }}>
                        &ldquo;{contentSummary}&rdquo;
                    </p>
                </div>

                <Feedback error={error} notice={notice} />

                {!notice && (
                    <form onSubmit={handleSubmit} className="community-form">
                        <label>
                            Violation Reason
                            <select
                                aria-label="Violation Reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                            >
                                {reasons.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Additional Details (Optional)
                            <textarea
                                aria-label="Additional Details"
                                rows={3}
                                maxLength={500}
                                placeholder="Explain why this content violates community guidelines..."
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                            />
                        </label>

                        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={onClose}
                                disabled={busy}
                                style={{ flex: 1, padding: "10px" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="primary"
                                disabled={busy}
                                style={{ flex: 1, padding: "10px", background: "var(--spray-pink)", borderColor: "var(--spray-pink)" }}
                            >
                                {busy ? "Submitting..." : "Submit Report"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export function FanReportsPanel() {
    const { accountId } = useContext(AccountContext);
    const [reports, setReports] = useState<Report[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await request<Report[]>(accountId, `${ROOT}/reports`);
            setReports(r);
            setError("");
        } catch (e) {
            setError(errorText(e));
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    useEffect(() => {
        const timer = setTimeout(() => void load(), 0);
        window.addEventListener("fan-community-changed", load);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("fan-community-changed", load);
        };
    }, [load]);

    return (
        <section className="panel" style={{ padding: "32px", maxWidth: "860px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <span className="eyebrow">MODERATION TRACKER</span>
                    <h2 style={{ margin: "4px 0 0" }}>Active Moderation Reports</h2>
                    <p style={{ fontSize: "13px", color: "var(--muted)", margin: "4px 0 0" }}>
                        Status and resolution logs for reports you have submitted for comments or posts.
                    </p>
                </div>
                <button type="button" onClick={load} disabled={loading} className="btn-secondary" style={{ fontSize: "12px", padding: "8px 16px" }}>
                    {loading ? "Refreshing..." : "Refresh Reports"}
                </button>
            </div>

            <Feedback error={error} />

            {reports.length === 0 && !error && (
                <div style={{ padding: "36px", textAlign: "center", border: "1px dashed var(--line)", borderRadius: "12px", background: "rgba(255, 255, 255, 0.02)" }}>
                    <p style={{ color: "var(--muted)", margin: 0, fontSize: "13px" }}>
                        You have no active reports. To report inappropriate comments or posts, click the Report button directly on that content.
                    </p>
                </div>
            )}

            <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                {reports.map((r) => (
                    <article
                        className="community-report"
                        key={r.id}
                        style={{
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid var(--line-strong)",
                            borderRadius: "10px",
                            padding: "16px 20px",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span className="pill" style={{ fontSize: "10px", fontWeight: 700 }}>
                                {r.status}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                                Report #{r.id} · Target: {r.targetType} #{r.targetId}
                            </span>
                        </div>
                        <h3 style={{ margin: "4px 0", fontSize: "15px" }}>{r.reason}</h3>
                        {r.details && <p style={{ fontSize: "13px", color: "var(--ink)", margin: "6px 0" }}>{r.details}</p>}
                        {r.targetSnapshot && (
                            <blockquote style={{ fontSize: "12px", color: "var(--muted)", background: "rgba(0,0,0,0.3)", padding: "8px 12px", borderRadius: "6px", margin: "8px 0" }}>
                                Preserved snapshot: {r.targetSnapshot}
                            </blockquote>
                        )}
                        {r.status === "RESOLVED" && (
                            <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--spray-cyan)" }}>
                                Admin Outcome: {r.action?.replaceAll("_", " ")}
                                {r.resolutionNotes && ` — ${r.resolutionNotes}`}
                            </div>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
}

export function AdminReportsPanel() {
    const { accountId } = useContext(AccountContext);
    const [reports, setReports] = useState<Report[]>([]);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState<number | null>(null);
    const load = useCallback(async () => { try {
        setReports(await request<Report[]>(accountId, "/api/reports"));
        setError("");
    }
    catch (e) {
        setError(errorText(e));
    } }, [accountId]);
    useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
    return <section className="panel"><h2>Pending reports</h2><p>Review preserved content and the fan’s explanation before taking action.</p><Feedback error={error} notice={notice}/><button onClick={load}>Refresh queue</button>{reports.length === 0 && !error && <p>No pending reports.</p>}{reports.map(r => <article className="community-report" key={r.id}><h3>Report #{r.id} · {r.targetType} #{r.targetId}</h3><p>Reporter account #{r.reporterId} · {r.reason}</p>{r.targetSnapshot && <blockquote className="community-evidence">{r.targetSnapshot}</blockquote>}<p>{r.details}</p><form className="community-form" onSubmit={async (e) => { e.preventDefault(); const data = new FormData(e.currentTarget); setBusy(r.id); setError(""); setNotice(""); try {
        await request(accountId, `/api/reports/${r.id}/resolution`, { method: "POST", body: JSON.stringify({ action: data.get("action"), notes: data.get("notes") }) });
        setNotice(`Report #${r.id} resolved. The existing moderation service notified the affected accounts.`);
        await load();
    }
    catch (e) {
        setError(errorText(e));
    }
    finally {
        setBusy(null);
    } }}><label>Decision<select aria-label="Decision" name="action" required>{["DISMISS", "WARN_USER", ...(r.targetType === "USER" ? [] : ["REMOVE_CONTENT"]), "SUSPEND_USER", "BAN_USER"].map(a => <option key={a} value={a}>{a.replaceAll("_", " ")}</option>)}</select></label><label>Review notes<textarea aria-label="Review notes" name="notes" maxLength={2000} rows={2}/></label><button className="primary" disabled={busy !== null}>{busy === r.id ? "Resolving…" : "Resolve report"}</button></form></article>)}</section>;
}
