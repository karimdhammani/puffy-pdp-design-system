/**
 * audit.js — the measurements behind findings/accessibility-audit.md
 *
 * Paste into the browser console on any page. No dependencies, no build,
 * read-only: it measures the live DOM and prints, it changes nothing.
 *
 *   Written against https://puffy.com/products/puffy-lux-mattress at 1440×900.
 *   Run it against a redesign to confirm the six findings stay fixed.
 *
 * What it deliberately does NOT do: judge text that sits on photography.
 * A computed-style "ground" is the nearest ancestor with a background colour,
 * which for text over an image is the wrong surface entirely. Those cases are
 * reported separately as needing a human eye rather than counted as failures.
 */
(() => {
  "use strict";

  /* ----------------------------------------------------------- colour maths */

  const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const parse = (s) => {
    const m = String(s).match(/[\d.]+/g);
    return m ? { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] } : null;
  };
  const flatten = (f, b) =>
    f.a >= 1 ? f : {
      r: f.r * f.a + b.r * (1 - f.a),
      g: f.g * f.a + b.g * (1 - f.a),
      b: f.b * f.a + b.b * (1 - f.a),
      a: 1,
    };
  const PAGE = { r: 255, g: 255, b: 255, a: 1 };

  /** WCAG 2.x contrast, alpha-composited on both sides. */
  const contrast = (fg, bg) => {
    const B = flatten(parse(bg), PAGE);
    const F = flatten(parse(fg), B);
    const [hi, lo] = [L(F), L(B)].sort((a, b) => b - a);
    return (hi + 0.05) / (lo + 0.05);
  };

  /* ---------------------------------------------------------------- helpers */

  const visible = (el) => {
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && +s.opacity > 0 && r.width > 0 && r.height > 0;
  };

  const ground = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      const p = parse(bg);
      if (p && p.a > 0) return bg;
    }
    return "rgb(255,255,255)";
  };

  /** True when the text is painted over an image, video, or gradient. */
  const overMedia = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage && s.backgroundImage !== "none") return true;
      const media = n.querySelector(":scope > img, :scope > video, :scope > picture, :scope > canvas");
      if (media) {
        const m = media.getBoundingClientRect(), t = el.getBoundingClientRect();
        if (m.width > t.width * 0.8 && m.height > 20 &&
            t.left < m.right && t.right > m.left && t.top < m.bottom && t.bottom > m.top) return true;
      }
    }
    return false;
  };

  const accName = (el) => {
    const al = el.getAttribute("aria-label");
    if (al && al.trim()) return al.trim();
    const lb = el.getAttribute("aria-labelledby");
    if (lb) {
      const t = lb.split(/\s+/).map((id) => document.getElementById(id)?.textContent || "").join(" ").trim();
      if (t) return t;
    }
    if (el.tagName === "IMG") return el.getAttribute("alt") || "";
    if (el.tagName === "INPUT") {
      const l = el.labels && el.labels[0];
      if (l) return l.textContent.trim();
      return el.getAttribute("placeholder") || el.getAttribute("title") || "";
    }
    return (el.textContent || "").trim() || el.getAttribute("title") || "";
  };

  const INTERACTIVE =
    'a[href],button,input,select,textarea,summary,[role="button"],[role="radio"],' +
    '[role="tab"],[role="checkbox"],[tabindex]:not([tabindex="-1"])';

  const controls = [...document.querySelectorAll(INTERACTIVE)].filter(visible);

  /* ---------------------------- 1 · non-text contrast on interactive borders */

  const borders = controls
    .map((el) => {
      const s = getComputedStyle(el);
      if (s.borderTopWidth === "0px" || parse(s.borderTopColor)?.a === 0) return null;
      const bg = ground(el.parentElement || el);
      return {
        control: accName(el).replace(/\s+/g, " ").slice(0, 28),
        border: s.borderTopColor, ground: bg,
        ratio: +contrast(s.borderTopColor, bg).toFixed(2),
      };
    })
    .filter((x) => x && x.ratio < 3);

  // Collapse to distinct border/ground pairings — one row per real defect.
  const borderPairs = [...new Map(borders.map((b) => [b.border + "|" + b.ground, b])).values()]
    .map((b) => ({ ...b, sharedBy: borders.filter((x) => x.border === b.border && x.ground === b.ground).length }));

  /* ----------------------------------------------- 2 · selection-state roles */

  const SIZES = ["Twin", "Twin XL", "Full", "Queen", "King", "Cal King", "Split King"];
  const pickers = [...document.querySelectorAll("button,[role]")]
    .filter(visible)
    .filter((b) => SIZES.includes((b.textContent || "").trim()))
    .map((b) => ({
      label: (b.textContent || "").trim(),
      role: b.getAttribute("role"),
      ariaChecked: b.getAttribute("aria-checked"),
      ariaPressed: b.getAttribute("aria-pressed"),
      inRadiogroup: !!b.closest('[role="radiogroup"]'),
      inFieldset: !!b.closest("fieldset"),
    }));
  const stateless = pickers.filter(
    (p) => !p.role && !p.ariaChecked && !p.ariaPressed && !p.inRadiogroup && !p.inFieldset
  );

  /* ----------------------------------------------------- 3 · heading outline */

  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible);
  const firstH1 = headings.findIndex((h) => h.tagName === "H1");
  const headingIssue = firstH1 > 0
    ? { h1Position: firstH1 + 1, precededBy: headings.slice(0, firstH1).map((h) => h.tagName) }
    : null;

  /* --------------------------------------------------------- 4 · target size */

  const smallTargets = controls
    .filter((el) => ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) // icon-only
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { control: accName(el).slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) };
    })
    .filter((x) => x.w < 24 || x.h < 24);

  /* ------------------------------------------------------- 5 · text contrast */

  const solid = [], onMedia = [];
  const seen = new Set();
  document.querySelectorAll("body *").forEach((el) => {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
    if (own.length < 2 || !visible(el)) return;
    const s = getComputedStyle(el);
    const px = parseFloat(s.fontSize), weight = +s.fontWeight || 400;
    const large = px >= 24 || (px >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    const bg = ground(el.parentElement || el);
    const ratio = contrast(s.color, bg);
    if (ratio >= need) return;
    const key = `${s.color}|${bg}|${Math.round(px)}`;
    if (seen.has(key)) return;
    seen.add(key);
    const row = { text: own.replace(/\s+/g, " ").slice(0, 40), color: s.color, ground: bg,
                  px, weight, ratio: +ratio.toFixed(2), needs: need };
    (overMedia(el) ? onMedia : solid).push(row);
  });

  /* -------------------------------------------------- 6 · accessible naming */

  const unnamed = controls.filter((el) => !accName(el))
    .map((el) => el.outerHTML.slice(0, 100).replace(/\s+/g, " "));

  /* ------------------------------------------------------------- sound checks */

  let suppressors = 0;
  const walk = (sheet) => {
    let rules; try { rules = sheet.cssRules; } catch { return; }
    if (!rules) return;
    for (const r of rules) {
      if (r.styleSheet) walk(r.styleSheet);
      else if (r.style && /focus/.test(r.selectorText || "") &&
               (r.style.outline === "none" || r.style.outlineWidth === "0px")) suppressors++;
    }
  };
  [...document.styleSheets].forEach(walk);

  const imgs = [...document.querySelectorAll("img")].filter(visible);

  /* ----------------------------------------------------------------- report */

  const line = (s) => console.log(`%c${s}`, "font-weight:bold");
  console.log(`\n=== Accessibility audit · ${location.pathname} · ${innerWidth}×${innerHeight} ===\n`);

  line("1 · Non-text contrast on interactive borders (1.4.11 AA, needs 3:1)");
  console.table(borderPairs);

  line("2 · Selection state exposed to AT (4.1.2 A / 1.4.1 A)");
  console.log(`${stateless.length} of ${pickers.length} size options expose no role or state`);
  console.table(pickers);

  line("3 · Heading order (1.3.1 A)");
  console.log(headingIssue
    ? `H1 is heading #${headingIssue.h1Position}, preceded by: ${headingIssue.precededBy.join(", ")}`
    : "H1 is the first heading ✓");

  line("4 · Icon-only target size (2.5.8 AA, needs 24×24)");
  console.log("Note: the spacing exception may rescue well-separated targets — measure per case.");
  console.table(smallTargets);

  line("5 · Text contrast on solid grounds (1.4.3 AA)");
  console.table(solid);
  console.log(`+ ${onMedia.length} pairings over imagery — NOT counted as defects, need a human eye:`,
              onMedia.map((m) => m.text));

  line("6 · Controls with no accessible name (4.1.2 A)");
  console.log(`${unnamed.length} of ${controls.length}`, unnamed);

  line("Sound checks");
  console.table([
    { check: "lang attribute", result: document.documentElement.lang || "MISSING" },
    { check: "focus-suppressing CSS rules", result: suppressors },
    { check: "images with alt attribute", result: `${imgs.filter((i) => i.hasAttribute("alt")).length}/${imgs.length}` },
    { check: "named controls", result: `${controls.length - unnamed.length}/${controls.length}` },
  ]);
  console.log("\nFocus visibility cannot be tested programmatically — synthetic .focus() does not\n" +
              "reliably match :focus-visible. Press Tab and look.\n");

  return { borderPairs, pickers, headingIssue, smallTargets, solid, onMedia, unnamed };
})();
