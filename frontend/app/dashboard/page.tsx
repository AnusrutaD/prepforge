"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";
import { AuthSync } from "@/components/auth-sync";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  preferred_language: string | null;
  target_date: string | null;
  email_reminder: boolean;
  onboarding_done: boolean;
  diagnostic_done: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LANGUAGE_LABELS: Record<string, string> = {
  python: "Python",
  java: "Java",
  cpp: "C++",
  javascript: "JavaScript",
};

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function NextActionCard({
  diagnostic_done,
  preferred_language,
}: {
  diagnostic_done: boolean;
  preferred_language: string | null;
}) {
  if (!diagnostic_done) {
    return (
      <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🎯</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              Take your diagnostic test
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              A 10-question adaptive quiz that maps your current skill level
              across Arrays, Trees, Graphs, DP, and more. Takes ~20 minutes.
              PrepForge uses the results to build your personalised problem
              queue.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                disabled
                className="px-5 py-2.5 bg-indigo-600 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg"
              >
                Start diagnostic →
              </button>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Coming in Sprint 2
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-emerald-600/10 border border-emerald-500/30 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="text-3xl">📚</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">
            Today's recommended problem
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Your adaptive problem queue is being built based on your diagnostic
            results.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              disabled
              className="px-5 py-2.5 bg-emerald-600 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg"
            >
              Solve today's problem →
            </button>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Coming in Sprint 3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    async function loadProfile() {
      try {
        const token = await getToken();
        const res = await apiClient.get("/api/v1/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const p: UserProfile = res.data.data;
        if (!p.onboarding_done) {
          router.push("/onboarding");
          return;
        }
        setProfile(p);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [isLoaded, isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading state ────────────────────────────────────────────────────────

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen px-6 py-8">
        <nav className="flex items-center justify-between max-w-5xl mx-auto mb-12">
          <h1 className="text-xl font-bold text-white">
            Prep<span className="text-indigo-400">Forge</span>
          </h1>
          <UserButton afterSignOutUrl="/" />
        </nav>
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-64" />
            <div className="h-4 bg-gray-800 rounded w-40" />
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const rawName =
    profile?.display_name ??
    clerkUser?.firstName ??
    clerkUser?.username ??
    "there";

  // Normalise ALL CAPS names to Title Case (e.g. "ANUSRUTA DUTTA" → "Anusruta Dutta")
  const displayName = rawName
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  const daysLeft = profile?.target_date ? daysUntil(profile.target_date) : null;
  const langLabel = profile?.preferred_language
    ? LANGUAGE_LABELS[profile.preferred_language] ?? profile.preferred_language
    : null;

  return (
    <main className="min-h-screen px-6 py-8">
      <AuthSync />

      {/* Top nav */}
      <nav className="flex items-center justify-between max-w-5xl mx-auto mb-10">
        <h1 className="text-xl font-bold text-white">
          Prep<span className="text-indigo-400">Forge</span>
        </h1>
        <UserButton afterSignOutUrl="/" />
      </nav>

      <div className="max-w-5xl mx-auto space-y-8">

        {/* Welcome header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {displayName} 👋
          </h2>
          <p className="text-gray-400 text-sm">
            {daysLeft !== null && daysLeft > 0
              ? `${daysLeft} days until your target interview date. Keep the momentum going.`
              : daysLeft === 0
              ? "Your interview is today! You've got this. 💪"
              : daysLeft !== null && daysLeft < 0
              ? "Your target date has passed — update it in settings."
              : "Set a target interview date to track your countdown."}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Day streak"
            value="0"
            sub="Start solving to build your streak"
          />
          <StatCard
            label="Problems solved"
            value="0"
            sub={langLabel ? `Practising in ${langLabel}` : "Language not set"}
          />
          <StatCard
            label="Topics mastered"
            value="0"
            sub="Complete diagnostic to unlock"
          />
        </div>

        {/* Next action */}
        <NextActionCard
          diagnostic_done={profile?.diagnostic_done ?? false}
          preferred_language={profile?.preferred_language ?? null}
        />

        {/* Profile summary */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Your prep profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Preferred language</p>
              <p className="text-white font-medium mt-0.5">
                {langLabel ?? "Not set"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Target interview date</p>
              <p className="text-white font-medium mt-0.5">
                {profile?.target_date
                  ? new Date(profile.target_date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Daily reminders</p>
              <p className="text-white font-medium mt-0.5">
                {profile?.email_reminder ? "On ✓" : "Off"}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/onboarding")}
            className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Edit preferences →
          </button>
        </div>

      </div>
    </main>
  );
}
