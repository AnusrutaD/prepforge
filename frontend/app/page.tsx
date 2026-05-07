import Link from "next/link";

// ── How it works steps ────────────────────────────────────────────────────────

const STEPS = [
  {
    step: "01",
    title: "Diagnose your gaps",
    desc: "Take a 10-question adaptive quiz. PrepForge maps your skill level across Arrays, Trees, Graphs, DP, and more in ~20 minutes.",
  },
  {
    step: "02",
    title: "Get your personal queue",
    desc: "Your weakest topics float to the top. Every problem you solve reshapes the queue — you always work on what matters most.",
  },
  {
    step: "03",
    title: "Land the offer",
    desc: "AI hints guide you when you're stuck — no copy-paste spoilers. Track your streak, hit your target date, ship the interview.",
  },
];

// ── Differentiators ───────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "🎯",
    title: "Adaptive, not random",
    desc: "LeetCode shows you 3,000 problems. PrepForge shows you the right 30.",
  },
  {
    icon: "🤖",
    title: "AI hints that teach",
    desc: "Stuck on a problem? Get a nudge that builds understanding, not just the answer.",
  },
  {
    icon: "📈",
    title: "Progress you can see",
    desc: "Streak, topics mastered, days to target date — your momentum on one screen.",
  },
  {
    icon: "⚡",
    title: "Built for working engineers",
    desc: "30–60 minutes a day is enough. PrepForge maximises every session.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <main className="min-h-screen px-4">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center min-h-screen text-center max-w-2xl mx-auto space-y-8 py-20">
        <div className="space-y-3">
          <div className="inline-block text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-2">
            Beta · Free for first 20 users
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
            Prep<span className="text-indigo-400">Forge</span>
          </h1>
          <p className="text-xl text-gray-400">
            Adaptive DSA interview prep.<br />Your weaknesses, fixed first.
          </p>
        </div>

        <p className="text-gray-500 text-base leading-relaxed max-w-lg">
          Stop grinding randomly. PrepForge identifies your weakest topics and
          serves the exact problems you need — with AI hints that guide, not spoil.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/sign-up"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
          >
            Get started free →
          </Link>
          <Link
            href="/sign-in"
            className="px-6 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold rounded-lg transition-colors"
          >
            Sign in
          </Link>
        </div>

        <p className="text-xs text-gray-600">No credit card required</p>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto py-20 px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white">How it works</h2>
          <p className="text-gray-500 mt-2 text-sm">Three steps from signup to offer</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.step} className="space-y-3">
              <div className="text-3xl font-black text-indigo-500/40 font-mono">{s.step}</div>
              <h3 className="text-white font-semibold">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features / differentiators ───────────────────────────────────── */}
      <section className="max-w-4xl mx-auto py-20 px-4 border-t border-gray-800">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white">
            Not just another LeetCode clone
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            Built specifically for engineers who have a job and a deadline
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-2"
            >
              <div className="text-2xl">{f.icon}</div>
              <h3 className="text-white font-semibold">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto text-center py-20 px-4 border-t border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-3">
          Ready to prep smarter?
        </h2>
        <p className="text-gray-400 text-sm mb-8">
          Join the beta. First 20 users get lifetime free access.
        </p>
        <Link
          href="/sign-up"
          className="inline-block px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
        >
          Start for free →
        </Link>
        <p className="text-xs text-gray-600 mt-4">No credit card · No spam</p>
      </section>

    </main>
  );
}
