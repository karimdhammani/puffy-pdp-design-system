/* ==========================================================================
   Style-guide specimen generator.
   --------------------------------------------------------------------------
   The specimens are generated FROM the live stylesheet rather than typed by
   hand, so this page can never document a value the system no longer has.
   Contrast ratios are measured in the browser from the resolved token — edit
   a token and the number on the page moves with it.
   ========================================================================== */
(() => {
  "use strict";

  const root = document.documentElement;
  const token = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* ------------------------------------------------------------- colour */

  /** Any CSS colour → {r,g,b,a}, by letting the browser do the parsing. */
  const parse = (() => {
    const probe = document.createElement("span");
    probe.style.display = "none";
    document.body.appendChild(probe);
    return (value) => {
      probe.style.color = "";
      probe.style.color = value;
      const m = getComputedStyle(probe).color.match(/[\d.]+/g);
      if (!m) return null;
      return { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] };
    };
  })();

  /** Composite a translucent colour over its ground — several roles use alpha. */
  const flatten = (fg, bg) =>
    fg.a >= 1 ? fg : {
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    };

  const luminance = ({ r, g, b }) => {
    const lin = (c) => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };

  const PAGE = { r: 255, g: 255, b: 255, a: 1 };

  /**
   * WCAG 2.x contrast ratio, alpha-aware on both sides. Several roles are
   * translucent — --fill-green-soft is a 10% green — so the ground is first
   * composited over the page white, then the foreground over that. Measuring
   * a translucent colour as if it were solid reports a badly wrong number.
   */
  const contrast = (fgValue, bgValue) => {
    const bg = flatten(parse(bgValue), PAGE);
    const fg = flatten(parse(fgValue), bg);
    const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
    return (hi + 0.05) / (lo + 0.05);
  };

  const hex = (value) => {
    const c = parse(value);
    if (!c) return value;
    const h = (n) => Math.round(n).toString(16).padStart(2, "0");
    return c.a < 1 ? `${c.a * 100}% #${h(c.r)}${h(c.g)}${h(c.b)}` : `#${h(c.r)}${h(c.g)}${h(c.b)}`;
  };

  /* ---------------------------------------------------------- PRIMITIVES */

  const PRIMITIVES = [
    "--navy-blue-light-1000", "--navy-blue-dark-1000", "--slate-gray-light-1000", "--slate-gray-dark-1000",
    "--primary-600", "--solid-beige-700", "--solid-beige-600", "--solid-beige-500", "--solid-beige-400",
    "--solid-beige-300", "--solid-beige-200", "--solid-beige-100", "--beige-100", "--beige-200",
    "--beige-600", "--beige-700", "--amber-light-1000", "--amber-dark-1000", "--green-light-1000",
    "--red-light-1000", "--base-black", "--base-white",
  ];

  const ramp = document.getElementById("ramp");
  PRIMITIVES.forEach((name) => {
    const value = token(name);
    const chip = el("div", "sg-chip");
    chip.appendChild(Object.assign(el("div", "sg-chip__swatch"), { style: `background: ${value}` }));
    const meta = el("div", "sg-chip__meta");
    meta.appendChild(el("span", "sg-chip__name", name));
    meta.appendChild(el("span", "sg-chip__hex", hex(value)));
    chip.appendChild(meta);
    ramp.appendChild(chip);
  });

  /* ------------------------------------------------------- SEMANTIC ROLES
     `on` names the ground the role is approved against, so the measured
     ratio reflects real usage rather than a flattering default.          */

  const ROLES = [
    { name: "--text-strong",      on: "--bg-base-white", kind: "text" },
    { name: "--text-sub-strong",  on: "--bg-base-white", kind: "text" },
    { name: "--text-soft",        on: "--bg-base-white", kind: "text" },
    { name: "--text-soft",        on: "--bg-soft",       kind: "text" },
    { name: "--text-sub-soft",    on: "--fill-cta",      kind: "text", note: "Light-on-dark only." },
    { name: "--text-on-fill",     on: "--fill-cta",      kind: "text" },
    { name: "--highlight-strong", on: "--bg-base-white", kind: "text", note: "The text-safe amber." },
    { name: "--highlight-soft",   on: "--fill-cta",      kind: "text", note: "Fails on white — dark grounds only." },
    { name: "--success",          on: "--bg-base-white", kind: "text" },
    { name: "--warning",          on: "--bg-base-white", kind: "text" },
    { name: "--brand",            on: "--fill-cta",      kind: "large", note: "Large text and non-text only." },
    { name: "--border-strong",    on: "--bg-base-white", kind: "ui" },
    { name: "--border-sub-strong",on: "--bg-base-white", kind: "ui", note: "The boundary of every interactive control." },
    { name: "--border-soft",      on: "--bg-base-white", kind: "divider", note: "Dividers and non-interactive containers only. 1.4.11 exempts decorative separators — an interactive boundary uses --border-sub-strong." },
    { name: "--fill-cta",         on: "--bg-base-white", kind: "ui" },
    // A ground is judged by what sits on it, so this row measures the
    // foreground instead — the reverse of every row above.
    { name: "--fill-offer",       on: "--text-strong",   kind: "ground", note: "A ground, not a foreground." },
    { name: "--bg-soft",          on: "--text-strong",   kind: "ground" },
    { name: "--fill-green-soft",  on: "--success",       kind: "ground", note: "The offer panel's tint." },
  ];

  // 4.5:1 for body text · 3:1 for large text and non-text UI (1.4.11).
  // A `divider` is decorative and out of 1.4.11's scope, so it is reported
  // rather than graded — grading it would be a meaningless red mark.
  const grade = (ratio, kind) => {
    if (kind === "divider") return { cls: "sg-pill--large", label: "Decorative" };
    if (kind === "text" || kind === "ground") {
      if (ratio >= 7) return { cls: "sg-pill--pass", label: "AAA" };
      if (ratio >= 4.5) return { cls: "sg-pill--pass", label: "AA" };
      if (ratio >= 3) return { cls: "sg-pill--large", label: "AA Large" };
      return { cls: "sg-pill--fail", label: "Fail" };
    }
    if (ratio < 3) return { cls: "sg-pill--fail", label: "Fail" };
    return kind === "large"
      ? { cls: "sg-pill--large", label: "AA Large" }
      : { cls: "sg-pill--pass", label: "AA · non-text" };
  };

  const roles = document.getElementById("roles");
  ROLES.forEach(({ name, on, kind, note }) => {
    // For a `ground`, `on` names the foreground laid over it — the pair is
    // the other way round from every other kind.
    const isGround = kind === "ground";
    const fg = token(isGround ? on : name);
    const bg = token(isGround ? name : on);
    const ratio = contrast(fg, bg);
    const { cls, label } = grade(ratio, kind);

    const card = el("div", "sg-role");
    const sample = el("div", "sg-role__sample", kind === "ui" || kind === "divider" ? "" : "Aa");
    sample.style.background = bg;
    sample.style.color = fg;
    if (kind === "ui") sample.style.boxShadow = `inset 0 0 0 3px ${token(name)}`;
    if (kind === "divider") sample.style.borderBottom = `2px solid ${token(name)}`;
    card.appendChild(sample);

    const body = el("div", "sg-role__body");
    body.appendChild(el("span", "sg-role__name", name));
    body.appendChild(el("span", "sg-role__on", isGround ? `with ${on} on it` : `on ${on}`));
    const row = el("div", "sg-role__ratio");
    row.appendChild(el("span", "sg-role__value", `${ratio.toFixed(2)}:1`));
    row.appendChild(el("span", `sg-pill ${cls}`, label));
    body.appendChild(row);
    if (note) body.appendChild(el("span", "sg-role__note", note));
    card.appendChild(body);

    roles.appendChild(card);
  });

  /* ------------------------------------------------------------ TYPOGRAPHY
     Specs are read back from the applied class, not retyped — the page
     cannot claim a size the stylesheet doesn't actually set.             */

  const TYPE = [
    ["pf-display",         "Puffy/Display",              "Puffy Lux Mattress",              "Product name, sticky-bar title"],
    ["pf-heading-section", "Puffy/Heading/Section",      "Comfort, made consistent.",       "One per section, at most"],
    ["pf-heading-support", "Puffy/Heading/Support",      "Why eight layers matter",         "Sub-heads and panel titles"],
    ["pf-heading-row",     "Puffy/Heading/Row",          "Choose Your Size:",               "Buy-box row titles"],
    ["pf-price",           "Puffy/Price",                "$1,699",                          "Money, and only money"],
    ["pf-body-lg",         "Puffy/Body/Large",           "Cooling Cloud™ gel disperses heat so you sleep two degrees cooler.", "Intros and lede copy"],
    ["pf-body",            "Puffy/Body/Default",         "The page's baseline voice. Everything that isn't a heading, a label, or a price.", "Default body"],
    ["pf-body-benefit",    "Puffy/Body/Benefit desktop", "Medium-plush — the feel 8 in 10 sleepers pick",  "Benefit bullets"],
    ["pf-body-sm",         "Puffy/Body/Small",           "Free shipping and returns in the contiguous United States.", "Dense secondary copy"],
    ["pf-caption",         "Puffy/Label/Caption",        "Queen · 60\" × 80\" · 12\" profile", "Metadata and helper text"],
    ["pf-label",           "Puffy/Label/Inside",         "Limited offer",                   "Eyebrows and section markers"],
    ["pf-label-micro",     "Puffy/Label/Micro",          "Hybrid",                          "Badge interiors only"],
  ];

  const typelist = document.getElementById("typelist");
  TYPE.forEach(([cls, figmaName, sample, use]) => {
    const row = el("div", "sg-type");
    const specimen = el("p", `sg-type__sample ${cls}`, sample);
    row.appendChild(specimen);

    const meta = el("div", "sg-type__meta");
    meta.appendChild(el("span", "sg-type__class", `.${cls}`));
    meta.appendChild(el("span", "sg-type__figma", figmaName));
    meta.appendChild(el("span", "sg-type__specs", "—"));
    meta.appendChild(el("span", "sg-type__use", use));
    row.appendChild(meta);
    typelist.appendChild(row);

    // Read the computed values back off the live element.
    const s = getComputedStyle(specimen);
    const family = s.fontFamily.split(",")[0].replace(/["']/g, "");
    const tracking = parseFloat(s.letterSpacing);
    const specs = [
      family,
      `${parseFloat(s.fontSize)}/${parseFloat(s.lineHeight)}`,
      s.fontWeight,
      tracking ? `${tracking.toFixed(1)}px tracking` : null,
      s.textTransform === "uppercase" ? "uppercase" : null,
    ].filter(Boolean).join(" · ");
    meta.querySelector(".sg-type__specs").textContent = specs;
  });

  /* ---------------------------------------------------------------- SPACE */

  const SPACE = [0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96];
  const spaces = document.getElementById("spaces");
  SPACE.forEach((n) => {
    const row = el("div", "sg-space");
    row.appendChild(el("span", "sg-space__name", `--puffy-space-${n}`));
    const bar = el("span", "sg-space__bar");
    bar.style.width = `${n}px`;
    row.appendChild(bar);
    row.appendChild(el("span", "sg-chip__hex", `${n}px`));
    spaces.appendChild(row);
  });

  const RADII = ["0", "2", "4", "6", "8", "12", "pill"];
  const radii = document.getElementById("radii");
  RADII.forEach((n) => {
    const wrap = el("div", "sg-radius");
    const box = el("div", "sg-radius__box");
    box.style.borderRadius = token(`--puffy-radius-${n}`);
    wrap.appendChild(box);
    wrap.appendChild(el("span", "sg-radius__name", `radius-${n}`));
    radii.appendChild(wrap);
  });

  /* ---------------------------------------------------------------- ICONS */

  // `1` = the mark is single-colour light and only reads on a dark ground —
  // it came off the navy navbar, the See Inside panel, or the USP bar.
  // Those are shown on navy tiles; everything else on white.
  const ICONS = [
    ["Brand", [["logo", 1]]],
    ["Utility & commerce", [
      ["search", 1], ["cart", 1], ["close", 1], ["chevron-down"], ["chevron-down-beige", 1],
      ["play", 1], ["thumb-next", 1], ["layers", 1], ["check-circle", 1], ["info-dark"],
      ["info-amber"], ["tick-green"], ["star"], ["gift"], ["upgrade"],
    ]],
    ["Product benefits", [
      ["cooling-cloud"], ["back-support"], ["sleep-trial"], ["warranty"], ["delivery"],
      ["cooling", 1], ["cooling-cloud-white", 1], ["medium-plush", 1], ["plush-top", 1],
      ["firm-below", 1], ["eight-layers", 1], ["coils-white", 1], ["quilted", 1], ["tencel", 1],
      ["moisture-wicking", 1], ["height-12", 1], ["sleep-deeper", 1], ["wake-revitalized", 1],
      ["luxury-frame", 1], ["sleep-trial-white", 1], ["warranty-white", 1], ["free-shipping-white", 1],
    ]],
    ["USP bar · 56px", [["usp-sleep-trial", 1], ["usp-free-shipping", 1], ["usp-warranty", 1], ["usp-usa", 1]]],
    ["Credentials & awards", [
      ["product-of-the-year-2025"], ["badge-chiropractic"], ["badge-best-luxury-2026", 1], ["badge-healthline", 1],
    ]],
  ];

  const iconsRoot = document.getElementById("icons");
  let iconCount = 0;
  ICONS.forEach(([group, items]) => {
    const set = el("section", "sg-iconset");
    set.appendChild(el("h3", "pf-heading-support", group));
    const grid = el("div", "sg-icons__grid");
    items.forEach(([name, dark]) => {
      iconCount++;
      const card = el("figure", `sg-iconcard${dark ? " sg-iconcard--dark" : ""}`);
      const img = el("img");
      img.src = `../system/icons/${name}.svg`;
      img.alt = "";
      img.loading = "lazy";
      card.appendChild(img);
      card.appendChild(el("figcaption", "sg-iconcard__name", name));
      grid.appendChild(card);
    });
    set.appendChild(grid);
    iconsRoot.appendChild(set);
  });

  /* ------------------------------------------------------------ MASTHEAD
     Count what actually exists rather than hard-coding a number that
     quietly goes stale.                                                 */

  const countTokens = () => {
    const names = new Set();
    // puffy.css pulls the layers in with @import, so the token sheet is nested
    // one level down rather than sitting in document.styleSheets directly.
    const walk = (sheet) => {
      let rules;
      try { rules = sheet.cssRules; } catch { return; } // file:// blocks this
      if (!rules) return;
      for (const rule of rules) {
        if (rule.styleSheet) walk(rule.styleSheet);
        else if (rule.selectorText === ":root") {
          for (const prop of rule.style) if (prop.startsWith("--")) names.add(prop);
        }
      }
    };
    [...document.styleSheets].forEach(walk);
    return names.size;
  };

  const tokenCount = countTokens();
  document.getElementById("stat-tokens").textContent = tokenCount || "—";
  document.getElementById("stat-icons").textContent = String(iconCount).padStart(2, "0");

  /* -------------------------------------------------- SELECTOR behaviour
     A radiogroup is one tab stop; arrows move within it (APG pattern).  */

  const group = document.getElementById("size-group");
  if (group) {
    const radios = [...group.querySelectorAll('[role="radio"]')];
    const enabled = radios.filter((r) => r.getAttribute("aria-disabled") !== "true");

    const select = (radio) => {
      if (!radio || radio.getAttribute("aria-disabled") === "true") return;
      radios.forEach((r) => {
        const on = r === radio;
        r.setAttribute("aria-checked", String(on));
        r.classList.toggle("is-selected", on);
        r.tabIndex = on ? 0 : -1;
      });
      radio.focus();
    };

    group.addEventListener("click", (e) => select(e.target.closest('[role="radio"]')));
    group.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const i = enabled.indexOf(document.activeElement);
      select(enabled[(i + step + enabled.length) % enabled.length]);
    });
  }
})();
