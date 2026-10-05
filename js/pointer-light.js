// Position and glow animate independently: input follows the latest mouse sample,
// while CSS preserves the measured bloom, expansion and press response.
(() => {
  const pointer = document.querySelector('.rr-pointer-light');
  if (!pointer) return;

  const root = document.documentElement;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const hoverSelector = 'a,button,[role="button"],summary,label,input,select,textarea,.btn,.button,.link,.nav-link,[onclick],[data-pointer-hover]';
  let frame = 0;
  let x = 0;
  let y = 0;
  let visible = false;
  let hoverTarget = null;

  const enabled = () => finePointer.matches && !reducedMotion.matches && !document.hidden;

  function hide() {
    cancelAnimationFrame(frame);
    frame = 0;
    visible = false;
    hoverTarget = null;
    pointer.classList.remove('is-visible', 'is-hover', 'is-pressed');
    root.classList.remove('has-rr-pointer-light');
  }

  function updateHover(target) {
    const next = target instanceof Element ? target.closest(hoverSelector) : null;
    if (next === hoverTarget) return;
    hoverTarget = next;
    pointer.classList.toggle('is-hover', !!next);
  }

  function render() {
    frame = 0;
    // The 92px light is centred on the latest sample; no layout properties or
    // position transition are touched, and no frames run while stationary.
    pointer.style.transform = `translate3d(${x - 46}px, ${y - 46}px, 0)`;
    if (!visible) {
      visible = true;
      pointer.classList.add('is-visible');
      root.classList.add('has-rr-pointer-light');
    }
  }

  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !enabled() || event.target instanceof HTMLIFrameElement) {
      hide();
      return;
    }
    x = event.clientX;
    y = event.clientY;
    if (!visible) updateHover(event.target);
    if (!frame) frame = requestAnimationFrame(render);
  }, { passive: true });

  document.addEventListener('pointerover', event => {
    // Embedded checkout fields handle their own pointer events and cursor.
    if (event.target instanceof HTMLIFrameElement) { hide(); return; }
    if (event.pointerType === 'mouse' && enabled()) updateHover(event.target);
  }, { passive: true });
  document.addEventListener('pointerout', event => {
    if (event.pointerType !== 'mouse') return;
    if (!event.relatedTarget) hide();
    else updateHover(event.relatedTarget);
  }, { passive: true });
  window.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse') hide();
    else if (visible) pointer.classList.add('is-pressed');
  }, { passive: true });
  window.addEventListener('pointerup', () => pointer.classList.remove('is-pressed'), { passive: true });
  document.addEventListener('pointerleave', hide, { passive: true });
  window.addEventListener('pointercancel', hide, { passive: true });
  window.addEventListener('blur', hide);
  window.addEventListener('pagehide', hide);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  document.addEventListener('keydown', event => { if (event.key === 'Tab') hide(); });
  finePointer.addEventListener('change', hide);
  reducedMotion.addEventListener('change', hide);
})();
