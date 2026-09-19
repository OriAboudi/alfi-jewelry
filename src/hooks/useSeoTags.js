import { useEffect } from "react";

const SITE = "https://alfi-jewelry.com";

function upsertMeta(attr, key, value) {
  const selector = `meta[${attr}="${key}"]`;
  const existing = document.head.querySelector(selector);
  if (!value) {
    if (existing) existing.remove();
    return;
  }
  const el = existing || document.head.appendChild(document.createElement("meta"));
  el.setAttribute(attr, key);
  el.setAttribute("content", value);
}

function upsertLink(rel, href) {
  const selector = `link[rel="${rel}"]`;
  const existing = document.head.querySelector(selector);
  if (!href) {
    if (existing) existing.remove();
    return;
  }
  const el = existing || document.head.appendChild(document.createElement("link"));
  el.setAttribute("rel", rel);
  el.setAttribute("href", href);
}

function setJsonLd(data) {
  const items = !data ? [] : Array.isArray(data) ? data : [data];
  const existing = document.head.querySelectorAll('script[data-seo-id^="seo-jsonld-"]');
  existing.forEach((node) => node.remove());
  items.forEach((item, i) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo-id", `seo-jsonld-${i}`);
    script.textContent = JSON.stringify(item);
    document.head.appendChild(script);
  });
}

/**
 * useSeoTags — imperative <head> tag manager for this SPA (no react-helmet;
 * the app has no SSR, so plain DOM upserts in an effect are all that's
 * needed). Call once per content screen. Tags are upserted/removed in place
 * so navigating between screens never leaves stale tags from the previous
 * one — JSON-LD in particular is fully replaced every time via a stable
 * data-seo-id marker.
 */
export function useSeoTags({ title, description, canonical, image, type = "website", noindex = false, jsonLd } = {}) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (title) document.title = title;

    const canonicalUrl = canonical ? (canonical.startsWith("http") ? canonical : SITE + canonical) : null;
    const imageUrl = image ? (image.startsWith("http") ? image : SITE + image) : null;

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex" : null);
    upsertLink("canonical", canonicalUrl);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);
    setJsonLd(jsonLd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, canonical, image, type, noindex, JSON.stringify(jsonLd)]);
}
