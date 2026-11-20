"use client";

import React from "react";
import { AuthProvider } from "../../context/AuthContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
