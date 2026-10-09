(() => {
  'use strict';
  const root = document.documentElement;
  const surface = document.getElementById('mc-arrival-surface');
  const word = document.querySelector('.hero-mark-word');
  const origin = document.querySelector('.hero-slogan');
  const skip = document.getElementById('mc-arrival-skip');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const GRACE = 180, ILLUMINATION = 1300, DISSOLVE = 750;
  let started = false, ready = false, illuminated = false, released = false;
  let animations = [];
  const timers = [];
  const later = (fn, delay) => { const id = setTimeout(fn, delay); timers.push(id); return id; };

  function finish() {
    if (released) return;
    released = true;
    timers.forEach(clearTimeout);
    animations.forEach(animation => animation.cancel());
    animations = [];
    root.classList.remove('mc-arrival-pending', 'mc-arrival-active');
    root.classList.add('mc-arrival-managed');
    if (surface) surface.remove();
    if (skip) skip.remove();
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('focusin', onFocus);
    document.removeEventListener('visibilitychange', onVisibility);
    reduced.removeEventListener('change', onMotion);
    window.removeEventListener('pageshow', onPageShow);
    clearTimeout(window.mcArrivalFallback);
  }

  function releaseIfReady() {
    if (released || !ready || !illuminated) return;
    if (!started || reduced.matches || !surface.animate) { finish(); return; }
    // Keep the mask at its final state while the surface alone dissolves.
    if (root.dataset.mcArrival === 'revealing') return;
    root.dataset.mcArrival = 'revealing';
    const fade = surface.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: DISSOLVE, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards',
    });
    animations.push(fade);
    fade.finished.then(finish, finish);
    later(finish, DISSOLVE + 100);
  }

  function start() {
    if (released) return;
    if (ready || reduced.matches || !word || !surface || !word.animate) { finish(); return; }
    started = true;
    root.classList.remove('mc-arrival-pending');
    root.classList.add('mc-arrival-managed', 'mc-arrival-active');
    root.dataset.mcArrival = 'illuminating';
    const options = { duration: ILLUMINATION, easing: 'cubic-bezier(.3,.15,.65,1)', fill: 'both' };
    const mask = CSS.supports('mask-image', 'linear-gradient(black, transparent)');
    const light = word.animate(mask ? [
      { maskPosition: '63.5% 50%, 36.5% 50%', webkitMaskPosition: '63.5% 50%, 36.5% 50%' },
      { maskPosition: '34.5% 50%, 65.5% 50%', webkitMaskPosition: '34.5% 50%, 65.5% 50%' },
    ] : [{ opacity: .12 }, { opacity: 1 }], options);
    animations.push(light);
    if (origin) {
      const subtitle = origin.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 585, delay: 650, easing: 'ease-in-out', fill: 'both',
      });
      subtitle.finished.catch(() => {});
      animations.push(subtitle);
    }
    light.finished.then(() => {
      illuminated = true;
      root.dataset.mcArrival = 'illuminated';
      releaseIfReady();
    }, finish);
    // Fails safe even if animation completion is not delivered.
    later(() => { illuminated = true; releaseIfReady(); }, ILLUMINATION + 100);
  }

  function onKey(event) { if (event.key === 'Escape' || event.key === 'Tab') finish(); }
  function onFocus(event) { if (event.target !== skip) finish(); }
  function onVisibility() { if (document.hidden) finish(); }
  function onMotion() { if (reduced.matches) finish(); }
  function onPageShow(event) { if (event.persisted) finish(); }
  document.addEventListener('keydown', onKey);
  document.addEventListener('focusin', onFocus);
  document.addEventListener('visibilitychange', onVisibility);
  reduced.addEventListener('change', onMotion);
  window.addEventListener('pageshow', onPageShow);
  if (skip) skip.addEventListener('click', finish);
  later(() => { if (!released && skip) skip.hidden = false; }, 4000);
  later(finish, 8000);

  // Only critical hero imagery and the wordmark font participate in readiness.
  const heroReady = new Promise(resolve => {
    const image = new Image();
    const done = () => {
      image.onload = image.onerror = null;
      if (image.naturalWidth && image.decode) image.decode().then(resolve, resolve);
      else resolve();
    };
    image.onload = image.onerror = done;
    image.src = 'images/hero-home.webp';
    if (image.complete) done();
  });
  const fontReady = document.fonts && document.fonts.load
    ? document.fonts.load('400 32px Cinzel', 'Moscatelli').catch(() => {})
    : Promise.resolve();
  Promise.all([heroReady, fontReady]).then(() => {
    if (released) return;
    ready = true;
    if (!started) { finish(); return; }
    releaseIfReady();
  });
  // Start after the fast-load grace window; do not expose a replacement font mid-reveal.
  Promise.all([fontReady, new Promise(resolve => later(resolve, GRACE))]).then(start).catch(finish);
})();
