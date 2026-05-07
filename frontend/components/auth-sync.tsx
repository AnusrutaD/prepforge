"use client";

/**
 * AuthSync — fires POST /auth/sync after every Clerk login.
 *
 * What it does:
 *   1. Sends the Clerk JWT + user info to our backend
 *   2. Backend creates the user row if first login (idempotent on repeat calls)
 *   3. If onboarding_done=false → redirects to /onboarding
 *
 * Where it lives: rendered inside the /dashboard page so it runs for every
 * signed-in user who lands on the dashboard, whether from sign-in or direct nav.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";

export function AuthSync() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const didSync = useRef(false); // prevent double-fire in StrictMode

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (didSync.current) return;
    didSync.current = true;

    async function syncUser() {
      try {
        const token = await getToken();
        const res = await apiClient.post(
          "/api/v1/auth/sync",
          {
            clerk_id: user!.id,
            email: user!.primaryEmailAddress?.emailAddress ?? "",
            display_name: user!.fullName ?? user!.firstName ?? null,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { onboarding_done } = res.data.data;
        if (!onboarding_done) {
          router.push("/onboarding");
        }
      } catch (err) {
        // Non-fatal — user is already on the dashboard, don't crash the page
        console.error("[AuthSync] failed:", err);
      }
    }

    syncUser();
  }, [isLoaded, isSignedIn, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null; // renders nothing — side-effect only
}
