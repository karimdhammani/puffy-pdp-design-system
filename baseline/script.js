// Puffy Lux PDP — local study copy. Plain JS, no dependencies.

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------------------------------------------------------------------------
   Data (captured from the live page on 2026-09-11)
   ------------------------------------------------------------------------ */

const LAYERS = [
  { tag: 'Cover', name: 'Cool Quilted Cloud Cover', title: 'Instantly Cool to the Touch, All Night', desc: 'Pulls heat away up to 10x faster than standard fabric for refreshing sleep.', img: 'lux-01-cover.png', color: 'rgb(236, 234, 228)' },
  { tag: '0.5"', name: 'Comfort Quilt Fiber Layer', title: 'Pillow-Soft Feel With Built-In Protection', desc: 'Delivers heat-resistant protection without chemical odors or extra bulk.', img: 'lux-02-quilt.png', color: 'rgb(224, 216, 200)' },
  { tag: '0.5"', name: 'Plush Contouring Layer', title: 'Gentle, Adaptive Support', desc: 'Responsive foam recovers quickly, helping relieve pressure and prevent bottoming out.', img: 'lux-03-plush.png', color: 'rgb(168, 199, 224)' },
  { tag: '2"', name: 'Cooling Cloud™ Layer', title: 'Cool, Cradling Comfort', desc: 'Gel foam draws heat away and soothes pressure points, without sinking too deep.', img: 'lux-04-cooling-cloud.png', color: 'rgb(58, 75, 159)' },
  { tag: '2"', name: 'Cloud Comfort Foam', title: 'Balanced Support for Every Position', desc: 'Responsive foam distributes your weight more evenly, helping ease pressure.', img: 'lux-05-cloud-comfort.png', color: 'rgb(121, 179, 176)' },
  { tag: '6"', name: 'Contour-Adapt Coils', title: 'Undisturbed Sleep With Edge Support', desc: 'Pocketed coils absorb motion and boost airflow for responsive comfort.', img: 'lux-06-coils.png', color: 'rgb(201, 204, 210)' },
  { tag: '1"', name: 'Firm Core Support Foam', title: 'Quiet Stability, Night After Night', desc: 'Full-body support foam absorbs motion for undisturbed sleep.', img: 'lux-07-base.png', color: 'rgb(223, 224, 226)' },
  { tag: 'Base', name: 'Grip Base Cover', title: 'Steady Grip on Any Surface', desc: 'Stays put on every surface and frame, keeping out moisture, dust, and allergens.', img: 'lux-06-gripbase.png', color: 'rgb(51, 52, 63)' },
];

// price, total value, Royal "worth", Royal upgrade delta, bundle, Affirm /mo, shipping
const SIZES = {
  'Twin':             { price: '$749',   total: '$2,149', royal: '$1,089', upgrade: '+ $340',   bundle: ['$315', '2 Signature Pillows', '1 Signature Sleep Mask'], affirm: '$47',  ships: 'Ships in 1–2 days' },
  'Twin XL':          { price: '$1,099', total: '$2,449', royal: '$1,499', upgrade: '+ $400',   bundle: ['$315', '2 Signature Pillows', '1 Signature Sleep Mask'], affirm: '$69',  ships: 'Ships in 1–2 days' },
  'Full':             { price: '$1,349', total: '$2,699', royal: '$2,199', upgrade: '+ $850',   bundle: ['$390', '2 Signature Pillows', '2 Signature Sleep Masks'], affirm: '$85',  ships: 'Ships in 1–2 days' },
  'Queen':            { price: '$1,549', total: '$2,899', royal: '$2,449', upgrade: '+ $900',   bundle: ['$390', '2 Signature Pillows', '2 Signature Sleep Masks'], affirm: '$97',  ships: 'Ships in 1–2 days' },
  'King':             { price: '$1,749', total: '$3,099', royal: '$2,749', upgrade: '+ $1,000', bundle: ['$390', '2 Signature Pillows', '2 Signature Sleep Masks'], affirm: '$85',  ships: 'Ships in 1–2 days' },
  'Cal King':         { price: '$1,749', total: '$3,099', royal: '$2,749', upgrade: '+ $1,000', bundle: ['$390', '2 Signature Pillows', '2 Signature Sleep Masks'], affirm: '$85',  ships: 'Ships in 1–2 days' },
  'Split Head Queen': { price: '$1,949', total: '$3,299', royal: '$2,849', upgrade: '+ $900',   bundle: ['$390', '2 Signature Pillows', '2 Signature Sleep Masks'], affirm: '$95',  ships: 'Ships in 7 business days' },
  'Split Head King':  { price: '$2,249', total: '$3,599', royal: '$3,249', upgrade: '+ $1,000', bundle: ['$390', '2 Signature Pillows', '2 Signature Sleep Masks'], affirm: '$110', ships: 'Ships in 7 business days' },
  'Split King':       { price: '$2,198', total: '$3,548', royal: '$2,998', upgrade: '+ $800',   bundle: ['$630', '4 Signature Pillows', '2 Signature Sleep Masks'], affirm: '$107', ships: 'Ships in 1–2 days' },
};

/* ---------------------------------------------------------------------------
   Sale banner countdown (to local midnight, like the live site)
   ------------------------------------------------------------------------ */

function tickCountdown() {
  const now = new Date();
  const end = new Date(now); end.setHours(24, 0, 0, 0);
  let s = Math.max(0, Math.floor((end - now) / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0'); s %= 3600;
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  const digits = { h1: hh[0], h2: hh[1], m1: mm[0], m2: mm[1], s1: ss[0], s2: ss[1] };
  $$('[data-cd]').forEach(el => { el.textContent = digits[el.dataset.cd]; });
}
tickCountdown();
setInterval(tickCountdown, 1000);

/* ---------------------------------------------------------------------------
   Gallery carousel
   ------------------------------------------------------------------------ */

const slides = $$('.slide');
const thumbs = $$('.thumb');
const thumbsViewport = $('#thumbs-viewport');
const thumbPrev = $('#thumbs-prev');
const thumbNext = $('#thumbs-next');
const fadeTop = $('#thumbs-fade-top');
const fadeBottom = $('#thumbs-fade-bottom');
let current = 0;

function goTo(index) {
  index = Math.max(0, Math.min(slides.length - 1, index));
  if (index !== 0) closeSeeInside();
  current = index;

  slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
  thumbs.forEach((t, i) => {
    t.classList.toggle('is-active', i === index);
    t.toggleAttribute('aria-current', i === index);
  });

  const atStart = index === 0;
  const atEnd = index === slides.length - 1;
  thumbPrev.classList.toggle('is-hidden', atStart);
  fadeTop.classList.toggle('is-hidden', atStart);
  thumbNext.classList.toggle('is-hidden', atEnd);
  fadeBottom.classList.toggle('is-hidden', atEnd);

  // Keep the active thumbnail clear of the fades/arrows
  const t = thumbs[index];
  const pad = t.offsetHeight;
  const top = thumbsViewport.scrollTop;
  const bottom = top + thumbsViewport.clientHeight;
  if (t.offsetTop < top + (atStart ? 0 : pad)) {
    thumbsViewport.scrollTop = t.offsetTop - (atStart ? 0 : pad);
  } else if (t.offsetTop + t.offsetHeight > bottom - (atEnd ? 0 : pad)) {
    thumbsViewport.scrollTop = t.offsetTop + t.offsetHeight - thumbsViewport.clientHeight + (atEnd ? 0 : pad);
  }

  $$('video', $('#carousel')).forEach(v => {
    if (v.closest('.slide') === slides[index]) v.play().catch(() => {});
    else v.pause();
  });
}

thumbs.forEach(t => t.addEventListener('click', () => goTo(Number(t.dataset.slide))));
thumbPrev.addEventListener('click', () => goTo(current - 1));
thumbNext.addEventListener('click', () => goTo(current + 1));

// Drag / swipe on the main image
const carousel = $('#carousel');
let dragStartX = null;
carousel.addEventListener('pointerdown', e => {
  if (si.classList.contains('is-open')) return;
  dragStartX = e.clientX;
});
window.addEventListener('pointerup', e => {
  if (dragStartX === null) return;
  const dx = e.clientX - dragStartX;
  dragStartX = null;
  if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1));
});

/* ---------------------------------------------------------------------------
   Hero stage — follows the object-fit: cover box of the first image so the
   "See What's Inside" pill and the award sit on the mattress at any size.
   ------------------------------------------------------------------------ */

const heroImg = $('#hero-img');
const heroStage = $('#hero-stage');

function layoutHeroStage() {
  const box = heroImg.parentElement;
  const cw = box.clientWidth, ch = box.clientHeight;
  const iw = heroImg.naturalWidth || 2000, ih = heroImg.naturalHeight || 1853;
  const scale = Math.max(cw / iw, ch / ih);
  const w = iw * scale, h = ih * scale;
  Object.assign(heroStage.style, {
    left: `${(cw - w) / 2}px`,
    top: `${box.offsetTop + (ch - h) / 2}px`,
    width: `${w}px`,
    height: `${h}px`,
  });
}
heroImg.complete ? layoutHeroStage() : heroImg.addEventListener('load', layoutHeroStage);
new ResizeObserver(layoutHeroStage).observe(heroImg.parentElement);

/* ---------------------------------------------------------------------------
   "See What's Inside" layer breakdown
   ------------------------------------------------------------------------ */

const si = $('#see-inside');
const siStack = $('#si-stack');
const siGlow = $('#si-glow');
const siTabs = $('#si-tabs');
const seeInsideBtn = $('#see-inside-btn');
let activeLayer = 0;

LAYERS.forEach((layer, i) => {
  const k = i - (LAYERS.length - 1) / 2; // -3.5 … 3.5

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'si-layer';
  btn.style.setProperty('--k', k);
  btn.style.zIndex = 50 - i;
  btn.setAttribute('aria-label', `${layer.name}, ${layer.tag}`);
  btn.innerHTML = `<img src="assets/layers/${layer.img}" alt="">`;
  btn.addEventListener('click', () => setLayer(i));
  siStack.appendChild(btn);

  const tab = document.createElement('button');
  tab.type = 'button';
  tab.className = 'si-tab';
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-label', layer.name);
  tab.innerHTML = `<span class="si-dot" style="background:${layer.color}"></span><span class="si-tab-label">${layer.name}</span>`;
  tab.addEventListener('click', () => setLayer(i));
  siTabs.appendChild(tab);
});

function setLayer(i) {
  activeLayer = (i + LAYERS.length) % LAYERS.length;
  const layer = LAYERS[activeLayer];

  $$('.si-layer', siStack).forEach((el, n) => el.classList.toggle('is-active', n === activeLayer));
  $$('.si-tab', siTabs).forEach((el, n) => {
    el.classList.toggle('is-active', n === activeLayer);
    el.setAttribute('aria-selected', n === activeLayer);
  });
  siGlow.style.setProperty('--k', activeLayer - (LAYERS.length - 1) / 2);

  $('#si-tag').textContent = layer.tag;
  $('#si-count').textContent = `Layer ${activeLayer + 1} of ${LAYERS.length}`;
  $('#si-name').textContent = layer.name;
  $('#si-title').textContent = layer.title;
  $('#si-desc').textContent = layer.desc;
}

function openSeeInside() {
  setLayer(0);
  si.classList.add('is-open');
  si.setAttribute('aria-hidden', 'false');
  seeInsideBtn.classList.add('is-hidden-soft');
  // Let the stacked state paint first, then explode the layers
  requestAnimationFrame(() => requestAnimationFrame(() => si.classList.add('is-expanded')));
  $('#si-close').focus({ preventScroll: true });
}

function closeSeeInside() {
  if (!si.classList.contains('is-open')) return;
  si.classList.add('no-anim');
  si.classList.remove('is-open', 'is-expanded');
  si.setAttribute('aria-hidden', 'true');
  seeInsideBtn.classList.remove('is-hidden-soft');
  void si.offsetWidth; // flush so the reset happens without transition
  si.classList.remove('no-anim');
}

setLayer(0);
seeInsideBtn.addEventListener('click', openSeeInside);
$('#si-close').addEventListener('click', closeSeeInside);

document.addEventListener('keydown', e => {
  if (si.classList.contains('is-open')) {
    if (e.key === 'Escape') closeSeeInside();
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); setLayer(activeLayer + 1); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); setLayer(activeLayer - 1); }
    return;
  }
  if (e.target.closest && e.target.closest('input, textarea')) return;
  if (e.key === 'ArrowRight') goTo(current + 1);
  if (e.key === 'ArrowLeft') goTo(current - 1);
});

/* ---------------------------------------------------------------------------
   Size selector → buy box
   ------------------------------------------------------------------------ */

$$('.size-btn').forEach(btn => btn.addEventListener('click', () => {
  $$('.size-btn').forEach(b => b.classList.toggle('is-selected', b === btn));
  const d = SIZES[btn.dataset.size];
  $('#price').textContent = d.price;
  $('#total-value').textContent = d.total;
  $('#royal-worth').textContent = d.royal;
  $('#upgrade-price').textContent = d.upgrade;
  $('#bundle-worth').textContent = `Worth ${d.bundle[0]}`;
  $('#bundle-detail').innerHTML = `<span class="ib">${d.bundle[1]}</span> + <span class="ib">${d.bundle[2]}</span>`;
  $('#affirm-price').textContent = d.affirm;
  $('#ships-in').textContent = d.ships;
  $('#sticky-price').textContent = `| ${d.price}`;
}));

/* ---------------------------------------------------------------------------
   Sticky add-to-cart bar
   ------------------------------------------------------------------------ */

// Live behaviour: appears once the end of the top fold scrolls up past ~700px
const stickyBar = $('#sticky-atc');
const topFold = $('#pdp-top-fold');
const updateSticky = () => stickyBar.classList.toggle('is-visible', topFold.getBoundingClientRect().bottom < 700);
window.addEventListener('scroll', updateSticky, { passive: true });
updateSticky();

goTo(0);
