"use client";
import { useEffect, useState } from "react";
import { UserPersona, LocalStore, Artist } from "../types/index";
import { API_BASE, STORE_KEY, PERSONAS, initialStore } from "../constants/index";
import Link from "next/link";
import { FanCommunityProvider, FollowButton, FollowingPanel, FanProfilePanel, FanReportsPanel, ReportArtistButton, AdminReportsPanel } from "../components/fan-community";
import { useEffect, useState, type FormEvent } from "react";

// Components
import Sidebar from "../components/Sidebar";
import ArtistProfileModal from "../components/ArtistProfileModal";
import AdminWorkspace from "../features/admin/AdminWorkspace";
import ArtistWorkspace from "../features/artist/ArtistWorkspace";
import FanWorkspace from "../features/fan/FanWorkspace";


export default function Home() {
    // Global State
    const [currentUser, setCurrentUser] = useState<UserPersona>(PERSONAS[0]); // Nicholas Nolen (Fan)
    const [tab, setTab] = useState("Recommendations");
    const [showAccountMenu, setShowAccountMenu] = useState(false);

    // Active Navigation Tab
    const [tab, setTab] = useState("Discover");

    // General app state
    const [store, setStore] = useState<LocalStore>(initialStore);
    const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

    function persistStore(next: LocalStore) {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify(next));
            setStore(next);
            return true;
        } catch { return false; }
    }

    // Initialize local demo data & verify backend connection
    useEffect(() => {
        const timer = setTimeout(() => {
        try {
            const saved = localStorage.getItem(STORE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && Array.isArray(parsed.posts)) {
                    setStore(parsed);
                }
            }
        } catch {
            // ignore
        }

        // Test backend connectivity
        fetch(`${API_BASE}/api/artists`, { signal: AbortSignal.timeout(3000) })
            .then(res => {
                if (res.ok) setBackendConnected(true);
                else setBackendConnected(false);
            })
            .catch(() => setBackendConnected(false));
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    // Routing Guardrails (Protecting tabs on persona switch)
    useEffect(() => {
        if (currentUser.role === "Fan" && ["Manage Events", "Ban Appeals", "Verifications"].includes(tab)) setTab("Recommendations");
        else if (currentUser.role === "Artist" && ["Recommendations", "Ban Appeals"].includes(tab)) setTab("Manage Events");
        else if (currentUser.role === "Admin" && ["Recommendations", "Manage Events", "Make a post", "Discover"].includes(tab)) setTab("Ban Appeals");
    }, [currentUser, tab]);

    return (
        <FanCommunityProvider key={`${backendAccountId}-${currentUser.role}`} accountId={backendAccountId} role={currentUser.role}>
        <div className="app-shell">
            <Sidebar 
                currentUser={currentUser} 
                setCurrentUser={setCurrentUser} 
                tab={tab} 
                setTab={setTab} 
            />

            {/* MAIN WORKSPACE */}
            <div className="workspace">
                <header>
                    <span>Independent art. Shared experiences. Full-stack verified.</span>
                    <span className="status-dot">
                        Backend ({API_BASE}):{" "}
                        <strong style={{ color: backendConnected ? "#2c604c" : "#9e3926" }}>
                            {backendConnected ? "Live Connected ●" : "Connecting/Offline ○"}
                        </strong>
                    </span>
                </header>

                <main>
                    {/* The UI is now fully delegated to the Domain Workspaces */}
                    {currentUser.role === "Fan" && <FanWorkspace currentUser={currentUser} tab={tab} onSelectArtist={setSelectedArtist} store={store} setTab={setTab} />}
                    {currentUser.role === "Artist" && <ArtistWorkspace currentUser={currentUser} tab={tab} store={store} persistStore={persistStore} />}
                    {currentUser.role === "Admin" && <AdminWorkspace currentUser={currentUser} tab={tab} setCurrentUser={setCurrentUser} setTab={setTab} />}
                </main>

                <footer>
                    <b>ArtistConnect</b>
                    <span>A home for independent expression.</span>
                </footer>
            </div>

            {/* ARTIST PROFILE MODAL */}
            {selectedArtist && (
                <ArtistProfileModal 
                    selectedArtist={selectedArtist}
                    currentUser={currentUser}
                    store={store}
                    persistStore={persistStore}
                    onClose={() => setSelectedArtist(null)}
                />
            )}
        </div>
        </FanCommunityProvider>
    );
}
