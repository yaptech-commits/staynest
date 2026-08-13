import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the __Host- state
// cookie, and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns void by design, so there is no URL to
// stash across renders.
export const startLogin = () => {
  try {
    const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "https://manus.im";
    const appId = import.meta.env.VITE_APP_ID || "staynest";
    const redirectUri = `${window.location.origin}/api/oauth/callback`;

    const nonce = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    try {
      document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=Lax; Secure`;
    } catch (cookieErr) {
      console.warn("OAuth state cookie write warning:", cookieErr);
    }
    const state = encodeOAuthState({ redirectUri, nonce });

    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    window.location.href = url.toString();
  } catch (err) {
    console.error("Failed to start login redirection:", err);
    window.location.href = "/onboarding";
  }
};
