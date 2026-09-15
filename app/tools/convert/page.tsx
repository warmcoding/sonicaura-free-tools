import AudioConverterClient from './AudioConverterClient';
import GlobalHeader from '@/components/Header';
import StudioCTA from '@/components/StudioCTA';
import Comment from '@/components/Comment';
import ToolGuide from '@/components/ToolGuide';
import { CONVERT_GUIDE } from '@/lib/tool-content';

export const metadata = {
    // The brand suffix is appended automatically by title.template in app/layout.tsx;
    // do not write it here or it will be duplicated
    title: 'Audio & Video Format Converter',
    description: 'Easily convert .m4a, .mp4, .mov and audio tracks into clean, high-quality MP3 or WAV files for AI processing and stem splitting.',
    // The relative path is turned into an absolute URL by the root layout's metadataBase;
    // declaring it per page avoids being flagged as duplicate content
    alternates: {
        canonical: '/tools/convert',
    },
};

export default function AudioConverterPage() {
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
            <GlobalHeader type="tool" />
            <div className="max-w-4xl mx-auto flex flex-col items-center">
                <h1
                    id="main-content"
                    tabIndex={-1}
                    className="text-3xl font-bold mb-2 mt-2 text-center scroll-mt-24"
                >
                    Audio & Video Format Converter
                </h1>
                <p className="text-zinc-400 mb-8 text-center">
                    Easily convert .m4a, .mp4, .mov or any audio tracks into clean, high-quality MP3 or WAV files.
                </p>

                {/* Client-side file picker and transcoding component */}
                <AudioConverterClient />

                {/* How-to steps + FAQ: the copy and the HowTo / FAQPage structured data share one source */}
                <ToolGuide content={CONVERT_GUIDE} />

                {/* Feedback form */}
                <Comment />

                {/* Bottom-of-page cross-sell */}
                <StudioCTA />
            </div>
        </main>
    );
}