import React, { useEffect, useState } from "react";
import { useStore } from "../context/StoreContext.jsx";
import { useDialog } from "../hooks/useDialog.js";
import { pathFor, DEAL_FILTER, pageHidden } from "../lib/routes.js";
import { saleInfo, soldAlone } from "../lib/pricing.js";
import { PriceTag } from "./PriceTag.jsx";
import { CardSlider } from "./CardSlider.jsx";
import { RedesignProductCard } from "./RedesignProductCard.jsx";
import {
  campaignConfig, campaignProducts, timeLeft,
  campaignSeenToday, markCampaignSeen, campaignFabHidden, hideCampaignFab,
} from "../lib/campaign.js";

/**
 * Seasonal campaign (Black Friday…) — silver on black, the one moment the
 * site leaves its cream/plum palette. Five placements, each switchable in
 * the admin "קמפיין" tab:
 *   CampaignBar   — slim strip under the header, every storefront page
 *   CampaignModal — full-screen takeover, opens by itself once a day
 *   CampaignFab   — floating reminder (bottom-right) after the pop-up closed
 *   CampaignHome  — black hero section at the top of the home page
 *   (card badges live in RedesignProductCard)
 * Settings and copy: src/lib/campaign.js. It never changes prices — it
 * points at the sale prices and deal that already exist.
 */

// Pages where nothing of the campaign opens or floats by itself: around
// payment, the account and admin. (The bar still shows on browse pages.)
const QUIET_SCREENS = new Set(["checkout", "confirm", "payment-failed", "status", "loading", "my-orders", "admin", "admin-login"]);
// The floating pill would sit on the mobile sticky add-to-cart / pay bars.
const NO_FAB_SCREENS = new Set([...QUIET_SCREENS, "product", "cart", "set"]);

/* ---------- shared bits ---------- */

function useNow(enabled, ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return undefined;
    const iv = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(iv);
  }, [enabled, ms]);
  return now;
}

const pad = (n) => String(n).padStart(2, "0");

export function Countdown({ endAt, size = "md", className = "" }) {
  const now = useNow(!!endAt);
  const t = timeLeft(endAt, now);
  if (!t) return null;
  const parts = [
    ...(t.days > 0 ? [[t.days, t.days === 1 ? "יום" : "ימים"]] : []),
    [t.hours, "שעות"],
    [t.minutes, "דקות"],
    [t.seconds, "שניות"],
  ];
  const spoken = `נותרו ${t.days > 0 ? `${t.days} ימים, ` : ""}${t.hours} שעות ו־${t.minutes} דקות`;
  if (size === "sm") {
    return (
      <span className={`bf-cd-sm ${className}`} role="timer" aria-label={spoken}>
        <span aria-hidden="true" dir="ltr">
          {t.days > 0 && <>{t.days}<small>d</small> </>}
          {pad(t.hours)}:{pad(t.minutes)}:{pad(t.seconds)}
        </span>
      </span>
    );
  }
  return (
    <div className={`bf-cd bf-cd-${size} ${className}`} role="timer" aria-label={spoken}>
      {parts.map(([v, label], i) => (
        <React.Fragment key={label}>
          {i > 0 && <span className="bf-cd-colon" aria-hidden="true">:</span>}
          <span className="bf-cd-cell" aria-hidden="true">
            <span className="bf-cd-num">{pad(v)}</span>
            <span className="bf-cd-label">{label}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);

// Where the campaign's button leads. Falls back to the whole catalog when
// the target page is hidden (admin "עמודים באתר"), or for "deal" when no
// product is in the deal (an empty deal page sells nothing).
function useCampaignNav(cfg) {
  const { go, products, content } = useStore();
  const hasDeal = (products || []).some((p) => p.in_bundle && Number(p.stock) > 0);
  const unusable = pageHidden(content, cfg.ctaTarget) || (cfg.ctaTarget === "deal" && !hasDeal);
  const target = unusable ? "catalog" : cfg.ctaTarget;
  const href = target === "deal" ? pathFor("catalog", { catFilter: DEAL_FILTER })
    : target === "sets" ? pathFor("sets")
    : target === "collections" ? pathFor("collections")
    : pathFor("catalog", { catFilter: "הכל" });
  const navigate = () => {
    if (target === "deal") go("catalog", DEAL_FILTER);
    else if (target === "sets") go("sets");
    else if (target === "collections") go("collections");
    else go("catalog");
  };
  return { href, navigate };
}

function useMaxSale() {
  const { products, content } = useStore();
  return soldAlone(products || [], content)
    .filter((p) => Number(p.stock) > 0)
    .reduce((m, p) => Math.max(m, saleInfo(p).percent), 0);
}

// "BLACK FRIDAY" as two stacked words when it has two, in shimmering silver.
function SilverTitle({ text, as: Tag = "div", className = "", id }) {
  const words = String(text).trim().split(/\s+/);
  return (
    <Tag id={id} className={`bf-title ${className}`} dir="auto">
      {words.length === 2 ? <><span className="bf-silver">{words[0]}</span><span className="bf-silver">{words[1]}</span></> : <span className="bf-silver">{text}</span>}
    </Tag>
  );
}

const Sparkles = () => <span className="bf-sparkles" aria-hidden="true" />;

/* ---------- 1. top strip ---------- */

export function CampaignBar({ cfg: cfgProp, preview = false }) {
  const { campaign, screen, loaded } = useStore();
  const cfg = cfgProp || campaign;
  const { href, navigate } = useCampaignNav(cfg);
  if (!preview && (!loaded || !cfg.active || !cfg.showBar || QUIET_SCREENS.has(screen))) return null;
  return (
    <a
      href={href}
      onClick={(e) => { e.preventDefault(); if (!preview) navigate(); }}
      className="bf-bar"
      aria-label={`${cfg.title}: ${cfg.barText}. ${cfg.ctaLabel}`}
    >
      <Sparkles />
      <span className="bf-bar-title bf-silver" dir="ltr">{cfg.title}</span>
      <span className="bf-bar-dot" aria-hidden="true" />
      <span className="bf-bar-text">{cfg.barText}</span>
      {cfg.endAt && <span className="bf-bar-cd"><span className="bf-bar-cd-label">נגמר בעוד</span><Countdown endAt={cfg.endAt} size="sm" /></span>}
      <span className="bf-bar-cta">{cfg.ctaLabel}<Arrow /></span>
    </a>
  );
}

/* ---------- 2. full-screen takeover ---------- */

// Visual side of the pop-up / home section: the admin's image, or else a
// mosaic of the real discounted pieces (never a stock picture).
function CampaignVisual({ cfg, items, interactive = false }) {
  const { openProduct, products } = useStore();
  if (cfg.image) {
    return <div className="bf-visual bf-visual-img"><img src={cfg.image} alt="" decoding="async" /><span className="bf-visual-shade" /></div>;
  }
  const tiles = items.filter((p) => p.image).slice(0, 4);
  if (tiles.length < 2) {
    return (
      <div className="bf-visual bf-visual-empty" aria-hidden="true">
        <Sparkles />
        <span className="bf-visual-mark bf-silver">%</span>
      </div>
    );
  }
  return (
    <div className={`bf-visual bf-mosaic bf-mosaic-${tiles.length}`}>
      {tiles.map((p) => {
        const s = saleInfo(p);
        const inner = (
          <>
            <img src={p.image} alt={interactive ? p.name : ""} loading="lazy" decoding="async" />
            {s.onSale && <span className="bf-mosaic-pct">-{s.percent}%</span>}
            {interactive && <span className="bf-mosaic-cap"><span className="serif">{p.name}</span><PriceTag product={p} size={13} showPercent={false} /></span>}
          </>
        );
        return interactive ? (
          <a key={p.id} href={pathFor("product", { pid: p.id, products })} onClick={(e) => { e.preventDefault(); openProduct(p.id); }} className="bf-mosaic-tile">{inner}</a>
        ) : (
          <span key={p.id} className="bf-mosaic-tile">{inner}</span>
        );
      })}
    </div>
  );
}

export function CampaignModal() {
  const { campaign, campaignModalOpen, campaignPreview, openCampaignModal, closeCampaignModal, loaded, screen, isAdmin, products, content, signupPopupOpen, authDialog } = useStore();
  const previewCfg = campaignPreview ? { ...campaignConfig(campaignPreview), active: true, status: "live" } : null;
  const cfg = previewCfg || campaign;
  const { href, navigate } = useCampaignNav(cfg);
  const maxSale = useMaxSale();
  const items = campaignProducts(soldAlone(products || [], content));

  // Opens by itself once a day per campaign, a few seconds into the visit,
  // on browse pages only, never to the signed-in admin.
  useEffect(() => {
    if (!loaded || isAdmin || !campaign.active || !campaign.showModal) return undefined;
    if (QUIET_SCREENS.has(screen) || campaignModalOpen || signupPopupOpen || authDialog) return undefined;
    if (campaignSeenToday(campaign.key)) return undefined;
    const t = setTimeout(() => {
      if (openCampaignModal()) markCampaignSeen(campaign.key);
    }, campaign.modalDelay * 1000);
    return () => clearTimeout(t);
  }, [loaded, isAdmin, campaign.active, campaign.showModal, campaign.key, campaign.modalDelay, screen, campaignModalOpen, signupPopupOpen, authDialog, openCampaignModal]);

  const panelRef = useDialog(campaignModalOpen, closeCampaignModal, { initialFocus: ".bf-modal-cta" });
  if (!campaignModalOpen) return null;

  const shop = (e) => {
    e.preventDefault();
    closeCampaignModal();
    if (!previewCfg) navigate();
  };

  return (
    <div className="bf-modal-overlay" onClick={closeCampaignModal}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="bf-modal-title" dir="rtl" className="bf-modal" onClick={(e) => e.stopPropagation()}>
        <CampaignVisual cfg={cfg} items={items} />
        <div className="bf-modal-body">
          <Sparkles />
          <span className="bf-eyebrow">ALFI · לזמן מוגבל</span>
          <SilverTitle text={cfg.title} as="h2" id="bf-modal-title" className="bf-title-xl" />
          <p className="serif bf-headline">{cfg.headline}</p>
          {cfg.subtitle && <p className="bf-sub">{cfg.subtitle}</p>}
          {maxSale > 0 && <span className="bf-chip">עד {maxSale}% הנחה על פריטים נבחרים</span>}
          {cfg.endAt && <div className="bf-modal-cd"><span className="bf-cd-head">המבצע נגמר בעוד</span><Countdown endAt={cfg.endAt} size="md" /></div>}
          <a href={href} onClick={shop} className="bf-btn bf-modal-cta">{cfg.ctaLabel}<Arrow /></a>
          <button type="button" onClick={closeCampaignModal} className="bf-quiet">אולי אחר כך</button>
        </div>
        <button type="button" onClick={closeCampaignModal} aria-label="סגירה" className="bf-close"><span aria-hidden="true">×</span></button>
      </div>
    </div>
  );
}

/* ---------- 3. floating reminder ---------- */

export function CampaignFab() {
  const { campaign: cfg, campaignModalOpen, signupPopupOpen, authDialog, openCampaignModal, screen, loaded } = useStore();
  const { navigate } = useCampaignNav(cfg);
  // Content (and so the campaign key) arrives after mount: read per render.
  const [hiddenKey, setHiddenKey] = useState(null);
  const hidden = hiddenKey === cfg.key || campaignFabHidden(cfg.key);
  // Shows once the pop-up has had its moment (or if it's switched off).
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!cfg.active) return undefined;
    if (!cfg.showModal || campaignSeenToday(cfg.key)) { setReady(true); return undefined; }
    const iv = setInterval(() => { if (campaignSeenToday(cfg.key)) setReady(true); }, 1000);
    return () => clearInterval(iv);
  }, [cfg.active, cfg.showModal, cfg.key, campaignModalOpen]);

  if (!loaded || !cfg.active || !cfg.showFab || hidden || !ready) return null;
  if (campaignModalOpen || signupPopupOpen || authDialog || NO_FAB_SCREENS.has(screen)) return null;

  const open = () => { if (!cfg.showModal || !openCampaignModal()) navigate(); };
  return (
    <div className="bf-fab" role="complementary" aria-label={cfg.title}>
      <button type="button" onClick={open} className="bf-fab-main">
        <span className="bf-fab-title bf-silver" dir="ltr">{cfg.title}</span>
        {cfg.endAt ? <Countdown endAt={cfg.endAt} size="sm" className="bf-fab-cd" /> : <span className="bf-fab-cd">{cfg.ctaLabel}</span>}
      </button>
      <button type="button" onClick={() => { hideCampaignFab(cfg.key); setHiddenKey(cfg.key); }} aria-label="הסתרת תזכורת המבצע" className="bf-fab-x"><span aria-hidden="true">×</span></button>
    </div>
  );
}

/* ---------- 4. home page hero ---------- */

export function CampaignHome({ cfg: cfgProp, preview = false }) {
  const { campaign, products, content, loaded } = useStore();
  const cfg = cfgProp || campaign;
  const { href, navigate } = useCampaignNav(cfg);
  const maxSale = useMaxSale();
  if (!preview && (!loaded || !cfg.active || !cfg.showHome)) return null;
  const items = campaignProducts(soldAlone(products || [], content));

  return (
    <section className={`bf-home${preview ? " bf-home-preview" : ""}`} aria-labelledby="bf-home-title">
      <Sparkles />
      <div className="bf-home-grid">
        <div className="bf-home-text">
          <span className="bf-eyebrow">ALFI · לזמן מוגבל</span>
          <SilverTitle text={cfg.title} as="h2" id="bf-home-title" className="bf-title-xxl" />
          <p className="serif bf-headline bf-headline-lg">{cfg.headline}</p>
          {cfg.subtitle && <p className="bf-sub">{cfg.subtitle}</p>}
          {cfg.endAt && <div className="bf-home-cd"><span className="bf-cd-head">המבצע נגמר בעוד</span><Countdown endAt={cfg.endAt} size="lg" /></div>}
          <div className="bf-home-actions">
            <a href={href} onClick={(e) => { e.preventDefault(); if (!preview) navigate(); }} className="bf-btn">{cfg.ctaLabel}<Arrow /></a>
            {maxSale > 0 && <span className="bf-chip">עד {maxSale}% הנחה על פריטים נבחרים</span>}
          </div>
        </div>
        <CampaignVisual cfg={cfg} items={items} interactive={!preview} />
      </div>
      {!preview && items.length > 4 && (
        <div className="bf-home-rail">
          <div className="bf-home-rail-head">
            <h3 className="serif">כל הפריטים במבצע</h3>
            <a href={href} onClick={(e) => { e.preventDefault(); navigate(); }}>לכולם<Arrow /></a>
          </div>
          <CardSlider>
            {items.slice(0, 12).map((p, i) => <RedesignProductCard key={p.id} product={p} index={i} />)}
          </CardSlider>
        </div>
      )}
    </section>
  );
}
