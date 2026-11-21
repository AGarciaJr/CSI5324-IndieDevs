"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { Artist, ArtistEvent, ArtistPost } from "../../types/artist";
import { getPostsForArtist } from "../../lib/artists";
import { useAuth } from "../../context/AuthContext";
import { getBackendAccountId } from "../../lib/auth";
import { FollowButton, ReportArtistButton, ReportContentModal } from "../fan-community";

interface ArtistProfileViewProps {
    artist: Artist;
    isModal?: boolean;
    onCloseModal?: () => void;
    onTriggerLogin?: (message: string) => void;
    onNavigateTab?: (tab: string) => void;
    onMessageUser?: (recipient: { name: string; id?: number }) => void;
    onViewUserProfile?: (user: { name: string; id?: number; role?: string }) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function ArtistProfileView({
    artist,
    isModal = false,
    onCloseModal,
    onTriggerLogin,
    onNavigateTab,
    onMessageUser,
    onViewUserProfile,
}: ArtistProfileViewProps) {
    const { currentUser } = useAuth();
    const isGuest = !currentUser;
    const backendAccountId = currentUser ? getBackendAccountId(currentUser) : 0;
    const isOwner = currentUser?.role === "Artist" && (
        currentUser.email === "artist@test.com" ||
        backendAccountId === artist.id ||
        currentUser.name.toLowerCase() === artist.name.toLowerCase()
    );

    const [profileMode, setProfileMode] = useState<"view" | "edit">("view");
    const [artistData, setArtistData] = useState({
        name: artist.name,
        genre: artist.genre,
        location: artist.location,
        bio: artist.bio || "",
        tags: artist.tags || "",
    });
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editingPostText, setEditingPostText] = useState("");
    const [artistToggles, setArtistToggles] = useState(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(`artist_prefs_${artist.id}`);
            if (stored) {
                try { return JSON.parse(stored); } catch {}
            }
        }
        return {
            showInterests: true,
            showFollowing: true,
            showRecentInteractions: true,
            publicProfile: true,
        };
    });

    function handleSaveProfileEdits(e: FormEvent) {
        e.preventDefault();
        if (typeof window !== "undefined") {
            localStorage.setItem(`artist_prefs_${artist.id}`, JSON.stringify(artistToggles));
            try {
                const storedCatalog = localStorage.getItem("artistconnect-custom-artists");
                const list = storedCatalog ? JSON.parse(storedCatalog) : [];
                const updated = list.map((a: { id: number }) => a.id === artist.id ? { ...a, ...artistData } : a);
                if (!updated.some((a: { id: number }) => a.id === artist.id)) {
                    updated.push({ id: artist.id, ...artistData });
                }
                localStorage.setItem("artistconnect-custom-artists", JSON.stringify(updated));
            } catch {}
        }
        setNotice("Artist profile and preferences updated successfully.");
        setProfileMode("view");
    }

    function handleSavePostEdit(postId: string) {
        if (!editingPostText.trim()) return;
        setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, text: editingPostText.trim() } : p))
        );
        try {
            const store = JSON.parse(localStorage.getItem("appStore") || "{}");
            if (store.posts) {
                store.posts = store.posts.map((p: { id: string; text: string }) =>
                    p.id === postId ? { ...p, text: editingPostText.trim() } : p
                );
                localStorage.setItem("appStore", JSON.stringify(store));
            }
            const v2 = JSON.parse(localStorage.getItem("artistconnect-ui-v2") || "{}");
            if (v2.posts) {
                v2.posts = v2.posts.map((p: { id: string; text: string }) =>
                    p.id === postId ? { ...p, text: editingPostText.trim() } : p
                );
                localStorage.setItem("artistconnect-ui-v2", JSON.stringify(v2));
            }
        } catch {}
        setEditingPostId(null);
        setNotice("Post updated successfully.");
    }

    function handleDeletePost(postId: string) {
        if (!confirm("Are you sure you want to remove this post from your artist feed?")) return;
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        try {
            const store = JSON.parse(localStorage.getItem("appStore") || "{}");
            if (store.posts) {
                store.posts = store.posts.filter((p: { id: string }) => p.id !== postId);
                localStorage.setItem("appStore", JSON.stringify(store));
            }
        } catch {}
        setNotice("Post removed from your artist showcase.");
    }

    const [events, setEvents] = useState<ArtistEvent[]>([]);
    const [posts, setPosts] = useState<ArtistPost[]>(() => getPostsForArtist(artist.id));
    const [filter, setFilter] = useState<"all" | "events" | "posts">("all");
    const [action, setAction] = useState<"" | "chat" | "book">("");
    const [message, setMessage] = useState("");
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");
    const [reportingComment, setReportingComment] = useState<{ id: string; authorName: string; text: string } | null>(null);
    const [reportingPost, setReportingPost] = useState<ArtistPost | null>(null);
    const [postComments, setPostComments] = useState<Record<string, { id: string; authorName: string; text: string; createdAt: string; authorId?: number; authorRole?: "Fan" | "Artist"; hidden?: boolean }[]>>({
        "post-ww-1": [
            { id: "c1", authorName: "Alex Fan", authorId: 5, authorRole: "Fan", text: "Love the warm acoustic guitar tone on this track!", createdAt: "2 hours ago" },
            { id: "c2", authorName: "Jordan T.", authorId: 2, authorRole: "Fan", text: "Can not wait for the vinyl release.", createdAt: "1 hour ago" },
        ],
        "post-ww-2": [
            { id: "c3", authorName: "Taylor M.", authorId: 1, authorRole: "Fan", text: "The Waco live session was magical, thank you for sharing!", createdAt: "Yesterday" },
            { id: "c3b", authorName: "Luna Park", authorId: 2, authorRole: "Artist", text: "Stellar arrangement William, let's collaborate on an acoustic set soon!", createdAt: "3 hours ago" },
        ],
        "post-lp-1": [
            { id: "c4", authorName: "Morgan K.", authorId: 4, authorRole: "Fan", text: "Hill Country Echoes sounds like an instant classic.", createdAt: "3 hours ago" },
            { id: "c5", authorName: "Nicholas Nolen", authorId: 1, authorRole: "Fan", text: "Incredible depth and songwriting, playing this on repeat.", createdAt: "1 hour ago" },
        ]
    });
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [commentInput, setCommentInput] = useState("");
    const [postLikes, setPostLikes] = useState<Record<string, { count: number; liked: boolean }>>({
        "post-ww-1": { count: 24, liked: false },
        "post-ww-2": { count: 18, liked: false },
        "post-lp-1": { count: 31, liked: false },
    });

    function getPostLikeState(postId: string, baseLikesCount?: number) {
        if (postLikes[postId]) {
            return postLikes[postId];
        }
        const count = baseLikesCount !== undefined ? baseLikesCount : 0;
        return { count, liked: false };
    }

    function handleTogglePostLike(postId: string, baseLikesCount?: number) {
        if (isGuest) {
            onTriggerLogin?.("Sign in to like this post.");
            return;
        }
        const current = getPostLikeState(postId, baseLikesCount);
        const nextLiked = !current.liked;
        const nextCount = nextLiked ? current.count + 1 : Math.max(0, current.count - 1);

        setPostLikes((prev) => ({
            ...prev,
            [postId]: { count: nextCount, liked: nextLiked },
        }));

        if (nextLiked) {
            fetch(
                `${API_BASE}/api/recommendations/interactions?fanId=${backendAccountId}&artistId=${artist.id}&interactionType=LIKE`,
                { method: "POST" }
            ).catch(() => {});
            setNotice("Post liked!");
        } else {
            setNotice("Like removed.");
        }
    }

    function handleAuthorClick(c: { authorName: string; authorId?: number; authorRole?: "Fan" | "Artist" }) {
        if (isGuest) {
            onTriggerLogin?.(`Sign in to explore ${c.authorName}'s full profile and network.`);
            return;
        }
        if (onViewUserProfile) {
            onViewUserProfile({ name: c.authorName, id: c.authorId, role: c.authorRole });
        } else if (c.authorRole === "Artist" && onNavigateTab) {
            onNavigateTab("Artist Home");
        } else if (onNavigateTab) {
            onNavigateTab("Fan Profile");
        }
    }

    function handleMessageAuthor(c: { authorName: string; authorId?: number; authorRole?: "Fan" | "Artist" }) {
        if (isGuest) {
            onTriggerLogin?.(`Sign in to message ${c.authorName}.`);
            return;
        }
        if (onCloseModal) {
            onCloseModal();
        }
        if (onMessageUser) {
            onMessageUser({ name: c.authorName, id: c.authorId });
        } else if (onNavigateTab) {
            onNavigateTab("Messages");
        }
    }

    function handleToggleHideComment(postId: string, commentId: string, currentHidden: boolean) {
        const newHidden = !currentHidden;
        const numericCommentId = commentId.startsWith("c-") ? 100 : Number(commentId.replace("c", "")) || 100;

        fetch(`${API_BASE}/api/posts/comments/${numericCommentId}/hide?hidden=${newHidden}`, {
            method: "PUT",
            headers: {
                "X-User-Id": String(backendAccountId),
            },
        }).catch(() => {});

        setPostComments((prev) => ({
            ...prev,
            [postId]: (prev[postId] || []).map((c) =>
                c.id === commentId ? { ...c, hidden: newHidden } : c
            ),
        }));

        setNotice(newHidden ? "Comment hidden from community view." : "Comment restored to community view.");
    }

    async function handleBlockUser(c: { authorName: string; authorId?: number; id: string }, postId: string) {
        if (!c.authorId) {
            setNotice(`Cannot block unidentified author.`);
            return;
        }

        try {
            await fetch(`${API_BASE}/api/posts/artists/${artist.id}/blocked-users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Id": String(backendAccountId),
                },
                body: JSON.stringify({
                    userId: c.authorId,
                    userName: c.authorName,
                    reason: "Inappropriate comments on artwork",
                }),
            });

            // Also hide the comment
            handleToggleHideComment(postId, c.id, false);
            setNotice(`User ${c.authorName} blocked. They can no longer comment on your posts.`);
        } catch {
            setError(`Could not block user ${c.authorName}.`);
        }
    }

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_BASE}/api/events/artist/${artist.id}`, { signal: controller.signal })
            .then(async (res) => {
                if (res.ok) {
                    const data = await res.json();
                    setEvents(Array.isArray(data) ? data : []);
                }
            })
            .catch(() => {
                // Ignore network errors on events
            });

        // Sync posts if local storage changes
        const timer = setTimeout(() => {
            setPosts(getPostsForArtist(artist.id));
        }, 0);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [artist.id]);

    async function handleSubmitAction(e: FormEvent) {
        e.preventDefault();
        setError("");
        setNotice("");

        if (!message.trim()) return;

        if (action === "book") {
            setNotice(`Booking request submitted to ${artist.name}! The artist will be notified.`);
            setMessage("");
            setAction("");
        } else if (action === "chat") {
            setNotice(`Message sent to ${artist.name}!`);
            setMessage("");
            setAction("");
        }
    }

    return (
        <div className="artist-profile-container" style={{ width: "100%" }}>
            {/* Header / Modal navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                    <span className="eyebrow" style={{ color: "var(--muted)" }}>ARTIST PROFILE</span>
                    <h2 style={{ margin: "4px 0 0", fontSize: isModal ? "22px" : "28px" }}>{artist.name}</h2>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {isModal ? (
                        <>
                            <Link
                                href={`/artist/${artist.id}`}
                                className="primary"
                                style={{ fontSize: "12px", padding: "6px 14px", textDecoration: "none" }}
                            >
                                Visit Page
                            </Link>
                            {onCloseModal && (
                                <button
                                    type="button"
                                    onClick={onCloseModal}
                                    style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "var(--muted)", padding: "4px 8px" }}
                                    aria-label="Close modal"
                                >
                                    x
                                </button>
                            )}
                        </>
                    ) : (
                        <Link
                            href="/fan"
                            className="btn-secondary"
                            style={{ fontSize: "12px", padding: "6px 14px", textDecoration: "none" }}
                        >
                            Back to Discover
                        </Link>
                    )}
                </div>
            </div>

            {/* Notification messages */}
            {notice && <div className="notice" role="status" style={{ marginBottom: "16px" }}>{notice}</div>}
            {error && <div className="error" role="alert" style={{ marginBottom: "16px" }}>{error}</div>}

            {/* ARTIST PROFILE MODE SWITCHER (VIEW VS EDIT) */}
            {isOwner && (
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
                            onClick={() => setProfileMode("view")}
                            className={profileMode === "view" ? "primary" : "btn-secondary"}
                            style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 700 }}
                        >
                            View Public Showcase
                        </button>
                        <button
                            type="button"
                            onClick={() => setProfileMode("edit")}
                            className={profileMode === "edit" ? "primary" : "btn-secondary"}
                            style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 700 }}
                        >
                            Edit Profile & Preferences
                        </button>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                        {profileMode === "view" ? "Public Artist Showcase" : "Artist Studio Editor"}
                    </span>
                </div>
            )}

            {/* EDIT PROFILE & DISPLAY PREFERENCES FORM */}
            {isOwner && profileMode === "edit" ? (
                <section className="panel" style={{ padding: "32px", marginBottom: "24px" }}>
                    <div className="section-title" style={{ marginBottom: "20px" }}>
                        <div>
                            <span className="eyebrow">ARTIST IDENTITY & DISPLAY PREFERENCES</span>
                            <h2 style={{ margin: "4px 0 0" }}>Edit Artist Profile</h2>
                            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "4px 0 0" }}>
                                Update your showcase details and configure what community items are displayed on your public page.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveProfileEdits} className="community-form">
                        <label>
                            Artist / Band Name
                            <input
                                aria-label="Artist Name"
                                required
                                value={artistData.name}
                                onChange={(e) => setArtistData({ ...artistData, name: e.target.value })}
                            />
                        </label>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <label>
                                Primary Genre / Discipline
                                <input
                                    aria-label="Genre"
                                    required
                                    value={artistData.genre}
                                    onChange={(e) => setArtistData({ ...artistData, genre: e.target.value })}
                                />
                            </label>
                            <label>
                                Location (City, State)
                                <input
                                    aria-label="Location"
                                    required
                                    value={artistData.location}
                                    onChange={(e) => setArtistData({ ...artistData, location: e.target.value })}
                                />
                            </label>
                        </div>

                        <label>
                            Artist Bio & Creative Story
                            <textarea
                                aria-label="Artist Bio"
                                rows={5}
                                maxLength={2000}
                                value={artistData.bio}
                                onChange={(e) => setArtistData({ ...artistData, bio: e.target.value })}
                                placeholder="Describe your artistic inspirations, instruments, and creative roots..."
                            />
                        </label>

                        <label>
                            Artistic Tags (Comma-separated)
                            <input
                                aria-label="Tags"
                                value={artistData.tags}
                                onChange={(e) => setArtistData({ ...artistData, tags: e.target.value })}
                                placeholder="e.g. Music, Indie Folk, Acoustic, Songwriter, Live Sessions"
                            />
                        </label>

                        {/* Opt-in Display Toggles */}
                        <fieldset style={{ marginTop: "20px", border: "1px solid var(--line-strong)", borderRadius: "12px", padding: "18px", background: "rgba(255, 255, 255, 0.02)" }}>
                            <legend style={{ fontWeight: 700, fontSize: "12px", color: "var(--spray-cyan)", textTransform: "uppercase", letterSpacing: "1px" }}>
                                Showcase Display Opt-Ins (Fan & Community Alignment)
                            </legend>

                            <label className="community-check" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={artistToggles.publicProfile}
                                    onChange={(e) => setArtistToggles({ ...artistToggles, publicProfile: e.target.checked })}
                                />
                                <div>
                                    <b>Make artist showcase publicly discoverable</b>
                                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                                        Allow fans to find your showcase in Discover and For You feeds.
                                    </p>
                                </div>
                            </label>

                            <label className="community-check" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={artistToggles.showInterests}
                                    onChange={(e) => setArtistToggles({ ...artistToggles, showInterests: e.target.checked })}
                                />
                                <div>
                                    <b>Display artistic interests and category tags</b>
                                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                                        Show artistic tags and category badges on your showcase banner.
                                    </p>
                                </div>
                            </label>

                            <label className="community-check" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={artistToggles.showFollowing}
                                    onChange={(e) => setArtistToggles({ ...artistToggles, showFollowing: e.target.checked })}
                                />
                                <div>
                                    <b>Display creators and peers I support</b>
                                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                                        Show fellow artists you follow and collaborate with on your page.
                                    </p>
                                </div>
                            </label>

                            <label className="community-check" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={artistToggles.showRecentInteractions}
                                    onChange={(e) => setArtistToggles({ ...artistToggles, showRecentInteractions: e.target.checked })}
                                />
                                <div>
                                    <b>Display recent interactions & community activity</b>
                                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                                        Show recent event collaborations, peer likes, and community discussions.
                                    </p>
                                </div>
                            </label>
                        </fieldset>

                        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                            <button type="submit" className="primary" style={{ padding: "10px 24px" }}>
                                Save Profile Changes
                            </button>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setProfileMode("view")}
                                style={{ padding: "10px 20px" }}
                            >
                                Return to Public Showcase
                            </button>
                        </div>
                    </form>
                </section>
            ) : (
                <>
            {/* Profile Art / Hero banner */}
            <div
                style={{
                    background: "linear-gradient(135deg, rgba(244, 63, 94, 0.25) 0%, rgba(168, 85, 247, 0.3) 50%, rgba(6, 182, 212, 0.25) 100%), rgba(16, 20, 32, 0.75)",
                    border: "1px solid var(--line-strong)",
                    backdropFilter: "blur(24px)",
                    borderRadius: "16px",
                    padding: "32px 24px",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    marginBottom: "20px",
                    boxShadow: "var(--glass-specular), 0 16px 36px -10px rgba(0,0,0,0.6)",
                }}
            >
                <div
                    style={{
                        width: "68px",
                        height: "68px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, rgba(244, 63, 94, 0.4), rgba(6, 182, 212, 0.4))",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        fontWeight: 700,
                        boxShadow: "0 0 20px rgba(244, 63, 94, 0.4)",
                    }}
                >
                    {artistData.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                </div>
                <div>
                    <h3 style={{ margin: 0, color: "white", fontSize: "22px", fontFamily: '"Didot", "Bodoni MT", Georgia, serif' }}>{artistData.name}</h3>
                    <p style={{ margin: "4px 0 0", color: "var(--spray-cyan)", fontSize: "13px", fontWeight: 600 }}>
                        {artistData.genre} · {artistData.location}
                    </p>
                </div>
            </div>

            {/* Bio and Tags */}
            {artist.bio && (
                <div style={{ marginBottom: "18px" }}>
                    <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--muted)", marginBottom: "8px" }}>
                        About the Artist
                    </h4>
                    <p style={{ fontSize: "14px", color: "var(--ink-secondary)", lineHeight: "1.7", margin: 0 }}>
                        {artist.bio}
                    </p>
                </div>
            )}

            {artist.tags && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "24px" }}>
                    {artist.tags.split(",").map((t, idx) => (
                        <span key={idx} className="pill" style={{ fontSize: "10px" }}>
                            #{t.trim()}
                        </span>
                    ))}
                </div>
            )}

            {/* Action Bar */}
            <div
                style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    borderTop: "1px solid var(--line)",
                    borderBottom: "1px solid var(--line)",
                    padding: "16px 0",
                    marginBottom: "20px",
                }}
            >
                {isOwner ? (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", width: "100%" }}>
                        <button
                            type="button"
                            className="primary"
                            onClick={() => onNavigateTab?.("Make a post")}
                            style={{ fontSize: "12px", padding: "8px 16px", fontWeight: 700 }}
                        >
                            + Create New Post
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => onNavigateTab?.("Manage Events")}
                            style={{ fontSize: "12px", padding: "8px 16px", fontWeight: 700 }}
                        >
                            Curate Events
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => onNavigateTab?.("Settings")}
                            style={{ fontSize: "12px", padding: "8px 16px" }}
                        >
                            Workspace Preferences
                        </button>
                        <span className="pill" style={{ marginLeft: "auto", background: "rgba(6, 182, 212, 0.15)", color: "var(--spray-cyan)" }}>
                            YOUR ARTIST SHOWCASE
                        </span>
                    </div>
                ) : isGuest ? (
                    <>
                        <button
                            type="button"
                            className="primary"
                            onClick={() => onTriggerLogin?.("Sign in as a Fan to follow this artist.")}
                        >
                            + Follow
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => onTriggerLogin?.("Sign in to chat with this artist.")}
                        >
                            Start chat
                        </button>
                        <button
                            type="button"
                            className="primary"
                            onClick={() => onTriggerLogin?.("Sign in as a Fan to book this artist.")}
                        >
                            Book Artist
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => onTriggerLogin?.("Sign in to file a community report.")}
                        >
                            Report
                        </button>
                    </>
                ) : (
                    <>
                        <FollowButton artistId={artist.id} />
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => { setAction("chat"); setMessage(""); }}
                        >
                            Start chat
                        </button>
                        <button
                            type="button"
                            className="primary"
                            onClick={() => { setAction("book"); setMessage(""); }}
                        >
                            Book Artist
                        </button>
                        <ReportArtistButton artistId={artist.id} />
                    </>
                )}
            </div>

            {/* Interactive Action Drawer */}
            {action && (
                <form
                    onSubmit={handleSubmitAction}
                    style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--line-strong)", borderRadius: "12px", padding: "18px", marginBottom: "24px", backdropFilter: "blur(16px)" }}
                >
                    <h4 style={{ margin: "0 0 10px", fontSize: "14px" }}>
                        {action === "chat" ? `Send message to ${artist.name}` : `Book ${artist.name}`}
                    </h4>
                    <textarea
                        rows={3}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                            action === "chat"
                                ? "Write your message here..."
                                : "Provide event details, proposed date, and contact information..."
                        }
                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "13px" }}
                    />
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                        <button type="submit" className="primary" style={{ padding: "8px 16px" }}>
                            {action === "chat" ? "Send Message ↗" : "Submit Booking Request ↗"}
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => setAction("")}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Endless Scroll Feed: Live Events & Media Posts */}
            <div style={{ marginTop: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                        <span className="eyebrow">ARTIST SHOWCASE</span>
                        <h4 style={{ margin: "4px 0 0", fontSize: "16px", color: "#ffffff", fontWeight: 700 }}>
                            Continuous Feed · Events & Posts
                        </h4>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                        <button
                            type="button"
                            onClick={() => setFilter("all")}
                            style={{
                                padding: "4px 10px",
                                fontSize: "11px",
                                borderRadius: "20px",
                                background: filter === "all" ? "rgba(244, 63, 94, 0.2)" : "rgba(255, 255, 255, 0.05)",
                                borderColor: filter === "all" ? "var(--spray-pink)" : "var(--line)",
                                color: filter === "all" ? "#ffffff" : "var(--muted)",
                            }}
                        >
                            All ({events.length + posts.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("events")}
                            style={{
                                padding: "4px 10px",
                                fontSize: "11px",
                                borderRadius: "20px",
                                background: filter === "events" ? "rgba(6, 182, 212, 0.2)" : "rgba(255, 255, 255, 0.05)",
                                borderColor: filter === "events" ? "var(--spray-cyan)" : "var(--line)",
                                color: filter === "events" ? "#ffffff" : "var(--muted)",
                            }}
                        >
                            Events ({events.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("posts")}
                            style={{
                                padding: "4px 10px",
                                fontSize: "11px",
                                borderRadius: "20px",
                                background: filter === "posts" ? "rgba(168, 85, 247, 0.2)" : "rgba(255, 255, 255, 0.05)",
                                borderColor: filter === "posts" ? "var(--spray-purple)" : "var(--line)",
                                color: filter === "posts" ? "#ffffff" : "var(--muted)",
                            }}
                        >
                            Media Posts ({posts.length})
                        </button>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Events items */}
                    {(filter === "all" || filter === "events") &&
                        events.map((ev) => (
                            <div
                                key={`event-${ev.id}`}
                                style={{
                                    border: "1px solid var(--line-strong)",
                                    borderRadius: "12px",
                                    padding: "18px",
                                    background: "rgba(6, 182, 212, 0.05)",
                                    boxShadow: "var(--glass-specular), 0 8px 24px rgba(0, 0, 0, 0.4)",
                                    backdropFilter: "blur(14px)",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
                                    <span
                                        className="pill"
                                        style={{
                                            fontSize: "9px",
                                            background: "rgba(6, 182, 212, 0.15)",
                                            borderColor: "rgba(6, 182, 212, 0.35)",
                                            color: "var(--spray-cyan)",
                                        }}
                                    >
                                        UPCOMING {ev.eventType.toUpperCase()}
                                    </span>
                                    <span className="pill" style={{ fontSize: "10px" }}>
                                        {ev.capacity} spots
                                    </span>
                                </div>

                                <h5 style={{ margin: "6px 0", fontSize: "16px", color: "#ffffff", fontWeight: 700 }}>
                                    {ev.title}
                                </h5>

                                <p style={{ fontSize: "12px", color: "var(--spray-cyan)", margin: "4px 0 10px", fontWeight: 600 }}>
                                    {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "Date TBA"} · {ev.location} {ev.virtual && "(Virtual Stream)"}
                                </p>

                                {ev.description && (
                                    <p style={{ fontSize: "13px", color: "var(--ink-secondary)", lineHeight: "1.6", margin: "6px 0 12px" }}>
                                        {ev.description}
                                    </p>
                                )}

                                {ev.imageUrl && (
                                    <img
                                        src={ev.imageUrl}
                                        alt={ev.title}
                                        style={{ width: "100%", maxHeight: "320px", objectFit: "cover", borderRadius: "8px", marginBottom: "12px", border: "1px solid var(--line)" }}
                                    />
                                )}

                                <div style={{ display: "flex", gap: "10px", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: "12px", marginTop: "10px" }}>
                                    <button
                                        type="button"
                                        className="primary"
                                        style={{ padding: "6px 14px", fontSize: "11px" }}
                                        onClick={() => {
                                            if (isGuest) {
                                                onTriggerLogin?.("Sign in to RSVP or purchase tickets.");
                                            } else {
                                                setNotice(`RSVP confirmed for ${ev.title}!`);
                                            }
                                        }}
                                    >
                                        RSVP / Get Tickets ↗
                                    </button>
                                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                                        Status: {ev.status || "CONFIRMED"}
                                    </span>
                                </div>
                            </div>
                        ))}

                    {/* Posts items with uploaded media */}
                    {(filter === "all" || filter === "posts") &&
                        posts.map((p) => {
                            const likesState = getPostLikeState(p.id, p.likesCount);
                            const commentsCount = (postComments[p.id] || []).filter((c) => isOwner || !c.hidden).length;

                            return (
                            <div
                                key={`post-${p.id}`}
                                style={{
                                    border: "1px solid var(--line-strong)",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    background: "rgba(255, 255, 255, 0.03)",
                                    boxShadow: "var(--glass-specular), 0 8px 24px rgba(0, 0, 0, 0.4)",
                                    backdropFilter: "blur(14px)",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div className="avatar" style={{ width: "32px", height: "32px", fontSize: "11px" }}>
                                            {p.authorAvatar || artist.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                                        </div>
                                        <div>
                                            <b style={{ fontSize: "13px", color: "#ffffff", display: "block" }}>
                                                {p.authorName || artist.name}
                                            </b>
                                            <small style={{ color: "var(--muted)", fontSize: "11px" }}>
                                                {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "Recent update"} · {p.public ? "Public" : "Subscribers only"} · {likesState.count} like{likesState.count !== 1 ? "s" : ""} · {commentsCount} comment{commentsCount !== 1 ? "s" : ""}
                                            </small>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span className="pill" style={{ fontSize: "9px" }}>
                                            ARTIST POST
                                        </span>
                                        {isOwner && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingPostId(editingPostId === p.id ? null : p.id);
                                                        setEditingPostText(p.text);
                                                    }}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "var(--spray-cyan)",
                                                        cursor: "pointer",
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        padding: "2px 6px",
                                                    }}
                                                    title="Edit this post text"
                                                >
                                                    {editingPostId === p.id ? "Cancel Edit" : "Edit"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeletePost(p.id)}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "var(--spray-pink)",
                                                        cursor: "pointer",
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        padding: "2px 6px",
                                                    }}
                                                    title="Delete this post from your feed"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {editingPostId === p.id ? (
                                    <div style={{ margin: "10px 0", display: "grid", gap: "8px" }}>
                                        <textarea
                                            rows={4}
                                            value={editingPostText}
                                            onChange={(e) => setEditingPostText(e.target.value)}
                                            style={{ width: "100%", padding: "10px 12px", fontSize: "13px" }}
                                        />
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                type="button"
                                                className="primary"
                                                style={{ fontSize: "11px", padding: "6px 14px" }}
                                                onClick={() => handleSavePostEdit(p.id)}
                                            >
                                                Save Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-secondary"
                                                style={{ fontSize: "11px", padding: "6px 14px" }}
                                                onClick={() => setEditingPostId(null)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ fontSize: "14px", color: "var(--ink)", lineHeight: "1.7", margin: "10px 0" }}>
                                        {p.text}
                                    </p>
                                )}

                                {/* Media Content Attachments (Images, Audio, Video) */}
                                {p.files && p.files.length > 0 && (
                                    <div style={{ display: "grid", gap: "12px", marginTop: "12px" }}>
                                        {p.files.map((file, idx) => (
                                            <div key={idx} style={{ overflow: "hidden", borderRadius: "10px" }}>
                                                {file.type.startsWith("image/") || file.data.startsWith("data:image") || file.data.includes("unsplash") || file.data.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                                                    <img
                                                        src={file.data}
                                                        alt={file.name || "Post artwork"}
                                                        style={{ width: "100%", maxHeight: "420px", objectFit: "cover", borderRadius: "10px", border: "1px solid var(--line)" }}
                                                    />
                                                ) : file.type.startsWith("audio/") || file.data.startsWith("data:audio") || file.data.match(/\.(mp3|wav|ogg|m4a)($|\?)/i) ? (
                                                    <div
                                                        style={{
                                                            padding: "16px",
                                                            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(168, 85, 247, 0.12))",
                                                            borderRadius: "12px",
                                                            border: "1px solid var(--spray-cyan)",
                                                            boxShadow: "0 4px 16px rgba(6, 182, 212, 0.15)",
                                                        }}
                                                    >
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                
                                                                <span style={{ fontSize: "13px", color: "var(--spray-cyan)", fontWeight: 700 }}>
                                                                    {file.name || "Original Music Recording"}
                                                                </span>
                                                            </div>
                                                            <span className="pill" style={{ fontSize: "9px", background: "rgba(6, 182, 212, 0.2)", color: "var(--spray-cyan)" }}>
                                                                AUDIO STREAM
                                                            </span>
                                                        </div>
                                                        <audio controls src={file.data} style={{ width: "100%", height: "40px" }} />
                                                    </div>
                                                ) : file.type.startsWith("video/") || file.data.startsWith("data:video") || file.data.match(/\.(mp4|webm|mov)($|\?)/i) ? (
                                                    <video
                                                        controls
                                                        src={file.data}
                                                        style={{ width: "100%", maxHeight: "380px", borderRadius: "10px", border: "1px solid var(--line)" }}
                                                    />
                                                ) : (
                                                    <a
                                                        href={file.data}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="btn-secondary"
                                                        style={{ display: "inline-block", fontSize: "11px", padding: "8px 12px" }}
                                                    >
                                                        View Attachment: {file.name}
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: "10px", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: "12px", marginTop: "14px", flexWrap: "wrap" }}>
                                    <button
                                        type="button"
                                        className={likesState.liked ? "primary" : "btn-secondary"}
                                        style={{
                                            fontSize: "11px",
                                            padding: "5px 12px",
                                            background: likesState.liked ? "rgba(244, 63, 94, 0.2)" : undefined,
                                            borderColor: likesState.liked ? "var(--spray-pink)" : undefined,
                                            color: likesState.liked ? "var(--spray-pink)" : undefined,
                                            fontWeight: likesState.liked ? 700 : 500,
                                        }}
                                        onClick={() => handleTogglePostLike(p.id, p.likesCount)}
                                    >
                                        {likesState.liked ? "Liked" : "Like"} ({likesState.count})
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        style={{ fontSize: "11px", padding: "5px 12px" }}
                                        onClick={() => {
                                            if (isGuest) {
                                                onTriggerLogin?.("Sign in to comment on posts.");
                                            } else {
                                                setActiveCommentPostId(activeCommentPostId === p.id ? null : p.id);
                                            }
                                        }}
                                    >
                                        {activeCommentPostId === p.id ? "Hide Comments" : "Comments"} ({commentsCount})
                                    </button>
                                    {!isOwner && (
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            style={{ fontSize: "11px", padding: "5px 12px", color: "var(--spray-pink)", marginLeft: "auto" }}
                                            onClick={() => {
                                                if (isGuest) {
                                                    onTriggerLogin?.("Sign in to report content.");
                                                } else {
                                                    setReportingPost(p);
                                                }
                                            }}
                                        >
                                            Report Post
                                        </button>
                                    )}
                                </div>

                                {/* Comments Section for Post */}
                                {(activeCommentPostId === p.id || (postComments[p.id] && postComments[p.id].length > 0)) && (
                                    <div style={{ marginTop: "14px", borderTop: "1px dashed var(--line)", paddingTop: "12px", display: "grid", gap: "10px" }}>
                                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                                            Community Comments
                                        </span>
                                        {(postComments[p.id] || [])
                                            .filter((c) => isOwner || !c.hidden)
                                            .map((c) => (
                                            <div
                                                key={c.id}
                                                style={{
                                                    background: c.hidden ? "rgba(244, 63, 94, 0.08)" : "rgba(255, 255, 255, 0.02)",
                                                    border: c.hidden ? "1px solid rgba(244, 63, 94, 0.4)" : "1px solid var(--line)",
                                                    borderRadius: "8px",
                                                    padding: "10px 14px",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "flex-start",
                                                    gap: "12px",
                                                }}
                                            >
                                                {/* Author Avatar Icon & Details */}
                                                <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: 0 }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAuthorClick(c)}
                                                        style={{
                                                            width: "34px",
                                                            height: "34px",
                                                            borderRadius: "50%",
                                                            background: c.authorRole === "Artist"
                                                                ? "linear-gradient(135deg, rgba(244, 63, 94, 0.35), rgba(168, 85, 247, 0.35))"
                                                                : "linear-gradient(135deg, rgba(6, 182, 212, 0.35), rgba(16, 185, 129, 0.35))",
                                                            border: c.authorRole === "Artist" ? "1px solid var(--spray-pink)" : "1px solid var(--spray-cyan)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: "12px",
                                                            fontWeight: 800,
                                                            color: "#ffffff",
                                                            cursor: "pointer",
                                                            padding: 0,
                                                            flexShrink: 0,
                                                            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                                        }}
                                                        title={`Click to view profile or message ${c.authorName}`}
                                                    >
                                                        {c.authorName.split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "U"}
                                                    </button>

                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAuthorClick(c)}
                                                                style={{
                                                                    background: "none",
                                                                    border: "none",
                                                                    padding: 0,
                                                                    fontSize: "12px",
                                                                    fontWeight: 700,
                                                                    color: "#ffffff",
                                                                    cursor: "pointer",
                                                                    textDecoration: "underline",
                                                                    textAlign: "left",
                                                                }}
                                                                title={`View ${c.authorName}'s homepage`}
                                                            >
                                                                {c.authorName}
                                                            </button>
                                                            <span className={`role-badge ${(c.authorRole || "Fan").toLowerCase()}`} style={{ fontSize: "9px", padding: "1px 6px" }}>
                                                                {c.authorRole || "Fan"}
                                                            </span>
                                                            <span style={{ fontSize: "10px", color: "var(--muted)" }}>{c.createdAt}</span>

                                                            {c.hidden && (
                                                                <span className="pill" style={{ fontSize: "9px", background: "rgba(244, 63, 94, 0.2)", color: "var(--spray-pink)", borderColor: "var(--spray-pink)" }}>
                                                                    HIDDEN BY ARTIST
                                                                </span>
                                                            )}

                                                            {/* Contextual Actions */}
                                                            <div style={{ display: "flex", gap: "6px", marginLeft: "auto", flexWrap: "wrap" }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAuthorClick(c)}
                                                                    style={{
                                                                        background: "rgba(255, 255, 255, 0.05)",
                                                                        border: "1px solid var(--line)",
                                                                        borderRadius: "4px",
                                                                        fontSize: "10px",
                                                                        padding: "2px 8px",
                                                                        color: "var(--muted)",
                                                                        cursor: "pointer",
                                                                        whiteSpace: "nowrap",
                                                                    }}
                                                                    title={`View ${c.authorName}'s homepage`}
                                                                >
                                                                    View Profile →
                                                                </button>

                                                                {currentUser?.name !== c.authorName && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleMessageAuthor(c)}
                                                                        style={{
                                                                            background: "rgba(6, 182, 212, 0.15)",
                                                                            border: "1px solid var(--spray-cyan)",
                                                                            borderRadius: "4px",
                                                                            fontSize: "10px",
                                                                            padding: "2px 8px",
                                                                            color: "var(--spray-cyan)",
                                                                            cursor: "pointer",
                                                                            fontWeight: 600,
                                                                            whiteSpace: "nowrap",
                                                                        }}
                                                                        title={`Send message to ${c.authorName}`}
                                                                    >
                                                                        Message
                                                                    </button>
                                                                )}

                                                                {/* Monitor Comments Options for Artist */}
                                                                {isOwner && (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleToggleHideComment(p.id, c.id, !!c.hidden)}
                                                                            style={{
                                                                                background: c.hidden ? "rgba(6, 182, 212, 0.15)" : "rgba(244, 63, 94, 0.15)",
                                                                                border: c.hidden ? "1px solid var(--spray-cyan)" : "1px solid var(--spray-pink)",
                                                                                borderRadius: "4px",
                                                                                fontSize: "10px",
                                                                                padding: "2px 8px",
                                                                                color: c.hidden ? "var(--spray-cyan)" : "var(--spray-pink)",
                                                                                cursor: "pointer",
                                                                                fontWeight: 600,
                                                                                whiteSpace: "nowrap",
                                                                            }}
                                                                            title={c.hidden ? "Unhide comment to community" : "Hide comment from public view"}
                                                                        >
                                                                            {c.hidden ? "Unhide" : "Hide"}
                                                                        </button>
                                                                        {c.authorId && c.authorId !== backendAccountId && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleBlockUser(c, p.id)}
                                                                                style={{
                                                                                    background: "rgba(244, 63, 94, 0.15)",
                                                                                    border: "1px solid var(--spray-pink)",
                                                                                    borderRadius: "4px",
                                                                                    fontSize: "10px",
                                                                                    padding: "2px 8px",
                                                                                    color: "var(--spray-pink)",
                                                                                    cursor: "pointer",
                                                                                    fontWeight: 600,
                                                                                    whiteSpace: "nowrap",
                                                                                }}
                                                                                title={`Block ${c.authorName} from commenting on your posts`}
                                                                            >
                                                                                Block
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (isGuest) {
                                                                            onTriggerLogin?.("Sign in to report comments.");
                                                                        } else {
                                                                            setReportingComment({ id: c.id, authorName: c.authorName, text: c.text });
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        background: "none",
                                                                        border: "1px solid var(--line)",
                                                                        borderRadius: "4px",
                                                                        color: "var(--spray-pink)",
                                                                        fontSize: "10px",
                                                                        cursor: "pointer",
                                                                        padding: "2px 8px",
                                                                        whiteSpace: "nowrap",
                                                                    }}
                                                                    title="Report inappropriate comment"
                                                                >
                                                                    Report
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p style={{ margin: 0, fontSize: "13px", color: c.hidden ? "var(--muted)" : "var(--ink)", lineHeight: "1.5" }}>
                                                            {c.text}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* New Comment Input */}
                                        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                            <input
                                                type="text"
                                                placeholder="Write a comment on this artwork..."
                                                value={activeCommentPostId === p.id ? commentInput : ""}
                                                onFocus={() => setActiveCommentPostId(p.id)}
                                                onChange={(e) => {
                                                    setActiveCommentPostId(p.id);
                                                    setCommentInput(e.target.value);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && commentInput.trim()) {
                                                        const text = commentInput.trim();
                                                        const numericPostId = p.id.startsWith("post-") ? (p.id.includes("lp") ? 1000 : 101) : Number(p.id) || 101;
                                                        fetch(
                                                            `${API_BASE}/api/posts/${numericPostId}/comments?fanId=${backendAccountId}&artistId=${artist.id}&genre=${encodeURIComponent(artist.genre)}`,
                                                            {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({
                                                                    content: text,
                                                                    authorName: currentUser?.name || "Fan",
                                                                    authorRole: currentUser?.role || "Fan",
                                                                    fanId: backendAccountId,
                                                                    artistId: artist.id,
                                                                }),
                                                            }
                                                        ).then((res) => {
                                                            if (res.status === 403) {
                                                                setError("You are blocked by this artist from commenting on their posts.");
                                                            }
                                                        }).catch(() => {});

                                                        setPostComments((prev) => ({
                                                            ...prev,
                                                            [p.id]: [
                                                                ...(prev[p.id] || []),
                                                                {
                                                                    id: `c-${Date.now()}`,
                                                                    authorName: currentUser?.name || "Fan",
                                                                    authorId: currentUser?.id,
                                                                    authorRole: currentUser?.role === "Artist" ? ("Artist" as const) : ("Fan" as const),
                                                                    text,
                                                                    createdAt: "Just now",
                                                                },
                                                            ],
                                                        }));
                                                        setCommentInput("");
                                                        setNotice("Comment posted!");
                                                    }
                                                }}
                                                style={{ flex: 1, margin: 0, padding: "8px 12px", fontSize: "12px" }}
                                            />
                                            <button
                                                type="button"
                                                className="primary"
                                                style={{ padding: "8px 14px", fontSize: "12px" }}
                                                onClick={() => {
                                                    if (!commentInput.trim()) return;
                                                    const text = commentInput.trim();
                                                    const numericPostId = p.id.startsWith("post-") ? (p.id.includes("lp") ? 1000 : 101) : Number(p.id) || 101;
                                                    fetch(
                                                        `${API_BASE}/api/posts/${numericPostId}/comments?fanId=${backendAccountId}&artistId=${artist.id}&genre=${encodeURIComponent(artist.genre)}`,
                                                        {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({
                                                                content: text,
                                                                authorName: currentUser?.name || "Fan",
                                                                authorRole: currentUser?.role || "Fan",
                                                                fanId: backendAccountId,
                                                                artistId: artist.id,
                                                            }),
                                                        }
                                                    ).then((res) => {
                                                        if (res.status === 403) {
                                                            setError("You are blocked by this artist from commenting on their posts.");
                                                        }
                                                    }).catch(() => {});

                                                    setPostComments((prev) => ({
                                                        ...prev,
                                                        [p.id]: [
                                                            ...(prev[p.id] || []),
                                                            {
                                                                id: `c-${Date.now()}`,
                                                                authorName: currentUser?.name || "Fan",
                                                                authorId: currentUser?.id,
                                                                authorRole: currentUser?.role === "Artist" ? ("Artist" as const) : ("Fan" as const),
                                                                text,
                                                                createdAt: "Just now",
                                                            },
                                                        ],
                                                    }));
                                                    setCommentInput("");
                                                    setNotice("Comment posted!");
                                                }}
                                            >
                                                Post
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {events.length === 0 && posts.length === 0 && (
                        <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
                            <p style={{ color: "var(--muted)", margin: 0 }}>No events or posts have been shared yet.</p>
                        </div>
                    )}
                </div>
            </div>
            </>
            )}
            {reportingComment && (
                <ReportContentModal
                    targetType="POST"
                    targetId={artist.id}
                    contentSummary={reportingComment.text}
                    authorName={reportingComment.authorName}
                    onClose={() => setReportingComment(null)}
                    onSuccess={() => setNotice("Report submitted for administrator review.")}
                />
            )}
            {reportingPost && (
                <ReportContentModal
                    targetType="POST"
                    targetId={artist.id}
                    contentSummary={reportingPost.text}
                    authorName={reportingPost.authorName}
                    onClose={() => setReportingPost(null)}
                    onSuccess={() => setNotice("Report submitted for administrator review.")}
                />
            )}
        </div>
    );
}
