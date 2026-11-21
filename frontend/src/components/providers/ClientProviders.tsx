"use client";

import React from "react";
import { AuthProvider } from "../../context/AuthContext";
import { DevDebugHUD } from "../debug/DevDebugHUD";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            {children}
            <DevDebugHUD />
        </AuthProvider>
    );
}
