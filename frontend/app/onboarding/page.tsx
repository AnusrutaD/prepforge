"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "javascript", label: "JavaScript" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [language, setLanguage] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [emailReminder, setEmailReminder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <main className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">
            Welcome, {user?.firstName ?? "there"} 👋
          </h1>
          <p className="text-gray-400">
            Let's personalise your prep. Takes 30 seconds.
          </p>
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
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? "Saving..." : "Start my prep journey →"}
          </button>
        </form>
      </div>
    </main>
  );
}
