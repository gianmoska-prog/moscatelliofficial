(() => {
  'use strict';
  const pointer = document.querySelector('.mc-circle');
  if (!pointer) return;
  const root = document.documentElement;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const interactive = 'a,button,[role="button"],summary,label,input[type="radio"],input[type="checkbox"],[data-pointer-hover]';
  const native = 'iframe,textarea,select,input:not([type="radio"]):not([type="checkbox"]):not([type="button"]):not([type="submit"]),[contenteditable="true"]';
  let frame = 0, x = 0, y = 0, target = null;
  function hide() {
    cancelAnimationFrame(frame);
    frame = 0;
    pointer.classList.remove('is-visible', 'is-hover', 'is-pressed');
    root.classList.remove('has-rr-pointer-light');
  }
  function update(element) {
    target = element instanceof Element ? element : null;
    if (!fine.matches || reduced.matches || document.hidden || !target || target.closest(native)) {
      hide();
      return false;
    }
    pointer.classList.toggle('is-hover', !!target.closest(interactive));
    return true;
  }
  function render() {
    frame = 0;
    pointer.style.transform = `translate3d(${x - 32}px, ${y - 32}px, 0)`;
    pointer.classList.add('is-visible');
    root.classList.add('has-rr-pointer-light');
  }
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') { hide(); return; }
    x = event.clientX;
    y = event.clientY;
    if (update(event.target) && !frame) frame = requestAnimationFrame(render);
  }, { passive: true });
  document.addEventListener('pointerover', event => {
    if (event.pointerType === 'mouse') update(event.target);
  }, { passive: true });
  document.addEventListener('pointerout', event => {
    if (event.pointerType !== 'mouse') return;
    if (!event.relatedTarget) hide();
    else update(event.relatedTarget);
  }, { passive: true });
  window.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && update(event.target) && pointer.classList.contains('is-visible')) pointer.classList.add('is-pressed');
    else hide();
  }, { passive: true });
  window.addEventListener('pointerup', () => pointer.classList.remove('is-pressed'), { passive: true });
  window.addEventListener('pointercancel', hide);
  window.addEventListener('blur', hide);
  window.addEventListener('pagehide', hide);
  document.addEventListener('pointerleave', hide);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  document.addEventListener('keydown', event => { if (event.key === 'Tab') hide(); });
  fine.addEventListener('change', hide);
  reduced.addEventListener('change', hide);
})();
