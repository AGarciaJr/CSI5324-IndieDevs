import { useState, useEffect, type FormEvent } from "react";
import {UserPersona, EventItem, Post, PostFile, PostWrapper, LocalStore} from "../../types/index";
import { API_BASE, emptyEventForm } from "../../constants/index";

export default function ArtistWorkspace({ currentUser, tab, store, persistStore }: any) {
    // 1. ARTIST DOMAIN STATE
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    // Make a Post State
    const [postText, setPostText] = useState("");
    const [isPublic, setPublic] = useState(true);
    const [commentsAllowed, setCommentsAllowed] = useState(true);

    // Manage Events State
    const [eventsList, setEventsList] = useState<EventItem[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [eventSubTab, setEventSubTab] = useState<"list" | "edit" | "create">("list");
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [eventForm, setEventForm] = useState<Partial<EventItem>>(emptyEventForm());
    const [eventFormErrors, setEventFormErrors] = useState<Record<string, string>>({});
    const [showReviewStep, setShowReviewStep] = useState(false);
    

    // 2. ARTIST LIFECYCLE
    useEffect(() => {
        if (tab === "Manage Events") loadEvents();
    }, [tab]);

    // 3. ARTIST DOMAIN METHODS
    async function loadEvents() {
        setLoadingEvents(true);
        try {
            const res = await fetch(`${API_BASE}/api/events`);
            if (!res.ok) throw new Error("Failed to load events");
            const data: EventItem[] = await res.json();
            setEventsList(data);
        } catch {
            // Fallback
            setEventsList([
                {
                    id: 1,
                    artistId: 9,
                    eventType: "Concert",
                    title: "Waco Acoustic Night",
                    description: "An intimate evening of acoustic songs and storytelling at Common Grounds in Waco.",
                    eventDate: "2026-11-15T19:30:00",
                    location: "Common Grounds, Waco, TX",
                    virtual: false,
                    capacity: 120,
                    status: "Published",
                    reviewedAcknowledgment: true
                },
                {
                    id: 2,
                    artistId: 9,
                    eventType: "Workshop",
                    title: "Songwriting from the Heart",
                    description: "Hands-on interactive lyric writing and song arrangement workshop for local independent artists.",
                    eventDate: "2026-12-05T14:00:00",
                    location: "Downtown Cultural Arts Center, Waco, TX",
                    virtual: false,
                    capacity: 35,
                    status: "Draft",
                    reviewedAcknowledgment: true
                }
            ]);
        } finally {
            setLoadingEvents(false);
        }
    }

    async function handlePublishPost(e: FormEvent) {
        e.preventDefault();
        if (!postText.trim()) {
            setError("Please write some text before publishing.");
            return;
        }
        const newPost: Post = {
            tempId: crypto.randomUUID(),
            posterId: currentUser.id,
            postText: postText.trim(),
            isPublic: isPublic,
            commentsAllowed: commentsAllowed,
        };
        persistStore({ ...store, posts: [newPost, ...store.posts] });
        setPostText("");
        setNotice("Your post has been published to your profile!");

        const newPostWrapper: PostWrapper = {
            post: newPost,
            files: [],
        }

        const response = await fetch(
            "http://localhost:8080/api/posts",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newPostWrapper),
            }
        )
    }

    function startEditEvent(ev: EventItem) {
        setEditingEventId(ev.id);
        setEventForm({
            ...ev,
            // Format datetime-local if necessary
            eventDate: ev.eventDate ? ev.eventDate.substring(0, 16) : "",
            reviewedAcknowledgment: false // Reset acknowledgment so artist reviews updated details!
        });
        setEventFormErrors({});
        setShowReviewStep(false);
        setEventSubTab("edit");
        setNotice("");
        setError("");
    }

    function startCreateEvent() {
        setEditingEventId(null);
        setEventForm({
            ...emptyEventForm(),
            artistId: currentUser.id === 9 ? 9 : 1
        });
        setEventFormErrors({});
        setShowReviewStep(false);
        setEventSubTab("create");
        setNotice("");
        setError("");
    }

    function validateEventForm(): boolean {
        const errors: Record<string, string> = {};
        if (!eventForm.title || !eventForm.title.trim()) {
            errors.title = "Event title cannot be empty.";
        }
        if (!eventForm.eventType || !eventForm.eventType.trim()) {
            errors.eventType = "Event type cannot be empty.";
        }
        if (!eventForm.description || !eventForm.description.trim()) {
            errors.description = "Event description cannot be empty.";
        }
        if (!eventForm.eventDate) {
            errors.eventDate = "Choose an event date and time.";
        }
        if (!eventForm.location || !eventForm.location.trim()) {
            errors.location = eventForm.virtual ? "Provide a virtual streaming URL." : "Provide a venue location.";
        }
        if (!eventForm.capacity || Number(eventForm.capacity) < 1) {
            errors.capacity = "Capacity must be at least 1 attendee.";
        }
        setEventFormErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function submitUpdateEvent() {
        setError("");
        setNotice("");

        // Extension 6a: Check acknowledgment
        if (!eventForm.reviewedAcknowledgment) {
            setError("Error: Artist must acknowledge they have reviewed the details of their submission before submitting (Extension 6a).");
            return;
        }

        try {
            const payload = {
                artistId: eventForm.artistId || currentUser.id,
                eventType: eventForm.eventType,
                title: eventForm.title,
                description: eventForm.description,
                eventDate: eventForm.eventDate ? new Date(eventForm.eventDate).toISOString() : new Date().toISOString(),
                location: eventForm.location,
                virtual: !!eventForm.virtual,
                capacity: Number(eventForm.capacity),
                imageUrl: eventForm.imageUrl || "",
                status: eventForm.status || "Published",
                reviewedAcknowledgment: true
            };

            const res = await fetch(`${API_BASE}/api/events/${editingEventId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to update event on backend.");
            }

            const updated = await res.json();
            setNotice(`Success! Event "${updated.title}" has been updated and is live on your profile.`);
            setEventSubTab("list");
            loadEvents();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Failed to update event: ${msg}`);
        }
    }

    async function submitCreateEvent() {
        setError("");
        setNotice("");

        if (!validateEventForm()) {
            setError("Please correct the errors before submitting.");
            return;
        }

        try {
            const payload = {
                artistId: currentUser.id === 9 ? 9 : 1,
                eventType: eventForm.eventType,
                title: eventForm.title,
                description: eventForm.description,
                eventDate: eventForm.eventDate ? new Date(eventForm.eventDate).toISOString() : new Date().toISOString(),
                location: eventForm.location,
                virtual: !!eventForm.virtual,
                capacity: Number(eventForm.capacity),
                imageUrl: eventForm.imageUrl || "",
                status: eventForm.status || "Published",
                reviewedAcknowledgment: true
            };

            const res = await fetch(`${API_BASE}/api/events`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error("Failed to create event on backend.");
            }

            const created = await res.json();
            setNotice(`Event "${created.title}" successfully created and saved to database!`);
            setEventSubTab("list");
            loadEvents();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Failed to create event: ${msg}`);
        }
    }

    function handleReviewStep() {
        setError("");
        if (!validateEventForm()) {
            setError("Please fill out all required event fields before proceeding to review.");
            return;
        }
        setShowReviewStep(true);
    }

    return (
        <>
            {/* ========================================================================= */}
            {/* TAB: MAKE A POST                                                          */}
            {/* ========================================================================= */}
            {tab === "Make a post" && (
                <div className="studio-grid">
                    <section className="panel">
                        <h2>Create a post</h2>
                        <div className="byline">
                            <div className="avatar">{currentUser.avatar}</div>
                            <div>
                                <b>{currentUser.name}</b>
                                <small>Sharing from your {currentUser.role.toLowerCase()} profile</small>
                            </div>
                        </div>

                        <form onSubmit={handlePublishPost}>
                            <label>
                                Your story
                                <textarea
                                    rows={7}
                                    maxLength={5000}
                                    placeholder="What have you been creating?"
                                    value={postText}
                                    onChange={e => setPostText(e.target.value)}
                                />
                            </label>
                            <small>{postText.length} / 5,000 characters</small>

                            <div className="setting" style={{ marginTop: "16px" }}>
                                <div>
                                    <b>Public post</b>
                                    <p>Visible to everyone. Turn off for a private post.</p>
                                </div>
                                <input
                                    aria-label="Public post"
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={e => setPublic(e.target.checked)}
                                />
                            </div>

                            <div className="setting">
                                <div>
                                    <b>Allow comments</b>
                                    <p>Make room for a conversation around your work.</p>
                                </div>
                                <input
                                    aria-label="Allow comments"
                                    type="checkbox"
                                    checked={commentsAllowed}
                                    onChange={e => setCommentsAllowed(e.target.checked)}
                                />
                            </div>

                            <button className="primary full">Publish post ↗</button>
                        </form>
                    </section>

                    <section>
                        <h2 className="preview-heading">YOUR POSTS · {store.posts.length}</h2>
                        {store.posts.length === 0 ? (
                            <div className="panel"><p>Your published posts will appear here.</p></div>
                        ) : (
                            store.posts.map((p: Post) => (
                                <article key={p.tempId} className="panel saved-post">
                                    <small>{currentUser.name} · {p.isPublic ? "Public" : "Private"}</small>
                                    <p className="post-text">{p.postText}</p>
                                </article>
                            ))
                        )}
                    </section>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB: MANAGE EVENTS (USE CASE: UPDATE EVENT - ARTIST)                      */}
            {/* ========================================================================= */}
            {tab === "Manage Events" && (
                <div>
                    {/* Sub-navigation */}
                    <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                        <button
                            className={eventSubTab === "list" ? "primary" : "btn-secondary"}
                            onClick={() => { setEventSubTab("list"); setShowReviewStep(false); }}
                        >
                            My Events Directory ({eventsList.length})
                        </button>
                        <button
                            className={eventSubTab === "create" ? "primary" : "btn-secondary"}
                            onClick={startCreateEvent}
                        >
                            ＋ Create New Event
                        </button>
                    </div>

                    {/* View 1: Events List */}
                    {eventSubTab === "list" && (
                        <div>
                            {loadingEvents ? (
                                <div className="empty"><p>Loading events from database…</p></div>
                            ) : eventsList.length === 0 ? (
                                <div className="empty">
                                    <h3>No events created yet</h3>
                                    <p>Create your first event to announce shows and exhibitions to your fanbase.</p>
                                    <button className="primary" onClick={startCreateEvent}>Create an Event ↗</button>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
                                    {eventsList.map(ev => (
                                        <article key={ev.id} className="panel" style={{ display: "flex", flexDirection: "column" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                                <span className="pill">{ev.eventType || "Event"}</span>
                                                <span className="pill" style={{ background: ev.status === "Published" ? "#e7f2e4" : "#f5f5ea", color: ev.status === "Published" ? "#2b614c" : "#757f6b" }}>
                                                    {ev.status}
                                                </span>
                                            </div>

                                            <h2 style={{ fontSize: "20px", marginBottom: "6px" }}>{ev.title}</h2>
                                            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 10px", flex: 1 }}>
                                                {ev.description}
                                            </p>

                                            <div style={{ fontSize: "12px", borderTop: "1px solid var(--line)", paddingTop: "12px", marginBottom: "16px" }}>
                                                <div><b>Date:</b> {ev.eventDate ? new Date(ev.eventDate).toLocaleString() : "TBD"}</div>
                                                <div><b>Venue:</b> {ev.location} {ev.virtual && "(Virtual)"}</div>
                                                <div><b>Capacity:</b> {ev.capacity} attendees</div>
                                            </div>

                                            <button
                                                className="primary full"
                                                onClick={() => startEditEvent(ev)}
                                            >
                                                Edit / Update Event ↗
                                            </button>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* View 2: Edit / Update Event (Use Case Implementation) */}
                    {eventSubTab === "edit" && (
                        <div className="panel" style={{ maxWidth: "780px" }}>
                            <div className="section-title">
                                <div>
                                    <span className="eyebrow">STEP 1 & 2: MODIFY EVENT INFORMATION</span>
                                    <h2>Edit Event: {eventForm.title || "Existing Event"}</h2>
                                </div>
                                <button className="btn-secondary" onClick={() => setEventSubTab("list")}>Cancel</button>
                            </div>

                            {!showReviewStep ? (
                                <form onSubmit={e => { e.preventDefault(); handleReviewStep(); }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                                        <label>
                                            Event Title
                                            <input
                                                type="text"
                                                value={eventForm.title || ""}
                                                onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                                placeholder="e.g. Austin Folk & Canvas"
                                            />
                                            {eventFormErrors.title && <small className="field-error">{eventFormErrors.title}</small>}
                                        </label>

                                        <label>
                                            Event Type
                                            <select
                                                value={eventForm.eventType || "Concert"}
                                                onChange={e => setEventForm({ ...eventForm, eventType: e.target.value })}
                                            >
                                                <option value="Concert">Concert</option>
                                                <option value="Workshop">Workshop</option>
                                                <option value="Exhibition">Exhibition</option>
                                                <option value="Showcase">Showcase</option>
                                                <option value="Tour Date">Tour Date</option>
                                            </select>
                                            {eventFormErrors.eventType && <small className="field-error">{eventFormErrors.eventType}</small>}
                                        </label>

                                        <label>
                                            Date & Time
                                            <input
                                                type="datetime-local"
                                                value={eventForm.eventDate || ""}
                                                onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })}
                                            />
                                            {eventFormErrors.eventDate && <small className="field-error">{eventFormErrors.eventDate}</small>}
                                        </label>

                                        <label>
                                            Capacity (Attendees)
                                            <input
                                                type="number"
                                                min={1}
                                                value={eventForm.capacity || ""}
                                                onChange={e => setEventForm({ ...eventForm, capacity: e.target.value })}
                                            />
                                            {eventFormErrors.capacity && <small className="field-error">{eventFormErrors.capacity}</small>}
                                        </label>
                                    </div>

                                    <label style={{ marginTop: "14px" }}>
                                        Location or Venue
                                        <input
                                            type="text"
                                            value={eventForm.location || ""}
                                            onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                                            placeholder="Venue name & address, or stream link"
                                        />
                                        {eventFormErrors.location && <small className="field-error">{eventFormErrors.location}</small>}
                                    </label>

                                    <label className="check-label" style={{ margin: "12px 0" }}>
                                        <input
                                            type="checkbox"
                                            checked={!!eventForm.virtual}
                                            onChange={e => setEventForm({ ...eventForm, virtual: e.target.checked })}
                                        />
                                        This is a virtual / livestreamed event
                                    </label>

                                    <label>
                                        Description & Program
                                        <textarea
                                            rows={4}
                                            value={eventForm.description || ""}
                                            onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                                            placeholder="Tell fans what to expect, band lineups, and schedule..."
                                        />
                                        {eventFormErrors.description && <small className="field-error">{eventFormErrors.description}</small>}
                                    </label>

                                    <label style={{ marginTop: "12px" }}>
                                        Promotional Image / Flyer URL
                                        <input
                                            type="text"
                                            value={eventForm.imageUrl || ""}
                                            onChange={e => setEventForm({ ...eventForm, imageUrl: e.target.value })}
                                            placeholder="https://example.com/flyer.jpg"
                                        />
                                    </label>

                                    <div className="form-actions">
                                        <button type="button" className="btn-secondary" onClick={() => setEventSubTab("list")}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="primary">
                                            Proceed to Review Details ↗
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                /* Step 5 & 6: Review & Acknowledge Updated Details */
                                <div className="review-box">
                                    <span className="eyebrow">STEP 5 & 6: REVIEW UPDATED EVENT DETAILS</span>
                                    <h3>Review & Confirmation</h3>
                                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                                        Please review the updated details before saving changes to your public artist profile.
                                    </p>

                                    <div className="review-grid">
                                        <div><b>Title:</b> {eventForm.title}</div>
                                        <div><b>Type:</b> {eventForm.eventType}</div>
                                        <div><b>Date:</b> {eventForm.eventDate}</div>
                                        <div><b>Location:</b> {eventForm.location} {eventForm.virtual && "(Virtual)"}</div>
                                        <div><b>Capacity:</b> {eventForm.capacity}</div>
                                        <div><b>Status:</b> {eventForm.status}</div>
                                    </div>

                                    <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid #dbe2d4", marginBottom: "16px" }}>
                                        <b style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase" }}>Updated Description:</b>
                                        <p style={{ fontSize: "13px", margin: "4px 0 0" }}>{eventForm.description}</p>
                                    </div>

                                    {/* Mandatory Acknowledgment Checkbox (Extension 6a) */}
                                    <label className="ack-label">
                                        <input
                                            type="checkbox"
                                            checked={!!eventForm.reviewedAcknowledgment}
                                            onChange={e => setEventForm({ ...eventForm, reviewedAcknowledgment: e.target.checked })}
                                        />
                                        <span>
                                            I acknowledge that I have reviewed the details of my submission before submitting (Required).
                                        </span>
                                    </label>

                                    <div className="form-actions" style={{ marginTop: "20px" }}>
                                        <button type="button" className="btn-secondary" onClick={() => setShowReviewStep(false)}>
                                            ← Back to Editing
                                        </button>
                                        <button
                                            type="button"
                                            className="primary"
                                            onClick={submitUpdateEvent}
                                        >
                                            Confirm & Submit Update ↗
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* View 3: Create Event Form */}
                    {eventSubTab === "create" && (
                        <div className="panel" style={{ maxWidth: "780px" }}>
                            <div className="section-title">
                                <div>
                                    <span className="eyebrow">NEW EVENT</span>
                                    <h2>Create an Event</h2>
                                </div>
                                <button className="btn-secondary" onClick={() => setEventSubTab("list")}>Cancel</button>
                            </div>

                            <form onSubmit={e => { e.preventDefault(); submitCreateEvent(); }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                                    <label>
                                        Event Title
                                        <input
                                            type="text"
                                            value={eventForm.title || ""}
                                            onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                            placeholder="e.g. Austin Folk & Canvas"
                                        />
                                        {eventFormErrors.title && <small className="field-error">{eventFormErrors.title}</small>}
                                    </label>

                                    <label>
                                        Event Type
                                        <select
                                            value={eventForm.eventType || "Concert"}
                                            onChange={e => setEventForm({ ...eventForm, eventType: e.target.value })}
                                        >
                                            <option value="Concert">Concert</option>
                                            <option value="Workshop">Workshop</option>
                                            <option value="Exhibition">Exhibition</option>
                                            <option value="Showcase">Showcase</option>
                                            <option value="Tour Date">Tour Date</option>
                                        </select>
                                    </label>

                                    <label>
                                        Date & Time
                                        <input
                                            type="datetime-local"
                                            value={eventForm.eventDate || ""}
                                            onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })}
                                        />
                                        {eventFormErrors.eventDate && <small className="field-error">{eventFormErrors.eventDate}</small>}
                                    </label>

                                    <label>
                                        Capacity (Attendees)
                                        <input
                                            type="number"
                                            min={1}
                                            value={eventForm.capacity || ""}
                                            onChange={e => setEventForm({ ...eventForm, capacity: e.target.value })}
                                        />
                                    </label>
                                </div>

                                <label style={{ marginTop: "14px" }}>
                                    Location or Venue
                                    <input
                                        type="text"
                                        value={eventForm.location || ""}
                                        onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                                        placeholder="Venue name and city"
                                    />
                                    {eventFormErrors.location && <small className="field-error">{eventFormErrors.location}</small>}
                                </label>

                                <label>
                                    Description
                                    <textarea
                                        rows={4}
                                        value={eventForm.description || ""}
                                        onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                                        placeholder="Describe your event..."
                                    />
                                    {eventFormErrors.description && <small className="field-error">{eventFormErrors.description}</small>}
                                </label>

                                <div className="form-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setEventSubTab("list")}>Cancel</button>
                                    <button type="submit" className="primary">Create Event in Database ↗</button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}