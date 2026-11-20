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
    name: string;
    role: Role;
    avatar: string;
    description: string;
}

/**
 * Pre-configured personas matching project documentation and test scenarios:
 * - Nicholas Nolen (Fan, id: 1)
 * - Jordan Smith (Fan, id: 2)
 * - William Waweru (Artist, id: 9)
 * - Admin Alex (Admin, id: 101)
 * - Admin Garrett (Admin, id: 102)
 */
export const MOCK_USERS: UserPersona[] = [
    {
        id: 1,
        username: "nicholas",
        name: "Nicholas Nolen",
        role: "Fan",
        avatar: "NN",
        description: "Active Fan · Austin, TX",
    },
    {
        id: 2,
        username: "jordan",
        name: "Jordan Smith",
        role: "Fan",
        avatar: "JS",
        description: "New Fan (0 interactions) · Waco, TX",
    },
    {
        id: 9,
        username: "william",
        name: "William Waweru",
        role: "Artist",
        avatar: "WW",
        description: "Independent Artist · Waco, TX",
    },
    {
        id: 101,
        username: "alex",
        name: "Admin Alex",
        role: "Admin",
        avatar: "AA",
        description: "System Administrator (Reviewer 1)",
    },
    {
        id: 102,
        username: "garrett",
        name: "Admin Garrett",
        role: "Admin",
        avatar: "AG",
        description: "System Administrator (Reviewer 2)",
    },
];

const AUTH_STORAGE_KEY = "artistconnect-active-persona";

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
    usernameOrId: string | number,
    _password?: string,
    requiredRole?: Role
): { user: UserPersona | null; error?: string } {
    const trimmed = String(usernameOrId).trim().toLowerCase();
    const user = MOCK_USERS.find(
        (u) =>
            u.username.toLowerCase() === trimmed ||
            u.name.toLowerCase() === trimmed ||
            String(u.id) === trimmed
    );

    if (!user) {
        return {
            user: null,
            error: `User "${usernameOrId}" not found in mock database.`,
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
    return user.role === "Fan" ? (user.id === 1 ? 1 : 5) : user.role === "Artist" ? 2 : 3;
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
