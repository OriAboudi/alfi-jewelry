#!/usr/bin/env node
// Build-time sitemap generator, run automatically before `vite build` via
// the "prebuild" npm script. Writes public/sitemap.xml, which Vite then
// copies verbatim into dist/ like every other public/ asset.
//
// Real product URLs need real product ids/names/categories, which only live
// in Supabase — not known at static-file-authoring time — so this fetches
// them directly with @supabase/supabase-js (already a project dependency)
// using the same VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY env vars the app
// itself uses. Netlify's build injects those directly into process.env (no
// .env file exists there — it's gitignored); local `node` runs don't
// auto-load .env the way `vite`/`vite build` do, so this loads it by hand,
// but ONLY when the file exists and the vars aren't already set — never via
// Node's --env-file flag, which hard-errors when the file is missing
// (exactly the Netlify case).
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { loadSupabaseEnv } from "./supabaseEnv.mjs";

const SITE = "https://alfi-jewelry.com";

function slugify(str) {
  return String(str || "").trim().replace(/\s+/g, "-").replace(/["'/?#%\\]/g, "");
}

function urlEntry(path) {
  return `  <url><loc>${SITE}${encodeURI(path)}</loc></url>`;
}

async function main() {
  const { url, key } = loadSupabaseEnv();

  const staticPages = [
    "/",
    "/קטלוג",
    "/קולקציות",
    "/הסיפור-שלנו",
    "/צור-קשר",
    "/משלוחים-והחזרות",
    "/מדיניות-פרטיות",
    "/תנאי-שימוש",
  ];

  let products = [];
  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const { data, error } = await supabase.from("products").select("id,name,category");
      if (error) throw error;
      products = data || [];
    } catch (e) {
      console.warn("[sitemap] Supabase fetch failed, writing static-only sitemap:", e.message);
    }
  } else {
    console.warn("[sitemap] Supabase env vars not available, writing static-only sitemap.");
  }

  const liveCategories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
  const categoryPages = liveCategories.map((c) => `/${c}`);
  const productPages = products.map((p) => `/מוצר/${p.id}-${slugify(p.name)}`);

  const allUrls = [...staticPages, ...categoryPages, ...productPages];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allUrls.map(urlEntry).join("\n")}\n</urlset>\n`;

  writeFileSync("public/sitemap.xml", xml, "utf8");
  console.log(`[sitemap] wrote public/sitemap.xml with ${allUrls.length} URLs (${staticPages.length} static, ${categoryPages.length} categories, ${productPages.length} products).`);
}

main().catch((e) => {
  console.error("[sitemap] unexpected failure, continuing build without a fresh sitemap:", e);
  process.exit(0); // never block npm run build over a sitemap-script bug
});
