import Link from "next/link";
import { useState } from "react";
import { UserPersona } from "../types";
import { PERSONAS } from "../constants";

interface SidebarProps {
    currentUser: UserPersona;
    setCurrentUser: (p: UserPersona) => void;
    tab: string;
    setTab: (t: string) => void;
}

export default function Sidebar({ currentUser, setCurrentUser, tab, setTab }: SidebarProps) {
    const [showAccountMenu, setShowAccountMenu] = useState(false);

    const navItems = currentUser.role === "Fan"
        ? [{ label: "For You", icon: "✳", tabName: "Recommendations" }, { label: "Discover", icon: "⌕", tabName: "Discover" }]
        : currentUser.role === "Artist"
            ? [{ label: "Discover", icon: "⌕", tabName: "Discover" }, { label: "Make a post", icon: "＋", tabName: "Make a post" }, { label: "Manage Events", icon: "▦", tabName: "Manage Events" }]
            : [{ label: "Ban Appeals", icon: "⚖", tabName: "Ban Appeals" }, { label: "Artist Directory", icon: "🛡️", tabName: "Artist Directory" }, { label: "Verifications", icon: "✓", tabName: "Verifications" }];

    return (
        <aside>
            <Link className="brand" href="/">a<span>ArtistConnect</span><i>●</i></Link>
            <p className="nav-label">{currentUser.role.toUpperCase()} WORKSPACE</p>

            <nav>
                {navItems.map(item => (
                    <button
                        key={item.tabName}
                        className={tab === item.tabName ? "active" : ""}
                        onClick={() => setTab(item.tabName)}
                    >
                        <span>{item.icon}</span>{item.label}
                    </button>
                ))}
            </nav>

            <div className="sidebar-note">
                <span className="spark">✳</span>
                <h3>Good art starts<br />with connection.</h3>
                <p>Designed for independent artists, fans, and administrators.</p>
            </div>

            <div style={{ position: "relative" }}>
                {showAccountMenu && (
                    <div className="account-menu">
                        <small style={{ fontWeight: 700, padding: "4px 8px", color: "var(--muted)" }}>SWITCH USER PERSONA</small>
                        {PERSONAS.map(p => (
                            <button
                                key={p.id}
                                className={`account-menu-item ${currentUser.id === p.id ? "active" : ""}`}
                                onClick={() => { setCurrentUser(p); setShowAccountMenu(false); }}
                            >
                                <div className="avatar">{p.avatar}</div>
                                <div><b style={{ fontSize: "12px", display: "block" }}>{p.name}</b><small>{p.description}</small></div>
                                <span className={`role-badge ${p.role.toLowerCase()}`}>{p.role}</span>
                            </button>
                        ))}
                    </div>
                )}

                <button className="account-btn" onClick={() => setShowAccountMenu(!showAccountMenu)}>
                    <div className="avatar">{currentUser.avatar}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name}</b>
                        <small>{currentUser.role} · switch ▾</small>
                    </div>
                    <span className={`role-badge ${currentUser.role.toLowerCase()}`}>{currentUser.role}</span>
                </button>
            </div>
        </aside>
    );
}