#!/usr/bin/env node
/**
 * build-tokens.js — generates tokens/puffy.tokens.json from system/*.css
 *
 *   node tools/build-tokens.js            write the file
 *   node tools/build-tokens.js --check    exit 1 if the committed file is stale
 *
 * WHY THIS DIRECTION. The CSS is what ships to a browser, so it is the source
 * of truth. The JSON is an interchange artefact — Figma Variables, Style
 * Dictionary, Tokens Studio, or an LLM being briefed on the design language.
 * Generating it means the two can never disagree; `--check` (wired into
 * `npm run check` and CI) fails the build if someone hand-edits the JSON or
 * forgets to regenerate after touching a token.
 *
 * No dependencies.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "tokens/puffy.tokens.json");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
// A bare `--foo:` inside a comment would otherwise parse as a declaration.
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/* ------------------------------------------------------------ CSS parsing */

/** Declarations of the first :root block, in source order. */
function rootVars(css) {
  const body = css.slice(css.indexOf("{", css.indexOf(":root")) + 1, css.indexOf("\n}"));
  const vars = [];
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars.push([name, value.trim()]);
  }
  return vars;
}

/** Every `.pf-*` class rule in a stylesheet, as declaration maps. */
function classRules(css) {
  const rules = {};
  for (const m of css.matchAll(/\n(\.pf-[\w-]+)\s*\{([^}]*)\}/g)) {
    const decls = {};
    for (const [, prop, value] of m[2].matchAll(/([\w-]+)\s*:\s*([^;]+);/g)) decls[prop] = value.trim();
    rules[m[1]] = decls;
  }
  return rules;
}

/* ---------------------------------------------------- name → DTCG grouping */

const COLOR_FAMILIES = /^--(base|navy-blue|slate-gray|amber|green|red|solid-beige|beige|blue|neutral)-/;

/** Where a CSS custom property lives in the token tree. */
function groupFor(name) {
  const n = name.slice(2);
  if (COLOR_FAMILIES.test(name)) return ["puffy", "color", n];
  for (const g of ["space", "radius", "size", "leading", "weight", "tracking"]) {
    if (n.startsWith(`puffy-${g}-`)) return ["puffy", g, n.slice(`puffy-${g}-`.length)];
  }
  if (n.startsWith("font-")) return ["puffy", "family", n.slice(5)];
  if (n.startsWith("elevation-")) return ["effect", n.slice(10)];
  if (n.startsWith("hover-cta-")) return ["state", n.slice(6)];
  for (const g of ["text", "highlight", "border", "bg", "fill", "icon"]) {
    if (n.startsWith(`${g}-`)) return [g, n.slice(g.length + 1)];
  }
  if (["success", "warning", "brand", "disabled", "white"].includes(n)) return ["status", n];
  if (["curve", "ease-standard", "time-faster"].includes(n)) return ["motion", n];
  if (n.startsWith("duration-")) return ["motion", n];
  if (n.startsWith("layout-") || ["navbar-height", "banner-height", "header-height",
      "rail-width", "thumb-w", "thumb-h", "target-min"].includes(n)) {
    return ["layout", n.replace(/^layout-/, "")];
  }
  if (n.startsWith("pf-")) return ["component", n.slice(3)];
  return ["other", n];
}

/** DTCG $type for a group. */
const TYPE_FOR = {
  color: "color", space: "dimension", radius: "dimension", size: "dimension",
  leading: "dimension", weight: "fontWeight", tracking: "dimension",
  family: "fontFamily", text: "color", highlight: "color", border: "color",
  bg: "color", fill: "color", icon: "color", status: "color", state: "color",
  effect: "shadow", layout: "dimension", component: "dimension",
};

/* --------------------------------------------------------------- building */

const cssTokens = rootVars(strip(read("system/01-tokens.css")));
const pathByVar = new Map(cssTokens.map(([name]) => [name, groupFor(name)]));

/** `var(--x)` becomes a DTCG alias `{a.b.c}` so the tree keeps its references. */
const toValue = (raw) => {
  const m = /^var\((--[\w-]+)\)$/.exec(raw);
  if (!m) return raw;
  const p = pathByVar.get(m[1]);
  return p ? `{${p.join(".")}}` : raw;
};

const tree = {
  $schema: "https://design-tokens.github.io/community-group/format/",
  $description:
    "Puffy · Foundations — PDP design tokens. GENERATED from system/01-tokens.css and " +
    "system/02-base.css by tools/build-tokens.js — edit the CSS, not this file. " +
    "W3C DTCG format, so it imports into Figma Variables, Style Dictionary, and Tokens " +
    "Studio without translation. Values are reconciled against the live site at " +
    "puffy.com/products/puffy-lux-mattress, which is the source of truth.",
};

for (const [name, raw] of cssTokens) {
  const p = groupFor(name);
  let node = tree;
  for (const key of p.slice(0, -1)) node = node[key] ??= {};
  const leaf = p.at(-1);
  const groupKey = p.length > 2 ? p[1] : p[0];
  node.$type ??= TYPE_FOR[groupKey] || "other";
  node[leaf] = { $value: toValue(raw), $extensions: { css: name } };
}

/* ------------------------------------------- typography from 02-base.css */

// Figma text style ↔ CSS class. The names match by construction.
const FIGMA_NAME = (cls) =>
  "Puffy/" + cls.slice(4)
    .replace(/^heading-/, "Heading/")
    .replace(/^price-/, "Price/")
    .replace(/^body-/, "Body/")
    .replace(/^label-/, "Label/")
    .replace(/^action-/, "Action/")
    .replace(/-/g, " ")
    .replace(/\/(\w)/, (_, c) => "/" + c.toUpperCase())
    .replace(/^(\w)/, (c) => c.toUpperCase());

const base = classRules(strip(read("system/02-base.css")));
const TYPO_PROPS = {
  "font-family": "fontFamily", "font-size": "fontSize", "line-height": "lineHeight",
  "font-weight": "fontWeight", "letter-spacing": "letterSpacing",
};

const typography = { $type: "typography" };
for (const [cls, decls] of Object.entries(base)) {
  if (!decls["font-size"] || !decls["font-family"]) continue;   // type styles only
  const value = {};
  for (const [cssProp, jsonProp] of Object.entries(TYPO_PROPS)) {
    if (decls[cssProp]) value[jsonProp] = toValue(decls[cssProp]);
  }
  typography[cls.slice(4)] = {
    $value: value,
    $extensions: { figma: FIGMA_NAME(cls), class: cls },
  };
}
tree.typography = typography;

/* ----------------------------------------------------------------- output */

const json = JSON.stringify(tree, null, 2) + "\n";
const styleCount = Object.keys(typography).length - 1;

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (current === json) {
    console.log(`✓ tokens/puffy.tokens.json is current — ${cssTokens.length} tokens, ${styleCount} text styles`);
    process.exit(0);
  }
  console.error("✗ tokens/puffy.tokens.json is stale. Run: node tools/build-tokens.js");
  process.exit(1);
}

fs.writeFileSync(OUT, json);
console.log(`✓ wrote tokens/puffy.tokens.json — ${cssTokens.length} tokens, ${styleCount} text styles`);
