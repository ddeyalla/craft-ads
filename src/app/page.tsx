import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-12 lg:p-24">
      <div className="max-w-3xl mx-auto text-center">
        {/* Use global h1 style */}
        <h1 className="font-bold mb-6">
          Craft
        </h1>
        {/* This paragraph is a main tagline, let's use a larger fluid size, e.g., similar to h4 */}
        <p 
          className="mb-8 text-muted-foreground"
          style={{ fontSize: 'var(--font-size-fluid-3)' }} 
        >
          Generate export-ready TikTok/Instagram ads from product descriptions in seconds
        </p>
        {/* Button text will inherit fluid body size or use a slightly larger one if needed */}
        <Link href="/dashboard" className="inline-block mt-6 px-6 py-3 bg-black text-white rounded-md font-semibold hover:bg-gray-800 transition">
          Go to Dashboard
        </Link>
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="p-4 md:p-6 border rounded-lg">
            {/* Reclassify as h5 for smaller fluid heading */}
            <h5 className="font-semibold mb-2">AI-Powered Copy</h5>
            {/* These paragraphs will use global fluid p style */}
            <p className="text-muted-foreground">
              Generate compelling ad headlines using advanced AI models
            </p>
          </div>
          <div className="p-4 md:p-6 border rounded-lg">
            <h5 className="font-semibold mb-2">Fast Results</h5>
            <p className="text-muted-foreground">
              Get your ad copy ready in seconds, not hours
            </p>
          </div>
          <div className="p-4 md:p-6 border rounded-lg">
            <h5 className="font-semibold mb-2">Export Ready</h5>
            <p className="text-muted-foreground">
              Download your ads in the perfect format for TikTok and Instagram
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
