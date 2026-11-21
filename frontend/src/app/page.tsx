"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { getActorHomePage } from "../lib/auth";
import { ArtistConnectWorkspace } from "../components/workspace/ArtistConnectWorkspace";

export default function Home() {
    const router = useRouter();
    const { currentUser, isInitialized } = useAuth();

    useEffect(() => {
        if (!isInitialized) return;
        if (currentUser) {
            router.replace(getActorHomePage(currentUser.role));
        }
    }, [currentUser, isInitialized, router]);

    if (!isInitialized) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
                <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading ArtistConnect…</p>
            </div>
        );
    }

    if (currentUser) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
                <p style={{ color: "var(--muted)", fontSize: "14px" }}>Redirecting to {currentUser.role} Workspace…</p>
            </div>
        );
    }

    return <ArtistConnectWorkspace currentPath="/" initialFlashLogin={true} guestRole="Fan" />;
}
