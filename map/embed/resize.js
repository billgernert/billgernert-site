(() => {
  "use strict";
  const frame = window.frameElement;
  if (!frame?.matches("iframe[data-map-frame]")) return;
  const host = frame.closest(".map-frame-shell");
  const shell = document.querySelector(".map-shell");
  if (!host || !shell) return;

  const compact = window.matchMedia("(max-width: 960px)");
  const originalHeight = host.style.height;
  const originalPadding = host.style.paddingTop;
  let pending = false;

  function resize() {
    pending = false;
    if (!compact.matches) {
      host.style.height = originalHeight;
      host.style.paddingTop = originalPadding;
      return;
    }
    // The map keeps its own canvas height. Wrapped details and breadcrumbs
    // enlarge the iframe instead of taking space away from the canvas.
    const style = window.parent.getComputedStyle(frame);
    const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    host.style.height = `${Math.ceil(shell.getBoundingClientRect().height + border)}px`;
    host.style.paddingTop = "0px";
  }

  function scheduleResize() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(resize);
  }

  new ResizeObserver(scheduleResize).observe(shell);
  compact.addEventListener("change", scheduleResize);
  window.addEventListener("resize", scheduleResize);
  scheduleResize();
})();
