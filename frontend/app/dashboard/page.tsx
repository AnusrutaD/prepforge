"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";
import { AuthSync } from "@/components/auth-sync";
import { Navbar } from "@/components/navbar";

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

function JourneyTracker({
  profile,
}: {
  profile: UserProfile;
}) {
  const steps = [
    {
      id: "account",
      label: "Create your account",
      done: true,
    },
    {
      id: "prefs",
      label: "Set your preferences",
      done: !!(profile.preferred_language),
    },
    {
      id: "diagnostic",
      label: "Take the diagnostic test",
      done: profile.diagnostic_done,
      comingSoon: !profile.diagnostic_done,
      hint: "A 10-question quiz that maps your skill gaps across Arrays, Trees, DP, and more.",
    },
    {
      id: "problem",
      label: "Solve your first problem",
      done: false,
      comingSoon: true,
      hint: "Your adaptive problem queue unlocks after the diagnostic.",
    },
    {
      id: "target",
      label: "Hit your target interview date",
      done: false,
      hint: profile.target_date
        ? `You have a date set — stay consistent.`
        : "Set a target date in Settings to track your countdown.",
    },
  ];

  // find the first incomplete step to highlight
  const activeIndex = steps.findIndex((s) => !s.done);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-5">
        Your journey
      </h3>
      <div className="space-y-0">
        {steps.map((step, idx) => {
          const isActive = idx === activeIndex;
          const isPast = step.done;

          return (
            <div key={step.id} className="flex gap-4">
              {/* Spine */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 border-2 transition-colors ${
                    isPast
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : isActive
                      ? "bg-gray-950 border-indigo-500 text-indigo-400"
                      : "bg-gray-950 border-gray-700 text-gray-600"
                  }`}
                >
                  {isPast ? "✓" : <span className="text-xs">{idx + 1}</span>}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-8 mt-1 ${isPast ? "bg-indigo-600/40" : "bg-gray-800"}`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pb-8 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className={`text-sm font-medium ${
                      isPast
                        ? "text-gray-500 line-through"
                        : isActive
                        ? "text-white"
                        : "text-gray-600"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.comingSoon && !step.done && (
                    <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      coming soon
                    </span>
                  )}
                </div>
                {isActive && step.hint && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {step.hint}
                  </p>
                )}
              </div>
            </div>
          );
        })}
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
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const checkedFirstVisit = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    // First-visit detection via localStorage
    if (!checkedFirstVisit.current) {
      checkedFirstVisit.current = true;
      const key = "pf_visited";
      if (!localStorage.getItem(key)) {
        setIsFirstVisit(true);
        localStorage.setItem(key, "1");
      }
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
        <Navbar />
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

      <Navbar />

      <div className="max-w-5xl mx-auto space-y-8">

        {/* Welcome header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">
              {isFirstVisit ? `Welcome, ${displayName} 👋` : `Welcome back, ${displayName} 👋`}
            </h2>
            <p className="text-gray-400 text-sm">
              {daysLeft !== null && daysLeft > 0
                ? "Days until your target interview date"
                : daysLeft === 0
                ? "Your interview is today! You've got this. 💪"
                : daysLeft !== null && daysLeft < 0
                ? "Target date passed — update it in Settings."
                : "No target date set — add one in Settings to start the countdown."}
            </p>
          </div>

          {/* Countdown badge */}
          {daysLeft !== null && daysLeft > 0 && (
            <div
              className={`flex-shrink-0 rounded-xl px-5 py-3 text-center border ${
                daysLeft > 60
                  ? "bg-emerald-600/10 border-emerald-500/30"
                  : daysLeft > 14
                  ? "bg-amber-600/10 border-amber-500/30"
                  : "bg-red-600/10 border-red-500/30"
              }`}
            >
              <p
                className={`text-3xl font-black tabular-nums ${
                  daysLeft > 60
                    ? "text-emerald-400"
                    : daysLeft > 14
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {daysLeft}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">days left</p>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Day streak"
            value="—"
            sub="Solve your first problem to start"
          />
          <StatCard
            label="Problems solved"
            value="—"
            sub={langLabel ? `Practising in ${langLabel}` : "Language not set"}
          />
          <StatCard
            label="Topics mastered"
            value="—"
            sub="Take the diagnostic to begin"
          />
        </div>

        {/* Journey */}
        {profile && <JourneyTracker profile={profile} />}

        {/* While you wait */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
            While you wait
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Start practising today with these battle-tested resources.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: "NeetCode 150",
                desc: "The cleanest curated 150-problem list with video explanations.",
                url: "https://neetcode.io/practice",
                tag: "Free",
              },
              {
                title: "Blind 75",
                desc: "The original viral list — covers every pattern you'll face in FAANG.",
                url: "https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions",
                tag: "Free",
              },
              {
                title: "System Design Primer",
                desc: "The most starred GitHub repo for system design fundamentals.",
                url: "https://github.com/donnemartin/system-design-primer",
                tag: "GitHub",
              },
              {
                title: "Striver's A2Z DSA",
                desc: "Structured sheet covering every DSA topic from scratch.",
                url: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2",
                tag: "Free",
              },
            ].map((r) => (
              <a
                key={r.title}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:border-gray-600 hover:bg-gray-800 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                      {r.title}
                    </p>
                    <span className="text-[10px] text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">
                      {r.tag}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {r.desc}
                  </p>
                </div>
                <span className="text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0 mt-0.5">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </div>

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
            onClick={() => router.push("/settings")}
            className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Edit in settings →
          </button>
        </div>

      </div>
    </main>
  );
}
