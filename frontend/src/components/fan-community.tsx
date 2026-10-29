"use client";
import Image from "next/image";
import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const ROOT = "/api/fan-community";
type Account = {
    accountId: number;
    role: string;
};
const AccountContext = createContext<Account>({ accountId: 1, role: "Fan" });
export function FanCommunityProvider({ accountId, role, children }: Account & {
    children: ReactNode;
}) {
    return <AccountContext.Provider value={{ accountId, role }}>{children}</AccountContext.Provider>;
}
type Follow = {
    artistId: number;
    name: string;
    genre: string;
    location: string;
    available: boolean;
    followerCount: number;
    following: boolean;
};
type Profile = {
    userId: number;
    version: number;
    displayName: string;
    biography: string;
    interests: string | null;
    image: string;
    publicProfile: boolean;
    showInterests: boolean;
    showFollowing: boolean;
    supportedArtists: Follow[] | null;
};
type Target = {
    type: "USER" | "POST" | "EVENT";
    id: number;
    title: string;
};
type Evidence = {
    evidenceId: string;
    targetType: Target["type"];
    targetId: number;
    snapshot: string;
};
type Report = {
    id: number;
    reporterId: number;
    targetType: string;
    targetId: number;
    reason: string;
    details: string;
    targetSnapshot: string;
    status: string;
    resolutionNotes?: string;
    action?: string;
};
class ApiError extends Error {
    constructor(message: string, public fields: Record<string, string> = {}) { super(message); }
}
async function request<T>(id: number, path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(API + path, { ...options, signal: options.signal || AbortSignal.timeout(10000), headers: { "Content-Type": "application/json", "X-User-Id": String(id), ...options.headers } });
    if (!response.ok) {
        const problem = await response.json().catch(() => ({}));
        throw new ApiError(problem.detail || `Request failed (${response.status}). Please try again.`, problem.errors);
    }
    return response.status === 204 ? undefined as T : response.json();
}
const changed = () => window.dispatchEvent(new Event("fan-community-changed"));
const errorText = (e: unknown) => e instanceof Error ? (e.name === "TypeError" || e.name === "TimeoutError" ? "Could not reach the backend. Your changes have not been saved. Please retry." : e.message) : "Please try again.";
function Feedback({ error, notice }: {
    error: string;
    notice?: string;
}) {
    return <>{error && <p className="error" role="alert">{error}</p>}{notice && <p className="notice" role="status">{notice}</p>}</>;
}
export function FollowButton({ artistId }: {
    artistId: number;
}) {
    const { accountId, role } = useContext(AccountContext);
    const [state, setState] = useState<Follow | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    useEffect(() => {
        if (role !== "Fan")
            return;
        const controller = new AbortController();
        const load = () => request<Follow>(accountId, `${ROOT}/artists/${artistId}/follow`, { signal: controller.signal })
            .then(value => { setState(value); setError(""); }).catch(e => { if (!controller.signal.aborted)
            setError(errorText(e)); });
        void load();
        window.addEventListener("fan-community-changed", load);
        return () => { controller.abort(); window.removeEventListener("fan-community-changed", load); };
    }, [accountId, artistId, role]);
    if (role !== "Fan")
        return null;
    async function toggle() {
        setBusy(true);
        setError("");
        setNotice("");
        try {
            if (state?.following) {
                await request(accountId, `${ROOT}/artists/${artistId}/follow`, { method: "DELETE" });
                setNotice("Artist unfollowed.");
            }
            else {
                const value = await request<Follow>(accountId, `${ROOT}/artists/${artistId}/follow`, { method: "PUT" });
                setState(value);
                setNotice("You are now following this artist.");
            }
            changed();
        }
        catch (e) {
            setError(errorText(e));
        }
        finally {
            setBusy(false);
        }
    }
    return <div className="community-follow"><button disabled={busy || (!state?.available && !state?.following && !!state)} onClick={toggle}>
        {busy ? "Saving…" : state?.following ? "Following ✓ · Unfollow" : state && !state.available ? "Artist unavailable" : "Follow artist +"}
    </button>{state && <small>{state.followerCount} {state.followerCount === 1 ? "follower" : "followers"}</small>}<Feedback error={error} notice={notice}/></div>;
}
export function FollowingPanel() {
    const { accountId } = useContext(AccountContext);
    const [items, setItems] = useState<Follow[] | null>(null);
    const [error, setError] = useState("");
    const load = useCallback(async () => {
        try {
            setItems(await request<Follow[]>(accountId, `${ROOT}/following`));
            setError("");
        }
        catch (e) {
            setError(errorText(e));
        }
    }, [accountId]);
    useEffect(() => { const timer = setTimeout(() => void load(), 0); window.addEventListener("fan-community-changed", load); return () => { clearTimeout(timer); window.removeEventListener("fan-community-changed", load); }; }, [load]);
    return <section className="community-section"><h2>Artists you support</h2><p>Your follows are saved to your account and feed your artist recommendations.</p><Feedback error={error}/><button onClick={load}>Refresh following</button>{items === null && !error && <p role="status">Loading following…</p>}{items?.length === 0 && <div className="panel">You aren’t following any artists yet. Find someone in Discover or For You.</div>}<div className="community-grid">{items?.map(a => <article className="panel" key={a.artistId}><h3>{a.name}</h3><p>{a.genre} · {a.location}</p>{!a.available && <p>This artist is currently unavailable.</p>}<FollowButton artistId={a.artistId}/></article>)}</div></section>;
}
export function FanProfilePanel() {
    const { accountId } = useContext(AccountContext);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [fields, setFields] = useState<Record<string, string>>({});
    const [directory, setDirectory] = useState<{ userId: number; displayName: string }[]>([]);
    const [viewerId, setViewerId] = useState("");
    const [viewed, setViewed] = useState<Profile | null>(null);
    const [viewError, setViewError] = useState("");
    const load = useCallback(async () => {
        try {
            setProfile(await request<Profile>(accountId, `${ROOT}/profile`));
            setDirectory(await request<{ userId: number; displayName: string }[]>(accountId, `${ROOT}/profiles`));
            setError("");
            setFields({});
        }
        catch (e) {
            setError(errorText(e));
        }
    }, [accountId]);
    useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
    async function save(e: FormEvent) {
        e.preventDefault();
        if (!profile)
            return;
        setBusy(true);
        setError("");
        setNotice("");
        setFields({});
        try {
            const saved = await request<Profile>(accountId, `${ROOT}/profile`, { method: "PUT", body: JSON.stringify(profile) });
            setProfile(saved);
            setDirectory(previous => previous.map(fan => fan.userId === saved.userId ? { ...fan, displayName: saved.displayName } : fan));
            setNotice("Your fan profile and privacy preferences have been saved.");
            changed();
        }
        catch (e) {
            setError(errorText(e));
            if (e instanceof ApiError)
                setFields(e.fields);
        }
        finally {
            setBusy(false);
        }
    }
    async function upload(file?: File) {
        if (!file || !profile)
            return;
        if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 512000) {
            setError("Choose a PNG or JPEG no larger than 500 KB.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
            setProfile(previous => previous ? { ...previous, image: data } : previous);
        }
        catch {
            setError("The image could not be read. Please choose it again.");
        }
        finally {
            setBusy(false);
        }
    }
    return <div className="community-grid"><section className="panel"><h2>Manage fan profile</h2><p>Share what you love. You control what other accounts can see.</p><Feedback error={error} notice={notice}/><button disabled={busy} onClick={load}>Reload saved profile</button>{!profile && !error && <p role="status">Loading profile…</p>}{profile && <form onSubmit={save} className="community-form">
        {([["displayName", "Display name", 80], ["biography", "Biography", 2000], ["interests", "Artistic interests", 300]] as const).map(([name, label, limit]) => <label key={name}>{label}{name === "biography" ? <textarea aria-label={label} rows={5} maxLength={limit} value={profile[name]} onChange={e => setProfile({ ...profile, [name]: e.target.value })} aria-invalid={!!fields[name]}/> : <input aria-label={label} required={name === "displayName"} maxLength={limit} value={profile[name] || ""} onChange={e => setProfile({ ...profile, [name]: e.target.value })} aria-invalid={!!fields[name]}/>}<small className="field-error">{fields[name]}</small></label>)}
        <p className="community-help">Profile text must not contain HTML, script links, or threats.</p>
        <label>Profile image<input type="file" accept="image/png,image/jpeg" disabled={busy} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }}/><small>PNG or JPEG · 500 KB maximum · up to 4096 × 4096 pixels</small></label>{profile.image && <div><Image className="fan-photo" src={profile.image} width={100} height={100} unoptimized alt="Your profile image"/><button type="button" onClick={() => setProfile({ ...profile, image: "" })}>Remove image</button></div>}<small className="field-error">{fields.image}</small>
        <fieldset><legend>Privacy preferences</legend>{([["publicProfile", "Make my profile visible to other signed-in accounts"], ["showInterests", "Show my artistic interests"], ["showFollowing", "Show the artists I support"]] as const).map(([name, label]) => <label className="community-check" key={name}><input type="checkbox" checked={profile[name]} onChange={e => setProfile({ ...profile, [name]: e.target.checked })}/>{label}</label>)}</fieldset>
        <h3>Supported artists</h3><p>{profile.supportedArtists?.map(a => a.name).join(", ") || "No followed artists yet."}</p><small>Manage this list in Following or from an artist’s profile.</small><button className="primary full" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
    </form>}</section><section><div className="panel"><h2>View a fan profile</h2><p>Look up another fan’s account ID. Their saved privacy settings apply on the server.</p><form className="community-form" onSubmit={async (e) => { e.preventDefault(); setViewError(""); setViewed(null); try {
        setViewed(await request<Profile>(accountId, `${ROOT}/profiles/${viewerId}`));
    }
    catch (e) {
        setViewError(errorText(e));
    } }}><label>Community member<select aria-label="Community member" required value={viewerId} onChange={e => setViewerId(e.target.value)}><option value="">Choose a fan</option>{directory.map(fan => <option key={fan.userId} value={fan.userId}>{fan.displayName}</option>)}</select></label><button>View profile</button></form><Feedback error={viewError}/>{viewed && <article><h3>{viewed.displayName}</h3>{viewed.image && <Image className="fan-photo" src={viewed.image} width={100} height={100} unoptimized alt={`${viewed.displayName}'s profile`}/>}<p className="post-text">{viewed.biography}</p>{viewed.interests !== null && <p>Artistic interests: {viewed.interests || "Not provided"}</p>}{viewed.supportedArtists !== null && <p>Supported artists: {viewed.supportedArtists.map(a => a.name).join(", ") || "None yet"}</p>}</article>}</div></section></div>;
}
function ReportForm({ evidence, onSubmitted }: {
    evidence: Evidence;
    onSubmitted: () => void;
}) {
    const { accountId } = useContext(AccountContext);
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    return <form className="community-form" onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            setNotice("");
            try {
                const report = await request<Report>(accountId, `${ROOT}/reports`, { method: "POST", body: JSON.stringify({ ...evidence, reason, details }) });
                setNotice(`Report #${report.id} submitted. Status: Pending. An administrator can now review it.`);
                setReason("");
                setDetails("");
                onSubmitted();
            }
            catch (e) {
                setError(errorText(e));
            }
            finally {
                setBusy(false);
            }
        }}><h3>Report {evidence.targetType.toLowerCase()} #{evidence.targetId}</h3><p className="community-evidence">{evidence.snapshot}</p><small>A server snapshot has been retained so your report can still be reviewed if the source is removed.</small><label>Reason<select aria-label="Reason" required value={reason} onChange={e => setReason(e.target.value)}><option value="">Choose a reason</option>{["Harassment or abuse", "Hateful content", "Spam or scam", "Impersonation", "Inappropriate content", "Other"].map(r => <option key={r}>{r}</option>)}</select></label><label>Additional details (optional)<textarea aria-label="Additional details (optional)" maxLength={2000} rows={4} value={details} onChange={e => setDetails(e.target.value)} placeholder="Explain what happened and give relevant context."/></label><Feedback error={error} notice={notice}/><button className="primary" disabled={busy || !reason.trim()}>{busy ? "Submitting…" : "Submit report"}</button></form>;
}
export function ReportArtistButton({ artistId }: {
    artistId: number;
}) {
    const { accountId, role } = useContext(AccountContext);
    const [evidence, setEvidence] = useState<Evidence | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    if (role !== "Fan")
        return null;
    return <div className="community-artist-report"><button disabled={busy} onClick={async () => { setBusy(true); setError(""); try {
        setEvidence(await request<Evidence>(accountId, `${ROOT}/artists/${artistId}/report-evidence`, { method: "POST" }));
    }
    catch (e) {
        setError(errorText(e));
    }
    finally {
        setBusy(false);
    } }}>{busy ? "Opening report…" : "Report artist account"}</button><Feedback error={error}/>{evidence && <div><button onClick={() => setEvidence(null)}>Cancel report</button><ReportForm evidence={evidence} onSubmitted={changed}/></div>}</div>;
}
export function FanReportsPanel() {
    const { accountId } = useContext(AccountContext);
    const [targets, setTargets] = useState<Target[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [selected, setSelected] = useState("");
    const [evidence, setEvidence] = useState<Evidence | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const load = useCallback(async () => { try {
        const [t, r] = await Promise.all([request<Target[]>(accountId, `${ROOT}/report-targets`), request<Report[]>(accountId, `${ROOT}/reports`)]);
        setTargets(t);
        setReports(r);
        setError("");
    }
    catch (e) {
        setError(errorText(e));
    } }, [accountId]);
    useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
    return <div className="community-grid"><section className="panel"><h2>Report inappropriate content</h2><p>Select a public post, published event, or visible account. Reports go directly to the administrator review queue.</p><Feedback error={error}/><button onClick={load}>Refresh available content</button><form className="community-form" onSubmit={async (e) => { e.preventDefault(); const target = targets.find(t => `${t.type}:${t.id}` === selected); if (!target)
        return; setBusy(true); setError(""); setEvidence(null); try {
        setEvidence(await request<Evidence>(accountId, `${ROOT}/report-evidence`, { method: "POST", body: JSON.stringify({ targetType: target.type, targetId: target.id }) }));
    }
    catch (e) {
        setError(errorText(e));
    }
    finally {
        setBusy(false);
    } }}><label>Content or account<select aria-label="Content or account" required value={selected} onChange={e => { setSelected(e.target.value); setEvidence(null); }}><option value="">Select content to report</option>{targets.map(t => <option key={`${t.type}:${t.id}`} value={`${t.type}:${t.id}`}>{t.type} #{t.id} · {t.title.slice(0, 120)}</option>)}</select></label><button disabled={busy || !selected}>{busy ? "Checking availability…" : "Continue to report"}</button></form>{evidence && <ReportForm key={evidence.evidenceId} evidence={evidence} onSubmitted={() => void load()}/>}</section><section className="panel"><h2>Your reports</h2>{reports.length === 0 && <p>No reports submitted yet.</p>}{reports.map(r => <article className="community-report" key={r.id}><span className="pill">{r.status}</span><h3>Report #{r.id} · {r.targetType} #{r.targetId}</h3><p>{r.reason}</p>{r.details && <p>{r.details}</p>}{r.status === "RESOLVED" && <p>Outcome: {r.action?.replaceAll("_", " ")}{r.resolutionNotes && ` · ${r.resolutionNotes}`}</p>}</article>)}</section></div>;
}
export function AdminReportsPanel() {
    const { accountId } = useContext(AccountContext);
    const [reports, setReports] = useState<Report[]>([]);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState<number | null>(null);
    const load = useCallback(async () => { try {
        setReports(await request<Report[]>(accountId, "/api/reports"));
        setError("");
    }
    catch (e) {
        setError(errorText(e));
    } }, [accountId]);
    useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
    return <section className="panel"><h2>Pending reports</h2><p>Review preserved content and the fan’s explanation before taking action.</p><Feedback error={error} notice={notice}/><button onClick={load}>Refresh queue</button>{reports.length === 0 && !error && <p>No pending reports.</p>}{reports.map(r => <article className="community-report" key={r.id}><h3>Report #{r.id} · {r.targetType} #{r.targetId}</h3><p>Reporter account #{r.reporterId} · {r.reason}</p>{r.targetSnapshot && <blockquote className="community-evidence">{r.targetSnapshot}</blockquote>}<p>{r.details}</p><form className="community-form" onSubmit={async (e) => { e.preventDefault(); const data = new FormData(e.currentTarget); setBusy(r.id); setError(""); setNotice(""); try {
        await request(accountId, `/api/reports/${r.id}/resolution`, { method: "POST", body: JSON.stringify({ action: data.get("action"), notes: data.get("notes") }) });
        setNotice(`Report #${r.id} resolved. The existing moderation service notified the affected accounts.`);
        await load();
    }
    catch (e) {
        setError(errorText(e));
    }
    finally {
        setBusy(null);
    } }}><label>Decision<select aria-label="Decision" name="action" required>{["DISMISS", "WARN_USER", ...(r.targetType === "USER" ? [] : ["REMOVE_CONTENT"]), "SUSPEND_USER", "BAN_USER"].map(a => <option key={a} value={a}>{a.replaceAll("_", " ")}</option>)}</select></label><label>Review notes<textarea aria-label="Review notes" name="notes" maxLength={2000} rows={2}/></label><button className="primary" disabled={busy !== null}>{busy === r.id ? "Resolving…" : "Resolve report"}</button></form></article>)}</section>;
}
