#!/usr/bin/env node
// The homepage hero image (LCP element) is admin-configurable content that
// only becomes known once React mounts and fetches `content` from Supabase
// — so today the browser can't even start requesting it until the JS bundle
// has downloaded, parsed, run, AND a network round-trip has completed. That
// serialized waterfall, not image weight, is the real cause of a slow LCP
// here (the current hero images are already small).
//
// Fix: bake a <link rel="preload"> for the CURRENT hero image into
// index.html at build time, so the browser starts fetching it immediately
// from the initial HTML parse — in parallel with the JS bundle — and it's
// already in cache by the time React asks for it. Self-healing: if the
// admin changes the hero image later without a redeploy, this preload just
// becomes a harmless no-op hint for the old URL until the next build; it
// never breaks anything, it can only fail to help.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { loadSupabaseEnv } from "./supabaseEnv.mjs";

const START = "<!-- HERO_PRELOAD_START -->";
const END = "<!-- HERO_PRELOAD_END -->";

function preloadTag(href, media) {
  return `<link rel="preload" as="image" href="${href}" media="${media}" fetchpriority="high" />`;
}

async function main() {
  const { url, key } = loadSupabaseEnv();
  let desktopUrl = "";
  let mobileUrl = "";

  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const { data, error } = await supabase.from("content").select("data").eq("id", 1).single();
      if (error) throw error;
      const c = data?.data || {};
      const desktopImages = c.heroImages && c.heroImages.length ? c.heroImages : (c.heroImage ? [c.heroImage] : []);
      const mobileImages = c.heroImagesMobile && c.heroImagesMobile.length ? c.heroImagesMobile : desktopImages;
      desktopUrl = desktopImages[0] || "";
      mobileUrl = mobileImages[0] || "";
    } catch (e) {
      console.warn("[hero-preload] Supabase fetch failed, skipping preload injection:", e.message);
    }
  } else {
    console.warn("[hero-preload] Supabase env vars not available, skipping preload injection.");
  }

  const tags = [];
  if (desktopUrl) tags.push(preloadTag(desktopUrl, "(min-width: 768px)"));
  // Only add a separate mobile tag when it's actually a different image —
  // otherwise the desktop tag alone (with no media condition needed) would
  // do, but keeping both conditioned tags is simplest and still correct:
  // a browser never matches more than one media condition pair here since
  // they're mutually exclusive breakpoints.
  if (mobileUrl) tags.push(preloadTag(mobileUrl, "(max-width: 767px)"));

  const block = tags.length ? `${START}\n    ${tags.join("\n    ")}\n    ${END}` : `${START}${END}`;

  const html = readFileSync("index.html", "utf8");
  const re = new RegExp(`${START}[\\s\\S]*?${END}`);
  const next = re.test(html)
    ? html.replace(re, block)
    : html.replace("</title>", `</title>\n    ${block}`);

  writeFileSync("index.html", next, "utf8");
  console.log(`[hero-preload] ${tags.length ? `injected ${tags.length} preload link(s)` : "no hero image configured, cleared preload block"}.`);
}

main().catch((e) => {
  console.error("[hero-preload] unexpected failure, continuing build without touching index.html:", e);
  process.exit(0); // never block npm run build over this optimization
});
