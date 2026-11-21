"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { MOCK_USERS, getBackendAccountId } from "../../lib/auth";

export function DevDebugHUD() {
    // Only render in development mode - never in production builds
    if (process.env.NODE_ENV === "production") {
        return null;
    }

    return <DevDebugHUDInner />;
}

function DevDebugHUDInner() {
    const { currentUser, loginAsPersona, logout } = useAuth();
    const [open, setOpen] = useState(false);

    const backendAccountId = currentUser ? getBackendAccountId(currentUser) : 0;

    return (
        <aside
            aria-label="Developer Debug HUD"
            style={{
                position: "fixed",
                bottom: "16px",
                right: "16px",
                zIndex: 9999,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "11px",
                width: "auto",
                height: "auto",
                background: "transparent",
                border: "none",
                padding: 0,
                boxShadow: "none",
            }}
        >
            {/* FLOATING TRIGGER BADGE */}
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "rgba(16, 20, 32, 0.85)",
                        border: "1px solid rgba(244, 63, 94, 0.45)",
                        backdropFilter: "blur(16px)",
                        color: "#ffffff",
                        padding: "7px 14px",
                        borderRadius: "24px",
                        cursor: "pointer",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(244, 63, 94, 0.3)",
                        transition: "all 0.2s ease",
                    }}
                >
                    <span style={{ color: "var(--spray-pink)", fontSize: "14px" }}>⚡</span>
                    <span style={{ fontWeight: 700, letterSpacing: "0.5px" }}>DEV HUD</span>
                    <span
                        style={{
                            background: currentUser ? "rgba(6, 182, 212, 0.2)" : "rgba(255, 255, 255, 0.1)",
                            color: currentUser ? "var(--spray-cyan)" : "var(--muted)",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            fontSize: "9px",
                        }}
                    >
                        {currentUser ? `${currentUser.role}: ${currentUser.name.split(" ")[0]}` : "Guest"}
                    </span>
                </button>
            )}

            {/* EXPANDED LIQUID GLASS DEBUG DRAWER */}
            {open && (
                <div
                    style={{
                        width: "360px",
                        background: "rgba(14, 18, 28, 0.92)",
                        border: "1px solid var(--line-strong)",
                        borderRadius: "16px",
                        padding: "18px",
                        backdropFilter: "blur(32px) saturate(190%)",
                        boxShadow: "0 24px 60px -10px rgba(0, 0, 0, 0.85), var(--glass-specular), 0 0 25px rgba(244, 63, 94, 0.2)",
                        color: "var(--ink)",
                    }}
                >
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--line)", paddingBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ color: "var(--spray-pink)", fontSize: "14px" }}>⚡</span>
                            <b style={{ letterSpacing: "1px", textTransform: "uppercase", fontSize: "11px", color: "#ffffff" }}>
                                Dev Sandbox & Diagnostics
                            </b>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            style={{
                                background: "none",
                                border: "none",
                                color: "var(--muted)",
                                fontSize: "16px",
                                cursor: "pointer",
                                padding: "2px 6px",
                                boxShadow: "none",
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Environment Isolation Info */}
                    <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--line)", borderRadius: "8px", padding: "10px", marginBottom: "12px", lineHeight: "1.5" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--muted)" }}>Database:</span>
                            <span style={{ color: "#6ee7b7", fontWeight: 700 }}>H2 in-memory (RAM)</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                            <span style={{ color: "var(--muted)" }}>Prod Isolation:</span>
                            <span style={{ color: "#38bdf8", fontWeight: 700 }}>100% Isolated (0 blast)</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                            <span style={{ color: "var(--muted)" }}>H2 Console:</span>
                            <a
                                href="http://localhost:8080/h2-console"
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: "var(--spray-pink)", textDecoration: "underline" }}
                            >
                                localhost:8080/h2-console ↗
                            </a>
                        </div>
                    </div>

                    {/* Current Session State */}
                    <div style={{ marginBottom: "14px" }}>
                        <span style={{ color: "var(--spray-cyan)", fontSize: "9px", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: "6px", fontWeight: 700 }}>
                            Active Auth State
                        </span>
                        <div style={{ background: "rgba(0, 0, 0, 0.35)", borderRadius: "6px", padding: "8px 10px", border: "1px solid var(--line)", fontSize: "10px" }}>
                            <div><b>User:</b> {currentUser ? `${currentUser.name} (${currentUser.username})` : "None (Guest Visitor)"}</div>
                            <div><b>Role:</b> {currentUser ? currentUser.role : "Guest (Fan discovery mode)"}</div>
                            <div><b>Header X-User-Id:</b> {backendAccountId || "None (Unauthenticated)"}</div>
                            <div><b>Storage:</b> localStorage[&quot;artistconnect-active-persona&quot;]</div>
                        </div>
                    </div>

                    {/* Quick Dev Switcher */}
                    <div>
                        <span style={{ color: "var(--spray-pink)", fontSize: "9px", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: "6px", fontWeight: 700 }}>
                            Safe Dev Persona Switcher
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                            {MOCK_USERS.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => loginAsPersona(user)}
                                    style={{
                                        padding: "6px 8px",
                                        fontSize: "10px",
                                        textAlign: "left",
                                        background: currentUser?.id === user.id ? "rgba(244, 63, 94, 0.2)" : "rgba(255, 255, 255, 0.04)",
                                        borderColor: currentUser?.id === user.id ? "var(--spray-pink)" : "var(--line)",
                                        borderRadius: "6px",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    <b>{user.name.split(" ")[0]}</b> <span style={{ opacity: 0.7 }}>({user.role})</span>
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => logout()}
                            style={{
                                width: "100%",
                                marginTop: "8px",
                                padding: "6px",
                                fontSize: "10px",
                                background: "rgba(239, 68, 68, 0.12)",
                                borderColor: "rgba(239, 68, 68, 0.3)",
                                color: "#fca5a5",
                                borderRadius: "6px",
                            }}
                        >
                            Reset to Clean Guest (Purge localStorage)
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
}
