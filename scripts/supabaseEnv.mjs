// Shared by every prebuild script that needs live Supabase data at build
// time. Netlify's build injects VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY
// directly into process.env (no .env file exists there — it's gitignored);
// plain `node` runs locally don't auto-load .env the way `vite` does, so
// this loads it by hand, but ONLY when the file exists and the vars aren't
// already set — never via Node's --env-file flag, which hard-errors when
// the file is missing (exactly the Netlify case).
import { readFileSync, existsSync } from "node:fs";

export function loadSupabaseEnv() {
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    if (existsSync(".env")) {
      for (const line of readFileSync(".env", "utf8").split("\n")) {
        const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = (m[2] || "").replace(/^["']|["']$/g, "");
      }
    }
  }
  return { url: process.env.VITE_SUPABASE_URL, key: process.env.VITE_SUPABASE_ANON_KEY };
}
