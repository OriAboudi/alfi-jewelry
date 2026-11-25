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
  bfTitle: "BLACK FRIDAY",
  bfHeadline: "המבצע הגדול של השנה",
  bfSubtitle: "הנחות על תכשיטי כסף 925 נבחרים — לזמן מוגבל בלבד.",
  bfBarText: "המבצע הגדול של השנה כבר כאן",
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
};

export const CTA_TARGETS = [
  { id: "deal", name: "עמוד המבצע (פריטים שמשתתפים במבצע)" },
  { id: "catalog", name: "כל התכשיטים" },
  { id: "sets", name: "סטים" },
  { id: "collections", name: "קולקציות" },
];

const str = (v, d) => (v == null || String(v).trim() === "" ? d : String(v));
const bool = (v, d) => (v == null ? d : v !== false);
const time = (v) => {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
};

// The campaign settings merged with defaults, plus whether it is live `now`.
// status: "off" | "scheduled" (enabled, starts later) | "live" | "ended".
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
  return {
    enabled,
    status,
    active: status === "live",
    startAt,
    endAt,
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
    showBadges: bool(c.bfShowBadges, D.bfShowBadges),
    showFab: bool(c.bfShowFab, D.bfShowFab),
    modalDelay: Math.max(0, Math.min(60, Number(c.bfModalDelaySeconds ?? D.bfModalDelaySeconds) || 0)),
    // Changes whenever the admin launches a different campaign, so a
    // visitor who closed last campaign's pop-up still sees the new one.
    key: [c.bfTitle || "", c.bfStartAt || "", c.bfEndAt || ""].join("|"),
  };
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

// Remaining time split for the countdown. null when there's no end.
export function timeLeft(endAt, now = Date.now()) {
  if (!endAt) return null;
  const ms = Math.max(0, endAt - now);
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

// Once a day per campaign: the pop-up opens by itself at most once a day.
const SEEN_KEY = "alfi:campaignSeen";
const today = () => new Date().toISOString().slice(0, 10);
export function campaignSeenToday(key) {
  try { return localStorage.getItem(SEEN_KEY) === `${key}#${today()}`; } catch { return false; }
}
export function markCampaignSeen(key) {
  try { localStorage.setItem(SEEN_KEY, `${key}#${today()}`); } catch { /* ignore */ }
}
const FAB_KEY = "alfi:campaignFabHidden";
export function campaignFabHidden(key) {
  try { return sessionStorage.getItem(FAB_KEY) === key; } catch { return false; }
}
export function hideCampaignFab(key) {
  try { sessionStorage.setItem(FAB_KEY, key); } catch { /* ignore */ }
}
