"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { getActorHomePage } from "../lib/auth";

export default function Home() {
    const router = useRouter();
    const { currentUser, isInitialized } = useAuth();

    useEffect(() => {
        if (!isInitialized) return;
        if (currentUser) {
            router.replace(getActorHomePage(currentUser.role));
        } else {
            router.replace("/login");
        }
    }, [currentUser, isInitialized, router]);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
            <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading ArtistConnect…</p>
        </div>
    );
}
