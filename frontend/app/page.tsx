import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="max-w-2xl space-y-8">
        {/* Logo / wordmark */}
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-white">
            Prep<span className="text-indigo-400">Forge</span>
          </h1>
          <p className="text-xl text-gray-400">
            Adaptive DSA interview prep. Your weaknesses, fixed first.
          </p>
        </div>

        {/* Value prop */}
        <p className="text-gray-500 text-base leading-relaxed">
          Stop grinding randomly. PrepForge identifies your weakest topics and
          serves the exact problems you need — with AI hints that guide, not spoil.
        </p>

        {/* CTAs */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-up"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/sign-in"
            className="px-6 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold rounded-lg transition-colors"
          >
            Sign in
          </Link>
        </div>

        <p className="text-xs text-gray-600">
          Beta · Free for first 20 users · No credit card required
        </p>
      </div>
    </main>
  );
}
