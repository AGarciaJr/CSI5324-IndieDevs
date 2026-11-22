"use client";

import { AuthGuard } from "../../components/auth/AuthGuard";
import { ArtistConnectWorkspace } from "../../components/workspace/ArtistConnectWorkspace";

export default function ArtistPage() {
    return (
        <AuthGuard allowedRoles={["Artist"]} actorName="Artist">
            <ArtistConnectWorkspace currentPath="/artist" />
        </AuthGuard>
    );
}
