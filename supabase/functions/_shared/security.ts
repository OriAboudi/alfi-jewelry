// Security helpers shared by the public (guest-callable, --no-verify-jwt)
// Edge Functions. See supabase/owasp-remediation.sql for the DB side.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

// An error whose message is safe (and intended) to show the shopper, e.g.
// "אזל במלאי". Anything else thrown inside a function — Postgres/PostgREST
// errors, network failures — may carry schema/table/constraint details, so
// callers return a generic message for those instead of e.message.
export class PublicError extends Error {}

export function publicMessage(e: unknown, fallback: string) {
  return e instanceof PublicError ? e.message : fallback;
}

// Cryptographically secure random choice. Math.random() is not — its
// output is predictable from a handful of observed values, which matters
// for anything that acts as a bearer secret (coupon codes).
export function secureRandomString(alphabet: string, length: number) {
  // Rejection sampling so every character is equally likely.
  const limit = 256 - (256 % alphabet.length);
  let out = "";
  const buf = new Uint8Array(length * 2);
  while (out.length < length) {
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b < limit) out += alphabet[b % alphabet.length];
      if (out.length === length) break;
    }
  }
  return out;
}

export function secureRandomInt(maxExclusive: number) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % maxExclusive;
}

// Best-effort client IP. Supabase's gateway sets x-forwarded-for; the first
// entry is the original client. It can be spoofed by a determined caller,
// which is why sensitive endpoints ALSO rate-limit on the target itself
// (the phone number / coupon code being tried), which can't be spoofed.
export function clientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for") || "";
  return (req.headers.get("cf-connecting-ip") || xff.split(",")[0] || "unknown").trim();
}

// Returns true when the caller is within the limit. Fails OPEN if the
// check_rate_limit RPC is missing or errors (e.g. the SQL migration hasn't
// been run yet) — a broken limiter must never take checkout down with it.
export async function withinRateLimit(supabase: SupabaseClient, key: string, limit: number, windowSeconds: number) {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("rate limit check failed (failing open)", key, error.message);
    return true;
  }
  return data !== false;
}

// Allowlist of storefront origins that may receive the post-payment
// redirect. Built from SITE_URL (already required for email links) plus an
// optional comma-separated ALLOWED_ORIGINS secret (e.g. a Netlify preview
// URL or http://localhost:5173 for local testing).
export function allowedOrigins() {
  const list = [Deno.env.get("SITE_URL") || "", ...(Deno.env.get("ALLOWED_ORIGINS") || "").split(",")]
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  return new Set(list);
}

// The origin to send the shopper back to after payment. Never trust the
// request's Origin header on its own: anyone can call this function with
// `Origin: https://evil.example`, then hand a victim the resulting (genuine)
// Takbull payment link — after paying they'd land on the attacker's site.
export function trustedReturnOrigin(req: Request) {
  const allowed = allowedOrigins();
  const origin = (req.headers.get("origin") || "").replace(/\/+$/, "");
  if (allowed.has(origin)) return origin;
  const site = (Deno.env.get("SITE_URL") || "").replace(/\/+$/, "");
  if (site) return site;
  // No SITE_URL configured at all: keep the old behaviour rather than
  // breaking checkout, but make it loud in the logs.
  console.warn("SITE_URL not set — falling back to request Origin for the payment redirect; set SITE_URL to close this");
  return origin;
}

export function cleanString(v: unknown, maxLen: number) {
  return String(v ?? "").trim().slice(0, maxLen);
}
