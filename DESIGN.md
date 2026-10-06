---
version: alpha
name: Pugu-flat-retro-design
description: A clean, retro-flat interface anchored on warm light cream canvas with dark brown primary CTAs. Layout containers are entirely flat with no borders or container cards. Features, pricing, and testimonials are presented as flat columns separated by simple horizontal divider lines. Cards are reserved exclusively for product UI mockups.

colors:
  primary: "#3A2616"
  primary-active: "#B97A3A"
  primary-disabled: "#FFD59A"
  ink: "#3A2616"
  body: "#3A2616"
  muted: "#B97A3A"
  muted-soft: "#B97A3A"
  hairline: "#B97A3A"
  hairline-soft: "#FFD59A"
  canvas: "#FFF2D9"
  surface-soft: "#FFD59A"
  surface-card: "#FFD59A"
  surface-strong: "#F7B35A"
  surface-dark: "#3A2616"
  surface-dark-elevated: "#24170d"
  on-primary: "#FFF2D9"
  on-dark: "#FFF2D9"
  on-dark-soft: "#FFD59A"
  brand-accent: "#F7B35A"
  success: "#10b981"
  warning: "#f59e0b"
  error: "#ef4444"
  badge-orange: "#fb923c"
  badge-pink: "#ec4899"
  badge-violet: "#8b5cf6"
  badge-emerald: "#34d399"

typography:
  display-xl:
    fontFamily: "Cal Sans, Inter, sans-serif"
    fontSize: 64px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -2px
  display-lg:
    fontFamily: "Cal Sans, Inter, sans-serif"
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -1.5px
  display-md:
    fontFamily: "Cal Sans, Inter, sans-serif"
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -1px
  display-sm:
    fontFamily: "Cal Sans, Inter, sans-serif"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.5px
  title-lg:
    fontFamily: "Inter, sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.3px
  title-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  title-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "Inter, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  button:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 0px
  sm: 0px
  md: 0px
  lg: 0px
  xl: 0px
  pill: 0px
  full: 0px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-primary-disabled:
    backgroundColor: "{colors.primary-disabled}"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-icon-circular:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 36px
  button-text-link:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button}"
  text-link:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 64px
  nav-pill-group:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.pill}"
    padding: 6px
  hero-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    padding: 96px
  hero-app-mockup-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
  feature-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  feature-icon-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.lg}"
    padding: 24px
  product-mockup-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
  testimonial-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 24px
  pricing-tier-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.title-lg}"
    rounded: "{rounded.lg}"
    padding: 32px
  pricing-tier-card-featured:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.title-lg}"
    rounded: "{rounded.lg}"
    padding: 32px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 10px 14px
    height: 40px
  text-input-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  category-tab:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    typography: "{typography.nav-link}"
    padding: 8px 14px
    rounded: "{rounded.md}"
  category-tab-active:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.md}"
  avatar-circle:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 36px
  badge-pill:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  rating-stars:
    backgroundColor: transparent
    textColor: "{colors.badge-orange}"
    typography: "{typography.caption}"
  cta-band-light:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.display-sm}"
    rounded: "{rounded.lg}"
    padding: 48px
  footer:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark-soft}"
    typography: "{typography.body-sm}"
    padding: 64px
---

## Overview

Pugu's marketing surface is a clean, friendly interface — warm light cream canvas (`{colors.canvas}` — #FFF2D9) with dark brown primary CTAs (`{colors.primary}` — #3A2616), custom display typography, and flat, borderless column layouts. Features, pricing lists, and testimonials are presented directly on the canvas without background cards, using simple top-border lines as dividers. The system reads as confidently engineered — every band has clear hierarchy, generous whitespace, and a single primary action.

Type voice splits cleanly into two roles: display headlines (using display typography) and body typography (used for everything else — body, buttons, nav, captions).

Component voltage comes from **product UI fragments shown directly inside mockups** — task boards, scheduling forms, automation diagrams, integration tiles. Pugu doesn't paint marketing illustrations of the product; it shows the actual product chrome at small scale embedded in the marketing flow. Mockups are the only elements allowed to have boxy container outlines ("cards").

The footer flips to `{colors.surface-dark}` (#3A2616) — a deep dark brown that visually closes every long-scroll page. The footer is the only dark section in the system.

**Key Characteristics:**
- Warm light cream canvas with dark brown primary CTA (`{colors.primary}` — #3A2616). Buttons are `{rounded.md}` (0px, square) with confident weight-600 labels, thick borders, and hard drop shadows.
- Display typeface for headlines.
- Flat column surfaces for features, testimonials, and pricing tiers. The featured pricing tier is highlighted with a brand-accent top border divider.
- Product UI fragments embedded directly in mockup containers.
- Nav-pill-group (`{component.nav-pill-group}`) — a small blocky switcher around grouped nav segments.
- Avatars are square (`{rounded.full}` — 0px), 36px size, used in testimonial rows and team-listing surfaces.
- Footer is dark brown (`{colors.surface-dark}` — #3A2616) with light gold text (`{colors.on-dark-soft}` — #FFD59A). The dark footer closes every page.
- Spacing rhythm is `{spacing.section}` (96px) between major bands.
- Border radius is 0px project-wide to maintain a retro, blocky pixel-art aesthetic for all components (buttons, inputs, cards, mockup containers, nav switchers, and avatars). Thick borders and hard flat drop shadows replace traditional shadows and rounded corners.

## Colors

### Brand & Accent
- **Primary** (`{colors.primary}` — #3A2616): The dominant action color. All primary CTAs, h1/h2 display type. Press state shifts to `{colors.primary-active}` (#B97A3A).
- **Brand Accent** (`{colors.brand-accent}` — #F7B35A): Used sparely on inline links and highlights.
- **Badge Pastels** — A small pastel set for category badges and avatar fills: `{colors.badge-orange}` (#fb923c), `{colors.badge-pink}` (#ec4899), `{colors.badge-violet}` (#8b5cf6), `{colors.badge-emerald}` (#34d399).

### Surface
- **Canvas** (`{colors.canvas}` — #FFF2D9): The default page floor.
- **Surface Soft** (`{colors.surface-soft}` — #FFD59A): Nav-pill-group background, soft section dividers.
- **Surface Card** (`{colors.surface-card}` — #FFD59A): Feature cards, testimonial cards, badge pills, default avatar fills.
- **Surface Strong** (`{colors.surface-strong}` — #F7B35A): Hairline border alternative; disabled button background.
- **Surface Dark** (`{colors.surface-dark}` — #3A2616): The footer background. Also used for the featured pricing tier card.
- **Surface Dark Elevated** (`{colors.surface-dark-elevated}` — #24170d): Used for nested cards inside the dark footer or featured pricing card.
- **Hairline** (`{colors.hairline}` — #B97A3A): The 1px border tone on light surfaces. Used on input borders, table dividers, content card outlines.
- **Hairline Soft** (`{colors.hairline-soft}` — #FFD59A): A divider used between sections that share the canvas.

### Text
- **Ink** (`{colors.ink}` — #3A2616): All headlines and primary text.
- **Body** (`{colors.body}` — #3A2616): Default running-text color.
- **Muted** (`{colors.muted}` — #B97A3A): Secondary text — sub-headings, breadcrumbs, footer body.
- **Muted Soft** (`{colors.muted-soft}` — #B97A3A): Tertiary text — captions, fine-print, copyright lines.
- **On Primary / On Dark** (`{colors.on-primary}` / `{colors.on-dark}` — #FFF2D9): Text on primary buttons and dark footer.
- **On Dark Soft** (`{colors.on-dark-soft}` — #FFD59A): Footer body text.

### Semantic
- **Success** (`{colors.success}` — #10b981): Confirmation states.
- **Warning** (`{colors.warning}` — #f59e0b): Warning callouts.
- **Error** (`{colors.error}` — #ef4444): Validation errors.

## Typography

### Font Family
The system runs **Cal Sans** for display + brand wordmark and **Inter** for everything else. Cal Sans is Cal.com's custom geometric display typeface — slightly condensed, weight 600, negative letter-spacing. Inter handles body, buttons, navigation, captions, and tabular code blocks. The fallback stack walks `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` for both families.

The split is functional:
- Cal Sans (display, 600 weight, -0.5 to -2px tracking) — h1, h2, h3
- Inter (body + UI, 400-600 weight, 0 letter-spacing) — paragraphs, labels, buttons, nav

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 64px | 600 | 1.05 | -2px | Homepage h1 ("The better way to schedule your meetings") — Cal Sans |
| `{typography.display-lg}` | 48px | 600 | 1.1 | -1.5px | Section heads ("Your all-purpose scheduling app") — Cal Sans |
| `{typography.display-md}` | 36px | 600 | 1.15 | -1px | Sub-section heads, card titles — Cal Sans |
| `{typography.display-sm}` | 28px | 600 | 1.2 | -0.5px | CTA-band heads, pricing tier prices — Cal Sans |
| `{typography.title-lg}` | 22px | 600 | 1.3 | -0.3px | Pricing plan names — Inter |
| `{typography.title-md}` | 18px | 600 | 1.4 | 0 | Feature card titles, intro paragraphs |
| `{typography.title-sm}` | 16px | 600 | 1.4 | 0 | Small card titles, list labels |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Default running-text |
| `{typography.body-sm}` | 14px | 400 | 1.5 | 0 | Footer body, fine-print |
| `{typography.caption}` | 13px | 500 | 1.4 | 0 | Badge labels, captions |
| `{typography.code}` | 14px | 400 | 1.5 | 0 | Code snippets, API examples — JetBrains Mono |
| `{typography.button}` | 14px | 600 | 1.0 | 0 | Standard button labels |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top-nav menu items |

### Principles
Cal Sans is the brand voice — every display headline uses it. Inter handles the supporting type. The boundary is strict: never put body copy in Cal Sans, never put a display headline in Inter. Cal Sans without negative letter-spacing reads as off-brand — the -0.5 to -2px tracking is part of the voice.

Display weight stays at 600 across all sizes — never 700, never 500. The middle weight is what makes Cal Sans feel modern and confident without becoming bombastic.

### Note on Font Substitutes
If Cal Sans is unavailable, **Inter** at weight 600 with -0.04em letter-spacing is a usable approximation. The geometric character of Cal Sans differs from Inter's humanist forms, but the substitution preserves the weight + tracking signature. **Manrope** at weight 700 is another close alternative.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Section padding:** `{spacing.section}` (96px) — the universal vertical rhythm between editorial bands.
- **Card internal padding:** `{spacing.xl}` (32px) for feature cards and pricing tier cards; `{spacing.lg}` (24px) for testimonial and product-mockup cards.
- **Gutters:** `{spacing.lg}` (24px) between cards in 3-up grids; `{spacing.md}` (16px) inside footer columns.

### Grid & Container
- **Max content width:** ~1200px centered on marketing pages.
- **Editorial body:** Single 12-column grid; hero band often uses 7/5 split (h1 left, app mockup card right).
- **Feature card grids:** 3-up at desktop, 2-up at tablet, 1-up at mobile.
- **Pricing grid:** 4-up at desktop, 2-up at tablet, 1-up at mobile.
- **Footer:** 4-column link list at desktop, wrapping to 2-up at tablet, 1-up at mobile.

### Whitespace Philosophy
Pugu uses generous but not excessive whitespace — section padding sits at 96px, and flat column spacing is aligned with top-border divider lines. The rhythm is calibrated for fast scanning: every band has a single h1 + h2 + supporting flat lists, never densely packed cards.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Body sections, top nav, hero bands, features, pricing columns, testimonials |
| Divider | 3px solid `{colors.primary}` border | Section separations, top-borders for feature grids, pricing tiers, and testimonials |
| Mockup Card | 3px solid `{colors.primary}` border + flat solid drop shadow | Product mockups showing actual UI screens |
| Retro Button | 3px solid `{colors.primary}` border + active translation | CTAs, buttons |

The elevation philosophy is **flat, retro, and boxy** — thick solid divider borders and hard flat drop shadows for interactive elements. No container cards, no background envelopes, no blurry shadows.

### Decorative Depth
- Product UI mockups carry their own thick outlines and hard drop shadows to draw focus to the actual application chrome.
- Avatar circles in testimonial sections sometimes carry pastel fill colors (`{colors.badge-orange}`, `{colors.badge-pink}`, etc.) — adds a small chromatic flourish without breaking the monochrome brand voice.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 0px | Retro blocky edges for small items |
| `{rounded.sm}` | 0px | Small inline buttons, dropdown items |
| `{rounded.md}` | 0px | Standard CTA buttons, text inputs, category tabs |
| `{rounded.lg}` | 0px | Content cards (feature cards, testimonial cards, pricing tier cards) |
| `{rounded.xl}` | 0px | Hero app-mockup card |
| `{rounded.pill}` | 0px | Nav-pill-group, badge pills |
| `{rounded.full}` | 0px | Avatars, icon buttons |

### Photography Geometry
Avatar photos use square styling at 36px or 40px with no border-radius. Hero illustration zones use 16:9 or 4:3 ratios with square corners.

## Components

### Top Navigation

**`top-nav`** — Warm light cream nav bar pinned to the top of every page. 64px tall, `{colors.canvas}` background. Carries the Pugu wordmark + logo at left, primary horizontal menu center, right-side cluster with "Sign in" text-link, "Sign up free" `{component.button-primary}`, and a sometimes-visible language selector.

**`nav-pill-group`** — A small pill-radius wrapper around 2-3 sub-nav segments. Background `{colors.surface-soft}` with internal padding 6px, rounded `{rounded.pill}`. Active segment renders as a warm light cream canvas pill with a subtle drop shadow inside the wrapper. The pill-in-pill treatment is one of Pugu's signature interactive components.

### Buttons

**`button-primary`** — The signature primary CTA. Background `{colors.primary}` (#3A2616), text `{colors.on-primary}`, type `{typography.button}` (Inter 14px / 600), padding 12px × 20px, height 40px, rounded `{rounded.md}` (8px). Active state `button-primary-active` shifts to `{colors.primary-active}` (#B97A3A).

**`button-secondary`** — Warm light cream button with hairline outline. Background `{colors.canvas}`, text `{colors.ink}`, 1px hairline border, same padding + height + radius as primary.

**`button-icon-circular`** — 36 × 36px circular icon button. Background `{colors.canvas}`, hairline border, ink-color icon. Used for share, "view more", carousel arrows.

**`button-text-link`** — Inline text button, no background. Used for "Sign in" in the top nav and inline CTA links inside cards.

**`text-link`** — Inline body links in `{colors.ink}` (the brand keeps inline links monochrome). Underlined on hover (not documented per the no-hover policy, but mentioned for context).

### Cards & Containers

**`hero-band`** — Warm, full-width retro hero background (`/hero-bg.png` rendered at 100% color intensity with a 60% dark overlay filter) with a 7-5 grid: high-contrast light text (`{colors.on-dark}` and `{colors.on-dark-soft}`) on the left, and an interactive `{component.hero-app-mockup-card}` on the right. Vertical padding `{spacing.section}` (96px).

**`hero-app-mockup-card`** — A product-UI mockup card showing the actual Pugu widget with task boards, time slots, and a confirm button. Renders as a boxy mockup container with a 3px solid border, 0px border-radius, and flat solid drop shadow.

**`feature-card`** — Used in 3-up feature grids. Flat layout with a 3px solid top border divider, no container box or background. Carries a small icon, headline, and body description.

**`feature-icon-card`** — A simpler flat feature variant. Top-border divider, no container background. Carries a small icon, title, and short description.

**`product-mockup-card`** — A mockup card showing actual Pugu product UI fragments (workflow editor, task list, timeline). Carries a 3px solid border, 0px border-radius, and flat shadow.

**`testimonial-card`** — Used in testimonial grids. Flat layout with a 3px solid top border divider, no container box or background. Top row carries avatar + name + role; below sits the quote text.

**`pricing-tier-card`** — Standard tier column. Flat layout with a 3px solid top border divider, no container box or background. Carries the plan name, price, feature checklist, and a primary button at the bottom.

**`pricing-tier-card-featured`** — The featured pricing column. Flat layout highlighted with a thicker 4px solid top border divider in brand accent color, and an absolute positioned featured badge at the top-left of the column. No filled card container.

### Inputs & Forms

**`text-input`** — Standard text input. Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body-md}`, rounded `{rounded.md}` (8px), padding 10px × 14px, height 40px. 1px hairline border in `{colors.hairline}`.

**`text-input-focused`** — Focus state. Border thickens or shifts to `{colors.ink}` for emphasis.

### Tags / Badges

**`badge-pill`** — Small pill label used for category tags ("Product", "Article", "New") and pastel-fill avatar substitutes. Background `{colors.surface-card}` or one of the badge pastels (`{colors.badge-orange}`, `{colors.badge-pink}`, etc.), text `{colors.ink}`, type `{typography.caption}` (13px / 500), rounded `{rounded.pill}`, padding 4px × 12px.

**`avatar-circle`** — 36px diameter, rounded `{rounded.full}`. Either holds a photo or a pastel fill with initials in `{typography.caption}`.

**`rating-stars`** — Inline star rating in `{colors.badge-orange}` (#fb923c). Used near testimonial avatars to display a 5-star satisfaction score.

### Tab / Filter

**`category-tab`** + **`category-tab-active`** — Used inside the nav-pill-group. Inactive: transparent background, `{colors.muted}` text. Active: `{colors.canvas}` background, `{colors.ink}` text, subtle drop shadow inside the pill-group wrapper. Padding 8px × 14px, rounded `{rounded.md}`.

### CTA / Footer

**`cta-band-light`** — A pre-footer "Smarter, simpler scheduling" CTA card. Background `{colors.surface-card}`, rounded `{rounded.lg}`, padding `{spacing.xxl}` (48px). Carries an h2 in `{typography.display-sm}`, a sub-line, and a `{component.button-primary}` centered.

**`footer`** — Dark brown footer that closes every page. Background `{colors.surface-dark}` (#3A2616), text `{colors.on-dark-soft}`. 4-column link list at desktop covering Product / Solutions / Company / Resources. Vertical padding 64px. The Pugu wordmark sits at the top-left in `{colors.on-dark}`. The footer is the only dark surface on every page — the deliberate inversion visually closes the page.

## Do's and Don'ts

### Do
- Reserve `{colors.primary}` (#3A2616) for primary CTAs and h1/h2 type. Pugu's button is dark brown, not blue.
- Use display font for every display headline. Pair with body font. Never blur the boundary.
- Apply negative letter-spacing on display sizes (-0.5 to -2px).
- Use `{component.feature-card}` (light gold) and `{component.product-mockup-card}` (warm cream with chrome) deliberately — the gold cards signal "abstract feature claim", cream cards signal "look at the actual product".
- Embed real product UI fragments inside marketing cards. Don't paint marketing illustrations of the product when you can show the product itself.
- Keep avatar circles at 36px, perfect circles, sometimes with pastel fills. Avatars are the only place where badge pastels appear.
- Use `{component.nav-pill-group}` for grouped sub-nav segments. The pill-in-pill treatment is signature.
- End every page with the dark footer. The light-to-dark transition is part of the editorial rhythm.

### Don't
- Don't use accent colors (`{colors.brand-accent}`, badge pastels) on primary CTAs. The system is monochrome at the action layer.
- Don't bold display weight beyond 600. Cal Sans at 700 reads as bombastic.
- Don't use rounded radius beyond `{rounded.xl}` (16px) on cards. Larger radii read as consumer-app, not professional booking software.
- Don't put dark surface cards anywhere except the footer and the featured pricing tier. The dark surface is a deliberate, scarce signal.
- Don't repeat the same surface mode in two consecutive bands. Pugu's pacing alternates warm cream → light gold → warm cream → product-mockup-card → warm cream → dark footer.
- Don't add hover state styling beyond what the system already encodes — primary darkens on press; nothing else changes.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Hamburger nav; hero h1 64→32px; hero-app-mockup-card stacks below content; feature grids 1-up; pricing 1-up; footer 4 cols → 1 |
| Tablet | 768–1024px | Top nav stays horizontal but tightens; nav-pill-group wraps; feature cards 2-up; pricing 2-up |
| Desktop | 1024–1440px | Full top-nav with all menu items; 3-up feature cards; 4-up pricing tiers |
| Wide | > 1440px | Same as desktop with more outer breathing room; max content width caps at 1200px |

### Touch Targets
- `{component.button-primary}` at minimum 40 × 40px.
- `{component.button-icon-circular}` at exactly 36 × 36 — slightly under WCAG's 44 × 44 but the centered icon and full-circle silhouette compensate.
- `{component.text-input}` height is 40px.
- `{component.category-tab}` rendered inside nav-pill-group has 8 × 14 padding; effective tap area meets 44px+ with the surrounding pill.

### Collapsing Strategy
- Top nav collapses to hamburger at < 768px; menu opens as a full-screen sheet.
- Hero band's 7-5 grid collapses to single-column on mobile — h1 + sub-head + buttons first, then the app-mockup card below.
- Feature grids reduce columns rather than scaling cards down.
- Pricing tier cards collapse 4 → 2 → 1; featured-tier dark surface stays visually distinct at every breakpoint.
- Nav-pill-group wraps to multi-row on tablet if the segments don't fit horizontally.
- Avatar + testimonial card layouts stay grid-aligned at every breakpoint.

### Image Behavior
- Product UI fragments inside cards retain native aspect ratios; the cards themselves resize.
- Avatar photos crop to circles at every breakpoint.
- Hero app-mockup card scales proportionally on mobile — the calendar grid stays legible.

## Iteration Guide

1. Focus on ONE component at a time. Reference its YAML key directly (`{component.feature-card}`, `{component.pricing-tier-card-featured}`).
2. Variants of an existing component (`-active`, `-disabled`, `-focused`) live as separate entries in `components:`.
3. Use `{token.refs}` everywhere — never inline hex.
4. Never document hover. Default and Active/Pressed states only.
5. Display headlines stay Cal Sans 600 with negative letter-spacing. Body stays Inter 400. The trinity does not blur.
6. The dark footer is the only dark surface on most pages. Don't add other dark cards casually.
7. When in doubt about emphasis: bigger Cal Sans before bolder Cal Sans.

## Known Gaps

- The dembrandt frequency analyzer captured `Buttons: 0 variants` — Cal.com renders most CTAs as styled `<a>` link elements rather than `<button>` tags, which dembrandt's button selector doesn't capture. Button styles are documented from screenshot ground-truth + standard Cal Sans / Inter baselines.
- Cal Sans is licensed to Cal.com and not available as a public web font; substitutes are documented in the typography section.
- The badge pastel set (orange / pink / violet / emerald) is documented from observed avatar fill colors; exact hex values may shift seasonally.
- Animation and transition timings (calendar slot picker, schedule confirmation, integration grid hover-reveal) are not in scope.
- Form validation states beyond `{component.text-input-focused}` are not extracted — error / success states would need a sign-up or booking flow to confirm.
- The actual booking widget surface (cal.com/{username}) is the product, not a marketing surface; its spec is out of scope.
- Avatar photos in testimonial sections sometimes carry pastel circular fills with initials instead of photographs; both treatments coexist on the same page.
