"use client";

import React, { useState, Suspense, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { registerFanUser, submitArtistApplication } from "../../lib/auth";

const ART_TAG_SUGGESTIONS = [
    "Street Art / Graffiti",
    "Visual Media",
    "Music - Indie Rock",
    "Music - Synth-Pop",
    "Digital Art",
    "Photography",
    "Mixed-Media",
    "Sculpture & Installation",
    "Electronic & Ambient",
    "Hip-Hop & Beatmaking",
];

const GENRE_SUGGESTIONS = [
    "Street Art / Muralist",
    "Visual Media & Canvas",
    "Indie Rock",
    "Synth-Pop & Electronic",
    "Digital Art & 3D",
    "Photography & Film",
    "Mixed-Media",
    "Ambient Soundscapes",
    "Experimental & Avant-Garde",
];

function RegisterContent({ initialTab }: { initialTab?: "fan" | "artist" }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loginAsPersona, currentUser } = useAuth();

    const paramTab = searchParams?.get("tab") === "artist" ? "artist" : "fan";
    const defaultTab = initialTab || paramTab;
    const [userSelectedTab, setUserSelectedTab] = useState<"fan" | "artist" | null>(null);
    const activeTab = userSelectedTab ?? defaultTab;

    function setActiveTab(tab: "fan" | "artist") {
        setUserSelectedTab(tab);
    }

    // Fan Form State
    const [fanName, setFanName] = useState("");
    const [fanEmail, setFanEmail] = useState("");
    const [fanPassword, setFanPassword] = useState("");
    const [fanLocation, setFanLocation] = useState("");
    const [fanBio, setFanBio] = useState("");
    const [fanInterests, setFanInterests] = useState<string[]>(["Music - Indie Rock", "Street Art / Graffiti"]);
    const [customTag, setCustomTag] = useState("");

    // Artist Form State
    const [artistName, setArtistName] = useState("");
    const [artistEmail, setArtistEmail] = useState("");
    const [artistPassword, setArtistPassword] = useState("");
    const [proposedGenre, setProposedGenre] = useState("Street Art / Muralist");
    const [artistLocation, setArtistLocation] = useState("");
    const [artistBio, setArtistBio] = useState("");
    const [portfolioLinks, setPortfolioLinks] = useState("");
    const [applicationStatement, setApplicationStatement] = useState("");

    // Form Feedback
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successNotice, setSuccessNotice] = useState("");
    const [submittedApplication, setSubmittedApplication] = useState<{
        applicantName: string;
        proposedGenre: string;
        portfolioLinks: string;
        description: string;
        submittedAt: string;
    } | null>(null);

    function toggleInterest(tag: string) {
        if (fanInterests.includes(tag)) {
            setFanInterests(fanInterests.filter((t) => t !== tag));
        } else {
            setFanInterests([...fanInterests, tag]);
        }
    }

    function addCustomTag() {
        const trimmed = customTag.trim();
        if (trimmed && !fanInterests.includes(trimmed)) {
            setFanInterests([...fanInterests, trimmed]);
            setCustomTag("");
        }
    }

    async function handleFanSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setSuccessNotice("");

        if (!fanName.trim()) {
            setError("Please enter your name or preferred community handle.");
            return;
        }
        if (!fanEmail.trim() || !fanEmail.includes("@")) {
            setError("Please enter a valid email address.");
            return;
        }
        if (!fanPassword) {
            setError("Please choose a password.");
            return;
        }

        try {
            setSubmitting(true);
            const newFanPersona = registerFanUser({
                name: fanName,
                email: fanEmail,
                password: fanPassword,
                location: fanLocation,
                bio: fanBio,
                interests: fanInterests,
            });

            loginAsPersona(newFanPersona);
            setSuccessNotice(`Account created successfully! Welcome to ArtistConnect, ${newFanPersona.name}. Redirecting to your Fan workspace...`);

            setTimeout(() => {
                router.push("/fan");
            }, 600);
        } catch (err: unknown) {
            setError(`Registration failed: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleArtistSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setSuccessNotice("");

        if (!artistName.trim()) {
            setError("Please enter your artist or collective name.");
            return;
        }
        if (!artistEmail.trim() || !artistEmail.includes("@")) {
            setError("Please enter a valid contact email address.");
            return;
        }
        if (!artistPassword) {
            setError("Please choose a password for your account.");
            return;
        }
        if (!proposedGenre.trim()) {
            setError("Please specify your art format or genre.");
            return;
        }
        if (!portfolioLinks.trim()) {
            setError("Please provide at least one portfolio or showcase link for administrator verification.");
            return;
        }
        if (!applicationStatement.trim()) {
            setError("Please provide an application statement describing your craft and why you want to join ArtistConnect.");
            return;
        }

        try {
            setSubmitting(true);
            const result = await submitArtistApplication({
                name: artistName,
                email: artistEmail,
                proposedGenre,
                location: artistLocation,
                portfolioLinks,
                description: `${applicationStatement.trim()}${artistBio.trim() ? " | Bio: " + artistBio.trim() : ""}`,
                password: artistPassword,
            });

            if (result.success) {
                setSubmittedApplication({
                    applicantName: artistName,
                    proposedGenre,
                    portfolioLinks,
                    description: applicationStatement,
                    submittedAt: new Date().toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                });
            } else {
                setError(result.error || "Failed to submit artist application.");
            }
        } catch (err: unknown) {
            setError(`Submission error: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="app-shell" style={{ justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "40px 16px" }}>
            <div style={{ maxWidth: "640px", width: "100%" }}>
                {/* Brand Header */}
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <Link className="brand" href="/" style={{ justifyContent: "center" }}>
                        a<span>ArtistConnect</span><i>●</i>
                    </Link>
                    <p style={{ color: "var(--muted)", marginTop: "8px", fontSize: "14px" }}>
                        Join the Independent Arts & Music Underground
                    </p>
                </div>

                {/* Active Session Warning */}
                {currentUser && (
                    <div className="panel" style={{ marginBottom: "20px", background: "rgba(255, 255, 255, 0.05)", borderColor: "var(--line)", padding: "14px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                            <div>
                                <small style={{ color: "var(--muted)", display: "block" }}>CURRENTLY LOGGED IN</small>
                                <strong>{currentUser.name}</strong> ({currentUser.role})
                            </div>
                            <Link href={currentUser.role === "Fan" ? "/fan" : currentUser.role === "Artist" ? "/artist" : "/admin"} className="primary" style={{ fontSize: "12px", padding: "6px 12px" }}>
                                Open {currentUser.role} Workspace →
                            </Link>
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="panel" style={{ padding: "32px", backdropFilter: "blur(20px)", background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--line-strong)", borderRadius: "14px" }}>
                    {/* Mode Selector Tabs */}
                    <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--line)", paddingBottom: "16px", marginBottom: "24px" }}>
                        <button
                            type="button"
                            className={activeTab === "fan" ? "primary" : "btn-secondary"}
                            style={{ flex: 1, padding: "10px 14px", fontSize: "13px", fontWeight: 700 }}
                            onClick={() => {
                                setActiveTab("fan");
                                setError("");
                                setSuccessNotice("");
                                setSubmittedApplication(null);
                            }}
                        >
                            Fan Account (Instant Access)
                        </button>
                        <button
                            type="button"
                            className={activeTab === "artist" ? "primary" : "btn-secondary"}
                            style={{ flex: 1, padding: "10px 14px", fontSize: "13px", fontWeight: 700 }}
                            onClick={() => {
                                setActiveTab("artist");
                                setError("");
                                setSuccessNotice("");
                                setSubmittedApplication(null);
                            }}
                        >
                            Artist Application (Verification)
                        </button>
                    </div>

                    {error && (
                        <div className="error" role="alert" style={{ marginBottom: "18px", padding: "12px 16px", borderRadius: "8px" }}>
                            {error}
                        </div>
                    )}
                    {successNotice && (
                        <div className="notice" role="status" style={{ marginBottom: "18px", padding: "12px 16px", borderRadius: "8px" }}>
                            {successNotice}
                        </div>
                    )}

                    {/* FAN REGISTRATION FORM */}
                    {activeTab === "fan" && (
                        <div>
                            <div style={{ marginBottom: "22px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "6px" }}>Create Fan Account</h2>
                                <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                                    Join the community to discover independent creators, curate personalized recommendations, follow artists, and join public discussions.
                                </p>
                            </div>

                            <form onSubmit={handleFanSubmit} style={{ display: "grid", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                        Full Name or Community Handle *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={fanName}
                                        onChange={(e) => setFanName(e.target.value)}
                                        placeholder="e.g., Alex Rivera"
                                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.15)", color: "inherit" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={fanEmail}
                                        onChange={(e) => setFanEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.15)", color: "inherit" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={fanPassword}
                                        onChange={(e) => setFanPassword(e.target.value)}
                                        placeholder="Choose a password"
                                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.15)", color: "inherit" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                        City / Region (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={fanLocation}
                                        onChange={(e) => setFanLocation(e.target.value)}
                                        placeholder="e.g., Austin, TX or Brooklyn, NY"
                                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.15)", color: "inherit" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                        About You / Bio (Optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={fanBio}
                                        onChange={(e) => setFanBio(e.target.value)}
                                        placeholder="Tell other art lovers what kind of creations, gigs, or galleries you frequent..."
                                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.15)", color: "inherit" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                        Artistic Interests (Select all that apply)
                                    </label>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                                        {ART_TAG_SUGGESTIONS.map((tag) => {
                                            const isSelected = fanInterests.includes(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => toggleInterest(tag)}
                                                    style={{
                                                        padding: "5px 11px",
                                                        fontSize: "12px",
                                                        borderRadius: "20px",
                                                        cursor: "pointer",
                                                        border: isSelected ? "1px solid var(--accent)" : "1px solid var(--line)",
                                                        background: isSelected ? "var(--accent)" : "rgba(255,255,255,0.06)",
                                                        color: isSelected ? "#000" : "inherit",
                                                        fontWeight: isSelected ? 700 : 500,
                                                        transition: "all 0.15s ease",
                                                    }}
                                                >
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Add custom tag */}
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <input
                                            type="text"
                                            value={customTag}
                                            onChange={(e) => setCustomTag(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addCustomTag();
                                                }
                                            }}
                                            placeholder="Add custom interest tag..."
                                            style={{ flex: 1, padding: "7px 10px", fontSize: "12px", border: "1px solid var(--line)", borderRadius: "6px", background: "rgba(0,0,0,0.15)", color: "inherit" }}
                                        />
                                        <button
                                            type="button"
                                            onClick={addCustomTag}
                                            className="btn-secondary"
                                            style={{ padding: "7px 12px", fontSize: "12px" }}
                                        >
                                            Add Tag
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="primary"
                                    style={{ padding: "12px", marginTop: "10px", fontSize: "14px", fontWeight: 700 }}
                                >
                                    {submitting ? "Creating Fan Account..." : "Create Fan Account & Join →"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ARTIST APPLICATION & VERIFICATION FORM */}
                    {activeTab === "artist" && !submittedApplication && (
                        <div>
                            <div style={{ marginBottom: "22px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "6px" }}>
                                    <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>Apply for Artist Profile</h2>
                                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "10px", background: "rgba(255, 200, 0, 0.15)", color: "#eab308", border: "1px solid rgba(255, 200, 0, 0.3)" }}>
                                        ADMIN VERIFICATION REQUIRED
                                    </span>
                                </div>
                                <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                                    To protect creative integrity and community trust, all Artist profiles undergo administrative review. Submit your portfolio links and background statement below.
                                </p>
                            </div>

                            <form onSubmit={handleArtistSubmit} style={{ display: "grid", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                        Artist / Band / Collective Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={artistName}
                                        onChange={(e) => setArtistName(e.target.value)}
                                        placeholder="e.g., Solstice Soundworks, Luna Vance"
                                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.15)", color: "inherit" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                        Contact & Account Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={artistEmail}
                                        onChange={(e) => setArtistEmail(e.target.value)}
                                        placeholder="artist@example.com"
                                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.15)", color: "inherit" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                        Account Password *
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={artistPassword}
                                        onChange={(e) => setArtistPassword(e.target.value)}
                                        placeholder="Choose a password for your account"
                                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.15)", color: "inherit" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                        Primary Art Category or Musical Genre *
                                    </label>
                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                                        {GENRE_SUGGESTIONS.map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setProposedGenre(g)}
                                                style={{
                                                    padding: "5px 10px",
                                                    fontSize: "12px",
                                                    borderRadius: "16px",
                                                    cursor: "pointer",
                                                    border: proposedGenre === g ? "1px solid var(--accent)" : "1px solid var(--line)",
                                                    background: proposedGenre === g ? "var(--accent)" : "rgba(255,255,255,0.06)",
                                                    color: proposedGenre === g ? "#000" : "inherit",
                                                    fontWeight: proposedGenre === g ? 700 : 500,
                                                }}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={proposedGenre}
                                        onChange={(e) => setProposedGenre(e.target.value)}
                                        placeholder="Or type custom art medium or genre..."
                                        style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.15)", color: "inherit", fontSize: "13px" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                        Home City / Operating Region (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={artistLocation}
                                        onChange={(e) => setArtistLocation(e.target.value)}
                                        placeholder="e.g., Waco, TX or Seattle, WA"
                                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.15)", color: "inherit" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                        Portfolio Links & Showcases *
                                    </label>
                                    <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 6px 0" }}>
                                        Provide URLs where our administrators can review your original work (SoundCloud, Spotify, Instagram, ArtStation, YouTube, Bandcamp, personal site).
                                    </p>
                                    <textarea
                                        rows={3}
                                        required
                                        value={portfolioLinks}
                                        onChange={(e) => setPortfolioLinks(e.target.value)}
                                        placeholder="https://soundcloud.com/your-music, https://instagram.com/your-art, https://artstation.com/artist"
                                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.15)", color: "inherit", fontFamily: "monospace", fontSize: "12px" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                        Application Statement & Creative Vision *
                                    </label>
                                    <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 6px 0" }}>
                                        Describe your artistic craft, what motivates your creations, and what you aim to publish or showcase on ArtistConnect.
                                    </p>
                                    <textarea
                                        rows={4}
                                        required
                                        value={applicationStatement}
                                        onChange={(e) => setApplicationStatement(e.target.value)}
                                        placeholder="I am an independent painter and street muralist working primarily with aerosol and acrylics. I want to publish ongoing series, host community workshops, and announce pop-up live painting sessions..."
                                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.15)", color: "inherit", lineHeight: 1.5 }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                        Public Artist Bio (Optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={artistBio}
                                        onChange={(e) => setArtistBio(e.target.value)}
                                        placeholder="Short bio to display on your public artist page once verified..."
                                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.15)", color: "inherit" }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="primary"
                                    style={{ padding: "12px", marginTop: "10px", fontSize: "14px", fontWeight: 700 }}
                                >
                                    {submitting ? "Submitting Application..." : "Submit Application for Admin Review →"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ARTIST APPLICATION CONFIRMATION CARD */}
                    {activeTab === "artist" && submittedApplication && (
                        <div>
                            <div style={{ textAlign: "center", padding: "16px 0 24px 0" }}>
                                <span style={{ display: "inline-block", padding: "6px 14px", borderRadius: "20px", background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.3)", fontSize: "12px", fontWeight: 700, marginBottom: "12px" }}>
                                    APPLICATION RECEIVED · PENDING VERIFICATION
                                </span>
                                <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
                                    Thank You, {submittedApplication.applicantName}!
                                </h2>
                                <p style={{ fontSize: "14px", color: "var(--muted)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.5 }}>
                                    Your creator application has been submitted to the ArtistConnect Administration Verification queue. Our curation team will review your portfolio links and statement.
                                </p>
                            </div>

                            <div className="panel" style={{ padding: "20px", background: "rgba(0, 0, 0, 0.2)", borderColor: "var(--line)", borderRadius: "10px", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--muted)" }}>
                                    Submitted Application Summary
                                </h3>
                                <div style={{ display: "grid", gap: "10px", fontSize: "13px" }}>
                                    <div>
                                        <span style={{ color: "var(--muted)", display: "inline-block", width: "140px" }}>Artist / Collective:</span>
                                        <strong>{submittedApplication.applicantName}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--muted)", display: "inline-block", width: "140px" }}>Proposed Format:</span>
                                        <span className="pill" style={{ fontSize: "11px", padding: "2px 8px" }}>{submittedApplication.proposedGenre}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--muted)", display: "inline-block", width: "140px" }}>Submitted At:</span>
                                        <span>{submittedApplication.submittedAt}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--muted)", display: "block", marginBottom: "4px" }}>Portfolio Showcases:</span>
                                        <div style={{ wordBreak: "break-all", background: "rgba(255,255,255,0.04)", padding: "8px 10px", borderRadius: "6px", fontFamily: "monospace", fontSize: "12px" }}>
                                            {submittedApplication.portfolioLinks}
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--muted)", display: "block", marginBottom: "4px" }}>Statement & Description:</span>
                                        <div style={{ background: "rgba(255,255,255,0.04)", padding: "10px 12px", borderRadius: "6px", lineHeight: 1.5, fontSize: "12px" }}>
                                            {submittedApplication.description}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                <button
                                    type="button"
                                    className="primary"
                                    onClick={() => {
                                        setActiveTab("fan");
                                        setSubmittedApplication(null);
                                    }}
                                    style={{ flex: 1, padding: "10px 14px", fontSize: "13px", textAlign: "center" }}
                                >
                                    Create a Fan Account While You Wait →
                                </button>
                                <Link
                                    href="/"
                                    className="btn-secondary"
                                    style={{ flex: 1, padding: "10px 14px", fontSize: "13px", textAlign: "center", textDecoration: "none" }}
                                >
                                    Browse Community Showcase →
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Footer Links */}
                    <div style={{ borderTop: "1px solid var(--line)", marginTop: "24px", paddingTop: "16px", textAlign: "center", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", fontSize: "13px" }}>
                        <span style={{ color: "var(--muted)" }}>
                            Already have an account?{" "}
                            <Link href="/login" style={{ color: "var(--green)", fontWeight: 700, textDecoration: "underline" }}>
                                Member Sign In →
                            </Link>
                        </span>
                        <Link href="/admin" style={{ color: "var(--muted)", fontSize: "12px" }}>
                            Admin Portal →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage({ initialTab }: { initialTab?: "fan" | "artist" }) {
    return (
        <Suspense fallback={<div className="app-shell" style={{ justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>Loading registration portal...</div>}>
            <RegisterContent initialTab={initialTab} />
        </Suspense>
    );
}
