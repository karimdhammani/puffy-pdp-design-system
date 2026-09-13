# Puffy · Foundations — PDP Design System

A tokenised design system extracted from the Puffy Lux mattress PDP, built so new
pages can be designed and shipped in the existing design language instead of
re-deriving it every time.

Clone it and open `index.html` — there is no build step.

```bash
git clone https://github.com/karimdhammani/puffy-pdp-design-system.git
cd puffy-pdp-design-system
npx --yes serve . -l 4173
```

`/` is the index · `/style-guide/` is the living style guide · `/baseline/` is the
source replica · `/pages/_template.html` starts a new page.

---

## Why this exists

The Lux PDP already has a design language — two typefaces with clear jobs, a beige-and-navy
palette, a serif-for-voice convention, a small set of recurring components. None of it was
written down, so every new page re-invented it and drifted.

This repository turns that implicit language into something you can build against:

| | |
|---|---|
| **One source of truth** | 206 CSS custom properties in three tiers. A component asks for `--fill-cta`, never `#2b2f44`. |
| **Reconciled three ways** | Live site → Figma → CSS, with the live PDP winning any disagreement. `npm run check` proves it: 149 checks. |
| **Complete typography** | All 22 Figma text styles, with metrics read back from the library rather than transcribed. |
| **Audited, not asserted** | Six WCAG 2.2 AA findings measured against production — see [`findings/`](findings/). |
| **Machine-readable** | Tokens generated to W3C DTCG JSON — imports into Figma Variables, Style Dictionary, or Tokens Studio, and briefs an LLM on the design language in one paste. |

---

## Repository layout

```
system/                 The design system. This is the product.
  01-tokens.css           Tier 1 primitives → Tier 2 semantic → Tier 3 component
  02-base.css             Reset, a11y floor, the 22 Figma text styles
  03-components.css       17 components, each with its real states
  04-utilities.css        Layout primitives and single-purpose helpers
  puffy.css               Single entry point — one <link> gets you everything
  icons/                  46 source SVGs

tokens/
  puffy.tokens.json       GENERATED — W3C DTCG format, for tooling

style-guide/            The living style guide. Generated from the stylesheet,
                        so it can't document a value the system no longer has.

baseline/               1:1 replica of the live Lux PDP. The reference floor —
                        what "no worse than today" actually looks like.

findings/               Evidence gathered against the live site.
  accessibility-audit.md  WCAG 2.2 AA audit — six findings, measured
  audit.js                the script behind them, re-runnable on any page

pages/                  New pages built on the system.
  _template.html          Start here.
  lux-pdp-fold.html       Lux Hybrid PDP, above the fold (1440 x 900).
  assets/                 Art belonging to a page rather than to the system.

tools/
  build-tokens.js         Generates the DTCG JSON from the CSS
  check-tokens.js         Guards the three-way reconciliation
```

---

## Using it

One link tag gets you the whole system:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700&family=PT+Serif:wght@400;700&display=swap">
<link rel="stylesheet" href="../system/puffy.css">
```

Then compose from tokens and components:

```html
<section class="pf-surface pf-section">
  <div class="pf-container pf-stack" style="--gap: var(--puffy-space-24)">
    <p class="pf-label-inside pf-uppercase pf-text-highlight">Limited offer</p>
    <h2 class="pf-heading-section">Comfort, made consistent.</h2>
    <button class="pf-btn pf-btn--primary pf-btn--lg">
      <span class="pf-btn__label">Add to Cart <span class="pf-btn__sub">$1,699</span></span>
    </button>
  </div>
</section>
```

`pages/_template.html` is a working starting point with the scaffolding already in place.

### Run it locally

Any static server works — there is no build step.

```bash
npx --yes serve . -l 4173
```

Then open `/style-guide/`.

### Change a token

The CSS is the source; the JSON is generated from it.

```bash
# edit system/01-tokens.css, then
npm run build     # regenerate tokens/puffy.tokens.json
npm run check     # prove the reconciliation still holds
```

---

## The three tiers

The tier rule is the whole system in one sentence: **components consume Tier 2.**

```
Tier 1  --navy-blue-light-1000: #2b2f44      raw value, no meaning
Tier 2  --fill-cta: var(--navy-blue-light-1000)   the role it plays
Tier 3  --pf-btn-height-lg: 64px             a knob one component needs
```

If you find yourself reaching for a Tier 1 primitive inside a component, the semantic
layer is missing a token. Add it rather than hard-coding — that's the whole mechanism
by which a rebrand, a dark mode, or a seasonal promo stays a one-file change.

---

## Reconciliation

Three sources describe this system. They are reconciled in a fixed order of authority:

```
1. puffy.com/products/puffy-lux-mattress     the source of truth
2. Figma · Puffy · Foundations — PDP Style Guide   naming and intent
3. system/*.css                              the implementation
```

Where they disagreed, the **live site won**.

### What came from where

**The live site** supplied every value. Its own `:root` serves 202 custom properties,
harvested directly from the rendered page, plus measurements taken off live elements —
the 52px size option, the 300ms control transition, the 500ms CTA transition, the 8px
control radius, the 122px resolved header height.

**Figma** supplied the naming and the structure: the `puffy/space/*` and `puffy/radius/*`
scales, all 22 text-style names and metrics, the five elevation styles, the responsive
rail widths, and the 44px target guidance. Metrics were read back from the library through
the Figma API rather than transcribed, so `Puffy/Heading/Section` in Figma and
`.pf-heading-section` in CSS cannot disagree about being 40/48 PT Serif Regular.

### What the reconciliation changed

Reconciling corrected real errors in the first version of this system:

| Token | Was | Now | Source |
|---|---|---|---|
| `--border-green-strong` | `rgba(6,122,87,.8)` | `#067a57` solid | live + Figma |
| `--fill-green-soft` | `rgba(6,122,87,.1)` | `rgba(10,204,146,.05)` | live + Figma |
| `--fill-cta-hover` | `#1b1d2b` | `--hover-cta-solid: #1b1e2b` | live |
| disabled opacity | 0.45 | 0.5 | Figma page 05 |
| Effect styles | 5 invented names | the 5 real `Puffy/Elevation/*` | Figma |
| Text styles | 12, some misnamed | all 22, names matching | Figma |
| Radius scale | missing 16, 20 | complete, `full` = 9999px | Figma |
| Alpha ramps | absent | `-50/-200/-800` on every family | live |

The alpha ramps were the biggest gap: the live site builds every colour family with
50/200/800/1000 steps for Tailwind's `rgb(var(--x) / <alpha>)` composition, and the first
version of this system had none of them.

### How it stays reconciled

`npm run check` runs three independent guards, because each catches a different way to drift:

| Guard | Catches |
|---|---|
| **JSON currency** | A hand-edit to the generated `tokens/puffy.tokens.json`, or a forgotten `npm run build` |
| **Figma metrics** | CSS drifting from the library — the 22 text styles are asserted against the metrics read from Figma |
| **Live values** | The site rebranding. 38 colour primitives are asserted against what `puffy.com` serves |

Each was tested by deliberately introducing the drift it is meant to catch.

## Where this improves on the baseline

The baseline is preserved unmodified as the reference floor. The system deliberately
diverges from it in three places:

All three were verified against production `puffy.com/products/puffy-lux-mattress`, not
just against the local replica. Full evidence and three further page-level findings are
in [`findings/accessibility-audit.md`](findings/accessibility-audit.md).

1. **Interactive borders.** Unselected size selectors on the live PDP carry
   `1px solid rgb(213,210,204)` — `--border-soft` / #d5d2cc — on a white ground. Measured:
   **1.51:1**, against the 3:1 that WCAG 2.2 · 1.4.11 requires for the boundary of a UI
   component. Eight elements share that exact pairing, and the full audit found seven
   failing border/ground pairings across 25 elements. The selected state is fine
   (#333333, 12.63:1); it's the unselected control boundaries that fail.
   The system uses `--border-sub-strong` (**3.35:1**) for anything interactive and keeps
   `--border-soft` for dividers, where the criterion doesn't apply.

2. **Focus.** *Not a defect in the source* — tabbing to a control matches
   `:focus-visible` and paints the browser's default ring, so 2.4.7 passes. What's missing
   is a *designed* indicator with a known contrast on both the white and navy grounds. The
   system defines one ring in `02-base.css`, inverted on dark, and never removes it.

3. **Semantics.** The live size buttons are bare `<button>`s — no `role`, no `aria-checked`,
   no `aria-pressed`. The selected size is conveyed by border and background alone, so it
   reaches neither a screen reader (4.1.2) nor a user who can't rely on colour (1.4.1).
   The system makes size and upgrade pickers `radiogroup`s with arrow-key navigation, and
   disclosures real `<details>`.

---

## Accessibility

Targets WCAG 2.2 AA. Contrast figures in the style guide are **measured in the browser**
from the live token value — alpha-composited, and against the ground each role is actually
approved for, not a flattering default. Change a token and the numbers move with it.

| Criterion | How the system handles it |
|---|---|
| 1.4.3 Contrast (minimum) | Every approved pairing measured and labelled. Two tokens are restricted: `--highlight-soft` is dark-grounds-only, `--brand` is large-text-and-non-text only. |
| 1.4.11 Non-text contrast | Interactive boundaries use a 3.35:1 token. |
| 2.4.13 Focus appearance | One ring, defined once, inverted on dark. |
| 2.5.8 Target size | Controls design to 44px; `.pf-target` extends a small hit area without changing how it looks. |
| 2.3.3 Animation from interactions | No meaning depends on motion, so `prefers-reduced-motion` cuts all of it. |
| 4.1.2 Name, role, value | Native elements and ARIA patterns over styled `<div>`s. |

---

## Attribution

Built as part of a Design Manager case study for Puffy. The Puffy name, logo, product
imagery, and icons are property of Puffy and are included here only to make the baseline
render and to document the existing design language. This repository is a portfolio
artefact, not a distribution of Puffy's brand assets.
