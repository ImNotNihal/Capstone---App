/**
 * Shared runtime configuration.
 *
 * All public environment variables must be prefixed with EXPO_PUBLIC_ so that
 * the Expo bundler inlines them at build time.  Copy .env.example to .env and
 * fill in the values before starting the development server.
 */

/**
 * Base URL for the backend REST/WebSocket API.
 * Falls back to the production cloud deployment when no env var is set.
 */
export const API_BASE_URL: string =
    (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/?$/, "/") ||
    "https://smart-doorlock-server-851342133148.europe-west1.run.app/";
