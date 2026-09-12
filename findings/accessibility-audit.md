# Accessibility audit — Puffy Lux PDP (live site)

**Target** `https://puffy.com/products/puffy-lux-mattress`
**Standard** WCAG 2.2 Level AA
**Date** 12 September 2026
**Viewport** 1440 × 900 unless a finding states otherwise
**Page state** Fully scrolled, all lazy-loaded content rendered (415 visible
interactive controls; 144 at first paint)
**Method** Measured in-browser against the live production DOM and computed
styles — not a replica, a screenshot, or a mockup. Reproducible with
[`audit.js`](audit.js).

> **Why page state is quoted.** The PDP lazy-loads carousels, the footer, and the
> mega-nav. At first paint it exposes 144 controls and one naming defect; scrolled
> to the bottom it exposes 415 and seventy-one. Any count taken without saying how
> far the page was scrolled is meaningless, and the above-the-fold experience is
> markedly healthier than the page as a whole.

---

## Summary

| # | Finding | Criterion | Level | Severity |
|---|---|---|---|---|
| [1](#1--interactive-boundaries-below-31) | Interactive boundaries below 3:1 — 7 pairings, 25 elements | 1.4.11 Non-text Contrast | AA | **High** |
| [2](#2--selected-size-is-invisible-to-assistive-tech) | Selected size is invisible to assistive tech | 4.1.2 Name, Role, Value · 1.4.1 Use of Color | A | **High** |
| [3](#3--71-of-415-controls-have-no-accessible-name) | 71 of 415 controls have no accessible name | 4.1.2 Name, Role, Value | A | **High** |
| [4](#4--thirteen-h2s-and-an-h3-precede-the-h1) | Thirteen headings precede the `<h1>` | 1.3.1 Info and Relationships | A | **Medium** |
| [5](#5--icon-only-controls-below-the-target-minimum) | Icon-only controls below the target minimum | 2.5.8 Target Size (Minimum) | AA | **Medium** |
| [6](#6--three-text-pairings-below-451) | Three text pairings below 4.5:1 | 1.4.3 Contrast (Minimum) | AA | **Medium** |

Findings **1** and **2** sit on the path to purchase, in the size selector — the
most-used control on the page. Findings **3** and **5** concentrate below the
fold, in carousels and the footer.

A separate section records [**what was checked and found sound**](#checked-and-found-sound),
because a defect list is only trustworthy if it also says what passed.

---

## 1 · Interactive boundaries below 3:1

**WCAG 2.2 · 1.4.11 Non-text Contrast (AA)** — requires **3:1** for
"visual information required to identify user interface components".

Seven distinct border/ground pairings fail, across 25 interactive elements:

| Border | Ground | Measured | Elements | |
|---|---|---|---|---|
| `#d5d2cc` | `#ffffff` | **1.51:1** | 8 | ✗ |
| `rgba(51,51,51,.1)` | `#faf6ef` | **1.19:1** | 7 | ✗ |
| `#d5d2cc` | `#e5e3df` | **1.18:1** | 3 | ✗ |
| `#dddddd` | `#d5d2cc` | **1.11:1** | 3 | ✗ |
| `#8e8c89` | `#e5e3df` | **2.62:1** | 2 | ✗ |
| `#8e8c89` | `#d5d2cc` | **2.22:1** | 1 | ✗ |
| `#ffffff` | `#d5d2cc` | **1.51:1** | 1 | ✗ |

### The one that matters most: the size selector

| Control | Border | Ground | Measured | Required | |
|---|---|---|---|---|---|
| Twin XL | `rgb(213,210,204)` | `rgb(255,255,255)` | **1.51:1** | 3:1 | ✗ |
| Queen | `rgb(213,210,204)` | `rgb(255,255,255)` | **1.51:1** | 3:1 | ✗ |
| King | `rgb(213,210,204)` | `rgb(255,255,255)` | **1.51:1** | 3:1 | ✗ |
| Twin *(selected)* | `rgb(51,51,51)` | `rgb(255,255,255)` | 12.63:1 | 3:1 | ✓ |

The selected state is fine. The failure is that the *unselected* options — the
ones a customer is scanning to find their size — have boundaries that are close
to invisible. In bright light, on a dimmed laptop, or with any degree of low
vision, the grid reads as loose text rather than six tappable controls.

**Fix.** Interactive boundaries move to a token that clears 3:1 on the ground it
sits on; `#d5d2cc` is reserved for dividers, where 1.4.11 does not apply. Applied
in [`system/03-components.css`](../system/03-components.css) — `.pf-selector`
uses `--border-sub-strong` (`#8e8c89`) and sets its own white background, giving
**3.35:1**.

> Note the trap in row 5: `#8e8c89` measures 3.35:1 on white but only **2.62:1**
> on `#e5e3df`. A token is not "accessible" in isolation — only against a
> specified ground. This is why the style guide states every ratio against the
> ground the role is approved for, rather than a flattering default.

---

## 2 · Selected size is invisible to assistive tech

**WCAG 2.2 · 4.1.2 Name, Role, Value (A)** and **1.4.1 Use of Color (A)**

All seven size options are bare `<button>` elements:

```
Twin        role=null  aria-checked=null  aria-pressed=null  aria-selected=null
Twin XL     role=null  aria-checked=null  aria-pressed=null  aria-selected=null
Full        role=null  aria-checked=null  aria-pressed=null  aria-selected=null
Queen       role=null  aria-checked=null  aria-pressed=null  aria-selected=null
King        role=null  aria-checked=null  aria-pressed=null  aria-selected=null
Cal King    role=null  aria-checked=null  aria-pressed=null  aria-selected=null
Split King  role=null  aria-checked=null  aria-pressed=null  aria-selected=null
```

None is inside a `<fieldset>` or a `[role="radiogroup"]`.

The selected size is communicated by **two visual signals only** — a darker
border and a beige fill. Neither reaches the accessibility tree.

Two consequences, and they compound with finding 1:

- **A screen reader user** hears seven identical buttons, cannot tell which size
  is active, and gets no signal that the seven are one choice rather than seven
  separate actions.
- **A user who can't rely on colour** has only the border to go on — and that
  border is the 1.51:1 boundary from finding 1.

**Fix.** `role="radiogroup"` + `role="radio"` + `aria-checked`, with arrow-key
navigation per the ARIA APG pattern. Implemented as `.pf-selector` in
[`system/03-components.css`](../system/03-components.css) and demonstrated live
in the style guide.

---

## 3 · 71 of 415 controls have no accessible name

**WCAG 2.2 · 4.1.2 Name, Role, Value (A)**

Computing the accessible name the way assistive tech does — `aria-label`,
`aria-labelledby`, `<label>`, `alt`, then text content — **71 of 415** visible
interactive controls resolve to nothing. A screen reader announces each as
"button" or "link", with no indication of what it does.

They cluster in three places:

**Carousel pagination dots.** The largest group. Unnamed, and 3px tall:

```html
<button data-active="true"  class="bg-white outline-none !w-auto flex-1 rounded-f…">
<button data-active="false" class="size-[10px] bg-white outline-none !h-[3px] !w…">
<button data-active="false" class="outline-none rounded-full bg-border-sub-strong…">
```

Note `data-active` carries the current slide — a custom attribute no assistive
technology reads. Same defect pattern as finding 2: real state, expressed only
to the stylesheet.

**Full-bleed link overlays.** An empty anchor stretched across a card:

```html
<a data-testid="pdp_mattress_collection" class="absolute inset-0 z-[1] max-2xl:c…">
```

**Add-on product images wrapped in buttons:**

```html
<button type="button" class="block h-full w-full cursor-pointer"
        data-testid="pdp_addon_image_puffy-dusk-bed-frame">
```

**Above the fold this is nearly clean** — 1 unnamed control out of 144. The
problem is entirely in lazily-rendered regions, which suggests those components
were built outside whatever review the hero and buy box got.

**Fix.** `aria-label` on each dot ("Go to slide 3 of 8"), `aria-current` or
`aria-selected` instead of `data-active`, and real `alt` text on images inside
button/link wrappers.

---

## 4 · Thirteen headings precede the `<h1>`

**WCAG 2.2 · 1.3.1 Info and Relationships (A)**

The `<h1>` is heading **#14** in document order, preceded by twelve `<h2>`s and
an `<h3>`:

```
H2 · Puffy LUX Mattress                              ← duplicates the H1 text
H2 · 1M+ Sold. Sleep on Our Award-Winning Luxur…
H2 · Responsive Back Support Endorsed by Chirop…
H2 · Advanced Cooling With Cooling Cloud™ Layer…
…eight more H2s…
H3 · Instantly Cool to the Touch, All Night
H1 · Puffy LUX Mattress                              ← the only H1, mid-page
```

There is exactly one `<h1>`, which is correct. But heading navigation is how most
screen reader users skim a page, and here the outline recites the gallery's
marketing copy before it ever names the product. The first heading encountered is
an `<h2>` duplicating the `<h1>`'s own text.

**Fix.** Promote the product name to first in source order and demote the gallery
captions. This is a DOM-order change; the rendered layout need not move.

---

## 5 · Icon-only controls below the target minimum

**WCAG 2.2 · 2.5.8 Target Size (Minimum) (AA)** — 24 × 24 CSS px.

89 icon-only controls measure under 24 × 24. Excluding 20 one-pixel elements that
are almost certainly utility or tracking nodes rather than real targets, the
substantive groups are:

| Control | Rendered | Count | |
|---|---|---|---|
| Carousel pagination dots | **138 × 4**, **28 × 16**, **1 × 32** | 30 | ✗ |
| Video "Volume" control | **8 × 8** | 20 | ✗ |
| "Show more information" | **12 × 8** | 3 | ✗ |
| "Show more information" | **14 × 10**, **16 × 12**, **20 × 20**, **20 × 24** | 4 | ✗ |
| Social links (X, Facebook, Instagram, YouTube) | **20 × 36** | 4 | ✗ (width) |

The 8 × 8 volume controls and the 4px-tall carousel dots are the severe cases.
The "Show more information" buttons matter disproportionately because they sit
inline with pricing and offer copy, where a mis-tap costs the customer the
explanation of what they're buying.

**Caveat, stated plainly.** 2.5.8 carries a *spacing* exception: a target under
24 × 24 still conforms if a 24px-diameter circle centred on it doesn't intersect
a neighbouring target. The four social links are well spaced and may qualify. The
carousel dots sit in a row and almost certainly do not. Each group deserves a
per-case spacing measurement before being filed as a defect — I have not done
that, and say so rather than inflating the count.

**Fix.** `.pf-target` in [`system/04-utilities.css`](../system/04-utilities.css)
extends the hit area of a small control without changing its painted size.

---

## 6 · Three text pairings below 4.5:1

**WCAG 2.2 · 1.4.3 Contrast (Minimum) (AA)**

These three sit on flat, solid grounds, where a computed measurement is exact:

| Text | Colour | Ground | Size | Measured | Required | |
|---|---|---|---|---|---|---|
| Bundle price `$269` | `#067a57` | `#ebeae7` | 16px / 700 | **4.44:1** | 4.5:1 | ✗ |
| Footer link "Privacy" | `#596c7f` | `#0d0d0d` | 18px / 500 | **3.59:1** | 4.5:1 | ✗ |
| "MENU" label *(mobile, 454px)* | `#d5d2cc` | `#e5e3df` | 18px / 400 | **1.18:1** | 4.5:1 | ✗ |

`$269` misses by 0.06. That sounds trivial, but `--success` on `--bg-soft` is a
*token pairing*, not a one-off — it will recur wherever a green price sits on the
beige ground. Darkening `--success` slightly, or moving that price onto white,
fixes the class rather than the instance.

"MENU" appears only in the mobile layout and is the most severe single text
measurement found, at 1.18:1.

**Deliberately excluded.** The automated sweep also flagged roughly ten pairings
inside the gallery and the "See What's Inside" panel at ~1:1. Those are white
text over photography and dark overlays, where the computed-style ground is
simply the wrong surface — the script reads a white ancestor, not the image
actually behind the text. **They are not claimed as defects.** They need a human
eye against rendered pixels, and are listed under open work.

---

## Checked and found sound

Stated explicitly, because these were tested and should *not* appear on a defect list:

| Check | Result |
|---|---|
| **2.4.7 Focus Visible** | **Passes.** Tabbing to a size button matches `:focus-visible` and paints Chrome's default ring (`outline: auto 1px rgb(229,151,0)`). No *designed* indicator, but no failure. *An earlier programmatic `.focus()` reading reported `outline: none`; that was an artefact of `:focus-visible` not matching synthetic focus, and a real Tab keypress disproved it.* |
| **Focus suppression** | No CSS rule in any stylesheet sets `outline: none` on a `:focus` selector. |
| **3.1.1 Language of Page** | `<html lang="en">` present. |
| **1.1.1 Non-text Content** | All 25 visible `<img>` elements carry an `alt` attribute. (Images inside unnamed button wrappers are a separate issue — finding 3.) |
| **2.4.11 Focus Not Obscured** | No case found where a focused control was covered more than 25% by a sticky bar, across 160 focusable elements. |
| **2.3.3 Animation from Interactions** | The site ships `prefers-reduced-motion` handling — 4 media rules. Coverage is partial against 22 infinitely-animating elements; see open work. |

---

## Open work

What this audit could not settle from computed styles alone:

1. **Text over imagery.** ~10 pairings in the gallery and "See What's Inside"
   panel need pixel-level checks against the actual photographs, including the
   worst-case frame of the autoplaying video.
2. **Target-size spacing exception.** Per-case measurement for the groups in
   finding 5 that may conform via spacing rather than size.
3. **`prefers-reduced-motion` coverage.** Whether the 4 existing rules cover all
   22 infinitely-animating elements, or only some.
4. **Countdown timer.** A live "LABOR DAY LAST CHANCE" counter runs down to
   seconds. Marketing countdowns generally fall outside 2.2.1 Timing Adjustable
   because they don't limit task completion — worth a deliberate decision rather
   than an assumption.
5. **Keyboard traps and reading order** through the gallery, the "See What's
   Inside" overlay, and the cookie banner (`z-index: 200`).
6. **Screen reader pass** — VoiceOver and NVDA. No automated check substitutes
   for one, particularly for findings 2 and 3.

---

## Reproducing this

1. Open the live PDP and set the viewport to 1440 × 900.
2. **Scroll to the bottom** so lazy content renders, or the counts will be lower.
3. Paste [`audit.js`](audit.js) into the browser console.

The script is dependency-free and read-only, so it can be run against any page —
including a redesign — to check that these six findings stay fixed.
