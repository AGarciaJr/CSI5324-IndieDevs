"use client";

import React, { Suspense } from "react";
import RegisterPage from "../page";

export default function ArtistRegisterPage() {
    return (
        <Suspense fallback={<div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}>Loading Artist Application...</div>}>
            <RegisterPage initialTab="artist" />
        </Suspense>
    );
}
