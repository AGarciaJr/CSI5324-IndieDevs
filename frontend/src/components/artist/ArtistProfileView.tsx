"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { Artist, ArtistEvent, ArtistPost } from "../../types/artist";
import { getPostsForArtist } from "../../lib/artists";
import { useAuth } from "../../context/AuthContext";
import { getBackendAccountId } from "../../lib/auth";
import { FollowButton, ReportArtistButton } from "../fan-community";

interface ArtistProfileViewProps {
    artist: Artist;
    isModal?: boolean;
    onCloseModal?: () => void;
    onTriggerLogin?: (message: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function ArtistProfileView({
    artist,
    isModal = false,
    onCloseModal,
    onTriggerLogin,
}: ArtistProfileViewProps) {
    const { currentUser } = useAuth();
    const isGuest = !currentUser;
    const backendAccountId = currentUser ? getBackendAccountId(currentUser) : 0;

    const [events, setEvents] = useState<ArtistEvent[]>([]);
    const [posts, setPosts] = useState<ArtistPost[]>(() => getPostsForArtist(artist.id));
    const [filter, setFilter] = useState<"all" | "events" | "posts">("all");
    const [action, setAction] = useState<"" | "chat" | "book" | "comment">("");
    const [message, setMessage] = useState("");
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");
    const [liked, setLiked] = useState(false);

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

    async function handleLike() {
        if (isGuest) {
            onTriggerLogin?.("Sign in as a Fan to like this artist and save them to your taste profile.");
            return;
        }
        try {
            await fetch(
                `${API_BASE}/api/recommendations/interactions?fanId=${backendAccountId}&artistId=${artist.id}&interactionType=LIKE`,
                { method: "POST" }
            );
            setLiked(true);
            setNotice(`You liked ${artist.name}!`);
        } catch {
            setError("Could not register like. Please try again.");
        }
    }

    async function handleSubmitAction(e: FormEvent) {
        e.preventDefault();
        setError("");
        setNotice("");

        if (!message.trim()) return;

        if (action === "comment") {
            try {
                const dummyPostId = 101;
                const res = await fetch(
                    `${API_BASE}/api/posts/${dummyPostId}/comments?fanId=${backendAccountId}&artistId=${artist.id}&genre=${encodeURIComponent(artist.genre)}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "text/plain" },
                        body: message.trim(),
                    }
                );
                if (!res.ok) throw new Error("Could not submit comment.");
                setNotice(`Comment posted on ${artist.name}'s profile!`);
                setMessage("");
                setAction("");
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                setError(`Failed to post comment: ${msg}`);
            }
        } else if (action === "book") {
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
                                Visit Page ↗
                            </Link>
                            {onCloseModal && (
                                <button
                                    type="button"
                                    onClick={onCloseModal}
                                    style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "var(--muted)", padding: "4px 8px" }}
                                    aria-label="Close modal"
                                >
                                    ✕
                                </button>
                            )}
                        </>
                    ) : (
                        <Link
                            href="/fan"
                            className="btn-secondary"
                            style={{ fontSize: "12px", padding: "6px 14px", textDecoration: "none" }}
                        >
                            ← Back to Discover
                        </Link>
                    )}
                </div>
            </div>

            {/* Notification messages */}
            {notice && <div className="notice" role="status" style={{ marginBottom: "16px" }}>{notice}</div>}
            {error && <div className="error" role="alert" style={{ marginBottom: "16px" }}>{error}</div>}

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
                    {artist.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                </div>
                <div>
                    <h3 style={{ margin: 0, color: "white", fontSize: "22px", fontFamily: '"Didot", "Bodoni MT", Georgia, serif' }}>{artist.name}</h3>
                    <p style={{ margin: "4px 0 0", color: "var(--spray-cyan)", fontSize: "13px", fontWeight: 600 }}>
                        {artist.genre} · ⌖ {artist.location}
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
                {isGuest ? (
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
                            onClick={() => onTriggerLogin?.("Sign in as a Fan to like this artist.")}
                        >
                            ♡ Like
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
                            Book artist ↗
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => onTriggerLogin?.("Sign in to file a community report.")}
                        >
                            ⚑ Report
                        </button>
                    </>
                ) : (
                    <>
                        <FollowButton artistId={artist.id} />
                        <button
                            type="button"
                            className={liked ? "primary" : "btn-secondary"}
                            onClick={handleLike}
                        >
                            {liked ? "♥ Liked" : "♡ Like"}
                        </button>
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
                            Book artist ↗
                        </button>
                        {currentUser?.role === "Fan" && (
                            <button
                                type="button"
                                className="primary"
                                style={{ background: "#4a5b66", borderColor: "#4a5b66" }}
                                onClick={() => { setAction("comment"); setMessage(""); }}
                            >
                                Comment on Artwork 💬
                            </button>
                        )}
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
                        {action === "chat" ? `Send message to ${artist.name}` : action === "book" ? `Book ${artist.name}` : `Leave a comment on ${artist.name}'s artwork`}
                    </h4>
                    <textarea
                        rows={3}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                            action === "chat"
                                ? "Write your message here..."
                                : action === "book"
                                ? "Provide event details, proposed date, and contact information..."
                                : "Leave feedback or appreciation for this artist's work..."
                        }
                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "13px" }}
                    />
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                        <button type="submit" className="primary" style={{ padding: "8px 16px" }}>
                            {action === "chat" ? "Send Message ↗" : action === "book" ? "Submit Booking Request ↗" : "Post Comment ↗"}
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
                                        ▦ UPCOMING {ev.eventType.toUpperCase()}
                                    </span>
                                    <span className="pill" style={{ fontSize: "10px" }}>
                                        {ev.capacity} spots
                                    </span>
                                </div>

                                <h5 style={{ margin: "6px 0", fontSize: "16px", color: "#ffffff", fontWeight: 700 }}>
                                    {ev.title}
                                </h5>

                                <p style={{ fontSize: "12px", color: "var(--spray-cyan)", margin: "4px 0 10px", fontWeight: 600 }}>
                                    📅 {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "Date TBA"} · ⌖ {ev.location} {ev.virtual && "(Virtual Stream)"}
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
                        posts.map((p) => (
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
                                                {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "Recent update"} · {p.public ? "Public" : "Subscribers only"}
                                            </small>
                                        </div>
                                    </div>

                                    <span className="pill" style={{ fontSize: "9px" }}>
                                        ✦ ARTIST POST
                                    </span>
                                </div>

                                <p style={{ fontSize: "14px", color: "var(--ink)", lineHeight: "1.7", margin: "10px 0" }}>
                                    {p.text}
                                </p>

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
                                                    <div style={{ padding: "12px 16px", background: "rgba(0, 0, 0, 0.4)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                                                        <div style={{ fontSize: "11px", color: "var(--spray-cyan)", marginBottom: "6px", fontWeight: 600 }}>
                                                            🎵 {file.name || "Audio Track Preview"}
                                                        </div>
                                                        <audio controls src={file.data} style={{ width: "100%" }} />
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
                                                        📎 View Attachment: {file.name}
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: "12px", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: "12px", marginTop: "14px" }}>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        style={{ fontSize: "11px", padding: "5px 12px" }}
                                        onClick={() => {
                                            if (isGuest) {
                                                onTriggerLogin?.("Sign in to like this post.");
                                            } else {
                                                setNotice("Post liked!");
                                            }
                                        }}
                                    >
                                        ♡ Like
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        style={{ fontSize: "11px", padding: "5px 12px" }}
                                        onClick={() => {
                                            if (isGuest) {
                                                onTriggerLogin?.("Sign in to comment on posts.");
                                            } else {
                                                setAction("comment");
                                            }
                                        }}
                                    >
                                        💬 Comment
                                    </button>
                                </div>
                            </div>
                        ))}

                    {events.length === 0 && posts.length === 0 && (
                        <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
                            <p style={{ color: "var(--muted)", margin: 0 }}>No events or posts have been shared yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
