/* ==========================================================================
   PUFFY · LUX HYBRID PDP — ABOVE THE FOLD

   Three pieces of state, no framework:
     · size    — drives price, total value, monthly, dimensions, room fit,
                 the ship line and the dialog's confirm label
     · slide   — the gallery
     · reveal  — the in-place x-ray over the hero

   The markup is the source of truth for the size data; this file reads it
   off the cards so the page still says the right thing with JS switched off.
   ========================================================================== */

(function () {
  "use strict";

  /* Room-fit guidance. Copy, not data — it has no home in the markup. */
  var FIT = {
    "twin":       "Fits a room 7′ × 10′ or larger · one sleeper",
    "twin-xl":    "Fits a room 7′ × 10′ or larger · one taller sleeper",
    "full":       "Fits a room 10′ × 10′ or larger · one sleeper with room to spread",
    "queen":      "Fits a room 10′ × 10′ or larger · two sleepers",
    "king":       "Fits a room 12′ × 12′ or larger · two sleepers, plus a child or pet",
    "cal-king":   "Fits a room 12′ × 12′ or larger · two taller sleepers",
    "split-king": "Fits a room 12′ × 12′ or larger · two adjustable bases side by side",
    "shq":        "Fits a room 10′ × 10′ or larger · one adjustable head section",
    "shk":        "Fits a room 12′ × 12′ or larger · two adjustable head sections"
  };

  /* Queen $1,549 + $1,350 = the $2,899 total value the live page advertises:
     the free Royal upgrade plus the pillow-and-mask bundle. */
  var VALUE_ADD = 1350;

  /* One divisor for every size, so the monthly figure rises with the price.
     The live page shows $97/mo at Queen $1,549 and $85/mo at King $1,749
     because the term changes underneath without saying so. */
  var AFFIRM_TERM = 16;

  var $ = function (id) { return document.getElementById(id); };
  var money = function (n) { return "$" + n.toLocaleString("en-US"); };

  var live      = $("pf-live");
  var announce  = function (msg) { if (live) { live.textContent = msg; } };

  /* ---------------------------------------------------------------- Size */

  var cards = Array.prototype.slice.call(document.querySelectorAll(".pf-size-card"));

  var readCard = function (card) {
    return {
      el:      card,
      value:   card.dataset.size,
      price:   Number(card.dataset.price),
      split:   card.hasAttribute("data-split"),
      blocked: card.hasAttribute("data-blocked"),
      label:   card.querySelector(".pf-size-card__name").textContent.trim(),
      dims:    card.style.getPropertyValue("--w").trim() + '" × ' +
               card.style.getPropertyValue("--l").trim() + '"'
    };
  };

  var sizes = cards.map(readCard);
  var size  = sizes.filter(function (s) { return s.el.getAttribute("aria-checked") === "true"; })[0] || sizes[3];

  function paintSize() {
    $("pf-price").textContent     = money(size.price);
    $("pf-value").textContent     = money(size.price + VALUE_ADD);
    $("pf-monthly").textContent   = money(Math.round(size.price / AFFIRM_TERM));
    $("pf-size-name").textContent = size.label;
    $("pf-size-dims").textContent = size.dims;
    $("pf-fit").textContent       = FIT[size.value] || "";
    $("pf-ship").textContent      = size.split
      ? "Made to order · free white-glove delivery & returns"
      : "Ships in 1–2 days · free delivery & returns";
    $("pf-sizes-confirm-label").textContent = "Keep " + size.label;

    sizes.forEach(function (s) {
      s.el.setAttribute("aria-checked", String(s === size));
      s.el.tabIndex = s === size ? 0 : -1;
    });
  }

  function pick(next) {
    if (!next || next.blocked || next === size) { return; }
    size = next;
    paintSize();
    announce(size.label + ", " + money(size.price) + ". " + FIT[size.value]);
  }

  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      var s = sizes.filter(function (x) { return x.el === card; })[0];
      if (s.blocked) { announce(s.label + " is unavailable. " + card.querySelector(".pf-size-card__status").textContent.trim()); return; }
      pick(s);
    });
  });

  /* Arrow keys walk the radiogroup, skipping what can't be chosen. */
  $("pf-sizes-grid").addEventListener("keydown", function (e) {
    var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys)) { return; }
    e.preventDefault();
    var open = sizes.filter(function (s) { return !s.blocked; });
    var at = open.indexOf(size);
    var next = open[(at + keys[e.key] + open.length) % open.length];
    pick(next);
    next.el.focus();
  });

  /* -------------------------------------------------------------- Dialog */

  var dialog = $("pf-sizes");

  $("pf-size-open").addEventListener("click", function () {
    dialog.showModal();
    var checked = document.querySelector('.pf-size-card[aria-checked="true"]');
    if (checked) { checked.focus(); }
  });

  [$("pf-sizes-close"), $("pf-sizes-cancel"), $("pf-sizes-confirm")].forEach(function (btn) {
    btn.addEventListener("click", function () { dialog.close(); });
  });

  dialog.addEventListener("close", function () { $("pf-size-open").focus(); });

  /* Clicking the backdrop is the same as Cancel. */
  dialog.addEventListener("click", function (e) {
    if (e.target === dialog) { dialog.close(); }
  });

  /* ------------------------------------------------------------- Gallery */

  var thumbs = Array.prototype.slice.call(document.querySelectorAll(".pf-thumb"));
  var hero   = $("pf-hero");
  var xray   = $("pf-xray");
  var slide  = 0;

  function paintSlide() {
    var t = thumbs[slide];
    hero.src = t.dataset.src;
    hero.alt = t.dataset.alt;
    xray.src = t.dataset.xray || t.dataset.src;
    thumbs.forEach(function (el, i) {
      el.classList.toggle("is-current", i === slide);
      el.setAttribute("aria-current", String(i === slide));
    });
  }

  function goTo(i) {
    slide = (i + thumbs.length) % thumbs.length;
    setReveal(false);
    paintSlide();
  }

  thumbs.forEach(function (el, i) {
    el.addEventListener("click", function () { goTo(i); });
  });
  $("pf-prev").addEventListener("click", function () { goTo(slide - 1); });
  $("pf-next").addEventListener("click", function () { goTo(slide + 1); });

  /* -------------------------------------------------------------- Reveal */

  var media   = $("pf-media");
  var reveal  = $("pf-reveal");
  var handle  = $("pf-handle");
  var revealBtn   = $("pf-reveal-btn");
  var revealIcon  = $("pf-reveal-icon");
  var revealLabel = $("pf-reveal-label");
  var pos = 52;
  var dragging = false;
  var on = false;

  function apply(p) {
    pos = Math.max(3, Math.min(97, p));
    media.style.setProperty("--pos", pos.toFixed(2) + "%");
    handle.setAttribute("aria-valuenow", String(Math.round(pos)));
    handle.setAttribute("aria-valuetext", Math.round(pos) + "% revealed");
  }

  function setReveal(next) {
    on = next;
    media.classList.toggle("is-revealing", on);
    reveal.hidden = !on;
    revealBtn.setAttribute("aria-expanded", String(on));
    revealIcon.src = on ? "../system/icons/close-ink.svg" : "../system/icons/layers-ink.svg";
    revealLabel.textContent = on ? "Close the x-ray view" : "See what's inside";
    if (on) { apply(pos); }
  }

  revealBtn.addEventListener("click", function () {
    /* Only the bedroom frame has a cutaway behind it, so turning the reveal
       on returns to it rather than comparing a photograph with itself. */
    if (!on && slide !== 0) { slide = 0; paintSlide(); }
    setReveal(!on);
    if (on) { handle.focus(); }
  });

  function at(e) {
    var r = media.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  }

  media.addEventListener("pointerdown", function (e) {
    if (!on) { return; }
    dragging = true;
    apply(at(e));
    if (media.setPointerCapture) { media.setPointerCapture(e.pointerId); }
  });
  media.addEventListener("pointermove", function (e) { if (dragging && on) { apply(at(e)); } });
  media.addEventListener("pointerup", function () { dragging = false; });
  media.addEventListener("pointercancel", function () { dragging = false; });

  handle.addEventListener("keydown", function (e) {
    var step = e.shiftKey ? 10 : 3;
    if (e.key === "ArrowLeft")  { e.preventDefault(); apply(pos - step); }
    if (e.key === "ArrowRight") { e.preventDefault(); apply(pos + step); }
    if (e.key === "Home")       { e.preventDefault(); apply(3); }
    if (e.key === "End")        { e.preventDefault(); apply(97); }
  });

  /* ---------------------------------------------------------------- Cart */

  var add = $("pf-add");
  var ctaLabel = $("pf-cta-label");
  var addTimer;

  function addToCart() {
    ctaLabel.textContent = "Added to cart";
    announce(size.label + " Lux Hybrid added to cart, " + money(size.price));
    clearTimeout(addTimer);
    addTimer = setTimeout(function () { ctaLabel.textContent = "Add to Cart"; }, 2000);
  }

  add.addEventListener("click", addToCart);
  $("pf-offer").addEventListener("click", addToCart);

  /* --------------------------------------------------------------- Start */

  paintSize();
  paintSlide();
  setReveal(false);
})();
