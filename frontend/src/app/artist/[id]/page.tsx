import { Suspense } from "react";
import DedicatedArtistContent from "./DedicatedArtistContent";

async function ArtistWrapper({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <DedicatedArtistContent id={id} />;
}

export default function DedicatedArtistPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    return (
        <Suspense
            fallback={
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                    <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading artist profile…</p>
                </div>
            }
        >
            <ArtistWrapper params={params} />
        </Suspense>
    );
}
