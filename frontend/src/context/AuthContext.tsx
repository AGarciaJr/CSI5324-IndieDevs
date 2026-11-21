"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
    UserPersona,
    Role,
    getStoredUser,
    setStoredUser,
    clearStoredUser,
    mockAuthenticate,
} from "../lib/auth";

interface AuthContextType {
    currentUser: UserPersona | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
    login: (username: string, password?: string, requiredRole?: Role) => { success: boolean; error?: string };
    loginAsPersona: (persona: UserPersona) => void;
    logout: () => void;
    switchUser: (persona: UserPersona) => void;
    hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUserState] = useState<UserPersona | null>(() => {
        if (typeof window === "undefined") return null;
        return getStoredUser();
    });

    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsInitialized(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const login = useCallback(
        (username: string, password?: string, requiredRole?: Role): { success: boolean; error?: string } => {
            const result = mockAuthenticate(username, password, requiredRole);
            if (result.user) {
                setStoredUser(result.user);
                setCurrentUserState(result.user);
                return { success: true };
            }
            return { success: false, error: result.error || "Authentication failed." };
        },
        []
    );

    const loginAsPersona = useCallback((persona: UserPersona) => {
        setStoredUser(persona);
        setCurrentUserState(persona);
    }, []);

    const logout = useCallback(() => {
        clearStoredUser();
        setCurrentUserState(null);
    }, []);

    const switchUser = useCallback((persona: UserPersona) => {
        setStoredUser(persona);
        setCurrentUserState(persona);
    }, []);

    const hasRole = useCallback(
        (role: Role) => {
            return currentUser?.role === role;
        },
        [currentUser]
    );

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                isAuthenticated: !!currentUser,
                isInitialized,
                login,
                loginAsPersona,
                logout,
                switchUser,
                hasRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
