import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "../components/providers/ClientProviders";

export const metadata: Metadata = {
  title: "ArtistConnect | Independent artists & community",
  description: "Discover independent artists, share your work, and bring your community together.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
