// Verifies that an incoming request carries a real Supabase session belonging
// to an admin. Used by the checkout functions to safely allow an admin-only
// "test amount" override without opening that door to regular customers.
// These functions are deployed with --no-verify-jwt (guest checkout must
// work with no session at all), so this check is done in code, not by the
// platform gateway.
import { createClient } from "npm:@supabase/supabase-js@2";

export async function isAdminRequest(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return false;

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const authedClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data: userData, error: userErr } = await authedClient.auth.getUser();
  if (userErr || !userData?.user) return false;

  const { data: profile } = await authedClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  return profile?.role === "admin";
}
