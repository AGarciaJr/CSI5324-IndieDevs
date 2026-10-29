import { useState } from "react";
import { Artist, UserPersona, LocalStore } from "../types/index";
import { API_BASE } from "../constants/index";

interface ArtistProfileModalProps {
    selectedArtist: Artist;
    currentUser: UserPersona;
    store: LocalStore;
    persistStore: (next: LocalStore) => void;
    onClose: () => void;
}

export default function ArtistProfileModal({ 
    selectedArtist, 
    currentUser, 
    store, 
    persistStore, 
    onClose 
}: ArtistProfileModalProps) {
    
    // Internal Modal State
    const [modalAction, setModalAction] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    // Helper function for the API call that was previously in page.tsx
    async function recordFanInteraction(artistId: number, type: string) {
        try {
            await fetch(`${API_BASE}/api/recommendations/interactions?fanId=${currentUser.id}&artistId=${artistId}&interactionType=${type}`, {
                method: "POST"
            });
            // Note: In a fully decoupled app, you'd trigger a context refresh here, 
            // but for now, the FanWorkspace will refetch on its next render cycle.
        } catch { /* ignore offline */ }
    }

    return (
        <dialog open aria-modal="true" aria-labelledby="profile-title" className="modal">
            <div className="modal-heading">
                <span className="eyebrow">ARTIST PROFILE</span>
                <button aria-label="Close artist profile" onClick={onClose}>×</button>
            </div>

            {notice && <div className="notice" style={{ margin: "10px 20px" }}>{notice}</div>}
            {error && <div className="error" style={{ margin: "10px 20px" }}>{error}</div>}

            <div className="profile-art">✳</div>
            <h2 id="profile-title">{selectedArtist.name}</h2>
            <p>{selectedArtist.genre} · {selectedArtist.location}</p>
            {selectedArtist.bio && <p style={{ fontSize: "13px", color: "#3e4d44" }}>{selectedArtist.bio}</p>}
            
            {selectedArtist.tags && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "10px 0" }}>
                    {selectedArtist.tags.split(",").map((t, idx) => (
                        <span key={idx} className="pill" style={{ fontSize: "9px" }}>#{t.trim()}</span>
                    ))}
                </div>
            )}

            <div className="profile-actions">
                <button
                    onClick={async () => {
                        const following = store.follows.includes(selectedArtist.id);
                        const nextFollows = following
                            ? store.follows.filter(id => id !== selectedArtist.id)
                            : [...store.follows, selectedArtist.id];
                        
                        persistStore({ ...store, follows: nextFollows });
                        
                        if (!following) {
                            await recordFanInteraction(selectedArtist.id, "FOLLOW");
                        }
                        setNotice(following ? "Artist unfollowed." : `Following ${selectedArtist.name}! Recommendations updated.`);
                    }}
                >
                    {store.follows.includes(selectedArtist.id) ? "Following ✓" : "Follow artist +"}
                </button>
                <button onClick={() => { setModalAction("chat"); setModalMessage(""); }}>Start chat</button>
                <button className="primary" onClick={() => { setModalAction("book"); setModalMessage(""); }}>Book artist ↗</button>

                {currentUser.role === "Fan" && (
                    <button 
                        className="primary" 
                        style={{ background: "#4a5b66", borderColor: "#4a5b66" }} 
                        onClick={() => { setModalAction("comment"); setModalMessage(""); }}
                    >
                        Comment on Artwork 💬
                    </button>
                )}
            </div>

            {modalAction && (
                <form
                    onSubmit={async e => {
                        e.preventDefault();
                        if (!modalMessage.trim()) return;
                        
                        if (modalAction === "chat") {
                            const nextChats = {
                                ...store.chats,
                                [selectedArtist.id]: [...(store.chats[selectedArtist.id] || []), modalMessage.trim()]
                            };
                            persistStore({ ...store, chats: nextChats });
                            setNotice("Message saved.");
                            
                        } else if (modalAction === "book") {
                            const nextBookings = [...store.bookings, { artistId: selectedArtist.id, details: modalMessage.trim() }];
                            persistStore({ ...store, bookings: nextBookings });
                            await recordFanInteraction(selectedArtist.id, "BOOKING");
                            setNotice("Booking request recorded!");
                            
                        } else if (modalAction === "comment") {
                            try {
                                const dummyPostId = 101;
                                const res = await fetch(`${API_BASE}/api/posts/${dummyPostId}/comments?fanId=${currentUser.id}&artistId=${selectedArtist.id}&genre=${encodeURIComponent(selectedArtist.genre)}`, {
                                    method: "POST",
                                    headers: { "Content-Type": "text/plain" },
                                    body: modalMessage.trim()
                                });
                                
                                if (!res.ok) throw new Error("Failed to post comment.");
                                
                                setNotice(`Comment posted on ${selectedArtist.name}'s artwork! Your taste profile affinity for ${selectedArtist.genre} has increased.`);
                            } catch (err: unknown) {
                                const msg = err instanceof Error ? err.message : String(err);
                                setError(`Could not post comment: ${msg}`);
                            }
                        }
                        setModalMessage("");
                        setModalAction("");
                    }}
                >
                    <h3>
                        {modalAction === "chat" ? "Your conversation" : 
                        modalAction === "book" ? "Booking request" : 
                        "Comment on featured artwork"}
                    </h3>
                    <label>
                        {modalAction === "chat" ? "Message" : 
                        modalAction === "book" ? "Event details, date, and contact information" : 
                        "Leave a comment on this artist's recent post"}
                        <textarea
                            required
                            value={modalMessage}
                            onChange={e => setModalMessage(e.target.value)}
                            rows={3}
                        />
                    </label>
                    <button className="primary">
                        {modalAction === "chat" ? "Send message" : 
                        modalAction === "book" ? "Submit booking request" : 
                        "Post comment ↗"}
                    </button>
                </form>
            )}
        </dialog>
    );
}