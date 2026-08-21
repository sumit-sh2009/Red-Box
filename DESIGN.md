# DESIGN.md: UX4G Design System (Government of India)

## Source
- URL: https://www.ux4g.gov.in/
- Capture date: 21 Aug 2026
- Evidence: Firecrawl `branding` + `images` scrape (`.firecrawl/ux4g-branding.json`); full-page screenshot (`.firecrawl/ux4g-screenshot.png`). `www.` DNS failed once; `https://ux4g.gov.in/` succeeded.
- Do **not** copy GoI emblems, flags, UX4G logos, or copy. Extract **principles and tokens** only.

## Reference Screenshot
![Full-page screenshot of UX4G](./.firecrawl/ux4g-screenshot.png)

Use this screenshot as the visual source of truth for layout, hierarchy, density, and feel. Tokens below describe the same page in machine-readable form.

## Design Summary
UX4G is a **light, civic, high-trust** design system: near-white canvas, near-black ink, a single **electric indigo** brand (`#4A2BC2`, theme-color). Personality is professional / medium energy for government builders. Layout is a **component gallery**: skip-to-content, India.gov skip bar, wordmark header, pill primary CTA, then a **live product mock** (forms, OTP, file upload, SLA chips, payment, pipeline steps) sitting in a framed stage before long-form marketing.

For CivicPulse: take **trust + accessibility + pipeline visibility + compact labeled fields**. Do **not** take marketing hero scale (80px H1) or copy India.gov chrome into the intelligence panel.

## Design Tokens

### Colors
Observed (Firecrawl branding, confidence ~0.9):

| Role | Hex | Use |
|---|---|---|
| Primary / accent | `#4A2BC2` | Brand, primary CTA, theme-color |
| Secondary / ink | `#10092B` | Headings, body emphasis |
| Background | `#FAFAFA` | Page canvas |
| Link (marketing) | `#FAEFFF` | Light lilac on dark/indigo (marketing only) |
| Input text | `#171717` | Form fields |
| Primary button text | `#FFFFFF` | On indigo |

Inferred (from screenshot / component demos, not in branding JSON):

| Role | Approx | Notes |
|---|---|---|
| Success | `#0F7A45` | Verified / payment received / pipeline check |
| Warning | `#C45A12` | Session expiry, SLA countdown |
| Danger | `#B42318` | Validation errors (`! Must be 10 chars`) |
| Info / AI | `#4A2BC2` at 8–12% fill | Intelligence surfaces |
| Border | `#E4E2EC` | Hairline on cards |
| Muted | `#5C5A6A` | Helper text |

CivicPulse mapping: keep navy `#0b2545` as **civic structure**; use UX4G indigo **only** for AI/intelligence accents. Do not neon-ize.

### Typography
Observed:

- Body: **Noto Sans** 16px
- Heading: **Schibsted Grotesk** (H1 80px marketing, H2 52px — too large for a dashboard)
- Also listed: DM Sans

CivicPulse: keep **IBM Plex Sans / Serif / Mono** (already loaded). Dashboard scale:

- Label: 11px / 600 / tracking 0.08em uppercase (civic-label)
- Body: 14–16px / 400 / 1.45
- Section title: 18–20px / 600
- KPI number: 28–32px / 600 tabular-nums
- Do not use 80px display type in the government panel

### Spacing And Layout
Observed: **4px base unit**, default radius **6px**, primary CTA radius **999px** (pill), CTA shadow `0 10px 30px -10px` indigo 35%.

Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.

Layout: full-width header; content max ~1120–1280px inferred; component stage is a **product screenshot frame** with overlapping cards (OTP, uploads, SLA). Dashboard should **not** overlap cards; use a 12-column grid with `minmax(0,1fr)` and `overflow-x: clip` on the shell.

## Components
- **Skip to main content** — first interactive control.
- **Header**: flag/emblem row (do not copy) + wordmark + text nav + pill Get Started.
- **Primary button**: indigo, pill, white type.
- **Secondary**: white, square, dark type (observed as 0 radius — prefer 6px for CivicPulse consistency).
- **Fields**: labeled, helper under, error with `!` prefix, Aadhaar-style “cannot be edited”.
- **Status chips**: Issued / Verified / SLA days left / Scanning 62%.
- **Pipeline**: numbered steps Filed → Verified → Inspect → Approve with checks.
- **Empty**: “No drafts yet” + one-line next action.
- **Accessibility widget**: persistent; profiles, contrast, pause animation.

## Page Patterns
1. Utility bar (skip, type size, language)
2. Brand header + CTA
3. Interactive component theatre
4. Marketing H1 + dual CTAs
5. Numbered capability sections (1–4)
6. Bento: components vs patterns
7. Solutions tabs
8. FAQ accordion
9. Multi-column footer + visitor count

Responsive: mobile stacks theatre cards; desktop overlapping collage. CivicPulse gov: **desktop command center**; tablet 2-col KPIs; mobile **card queue**, not shrunk tables.

## Content Style
Voice: civic, specific, compliance-aware (“DPDP”, “GIGW 3.0”, “billion citizens”). CTAs: Get Started / Component Library / Apply →. Headings are long and declarative.

CivicPulse briefing: **situation, signals, recommended actions** — not marketing slogans.

## Agent Build Instructions
1. Light canvas, dark ink, **one** electric accent for AI.
2. 4px spacing grid; 6–8px radius on panels; pill only on primary CTA.
3. Labels above titles; numbers tabular.
4. Status as chip + text (not color alone).
5. Tables: `min-w-0`, `table-fixed`, truncate + title tooltip; &lt;lg use stacked cards.
6. Charts sit in padded cards with `overflow: hidden` + ResponsiveContainer.
7. Skip-to-content; focus rings; `prefers-reduced-motion`.
8. Motion: 150–250ms micro, 250–450ms entrance, stagger KPIs only.
9. No GoI/UX4G logos. No fake metrics.

## Design directions compared (Superdesign-style)

| | A Command center | B Premium SaaS | C Municipal ops |
|---|---|---|---|
| Feel | Live intelligence | Startup polish | Field operations |
| Risk | Can look sci-fi | Generic admin | Boring forms |
| **Choice** | **A + C hybrid, UX4G tokens** | Skip | Borrow SLA chips + pipelines |

Selected: **Civic intelligence operations** — UX4G trust language + dense ops dashboard. Not SaaS template, not cyberpunk.

## Rerun Inputs
workflow: firecrawl-website-design-clone
source_url: https://www.ux4g.gov.in/
target_stack: Vite React + Tailwind + Recharts + Motion
output: DESIGN.md
