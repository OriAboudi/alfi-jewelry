// Seasonal campaign (Black Friday and the like) — every setting lives in the
// site `content` row (keys prefixed `bf`), edited from the admin's
// "קמפיין" tab. Nothing here changes a price: the campaign is presentation
// only and sends shoppers to the real discounts that already exist — sale
// prices (compare_at_price) and the deal (in_bundle) — so what it promises
// is always what the cart and create-takbull-payment charge.
import { saleInfo } from "./pricing.js";

// Copy used when the admin hasn't written their own — the campaign still
// starts switched off (bfEnabled false), so none of this is ever shown
// unless the admin turns it on.
export const CAMPAIGN_DEFAULTS = {
  bfEnabled: false,
  bfStartAt: "",
  bfEndAt: "",
  bfTeaser: true,
  bfTitle: "BLACK FRIDAY",
  bfHeadline: "יש דברים שפשוט כיף לבחור לעצמך ♡",
  bfSubtitle: "הנחות על תכשיטי כסף 925 נבחרים — לזמן מוגבל בלבד.",
  bfBarText: "יש דברים שפשוט כיף לבחור לעצמך ♡",
  bfCtaLabel: "לכל המבצעים",
  bfCtaTarget: "deal",
  bfBadgeLabel: "BLACK FRIDAY",
  bfImage: "",
  bfShowBar: true,
  bfShowModal: true,
  bfShowHome: true,
  bfShowBadges: true,
  bfShowFab: true,
  bfModalDelaySeconds: 3,
  bfModalFrequency: "visit",
};

export const CTA_TARGETS = [
  { id: "deal", name: "עמוד המבצע (פריטים שמשתתפים במבצע)" },
  { id: "catalog", name: "כל התכשיטים" },
  { id: "sets", name: "סטים" },
  { id: "collections", name: "קולקציות" },
];

export const MODAL_FREQUENCIES = [
  { id: "visit", name: "בכל כניסה לאתר" },
  { id: "day", name: "פעם ביום" },
];

const str = (v, d) => (v == null || String(v).trim() === "" ? d : String(v));
const bool = (v, d) => (v == null ? d : v !== false);
const time = (v) => {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
};
const dayMonth = (t) => { const d = new Date(t); return `${d.getDate()}.${d.getMonth() + 1}`; };

// The campaign settings merged with defaults, plus where it stands `now`.
// status: "off" | "scheduled" (enabled, starts later) | "live" | "ended".
// phase (what the storefront shows): null | "teaser" (before the start,
// "27.11 →" and a countdown to it) | "live" (the sale itself).
export function campaignConfig(content, now = Date.now()) {
  const c = content || {};
  const D = CAMPAIGN_DEFAULTS;
  const startAt = time(c.bfStartAt);
  const endAt = time(c.bfEndAt);
  const enabled = c.bfEnabled === true;
  let status = "off";
  if (enabled) {
    if (startAt && now < startAt) status = "scheduled";
    else if (endAt && now >= endAt) status = "ended";
    else status = "live";
  }
  const teaser = bool(c.bfTeaser, D.bfTeaser);
  const phase = status === "live" ? "live" : status === "scheduled" && teaser ? "teaser" : null;
  return {
    enabled,
    status,
    phase,
    // Anything of the campaign is on screen (the sale or its teaser).
    active: phase !== null,
    teaser,
    startAt,
    endAt,
    // The countdown runs to the start during the teaser, to the end after.
    countdownTo: phase === "teaser" ? startAt : endAt,
    startLabel: startAt ? dayMonth(startAt) : "",
    title: str(c.bfTitle, D.bfTitle),
    headline: str(c.bfHeadline, D.bfHeadline),
    subtitle: str(c.bfSubtitle, D.bfSubtitle),
    barText: str(c.bfBarText, D.bfBarText),
    ctaLabel: str(c.bfCtaLabel, D.bfCtaLabel),
    ctaTarget: CTA_TARGETS.some((t) => t.id === c.bfCtaTarget) ? c.bfCtaTarget : D.bfCtaTarget,
    badgeLabel: str(c.bfBadgeLabel, D.bfBadgeLabel),
    image: str(c.bfImage, ""),
    showBar: bool(c.bfShowBar, D.bfShowBar),
    showModal: bool(c.bfShowModal, D.bfShowModal),
    showHome: bool(c.bfShowHome, D.bfShowHome),
    // Badges mark discounted pieces — only once the sale itself is on.
    showBadges: bool(c.bfShowBadges, D.bfShowBadges) && phase === "live",
    showFab: bool(c.bfShowFab, D.bfShowFab),
    modalDelay: Math.max(0, Math.min(60, Number(c.bfModalDelaySeconds ?? D.bfModalDelaySeconds) || 0)),
    modalFrequency: MODAL_FREQUENCIES.some((f) => f.id === c.bfModalFrequency) ? c.bfModalFrequency : D.bfModalFrequency,
    // Changes with a new campaign and between teaser and sale, so a visitor
    // who closed the teaser still sees the sale open on the day.
    key: [c.bfTitle || "", c.bfStartAt || "", c.bfEndAt || "", phase || ""].join("|"),
  };
}

// The same settings shown as if live — the admin tab's previews.
export function previewConfig(content, phase) {
  const cfg = campaignConfig({ ...content, bfEnabled: true });
  const p = phase || cfg.phase || "live";
  return { ...cfg, phase: p, active: true, status: p === "teaser" ? "scheduled" : "live", countdownTo: p === "teaser" ? cfg.startAt : cfg.endAt, showBadges: p === "live" };
}

// The products a campaign actually discounts: on sale, or in the deal —
// in stock only. Biggest saving first.
export function campaignProducts(products) {
  return (products || [])
    .filter((p) => Number(p.stock) > 0 && (p.in_bundle || saleInfo(p).onSale))
    .sort((a, b) => saleInfo(b).percent - saleInfo(a).percent);
}

export function isCampaignProduct(p) {
  return !!p && (p.in_bundle || saleInfo(p).onSale);
}

// Remaining time split for the countdown. null when there's no target.
export function timeLeft(target, now = Date.now()) {
  if (!target) return null;
  const ms = Math.max(0, target - now);
  const s = Math.floor(ms / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, done: ms === 0 };
}

// <input type="datetime-local"> works in local wall-clock time without a
// zone; content stores an ISO instant. These two convert between them.
export function toLocalInput(iso) {
  const t = time(iso);
  if (!t) return "";
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function fromLocalInput(v) {
  if (!v) return "";
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? new Date(t).toISOString() : "";
}

// When the pop-up may open by itself: once per visit (tab session) or once
// a day, per campaign phase.
const SEEN_KEY = "alfi:campaignSeen";
const today = () => new Date().toISOString().slice(0, 10);
export function campaignSeen(key, frequency) {
  try {
    if (frequency === "day") return localStorage.getItem(SEEN_KEY) === `${key}#${today()}`;
    return sessionStorage.getItem(SEEN_KEY) === key;
  } catch { return false; }
}
export function markCampaignSeen(key) {
  try {
    localStorage.setItem(SEEN_KEY, `${key}#${today()}`);
    sessionStorage.setItem(SEEN_KEY, key);
  } catch { /* ignore */ }
}
// The admin tab's "show it to me again" — forgets both.
export function resetCampaignSeen() {
  try { localStorage.removeItem(SEEN_KEY); sessionStorage.removeItem(SEEN_KEY); sessionStorage.removeItem(FAB_KEY); } catch { /* ignore */ }
}
const FAB_KEY = "alfi:campaignFabHidden";
export function campaignFabHidden(key) {
  try { return sessionStorage.getItem(FAB_KEY) === key; } catch { return false; }
}
export function hideCampaignFab(key) {
  try { sessionStorage.setItem(FAB_KEY, key); } catch { /* ignore */ }
}
