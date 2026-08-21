# CivicPulse — UI/UX Enhancement Overhaul Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task. Every change must be verified against all 4 themes (civic, arcade, nes, cyberpunk) and respect `prefers-reduced-motion`.

**Goal:** Add tasteful, reactive micro-interactions, entrance/stagger animations, and subtle UX polish across the entire CivicPulse app — strictly within the existing pixel/retro citizen shell and civic command-center shell, while honoring the 4-theme token system and `DESIGN.md` rules.

**Architecture:** Enhance — don't replace. All new visuals must use existing CSS variables (`--color-*`), Tailwind tokens (`bg-retro-*`, `text-intel-*`), and the established `.civic-*` utility classes. `motion/react` is the primary motion primitive (already in use in `LeftSidebar`); CSS keyframes for ambient loops (signal pulses, AI dots, city grid). No new dependencies.

**Tech Stack:** Vite + React 18 + Tailwind 3 + motion 13 + lucide-react + recharts (already installed).

**Non-negotiable constraints (from DESIGN.md):**
- Light canvas, dark ink, **one** electric accent (indigo `--color-intel`) for AI surfaces.
- 4px spacing grid; 6–12px radius on panels; pill only on primary CTA.
- Labels above titles; numbers tabular.
- Status as chip + text (not color alone).
- Tables: `min-w-0`, `table-fixed`, truncate + title tooltip; <lg stacked cards.
- Charts sit in padded cards with `overflow: hidden` + ResponsiveContainer.
- Skip-to-content; focus rings; `prefers-reduced-motion`.
- Motion: 150–250ms micro, 250–450ms entrance, stagger KPIs only.
- No GoI/UX4G logos. No fake metrics.
- Pixel aesthetic on citizen (`pixel-box`, `pixel-btn`, civic-label). Civic premium on government (`intel-surface`, `card-elevated`).
- **All 4 themes must continue to work — any new color uses existing tokens.**

---

## Phase 1 — Foundation utilities (small, safe, low risk)

These are pure CSS additions to `index.css` + minor Tailwind config. Build the motion vocabulary first so every later task uses it.

### Task 1.1: Add new CSS animation utilities

**Files:** `client/src/index.css`

Append a clearly labeled section (before the `@media (prefers-reduced-motion)` block):

- `@keyframes civic-fade-up` (translateY 8px → 0, opacity 0 → 1, 320ms `cubic-bezier(0.22, 1, 0.36, 1)`)
- `@keyframes civic-fade-in` (opacity only, 240ms)
- `@keyframes civic-scale-in` (scale 0.96 → 1, opacity 0 → 1, 220ms)
- `@keyframes civic-slide-right` (translateX -8px → 0, opacity 0 → 1, 240ms)
- `@keyframes civic-shimmer` (background-position sweep, 1.6s linear infinite, used for skeleton/loading)
- `@keyframes civic-press` (scale 0.97 → 1, 120ms — for tactile button feedback)
- `@keyframes civic-glow-pulse` (box-shadow breathe on intel surfaces, 3.2s)
- `@keyframes civic-underline-grow` (scaleX 0 → 1 from left, 260ms)
- `.civic-fade-up`, `.civic-fade-in`, `.civic-scale-in`, `.civic-slide-right`, `.civic-press`, `.civic-glow-pulse`, `.civic-shimmer`, `.civic-underline-grow` classes mapped to those keyframes
- Stagger helpers: `.civic-stagger > *:nth-child(1) { animation-delay: 0ms }` … up to `:nth-child(12) { 220ms }`
- **Add ALL of them to the existing `prefers-reduced-motion: reduce` block** (set `animation: none !important; transition: none !important`)

**Verify:** `grep "civic-fade-up" client/src/index.css` returns ≥1 hit.

### Task 1.2: Add stagger Tailwind plugin-style utility

**Files:** `client/src/index.css`

Add a utility class `.civic-stagger-children` that wraps content and applies staggered delays via custom property `--civic-stagger-step` (default 60ms). Each child gets `animation-delay: calc(var(--civic-stagger-step) * var(--civic-stagger-i, 0))`. Provide a small `<Stagger>` React helper component that injects `--civic-stagger-i` per child via `style={{ '--civic-stagger-i': i }}`.

**New file:** `client/src/components/Stagger.tsx`
- Props: `children`, `step?: number = 60`, `as?: keyof JSX.IntrinsicElements = 'div'`, `className?: string`, `enterClass?: string = 'civic-fade-up'`
- Maps children, wraps in a container, sets inline custom prop per child
- Memoized to avoid unnecessary re-renders

**Verify:** Render `<Stagger><div/><div/></Stagger>` in a temporary file or test, inspect DOM via `document.querySelectorAll('.civic-stagger-children > *')[1].style['--civic-stagger-i']` === `'1'`.

### Task 1.3: Add reusable micro-component primitives

**New files:**

`client/src/components/Pressable.tsx`
- Wraps children in a `motion.button` (or `motion.div` if `as="div"`) with `whileTap={{ scale: 0.97 }}` and `whileHover={{ y: -1 }}` (suppressed when `prefers-reduced-motion`)
- Props: `as?: 'button' | 'div' | 'a'`, `children`, `className`, plus standard button props
- Used everywhere we want consistent tactile feedback (ChirpCard action buttons, sidebar nav, gov cards)

`client/src/components/Reveal.tsx`
- Single-element entrance animation. Props: `as?`, `delay?`, `duration?`, `y?`, `className?`, `children`
- Uses `motion/react` `initial={{ opacity: 0, y }}` → `animate={{ opacity: 1, y: 0 }}` with the project's `--ease-civic` curve
- Respects `prefers-reduced-motion` via `useReducedMotion()` from `motion/react`
- This is the **single source of entrance animation** — components import this instead of inlining motion props

`client/src/hooks/useReducedMotionSafe.ts`
- Tiny wrapper around `motion/react`'s `useReducedMotion()` that returns `true` for SSR safely (default `false`)
- Used in `Pressable` and `Reveal`

**Verify:** TS compiles (`cd client && npx tsc --noEmit`), no console warnings.

---

## Phase 2 — App shell polish (header, sidebar, modals, toasts)

### Task 2.1: App header — sticky translucent + entrance stagger

**File:** `client/src/App.tsx` (the mobile `<header>` block, lines 291–324)

- Add `backdrop-blur-md` (already using `backdrop-blur-[2px]` — upgrade to `backdrop-blur-md` for stronger frosted effect)
- Add `transition-[background-color,border-color,backdrop-filter] duration-200` so theme switches animate smoothly
- Wrap the logo + actions in `<Reveal>` with stagger so they fade in on first mount
- Logo: add subtle `hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150` via existing `transition-` utility (no need for Pressable for the logo div)
- The "Log in" button: replace raw button with `<Pressable as="button">` for consistent micro-feedback

**Verify:** Visual check + theme switch test (all 4 themes).

### Task 2.2: LeftSidebar — already has motion, deepen it

**File:** `client/src/components/LeftSidebar.tsx`

- Already uses `motion.span layoutId="civic-nav-active"` for the active indicator — keep that
- Wrap the nav `<button>` items so the **whole row** gets `whileHover={{ x: 2 }}` via a thin wrapper (don't replace the button — animate a motion.div around the icon)
- Theme picker buttons: replace raw buttons with `<Pressable>`; on theme change, briefly add a `civic-press` class via state for the 120ms feedback
- Logout button: `<Pressable>` wrapping
- User card at bottom: subtle `hover:border-retro-navy` transition (already exists in some form; verify it's 200ms)
- Add `Reveal` wrapper around the whole sidebar top section with `delay: 80` so it eases in after page load

**Verify:** TS compiles; click each nav item — the layoutId spring should slide smoothly; theme picker should feel snappy.

### Task 2.3: RightSidebar — entrance + hover polish

**File:** `client/src/components/RightSidebar.tsx`

- Wrap top `<div>` in `<Stagger step={50}>` with children being the search box, then each section
- Each section card: add `card-elevated` class instead of plain `pixel-box` if not already (gives free hover lift already defined in CSS)
- Search input: add `transition-shadow duration-200` on focus — currently has none
- Trending tag pills: each gets `Pressable` with `whileHover={{ y: -2 }}` for a subtle lift; active click scales down

**Verify:** Visual + hover lift on each pill.

### Task 2.4: ChirpComposer — focused textarea + send button feel

**File:** `client/src/components/ChirpComposer.tsx`

- Textarea: add `transition-colors duration-150` to the border; on focus, the existing `pixel-input:focus` already does the right thing — add a small `transition-shadow duration-200`
- Character counter: when within 10 chars of limit, color animates from `--color-muted` → `--color-accent` over 200ms (CSS class toggle)
- Submit button: wrap in `<Pressable>`; add a `Reveal` so the button fades in once the textarea has content (use `AnimatePresence` from motion/react with `opacity` tied to `hasContent`)
- Location picker + media upload buttons: each becomes a `<Pressable>` with `whileHover={{ y: -1 }}`

**Verify:** Type into textarea — counter color smoothly shifts when nearing limit; submit button opacity eases in.

### Task 2.5: ToastContext — already animated, refine copy + entrance

**File:** `client/src/context/ToastContext.tsx`

- Already uses `.civic-toast-in` / `.civic-toast-out` — keep
- Add a small `motion.div` wrapper for stack entrance (slide up from bottom-right by 4px on add, exit by 8px to right)
- Different toast types get a leading 2px colored bar (success/danger/info/warning) using `--color-success`, `--color-danger`, `--color-intel`, `--color-accent`
- Add `role="status"` and `aria-live="polite"` for accessibility

**Verify:** Trigger 3 toasts in a row — they stack without overlap; each has the colored bar; remove one — exits smoothly.

### Task 2.6: Modal polish (compose, auth, lightbox)

**Files:** `client/src/App.tsx` (compose modal), `client/src/components/AuthModal.tsx`, `client/src/components/PixelImageModal.tsx`, `client/src/components/gov/RequestDetailsModal.tsx`, `client/src/components/gov/NewRequestModal.tsx`, `client/src/components/gov/ImageLightboxModal.tsx`

- Replace static `animate-modal-backdrop` / `animate-modal-open` with `motion`:
  - Backdrop: `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}`
  - Panel: `initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.99 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}`
  - Wrap in `AnimatePresence` so exit animations play
- Close button (X) → `<Pressable>`
- Forms inside: stagger field reveal via `<Stagger>`

**Verify:** Open and close each modal — backdrop fades, panel slides+scales, exit plays in reverse.

---

## Phase 3 — Cards & content polish (citizen side)

### Task 3.1: ChirpCard — like/repost heart pop + subtle card lift

**File:** `client/src/components/ChirpCard.tsx` (485 lines)

- Wrap the entire card in `<Pressable as="div">` only if NOT interactive — actually, keep the card clickable for thread navigation but use `whileHover={{ y: -1 }}` on a wrapper div (don't break the existing onClick handlers)
- Heart icon (`ThumbsUp`): add `motion.span` with `animate={liked ? { scale: [1, 1.4, 1] } : {}}` `transition={{ duration: 0.32 }}` — gives a satisfying pop on like
- Like count number: when it changes, `motion.span` with `key={likesCount}` and `initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }}` for a count tick
- Bookmark icon: tiny rotate on toggle (`whileTap={{ rotate: 12 }}` already on Pressable)
- Repost button: same count-tick pattern
- Civic status badge: when status changes, fade-swap using `AnimatePresence mode="wait"`
- The whole card's hover: `transition-[transform,box-shadow] duration-200` (CSS, not motion) so theme switches still feel right

**Verify:** Like a post — heart pops, count ticks; unlike — reverses smoothly.

### Task 3.2: ThreadView — depth indicators + smooth expand

**File:** `client/src/components/ThreadView.tsx`

- Reply indentation lines (visual depth guide): already present — add a subtle `opacity: 0 → 0.6` fade-in over 400ms when entering thread
- Each reply: stagger via `<Stagger step={40}>` so replies cascade in
- Composer at bottom: same ChirpComposer polish from 2.4

### Task 3.3: HomeFeedPage — first-paint skeleton improvement + feed stagger

**File:** `client/src/pages/HomeFeedPage.tsx`

- The existing `FeedSkeleton` (in App.tsx) uses static divs — replace each skeleton line with `.civic-shimmer` background sweep
- Real feed: first 5 cards animate in via `<Stagger>` on initial mount (cards mounted later get no entrance — only new cards entering do)
- Empty state: if no posts, show a slightly more designed empty state — a centered pixel-art placeholder (SVG inline, 4×4 grid of dots that fade in stagger), one-line civic-label heading, single primary CTA. Use `<Reveal>` for the whole empty state.

### Task 3.4: SearchPage — input focus glow + result count ticker

**File:** `client/src/pages/SearchPage.tsx`

- Search input: stronger focus glow — on focus, add `box-shadow: 0 0 0 4px var(--color-primary-glow), 0 1px 2px var(--color-shadow)` via existing `transition-shadow duration-200`
- Result count "X reports" — animate the number with a `motion.span key={count}` tick like ChirpCard
- Result list: `<Stagger step={30}>` (faster than feed — feels like search-as-you-type)
- Filter chips: each chip gets `civic-chip-in` on mount + `<Pressable>` for tactile feedback

### Task 3.5: NotificationsPage — unread pill pulse + read transition

**File:** `client/src/pages/NotificationsPage.tsx`

- Unread badge dot: `civic-press` re-triggered every 4s (subtle reminder it's unread) — or just a one-shot `civic-fade-in` on initial mount of the unread row
- Marking read: the unread dot fades + shrinks (`opacity: 1 → 0, scale: 1 → 0.6, 200ms`) using `motion.span` with `AnimatePresence`

### Task 3.6: ProfilePage — hero entrance + tab transitions

**File:** `client/src/pages/ProfilePage.tsx`

- Top profile hero block (avatar + name + bio): `<Stagger step={60}>` so avatar → name → bio → stats cascade in
- Stats (followers, posts, supported): each number uses `motion.span key={n}` tick
- Tab switcher (Posts / Supported / About): underline grows via `civic-underline-grow` (CSS `::after` with `transform: scaleX()` — already exists in some Tailwind setups, otherwise add to index.css)
- Tab content swap: `AnimatePresence mode="wait"` so old fades out then new fades in (no overlap)

### Task 3.7: HashtagPage — banner gradient + post stagger

**File:** `client/src/pages/HashtagPage.tsx`

- Top banner with `#tagname`: a subtle gradient using `--color-intel-subtle` to `--color-card` — already exists in `intel-surface` for gov side; reuse the pattern with a hashtag variant
- Posts inside: `<Stagger step={40}>`

### Task 3.8: PixelAvatar — entrance + rarity-tier glow

**File:** `client/src/components/PixelAvatar.tsx`

- On first paint, fade-in over 200ms (using existing pixel-art styling)
- Optional: rare avatars (gold/magenta tier) get a slow `civic-glow-pulse` on the border
- Hover: `whileHover={{ scale: 1.05 }}` via Pressable wrapper if the avatar is clickable

### Task 3.9: PixelAvatarBuilderModal & PixelDrawModal — drawing canvas feedback

**Files:** `client/src/components/PixelAvatarBuilderModal.tsx`, `client/src/components/PixelDrawModal.tsx`

- Color palette swatches: each gets `<Pressable>` + `civic-scale-in` stagger on mount
- Tool buttons (pencil, eraser, fill): active tool has a `civic-press` re-trigger + indigo border (already present, just add transition)
- Save button: success → small `canvas-confetti` burst (already a dep) — keep tasteful, only 30 particles from button center
- Close: same modal polish from 2.6

### Task 3.10: QuoteModal + MentionDropdown + EditProfileModal + BadgeShowcase

**Files:** all four

- Modal entrance: Task 2.6 pattern
- MentionDropdown items: stagger 20ms each
- EditProfileModal fields: stagger 40ms
- BadgeShowcase grid: stagger 30ms with hover-lift per badge tile

---

## Phase 4 — Government command center polish (the "wow" surface)

### Task 4.1: GovernmentPanelPage — overall shell

**File:** `client/src/pages/GovernmentPanelPage.tsx`

- Already has good bones — apply these:
  - Top `GovIntelligenceHero`: `<Stagger>` so title → subtitle → metrics cascade in
  - Section headers (`section-heading`): underline `civic-underline-grow` on first reveal (CSS, no JS)
  - On mount, scroll-triggered reveals using `IntersectionObserver` for sections below the fold (lazy reveal as user scrolls). Add a `useInView` hook.

**New file:** `client/src/hooks/useInView.ts`
- Tiny IntersectionObserver wrapper, returns `[ref, isInView]` tuple
- `threshold: 0.15`, `rootMargin: '0px 0px -80px 0px'`
- One-shot by default (`once: true`)

**Verify:** Scroll the gov panel — sections fade up as they enter viewport.

### Task 4.2: OverviewCards — KPI count-up + stagger

**File:** `client/src/components/gov/OverviewCards.tsx`

- Each KPI card: existing `civic-kpi-in` already animates — keep
- Add stagger via `<Stagger step={80}>` so cards cascade in left-to-right
- KPI number: animate from previous value to new value using a small `useCountUp(target, duration=600)` hook (interpolates with `requestAnimationFrame`, ease-out cubic). Hook respects reduced motion (snap to target).
- Hover: `whileHover={{ y: -2 }}` via Pressable wrapping the card; the card-elevated CSS already handles shadow lift
- Trend arrow (if present): bounce-in via `motion.span`

**New file:** `client/src/hooks/useCountUp.ts`
- Props: `target: number`, `duration?: number = 600`, `enabled?: boolean = true`
- Returns current displayed value (number)
- Respects `prefers-reduced-motion` (snaps instantly)
- Uses `easeOutCubic`

**Verify:** Numbers smoothly tick from 0 → displayed value on mount; updating target animates.

### Task 4.3: GovAnalytics — chart polish

**File:** `client/src/components/gov/GovAnalytics.tsx` (uses recharts)

- Charts already inside `ResponsiveContainer` — keep
- Add a subtle entrance: container fades in, then chart lines/areas draw (recharts has `isAnimationActive` — set `animationDuration={600}`, `animationBegin={index * 80}` for staggered series)
- Legend items: stagger via CSS on mount
- Tooltip: when hovering a data point, a tiny `civic-scale-in` on the tooltip box (recharts default fade is fine, just verify)

### Task 4.4: WardAnalyticsChart — same chart polish + active bar highlight

**File:** `client/src/components/gov/WardAnalyticsChart.tsx`

- Same as 4.3
- On bar hover, the bar's color shifts from `--color-card` to `--color-intel-muted` over 150ms — verify this is set on the recharts `<Bar>` via `onMouseOver` style change OR via CSS `:hover` on a wrapping SVG group
- Add a subtle vertical guide line that follows the cursor over the chart area (recharts supports `<Tooltip cursor={{ stroke: 'var(--color-intel)' }} />`)

### Task 4.5: DeptRanking — row enter + rank-change animation

**File:** `client/src/components/gov/DeptRanking.tsx`

- Each rank row: `<Stagger step={50}>` entrance + already-defined `.civic-row-in` (keep both — they reinforce)
- Rank number: when order changes, `motion.li` with `layout` prop so rows reflow smoothly (`<motion.li layout transition={{ duration: 0.3 }}>`)
- Score value: `motion.span key={score}` count-tick

### Task 4.6: RequestList + RequestCard — list polish

**Files:** `client/src/components/gov/RequestList.tsx`, `client/src/components/gov/RequestCard.tsx`

- List: `<Stagger step={40}>` on first paint
- RequestCard hover: `whileHover={{ y: -1 }}` via Pressable — already has CSS `card-elevated`, just verify transition timing matches (220ms)
- Status badge (Open / In progress / Resolved): when status changes, fade-swap with `AnimatePresence mode="wait"`
- Click → RequestDetailsModal (covered in 2.6)

### Task 4.7: IntelligenceBriefing + BriefingMarkdown — typing effect on initial render

**Files:** `client/src/components/gov/IntelligenceBriefing.tsx`, `client/src/components/gov/BriefingMarkdown.tsx`

- When a new briefing loads (not on first mount — only when content changes), show a brief "compiling" typewriter: reveal the first 80 chars character-by-character at ~12ms each, then snap to full content
- Use a `motion.span` with `overflow: hidden` and `width` animating 0 → 100% over the appropriate time, OR a per-character `<motion.span>` array
- Reduced motion: just fade in the full briefing
- After the reveal, the "Ask" button gets a tiny pulse to draw the eye

### Task 4.8: AIProcessing — pipeline visualization

**File:** `client/src/components/gov/AIProcessing.tsx`

- Already has step animations (`.civic-step-active`) — keep
- Add: connecting line between steps fills with `--color-intel` over 240ms as each step activates (`stroke-dasharray` + `stroke-dashoffset` animation)
- Each step's icon: `<motion.span>` with `initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}` when activated
- Reduced motion: skip line fill, just instant state change

### Task 4.9: GovAnalytics/CustomButton/Header

**Files:** `client/src/components/gov/CustomButton.tsx`, `client/src/components/gov/Header.tsx`

- CustomButton: replace raw button with `<Pressable>` wrapping the inner span
- Header: brand mark + tagline `<Reveal>`; theme/cog buttons `<Pressable>`

### Task 4.10: CitySignal + GovIntelligenceHero — ambient life

**Files:** `client/src/components/gov/CitySignal.tsx`, `client/src/components/gov/GovIntelligenceHero.tsx`

- CitySignal: already has `.city-signal-pulse` + `.city-signal-node` — keep, verify they respect reduced motion (already in the @media block — verify)
- GovIntelligenceHero: add a soft radial glow behind the headline using `civic-glow` (already a class — verify uses `--color-intel`); the glow should be very subtle (opacity 0.18 max), pointer-events: none
- Add a subtle parallax on the hero — `useReducedMotionSafe` + `motion.div` with `style={{ y: scrollY * 0.04 }}` on the glow only

**Verify:** Glow stays subtle in all 4 themes; reduced motion users see no parallax.

---

## Phase 5 — Cross-cutting polish

### Task 5.1: AmbientParticles — already exists, tune opacity

**File:** `client/src/components/AmbientParticles.tsx`

- Verify it's gated by `prefers-reduced-motion` — if not, gate it
- Reduce particle count by 30% to feel less busy
- Use `--color-intel-muted` for color so they integrate with theme

### Task 5.2: CursorTrail — gated, lighter

**File:** `client/src/components/CursorTrail.tsx`

- Already exists — verify it respects reduced motion (likely does)
- Reduce trail length from current default to feel less intrusive

### Task 5.3: Skeletons everywhere

**Files:** Wherever `pixel-skeleton` / `pixel-skeleton-text` is used

- Replace flat backgrounds with the new `.civic-shimmer` class (linear-gradient sweep)
- Apply in: `FeedSkeleton` (App.tsx), anywhere loading states appear

### Task 5.4: Focus-visible — verify everywhere

- Audit all `<button>`, `<a>`, `<input>`: ensure no inline `outline: none` without a `focus-visible` replacement
- The base CSS already has a good `:focus-visible` (line 625) — verify nothing overrides it destructively

### Task 5.5: Color contrast audit

- Walk through each theme (civic, arcade, nes, cyberpunk) and ensure all new animations don't introduce low-contrast text on hover (e.g., white-on-white in cyberpunk)

---

## Phase 6 — Verification & QA

### Task 6.1: TypeScript build

Run: `cd client && npx tsc --noEmit`
Expected: 0 errors.

### Task 6.2: Production build

Run: `cd client && npm run build`
Expected: succeeds; bundle size growth < 50KB gzipped (motion is already loaded).

### Task 6.3: Theme matrix visual check

For each theme (civic, arcade, nes, cyberpunk):
- Open `/#home`, `/#search`, `/#notifications`, `/#gov-panel`, `/#profile-citizen_demo`
- Verify: colors correct, animations play, focus rings visible, no overflow issues
- Document any issues for fix-up

### Task 6.4: Reduced motion check

- macOS: System Preferences → Accessibility → Display → Reduce motion ON
- Verify all `motion` components snap (not animate), no ambient loops visible
- Skeletons become static (no shimmer)

### Task 6.5: Mobile responsiveness

- Resize to 375px, 768px, 1024px, 1440px
- Verify: no horizontal overflow, mobile bottom nav still works, modals fit, gov panel scrolls properly

### Task 6.6: Aria + keyboard nav

- Tab through every page
- Verify: every interactive element reachable, focus order sensible, modals trap focus, Esc closes

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| `motion` re-renders break existing memoized cards | Med | Wrap motion in stable components; don't pass inline objects from ChirpCard render |
| New animations feel busy in cyberpunk theme | Med | Phase 6.3 theme matrix catches; tone down ambient particles in dark themes |
| KPI count-up looks weird if data arrives mid-render | Low | useCountUp starts from current displayed value, not 0, on subsequent updates |
| ThreadView stagger jank on long threads | Med | Cap stagger to first 10 replies; rest appear instantly |
| prefers-reduced-motion missed somewhere | Med | Single `useReducedMotionSafe` hook; every new motion component uses it |
| Bundle size grows | Low | `motion` already loaded; new components are tiny |
| TS errors from motion import path differences | Low | Project uses `motion/react` (verified in LeftSidebar.tsx) — use that path consistently |

## Files to touch (high-level)

- **CSS:** `client/src/index.css` (add utilities, extend reduced-motion block)
- **New files (small):** `components/Stagger.tsx`, `components/Pressable.tsx`, `components/Reveal.tsx`, `hooks/useReducedMotionSafe.ts`, `hooks/useInView.ts`, `hooks/useCountUp.ts`
- **Modified heavily:** `components/ChirpCard.tsx`, `components/ChirpComposer.tsx`, `components/LeftSidebar.tsx`, `components/RightSidebar.tsx`, `pages/HomeFeedPage.tsx`, `pages/GovernmentPanelPage.tsx`, `components/gov/OverviewCards.tsx`, `components/gov/IntelligenceBriefing.tsx`, `App.tsx`
- **Modified lightly:** ~25 other component files (modal polish, Pressable wrapping, Stagger entrance)
- **No server changes** — pure client-side polish

## Out of scope

- New pages or features
- Server API changes
- Auth flow changes
- New dependencies (everything uses `motion`, `lucide-react`, `canvas-confetti` already installed)
- Landing page (`../card/apple-3d-card`) — explicitly unchanged per README
- Pixel-art asset creation (we reuse existing pixel-art classes)
