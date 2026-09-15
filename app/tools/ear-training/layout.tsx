import type { Metadata } from "next";

/**
 * Page-level metadata for ear-training.
 * This file is required: the sibling page.tsx is `'use client'`, and a file carrying
 * `'use client'` is not allowed to export `metadata`, so the layout exports it instead.
 * The brand suffix in the title is appended automatically by title.template in app/layout.tsx —
 * do not write it by hand.
 */
export const metadata: Metadata = {
  title: "Ear Training — Microtonal Pitch Test",
  description:
    "Sharpen your musical ear by telling apart subtle microtonal pitch differences. A free browser-based ear training drill for singers, producers and instrumentalists.",
  alternates: {
    canonical: "/tools/ear-training",
  },
};

export default function EarTrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
