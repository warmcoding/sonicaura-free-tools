import type { Metadata } from "next";

/**
 * Page-level metadata for metronome.
 * This file is required: the sibling page.tsx is `'use client'`, and a file carrying
 * `'use client'` is not allowed to export `metadata`, so the layout exports it instead.
 * The brand suffix in the title is appended automatically by title.template in app/layout.tsx —
 * do not write it by hand.
 */
export const metadata: Metadata = {
  title: "Free Online Metronome with Tap Tempo",
  description:
    "A high-precision online metronome with tap tempo, adjustable time signatures and accented beats. Works right in your browser — free, no signup and no download.",
  alternates: {
    canonical: "/tools/metronome",
  },
};

export default function MetronomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
