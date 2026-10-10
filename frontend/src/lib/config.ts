/**
 * Centralized API configuration.
 * All API URL references should import from here.
 *
 * Empty string means same-origin: requests go to `/api/...` on this
 * origin and are proxied to the backend by the Route Handler in
 * `src/app/api/[[...path]]/route.ts`.
 *
 * Chrome blocks third-party cookies across *.vercel.app sites.
 */
export const API_URL = "";
