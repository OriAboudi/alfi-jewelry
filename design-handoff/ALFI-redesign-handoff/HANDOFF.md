# ALFI: home page redesign handoff ("Impressionist Garden" direction)

## 0. The one rule: UI/UX only. Do not change logic.

This is a visual redesign of the existing ALFI site (alfi-jewelry.com, Hebrew, RTL) on both desktop and mobile.

**Do not touch:**
- Data fetching, APIs, and the product/category/cart data models.
- State management, the cart and checkout flow, and auth.
- Routing and URLs.
- Event handlers, form submission logic, analytics, and SEO/meta logic.
- Environment and config files, and the build setup.

**Keep the same across the codebase:**
- Component names, their props, and the data they receive. Every product, price, and category must keep coming from the existing data sources.
- Behavior. Every button and link must still do exactly what it does today. For example, "Add to cart" must still call the existing add-to-cart handler.

**Allowed:**
- Changes to markup structure inside components, CSS and styles, class names, layout, fonts, colors, spacing, animations, and responsive behavior.
- New presentational-only wrappers or components, such as a slider shell or a glass panel.

**Missing data:** The design may show something that has no data in the codebase yet, such as promo-banner copy, brand-story text, or product tags. Render it as static or configurable content, and list it in your final summary. Do not invent backend fields.

**Workflow:**
1. Before editing, explore the repo and map each section below to the existing component that renders it.
2. Work in small commits, one section at a time.
3. After each step, make sure the app still builds and the cart and navigation still work.

## 1. Reference files (source of truth for the look)

The `reference/` folder contains:
- `desktop.html`: the full desktop home page, designed at 1440px.
- `mobile.html`: the full mobile home page, designed at 390px.
- `floral-bg.jpg`: the painted floral background. The project already has this image (`floral-bg.jpg`), so use the existing asset from source/public, not from `dist`.

Open both HTML files in a browser. They are static mockups. Grey and pastel boxes that say "תמונת מוצר" or "תמונת קולקציה" are placeholders for real product and collection images. Text in [square brackets] is placeholder copy.

Copy exact values (sizes, spacing, colors, blur, easing) from these files rather than approximating.

## 2. Design tokens

### Colors

| Token | Value | Use |
|---|---|---|
| `--ink` | `#3A2D3D` | primary text, dark buttons, icons |
| `--ink-deep` | `#2E2231` | hero/promo headlines |
| `--text-body` | `#4E4052` | paragraphs |
| `--text-muted` | `#625565` | meta lines (category · כסף 925) |
| `--accent` | `#7A5C86` / `#6E4F7A` | eyebrow labels, link hover |
| `--cream` | `#F6F0EB` | page base, text on dark |
| `--glass` | `rgba(249,245,241,.72)` + `backdrop-filter: blur(16–18px) saturate(1.1)` + `1px solid rgba(255,255,255,.65)` | section headers, header bar, hero panel |
| `--glass-strong` | `rgba(251,248,245,.86)` + `blur(18–20px)` + `1px solid rgba(255,255,255,.7)` | product cards, collection cards, promo, story |
| `--footer` | `rgba(58,45,61,.9)` + `blur(12–14px)` | footer |
| `--divider-dark` | `#6A5A70` | footer dividers |

Always include `-webkit-backdrop-filter` too. If `backdrop-filter` isn't supported, fall back to a more opaque background (`rgba(249,245,241,.92)`).

### Typography (Google Fonts)

- **Display:** `Frank Ruhl Libre` 300/400/500. Use it for headlines, the logo, product names, and collection names.
- **Body/UI:** `Assistant` 300/400/600.
- **Logo "ALFI":** Frank Ruhl Libre with letter-spacing `.42em` on desktop and `.36em` on mobile.
- **Headline weights:** mostly 300 (light) for a luxury feel.
- **Eyebrow labels:** 12–14px, letter-spacing `.26–.3em`, accent color.

### Shape and feel

- **Corners:** sharp everywhere, `border-radius` 0–2px. Only the cart badge is round.
- **Shadows:** none at rest. The soft shadow appears on hover only.
- **Touch targets:** at least 44px.

## 3. Global background (key visual idea)

The floral painting is the background of the entire page, not just the hero.

1. **Layer 1:** the painting, `background-size: cover`, `filter: blur(3–4px) saturate(1.08)`, `transform: scale(1.02)` to hide blurred edges.
2. **Layer 2:** a readability veil, a vertical gradient of cream at roughly .2 → .5 opacity, darkening slightly toward the footer. The exact gradient is in the reference files.
3. **Content:** sits above both layers, and each section lives on a glass panel.

The hero has its own sharp copy of the painting on top of the blurred one. It fades into the page with `mask-image: linear-gradient(180deg, #000 62–70%, transparent 100%)`, plus a slow zoom-in on load (scale 1.12 → 1 over 16–18s).

**Implementation note:** For a real long page, use a `position: fixed` background layer, as a pseudo-element or a fixed div behind the content. Do not use `background-attachment: fixed`, which is broken on iOS.

## 4. Home page structure (the same order on desktop and mobile)

1. Announcement bar (desktop only in the reference; optional on mobile)
2. Header
3. Hero
4. **Featured products slider:** "נבחרים מהסדנה" on desktop, "נבחרים" on mobile
5. **Collections:** 4 categories in a **2 × 2 grid (not a slider)**
6. **Promo banner:** half image, half text, "3 תכשיטים ב־220 ₪"
7. **Second products slider:** "עוד תכשיטים שתאהבי" on desktop, "עוד תכשיטים" on mobile
8. **Brand story panel:** "כל תכשיט מתחיל בפרח אחד"
9. Newsletter (desktop reference)
10. Footer

Both sliders use the existing product data. Pick the product lists through whatever the site already has, such as featured, new, or all. Do not add new queries if an existing list works. If none exists, reuse the current home-page product list for both and note it.

## 5. Sections in detail

### Header
- **Desktop:** glass bar, 92px tall, 64px side padding, 3-column grid. Nav on the right (RTL) with the 4 categories. The ALFI logo is centered. Search, favorites, and cart icon buttons (44×44) sit on the left. Nav links get a hover underline that grows from the right (`width 0 → 100%`, .4s).
- **Mobile:** glass bar, 64px. Menu and search buttons on the right, logo centered, cart with a count badge on the left. All buttons 48×48.

### Hero
- **Desktop:** 780px tall. A glass panel 620px wide, 56px padding, on the right side. Inside: eyebrow "כסף סטרלינג 925 · עבודת יד", H1 at 84px/1.02 light, a paragraph at 20px, and two buttons (filled dark and outline, 56px tall).
- **Mobile:** 660px tall. The glass panel is anchored to the bottom with 16px margins. H1 is 46px, and there is one full-width CTA, 56px tall.
- **Load animation:** the elements "rise" (`translateY(22–28px)` and opacity 0 → 1, 1–1.1s, `cubic-bezier(.2,.7,.1,1)`), staggered 0 / .15 / .3 / .45s.

### Product slider (used twice)
- **Section header:** a glass strip with the title (46px desktop / 28–30px mobile) and a "לכל התכשיטים" underline link.
  - Desktop only: prev/next square buttons, 52×52. "Next" is filled dark and "prev" is outline, and both fill dark on hover.
- **Track:** horizontal scroll, `scroll-snap-type: x mandatory`, `scroll-snap-align: start`, hidden scrollbar. The side padding matches the page gutter (64px desktop / 16px mobile), and `scroll-padding-inline` uses the same value. The last visible card is cut off at the edge on purpose, to signal that the row scrolls.
- **Card sizes:**
  - Desktop: 316px wide, image 400px tall, gap 24px.
  - Mobile: 256px wide, image 320px tall, gap 12px.
- **Card:**
  - `glass-strong` panel with 8–10px padding.
  - Image area with a tag chip (e.g. "חדש") in the top-right corner.
  - Desktop only: a favorites button (44×44) in the top-left corner of the image.
  - Below the image: the product name (Frank Ruhl Libre, 21px desktop / 19px mobile), a meta line "{category} · כסף 925" (14/13px, muted), and the price on the opposite side (17/16px, weight 600, no wrap).
  - "הוספה לסל" button: 50px outline that fills on hover (desktop), 46px filled dark (mobile). It must call the existing add-to-cart logic.
- **Progress bar under the track:** a 2px line, `rgba(58,45,61,.18)`, with a dark fill. Wire the fill width to the scroll position. This is purely presentational scroll math, no business logic.
- **Desktop hover:** the card lifts `translateY(-6px)` with shadow `0 30px 60px -34px rgba(58,45,61,.5)`, and the image scales to 1.05 over 1s.
- **Mobile active (tap):** the image scales to .97.
- The arrows scroll the track by one card width.

### Collections: 2 × 2 grid
- **Section header:** a glass strip titled "הקולקציות".
- **Desktop:** 2 columns, gap 24px. Each card is `glass-strong`, 400px tall, 12px padding, and split into 2 equal columns:
  - Image column (sharp rectangle).
  - Text column (36px padding): a number "01–04" as an eyebrow, the category name at 52px light, and an outline "לקולקציה ←" pill-less button (50px) that fills dark on card hover.
  - Card hover: lift −6px with shadow, image scale 1.05.
- **Mobile:** the section sits inside one glass panel with 12px margins, 2 columns, gap 10px. Each card has a white `rgba(255,255,255,.8)` background and 6px padding, an image at 4:5 ratio, and a row (50px) with the category name (20px serif) and an arrow icon.
- Categories come from existing data: טבעות, שרשראות, עגילים, צמידים.

### Promo banner: "3 תכשיטים ב־220 ₪"
- **Desktop:** a `glass-strong` rectangle, 540px tall, 14px padding, 2 equal columns.
  - Image half: currently a crop of the painting with a placeholder for a photo of 3 pieces. Make the image replaceable.
  - Text half (56px × 72px padding): a dark "מבצע" label chip, the headline "3 תכשיטים<br>ב־220 ₪" at 76px light, a paragraph (19px), and a CTA "לבחירת התכשיטים ←" (58px, filled dark).
  - Hover: the image scales to 1.04.
- **Mobile:** stacked, with the image (240px) on top and the text below. Headline 46px, full-width CTA 54px.
- **Copy:** the conditions are placeholders ("[תנאי המבצע]"). If the site has no promo logic, render the banner as static content linking to the existing shop or category page. Do not implement pricing logic.

### Brand story panel
- **Desktop:** a `glass-strong` panel, 72px × 96px padding, 2 columns.
  - Left column: eyebrow "מהסדנה", H2 "כל תכשיט<br>מתחיל בפרח אחד" (60px light), and a "לסיפור המלא" link.
  - Right column: a paragraph (placeholder brand story) and a 3-item row: 925 / כסף סטרלינג, יד / עבודת יד מלאה, טבע / השראה מהגן.
- **Mobile:** a single column, 32×24 padding, H2 at 38px.

### Newsletter (desktop)
A centered glass panel, 680px wide, with a serif title "הצטרפי לגן של ALFI" and an underline-style email input with a "הרשמה" button. Keep the existing newsletter submit logic if there is one.

### Footer
- **Desktop:** the `--footer` translucent plum background, a 4-column grid (logo / חנות / שירות / צרי קשר), and a copyright row.
- **Mobile:** the logo, accordion-style rows (54px) with "+", and the copyright. Keep the existing footer links and contact data.

## 6. Responsive rules

- **Breakpoints:** mobile layout below 768px, desktop layout from 1024px. Between those, interpolate sensibly: slider cards around 280px, collections still 2 × 2, and the promo stays 2 columns from about 900px.
- **Width:** content max width 1440px. Keep a 64px desktop gutter and a 16px mobile gutter.
- **Direction:** everything is RTL (`dir="rtl"`). Arrow icons point left for "forward".

## 7. Motion and accessibility

- **Easing:** `cubic-bezier(.2,.7,.1,1)` everywhere.
- **Reduced motion:** respect `prefers-reduced-motion: reduce`. Disable the hero zoom, the rise animations, and hover lifts.
- **Real elements:** controls stay real `<button>`/`<a>` elements, and icon-only buttons get a Hebrew `aria-label`.
- **Contrast:** text contrast is at least 4.5:1 on the glass panels. The veil values above were chosen for that, so don't lower the glass opacity.
- **Images:** use `loading="lazy"` for images below the fold. The background image should be optimized (WebP/AVIF with a JPG fallback).

## 8. Acceptance checklist

- [ ] Desktop and mobile home pages visually match `reference/desktop.html` and `reference/mobile.html`.
- [ ] No changes to data fetching, cart, routing, API, or state logic. The diff only touches markup, styles, and presentational components.
- [ ] Add to cart, favorites, search, menu, and all links behave exactly as before.
- [ ] Both product sections are horizontal snap sliders on desktop and mobile, with arrows on desktop and a progress bar on both.
- [ ] Collections are a 2 × 2 grid on desktop and mobile.
- [ ] The section order matches section 4.
- [ ] The painting is the page background with the glass panels on top, and the text is readable.
- [ ] RTL is correct, touch targets are at least 44px, and reduced motion is respected.
- [ ] The build passes, and there are no console errors.
- [ ] A final summary lists every placeholder or static content still needing real data: promo terms, brand story text, collection images, and product tags.
