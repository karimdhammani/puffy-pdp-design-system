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
| **One source of truth** | 137 CSS custom properties in three tiers. A component asks for `--fill-cta`, never `#2b2f44`. |
| **Audited, not asserted** | Six WCAG 2.2 AA findings measured against production — see [`findings/`](findings/). |
| **Machine-readable** | The same tokens in W3C DTCG JSON — imports into Figma Variables, Style Dictionary, or Tokens Studio, and briefs an LLM on the design language in one paste. |
| **Provably in sync** | `npm run check` resolves both files to literal values and diffs them. 179 values, currently matching. |
| **Accessible by construction** | Contrast, focus, and target size are properties of the tokens. Every pairing in the style guide states its measured ratio. |

---

## Repository layout

```
system/                 The design system. This is the product.
  01-tokens.css           Tier 1 primitives → Tier 2 semantic → Tier 3 component
  02-base.css             Reset, a11y floor, type styles (see note below)
  03-components.css       17 components, each with its real states
  04-utilities.css        Layout primitives and single-purpose helpers
  puffy.css               Single entry point — one <link> gets you everything
  icons/                  46 source SVGs

tokens/
  puffy.tokens.json       The same system, W3C DTCG format, for tooling

style-guide/            The living style guide. Generated from the stylesheet,
                        so it can't document a value the system no longer has.

baseline/               1:1 replica of the live Lux PDP. The reference floor —
                        what "no worse than today" actually looks like.

findings/               Evidence gathered against the live site.
  accessibility-audit.md  WCAG 2.2 AA audit — six findings, measured
  audit.js                the script behind them, re-runnable on any page

pages/                  New pages built on the system.
  _template.html          Start here.

tools/
  check-tokens.js         Proves the JSON and the CSS agree.
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
    <p class="pf-label pf-text-highlight">Limited offer</p>
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

### Check the tokens

```bash
npm run check
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

## Provenance

Values come from two places, and the difference matters:

**The Figma library** — [Puffy · Foundations — PDP Style Guide](https://www.figma.com/design/DXYctvnL7dCQc653hMysBA/Puffy-%C2%B7-Foundations---PDP-Style-Guide).
Variable names, the `puffy/space/*` and `puffy/radius/*` scales, and the text-style
metrics were read back from the library itself rather than transcribed, so
`Puffy/Heading/Section` in Figma and `.pf-heading-section` in CSS are guaranteed to be
the same 40/48 PT Serif Regular.

The library holds 256 variables, 22 text styles, and 5 effect styles across eleven pages.
Values read back directly from it cover the colour roles (`--fill-cta`, `--fill-offer`,
`--bg-soft`, `--bg-sub-soft`, `--bg-base-white`, `--success`, `--highlight-soft`,
`--highlight-strong`, `--text-strong`, `--text-soft`, `--icon-strong`) and the
`puffy/space/*` and `puffy/radius/*` scales.

> **Known gap — typography.** `02-base.css` currently ships **12** text styles. Figma page
> `03 · Typography` defines **22**, including a responsive product-title ramp
> (`Heading/Product mobile` 24/32 → `desktop` 28/36 → `wide` 32/40), `Price/Small`,
> `Label/Control` and `Label/Control selected`, `Action/Primary`, `Action/Link`,
> `Heading/Footer`, and `Heading/Gallery mobile`. The 12 that ship have correct metrics,
> but the set is incomplete and some class names don't match the Figma names. Reconciling
> to all 22 is the next change.

**The live source CSS** — the rest is derived from puffy.com's own `:root` and the Lux PDP
stylesheet, using the naming convention Figma established. Token names are kept 1:1 with
the live site, so this system can be adopted incrementally rather than as a rewrite.

`tokens/puffy.tokens.json` imports straight back into Figma Variables, so the two stay
reconcilable in either direction.

---

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
