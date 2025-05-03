import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Craft
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-muted-foreground">
          Generate export-ready TikTok/Instagram ads from product descriptions in seconds
        </p>
        <Link href="/dashboard" className="inline-block mt-6 px-8 py-3 bg-black text-white rounded-md text-lg font-semibold hover:bg-gray-800 transition">
          Go to Dashboard
        </Link>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">AI-Powered Copy</h3>
            <p className="text-muted-foreground">
              Generate compelling ad headlines using advanced AI models
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Fast Results</h3>
            <p className="text-muted-foreground">
              Get your ad copy ready in seconds, not hours
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Export Ready</h3>
            <p className="text-muted-foreground">
              Download your ads in the perfect format for TikTok and Instagram
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
