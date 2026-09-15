import type { Metadata } from "next";

/**
 * Page-level metadata for pitch-range.
 * This file is required: the sibling page.tsx is `'use client'`, and a file carrying
 * `'use client'` is not allowed to export `metadata`, so the layout exports it instead.
 * The brand suffix in the title is appended automatically by title.template in app/layout.tsx —
 * do not write it by hand.
 */
export const metadata: Metadata = {
  title: "Vocal Range Finder & Voice Type Test",
  description:
    "Sing your lowest and highest comfortable notes to find your exact vocal range and voice type — soprano, alto, tenor, baritone or bass. Free online test, no signup.",
  alternates: {
    canonical: "/tools/pitch-range",
  },
};

export default function PitchRangeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
