import { useState, useEffect } from "react";
import { Artist, UserPersona, BanAppeal, ArtistApplication } from "../../types";
import { API_BASE, PERSONAS, sampleArtists } from "../../constants/index";



export default function AdminWorkspace({ 
    currentUser, tab, setCurrentUser, setTab
}: { 
    currentUser: UserPersona; tab: string; 
    setCurrentUser: (p: UserPersona) => void; setTab: (t: string) => void;
}) {
    // 1. ADMIN DOMAIN STATE
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    // Ban Appeals State
    const [appealsList, setAppealsList] = useState<BanAppeal[]>([]);
    const [selectedAppeal, setSelectedAppeal] = useState<BanAppeal | null>(null);
    const [adminNotes, setAdminNotes] = useState("");
    const [loadingAppeals, setLoadingAppeals] = useState(false);
    const [appealsViewMode, setAppealsViewMode] = useState<"eligible" | "all">("eligible");

    // Verifications State
    const [applicationsList, setApplicationsList] = useState<ArtistApplication[]>([]);
    const [loadingApps, setLoadingApps] = useState(false);

    // --- Artist Directory State ---
    const [artistResults, setArtistResults] = useState<Artist[]>(sampleArtists);
    

    // ADMIN LIFECYCLE
    useEffect(() => {
        if (tab === "Ban Appeals") loadAppeals();
        if (tab === "Verifications") loadApplications();
        if (tab === "Artist Directory") loadDirectory();
    }, [tab, currentUser, appealsViewMode]);

    // ADMIN DOMAIN METHODS
    async function loadAppeals() {
        setLoadingAppeals(true);
        setError("");
        try {
            const url = appealsViewMode === "eligible"
                ? `${API_BASE}/api/moderation/appeals/open?adminId=${currentUser.id}`
                : `${API_BASE}/api/moderation/appeals`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch ban appeals");
            const data: BanAppeal[] = await res.json();
            setAppealsList(data);
            if (data.length > 0 && (!selectedAppeal || !data.some(a => a.id === selectedAppeal.id))) {
                setSelectedAppeal(data[0]);
            } else if (data.length === 0) {
                setSelectedAppeal(null);
            }
        } catch {
            // Fallback
            setAppealsList([
                {
                    id: 1,
                    fanId: 3,
                    fanUsername: "cosmic_surfer",
                    banningAdminId: 101,
                    banningAdminName: "Admin Alex",
                    reason: "I was banned for alleged spam, but I was just excited about the album drop and my browser lagged sending duplicate comments.",
                    offendingContent: "some sentence breaking ToS",
                    reportMaterial: "Report #104: 4 identical messages posted in 8 seconds under Marisol Vega preview.",
                    aiRecommendation: "AI ToS Evaluation (ToS §3.2 - Automated Activity): Timestamp analysis confirms sub-second duplicate submission matching network packet retry or client lag. Recommendation: Lift ban; fan account in good standing prior to incident.",
                    status: "OPEN"
                },
                {
                    id: 2,
                    fanId: 4,
                    fanUsername: "beats_by_dre77",
                    banningAdminId: 102,
                    banningAdminName: "Admin Garrett",
                    reason: "I got into a heated debate about audio mixing styles. I got frustrated, but didn't threaten anyone and promise to keep comments respectful.",
                    offendingContent: "some sentence breaking ToS",
                    reportMaterial: "Report #112: Aggressive language and insults directed at another commenter regarding audio mastering quality.",
                    aiRecommendation: "AI ToS Evaluation (ToS §5.1 - Community Conduct): Language violates civility guidelines. Second infraction. Recommendation: Admin discretion; consider 7-day temporary suspension instead of permanent ban.",
                    status: "OPEN"
                }
            ]);
        } finally {
            setLoadingAppeals(false);
        }
    }

    async function loadDirectory() {
        try {
            const res = await fetch(`${API_BASE}/api/artists?includeSuspended=true`);
            if (res.ok) {
                setArtistResults(await res.json());
            }
        } catch {
            // Silently fallback to sampleArtists if the Spring Boot backend is offline
        }
    }

    async function handleUnbanFan(appealId: number) {
        setError("");
        setNotice("");
        try {
            const res = await fetch(`${API_BASE}/api/moderation/appeals/${appealId}/unban?adminId=${currentUser.id}&notes=${encodeURIComponent(adminNotes || "Reviewed and approved by admin.")}`, {
                method: "POST"
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Could not unban fan.");
            }
            const updated: BanAppeal = await res.json();
            setNotice(`Success! Fan @${updated.fanUsername} has been unbanned and restored login access.`);
            setAdminNotes("");
            loadAppeals();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Moderation action rejected: ${msg}`);
        }
    }

    async function handleInvalidateAppeal(appealId: number) {
        setError("");
        setNotice("");
        try {
            const res = await fetch(`${API_BASE}/api/moderation/appeals/${appealId}/invalidate?adminId=${currentUser.id}&notes=${encodeURIComponent(adminNotes || "Marked invalid per policy.")}`, {
                method: "POST"
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Could not invalidate appeal.");
            }
            const updated: BanAppeal = await res.json();
            setNotice(`Appeal #${updated.id} marked INVALID. Ban is upheld and user @${updated.fanUsername}'s ability to submit further appeals has been revoked.`);
            setAdminNotes("");
            loadAppeals();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Moderation action rejected: ${msg}`);
        }
    }

    async function handleSuspendArtist(artistId: number) {
        setError("");
        setNotice("");
        if (!confirm("Are you sure you want to suspend this artist? This will hide their profile.")) return;
        
        try {
            const res = await fetch(`${API_BASE}/api/moderation/artists/${artistId}/suspend`, {
                method: "PUT"
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Could not suspend artist.");
            }
            
            // Refresh the artist results so the UI shows them as suspended
            setNotice(`Success! Artist ID ${artistId} has been suspended.`);
            
            // Re-fetch the artists list to reflect changes
            const refreshRes = await fetch(`${API_BASE}/api/artists/search?`);
            if (refreshRes.ok) {
                setArtistResults(await refreshRes.json());
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Suspension failed: ${msg}`);
        }
    }

    async function loadApplications() {
        setLoadingApps(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/api/moderation/applications/pending`);
            if (!res.ok) throw new Error("Failed to load applications");
            setApplicationsList(await res.json());
        } catch {
            setApplicationsList([]); // Fails silently to empty queue if backend is missing
        } finally {
            setLoadingApps(false);
        }
    }

    async function handleApproveApplication(appId: number, applicantName: string) {
        setError("");
        setNotice("");
        try {
            const res = await fetch(`${API_BASE}/api/moderation/applications/${appId}/approve`, { method: "PUT" });
            if (!res.ok) throw new Error("Failed to approve application");
            setNotice(`Success! ${applicantName} has been verified and their Artist profile is provisioned.`);
            loadApplications();
        } catch (err: unknown) {
            setError(`Approval failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    async function handleRejectApplication(appId: number, applicantName: string) {
        setError("");
        setNotice("");
        if (!confirm(`Are you sure you want to reject ${applicantName}'s application?`)) return;
        try {
            const res = await fetch(`${API_BASE}/api/moderation/applications/${appId}/reject`, { method: "PUT" });
            if (!res.ok) throw new Error("Failed to reject application");
            setNotice(`Application for ${applicantName} marked as REJECTED.`);
            loadApplications();
        } catch (err: unknown) {
            setError(`Rejection failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    return (
    <>
        {/* ========================================================================= */}
        {/* TAB: BAN APPEALS (USE CASE: UNBAN FAN - ADMIN)                            */}
        {/* ========================================================================= */}
        {tab === "Ban Appeals" && (
            <div>
                {/* Admin Context Header */}
                <div className="panel" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fcfaf7" }}>
                    <div>
                        <span className="eyebrow">MODERATOR SESSION</span>
                        <h3 style={{ margin: "4px 0" }}>Logged in as {currentUser.name} (Admin ID: {currentUser.id})</h3>
                        <small>Policy: A different admin than the banning admin must review appeals (conflict of interest prevention).</small>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                // Toggle between Admin Alex (101) and Admin Garrett (102)
                                const otherAdmin = currentUser.id === 101 ? PERSONAS[4] : PERSONAS[3];
                                setCurrentUser(otherAdmin);
                                setNotice(`Switched to ${otherAdmin.name} (Admin ID: ${otherAdmin.id}) to test reviewer perspective.`);
                            }}
                        >
                            Switch to {currentUser.id === 101 ? "Admin Garrett (102)" : "Admin Alex (101)"} ⇄
                        </button>

                        <button
                            className={appealsViewMode === "all" ? "primary" : "btn-secondary"}
                            onClick={() => setAppealsViewMode(appealsViewMode === "all" ? "eligible" : "all")}
                            title="Toggle viewing all appeals vs only eligible unbanned appeals"
                        >
                            {appealsViewMode === "all" ? "Showing All Appeals" : "Filter Eligible Only"}
                        </button>
                    </div>
                </div>

                {loadingAppeals ? (
                    <div className="empty"><p>Loading ban appeals from moderation service…</p></div>
                ) : appealsList.length === 0 ? (
                    /* Extension 1a: No appeals */
                    <div className="empty">
                        <h3>No open appeals</h3>
                        <p>All ban appeals have been processed or there are no open appeals assigned to your queue.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "24px", alignItems: "start" }}>
                        {/* Appeals Queue List */}
                        <div>
                            <div className="results-heading">
                                <h2>Queue <span>{appealsList.length}</span></h2>
                            </div>

                            {appealsList.map(appeal => (
                                <div
                                    key={appeal.id}
                                    className={`appeal-card ${selectedAppeal?.id === appeal.id ? "selected" : ""}`}
                                    onClick={() => { setSelectedAppeal(appeal); setAdminNotes(""); }}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="appeal-meta">
                                        <b>@{appeal.fanUsername}</b>
                                        <span className={`pill ${appeal.status === "OPEN" ? "" : appeal.status === "APPROVED" ? "notice" : "error"}`}>
                                            {appeal.status}
                                        </span>
                                    </div>
                                    <small style={{ display: "block", marginBottom: "8px" }}>
                                        Banned by: {appeal.banningAdminName || `Admin #${appeal.banningAdminId}`}
                                    </small>
                                    <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                        {appeal.reason}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Appeal Detail & Action Panel */}
                        {selectedAppeal ? (
                            <div className="panel">
                                <div className="section-title">
                                    <div>
                                        <span className="eyebrow">APPEAL CASE #{selectedAppeal.id}</span>
                                        <h2>Review Fan Appeal: @{selectedAppeal.fanUsername}</h2>
                                    </div>
                                    <span className="pill">{selectedAppeal.status}</span>
                                </div>

                                {/* Conflict of Interest Warning if same admin */}
                                {selectedAppeal.banningAdminId === currentUser.id && (
                                    <div className="conflict-warning">
                                        ⚠️ <b>Conflict of Interest Warning:</b> You were the administrator who issued this initial ban ({selectedAppeal.banningAdminName}). Under system rules, another administrator must review and process this appeal.
                                    </div>
                                )}

                                {/* Fan Reasoning (Main Flow Step 3) */}
                                <div style={{ marginTop: "16px" }}>
                                    <b style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Fan's Submitted Reason for Appeal:</b>
                                    <p style={{ background: "#f8faf5", padding: "14px", borderRadius: "8px", border: "1px solid #dce5dc", margin: "6px 0 16px", fontSize: "13px" }}>
                                        &ldquo;{selectedAppeal.reason}&rdquo;
                                    </p>
                                </div>

                                {/* Offending Content (Reported Post/Comment) */}
                                <div>
                                    <b style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Offending Content (Flagged Violation):</b>
                                    <div style={{ background: "#fffaf7", padding: "12px 14px", borderRadius: "8px", border: "1px dashed #e8c5ba", margin: "6px 0 16px", fontSize: "13px", color: "#8a3525", fontStyle: "italic" }}>
                                        &ldquo;{selectedAppeal.offendingContent || "some sentence breaking ToS"}&rdquo;
                                    </div>
                                </div>

                                {/* Report Material Evidence (Main Flow Step 3) */}
                                <div>
                                    <b style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Incident Report Material & Evidence:</b>
                                    <div style={{ background: "#fff5f2", padding: "12px 14px", borderRadius: "8px", border: "1px solid #f2dbd5", margin: "6px 0 16px", fontSize: "12px", fontFamily: "monospace", color: "#8a3525" }}>
                                        {selectedAppeal.reportMaterial}
                                    </div>
                                </div>

                                {/* Automated AI Recommendation (Main Flow Step 4) */}
                                <div className="ai-box">
                                    <h4><span>✳</span> Automated AI ToS Evaluation</h4>
                                    <p>{selectedAppeal.aiRecommendation}</p>
                                </div>

                                {/* Admin Review Notes & Actions */}
                                {selectedAppeal.status === "OPEN" && (
                                    <div style={{ marginTop: "20px", borderTop: "1px solid var(--line)", paddingTop: "18px" }}>
                                        <label>
                                            Review Notes (Optional)
                                            <textarea
                                                rows={3}
                                                value={adminNotes}
                                                onChange={e => setAdminNotes(e.target.value)}
                                                placeholder="Add internal notes on your moderation decision..."
                                            />
                                        </label>

                                        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                                            <button
                                                className="primary"
                                                disabled={selectedAppeal.banningAdminId === currentUser.id}
                                                onClick={() => handleUnbanFan(selectedAppeal.id)}
                                            >
                                                Unban Fan & Restore Login ↗
                                            </button>

                                            <button
                                                className="btn-danger"
                                                disabled={selectedAppeal.banningAdminId === currentUser.id}
                                                onClick={() => handleInvalidateAppeal(selectedAppeal.id)}
                                            >
                                                Mark Appeal Invalid & Uphold Ban ✕
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: VERIFICATIONS */}
        {/* ========================================================================= */}
        {tab === "Verifications" && currentUser.role === "Admin" && (
            <div className="panel">
                <div className="section-title">
                    <div>
                        <span className="eyebrow">MODERATOR QUEUE</span>
                        <h2>Artist Verifications</h2>
                        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "4px 0 0" }}>
                            Review portfolio links and approve or reject platform upgrades for fans.
                        </p>
                    </div>
                    <button className="btn-secondary" onClick={loadApplications}>
                        Refresh Queue ↻
                    </button>
                </div>

                {loadingApps ? (
                    <div className="empty"><p>Loading pending applications…</p></div>
                ) : applicationsList.length === 0 ? (
                    <div className="empty">
                        <h3>No pending applications</h3>
                        <p>The verification queue is fully cleared.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
                        {applicationsList.map(app => (
                            <div key={app.id} style={{ background: "#fcfaf7", border: "1px solid var(--line)", borderRadius: "12px", padding: "20px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                                    <div>
                                        <h3 style={{ margin: "0 0 4px" }}>{app.applicantName}</h3>
                                        <span className="pill">Proposed Genre: {app.proposedGenre}</span>
                                        <span className="pill" style={{ marginLeft: "8px", background: "#f5f5ea" }}>App ID: {app.id}</span>
                                    </div>
                                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                                        Submitted: {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "Unknown"}
                                    </span>
                                </div>

                                <div style={{ background: "white", border: "1px solid #e1eadc", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
                                    <b style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Portfolio & Identity Links:</b>
                                    <p style={{ fontSize: "13px", whiteSpace: "pre-line", margin: "8px 0 0", color: "#2c4538" }}>
                                        {app.portfolioLinks}
                                    </p>
                                </div>

                                <div style={{ display: "flex", gap: "12px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                                    <button 
                                        className="primary" 
                                        onClick={() => handleApproveApplication(app.id, app.applicantName)}
                                    >
                                        Approve & Provision Artist Profile ✓
                                    </button>
                                    <button 
                                        className="btn-secondary" 
                                        onClick={() => handleRejectApplication(app.id, app.applicantName)}
                                        style={{ color: "#9e3926", borderColor: "#eccdc6" }}
                                    >
                                        Reject Application ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: ARTIST DIRECTORY (USE CASE: SUSPEND ARTIST - ADMIN)                  */}
        {/* ========================================================================= */}
        {tab === "Artist Directory" && currentUser.role === "Admin" && (
            <div className="panel">
                <div className="section-title">
                    <div>
                        <span className="eyebrow">MODERATOR CONTROLS</span>
                        <h2>Platform Artists</h2>
                    </div>
                    <button className="btn-secondary" onClick={async () => {
                        const res = await fetch(`${API_BASE}/api/artists?includeSuspended=true`);
                        if (res.ok) setArtistResults(await res.json());
                    }}>
                        Refresh Directory ↻
                    </button>
                </div>

                <div className="artist-grid" style={{ marginTop: "20px" }}>
                    {artistResults.map((a, i) => (
                        <div className="artist-card" key={a.id} style={{ display: "flex", flexDirection: "column", opacity: a.suspended ? 0.6 : 1 }}>
                            <div className={`art-cover art-${i % 6}`}>
                                <span>{["◒", "〰", "◐", "✳", "◬", "◎"][i % 6]}</span>
                            </div>
                            <div className="artist-info" style={{ flex: 1 }}>
                                <h3>{a.name}</h3>
                                <p>{a.genre} · {a.location}</p>
                                {a.suspended && <span className="error pill" style={{ display: "inline-block", marginTop: "8px" }}>SUSPENDED</span>}
                            </div>
                            <div className="card-footer" style={{ borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                                <button 
                                    className="btn-danger full" 
                                    disabled={a.suspended}
                                    onClick={() => handleSuspendArtist(a.id)}
                                >
                                    {a.suspended ? "Account Suspended ✕" : "Suspend Artist ⚠"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {tab === "Discover" && currentUser.role === "Admin" && (
            <div className="panel" style={{ textAlign: "center", padding: "48px 20px" }}>
                <span className="pill" style={{ background: "#fbeee8", color: "#9c3b24" }}>ROLE ACCESS RESTRICTION</span>
                <h2 style={{ marginTop: "14px" }}>Admin Access Restricted</h2>
                <p style={{ color: "var(--muted)", maxWidth: "480px", margin: "8px auto 20px", fontSize: "13px" }}>
                    System Administrators are restricted from exploring community artists or social feeds to prevent bias and ensure platform impartiality.
                </p>
                <button className="primary" onClick={() => setTab("Ban Appeals")}>
                    Return to Ban Appeals Queue ↗
                </button>
            </div>
        )}
    </>
);
}