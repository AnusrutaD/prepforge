"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";
import { Navbar } from "@/components/navbar";

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "javascript", label: "JavaScript" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const [language, setLanguage] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [emailReminder, setEmailReminder] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Pre-populate existing values ──────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    async function fetchProfile() {
      try {
        const token = await getToken();
        const res = await apiClient.get("/api/v1/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const p = res.data.data;
        if (p.onboarding_done) setIsReturning(true);
        if (p.preferred_language) setLanguage(p.preferred_language);
        if (p.target_date) setTargetDate(p.target_date);
        if (p.email_reminder !== undefined) setEmailReminder(p.email_reminder);
      } catch {
        // silently fall through — form starts blank for new users
      } finally {
        setLoadingProfile(false);
      }
    }

    fetchProfile();
  }, [isLoaded, isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!language) {
      setError("Please select your preferred language.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getToken();
      await apiClient.patch(
        "/api/v1/users/me",
        {
          preferred_language: language,
          target_date: targetDate || null,
          email_reminder: emailReminder,
          onboarding_done: true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Title-case helper ─────────────────────────────────────────────────────
  const firstName = (() => {
    const raw = user?.firstName ?? "there";
    return raw
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  })();

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <main className="min-h-screen px-6 py-8">
        <Navbar />
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-48 mx-auto" />
            <div className="h-4 bg-gray-800 rounded w-64 mx-auto" />
            <div className="h-80 bg-gray-900 rounded-xl mt-6" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <Navbar />
      <div className="flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">

          {/* Header — adapts for first-time vs returning */}
          <div className="text-center space-y-2">
            {isReturning ? (
              <>
                <h1 className="text-3xl font-bold text-white">
                  Your preferences
                </h1>
                <p className="text-gray-400">
                  Changes take effect immediately.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-white">
                  Welcome, {firstName} 👋
                </h1>
                <p className="text-gray-400">
                  Let's personalise your prep. Takes 30 seconds.
                </p>
              </>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-gray-900 border border-gray-800 rounded-xl p-8 space-y-6"
          >
            {/* Language selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                What's your preferred coding language?
                <span className="text-red-400 ml-1">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => setLanguage(lang.value)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      language === lang.value
                        ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                        : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target date */}
            <div className="space-y-2">
              <label
                htmlFor="targetDate"
                className="block text-sm font-medium text-gray-300"
              >
                When is your target interview date?
                <span className="text-gray-500 ml-2 font-normal">(optional)</span>
              </label>
              <input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Email reminders */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">
                  Daily practice reminders
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Get a nudge each day to keep your streak alive
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEmailReminder(!emailReminder)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailReminder ? "bg-indigo-600" : "bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailReminder ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            {/* Submit */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {loading
                  ? "Saving..."
                  : isReturning
                  ? "Save changes →"
                  : "Start my prep journey →"}
              </button>
              {isReturning && (
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="w-full py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 font-medium rounded-lg transition-colors text-sm"
                >
                  ← Back to dashboard
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
