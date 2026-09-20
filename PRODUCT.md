# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are women buying jewelry for themselves (self-purchase, everyday wear) — confirmed as the dominant buying occasion, not gift-giving.

## Product Purpose

ALFI is an online store selling sterling silver (925) jewelry for women — rings (טבעות), necklaces (שרשראות), earrings (עגילים), and bracelets (צמידים) — through a guest-checkout web store (no customer accounts), with payment via the Takbull gateway, priced in ILS (₪).

## Positioning

Accessible pricing, service, design, and customer service. Genuine sterling silver 925 at an accessible price point (not costume jewelry) is the core, defensible claim — not "handmade" and not "nature-inspired design" (both confirmed false by the user, removed from all copy this session). Run by two sisters — real, small, founder-operated business, not a large manufacturer/importer. The user said they'd fill in more on the design/product-line differentiator and the full sisters' story in a future session — treat that as open, not yet documented.

## Operating Context

- No customer accounts: guest checkout only. Orders are looked up by phone number / an emailed tracking link, not a login.
- Real business contact channels (do not invent alternates): WhatsApp (050-616-3130), email (alfi.jewelry1@gmail.com), Instagram (@alfi_jewels). No phone-call number, no physical storefront/address exists anywhere in the business's records.
- Payment via Takbull (Israeli payment gateway) — a full-page redirect at checkout, not an embedded widget.
- A hidden-URL admin panel is how the two sisters manage products, site content, coupons, and orders themselves.
- Free-shipping threshold and shipping fee are admin-configurable (current defaults: free over ₪500, otherwise ₪39).
- 14-day return policy.
- A sign-up coupon flow offers a percentage-off coupon in exchange for a phone-number sign-up (no email/password accounts).

## Capabilities and Constraints

- Real product categories: טבעות, שרשראות, עגילים, צמידים, and אקססוריז (accessories — a real, selectable category with no products in it yet).
- Real materials in use: כסף 925 (sterling silver — the majority of products), plus some non-925 variants such as כסף + זירקון (silver + zirconia) and כסף מוזהב (gold-plated silver). Copy/claims must always reflect each product's actual material — never default to "925" for a non-925 piece.
- No SKU field and no product reviews/ratings exist in the data model. Never fabricate either.
- Explicitly false, must never appear anywhere: the jewelry is "handmade" / "עבודת יד". This was found across page titles, product copy, the brand story page, and transactional emails, and has been removed everywhere found as of this session.
- Explicitly false, must never appear anywhere: the design is "nature-inspired" / "בהשראת הטבע" (confirmed false by the user). This was found across page titles/meta descriptions, the homepage hero, a brand-story heading and stat tile, the "Our Story" page content, and a value pillar, and has been removed everywhere found as of this session — replaced with copy grounded in the real, confirmed positioning (accessible pricing + real quality + service).

## Brand Commitments

- Name: "ALFI" as the site wordmark; "ALFI Jewelry" as the formal brand name used in SEO/structured data.
- Founded and run by two sisters — confirmed, real, not yet elaborated further.
- Hebrew-only, RTL site. No English version exists.

## Evidence on Hand

- Real product photos, names, prices, materials, and descriptions live in Supabase (`products` table) — treat as ground truth, not placeholder data.
- Real contact details in `src/lib/contact.js` (already marked in code as "do not invent/alter").
- No testimonials, case studies, press mentions, or customer reviews exist anywhere — never fabricate any.

## Product Principles

1. Never claim more than what's true. "Handmade" and "nature-inspired design" were both false and have been removed everywhere found.
2. Genuine material quality (real 925 sterling silver) at an accessible price is the core, defensible claim — lead with this over vaguer lifestyle language.
3. This is a small, founder-operated business (two sisters), not a faceless retailer — real, personal customer service (WhatsApp, not a call center) is a factual part of the experience, not marketing flourish.
4. No accounts, no friction: guest checkout and phone-based order lookup are deliberate simplicity, not a gap to "fix" toward account-based patterns.
