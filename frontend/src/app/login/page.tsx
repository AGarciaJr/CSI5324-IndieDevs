"use client";

import React, { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Role, MOCK_USERS, getActorHomePage, UserPersona } from "../../lib/auth";
import { useAuth } from "../../context/AuthContext";

const MEMBER_ROLES: Role[] = ["Fan", "Artist"];

export default function LoginPage() {
    const router = useRouter();
    const { login, loginAsPersona, currentUser } = useAuth();

    const [selectedRole, setSelectedRole] = useState<Role>("Fan");
    const [username, setUsername] = useState("nicholas");
    const [password, setPassword] = useState("password");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const filteredPersonas = MOCK_USERS.filter((u) => u.role === selectedRole);

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
            (u) => u.role === "Admin" && (u.username === trimmed || u.name.toLowerCase() === trimmed)
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

    function handleQuickLogin(persona: UserPersona) {
        setError("");
        loginAsPersona(persona);
        setNotice(`Signed in as ${persona.name} (${persona.role}). Redirecting to ${getActorHomePage(persona.role)}…`);
        setTimeout(() => {
            router.push(getActorHomePage(persona.role));
        }, 300);
    }

    return (
        <div className="app-shell" style={{ justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "40px 16px" }}>
            <div style={{ maxWidth: "560px", width: "100%" }}>
                {/* Brand Header */}
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <Link className="brand" href="/" style={{ justifyContent: "center" }}>
                        a<span>ArtistConnect</span><i>●</i>
                    </Link>
                    <p style={{ color: "var(--muted)", marginTop: "8px", fontSize: "14px" }}>
                        Member Sign In · Fans & Artists
                    </p>
                </div>

                {/* Database Handoff Notice */}
                <div className="conflict-warning" style={{ fontSize: "12px", marginBottom: "20px" }}>
                    <strong>Architecture Note:</strong> Fans and artists authenticate from this shared screen. System administrators authenticate strictly from <code>/admin</code>. This form operates via mock authentication ready for database handoff.
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
                <div className="panel" style={{ padding: "32px", background: "white" }}>
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
                                    const first = MOCK_USERS.find((u) => u.role === r);
                                    if (first) setUsername(first.username);
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
                                {selectedRole} Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={selectedRole === "Fan" ? "e.g. nicholas, jordan" : "e.g. william"}
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
                                placeholder="Enter password (mock: any value)"
                                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "6px" }}
                            />
                            <small style={{ color: "var(--muted)", marginTop: "4px", display: "block" }}>
                                Any password accepted for lightweight mock authentication.
                            </small>
                        </div>

                        <button type="submit" className="primary" style={{ padding: "12px", marginTop: "8px" }}>
                            Sign In as {selectedRole} →
                        </button>
                    </form>

                    {/* Quick Demo Login Buttons for Fan & Artist */}
                    <div style={{ borderTop: "1px solid var(--line)", marginTop: "28px", paddingTop: "20px" }}>
                        <small style={{ fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "10px" }}>
                            DEMO {selectedRole.toUpperCase()} ACCOUNTS
                        </small>
                        <div style={{ display: "grid", gap: "8px" }}>
                            {filteredPersonas.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleQuickLogin(p)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        textAlign: "left",
                                        padding: "10px 14px",
                                        background: "#fafbf9",
                                        border: "1px solid var(--line)",
                                        borderRadius: "6px",
                                    }}
                                >
                                    <div className="avatar" style={{ width: "32px", height: "32px", fontSize: "12px" }}>
                                        {p.avatar}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <b style={{ fontSize: "13px", display: "block" }}>{p.name}</b>
                                        <small style={{ color: "var(--muted)" }}>username: {p.username} · {p.description}</small>
                                    </div>
                                    <span style={{ fontSize: "12px", color: "var(--green)", fontWeight: 600 }}>
                                        Sign in →
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer Links */}
                    <div style={{ borderTop: "1px solid var(--line)", marginTop: "20px", paddingTop: "16px", textAlign: "center" }}>
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
