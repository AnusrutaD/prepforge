"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { apiClient } from "./api";

/**
 * useAuthSync — called once after Clerk confirms the user is signed in.
 *
 * What it does:
 * 1. Gets the Clerk JWT
 * 2. Calls POST /api/v1/auth/sync on our FastAPI backend
 * 3. Reads onboardingDone from the response
 * 4. Redirects: onboardingDone=false → /onboarding, true → /dashboard
 */
export function useAuthSync() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const syncAndRedirect = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token || !user) return;

      const response = await apiClient.post(
        "/api/v1/auth/sync",
        {
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? "",
          display_name: user.fullName ?? user.firstName ?? "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { onboarding_done } = response.data.data;
      if (onboarding_done) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err) {
      console.error("Auth sync failed:", err);
      // Still redirect to onboarding as a safe fallback
      router.push("/onboarding");
    }
  }, [getToken, user, router]);

  return { syncAndRedirect };
}
