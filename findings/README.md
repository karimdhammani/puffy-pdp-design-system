# Findings

Evidence gathered against the **live** Puffy site, kept separate from the design
system so the two can be read independently: a finding is an observation about
what exists today, and the system is a proposal about what should exist next.

| Document | What it covers |
|---|---|
| [accessibility-audit.md](accessibility-audit.md) | WCAG 2.2 AA audit of the Lux PDP — six findings, with measurements |
| [audit.js](audit.js) | The script behind those measurements. Dependency-free, read-only, re-runnable against any page |

---

## Standard of evidence

Everything here was measured against production `puffy.com`, not against a
replica, a screenshot, or a mockup. Three rules were applied:

**Measure, don't estimate.** Every ratio is computed from the live element's
resolved colour, alpha-composited over its actual ground. No figure is
eyeballed from a design file.

**Say what the measurement can't see.** Text over photography cannot be judged
from computed styles — the script reads the nearest ancestor with a background
colour, which for text on an image is the wrong surface. Roughly ten such
pairings were flagged by the sweep and are *excluded* from the findings rather
than counted, with the reason stated.

**Publish what passed.** The audit has a
[Checked and found sound](accessibility-audit.md#checked-and-found-sound)
section. A defect list that only lists defects gives no way to tell thorough
work from selective work — and one item in it is a correction of a wrong reading
I made earlier in the same audit.

---

## How this connects to the system

Three findings are already addressed in `/system`, and the audit links to the
exact file in each case:

| Finding | Addressed by |
|---|---|
| 1 · Interactive boundaries below 3:1 | `.pf-selector`, `.pf-btn--quiet`, `.pf-accordion` use `--border-sub-strong` (3.35:1 on white) |
| 2 · Selection state not exposed | `.pf-selector` is documented and demonstrated as a `radiogroup` with `aria-checked` |
| 5 · Targets below 24 × 24 | `.pf-target` extends a hit area without changing the painted size |

Findings 3, 4, and 6 are page-level or content-level and can't be fixed by a
stylesheet — they need DOM and copy changes at implementation time. They're
recorded here so they don't get lost.

---

## Re-running the audit

```
1. Open the target page at 1440 × 900
2. Scroll to the bottom so lazy content renders
3. Paste audit.js into the browser console
```

Step 2 matters: the PDP exposes 144 interactive controls at first paint and 415
once fully scrolled. A count taken without it understates the page by two-thirds.
