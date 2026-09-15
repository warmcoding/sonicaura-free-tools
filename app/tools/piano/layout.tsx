import type { Metadata } from "next";

/**
 * Page-level metadata for piano.
 * This file is required: the sibling page.tsx is `'use client'`, and a file carrying
 * `'use client'` is not allowed to export `metadata`, so the layout exports it instead.
 * The brand suffix in the title is appended automatically by title.template in app/layout.tsx —
 * do not write it by hand.
 */
export const metadata: Metadata = {
  title: "Virtual Piano — Free Online Keyboard",
  description:
    "Play a full 61-key virtual piano in your browser. Use your computer keyboard to play chords, check pitches and practise scales with realistic acoustic tones.",
  alternates: {
    canonical: "/tools/piano",
  },
};

export default function PianoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
