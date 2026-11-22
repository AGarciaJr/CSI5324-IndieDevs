"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Artist } from "../../../types/artist";
import { fetchArtistById } from "../../../lib/artists";
import { ArtistProfileView } from "../../../components/artist/ArtistProfileView";
import { useAuth } from "../../../context/AuthContext";
import { getActorHomePage } from "../../../lib/auth";

export default function DedicatedArtistContent({ id }: { id: string }) {
    const { currentUser } = useAuth();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [loading, setLoading] = useState(true);
    const [loginMessage, setLoginMessage] = useState("");

    useEffect(() => {
        if (!id) return;
        let isMounted = true;

        fetchArtistById(id)
            .then((res) => {
                if (isMounted) {
                    setArtist(res);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setArtist(null);
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [id]);

    const homeUrl = currentUser ? getActorHomePage(currentUser.role) : "/fan";

    return (
        <div className="layout" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            {/* TOP NAVIGATION HEADER */}
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 32px",
                    borderBottom: "1px solid var(--line)",
                    background: "rgba(12, 16, 26, 0.65)",
                    backdropFilter: "blur(20px)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <Link className="brand" href="/" style={{ textDecoration: "none" }}>
                        a<span>ArtistConnect</span><i>●</i>
                    </Link>
                    <Link
                        href={homeUrl}
                        className="btn-secondary"
                        style={{ fontSize: "12px", padding: "6px 14px", textDecoration: "none" }}
                    >
                        ← Back to Community
                    </Link>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {currentUser ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="avatar" style={{ width: "28px", height: "28px", fontSize: "12px" }}>
                                {currentUser.avatar}
                            </div>
                            <span style={{ fontSize: "13px", fontWeight: 600 }}>{currentUser.name}</span>
                            <span className={`role-badge ${currentUser.role.toLowerCase()}`} style={{ fontSize: "10px" }}>
                                {currentUser.role}
                            </span>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="primary"
                            style={{ fontSize: "12px", padding: "6px 14px", textDecoration: "none" }}
                        >
                            Sign In / Join →
                        </Link>
                    )}
                </div>
            </header>

            {/* MAIN CONTENT CONTAINER */}
            <main style={{ flex: 1, maxWidth: "960px", width: "100%", margin: "32px auto", padding: "0 24px" }}>
                {loginMessage && (
                    <div
                        className="notice"
                        role="status"
                        style={{
                            marginBottom: "20px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <span>{loginMessage}</span>
                        <Link
                            href="/login"
                            className="primary"
                            style={{ fontSize: "11px", padding: "4px 10px", textDecoration: "none" }}
                        >
                            Sign In
                        </Link>
                    </div>
                )}

                {loading ? (
                    <div className="panel" style={{ textAlign: "center", padding: "60px 20px" }}>
                        <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading artist profile…</p>
                    </div>
                ) : !artist ? (
                    <div className="panel" style={{ textAlign: "center", padding: "60px 20px" }}>
                        <span className="eyebrow">ARTIST NOT FOUND</span>
                        <h2 style={{ marginTop: "8px" }}>Artist profile could not be located.</h2>
                        <p style={{ color: "var(--muted)", maxWidth: "420px", margin: "12px auto 24px", fontSize: "14px" }}>
                            The artist you are looking for does not exist in our community database or may have been removed.
                        </p>
                        <Link href="/fan" className="primary" style={{ textDecoration: "none" }}>
                            Return to Discover Community ↗
                        </Link>
                    </div>
                ) : (
                    <div className="panel" style={{ padding: "32px" }}>
                        <ArtistProfileView
                            artist={artist}
                            isModal={false}
                            onTriggerLogin={(msg) => setLoginMessage(msg)}
                        />
                    </div>
                )}
            </main>

            {/* FOOTER */}
            <footer
                style={{
                    padding: "24px 32px",
                    borderTop: "1px solid var(--line)",
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: "12px",
                }}
            >
                <b>ArtistConnect</b> · A home for independent expression. © 2026 ArtistConnect. All rights reserved.
            </footer>
        </div>
    );
}
