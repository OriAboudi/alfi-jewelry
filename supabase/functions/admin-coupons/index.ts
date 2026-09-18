// Supabase Edge Function: admin-coupons
//
// Admin-only (isAdminRequest), deployed --no-verify-jwt like every other
// function here. Coupons have no client-facing RLS policy at all (see
// add-signup-coupons.sql) since they carry customer PII, so even the admin
// panel reads/writes them through this function rather than sb.from(...).
// Handles both listing (paginated) and voiding via a body.action
// discriminator, to avoid deploying a separate function per action.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { isAdminRequest } from "../_shared/adminAuth.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!(await isAdminRequest(req))) return json({ error: "אין הרשאה" });

    const body = await req.json();
    const action = body?.action || "list";

    if (action === "void") {
      const { id } = body;
      if (!id) return json({ error: "מזהה קופון חסר" });
      const { data, error } = await supabase
        .from("coupons")
        .update({ status: "void" })
        .eq("id", id)
        .eq("status", "active")
        .select()
        .single();
      if (error) throw error;
      return json({ coupon: data });
    }

    // list
    const { page = 1, pageSize = 20 } = body || {};
    const from = (page - 1) * pageSize;
    const { data, error, count } = await supabase
      .from("coupons")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    return json({ rows: data || [], count: count || 0 });
  } catch (e) {
    console.error(e);
    return json({ error: e.message || "פעולת הקופונים נכשלה" });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
