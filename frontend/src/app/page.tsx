"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
type Artist = {
    id: number;
    name: string;
    genre: string;
    location: string;
    profileThumbnail?: string;
};
type Post = {
    id: string;
    text: string;
    public: boolean;
    comments: boolean;
    files: {
        name: string;
        type: string;
        data: string;
    }[];
};
type EventDraft = {
    id: string;
    title: string;
    date: string;
    location: string;
    virtual: boolean;
    description: string;
    capacity: string;
    tiers: {
        name: string;
        price: string;
    }[];
    status: "Draft" | "Pending Approval";
};
type Store = {
    posts: Post[];
    events: EventDraft[];
    follows: number[];
    chats: Record<string, string[]>;
    bookings: {
        artistId: number;
        details: string;
    }[];
};
const initial: Store = { posts: [], events: [], follows: [], chats: {}, bookings: [] };
const sampleArtists: Artist[] = Array.from({ length: 24 }, (_, i) => ({ id: i + 1, name: ["Luna Rivera", "The Juniper Collective", "Miles Bennett", "Amara Studio", "Noah Ellis", "Sage & Sound"][i % 6] + (i > 5 ? ` ${Math.floor(i / 6) + 1}` : ""), genre: ["Indie folk", "Jazz", "Photography", "Visual art", "Alternative", "Electronic"][i % 6], location: ["Waco, TX", "Austin, TX", "Dallas, TX"][i % 3] }));
const emptyEvent = (): EventDraft => ({ id: "", title: "", date: "", location: "", virtual: false, description: "", capacity: "", tiers: [{ name: "General admission", price: "" }], status: "Draft" });
const key = "artistconnect-ui-v1";
export default function Home() {
    const [tab, setTab] = useState("Discover");
    const [store, setStore] = useState<Store>(initial);
    const [ready, setReady] = useState(false);
    const [notice, setNotice] = useState("");
    const [text, setText] = useState("");
    const [isPublic, setPublic] = useState(true);
    const [comments, setComments] = useState(true);
    const [files, setFiles] = useState<Post["files"]>([]);
    const [uploading, setUploading] = useState(false);
    const [criteria, setCriteria] = useState({ name: "", genre: "", location: "" });
    const [results, setResults] = useState<Artist[]>(sampleArtists);
    const [page, setPage] = useState(1);
    const [searched, setSearched] = useState(false);
    const [source, setSource] = useState("demo");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [artist, setArtist] = useState<Artist | null>(null);
    const [action, setAction] = useState("");
    const [message, setMessage] = useState("");
    const [event, setEvent] = useState<EventDraft>(emptyEvent);
    const [eventErrors, setEventErrors] = useState<Record<string, string>>({});
    useEffect(() => { const timer = setTimeout(() => { try {
        const saved = localStorage.getItem(key);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed.posts) && Array.isArray(parsed.events) && Array.isArray(parsed.follows) && parsed.chats && Array.isArray(parsed.bookings))
                setStore(parsed);
        }
    }
    catch {
        setNotice("Saved demo data could not be loaded.");
    } setReady(true); }, 0); return () => clearTimeout(timer); }, []);
    useEffect(() => { if (!artist)
        return; const previous = document.activeElement as HTMLElement | null; const dialog = document.querySelector('dialog'); const close = dialog?.querySelector('button'); close?.focus(); const handle = (e: KeyboardEvent) => { if (e.key === 'Escape')
        setArtist(null); if (e.key === 'Tab' && dialog) {
        const nodes = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), textarea, input, select, a[href]'));
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
        }
        else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
        }
    } }; document.addEventListener('keydown', handle); return () => { document.removeEventListener('keydown', handle); previous?.focus(); }; }, [artist]);
    function persist(next: Store) { try {
        localStorage.setItem(key, JSON.stringify(next));
        setStore(next);
        return true;
    }
    catch {
        setError("Could not save in this browser. Remove large attachments or free browser storage and try again.");
        return false;
    } }
    function navigate(next: string) { setTab(next); setError(""); setNotice(""); }
    async function search(e: FormEvent) { e.preventDefault(); setError(""); if (!Object.values(criteria).some(v => v.trim())) {
        setError("Enter a name, genre/style, or location to search.");
        return;
    } setBusy(true); try {
        let found: Artist[];
        if (source === "api") {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/artists/search?${new URLSearchParams(Object.entries(criteria).map(([k, v]) => [k, v.trim()]))}`, { signal: AbortSignal.timeout(8000) });
            if (!response.ok)
                throw Error();
            found = await response.json();
            if (!Array.isArray(found))
                throw Error();
        }
        else
            found = sampleArtists.filter(a => Object.entries(criteria).every(([k, v]) => String(a[k as keyof Artist]).toLowerCase().includes(v.trim().toLowerCase())));
        setResults(found);
        setPage(1);
        setSearched(true);
    }
    catch {
        setError("Artist search is unavailable. Check that the backend is running, then try again.");
        setResults([]);
    }
    finally {
        setBusy(false);
    } }
    async function attach(selected: FileList | null) { if (!selected)
        return; setError(""); const list = Array.from(selected); if (files.length + list.length > 5 || list.some(f => f.size > 2 * 1024 * 1024 || !(/^(image|audio|video)\//.test(f.type)))) {
        setError("Choose up to 5 image, audio, or video files, each no larger than 2 MB for this demo.");
        return;
    } setUploading(true); try {
        const data = await Promise.all(list.map(f => new Promise<Post["files"][number]>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ name: f.name, type: f.type, data: String(reader.result) }); reader.onerror = reject; reader.readAsDataURL(f); })));
        setFiles(prev => [...prev, ...data]);
    }
    catch {
        setError("An attachment could not be read. Please try again.");
    }
    finally {
        setUploading(false);
    } }
    function publish(e: FormEvent) { e.preventDefault(); setError(""); if (!text.trim() && !files.length) {
        setError("Add some text or a media file before publishing.");
        return;
    } if (persist({ ...store, posts: [{ id: crypto.randomUUID(), text: text.trim(), public: isPublic, comments, files }, ...store.posts] })) {
        setText("");
        setFiles([]);
        setNotice("Your post is saved to your demo profile.");
    } }
    function saveEvent(draft: boolean) { setError(""); const errors: Record<string, string> = {}; if (!event.title.trim())
        errors.title = "Enter an event title."; if (!draft) {
        if (!event.date || new Date(event.date).getTime() <= Date.now())
            errors.date = "Choose a future date and time.";
        if (!event.description.trim())
            errors.description = "Add an event description.";
        if (!event.location.trim())
            errors.location = "Enter a venue or virtual link.";
        else if (event.virtual) {
            try {
                if (!["http:", "https:"].includes(new URL(event.location).protocol))
                    throw Error();
            }
            catch {
                errors.location = "Enter a valid http or https link.";
            }
        }
        if (!Number.isInteger(Number(event.capacity)) || Number(event.capacity) < 1)
            errors.capacity = "Capacity must be a positive whole number.";
        if (event.tiers.some(t => !t.name.trim() || !t.price.trim() || !Number.isFinite(Number(t.price)) || Number(t.price) < 0 || !/^\d+(\.\d{1,2})?$/.test(t.price)))
            errors.tiers = "Give every tier a name and a valid price (0 for free, up to two decimals).";
    } setEventErrors(errors); if (Object.keys(errors).length)
        return; const saved = { ...event, id: event.id || crypto.randomUUID(), status: draft ? "Draft" as const : "Pending Approval" as const }; if (persist({ ...store, events: [saved, ...store.events.filter(x => x.id !== saved.id)] })) {
        setEvent(emptyEvent());
        setNotice(draft ? "Draft saved. You can continue editing below." : "Event saved as Pending Approval in this demo. Admin review and notifications require backend integration.");
    } }
    return <div className="app-shell"><aside><Link className="brand" href="/">a<span>ArtistConnect</span><i>●</i></Link><p className="nav-label">YOUR CREATIVE COMMUNITY</p><nav>{["Discover", "Make a post", "Create event"].map((item, i) => <button key={item} className={tab === item ? "active" : ""} onClick={() => navigate(item)}><span>{["⌕", "＋", "▦"][i]}</span>{item}</button>)}</nav><div className="sidebar-note"><span className="spark">✳</span><h3>Good art starts<br />with connection.</h3><p>Share your work. Find your people. Make something happen.</p></div><div className="account"><div className="avatar">WW</div><div><b>William Waweru</b><small>Artist · demo account</small></div></div></aside><div className="workspace"><header><span>Independent art. Shared experiences.</span><span className="status-dot">Community workspace</span></header><main><div className="eyebrow">A LITTLE CLOSER TO YOUR COMMUNITY</div><div className="page-heading"><div><h1>{tab === "Discover" ? "Find your next inspiration." : tab === "Make a post" ? "Let your work speak." : "Bring people together."}</h1><p>{tab === "Discover" ? "Discover independent artists and the communities growing around them." : tab === "Make a post" ? "A new track, a work in progress, a story worth sharing. Start here." : "Turn your next show, exhibition, or gathering into a shared experience."}</p></div><span className="pill">{tab === "Discover" ? "FOR THE CURIOUS" : "ARTIST STUDIO"}</span></div><div className="demo-note">UI preview · Posts, events, follows, chats, and booking requests are saved only in this browser. No real messages or notifications are sent.</div>{notice && <div className="notice" role="status">{notice}</div>}{error && <div className="error" role="alert">{error}</div>}
 {tab === "Discover" && <><section className="search-panel"><div className="section-title"><h2>Discover artists</h2><label className="source">Search in <select value={source} onChange={e => { setSource(e.target.value); setResults([]); setSearched(false); }}><option value="demo">Demo directory</option><option value="api">Live backend</option></select></label></div><form onSubmit={search} className="search-grid"><label>Artist name<input placeholder="Who are you looking for?" value={criteria.name} onChange={e => setCriteria({ ...criteria, name: e.target.value })}/></label><label>Genre / style<input placeholder="e.g. Jazz, visual art" value={criteria.genre} onChange={e => setCriteria({ ...criteria, genre: e.target.value })}/></label><label>Location<input placeholder="City or region" value={criteria.location} onChange={e => setCriteria({ ...criteria, location: e.target.value })}/></label><button className="primary" disabled={busy}>{busy ? "Searching…" : "Search artists ↗"}</button></form></section><div className="results-heading"><h2>{searched ? "Your discoveries" : "Meet the community"} <span>{results.length}</span></h2><span>{source === "demo" ? "Sample independent artists" : "Registered artists"}</span></div>{!results.length && !busy && <div className="empty"><h3>{searched ? "No artists found" : "Ready to explore?"}</h3><p>{searched ? "Try a broader name, genre, or location." : "Enter your criteria and search the live directory."}</p></div>}<div className="artist-grid">{results.slice((page - 1) * 20, page * 20).map((a, i) => <button className="artist-card" key={a.id} onClick={() => { setArtist(a); setAction(""); setMessage(""); }}><div className={`art-cover art-${i % 6}`}><span>{["◒", "〰", "◐", "✳", "◬", "◎"][i % 6]}</span><small>{a.genre}</small></div><div className="artist-info"><div className="avatar">{a.name.split(" ").map(s => s[0]).slice(0, 2).join("")}</div><h3>{a.name}</h3><p>{a.genre}</p><div className="card-footer"><span>⌖ {a.location}</span><b>View profile ↗</b></div></div></button>)}</div>{results.length > 20 && <div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>← Previous</button><span>Page {page} of {Math.ceil(results.length / 20)}</span><button disabled={page * 20 >= results.length} onClick={() => setPage(page + 1)}>Next →</button></div>}</>}
 {tab === "Make a post" && <div className="studio-grid"><section className="panel"><h2>Create a post</h2><div className="byline"><div className="avatar">WW</div><div><b>William Waweru</b><small>Sharing from your artist profile</small></div></div><form onSubmit={publish}><label>Your story<textarea rows={7} maxLength={5000} placeholder="What have you been creating?" value={text} onChange={e => setText(e.target.value)}/></label><small>{text.length} / 5,000 characters</small><label className="upload">＋ Add your media<input type="file" multiple accept="image/*,audio/*,video/*" disabled={uploading} onChange={e => { void attach(e.target.files); e.target.value = ""; }}/><small>Images, audio, or video · up to 5 files · 2 MB each</small></label>{files.map((f, i) => <div className="file-row" key={i}><span>{f.name}</span><button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}>Remove</button></div>)}<div className="setting"><div><b>Public post</b><p>Visible to everyone. Turn off for a private post.</p></div><input aria-label="Public post" type="checkbox" checked={isPublic} onChange={e => setPublic(e.target.checked)}/></div><div className="setting"><div><b>Allow comments</b><p>Make room for a conversation around your work.</p></div><input aria-label="Allow comments" type="checkbox" checked={comments} onChange={e => setComments(e.target.checked)}/></div><button className="primary full" disabled={!ready || uploading}>{uploading ? "Reading media…" : "Publish post ↗"}</button></form></section><section><h2 className="preview-heading">YOUR PROFILE · {store.posts.length} POSTS</h2><div className="panel preview"><span className="pill">LIVE PREVIEW</span><h3>William Waweru</h3><p className="post-text">{text || "Your next story starts here…"}</p><small>{isPublic ? "Public" : "Private"} · Comments {comments ? "on" : "off"}</small></div>{store.posts.map(p => <article key={p.id} className="panel saved-post"><small>William Waweru · {p.public ? "Public" : "Private"}</small><p className="post-text">{p.text}</p>{p.files.map((f, i) => <div key={i}>{f.type.startsWith("image/") ? <Image src={f.data} alt={f.name} width={600} height={400} unoptimized style={{ width: "auto", height: "auto" }}/> : f.type.startsWith("audio/") ? <audio controls src={f.data}/> : <video controls src={f.data}/>}<small>{f.name}</small></div>)}<small>Comments {p.comments ? "enabled" : "disabled"}</small></article>)}</section></div>}
 {tab === "Create event" && <div className="studio-grid"><section className="panel"><div className="section-title"><h2>{event.id ? "Edit draft" : "Create an event"}</h2><span className="pill">{event.status}</span></div><form onSubmit={e => { e.preventDefault(); saveEvent(false); }} noValidate>{([['title', 'Event title', 'Give your gathering a name'], ['date', 'Date & time', ''], ['location', event.virtual ? 'Virtual event link' : 'Venue / location', event.virtual ? 'https://…' : 'Venue name and address'], ['capacity', 'Capacity', 'Number of attendees']] as const).map(([field, label, placeholder]) => <label key={field}>{label}<input type={field === "date" ? "datetime-local" : field === "capacity" ? "number" : "text"} min={field === "capacity" ? 1 : undefined} value={event[field]} placeholder={placeholder} aria-invalid={!!eventErrors[field]} aria-describedby={eventErrors[field] ? `${field}-error` : undefined} onChange={e => setEvent({ ...event, [field]: e.target.value })}/>{eventErrors[field] && <small className="field-error" id={`${field}-error`}>{eventErrors[field]}</small>}</label>)}<label className="check-label"><input type="checkbox" checked={event.virtual} onChange={e => setEvent({ ...event, virtual: e.target.checked, location: "" })}/> This is a virtual event</label><label>Description<textarea rows={4} value={event.description} placeholder="Tell your community what to expect." onChange={e => setEvent({ ...event, description: e.target.value })}/>{eventErrors.description && <small className="field-error">{eventErrors.description}</small>}</label><div className="section-title"><h3>Ticket tiers</h3><button type="button" onClick={() => setEvent({ ...event, tiers: [...event.tiers, { name: "", price: "" }] })}>＋ Add tier</button></div>{event.tiers.map((t, i) => <div className="tier" key={i}><label>Tier name<input aria-label={`Tier ${i + 1} name`} value={t.name} onChange={e => setEvent({ ...event, tiers: event.tiers.map((v, j) => j === i ? { ...v, name: e.target.value } : v) })}/></label><label>Price (USD)<input aria-label={`Tier ${i + 1} price`} type="number" min="0" step="0.01" value={t.price} onChange={e => setEvent({ ...event, tiers: event.tiers.map((v, j) => j === i ? { ...v, price: e.target.value } : v) })}/></label><button type="button" aria-label={`Remove tier ${i + 1}`} disabled={event.tiers.length === 1} onClick={() => setEvent({ ...event, tiers: event.tiers.filter((_, j) => j !== i) })}>×</button></div>)}{eventErrors.tiers && <p className="field-error" role="alert">{eventErrors.tiers}</p>}<div className="form-actions"><button type="button" disabled={!ready} onClick={() => saveEvent(true)}>Save draft</button><button className="primary" disabled={!ready}>Submit for review ↗</button></div></form></section><section><div className="event-guide"><span>✳</span><h2>Set the stage.<br />We’ll help fill the room.</h2><p>Submitted events require admin approval of ticket pricing before publication.</p><ol><li>Create your event and ticket tiers</li><li>Submit pricing for review</li><li>Publish after admin approval</li></ol><small>Approval, rejection, email, and follower notifications are not connected in this UI preview.</small></div><h2 className="preview-heading">YOUR EVENTS</h2>{!store.events.length && <div className="panel"><p>Your drafts and submitted events will appear here.</p></div>}{store.events.map(ev => <article className="panel saved-post" key={ev.id}><span className="pill">{ev.status}</span><h3>{ev.title}</h3><p>{ev.date ? new Date(ev.date).toLocaleString() : "Date to be decided"}</p><small>{ev.location || "Location to be decided"}</small>{ev.status === "Draft" && <button onClick={() => { setEvent(ev); setEventErrors({}); setNotice(""); }}>Continue editing ↗</button>}</article>)}</section></div>}
 </main><footer><b>ArtistConnect</b><span>A home for independent expression.</span><span>Made for artists. Built around community.</span></footer></div>
 {artist && <dialog open aria-modal="true" aria-labelledby="profile-title" className="modal"><div className="modal-heading"><span className="eyebrow">ARTIST PROFILE</span><button aria-label="Close artist profile" onClick={() => setArtist(null)}>×</button></div><div className="profile-art">✳</div><h2 id="profile-title">{artist.name}</h2><p>{artist.genre} · {artist.location}</p><p>Discover {artist.name}&apos;s creative world and connect directly.</p><div className="profile-actions"><button onClick={() => { const following = store.follows.includes(artist.id); if (persist({ ...store, follows: following ? store.follows.filter(id => id !== artist.id) : [...store.follows, artist.id] }))
        setNotice(following ? "Artist unfollowed in this demo." : "Artist followed in this demo."); }}>{store.follows.includes(artist.id) ? "Following ✓" : "Follow artist +"}</button><button onClick={() => { setAction("chat"); setMessage(""); }}>Start chat</button><button className="primary" onClick={() => { setAction("book"); setMessage(""); }}>Book artist ↗</button></div>{action && <form onSubmit={e => { e.preventDefault(); if (!message.trim())
        return; const next = action === "chat" ? { ...store, chats: { ...store.chats, [artist.id]: [...(store.chats[artist.id] || []), message.trim()] } } : { ...store, bookings: [...store.bookings, { artistId: artist.id, details: message.trim() }] }; if (persist(next)) {
        setMessage("");
        setNotice(action === "chat" ? "Message saved to this demo conversation." : "Booking request saved locally. It has not been sent to the artist.");
    } }}><h3>{action === "chat" ? "Your conversation" : "Booking request"}</h3>{action === "chat" && (store.chats[artist.id] || []).map((m, i) => <p className="chat-message" key={i}>{m}</p>)}<label>{action === "chat" ? "Message" : "Event details, date, and contact information"}<textarea required value={message} onChange={e => setMessage(e.target.value)} rows={3}/></label><button className="primary">{action === "chat" ? "Save demo message" : "Save demo booking request"}</button></form>}{notice && <p role="status" className="notice">{notice}</p>}{error && <p role="alert" className="error">{error}</p>}</dialog>}
 </div>;
}
