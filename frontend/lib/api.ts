import axios from "axios";

/**
 * Centralised axios instance for all PrepForge API calls.
 * The Clerk JWT is injected per-request in the useApi hook (see lib/useApi.ts).
 * Never call axios directly — always use this instance so headers are consistent.
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});
