#!/usr/bin/env node
/**
 * check-tokens.js — proves tokens/puffy.tokens.json and system/*.css agree.
 *
 * Two files describe the same system: the JSON is what tooling reads (Figma
 * Variables, Style Dictionary, an LLM being briefed on the design language),
 * the CSS is what browsers read. Whenever two files describe one thing they
 * drift, so this resolves both sides to literal values and diffs them.
 *
 *   node tools/check-tokens.js      → exit 0 if they agree, 1 if not
 *
 * No dependencies. Run it in CI, or before you trust a hand-edit.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
// Comments are stripped on read: the token files document contrast ratios and
// token names in prose, and a bare `--foo:` inside a comment would otherwise
// parse as a declaration and swallow the real one after it.
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/* ---------------------------------------------------------------- CSS side */

/** Custom properties from the first :root block (ignores responsive overrides). */
function cssVars(css) {
  const root = css.slice(css.indexOf(":root"));
  const body = root.slice(root.indexOf("{") + 1, root.indexOf("\n}"));
  const vars = {};
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars[name] = value.trim();
  }
  return vars;
}

/** Follow var(--x) chains down to a literal. */
function resolveCss(value, vars, seen = new Set()) {
  const m = /^var\((--[\w-]+)\)$/.exec(value.trim());
  if (!m) return value.trim();
  if (seen.has(m[1])) return value.trim();
  seen.add(m[1]);
  const next = vars[m[1]];
  return next === undefined ? `«missing ${m[1]}»` : resolveCss(next, vars, seen);
}

/** Declarations of a single class rule, e.g. `.pf-body`. */
function cssRule(css, selector) {
  const at = css.indexOf(`\n${selector} {`);
  if (at === -1) return null;
  const body = css.slice(at + selector.length + 3, css.indexOf("}", at));
  const decls = {};
  for (const [, prop, value] of body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)) {
    decls[prop] = value.trim();
  }
  return decls;
}

/* --------------------------------------------------------------- JSON side */

/** Follow {a.b.c} aliases down to a literal. */
function resolveToken(value, tokens, seen = new Set()) {
  if (Array.isArray(value)) return value.map((v) => resolveToken(v, tokens, seen));
  if (typeof value !== "string") return value;
  const m = /^\{([^}]+)\}$/.exec(value.trim());
  if (!m) return value.trim();
  if (seen.has(m[1])) return value.trim();
  seen.add(m[1]);
  const node = m[1].split(".").reduce((o, k) => (o == null ? o : o[k]), tokens);
  if (node == null || node.$value === undefined) return `«missing {${m[1]}}»`;
  return resolveToken(node.$value, tokens, seen);
}

/* ------------------------------------------------------------- comparison */

const norm = (v) => {
  if (Array.isArray(v)) v = v.join(",");
  return String(v)
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/\b0(px|ms|s)\b/g, "0") // CSS writes a bare 0, DTCG wants a unit
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ",")
    .trim();
};

const results = [];
const check = (label, jsonValue, cssValue) => {
  results.push({ label, jsonValue, cssValue, ok: norm(jsonValue) === norm(cssValue) });
};

/* ------------------------------------------------------------------- run */

const tokens = JSON.parse(read("tokens/puffy.tokens.json"));
const vars = cssVars(read("system/01-tokens.css"));
const base = read("system/02-base.css");

/** Compare every leaf under a JSON group against `prefix + key` in CSS. */
function checkGroup(group, cssPrefix, groupPath) {
  for (const [key, node] of Object.entries(group)) {
    if (key.startsWith("$") || node == null || node.$value === undefined) continue;
    const cssName = `${cssPrefix}${key}`;
    const cssRaw = vars[cssName];
    if (cssRaw === undefined) {
      results.push({ label: `${groupPath}.${key}`, jsonValue: resolveToken(node.$value, tokens), cssValue: `«no ${cssName}»`, ok: false });
      continue;
    }
    check(`${groupPath}.${key}  →  ${cssName}`, resolveToken(node.$value, tokens), resolveCss(cssRaw, vars));
  }
}

// Tier 1 — primitives
checkGroup(tokens.puffy.color, "--", "puffy.color");
checkGroup(tokens.puffy.space, "--puffy-space-", "puffy.space");
checkGroup(tokens.puffy.radius, "--puffy-radius-", "puffy.radius");
checkGroup(tokens.puffy.size, "--puffy-size-", "puffy.size");
checkGroup(tokens.puffy.leading, "--puffy-leading-", "puffy.leading");
checkGroup(tokens.puffy.weight, "--puffy-weight-", "puffy.weight");
checkGroup(tokens.puffy.tracking, "--puffy-tracking-", "puffy.tracking");
checkGroup(tokens.puffy.family, "--font-", "puffy.family");

// Tier 2 — semantic
checkGroup(tokens.text, "--text-", "text");
checkGroup(tokens.highlight, "--highlight-", "highlight");
checkGroup(tokens.border, "--border-", "border");
checkGroup(tokens.bg, "--bg-", "bg");
checkGroup(tokens.fill, "--fill-", "fill");
checkGroup(tokens.icon, "--icon-", "icon");

// Names that don't follow their group's prefix
for (const [jsonPath, cssName] of [
  ["status.success", "--success"],
  ["status.warning", "--warning"],
  ["status.brand", "--brand"],
  ["layout.max", "--layout-max"],
  ["layout.gutter", "--layout-gutter"],
  ["layout.rhs-column", "--layout-rhs-column"],
  ["layout.navbar-height", "--navbar-height"],
  ["layout.banner-height", "--banner-height"],
  ["layout.target-min", "--target-min"],
  ["motion.duration.fast", "--duration-fast"],
  ["motion.duration.base", "--duration-base"],
  ["motion.duration.slow", "--duration-slow"],
  ["effect.ring-focus", "--ring-focus"],
  ["effect.ring-selected", "--ring-selected"],
  ["effect.inset-hairline", "--inset-hairline"],
]) {
  const node = jsonPath.split(".").reduce((o, k) => (o == null ? o : o[k]), tokens);
  let jsonValue = resolveToken(node.$value, tokens);
  // CSS writes durations in seconds, the DTCG spec in milliseconds.
  if (/^\d+ms$/.test(jsonValue)) jsonValue = `${parseInt(jsonValue, 10) / 1000}s`;
  // Token refs inside a raw shadow string won't resolve — compare literally.
  const cssRaw = vars[cssName];
  check(`${jsonPath}  →  ${cssName}`, jsonValue, cssRaw === undefined ? `«no ${cssName}»` : resolveCss(cssRaw, vars).replace(/var\((--[\w-]+)\)/g, (_, n) => resolveCss(vars[n] ?? "", vars)));
}

// Shadow objects → the CSS shorthand
for (const key of ["float", "lift"]) {
  const s = tokens.effect[key].$value;
  check(
    `effect.${key}  →  --shadow-${key}`,
    `${s.offsetX} ${s.offsetY} ${s.blur} ${s.color}`,
    vars[`--shadow-${key}`] ?? `«no --shadow-${key}»`
  );
}

// Typography → the .pf-* classes in 02-base.css
const PROP = { fontSize: "font-size", lineHeight: "line-height", fontWeight: "font-weight", letterSpacing: "letter-spacing", fontFamily: "font-family" };
for (const [name, node] of Object.entries(tokens.typography)) {
  if (name.startsWith("$")) continue;
  const selector = node.$extensions.class;
  const rule = cssRule(base, selector);
  if (!rule) {
    results.push({ label: `typography.${name}  →  ${selector}`, jsonValue: "(rule)", cssValue: "«selector not found»", ok: false });
    continue;
  }
  for (const [jsonProp, cssProp] of Object.entries(PROP)) {
    if (node.$value[jsonProp] === undefined) continue;
    check(
      `typography.${name}.${jsonProp}  →  ${selector}`,
      resolveToken(node.$value[jsonProp], tokens),
      rule[cssProp] === undefined ? `«no ${cssProp}»` : resolveCss(rule[cssProp], vars)
    );
  }
  if (node.$value.textCase === "uppercase" && rule["text-transform"] !== "uppercase") {
    results.push({ label: `typography.${name}.textCase  →  ${selector}`, jsonValue: "uppercase", cssValue: rule["text-transform"] ?? "«none»", ok: false });
  }
}

/* ---------------------------------------------------------------- report */

const failed = results.filter((r) => !r.ok);
for (const r of failed) {
  console.error(`  ✗ ${r.label}\n      json: ${r.jsonValue}\n      css:  ${r.cssValue}`);
}
console.log(
  failed.length === 0
    ? `✓ tokens in sync — ${results.length} values match across puffy.tokens.json and system/*.css`
    : `\n✗ ${failed.length} of ${results.length} values disagree`
);
process.exit(failed.length === 0 ? 0 : 1);
