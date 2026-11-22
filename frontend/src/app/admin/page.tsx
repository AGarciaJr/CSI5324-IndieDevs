"use client";

import React, { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { ArtistConnectWorkspace } from "../../components/workspace/ArtistConnectWorkspace";

export default function AdminPage() {
    const { currentUser, isInitialized, login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    if (!isInitialized) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <p style={{ color: "var(--muted)" }}>Checking administrative authorization…</p>
            </div>
        );
    }

    // 1. Authenticated as Admin -> Render Admin Workspace
    if (currentUser && currentUser.role === "Admin") {
        return <ArtistConnectWorkspace currentPath="/admin" />;
    }

    // 2. Authenticated as Fan or Artist -> Strict 403 Forbidden (No role bypass)
    if (currentUser && currentUser.role !== "Admin") {
        return (
            <div className="app-shell" style={{ justifyContent: "center", alignItems: "center", padding: "40px 20px", minHeight: "100vh" }}>
                <div className="panel" style={{ maxWidth: "580px", width: "100%", padding: "36px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                        <div>
                            <span className="pill" style={{ background: "#fff3f0", color: "#9e3926", borderColor: "#f1cfc6" }}>
                                HTTP 403: FORBIDDEN
                            </span>
                            <h2 style={{ margin: "4px 0 0" }}>Administrative Access Denied</h2>
                        </div>
                    </div>

                    <div className="conflict-warning" style={{ margin: "16px 0", fontSize: "13px" }}>
                        <strong>Access Restriction:</strong> Administrative moderation tools are strictly restricted to authenticated system administrators.
                    </div>

                    <p style={{ fontSize: "14px", color: "var(--ink)", lineHeight: "1.6" }}>
                        You are currently signed in as <strong>{currentUser.name}</strong> ({currentUser.role}).
                        You do not have administrative privileges to view or manage the moderation queue.
                    </p>

                    <div style={{ borderTop: "1px solid var(--line)", marginTop: "24px", paddingTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <Link
                            href={currentUser.role === "Fan" ? "/fan" : "/artist"}
                            className="primary"
                            style={{ display: "inline-block", padding: "10px 18px", textDecoration: "none" }}
                        >
                            Return to Your {currentUser.role} Workspace →
                        </Link>
                        <Link
                            href="/login"
                            className="btn-secondary"
                            style={{ display: "inline-block", padding: "10px 18px", textDecoration: "none" }}
                        >
                            Sign In with Different Account
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Unauthenticated -> Native Admin Login Screen on /admin route
    function handleAdminSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setNotice("");

        if (!username.trim()) {
            setError("Please enter administrator username.");
            return;
        }

        const result = login(username, password, "Admin");
        if (result.success) {
            setNotice(`Authenticated as Administrator ${username}! Loading moderation console…`);
        } else {
            setError(result.error || "Administrative authentication failed.");
        }
    }

    return (
        <div className="app-shell" style={{ justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "40px 16px" }}>
            <div style={{ maxWidth: "480px", width: "100%" }}>
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <Link className="brand" href="/" style={{ justifyContent: "center" }}>
                        a<span>ArtistConnect</span><i>●</i>
                    </Link>
                    <p style={{ color: "var(--muted)", marginTop: "8px", fontSize: "14px" }}>
                        Administrative Service · Moderation Portal
                    </p>
                </div>

                <div className="panel" style={{ padding: "32px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                        <h2 style={{ margin: 0, fontSize: "19px" }}>Administrator Sign In</h2>
                        <span className="role-badge admin">ADMIN</span>
                    </div>

                    <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "20px" }}>
                        Enter your administrative credentials to access moderation reports, ban appeals, and verification requests.
                    </p>

                    {notice && <div className="notice" role="status" style={{ marginBottom: "16px" }}>{notice}</div>}
                    {error && <div className="error" role="alert" style={{ marginBottom: "16px" }}>{error}</div>}

                    <form onSubmit={handleAdminSubmit} style={{ display: "grid", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                Admin Email Address
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="admin@test.com"
                                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "6px" }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                Admin Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter administrator password"
                                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "6px" }}
                            />
                        </div>

                        <button type="submit" className="primary" style={{ padding: "12px", marginTop: "8px" }}>
                            Sign In to Administrative Console →
                        </button>
                    </form>

                    <div style={{ borderTop: "1px solid var(--line)", marginTop: "24px", paddingTop: "14px", textAlign: "center" }}>
                        <Link href="/login" style={{ fontSize: "12px", color: "var(--muted)" }}>
                            ← Looking for Fan or Artist login?
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
