> ⚠️ **OBSOLETE — do not work from this file.** Design-era collateral for the original Figma Make mockup prompts. The brand source of truth is [`docs/brand.md`](brand.md). Kept for historical reference only.

# Yggdrasil — Figma Make Prompt Suite
### Complete phased prompts for app mockup design
**Screen Sage Studios · Build with Gemini XPRIZE submission**

---

> **How to use this document**
> Each phase is a self-contained prompt to paste into Figma Make. Run them sequentially. Each one builds on the component library established in Phase 1. Do not skip phases — later prompts reference tokens and components by name. Estimated credits per phase are noted in the header of each section.

---

## MASTER DESIGN BRIEF
### (Read this. Paste into every phase as context if Figma Make loses memory.)

```
PRODUCT: Yggdrasil — AI-powered semantic journaling web app
TAGLINE: "Your journal, grown into a living map of you."
STUDIO: Screen Sage Studios
COMPETITION: Build with Gemini XPRIZE (Education & Human Potential, deadline Aug 17 2026)

DESIGN PHILOSOPHY:
- Beautiful but simple. Elevated but accessible. Modern but timeless.
- Spiritually intelligent — not clinical, not a mood tracker, not a productivity app.
- The visual language of old-growth forests, sacred geometry, and ancient cosmology —
  rendered through restraint and precision, not decoration.
- Think: a master calligrapher designed a journaling app. Quiet authority.
- NO: pill buttons everywhere, bright rounded cards, clinical whites, cheerful blues.
- NO: generic SaaS dashboard aesthetic.
- YES: weight, texture, depth, stillness.

BRAND TOKENS (non-negotiable):
  Primary:       #1A3C2E  (deep forest green — the soul of the brand)
  Background:    #0F1A14  (near-black with green undertone — dark mode base)
  Surface:       #162318  (slightly lifted dark surface)
  Surface-2:     #1E2E22  (card/panel surface)
  Muted:         #2A4035  (subtle dividers, disabled states)
  Gold accent:   #C9A84C  (sacred geometry highlight — used sparingly, max 1-2x per screen)
  Warm cream:    #E8E0D0  (primary text on dark, also used for body copy)
  Sage:          #7BAE8A  (secondary text, tags, subtle glows)
  Earth:         #8B6B4A  (tertiary accent — warm brown, for roots/goals theming)
  Danger:        #8B3A3A  (errors only)

TYPOGRAPHY (non-negotiable):
  Display:    Cormorant Garamond, weight 300–400, generous letter-spacing
              (spiritual gravitas — the voice of the oracle)
  Body:       Inter, weight 400/500, size 14–16px
              (clean, reads well on dark)
  Mono/data:  JetBrains Mono, weight 400
              (insight tags, timestamps, analytics)
  Label/UI:   Inter, weight 500, ALL-CAPS, letter-spacing 0.08em, size 11px
              (navigation, section headers)

MOTION PRINCIPLE: Slow, deliberate. Easing: ease-out or custom cubic-bezier(0.16, 1, 0.3, 1).
Transitions: 300–500ms. Nothing bounces. Nothing pops. Everything breathes.

METAPHORS IN THE UI:
  - Journal entries = leaves on the tree / nodes in the network
  - Insights = roots being revealed beneath the surface
  - Knowledge graph = the world-tree's branches, spreading
  - Yggi companion = the raven on the branch — wise, watching, reflective
  - Growth = the tree growing season by season
  - Hidden connections = threads of light between distant nodes

LAYOUT PRINCIPLES:
  - Mobile-first. Primary breakpoint: 375px wide. Scale up to 1440px desktop.
  - Generous whitespace. Dark surfaces breathe.
  - Left-rail navigation on desktop; bottom tab bar on mobile.
  - Max content width: 720px centered (journal, entries, insights text).
  - Knowledge graph / D3 vis: full bleed with dark background.
  - Subtle organic texture (very low opacity noise overlay on backgrounds — ~3% opacity).
```

---

## PHASE 1 — Design System Foundation
**Estimated credits: low–medium | Run this first, before any screens**

```
You are designing the complete design system for Yggdrasil, an AI-powered semantic
journaling web app. This phase creates the foundational component library that all
subsequent screens will draw from. Do not design any full screens yet — only the
system primitives and core components.

---

CONTEXT (apply throughout all work):
[PASTE MASTER DESIGN BRIEF HERE]

---

BUILD THE FOLLOWING, in this order:

### 1. Color styles
Create Figma color styles for every token in the brand palette:
- bg/base: #0F1A14
- bg/surface: #162318
- bg/surface-2: #1E2E22
- bg/muted: #2A4035
- accent/primary: #1A3C2E
- accent/gold: #C9A84C
- accent/sage: #7BAE8A
- accent/earth: #8B6B4A
- text/primary: #E8E0D0
- text/secondary: #A89F90
- text/muted: #5C6B60
- text/inverse: #0F1A14
- status/danger: #8B3A3A
- status/success: #3A6B4A
- border/subtle: rgba(232,224,208,0.08)
- border/default: rgba(232,224,208,0.15)

### 2. Text styles
Create Figma text styles:
- display/hero: Cormorant Garamond 300, 56px, line-height 1.1, tracking -0.01em
- display/section: Cormorant Garamond 300, 36px, line-height 1.2
- display/card: Cormorant Garamond 400, 24px, line-height 1.3
- display/quote: Cormorant Garamond 300 italic, 20px, line-height 1.5, tracking 0.01em
- body/lg: Inter 400, 16px, line-height 1.6
- body/md: Inter 400, 14px, line-height 1.6
- body/sm: Inter 400, 13px, line-height 1.5
- label/nav: Inter 500, 11px, ALL CAPS, tracking 0.08em
- label/tag: Inter 500, 11px, tracking 0.04em
- label/ui: Inter 500, 12px, tracking 0.02em
- mono/data: JetBrains Mono 400, 12px, line-height 1.4

### 3. Core UI components

**Buttons:**
- Primary button: bg accent/primary, text text/primary, border 1px accent/gold at 40% opacity,
  height 44px, padding 0 24px, letter-spacing 0.04em, Inter 500 12px ALL CAPS.
  Hover: bg lightens 10%, gold border brightens.
  Subtle left-edge 2px accent/gold line on hover (not a full border — a detail).
- Ghost button: transparent bg, border border/default, text text/secondary.
  Hover: border brightens to border/default full opacity.
- Danger button: border status/danger, text status/danger, transparent bg.
- Icon button: 40px square, bg/surface-2, hover bg/muted.
  All buttons: border-radius 4px (not pill, not 0 — subtle).

**Input fields:**
- Text input: bg bg/surface, border border/subtle, border-radius 4px, height 44px,
  padding 0 16px. Focus: border accent/sage, subtle sage glow (box-shadow 0 0 0 2px rgba(123,174,138,0.15)).
  Placeholder: text/muted. Value: text/primary.
- Textarea (journal composer): Same as input but min-height 280px, padding 16px,
  no border — only a bottom border in border/subtle. On focus, bottom border becomes accent/sage.
  Font: body/lg Inter. Resize: vertical only.
- Search input: left icon (magnifier in text/muted), same styling as text input.

**Cards:**
- Entry card: bg bg/surface-2, border border/subtle, border-radius 8px, padding 20px 24px.
  Left edge: 3px solid accent/sage (subtle category indicator).
  Date label: mono/data text/muted top-right. Title: display/card. Body: body/md text/secondary.
  Tags: small pills (see Tags below). Hover: border brightens, subtle lift (box-shadow).
- Insight card: Same base, but left edge is accent/gold. Title has gold tint.
  Small "✦ Insight" label in accent/gold at label/tag size.

**Tags / pills:**
- Default tag: bg bg/muted, text text/secondary, border-radius 3px, padding 2px 10px,
  font label/tag. Hover: bg accent/primary at 40%.
- Active tag: bg accent/primary, text text/primary.
- AI tag: same as default but subtle left dotted border in accent/sage (marks AI-generated tags).
- Entry type badge (Reflection / Gratitude / Dream / Event): each has a distinct subtle tint.
  Reflection: sage. Gratitude: gold. Dream: lavender (#8B7BAE). Event: earth.

**Dividers:**
- Section divider: 1px border/subtle with optional centered label in label/ui text/muted.
  Label has 32px gap on each side with the line extending to fill. Sacred geometry feel.
- Decorative rule: 40px wide, 1px, accent/gold at 30% — centered. Used sparingly.

**Navigation (bottom tab bar, mobile):**
5 items: Journal · Entries · Roots · Insights · Settings.
Bar: bg bg/surface, border-top border/subtle. Tab height 64px. Icons 22px.
Active state: icon + label in text/primary. Dot indicator: 4px circle accent/gold below label.
Inactive: icon text/muted, no label shown on mobile (icon only except active).

**Navigation (left rail, desktop):**
Width 220px. bg bg/surface. Border-right border/subtle.
Logo/wordmark at top (48px tall section). Nav items: 48px tall, padding 0 20px.
Active: bg bg/muted, left edge 3px accent/gold, text text/primary, icon accent/gold.
Inactive: text text/muted, icon text/muted. Hover: bg bg/surface-2.

**Yggi FAB (floating action button):**
Bottom-right. 56px circle. bg: radial gradient from accent/primary to #0D2219.
Border: 1.5px accent/gold at 60%.
Icon: a stylised raven silhouette (or nordic rune "ᚱ") in accent/gold.
Pulse animation ring: 1px border, accent/sage, expands outward every 4s (ambient life).

**Mood sliders:**
Two sliders, stacked. Labels: "Polarity" and "Intensity", label/ui style.
Track: 4px tall, border-radius 2px. bg/muted for track, accent/sage for fill.
Thumb: 18px circle, bg text/primary, border 2px accent/sage.
Left/right endpoint labels: text/muted body/sm. Current derived emotion label displayed
centered below sliders in display/quote italic, accent/gold color.

**Loading / thinking state:**
"Yggdrasil is thinking…" indicator: a small branching tree glyph (SVG, ~16px) that slowly
rotates/pulses in accent/sage. Accompanied by the text in body/sm text/muted italic.
NOT a spinner. The glyph should feel organic, not mechanical.

**Toast / notification:**
Pill shape (border-radius 999px), bg bg/surface-2, border border/default.
Left dot: 6px circle in status color. Text: body/sm text/primary.
Appears from bottom-center, slides up, fades after 4s.

**Progress / streaks:**
Streak number: very large display/hero text in text/primary.
Sub-label: "day streak" in label/ui text/muted.
Streak calendar: 7×N grid of 10px rounded squares. Active days: accent/sage.
Longest streak: accent/gold. Missed: bg/muted. Today: ring border accent/sage.

**Empty states:**
Centered layout. Icon: 48px, text/muted (subtle SVG, tree-related).
Headline: display/card text/secondary. Body: body/md text/muted.
CTA button: primary.
Background: faint radial gradient from accent/primary at 5% opacity, centered.

### 4. Sacred geometry motif (background decoration element)
Create a reusable decorative element: a very subtle Metatron's Cube or Flower of Life
geometric outline. Use as a background layer on key screens (hero, empty states, insight reveals).
Color: text/primary at 3–5% opacity. Size: ~400px. This is texture, not focal point.
Stroke only — no fill. Fine lines (0.5px stroke). Should feel like watermark.

### 5. Icon set guidance
Use Phosphor Icons (regular weight) as the base icon library. Confirm these icons are
available and styled at 20–22px for nav, 16px for inline:
- Journal tab: NotePencil
- Entries tab: Archive
- Roots tab: Tree
- Insights tab: ChartLineUp
- Settings tab: Gear
- Yggi: Raven (custom SVG if not available — see FAB spec above)
- Search: MagnifyingGlass
- Add/new: Plus
- Tag: Tag
- Goal: Target
- Journey: Path
- Achievement: Medal
- Hidden Connections: GitBranch or Intersect
- Knowledge Graph: Graph

Deliver: a component sheet with all components named and organized in Figma, using
auto-layout properly, with all variant states created (default / hover / focus / disabled
/ active). All color and text styles applied from the style library — no hardcoded values.
```

---

## PHASE 2 — Marketing Landing Page (`/`)
**Estimated credits: medium | Requires Phase 1 complete**

```
Design the Yggdrasil marketing landing page. This is the first thing a potential user
sees. It must communicate the product's soul, earn trust, and convert to signup.
Target audience: reflective self-aware adults in their late 20s–40s doing personal
growth work. They are spiritual (not religious), skeptical of gimmicks, and willing
to pay for something that genuinely changes how they understand themselves.

[PASTE MASTER DESIGN BRIEF HERE]

---

PAGE STRUCTURE — design all sections in one scrollable desktop frame (1440px wide)
and one mobile frame (375px wide). Dark mode only.

### HERO SECTION
Full viewport height (100vh). Background: bg/base with the sacred geometry motif
centered at 4% opacity. Very subtle radial vignette (darker at edges).

Layout: vertically centered. Left 55% is text. Right 45% is the hero visual.

LEFT — Text block (max-width 560px):
- Eyebrow label: "Screen Sage Studios presents" in label/nav text/muted, letter-spaced
- Headline: "Your journal, grown into a living map of you."
  Display/hero, Cormorant Garamond 300, two lines. "living map of you" on line 2.
  The word "living" has a subtle underline in accent/gold (not full-width — just that word).
- Subhead: "Yggdrasil reads what you write, finds the patterns you can't see, and
  reflects your inner world back to you."
  body/lg text/secondary, max-width 460px.
- Two CTAs side by side:
  - Primary: "Begin your practice" → /signup
  - Ghost: "See how it works" → scrolls to features
- Below CTAs: small social proof line in body/sm text/muted:
  "Journaling, understood. Powered by Google Gemini AI."
  Gemini logo mark (small, text/muted, 14px) inline.

RIGHT — Hero visual (conceptual illustration, not a photo):
A stylised world-tree (Yggdrasil) rendered as a force-directed node graph.
Roots below → trunk center → branches above, each node being a journal entry.
Some nodes pulse softly in accent/sage. Gold threads connect distant nodes
(hidden connections). The whole thing glows faintly against the dark.
This is an SVG illustration frame — mark it with a purple note "ILLUSTRATION:
D3-style Yggdrasil tree with glowing nodes. Commission SVG or generate."
Frame it in a soft radial glow (accent/primary, ~20% opacity, 400px radius).

### WHAT IT DOES (Feature Overview)
Full-width section. Padding 120px vertical.
Background: slight lift to bg/surface.

Section eyebrow: "Your writing. Understood." — label/nav, centered, accent/sage.
Section headline: "Journaling that thinks with you." — display/section, centered.

Three feature columns (equal width, centered within 1080px max):

Column 1 — EXTRACT
  Icon: a leaf unfurling (Phosphor: Leaf or custom)
  Headline: "Automatic insight, every entry"
  Body: "Every time you write, Gemini analyses your entry for themes, emotions,
  people, and patterns — across 13 dimensions. No prompting required."

Column 2 — CONNECT (Featured / raised card with gold border)
  Icon: GitBranch or graph icon in accent/gold
  Badge: "Signature feature" in accent/gold label/tag
  Headline: "Hidden Connections"
  Body: "Quantum-inspired graph analysis surfaces non-obvious relationships
  between entries written months apart. The patterns your conscious mind missed."
  Sub-note: "Powered by Google Cirq" — mono/data text/muted

Column 3 — GROW
  Icon: Tree or ChartLineUp
  Headline: "A map that grows with you"
  Body: "Your knowledge graph evolves with every entry. Watch your inner world
  take shape — themes, emotions, goals, and their connections — over time."

### YGGI — THE COMPANION
Full-width section. Padding 100px vertical. Background: bg/base.

Layout: Two columns, 50/50. Right side: mockup of the Yggi chat drawer (use the
component from Phase 3 — or placeholder frame with note). Left side: text.

Left text block:
  Eyebrow: "Meet Yggi" — label/nav accent/sage
  Headline: "An AI companion who's read your whole story."
  Display/section, max-width 420px.
  Body: "Yggi has full context over your entire journal history. Ask it anything —
  it won't give you generic advice. It knows what you were feeling six months ago."
  Body/lg text/secondary.
  CTA: Ghost button "See what Yggi knows" → links to /pricing or scrolls to pricing.
  Note below: "Yggi is available on Pro." — body/sm text/muted.

Right side: Yggi chat mockup frame (380px wide, ~480px tall).
  Show 2–3 conversation turns. Sample exchange:
  User: "Why do I keep writing about my mother even when I don't mean to?"
  Yggi: "I've noticed that she appears in 23 of your 87 entries — most often in
  entries tagged with 'belonging' and 'home'. The thread tends to surface when
  you write late at night. Would you like to explore what those entries have in common?"
  Frame this with a subtle glow (accent/primary, 15% opacity) behind it.

### ROOTS & GROWTH
Narrow section (900px max centered). Padding 100px vertical.
Background: very subtle radial warm glow (accent/earth at 4%) on bg/base.

Headline: "A tree that grows as you do." — display/section, centered.
Subhead: "The Living Tree in your Roots tab reflects your journaling consistency.
  Goals take root. Journeys branch outward." — body/lg text/secondary, centered, max 600px.

Visual: A horizontal strip showing the tree at three growth stages (seedling / sapling / oak).
Each stage is a small framed illustration placeholder with label below in label/ui.
Below: a row of 4 achievement badge mockups (circular, accent/gold border, icon inside).

### PRICING
Padding 120px vertical. Background: bg/surface.
Eyebrow: "Honest pricing." — label/nav centered accent/sage.
Headline: "Start free. Go deep with Pro." — display/section, centered.

Three plan cards side by side (same width, centered within 960px):

FREE card:
  bg bg/surface-2, border border/subtle.
  Plan name: "Free" in display/card.
  Price: "$0" — large Cormorant Garamond 300.
  5 feature rows with ✓ or — icons. Features listed per PRD.
  CTA: Ghost "Start free"

PRO MONTHLY card:
  Same styling. Price: "$4.99/mo".
  Plan name: "Pro"

PRO ANNUAL card (FEATURED):
  Slightly taller. Border 1.5px accent/gold.
  Badge top-center: "Most Popular" — bg accent/gold, text text/inverse, label/tag.
  Small tag: "Save 25% · 3 months free" in accent/sage body/sm.
  Price: "$44.99/yr" with "$3.75/mo" small below.
  All Pro features checked. CTA: Primary "Begin Pro"

LIFETIME card:
  bg bg/surface-2, border 1px accent/earth.
  Badge: "Founding Member" — accent/earth.
  Price: "$149" one-time. Body/sm below: "Price increases after launch."
  CTA: Ghost "Claim lifetime"

Below cards: fine print in body/sm text/muted, centered:
"Cancel anytime. No contracts. Stripe-secured payments."

### SOCIAL PROOF / TESTIMONIALS
Padding 80px vertical. Background bg/base.
Eyebrow: "From the practice." — label/nav, centered, text/muted.

Two testimonial cards, side by side (max 440px each, bg/surface-2):
  Each has:
  - Large quotation mark in Cormorant Garamond, accent/gold, 64px, top-left
  - Quote in display/quote italic, text/secondary
  - Attribution in label/ui text/muted below
  Sample quote 1: "I've journaled for 10 years. Yggdrasil showed me a pattern
  I'd been living for three of them."
  Sample quote 2: "The Hidden Connections feature surfaced something my therapist
  and I had been trying to find for months."

### FOOTER
bg/base. Padding 60px vertical. Border-top border/subtle.
Left: Yggdrasil wordmark + "Screen Sage Studios" in body/sm text/muted.
Center: Nav links in label/nav text/muted (Privacy · Terms · Contact).
Right: "Built for the Build with Gemini XPRIZE" — with small XPRIZE logo placeholder.
Below: "Powered by Google Gemini, Google Cirq, Firebase" — mono/data text/muted, 11px.
Very bottom: copyright line.

---
Deliver: 1440px desktop frame + 375px mobile frame. Use auto-layout throughout.
Apply all color and text styles from Phase 1 — no hardcoded values. All interactive
elements in hover state shown as separate variants or component states.
```

---

## PHASE 3 — Core App Shell + Journal Tab
**Estimated credits: medium | Requires Phase 1**

```
Design the core authenticated app experience. This phase covers:
1. The app shell (nav, layout, authenticated wrapper)
2. The Journal tab (main composer)
3. The Yggi chat drawer

All screens are dark mode only. Mobile-first: design 375px first, then 1440px desktop.

[PASTE MASTER DESIGN BRIEF HERE]

---

### SCREEN 1 — APP SHELL (empty state / first load)

Mobile (375px):
  Top bar: 56px tall, bg/surface, border-bottom border/subtle.
    Left: Yggdrasil wordmark (18px, Cormorant Garamond, text/primary).
    Right: avatar circle (32px, bg/muted, initials in label/ui accent/sage) + streak indicator
           (small flame icon + "12" in accent/gold, mono/data 11px).
  Content area: 375px wide, grows to fill screen.
  Bottom tab bar: as specified in Phase 1 design system.

Desktop (1440px):
  Left sidebar: 220px, bg/surface, border-right border/subtle.
    Top: Logo + "Yggdrasil" wordmark, 64px section.
    Nav items: Journal, Entries, Roots, Insights, Settings.
    Bottom of sidebar: user avatar + name + tier badge (Free/Pro pill).
    Streak widget: small card, accent/gold streak number.
  Content area: remaining width, max inner content 720px, centered.
  Right: 280px optional panel space (used by Yggi drawer on desktop).

### SCREEN 2 — JOURNAL TAB (new entry composer)

Show the mobile version (375px) and desktop version (1440px) of the journal composer.

Mobile layout (375px, full screen):
  Date line: today's date in mono/data text/muted. Entry type selector below it:
    Four small pill buttons in a row: Reflection · Gratitude · Dream · Event.
    Default: Reflection active (accent/sage border + text). Others: ghost style.
  Composer area:
    Full-width textarea. No border box — just a very subtle bottom rule in border/subtle.
    Placeholder text (in text/muted, body/lg italic Cormorant Garamond):
      "What's alive in you right now?"
    Below placeholder, very faint: three lines of lorem text as if a previous entry exists.
    Min-height 300px.
  Below composer (below the fold initially, accessible by scrolling):
    Section label "How are you feeling?" — label/ui text/muted.
    Polarity slider: left label "Heavy" right label "Light". Current position: center.
    Derived emotion label: "Neutral" in display/quote italic accent/gold, centered.
    Intensity slider: left "Mild" right "Intense". Center position.
    Spacing: 32px between sliders.
  Fixed bottom action bar (above the tab bar):
    Left: Tag icon (shows applied tags if any — show 2 tags: "work" and "change").
    Center: "Save entry" primary button, full width minus padding.
    Right: 3-dot more options icon button.
  Show the "Yggdrasil is thinking…" state as a separate frame:
    After save, the save button becomes the loading indicator.
    The branching tree glyph animates slowly in accent/sage.
    Text: "Yggdrasil is thinking…" in body/sm text/muted italic, centered below.
    This is NON-blocking — user can navigate away.

Desktop layout (1440px):
  Left sidebar visible. Content area: journal composer centered at 680px max-width.
  Top of content area: date + entry type selector row.
  Composer textarea: full width of content area, min-height 400px.
  Mood sliders: below composer, inline in a 2-column grid.
  Right panel (280px): if Yggi is open, the chat drawer occupies this panel. Otherwise empty.
  Save button: right-aligned, primary. Keyboard shortcut hint: "⌘ + Enter" in mono/data text/muted.

Post-save: show an "insight reveal" state (as a separate frame or overlay):
  The entry card appears with a smooth entrance.
  Below the entry preview: the generated insight card slides in from below.
  Insight card has the accent/gold left edge, "✦ Insight" badge, and 2–3 lines of
  insight text in body/md. Example text:
  "This entry returns to a theme of impermanence that appears across 14 of your entries
  this year — particularly in moments of transition. The intensity here is higher than
  your usual baseline."
  Below insight: two extracted theme tags (accent/sage pills) + one emotion tag.
  CTA below: small link "Open in Insights →" in label/ui accent/sage.

### SCREEN 3 — YGGI CHAT DRAWER

Mobile: slides up from bottom as a modal sheet (bottom sheet pattern). Height: ~75% screen.
Desktop: slides in from the right as a 320px panel, pushing content left.

Header (both):
  "Yggi" wordmark in display/card. Raven glyph icon (accent/gold, 20px) left of name.
  Sub-label: "Knows your whole story." — body/sm text/muted italic.
  Close button: X icon, top right.
  Separator: decorative rule (thin gold line, 30% opacity, centered, 40px wide).

Chat area:
  Show 3 conversation turns (use the example from the landing page):
  - Yggi opening message (not a user message):
    "I've been reading your entries. You've been sitting with something about change
    lately — it comes up in different clothes each time. What feels most alive about
    that right now?"
    Styling: no bubble. Just text in body/md text/secondary, indented with a 3px
    left border in accent/sage.
  - User reply: "I think I'm afraid of losing who I am if things change too much."
    Right-aligned, bg/surface-2, border-radius 8px 8px 2px 8px, padding 12px 16px.
    Font: body/md text/primary.
  - Yggi reply (long):
    Left-aligned, no bubble. Sage left border. Full text:
    "That's a thread I've noticed — 'losing self' as a frame. It appeared in your
    dream entries most. Here's something interesting: in 7 entries where you wrote
    about change with fear, you ended them feeling relief. Your endings tend to be
    wiser than your beginnings."
    At the bottom of this response: a small "Connection" link:
    "↗ View related entries" — label/ui accent/sage underlined.

Input area (pinned to bottom of drawer):
  Textarea: single line, expandable, bg/surface, border border/subtle, border-radius 4px.
  Placeholder: "Ask Yggi anything about your journal…" — text/muted italic.
  Send button: right, icon-only (PaperPlaneRight), accent/sage. Active when text present.
  Below input, very small: "Yggi has context over all 87 entries." — mono/data text/muted 10px.

---

Deliver: All frames with mobile (375px) and desktop (1440px) variants. Use component
instances from Phase 1. Name all layers clearly. Group by screen.
```

---

## PHASE 4 — Entries Tab + Insights Dashboard
**Estimated credits: medium–high | Requires Phase 1**

```
Design the Entries tab and the Insights dashboard. These are the two core
analytical surfaces of the app.

[PASTE MASTER DESIGN BRIEF HERE]

---

### SCREEN 1 — ENTRIES TAB

Mobile (375px):
  Top: Search bar (full width, magnifier icon left, "Search entries or explore themes…").
  Below search: horizontal scrollable tag cloud. Show 8 tags as pills:
    "anxiety" · "belonging" · "change" · "work" · "mother" · "grief" · "joy" · "transition"
    Active tag: accent/sage, others: default style.
  Entry count line: "47 entries · 3 this week" — mono/data text/muted.
  Entry list: vertically stacked entry cards (use Phase 1 component).
    Show 3 entries:
    Entry 1: Date "Jun 9", Type badge "Dream", 
      Title: "The tower again" (Cormorant Garamond 400 20px)
      Preview: "I was climbing something that kept changing shape beneath me…"
      Tags: "dream" · "fear" · "transformation"
      Insight indicator: small gold dot, "✦" glyph.
    Entry 2: Date "Jun 7", Type badge "Reflection",
      Title: "On staying small"
      Preview: "I've been noticing how I make myself smaller in rooms where I feel…"
      Tags: "self-worth" · "belonging"
    Entry 3: Date "Jun 5", Type badge "Gratitude",
      Title: "Sunday morning light"
      Preview: "Nothing momentous. Just the way the kitchen felt before anyone else woke up."
      Tags: "presence" · "home"
  Infinite scroll implied (fades out at bottom).

Desktop (1440px):
  Two-column layout: left 340px = search + tag browser + filters.
  Right: entry list (same cards, wider).
  Left panel: search at top, then section "Browse by theme" with tag cloud laid out as
  flowing wrap, then "By type" — 4 type filter buttons (Reflection / Gratitude / Dream / Event).
  Entry cards in right panel are slightly wider (max 640px), show more preview text.

### SCREEN 2 — INSIGHTS DASHBOARD

This is a 6-section scrollable dashboard. Show the mobile version (375px).
Also show a desktop overview (1440px wide, all sections visible in a 2-column
masonry-style layout where sections are cards).

Section 1 — Streak & Overview:
  Full-width card. bg/surface-2.
  Top row: "47 entries" in huge display/hero accent/sage (40px). 
  "12 day streak 🌿" streak display. 
  "21,847 words across your journal" in body/sm text/muted.
  Streak calendar: last 28 days in a 7×4 grid of 10px rounded squares.
  Active days: accent/sage. Longest streak highlighted: accent/gold. Today: ring.

Section 2 — Emotional Landscape (Mood Chart):
  Section label: "Your emotional landscape" — label/ui text/muted.
  Chart area: a smooth area chart, full width, height ~160px.
  Two overlapping areas: Polarity (accent/sage, 40% fill) and Intensity (accent/gold, 30% fill).
  X axis: last 14 days, dates in mono/data. No gridlines — only subtle x-axis line.
  Chart is moody and artistic — not a dashboard readout.
  Below chart: "Peak: Anguished · Jun 3 / Highest joy: Jun 11" in body/sm.

Section 3 — Theme Clusters (Semantic Map):
  Section label: "What your mind returns to" — label/ui text/muted.
  Visual: a bubble/cluster map. 6–8 circles of varying sizes.
  Largest: "belonging" (accent/sage, 64px diameter).
  Second: "change" (sage, 50px).
  Others: "grief" (48px), "home" (40px), "work" (36px), "joy" (32px).
  Each circle has the theme label inside (body/sm text/primary).
  Circles are loosely arranged with subtle connecting lines (border/subtle).
  Background: bg/base with sacred geometry motif at 3%.
  NOTE: Mark as "INTERACTIVE — D3 bubble chart" in a design annotation.

Section 4 — Emotional Patterns:
  Section label: "Patterns across time" — label/ui text/muted.
  Three "pattern cards" stacked (mobile) / row (desktop):
    Card 1: "You write most at night — 73% of entries between 9pm and 2am."
      Icon: Moon. Left edge: accent/gold.
    Card 2: "Entries tagged 'belonging' are 40% longer than your average entry."
      Icon: Scales. Left edge: accent/sage.
    Card 3: "Dream entries appear in clusters — 3 or more in a week — following
      high-intensity weeks."
      Icon: Spiral. Left edge: accent/earth.

Section 5 — HIDDEN CONNECTIONS (signature feature — make this beautiful):
  Section label: "Hidden Connections" — label/ui accent/gold. 
  Sub-label: "Discovered by quantum-inspired analysis" — body/sm text/muted italic.
  Pro badge: small pill "Pro feature" with accent/gold border.
  
  Visual: Full-width frame, height 240px, bg/base.
  Show a D3-style force graph with ~12 nodes connected by threads.
  Node styling: circles, varying 8–20px diameter. Active node: accent/sage with
  soft glow. Connected nodes: accent/gold. Distant nodes: text/muted.
  Threads: very thin (0.5px) lines in accent/gold at 30% opacity.
  One thread glows brighter (accent/gold 80%) — this is the "active connection".
  NOTE: Mark as "INTERACTIVE — D3 force graph. See Hidden Connections spec."
  
  Below visual: 3 connection cards (horizontal scroll on mobile):
    Card 1: 
      "Nov 14 · Dream entry ↔ Mar 2 · Reflection"
      "Both return to a fear of shapeless change — the tower dream and the 'staying small' entry share the same semantic core."
      Similarity badge: "89% resonance" in mono/data accent/gold.
    Card 2:
      "Feb 8 · Gratitude ↔ Jun 7 · Reflection"
      "Your gratitude for small domestic moments and your anxiety about identity loss are more connected than they appear."
      "72% resonance"
    Card 3:
      "Apr 19 · Event ↔ Jun 9 · Dream"
      "This dream echoes a moment from 8 weeks ago — the motif of unstable ground."
      "68% resonance"
  
  Powered by line: "Computed by Google Cirq · quantum kernel re-ranking" — mono/data
  text/muted 10px, bottom right.

Section 6 — Knowledge Graph (teaser for Pro):
  Section label: "Your knowledge graph" — label/ui text/muted.
  Show the graph as a blurred/locked overlay (free tier paywall state):
    Behind: a faint D3 graph suggestion (blurred, ~4px gaussian blur).
    Overlay: bg/base at 70% opacity, centered content:
      Gold lock icon (24px).
      "Unlock your full knowledge graph" — display/card.
      "See how all your themes, people, and emotions connect over time." — body/md text/secondary.
      CTA: Primary button "Upgrade to Pro".
  Show a separate frame for the UNLOCKED state (Pro user):
    Full D3 force-directed graph, full-bleed, dark background.
    Nodes: categorized by type (themes = sage, people = gold, emotions = earth).
    Node size = frequency. Labels in body/sm text/primary.
    Instructions: "Pinch to zoom · tap a node to explore" — label/ui text/muted, top.
    NOTE: "INTERACTIVE — D3 force graph. Full spec in product docs."

---

Deliver: Mobile (375px) entry list + insights dashboard. Desktop (1440px) insights
overview. All components from Phase 1. Clear layer naming. Annotations for interactive
elements.
```

---

## PHASE 5 — Roots Tab + Onboarding Flow
**Estimated credits: medium | Requires Phase 1**

```
Design the Roots tab and the onboarding experience.

[PASTE MASTER DESIGN BRIEF HERE]

---

### SCREEN 1 — ROOTS TAB

The Roots tab contains: Living Tree · Goals · Journeys · Achievements.
It should feel like entering a sacred grove — deeper, warmer, more rooted than the
analytical screens.

Background treatment: bg/base with a warm radial glow (accent/earth, 6% opacity,
bottom-center origin). Sacred geometry motif at 3%.

Mobile (375px) — show top section and scrollable content:

TOP: Living Tree section
  Section is ~300px tall. Full-width.
  Center: the Living Tree illustration (SVG placeholder, annotated "ILLUSTRATION:
  A stylised tree SVG. State: 'Sapling' — sparse but alive. Grows season by season
  based on journaling streak. Roots extend downward; branches upward.").
  Tree is rendered in accent/sage with accent/earth roots, glowing faintly.
  Around the tree: floating leaf particles (3–4 small accent/sage dots, positioned naturally).
  Below tree: "Your tree is a sapling." — display/card, centered.
  Sub: "Journal 3 more days to begin branching." — body/sm text/muted.
  Progress ring below that: 60% filled, accent/sage stroke, "12 of 20 days" inside in
  mono/data. Label below: "Next growth stage" in label/ui text/muted.

GOALS section:
  Header row: "Goals" label in label/ui text/muted. "+" icon button (right).
  AI suggestion card (distinct from regular goals):
    bg/surface, border 1px dashed accent/sage.
    "✦ Yggi suggests" — label/tag accent/sage.
    Goal text: "Explore the pattern between your late-night entries and what you
    feel is 'belonging' — set an intention to write one morning entry this week."
    Two action buttons: "Add this goal" (primary) and "Not now" (ghost, very small).
  Goal cards (3 visible):
    Goal 1: "Write 3 morning entries" — Progress: 1/3. 
      Progress bar: thin, accent/sage, 33% width.
      Status: active. Left edge: earth.
    Goal 2: "Examine the belonging theme" — Progress: complete.
      Completed: accent/gold checkmark. Faint strikethrough on title? No — keep it 
      clean, just the checkmark.
    Goal 3: "Reduce late-night spiraling" — Progress: 0/10.
      Progress bar: 0%. Left edge: earth.
  "5 goals · 1 completed" — mono/data text/muted, end of section.
  Paywall note (free tier): "Free plan: 5 goals max. Upgrade for unlimited." 
  — body/sm text/muted, below list.

JOURNEYS section:
  Header row: "Journeys" label in label/ui text/muted. "+" icon button (right).
  Journey cards (2 visible):
    Journey 1: "Processing my father's illness"
      Entry count: "14 entries" — mono/data text/muted.
      Duration: "Started Apr 3 · ongoing" — body/sm text/muted.
      Preview: last 3 entry dates shown as small dots with date.
      Left edge: sage.
    Journey 2: "The career transition"
      Entry count: "7 entries"
      Duration: "Started May 12 · ongoing"
      Left edge: sage.
  NOTE: Journeys are process-focused, NOT completion-focused. No progress bar.
  They are collections, not goals. Do not show a progress indicator on journey cards.

ACHIEVEMENTS section:
  Header: "Achievements" — label/ui text/muted.
  Horizontal scroll row: achievement badge chips (circular, 56px).
    Unlocked (3): shown with accent/gold border + icon, full color.
    Locked (4): shown as bg/muted circles with 40% opacity icon.
  Unlocked badges: "First entry", "7-day streak", "First insight".
  Locked badges: "30-day streak", "50 entries", "First connection", "Night owl".
  Below: "3 of 7 achieved" — body/sm text/muted.

### SCREEN 2 — ONBOARDING FLOW

Design a minimal, spiritually-toned 3-step onboarding. No configuration screens.
No feature tours. Just: welcome → write → receive first insight.

Frame 1 — Welcome screen (full-screen modal or standalone page):
  Full screen. bg/base. Sacred geometry motif centered, large (500px, 4% opacity).
  Centered vertical layout:
    Small Yggdrasil rune glyph or tree icon at top (48px, accent/gold).
    Headline: "Welcome to Yggdrasil." — display/hero, Cormorant Garamond 300, centered.
    Body: "Your journal is about to become something more." — body/lg text/secondary, centered.
    Sub: "Write your first entry to meet Yggi and receive your first insight." — body/md text/muted.
    CTA: Primary "Begin" button, centered.
    Skip: tiny "Set up account details first →" in label/ui text/muted, below CTA.

Frame 2 — Seed entry prompt (onboarding composer):
  Same shell as the journal tab but simplified (no nav, no tab bar).
  Top: progress indicator — "Step 1 of 1" is NOT shown. Just the prompt.
  Single centered question in display/quote italic, Cormorant Garamond, accent/gold:
    "What's one thing on your mind right now?"
  Below: the composer textarea (same as Journal tab, same placeholder styling).
  Character count hint: "Just a sentence or two is enough." — body/sm text/muted.
  Below textarea: "Write your first entry. Yggi will respond." — body/sm text/muted italic.
  Bottom: "Save & meet Yggi →" — primary button.
  No mood sliders on this screen. No tags. Pure writing.

Frame 3 — First insight reveal (post-onboarding):
  After the seed entry is saved and Gemini processes it (≤60 seconds):
  Full-screen modal or page transition.
  Background: bg/base. Sacred geometry glyph glowing softly (accent/sage, 5%, large).
  Top: "Yggdrasil found something." — display/section, Cormorant Garamond 300, centered.
  Sub: "Your first insight is ready." — body/lg text/secondary, centered.
  
  The insight card (centered, max-width 480px, elevated shadow):
    bg/surface-2. Border 1.5px accent/gold.
    "✦ First Insight" — label/tag accent/gold, top.
    Insight text (example, 2–3 sentences): "There's a question about belonging at the
    center of this entry — a wondering about whether the space you occupy is truly yours.
    This theme has a long root. I'll be watching for where it surfaces again."
    Yggi attribution: small raven icon + "Yggi" in body/sm text/muted, bottom right of card.
  
  Two tags extracted: "belonging" · "identity" — shown below card.
  
  CTA below: Primary "Enter your journal →"
  Second link: "What else can Yggi see?" → goes to Yggi chat.

---

Deliver: Full Roots tab (mobile 375px), Goals/Journeys annotated clearly (distinct types),
Achievements row. Onboarding flow: 3 frames. Desktop Roots layout optional but noted.
```

---

## PHASE 6 — Pricing Page + Settings + Paywall States
**Estimated credits: low–medium | Requires Phase 1**

```
Design the pricing/upgrade page, the settings screen, and the paywall states
that appear throughout the app.

[PASTE MASTER DESIGN BRIEF HERE]

---

### SCREEN 1 — /pricing page (standalone, reachable from nav, from paywalls, from settings)

This page must earn the upgrade. It should feel like a natural extension of the app's
spiritual intelligence — not a SaaS pricing grid.

Full-page layout, 375px mobile + 1440px desktop.

TOP SECTION:
  bg/base. Padding 64px vertical.
  Eyebrow: "Your practice, deepened." — label/nav centered text/muted.
  Headline: "Go further with Pro." — display/section centered.
  Subhead: "Yggi. Hidden Connections. Your full knowledge graph. Unlimited everything." 
  body/lg text/secondary centered max-width 480px.

PLAN TOGGLE: Monthly / Annual — pill toggle (2 options). Annual default.
  Below toggle: "Annual saves you $14.89 — 3 months free" — body/sm accent/sage.

PLAN CARDS (same as landing page but larger, with full feature lists):
  Free card:
    All features listed. Limits shown clearly (5 insights, 3 journeys, 5 goals).
    Current plan badge if user is on free: "Your current plan" — label/ui accent/sage.
    CTA: disabled "Current plan" button.
  
  Pro card (featured, gold border):
    "Most Popular" badge. Annual price default shown.
    Full feature list: every Pro feature with ✓, limits removed.
    CTA: Primary "Upgrade to Pro"
  
  Lifetime card:
    "Founding Member" label. One-time price.
    "Price increases after launch" — body/sm accent/earth.
    CTA: Ghost "Claim lifetime access"

FAQ section (below cards):
  3 Q&A items in accordion style (collapsed by default, show one open):
  Q: "Can I cancel anytime?" A: "Yes. Cancel from settings, effective at period end."
  Q: "What happens to my journal if I downgrade?" A: "Your entries are always yours.
     AI features are paused, not deleted."
  Q: "Is my journal data private?" A: "Yes. Your data is only used to generate your
     personal insights. It is never used for training or shared."

### SCREEN 2 — PAYWALL STATES (feature gates throughout the app)

Design three distinct paywall states that appear in context when a Free user hits a limit:

State A — Inline paywall (within a feature section, e.g. Yggi chat):
  The feature area is replaced by a centered upgrade prompt.
  Soft lock icon (24px, accent/gold).
  Headline: "Yggi is a Pro feature." — display/card.
  Body: "Your AI companion has context over your entire journal history. Available with Pro." — body/md text/secondary.
  CTA: Primary "Upgrade to Pro" + Ghost "See what Pro includes →" (links to /pricing).
  Background: faint radial glow (accent/gold, 4%) behind the prompt.

State B — Entry count gate (triggered after 5th analyzed entry):
  Appears as an overlay on the Insights section of an entry card.
  Blurred insight content behind.
  Inline pill: "Your 5 free insights have been used." — body/sm text/primary on bg/surface-2.
  CTA: small Primary "Unlock unlimited insights".

State C — Action gate (e.g., trying to create a 6th goal):
  Toast-style notification that slides up from bottom:
  "Free plan: 5 goals max. Upgrade for unlimited." — body/sm.
  Action button inline: "Upgrade" in accent/gold text, no button border.

### SCREEN 3 — SETTINGS

Clean, functional. Not clinical. This is where the spiritual intelligence of the app
becomes configurable.

Mobile layout (375px):

Header: "Settings" — display/section.
User info section: avatar (48px circle) + display name + email + tier badge.

Section: "Your practice"
  "Analytical frameworks" row:
    Label: "Analytical frameworks" — body/md text/primary.
    Sub: "Shape how Yggi interprets your entries." — body/sm text/muted.
    Toggle: ON/OFF. Default OFF.
    Tapping expands a list of 12 frameworks (accordion):
    Show 4 rows visible: Jungian · Attachment Theory · IFS · Stoic.
    Each has a toggle. All off by default.
  
  "Weekly digest" row: Toggle ON/OFF. "Receive your weekly Yggi narrative every Sunday."
  
  "Entry reminders" row: Toggle ON/OFF. "A gentle nudge at your usual journaling time."

Section: "Account"
  "Subscription" row: current tier (e.g. "Pro Annual — renews Dec 2026") + "Manage →"
  "Export your data" row: "Download all entries as JSON or Markdown." + "Export →" (Pro only — FeatureGate)
  "Privacy & data" row: arrow link to a subpage.
  "Delete account" row: text in status/danger. "Permanently delete your account and journal."

Bottom of screen: app version in mono/data text/muted. "Powered by Gemini AI" in 
body/sm text/muted. Screen Sage Studios attribution.

---

Deliver: /pricing page mobile + desktop, 3 paywall state frames, Settings mobile frame.
All from Phase 1 components.
```

---

## PHASE 7 — Admin Operations Dashboard (XPRIZE evidence screen)
**Estimated credits: low–medium | Requires Phase 1**

```
Design the internal AI-Native Operations Dashboard. This screen is Isa-only (admin).
It is a direct XPRIZE submission deliverable — judges need to see that AI is running
the business operations, not just powering a feature.

This screen is NOT shown to regular users. It is at /admin and requires a separate
admin auth gate.

Tone: functional but still on-brand. Dark. Monospaced data. Clean. This is a control
room, not a product surface. Think mission control, not analytics dashboard.

[PASTE MASTER DESIGN BRIEF HERE]

---

Layout: Desktop-only (1440px). A single scrollable dashboard page.

Header:
  "AI Operations Dashboard" — display/section, left-aligned.
  "Yggdrasil · Screen Sage Studios · Internal use only" — label/ui text/muted.
  Live indicator: pulsing dot (accent/sage) + "Live · Last updated 2 minutes ago" — mono/data.

### PANEL 1 — System Health (top bar, 4 stat cards in a row)

Card 1: Gemini API
  Status: accent/sage dot "Operational"
  "847 AI calls today" — large mono/data accent/sage.
  Sub: "Avg 1.2s response" — mono/data text/muted.

Card 2: Cirq Engine
  Status: accent/gold dot "Active"
  "63 connections computed" — large mono/data accent/gold.
  Sub: "34% Cirq path · 66% KNN fallback" — mono/data text/muted.

Card 3: Embedding Pipeline
  Status: accent/sage dot "Operational"
  "212 embeddings today" — large mono/data.
  Sub: "gemini-embedding-001" — mono/data text/muted.

Card 4: Weekly Report
  Status: "Next report: Jun 15" — mono/data.
  "4 of 4 reports generated" — accent/gold.
  Sub: "On schedule for XPRIZE" — mono/data text/muted accent/sage.

All cards: bg/surface-2, border border/subtle, no border-radius on top panel — slightly
more structured than app cards. Use mono/data throughout this dashboard.

### PANEL 2 — AI Action Log (live feed)

Section header: "AI Action Log" — label/nav. 
Filter pills: All · Insights · Yggi · Embeddings · Reports · Connections.

Log rows (table style, full width):
  Columns: Timestamp | Type | User (anonymised) | Action | Duration | Status
  
  Show 8 rows:
  Row 1: 02:14:33 | Insight | user_a7f2 | Entry analysed: 847 words, 13 fields extracted | 1.1s | ✓ Success (accent/sage)
  Row 2: 02:11:08 | Embedding | user_a7f2 | Embedding generated (768-dim → Firestore KNN) | 0.8s | ✓ Success
  Row 3: 01:58:44 | Yggi | user_b3c8 | Conversation (4 turns, 847 words of context retrieved) | 2.3s | ✓ Success
  Row 4: 01:45:20 | Hidden Connections | user_a7f2 | Cirq: 8-qubit kernel · 7 pairs scored | 18ms | ✓ Cirq
  Row 5: 01:32:11 | Insight | user_d9e1 | Entry analysed: 234 words | 0.9s | ✓ Success
  Row 6: 01:15:00 | Connections | user_c5b7 | KNN fallback · Cirq unavailable | 45ms | ⚡ Fallback (accent/earth)
  Row 7: 00:47:33 | Report | system | Weekly narrative report generated (1,847 words) | 8.4s | ✓ Success
  Row 8: 00:01:00 | Embedding | user_d9e1 | Embedding generated | 0.7s | ✓ Success
  
  Row styling: alternating bg/surface and bg/surface-2 very subtly (barely perceptible).
  Timestamp: mono/data text/muted. Type pill: small colored pill (same category colors).
  Status icons: ✓ in accent/sage, ⚡ in accent/earth, ✗ in status/danger.
  "Load more" ghost button below table.

### PANEL 3 — Weekly AI Reports

Section header: "AI-Generated Business Reports" — label/nav.
Sub: "Gemini generates a narrative business report every Sunday. Required for XPRIZE." — body/sm text/muted.

Report cards (4 of them, horizontal row, scrollable):
  Each card: ~280px wide, bg/surface-2, border border/subtle.
  Date: "Week of Jun 2–8" — mono/data text/muted.
  Title: "Weekly Narrative · Report #4" — body/md text/primary.
  Status: "Generated Sun Jun 8 · 00:01 UTC" — mono/data text/muted.
  Preview excerpt (2 lines, truncated): 
    "User retention improved 12% this week. The primary driver appears to be the Hidden
    Connections feature — 4 of 6 active users engaged with…"
  Footer: "8.4s generation time · 1,847 words · Gemini 2.0 Flash" — mono/data text/muted 10px.
  Action: "Read full report →" — label/ui accent/sage.

### PANEL 4 — XPRIZE Evidence Summary

Section header: "XPRIZE Submission Evidence" — label/nav accent/gold.
Sub: "Required deliverables status. Deadline: Aug 17, 2026." — body/sm text/muted.

Checklist-style table (2 columns: Item | Status):
  ✓ AI-native operations log (this dashboard) · "Active" — accent/sage
  ✓ Gemini integration across all features · "847 calls total" — accent/sage
  ✓ Weekly AI business reports · "4 generated" — accent/sage
  ✓ Stripe live revenue · "$49.97 MRR" — accent/sage (placeholder)
  ✓ Real paying users · "2 active subscribers" — accent/sage
  ○ Paying users target ≥5 · "3 more needed" — accent/earth (in progress)
  ○ Cirq path rate ≥30% · "34% ✓" — accent/sage (just met)
  ○ Demo video · "Not yet recorded" — text/muted

Below table: "Last refreshed: Jun 11, 2026 · 02:14 UTC" — mono/data text/muted.

---

Deliver: Desktop (1440px) single scrollable frame. Use Phase 1 tokens but lean
harder on monospaced data styling. Functional, precise, not decorative.
Annotate clearly: "ADMIN ONLY — /admin route, Isa auth gate".
```

---

## APPENDIX — Figma File Organization

```
When you have completed all phases, organize the Figma file as follows:

PAGES:
  📐 _System — Phase 1: all color styles, text styles, components
  🌐 Landing — Phase 2: marketing landing page (desktop + mobile)
  📓 App / Journal — Phase 3: shell + composer + Yggi drawer
  🗂 App / Entries + Insights — Phase 4: both tabs
  🌱 App / Roots + Onboarding — Phase 5: roots tab + 3 onboarding frames
  💳 App / Pricing + Settings — Phase 6: upgrade + settings + paywall states
  ⚙️ Admin Dashboard — Phase 7: operations dashboard

NAMING CONVENTIONS:
  - Frames: [ScreenName] / [Variant] (e.g. "Journal / Mobile · Composer")
  - Components: [Category] / [Name] / [State] (e.g. "Cards / Entry / Hover")
  - Annotations: purple sticky notes for interactive elements, red for TODOs

PROTOTYPE CONNECTIONS (set up after all phases):
  Landing → /signup → Onboarding → Journal tab
  Journal → save → insight reveal → Entries tab
  Any paywall → /pricing → checkout (Stripe — external)
  Nav: all 5 tabs connected bidirectionally
  FAB → Yggi drawer (slide in/out)

EXPORT NOTES FOR DEVELOPERS:
  - All icons at 2x for retina
  - Sacred geometry motif exported as SVG (not rasterized)
  - Tree illustration: export as SVG with layers for animation
  - D3 graph areas: annotate expected dimensions; design is reference only
    (actual rendering is JavaScript)
  - Color tokens match exactly the Tailwind CSS config in the codebase
```

---

*Document prepared for Yggdrasil / Screen Sage Studios · Build with Gemini XPRIZE 2026*
*Generated June 2026 · All prompts are self-contained and additive.*

---

## Change history

| Version | Date | Change |
|---|---|---|
| 1.0 | June 2026 | Initial prompt suite |
| 1.1 | July 2026 | Marked OBSOLETE (brand source of truth is docs/brand.md); swept old tagline and gemini-embedding-exp so stale copy can't be pasted into designs |
