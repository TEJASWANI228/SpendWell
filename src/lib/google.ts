import type { GoogleProfileInput } from '@/api/types';

/**
 * Google Identity Services integration.
 *
 * When VITE_GOOGLE_CLIENT_ID is configured we use Google's OAuth2 token client
 * to open the real account chooser and fetch the user's basic profile. Without
 * a client id the app falls back to the mock Google account so the flow is
 * still usable in local/demo mode.
 */

const SCRIPT_ID = 'google-identity-services';
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleErrorResponse {
  type?: string;
  message?: string;
}

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  prompt?: string;
  ux_mode?: 'popup' | 'redirect';
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: GoogleErrorResponse) => void;
}

interface GoogleTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
}

interface GoogleAccounts {
  oauth2?: GoogleOAuth2;
}

interface GoogleApi {
  accounts?: GoogleAccounts;
}

declare global {
  interface Window {
    google?: GoogleApi;
  }
}

let scriptLoader: Promise<void> | null = null;

export function googleClientId(): string | null {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  return clientId ? clientId : null;
}

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptLoader) return scriptLoader;

  scriptLoader = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Could not load Google sign-in. Try again.')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoader = null;
      reject(new Error('Could not load Google sign-in. Check your connection and try again.'));
    };
    document.head.appendChild(script);
  });

  return scriptLoader;
}

async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfileInput> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Could not load your Google profile. Try again.');
  }
  const profile = (await response.json()) as {
    sub?: string;
    name?: string;
    email?: string;
    picture?: string;
  };
  if (!profile.email) {
    throw new Error('Google did not share an email address. Try another account.');
  }
  return {
    googleId: profile.sub,
    name: profile.name ?? profile.email.split('@')[0] ?? 'Friend',
    email: profile.email,
    avatarUrl: profile.picture ?? null,
  };
}

export async function signInWithGoogle(): Promise<GoogleProfileInput> {
  const clientId = googleClientId();
  if (!clientId) {
    throw new Error('Google sign-in is not configured.');
  }

  await loadGoogleScript();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error('Google sign-in is unavailable right now. Try again.');
  }

  const accessToken = await new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      prompt: 'select_account',
      ux_mode: 'popup',
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(
            new Error(
              response.error_description ?? 'Google sign-in was cancelled. Please try again.',
            ),
          );
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(error.message ?? 'Google sign-in was cancelled. Please try again.'));
      },
    });
    client.requestAccessToken();
  });

  return fetchGoogleProfile(accessToken);
}
