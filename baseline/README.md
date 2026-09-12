# Baseline — Puffy Lux PDP

A 1:1 desktop replica of the live Puffy Lux PDP, captured September 2026.

It exists for one reason: **a redesign needs a floor.** This is what "no worse than
today" actually looks like, in code you can measure rather than a screenshot you
can argue with.

It is deliberately left as-is, including the quirks:

- `--slide-offset: -12px` reproduces the live gallery's 12px misalignment — set it
  to `0` to see the page without the bug.
- `--merchant-widget-offset` reserves the space the live page leaves for Google's
  merchant badge.

The baseline does **not** use `/system`. It is a record of the source, not an
example of the design system. For that, see `/style-guide` and `/pages/_template.html`.

Where the system deliberately diverges from this baseline — and why — is documented
in the root README under "Where this improves on the baseline".
