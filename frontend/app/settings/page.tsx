"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";
import { Navbar } from "@/components/navbar";

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "javascript", label: "JavaScript" },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SettingsPage() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [language, setLanguage] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [emailReminder, setEmailReminder] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // ── Load existing profile ──────────────────────────────────────────────────
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
        setLanguage(p.preferred_language ?? "");
        setTargetDate(p.target_date ?? "");
        setEmailReminder(p.email_reminder ?? false);
      } catch {
        // silently fail — form just starts empty
      } finally {
        setLoadingProfile(false);
      }
    }

    fetchProfile();
  }, [isLoaded, isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus("saving");

    try {
      const token = await getToken();
      await apiClient.patch(
        "/api/v1/users/me",
        {
          preferred_language: language || null,
          target_date: targetDate || null,
          email_reminder: emailReminder,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaveStatus("saved");
      // Auto-reset after 3 s
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <main className="min-h-screen px-6 py-8">
        <Navbar />
        <div className="max-w-xl mx-auto animate-pulse space-y-4">
          <div className="h-7 bg-gray-800 rounded w-40" />
          <div className="h-4 bg-gray-800 rounded w-64" />
          <div className="h-64 bg-gray-900 rounded-xl mt-6" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <Navbar />

      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">
            Update your prep preferences anytime.
          </p>
        </div>

        {/* Success / error banner */}
        {saveStatus === "saved" && (
          <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-4 py-3">
            <span>✓</span>
            <span>Settings saved successfully.</span>
          </div>
        )}
        {saveStatus === "error" && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
            <span>✕</span>
            <span>Something went wrong. Please try again.</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-xl p-8 space-y-6"
        >
          {/* Language */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Preferred coding language
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
              Target interview date
              <span className="text-gray-500 ml-2 font-normal">(optional)</span>
            </label>
            <input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {targetDate && (
              <button
                type="button"
                onClick={() => setTargetDate("")}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear date
              </button>
            )}
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

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Back to dashboard
            </button>
            <button
              type="submit"
              disabled={saveStatus === "saving"}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {saveStatus === "saving" ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
