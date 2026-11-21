"use client";

import React, { Suspense } from "react";
import RegisterPage from "../page";

export default function FanRegisterPage() {
    return (
        <Suspense fallback={<div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}>Loading Fan Registration...</div>}>
            <RegisterPage initialTab="fan" />
        </Suspense>
    );
}
