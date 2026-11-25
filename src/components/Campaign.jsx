import React, { useEffect, useState } from "react";
import { useStore } from "../context/StoreContext.jsx";
import { useDialog } from "../hooks/useDialog.js";
import { pathFor, DEAL_FILTER, pageHidden } from "../lib/routes.js";
import { saleInfo, soldAlone } from "../lib/pricing.js";
import { PriceTag } from "./PriceTag.jsx";
import { CardSlider } from "./CardSlider.jsx";
import { RedesignProductCard } from "./RedesignProductCard.jsx";
import { BrandLogo } from "./BrandLogo.jsx";
import {
  previewConfig, campaignProducts, timeLeft,
  campaignSeen, markCampaignSeen, campaignFabHidden, hideCampaignFab,
} from "../lib/campaign.js";

/**
 * Seasonal campaign (Black Friday…) in the brand's own campaign look:
 * ivory satin, a dark high-contrast serif title, a hairline rule, a soft
 * Hebrew line with ♡ and an outlined pill button — the ALFI Instagram
 * campaign visual, carried onto the site. Placements (each switchable in
 * the admin "קמפיין" tab):
 *   CampaignBar   — slim satin strip under the header
 *   CampaignModal — the campaign poster as a pop-up (full screen on phones)
 *   CampaignFab   — small floating reminder after the pop-up closed
 *   CampaignHome  — satin band at the top of the home page
 *   (card badges live in RedesignProductCard)
 * Before the start date (if the admin keeps the teaser on) everything shows
 * the teaser: "27.11 ←" and a countdown to the start.
 * Settings and copy: src/lib/campaign.js. It never changes prices.
 */

// Pages where nothing of the campaign opens or floats by itself: around
// payment, the account and admin. (The bar still shows on browse pages.)
const QUIET_SCREENS = new Set(["checkout", "confirm", "payment-failed", "status", "loading", "my-orders", "admin", "admin-login"]);
// The floating pill would sit on the mobile sticky add-to-cart / pay bars.
const NO_FAB_SCREENS = new Set([...QUIET_SCREENS, "product", "cart", "set"]);

/* ---------- shared bits ---------- */

// The campaign title face (a Didone, like the campaign visual). Loaded only
// once a campaign is actually on screen — never part of the normal page.
let fontRequested = false;
function useCampaignFont(on) {
  useEffect(() => {
    if (!on || fontRequested || typeof document === "undefined") return;
    fontRequested = true;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&display=swap";
    document.head.appendChild(l);
  }, [on]);
}

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

export function Countdown({ to, size = "md", className = "" }) {
  const now = useNow(!!to);
  const t = timeLeft(to, now);
  if (!t) return null;
  const spoken = `${t.days > 0 ? `${t.days} ימים, ` : ""}${t.hours} שעות ו־${t.minutes} דקות`;
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
  const parts = [
    ...(t.days > 0 ? [[t.days, t.days === 1 ? "יום" : "ימים"]] : []),
    [t.hours, "שעות"],
    [t.minutes, "דקות"],
    [t.seconds, "שניות"],
  ];
  return (
    <div className={`bf-cd bf-cd-${size} ${className}`} role="timer" aria-label={spoken}>
      {parts.map(([v, label]) => (
        <span key={label} className="bf-cd-cell" aria-hidden="true">
          <span className="bf-cd-num">{pad(v)}</span>
          <span className="bf-cd-label">{label}</span>
        </span>
      ))}
    </div>
  );
}

const Arrow = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M20 12H4M10 6l-6 6 6 6" /></svg>
);
const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
);

// Little four-point glints, like light catching a stone.
const GLINTS = [[14, 18, 14], [78, 12, 10], [86, 46, 16], [22, 58, 9], [60, 30, 8]];
function Glints() {
  return (
    <span className="bf-glints" aria-hidden="true">
      {GLINTS.map(([x, y, s], i) => (
        <svg key={i} viewBox="0 0 20 20" width={s} height={s} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.9}s` }}>
          <path d="M10 0C10.6 6.2 13.8 9.4 20 10 13.8 10.6 10.6 13.8 10 20 9.4 13.8 6.2 10.6 0 10 6.2 9.4 9.4 6.2 10 0Z" fill="#fff" />
        </svg>
      ))}
    </span>
  );
}

// Where the campaign's button leads. The teaser goes to the jewellery
// (the sale isn't on yet). Falls back to the whole catalog when the target
// page is hidden (admin "עמודים באתר"), or for "deal" when no product is
// in the deal — an empty deal page sells nothing.
function useCampaignNav(cfg) {
  const { go, products, content } = useStore();
  const hasDeal = (products || []).some((p) => p.in_bundle && Number(p.stock) > 0);
  const unusable = cfg.phase === "teaser" || pageHidden(content, cfg.ctaTarget) || (cfg.ctaTarget === "deal" && !hasDeal);
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

function useCampaignItems() {
  const { products, content } = useStore();
  return campaignProducts(soldAlone(products || [], content));
}

function maxSaleOf(items) {
  return items.reduce((m, p) => Math.max(m, saleInfo(p).percent), 0);
}

// Teaser: the start date on the pill ("27.11"); sale: the admin's label.
function ctaText(cfg) {
  return cfg.phase === "teaser" && cfg.startLabel ? cfg.startLabel : cfg.ctaLabel;
}

// "BLACK FRIDAY" stacked one word per line, as on the campaign visual.
function Title({ text, id, className = "" }) {
  const words = String(text).trim().split(/\s+/);
  return (
    <h2 id={id} className={`bf-title ${className}`} dir="auto">
      {words.map((w, i) => <span key={i}>{w}</span>)}
    </h2>
  );
}

// Frosted product cards with a chevron — real discounted pieces.
function ProductCards({ items, interactive, className = "" }) {
  const { openProduct, products } = useStore();
  if (!items.length) return null;
  return (
    <ul className={`bf-pcards ${className}`}>
      {items.map((p) => {
        const s = saleInfo(p);
        const inner = (
          <>
            <span className="bf-pcard-img">{p.image && <img src={p.image} alt="" loading="lazy" decoding="async" />}</span>
            <span className="bf-pcard-text">
              <span className="bf-pcard-name">{p.name}</span>
              <PriceTag product={p} size={13} showPercent={false} />
            </span>
            {s.onSale && <span className="bf-pcard-pct">-{s.percent}%</span>}
            <span className="bf-pcard-go"><Chevron /></span>
          </>
        );
        return (
          <li key={p.id}>
            {interactive ? (
              <a href={pathFor("product", { pid: p.id, products })} onClick={(e) => { e.preventDefault(); openProduct(p.id); }} className="bf-pcard">{inner}</a>
            ) : (
              <span className="bf-pcard">{inner}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// The satin surface (or the admin's own campaign photo) + glints.
function Satin({ image }) {
  return (
    <>
      {image ? <img className="bf-photo" src={image} alt="" decoding="async" /> : <span className="bf-satin" aria-hidden="true" />}
      <span className="bf-veil" aria-hidden="true" />
      <Glints />
    </>
  );
}

/* ---------- 1. top strip ---------- */

export function CampaignBar({ cfg: cfgProp, preview = false }) {
  const { campaign, screen, loaded } = useStore();
  const cfg = cfgProp || campaign;
  const { href, navigate } = useCampaignNav(cfg);
  useCampaignFont(cfg.active || preview);
  if (!preview && (!loaded || !cfg.active || !cfg.showBar || QUIET_SCREENS.has(screen))) return null;
  const teaser = cfg.phase === "teaser";
  return (
    <a
      href={href}
      onClick={(e) => { e.preventDefault(); if (!preview) navigate(); }}
      className="bf-bar"
      aria-label={`${cfg.title}: ${cfg.barText}. ${teaser ? `מתחילים ב־${cfg.startLabel}` : cfg.ctaLabel}`}
    >
      <span className="bf-bar-title" dir="ltr">{cfg.title}</span>
      <span className="bf-bar-rule" aria-hidden="true" />
      <span className="bf-bar-text">{cfg.barText}</span>
      {cfg.countdownTo && <span className="bf-bar-cd"><span className="bf-bar-cd-label">{teaser ? "מתחילים בעוד" : "נגמר בעוד"}</span><Countdown to={cfg.countdownTo} size="sm" /></span>}
      <span className="bf-bar-cta">{teaser ? cfg.startLabel : cfg.ctaLabel}<Arrow /></span>
    </a>
  );
}

/* ---------- 2. pop-up: the campaign poster ---------- */

export function CampaignModal() {
  const { campaign, campaignModalOpen, campaignPreview, openCampaignModal, closeCampaignModal, loaded, screen, signupPopupOpen, authDialog } = useStore();
  const cfg = campaignPreview ? previewConfig(campaignPreview.content, campaignPreview.phase) : campaign;
  const { href, navigate } = useCampaignNav(cfg);
  const items = useCampaignItems();
  useCampaignFont(campaign.active || campaignModalOpen);

  // Opens by itself a few seconds into a visit — once per visit or once a
  // day (admin setting) per campaign phase — on browse pages only.
  useEffect(() => {
    if (!loaded || !campaign.active || !campaign.showModal) return undefined;
    if (QUIET_SCREENS.has(screen) || campaignModalOpen || signupPopupOpen || authDialog) return undefined;
    if (campaignSeen(campaign.key, campaign.modalFrequency)) return undefined;
    const t = setTimeout(() => {
      if (openCampaignModal()) markCampaignSeen(campaign.key);
    }, campaign.modalDelay * 1000);
    return () => clearTimeout(t);
  }, [loaded, campaign.active, campaign.showModal, campaign.key, campaign.modalFrequency, campaign.modalDelay, screen, campaignModalOpen, signupPopupOpen, authDialog, openCampaignModal]);

  const panelRef = useDialog(campaignModalOpen, closeCampaignModal, { initialFocus: ".bf-modal-cta" });
  // It covers the whole page: the page behind it doesn't scroll meanwhile.
  useEffect(() => {
    if (!campaignModalOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [campaignModalOpen]);
  if (!campaignModalOpen) return null;

  const teaser = cfg.phase === "teaser";
  const maxSale = teaser ? 0 : maxSaleOf(items);
  const shop = (e) => {
    e.preventDefault();
    closeCampaignModal();
    if (!campaignPreview) navigate();
  };

  return (
    <div className="bf-modal-overlay" onClick={closeCampaignModal}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="bf-modal-title" dir="rtl" className="bf-modal" onClick={(e) => e.stopPropagation()}>
        <Satin image={cfg.image} />
        <div className="bf-modal-scroll">
        <div className="bf-wordmark" aria-hidden="true"><BrandLogo variant="full" eager /></div>
        {!cfg.image && <ProductCards items={items.slice(0, 3)} interactive={false} className="bf-pcards-stack" />}
        <div className="bf-poster-text">
          <Title text={cfg.title} id="bf-modal-title" className="bf-title-poster" />
          <span className="bf-rule" aria-hidden="true" />
          <p className="bf-line">{cfg.headline}</p>
          {maxSale > 0 && <p className="bf-note">עד {maxSale}% הנחה על פריטים נבחרים</p>}
          <a href={href} onClick={shop} className="bf-pill bf-modal-cta" aria-label={teaser ? `מתחילים ב־${cfg.startLabel} — לתכשיטים` : undefined}>{ctaText(cfg)}<Arrow /></a>
          {cfg.countdownTo && (
            <div className="bf-poster-cd">
              <span className="bf-cd-head">{teaser ? "מתחילים בעוד" : "המבצע נגמר בעוד"}</span>
              <Countdown to={cfg.countdownTo} size="md" />
            </div>
          )}
          <button type="button" onClick={closeCampaignModal} className="bf-quiet">אולי אחר כך</button>
        </div>
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
    const seen = () => campaignSeen(cfg.key, cfg.modalFrequency);
    if (!cfg.showModal || seen()) { setReady(true); return undefined; }
    const iv = setInterval(() => { if (seen()) setReady(true); }, 1000);
    return () => clearInterval(iv);
  }, [cfg.active, cfg.showModal, cfg.key, cfg.modalFrequency, campaignModalOpen]);

  if (!loaded || !cfg.active || !cfg.showFab || hidden || !ready) return null;
  if (campaignModalOpen || signupPopupOpen || authDialog || NO_FAB_SCREENS.has(screen)) return null;

  const open = () => { if (!cfg.showModal || !openCampaignModal()) navigate(); };
  return (
    <div className="bf-fab" role="complementary" aria-label={cfg.title}>
      <button type="button" onClick={open} className="bf-fab-main">
        <span className="bf-fab-title" dir="ltr">{cfg.title}</span>
        {cfg.countdownTo ? <Countdown to={cfg.countdownTo} size="sm" className="bf-fab-cd" /> : <span className="bf-fab-cd">{ctaText(cfg)}</span>}
      </button>
      <button type="button" onClick={() => { hideCampaignFab(cfg.key); setHiddenKey(cfg.key); }} aria-label="הסתרת תזכורת המבצע" className="bf-fab-x"><span aria-hidden="true">×</span></button>
    </div>
  );
}

/* ---------- 4. home page band ---------- */

export function CampaignHome({ cfg: cfgProp, preview = false }) {
  const { campaign, loaded } = useStore();
  const cfg = cfgProp || campaign;
  const { href, navigate } = useCampaignNav(cfg);
  const items = useCampaignItems();
  useCampaignFont(cfg.active || preview);
  if (!preview && (!loaded || !cfg.active || !cfg.showHome)) return null;
  const teaser = cfg.phase === "teaser";
  const maxSale = teaser ? 0 : maxSaleOf(items);

  return (
    <section className={`bf-home${preview ? " bf-home-preview" : ""}${cfg.image ? " bf-home-photo" : ""}`} aria-labelledby={preview ? undefined : "bf-home-title"}>
      <div className="bf-home-stage">
        <Satin image={cfg.image} />
        <div className="bf-home-grid">
          <div className="bf-poster-text bf-home-text">
            <Title text={cfg.title} id={preview ? undefined : "bf-home-title"} className="bf-title-home" />
            <span className="bf-rule" aria-hidden="true" />
            <p className="bf-line bf-line-lg">{cfg.headline}</p>
            {cfg.subtitle && <p className="bf-sub">{cfg.subtitle}</p>}
            <div className="bf-home-actions">
              <a href={href} onClick={(e) => { e.preventDefault(); if (!preview) navigate(); }} className="bf-pill">{ctaText(cfg)}<Arrow /></a>
              {maxSale > 0 && <span className="bf-note">עד {maxSale}% הנחה על פריטים נבחרים</span>}
            </div>
            {cfg.countdownTo && (
              <div className="bf-poster-cd">
                <span className="bf-cd-head">{teaser ? "מתחילים בעוד" : "המבצע נגמר בעוד"}</span>
                <Countdown to={cfg.countdownTo} size="lg" />
              </div>
            )}
          </div>
          {!cfg.image && <ProductCards items={items.slice(0, 3)} interactive={!preview} className="bf-pcards-home" />}
        </div>
      </div>
      {!preview && !teaser && items.length > 3 && (
        <div className="bf-home-rail">
          <div className="bf-home-rail-head">
            <h3>כל הפריטים במבצע <span aria-hidden="true">♡</span></h3>
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
