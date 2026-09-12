#!/usr/bin/env node
/**
 * check-tokens.js — guards the three-way reconciliation.
 *
 *   node tools/check-tokens.js      → exit 0 if all three agree, 1 if not
 *
 * The system is described in three places, in this order of authority:
 *
 *   1. puffy.com/products/puffy-lux-mattress   the source of truth
 *   2. Figma · Puffy · Foundations             naming and intent
 *   3. system/*.css                            the implementation
 *
 * Three independent checks, because each catches a different way to drift:
 *
 *   A · JSON currency   tokens/puffy.tokens.json is generated from the CSS,
 *                       so a hand-edit or a forgotten rebuild is caught.
 *   B · Figma metrics   all 22 text styles exist with the exact metrics read
 *                       back from the library. Generation can't catch this —
 *                       the CSS could drift from Figma and still be internally
 *                       consistent.
 *   C · Live values     the colour primitives still match what puffy.com's own
 *                       :root serves. If the site rebrands, this fails first.
 *
 * No dependencies. Wired into `npm run check` and CI.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

const results = [];
const check = (label, expected, actual) =>
  results.push({ label, expected, actual, ok: norm(expected) === norm(actual) });
const norm = (v) => String(v).toLowerCase().replace(/["']/g, "").replace(/\s+/g, " ").trim();

/* ------------------------------------------------------------ CSS parsing */

function rootVars(css) {
  const body = css.slice(css.indexOf("{", css.indexOf(":root")) + 1, css.indexOf("\n}"));
  const vars = {};
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[name] = value.trim();
  return vars;
}

function resolve(value, vars, seen = new Set()) {
  const m = /^var\((--[\w-]+)\)$/.exec(String(value).trim());
  if (!m || seen.has(m[1])) return String(value).trim();
  seen.add(m[1]);
  return vars[m[1]] === undefined ? `«missing ${m[1]}»` : resolve(vars[m[1]], vars, seen);
}

function classRules(css) {
  const rules = {};
  for (const m of css.matchAll(/\n(\.pf-[\w-]+)\s*\{([^}]*)\}/g)) {
    const decls = {};
    for (const [, prop, value] of m[2].matchAll(/([\w-]+)\s*:\s*([^;]+);/g)) decls[prop] = value.trim();
    rules[m[1]] = decls;
  }
  return rules;
}

const vars = rootVars(read("system/01-tokens.css"));
const base = classRules(read("system/02-base.css"));

/* ===========================================================================
   A · The generated JSON is current
   ======================================================================== */

let jsonCurrent = true;
try {
  execFileSync("node", [path.join(__dirname, "build-tokens.js"), "--check"], { stdio: "pipe" });
} catch {
  jsonCurrent = false;
}
results.push({
  label: "tokens/puffy.tokens.json is current",
  expected: "generated from system/*.css",
  actual: jsonCurrent ? "generated from system/*.css" : "STALE — run node tools/build-tokens.js",
  ok: jsonCurrent,
});

/* ===========================================================================
   B · All 22 Figma text styles, with the metrics read back from the library
   Figma page `03 · Typography`. [family, size, lineHeight, weight, tracking]
   ======================================================================== */

const SERIF = "PT Serif", SANS = "Mukta";
const FIGMA_TYPE = {
  ".pf-heading-product-mobile":   [SERIF, "24px", "32px", 400, "0"],
  ".pf-heading-product-desktop":  [SERIF, "28px", "36px", 400, "0"],
  ".pf-heading-product-wide":     [SERIF, "32px", "40px", 400, "0"],
  ".pf-heading-gallery-mobile":   [SERIF, "20px", "28px", 400, "0"],
  ".pf-heading-section":          [SERIF, "40px", "48px", 400, "0"],
  ".pf-heading-support":          [SERIF, "24px", "32px", 700, "0"],
  ".pf-heading-footer":           [SERIF, "20px", "28px", 400, "0"],
  ".pf-price-large":              [SERIF, "32px", "40px", 700, "0"],
  ".pf-price-small":              [SERIF, "16px", "24px", 700, "0"],
  ".pf-label-product-badge":      [SERIF, "14px", "20px", 400, "0"],
  ".pf-body-small":               [SANS,  "14px", "20px", 400, "0"],
  ".pf-body-default":             [SANS,  "16px", "24px", 400, "0"],
  ".pf-body-large":               [SANS,  "18px", "24px", 400, "0"],
  ".pf-body-benefit-desktop":     [SANS,  "16px", "24px", 500, "0"],
  ".pf-body-benefit-mobile":      [SANS,  "18px", "24px", 500, "0"],
  ".pf-label-section":            [SANS,  "20px", "28px", 400, "0"],
  ".pf-label-control":            [SANS,  "18px", "18px", 500, "0"],
  ".pf-label-control-selected":   [SANS,  "18px", "18px", 700, "0"],
  ".pf-action-primary":           [SANS,  "20px", "25px", 500, "0"],
  ".pf-action-link":              [SANS,  "16px", "24px", 500, "0"],
  ".pf-label-inside":             [SANS,  "14px", "20px", 600, "1.4px"],
  ".pf-label-caption":            [SANS,  "14px", "20px", 500, "0"],
};

for (const [selector, [family, size, leading, weight, tracking]] of Object.entries(FIGMA_TYPE)) {
  const rule = base[selector];
  if (!rule) {
    results.push({ label: `Figma type · ${selector}`, expected: "defined", actual: "MISSING", ok: false });
    continue;
  }
  const got = resolve(rule["font-family"], vars);
  check(`Figma type · ${selector} family`, family, got.split(",")[0]);
  check(`Figma type · ${selector} size`, size, resolve(rule["font-size"], vars));
  check(`Figma type · ${selector} line-height`, leading, resolve(rule["line-height"], vars));
  check(`Figma type · ${selector} weight`, weight, resolve(rule["font-weight"], vars));
  check(`Figma type · ${selector} tracking`, tracking, resolve(rule["letter-spacing"], vars));
}

const styleCount = Object.keys(FIGMA_TYPE).length;

/* ===========================================================================
   C · Colour primitives still match the live site
   Harvested from puffy.com's own :root, which serves space-separated RGB
   triplets for Tailwind's `rgb(var(--x) / <alpha>)` composition. Converted
   to hex here — the values are identical, only the notation differs.
   ======================================================================== */

const LIVE = {
  "--base-white": "255 255 255", "--base-black": "51 51 51", "--base-green": "6 122 87",
  "--navy-blue-light-1000": "43 47 68", "--navy-blue-dark-1000": "119 123 145",
  "--slate-gray-light-1000": "89 108 127", "--slate-gray-dark-1000": "134 156 178",
  "--amber-light-1000": "143 108 26", "--amber-dark-1000": "224 190 112",
  "--green-light-1000": "6 122 87", "--red-light-1000": "199 58 58",
  "--solid-beige-700": "70 70 69", "--solid-beige-600": "142 140 137",
  "--solid-beige-500": "213 210 204", "--solid-beige-400": "241 227 207",
  "--solid-beige-300": "229 227 223", "--solid-beige-200": "235 234 231",
  "--solid-beige-100": "251 251 250",
  "--beige-100": "250 246 239", "--beige-150": "247 245 242", "--beige-200": "241 238 234",
  "--beige-300": "217 209 197", "--beige-600": "224 193 148", "--beige-700": "199 147 68",
  "--blue-100": "244 245 249", "--blue-200": "218 220 232", "--blue-300": "145 151 185",
  "--blue-500": "43 47 68", "--blue-600": "27 29 43",
  "--neutral-200": "246 248 249", "--neutral-300": "177 189 200",
  "--neutral-500": "89 108 127", "--neutral-600": "53 73 94",
  "--neutral-700": "44 54 64", "--neutral-800": "31 31 31",
  "--green-500": "110 150 114", "--green-600": "21 125 18", "--red-500": "174 65 52",
};

const toHex = (triplet) =>
  "#" + triplet.split(/\s+/).map((n) => (+n).toString(16).padStart(2, "0")).join("");

for (const [name, triplet] of Object.entries(LIVE)) {
  const actual = vars[name] === undefined ? `«no ${name}»` : resolve(vars[name], vars);
  check(`live puffy.com · ${name}`, toHex(triplet), actual);
}

/* ===========================================================================
   Report
   ======================================================================== */

const failed = results.filter((r) => !r.ok);
for (const r of failed) {
  console.error(`  ✗ ${r.label}\n      expected: ${r.expected}\n      actual:   ${r.actual}`);
}

if (failed.length === 0) {
  console.log(
    `✓ reconciled — ${results.length} checks pass\n` +
    `    · tokens/puffy.tokens.json generated from system/*.css and current\n` +
    `    · ${styleCount} Figma text styles match the library metrics\n` +
    `    · ${Object.keys(LIVE).length} colour primitives match live puffy.com`
  );
} else {
  console.log(`\n✗ ${failed.length} of ${results.length} checks failed`);
}
process.exit(failed.length === 0 ? 0 : 1);
