"use client";

import React from "react";
import Link from "next/link";
import { Role, getActorHomePage } from "../../lib/auth";
import { useAuth } from "../../context/AuthContext";
import { ArtistConnectWorkspace } from "../workspace/ArtistConnectWorkspace";

interface AuthGuardProps {
    allowedRoles: Role[];
    actorName: string;
    children: React.ReactNode;
}

export function AuthGuard({ allowedRoles, actorName, children }: AuthGuardProps) {
    const { currentUser, isInitialized } = useAuth();

    if (!isInitialized) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <p style={{ color: "var(--muted)" }}>Checking actor authentication & permissions…</p>
            </div>
        );
    }

    // Unauthenticated: For Fan/Artist workspaces, render workspace with immediate flash login screen so guests can see content
    if (!currentUser) {
        if (allowedRoles.includes("Fan") || allowedRoles.includes("Artist")) {
            return (
                <ArtistConnectWorkspace
                    currentPath={allowedRoles.includes("Fan") ? "/fan" : "/artist"}
                    initialFlashLogin={true}
                    guestRole={allowedRoles[0]}
                />
            );
        }

        const loginPath = allowedRoles.includes("Admin") ? "/admin" : "/login";

        return (
            <div className="app-shell" style={{ justifyContent: "center", alignItems: "center", padding: "40px 20px" }}>
                <div className="panel" style={{ maxWidth: "560px", width: "100%", textAlign: "center", padding: "36px" }}>
                    <span className="pill" style={{ background: "#fff3f0", color: "#9e3926", borderColor: "#f1cfc6" }}>
                        HTTP 401: UNAUTHENTICATED
                    </span>
                    <h2 style={{ marginTop: "16px", marginBottom: "8px" }}>
                        Sign in required for {actorName} access
                    </h2>
                    <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: "1.6" }}>
                        Access to the {actorName} workspace requires an active authenticated account.
                        Please sign in with your credentials to proceed.
                    </p>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "24px", flexWrap: "wrap" }}>
                        <Link href={loginPath} className="primary" style={{ display: "inline-block", padding: "10px 20px", textDecoration: "none" }}>
                            Go to {actorName} Sign In ({loginPath}) →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // 403 Forbidden: User is authenticated, but their role is not authorized for this actor page
    if (!allowedRoles.includes(currentUser.role)) {
        const authorizedHome = getActorHomePage(currentUser.role);
        const loginTarget = allowedRoles.includes("Admin") ? "/admin" : "/login";

        return (
            <div className="app-shell" style={{ justifyContent: "center", alignItems: "center", padding: "40px 20px" }}>
                <div className="panel" style={{ maxWidth: "620px", width: "100%", padding: "36px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                        <div>
                            <span className="pill" style={{ background: "#fff3f0", color: "#9e3926", borderColor: "#f1cfc6" }}>
                                HTTP 403: FORBIDDEN
                            </span>
                            <h2 style={{ margin: "4px 0 0" }}>Access Denied · Role Restricted</h2>
                        </div>
                    </div>

                    <div className="conflict-warning" style={{ margin: "16px 0", fontSize: "13px" }}>
                        <strong>Access Restriction:</strong> The {actorName} workspace is restricted to active {actorName} accounts. Other roles cannot perform actions in this portal.
                    </div>

                    <p style={{ fontSize: "14px", color: "var(--ink)", lineHeight: "1.6" }}>
                        You are currently signed in as <strong>{currentUser.name}</strong> with the <strong>{currentUser.role}</strong> role.
                        This section of ArtistConnect is restricted exclusively to <strong>{allowedRoles.join(" / ")}</strong> actors.
                    </p>

                    <div style={{ borderTop: "1px solid var(--line)", marginTop: "24px", paddingTop: "20px" }}>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            <Link
                                href={authorizedHome}
                                className="primary"
                                style={{ display: "inline-block", padding: "10px 18px", textDecoration: "none" }}
                            >
                                Return to Your {currentUser.role} Workspace ({authorizedHome}) →
                            </Link>

                            <Link
                                href={loginTarget}
                                className="btn-secondary"
                                style={{ display: "inline-block", padding: "10px 18px", textDecoration: "none" }}
                            >
                                Switch Account / Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Authorized!
    return <>{children}</>;
}
