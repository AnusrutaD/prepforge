import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <main className="min-h-screen px-6 py-8">
      {/* Top nav */}
      <nav className="flex items-center justify-between max-w-5xl mx-auto mb-12">
        <h1 className="text-xl font-bold text-white">
          Prep<span className="text-indigo-400">Forge</span>
        </h1>
        <UserButton afterSignOutUrl="/" />
      </nav>

      {/* Coming soon content */}
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-6 py-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm">
            🚧 Sprint 3 — Coming soon
          </div>
          <h2 className="text-4xl font-bold text-white">
            Your dashboard is being built
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            The adaptive problem recommendation engine, skill profile, and
            daily problem card are coming in Sprint 3.
          </p>

          {/* Placeholder stat cards */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-8">
            {[
              { label: "Current streak", value: "—" },
              { label: "Problems solved", value: "—" },
              { label: "Topics mastered", value: "—" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center"
              >
                <p className="text-2xl font-bold text-gray-600">{stat.value}</p>
                <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
