import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArtistConnect | Independent artists & community",
  description: "Discover independent artists, share your work, and bring your community together.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
