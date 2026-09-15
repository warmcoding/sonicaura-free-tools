// app/tools/vocal-pitch-test/page.tsx
import VocalPitchClient from './VocalPitchClient';

export const metadata = {
    // The brand suffix is appended automatically by title.template in app/layout.tsx;
    // do not write it here or it will be duplicated
    title: 'Online Vocal Pitch & Intonation Test Tool',
    description: 'Test your singing pitch and intonation accuracy online with real-time vocal pitch detection and instant score reports.',
    // The relative path is turned into an absolute URL by the root layout's metadataBase;
    // declaring it per page avoids being flagged as duplicate content
    alternates: {
        canonical: '/tools/vocal-pitch-test',
    },
};

export default function VocalPitchTestPage() {
    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12">
            {/*
              Skip link: targets the <h1> rather than <main> because <GlobalHeader> renders as
              the first child of <main> on every page — see app/page.tsx for the rationale.
            */}
            <a
                href="#main-content"
                className="fixed top-4 left-[-9999px] z-[60] whitespace-nowrap rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg focus:left-4"
            >
                Skip to main content
            </a>

            <div className="max-w-4xl mx-auto flex flex-col items-center">
                <h1
                    id="main-content"
                    tabIndex={-1}
                    className="text-3xl font-bold mb-2 mt-2 text-center scroll-mt-24"
                >
                    Online Vocal Pitch & Intonation Test
                </h1>
                <p className="text-zinc-400 mb-8 text-center">Follow the scales, sing into your microphone, and get your real-time pitch accuracy score.</p>

                {/* Client-side interaction and audio component */}
                <VocalPitchClient />


            </div>
        </main>
    );
}