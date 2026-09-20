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
// A preload hint with fetchpriority=high is a promise the file is worth
// racing ahead of everything else — for anything this big it's actively
// harmful (it wins bandwidth exactly when that's the wrong call), so this
// guards against ever preloading an oversized/legacy asset at high
// priority. Product uploads get client-side compressed before reaching
// storage (see imageCompress.js) and land well under this; anything over
// it is almost certainly an old file from before that pipeline existed.
const MAX_PRELOAD_BYTES = 600 * 1024;

async function checkSize(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    const len = Number(res.headers.get("content-length") || 0);
    return len || null;
  } catch {
    return null;
  }
}

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
      // Mirrors Home.jsx exactly: the legacy single-image `heroImage` field
      // is deliberately never used as a fallback (see Home.jsx's comment) —
      // preloading it would just waste bandwidth on an image that's never
      // actually rendered.
      const desktopImages = c.heroImages && c.heroImages.length ? c.heroImages : [];
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
  if (desktopUrl) {
    const size = await checkSize(desktopUrl);
    if (size !== null && size > MAX_PRELOAD_BYTES) {
      console.warn(`[hero-preload] desktop hero image is ${(size / 1024 / 1024).toFixed(2)}MB — skipping high-priority preload (likely an old, uncompressed upload; consider replacing it via the admin panel).`);
    } else {
      tags.push(preloadTag(desktopUrl, "(min-width: 768px)"));
    }
  }
  // Only add a separate mobile tag when it's actually a different image —
  // otherwise the desktop tag alone (with no media condition needed) would
  // do, but keeping both conditioned tags is simplest and still correct:
  // a browser never matches more than one media condition pair here since
  // they're mutually exclusive breakpoints.
  if (mobileUrl && mobileUrl !== desktopUrl) {
    const size = await checkSize(mobileUrl);
    if (size !== null && size > MAX_PRELOAD_BYTES) {
      console.warn(`[hero-preload] mobile hero image is ${(size / 1024 / 1024).toFixed(2)}MB — skipping high-priority preload.`);
    } else {
      tags.push(preloadTag(mobileUrl, "(max-width: 767px)"));
    }
  } else if (mobileUrl === desktopUrl && tags.length) {
    tags.push(preloadTag(mobileUrl, "(max-width: 767px)"));
  }

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
