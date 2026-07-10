# Yggdrasil Brand Guidelines & Design System

This document serves as the single source of truth for the visual identity and brand voice of **Yggdrasil**. All developers and designers must adhere to these principles to maintain consistency and prevent the interface from drifting into generic clinical or default SaaS aesthetics.

---

## Tagline

> Your journal, grown into a living map of you.

*Usage:* display treatment is Cormorant Garamond Light; "living map of you" carries the emphasis.

---

## 1. Brand Voice & Philosophy

*   **Warm, Elegant, Gentle:** The tone of the writing, the UI transitions, and the responses must feel like a trusted companion. It is inviting and slow.
*   **Spiritually Intelligent:** We draw inspiration from old-growth forests, sacred geometry, and ancient cosmology. The application is not a clinical mental health app, a checklist mood tracker, or a corporate productivity tool.
*   **Quiet Authority:** Like a master calligrapher, our design relies on restraint, weight, texture, and generous whitespace. We do not clutter the screen with generic pill buttons, bright rounded cards, or clinical whites/cheerful blues.

---

## 2. Design Tokens & Palette

These colors are defined in `app/globals.css` and are available as Tailwind utility classes:

### Color Palette

| Token Name | Class Variable | Hex Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Background** | `bg-background` | `#0F1A14` | Near-black with green undertone; the dark mode base |
| **Foreground** | `text-foreground` | `#E8E0D0` | Warm cream text; high legibility on dark background |
| **Primary** | `bg-primary` | `#1A3C2E` | Deep forest green; the soul of the brand |
| **Surface** | `bg-surface` | `#162318` | Slightly lifted dark container surface |
| **Surface 2** | `bg-surface-2` | `#1E2E22` | Card, panels, and composer surface |
| **Muted** | `bg-muted` | `#2A4035` | Subtle dividers, disabled states, scrollbar tracks |
| **Gold** | `text-gold` | `#C9A84C` | Sacred geometry highlights; used sparingly (max 1-2x per screen) |
| **Sage** | `text-sage` | `#7BAE8A` | Secondary text, tags, subtle glows |
| **Earth** | `text-earth` | `#8B6B4A` | Tertiary accent; warm wood brown for roots/goals theming |
| **Destructive** | `bg-destructive`| `#8B3A3A` | Errors and high-alert actions only |

---

## 3. Typography Scale

Google Fonts are loaded via Next.js `next/font/google` and exposed as Tailwind properties:

*   **Display Font:** `Cormorant Garamond` (Weights: 300, 400).
    *   *Usage:* Display headers, card titles, quotes. Expresses spiritual gravitas—"the voice of the oracle".
*   **Body Font:** `Inter` (Weights: 400, 500, 700).
    *   *Usage:* Body copy, form input values, and generic UI text. Clean and readable on dark surfaces.
*   **Mono Font:** `JetBrains Mono` (Weights: 400).
    *   *Usage:* Timestamps, data metrics, and insight metadata tags.

### Sizing Scale

*   `text-hero` (`3.5rem` / `56px`): Hero typography, landing headers.
*   `text-section` (`2.25rem` / `36px`): Page sections.
*   `text-card` (`1.5rem` / `24px`): Entry titles, large quotes.
*   `text-quote` (`1.25rem` / `20px`): Derived emotion labels, callouts.
*   `text-body-lg` (`1.0rem` / `16px`): Composer/journal entry body text.
*   `text-body-md` (`0.875rem` / `14px`): Normal body text, secondary descriptions.
*   `text-body-sm` (`0.8125rem` / `13px`): Captions, inline instructions.
*   `text-label` (`0.6875rem` / `11px`): Nav items, form labels (typically ALL-CAPS).

---

## 4. Interaction & Motion

*   **Borders:** Subtle border-radius (`0.25rem` or `4px` represented by `rounded-sm`). Avoid large pill shapes (`rounded-full`) on structural controls.
*   **Hover states:** Micro-animations should be slow and deliberate (300–500ms easing). Nothing should pop, snap, or bounce. Elements should breathe.
*   **Gold Detail:** Hovering over primary action buttons reveals a subtle left-edge 2px gold border indicator (`before:bg-gold`), providing an organic tactile response.

---

## Change history

| Version | Date | Change |
|---|---|---|
| 1.0 | — | Initial brand doc |
| 1.1 | July 2026 | Added tagline section |
