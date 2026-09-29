// Per-history-entry memory, so Back/Forward (browser button, Android back,
// iOS edge swipe) return to exactly where the shopper was: the same scroll
// offset and the same catalog filters, instead of the top of a reset page.
//
// Every entry this app pushes carries { k: <key>, d: <depth> } in
// history.state. Scroll offsets and small UI state are kept per key in
// memory and mirrored to sessionStorage (survives a reload of the tab, never
// shared with other tabs or visits).
import { useEffect, useState } from "react";

const STORE_KEY = "alfi:nav";
const MAX_ENTRIES = 60;

const newKey = () => Math.random().toString(36).slice(2, 10);

let mem = {};
try { mem = JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}") || {}; } catch { mem = {}; }

const persist = () => {
  const keys = Object.keys(mem);
  if (keys.length > MAX_ENTRIES) {
    keys.sort((a, b) => (mem[a].t || 0) - (mem[b].t || 0));
    for (const k of keys.slice(0, keys.length - MAX_ENTRIES)) delete mem[k];
  }
  try { sessionStorage.setItem(STORE_KEY, JSON.stringify(mem)); } catch { /* ignore */ }
};
const entry = (k) => (mem[k] ||= { t: Date.now() });

// The entry currently on screen. Tracked here rather than read from
// history.state, because by the time a popstate fires the browser has
// already switched history.state to the entry being navigated TO.
let activeKey = null;
let savedForKey = null;

// Give the entry the page was loaded on a key (no new entry is created).
export function initNavMemory() {
  if (typeof window === "undefined") return;
  const st = window.history.state;
  if (st && st.k) { activeKey = st.k; return; }
  activeKey = newKey();
  window.history.replaceState({ ...(st || {}), k: activeKey, d: 0 }, "");
}

// Call BEFORE an in-app navigation scrolls the page to the top, so the
// entry being left remembers its real offset.
export function rememberScroll() {
  if (!activeKey || typeof window === "undefined") return;
  entry(activeKey).y = window.scrollY;
  savedForKey = activeKey;
  persist();
}

// carryUi: the new entry starts with the current one's UI state (a
// category switch inside the catalog keeps the sort/material filters).
export function pushEntry(path, { carryUi = false } = {}) {
  if (savedForKey !== activeKey) rememberScroll();
  const d = (window.history.state?.d || 0) + 1;
  const prevUi = activeKey && mem[activeKey]?.ui;
  activeKey = newKey();
  if (carryUi && prevUi) entry(activeKey).ui = { ...prevUi };
  savedForKey = null;
  window.history.pushState({ k: activeKey, d }, "", path);
}

// popstate: record where the page being left was, switch to the entry now
// shown, and return the offset to restore there (0 when unknown).
export function onPopEntry() {
  if (activeKey && savedForKey !== activeKey) {
    entry(activeKey).y = window.scrollY;
    persist();
  }
  const st = window.history.state;
  activeKey = st?.k || null;
  savedForKey = null;
  return (activeKey && mem[activeKey]?.y) || 0;
}

// True when the previous history entry is a page of this app (so
// history.back() is a safe "back to where you were" link).
export function hasInAppBack() {
  return typeof window !== "undefined" && (window.history.state?.d || 0) > 0;
}

// Scroll to y once the page is tall enough to have it — screens re-render
// right after popstate, and images/sections may still be settling.
export function restoreScroll(y) {
  if (typeof window === "undefined") return;
  if (!y) { window.scrollTo(0, 0); return; }
  let tries = 0;
  const attempt = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.min(y, Math.max(0, max)));
    if (max < y && tries++ < 20) setTimeout(attempt, 50);
  };
  requestAnimationFrame(attempt);
}

// useState that belongs to the current history entry: going Back to this
// entry brings the value back (e.g. the catalog's sort/material filters).
export function useEntryState(name, initial) {
  const [value, setValue] = useState(() => {
    const v = activeKey && mem[activeKey]?.ui?.[name];
    return v === undefined ? initial : v;
  });
  useEffect(() => {
    if (!activeKey) return;
    const e = entry(activeKey);
    e.ui = { ...(e.ui || {}), [name]: value };
    persist();
  }, [name, value]);
  return [value, setValue];
}
