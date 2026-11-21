/**
 * ArtistConnect - Authentication & Authorization Module
 *
 * ============================================================================
 * HANDOFF NOTE FOR DATABASE IMPLEMENTATION:
 * ============================================================================
 * Currently, authentication and authorization are handled in this lightweight
 * client-accessible mock module without requiring a live database connection.
 *
 * Architecture Rule per Project Requirements:
 * - Fans and Artists authenticate from the shared public login screen (/login).
 * - System Administrators authenticate exclusively from the administrative portal (/admin).
 *
 * When the database and backend authentication endpoints are ready:
 * 1. Replace `MOCK_USERS` and `mockAuthenticate` with fetch calls
 *    to your backend endpoints (e.g., POST /api/auth/login).
 * 2. Store the returned JWT or session cookie, and fetch the authenticated
 *    account details (e.g., GET /api/auth/me).
 * 3. Keep the `Role` and `UserPersona` interfaces intact so all pages,
 *    `AuthGuard`, and navigation components seamlessly consume the live database.
 * ============================================================================
 */

export type Role = "Fan" | "Artist" | "Admin";

export interface UserPersona {
    id: number;
    username: string;
    email: string;
    name: string;
    role: Role;
    avatar: string;
    description: string;
}

/**
 * Standard testing accounts per specifications:
 * - Fan: fan@test.com (Nicholas Nolen, id: 1)
 * - Artist: artist@test.com (William Waweru, id: 9)
 * - Admin: admin@test.com (Admin Alex, id: 101)
 */
export const MOCK_USERS: UserPersona[] = [
    {
        id: 1,
        username: "fan@test.com",
        email: "fan@test.com",
        name: "Nicholas Nolen",
        role: "Fan",
        avatar: "NN",
        description: "Active Fan · Austin, TX",
    },
    {
        id: 2,
        username: "jordan@test.com",
        email: "jordan@test.com",
        name: "Jordan Smith",
        role: "Fan",
        avatar: "JS",
        description: "New Fan (0 interactions) · Waco, TX",
    },
    {
        id: 9,
        username: "artist@test.com",
        email: "artist@test.com",
        name: "William Waweru",
        role: "Artist",
        avatar: "WW",
        description: "Independent Artist · Waco, TX",
    },
    {
        id: 101,
        username: "admin@test.com",
        email: "admin@test.com",
        name: "Admin Alex",
        role: "Admin",
        avatar: "AA",
        description: "System Administrator (Reviewer 1)",
    },
    {
        id: 102,
        username: "garrett@test.com",
        email: "garrett@test.com",
        name: "Admin Garrett",
        role: "Admin",
        avatar: "AG",
        description: "System Administrator (Reviewer 2)",
    },
];

const AUTH_STORAGE_KEY = "artistconnect-active-persona";
const CUSTOM_USERS_STORAGE_KEY = "artistconnect-custom-users";

export function getRegisteredUsers(): UserPersona[] {
    if (typeof window === "undefined") return [];
    try {
        const item = localStorage.getItem(CUSTOM_USERS_STORAGE_KEY);
        if (!item) return [];
        return JSON.parse(item) || [];
    } catch {
        return [];
    }
}

export function saveRegisteredUser(user: UserPersona): void {
    if (typeof window === "undefined") return;
    try {
        const users = getRegisteredUsers();
        const existingIdx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
        if (existingIdx >= 0) {
            users[existingIdx] = user;
        } else {
            users.push(user);
        }
        localStorage.setItem(CUSTOM_USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
        // Ignore storage write errors
    }
}

export interface FanRegistrationData {
    name: string;
    email: string;
    password?: string;
    location?: string;
    bio?: string;
    interests?: string[];
}

export function registerFanUser(data: FanRegistrationData): UserPersona {
    const initials = data.name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .slice(0, 2) || "FN";

    const newId = Date.now();
    const persona: UserPersona = {
        id: newId,
        username: data.email.trim().toLowerCase(),
        email: data.email.trim().toLowerCase(),
        name: data.name.trim(),
        role: "Fan",
        avatar: initials,
        description: data.bio?.trim() || `Active Fan · ${data.location?.trim() || "Community Member"}`,
    };

    saveRegisteredUser(persona);

    if (typeof window !== "undefined") {
        try {
            const profileKey = `artistconnect-fan-profile-${newId}`;
            const initialProfile = {
                id: newId,
                name: persona.name,
                location: data.location?.trim() || "Local Arts Community",
                bio: data.bio?.trim() || "Passionate supporter of independent art and grassroots music.",
                interests: data.interests && data.interests.length > 0 ? data.interests : ["Indie Rock", "Visual Media", "Street Art / Graffiti"],
                showInterests: true,
                showFollowing: true,
                showRecentInteractions: true,
                publicProfile: true,
            };
            localStorage.setItem(profileKey, JSON.stringify(initialProfile));
        } catch {
            // Ignore storage errors
        }
    }

    return persona;
}

export interface ArtistApplicationData {
    name: string;
    email: string;
    proposedGenre: string;
    location?: string;
    portfolioLinks: string;
    description: string;
    password?: string;
}

export interface ArtistApplicationSubmission {
    id?: number;
    applicantName: string;
    proposedGenre: string;
    portfolioLinks: string;
    description: string;
    status: string;
    submittedAt?: string;
    email?: string;
    location?: string;
}

export async function submitArtistApplication(data: ArtistApplicationData): Promise<{ success: boolean; application?: ArtistApplicationSubmission; error?: string }> {
    const payload = {
        applicantName: data.name.trim(),
        proposedGenre: data.proposedGenre.trim(),
        portfolioLinks: data.portfolioLinks.trim(),
        description: data.description.trim(),
        status: "PENDING",
    };

    try {
        const res = await fetch("http://localhost:8080/api/moderation/applications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            throw new Error(`Server returned HTTP ${res.status}`);
        }

        const app = await res.json();

        if (typeof window !== "undefined") {
            try {
                const existing = JSON.parse(localStorage.getItem("artistconnect-pending-applications") || "[]");
                existing.unshift({
                    ...app,
                    email: data.email,
                    location: data.location,
                    submittedAt: new Date().toISOString(),
                });
                localStorage.setItem("artistconnect-pending-applications", JSON.stringify(existing));
            } catch {
                // Ignore storage errors
            }
        }

        return { success: true, application: app };
    } catch {
        // Fallback for offline mode or network errors
        const fallbackApp = {
            id: Date.now(),
            applicantName: data.name.trim(),
            proposedGenre: data.proposedGenre.trim(),
            portfolioLinks: data.portfolioLinks.trim(),
            description: data.description.trim(),
            status: "PENDING",
            submittedAt: new Date().toISOString(),
        };

        if (typeof window !== "undefined") {
            try {
                const existing = JSON.parse(localStorage.getItem("artistconnect-pending-applications") || "[]");
                existing.unshift({
                    ...fallbackApp,
                    email: data.email,
                    location: data.location,
                });
                localStorage.setItem("artistconnect-pending-applications", JSON.stringify(existing));
            } catch {
                // Ignore storage errors
            }
        }

        return { success: true, application: fallbackApp };
    }
}

export function getStoredUser(): UserPersona | null {
    if (typeof window === "undefined") return null;
    try {
        const item = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!item) return null;
        const parsed = JSON.parse(item);
        if (parsed && typeof parsed.id === "number" && parsed.role) {
            return parsed;
        }
    } catch {
        // Ignore JSON/storage parse errors
    }
    return null;
}

export function setStoredUser(user: UserPersona): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {
        // Ignore storage write errors
    }
}

export function clearStoredUser(): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
        // Ignore storage removal errors
    }
}

/**
 * Lightweight mock authentication service.
 * Allows login via username and optional role check.
 */
export function mockAuthenticate(
    usernameOrEmailOrId: string | number,
    _password?: string,
    requiredRole?: Role
): { user: UserPersona | null; error?: string } {
    const trimmed = String(usernameOrEmailOrId).trim().toLowerCase();
    const allUsers = [...MOCK_USERS, ...getRegisteredUsers()];
    const user = allUsers.find(
        (u) =>
            u.email.toLowerCase() === trimmed ||
            u.username.toLowerCase() === trimmed ||
            u.name.toLowerCase() === trimmed ||
            String(u.id) === trimmed ||
            (trimmed === "fan" && u.email === "fan@test.com") ||
            (trimmed === "nicholas" && u.id === 1) ||
            (trimmed === "jordan" && u.id === 2) ||
            (trimmed === "artist" && u.email === "artist@test.com") ||
            (trimmed === "william" && u.id === 9) ||
            (trimmed === "admin" && u.email === "admin@test.com") ||
            (trimmed === "alex" && u.id === 101) ||
            (trimmed === "garrett" && u.id === 102)
    );

    if (!user) {
        return {
            user: null,
            error: `User "${usernameOrEmailOrId}" not found. Test with fan@test.com, artist@test.com, or admin@test.com.`,
        };
    }

    if (requiredRole && user.role !== requiredRole) {
        if (user.role === "Admin" && requiredRole !== "Admin") {
            return {
                user: null,
                error: `Administrative accounts cannot authenticate on the public user login screen. Please navigate to /admin to access the administrative portal.`,
            };
        }
        return {
            user: null,
            error: `User "${user.name}" has role ${user.role}, but this form is for ${requiredRole}.`,
        };
    }

    return { user };
}

/**
 * Maps persona to backend UserAccount ID for header-based API authorization (X-User-Id).
 */
export function getBackendAccountId(user: UserPersona): number {
    return user.role === "Fan" ? (user.id === 1 ? 1 : user.id || 5) : user.role === "Artist" ? (user.id === 9 ? 2 : user.id || 2) : 3;
}

/**
 * Default actor home pages per documentation:
 * - Fan: /fan
 * - Artist: /artist
 * - Admin: /admin
 */
export function getActorHomePage(role: Role): string {
    switch (role) {
        case "Fan":
            return "/fan";
        case "Artist":
            return "/artist";
        case "Admin":
            return "/admin";
    }
}
