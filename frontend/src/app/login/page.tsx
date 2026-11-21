"use client";

import React, { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Role, MOCK_USERS, getActorHomePage } from "../../lib/auth";
import { useAuth } from "../../context/AuthContext";

const MEMBER_ROLES: Role[] = ["Fan", "Artist"];

export default function LoginPage() {
    const router = useRouter();
    const { login, currentUser } = useAuth();

    const [selectedRole, setSelectedRole] = useState<Role>("Fan");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setNotice("");

        if (!username.trim()) {
            setError("Please enter your username.");
            return;
        }

        const trimmed = username.trim().toLowerCase();
        // Check if user is attempting admin access on the member screen
        const isAdminAttempt = MOCK_USERS.some(
            (u) => u.role === "Admin" && (u.email === trimmed || u.username === trimmed || u.name.toLowerCase() === trimmed || trimmed === "admin")
        );

        if (isAdminAttempt) {
            setError("Administrative accounts cannot sign in on the user login screen. Please navigate to /admin to access the administrative portal.");
            return;
        }

        const result = login(username, password, selectedRole);
        if (result.success) {
            setNotice(`Logged in as ${username}! Redirecting to ${getActorHomePage(selectedRole)}…`);
            setTimeout(() => {
                router.push(getActorHomePage(selectedRole));
            }, 350);
        } else {
            setError(result.error || `Invalid credentials for ${selectedRole} login.`);
        }
    }

    return (
        <div className="app-shell" style={{ justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "40px 16px" }}>
            <div style={{ maxWidth: "520px", width: "100%" }}>
                {/* Brand Header */}
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <Link className="brand" href="/" style={{ justifyContent: "center" }}>
                        a<span>ArtistConnect</span><i>●</i>
                    </Link>
                    <p style={{ color: "var(--muted)", marginTop: "8px", fontSize: "14px" }}>
                        Member Sign In · Fans & Artists
                    </p>
                </div>

                {/* Active Session Notice */}
                {currentUser && currentUser.role !== "Admin" && (
                    <div className="panel" style={{ marginBottom: "20px", background: "#f0f7f4", borderColor: "#c4ded4", padding: "14px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                            <div>
                                <small style={{ color: "var(--muted)", display: "block" }}>CURRENTLY SIGNED IN</small>
                                <strong>{currentUser.name}</strong> ({currentUser.role})
                            </div>
                            <Link href={getActorHomePage(currentUser.role)} className="primary" style={{ fontSize: "12px", padding: "6px 12px" }}>
                                Open {currentUser.role} Workspace →
                            </Link>
                        </div>
                    </div>
                )}

                {/* Card Container */}
                <div className="panel" style={{ padding: "32px" }}>
                    {/* Actor Role Tabs: Fan & Artist */}
                    <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--line)", paddingBottom: "16px", marginBottom: "24px" }}>
                        {MEMBER_ROLES.map((r) => (
                            <button
                                key={r}
                                type="button"
                                className={selectedRole === r ? "primary" : "btn-secondary"}
                                style={{ flex: 1, padding: "9px 8px", fontSize: "13px" }}
                                onClick={() => {
                                    setSelectedRole(r);
                                    setError("");
                                    setNotice("");
                                }}
                            >
                                {r === "Fan" ? "Fan Sign In" : "Artist Sign In"}
                            </button>
                        ))}
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <h2 style={{ fontSize: "18px", marginBottom: "6px" }}>
                            {selectedRole} Portal Sign In
                        </h2>
                        <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                            {selectedRole === "Fan"
                                ? "Discover artists, personalize algorithmic recommendations, follow creators, and comment on artwork."
                                : "Curate upcoming live events, publish creative posts, and communicate with community fans."}
                        </p>
                    </div>

                    {notice && <div className="notice" role="status" style={{ marginBottom: "16px" }}>{notice}</div>}
                    {error && <div className="error" role="alert" style={{ marginBottom: "16px" }}>{error}</div>}

                    {/* Standard Credentials Form */}
                    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                {selectedRole} Email Address
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={selectedRole === "Fan" ? "fan@test.com" : "artist@test.com"}
                                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "6px" }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "6px" }}
                            />
                        </div>

                        <button type="submit" className="primary" style={{ padding: "12px", marginTop: "8px" }}>
                            Sign In as {selectedRole} →
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div style={{ borderTop: "1px solid var(--line)", marginTop: "24px", paddingTop: "16px", textAlign: "center" }}>
                        <small style={{ color: "var(--muted)" }}>
                            Administrator? Access the moderation console at{" "}
                            <Link href="/admin" style={{ color: "var(--green)", fontWeight: 600 }}>
                                /admin
                            </Link>
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
}
