"use client";

import { AuthGuard } from "../../components/auth/AuthGuard";
import { ArtistConnectWorkspace } from "../../components/workspace/ArtistConnectWorkspace";

export default function FanPage() {
    return (
        <AuthGuard allowedRoles={["Fan"]} actorName="Fan">
            <ArtistConnectWorkspace currentPath="/fan" />
        </AuthGuard>
    );
}
