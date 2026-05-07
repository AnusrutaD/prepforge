import axios from "axios";

/**
 * Centralised axios instance for all PrepForge API calls.
 * The Clerk JWT is injected per-request in the useApi hook (see lib/useApi.ts).
 * Never call axios directly — always use this instance so headers are consistent.
 */
export const apiClient = axios.create({
  // Use relative URL so requests go through Next.js proxy (next.config.ts rewrites)
  // This eliminates CORS in both dev and prod — browser always talks to same origin
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
});
