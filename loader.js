(function () {
  // Clean loading overlay: solid white screen with a counter that rises to 100%.
  // (Pixelate reveal removed — SVG filters were unreliable on Safari/WebKit.)
  // Completes on page load + fonts ready; a hard cap guarantees it never hangs.

  var HARD_MS = 8000; // absolute ceiling — loader always clears by now

  // ---- Full-screen white overlay with centered % ----
  var el = document.createElement("div");
  el.setAttribute("style",
    "position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;" +
    "background:#ffffff;transition:opacity 0.5s ease;pointer-events:none;font-family:'Suisse Intl',sans-serif;");
  el.innerHTML =
    '<div style="font-size:15px;letter-spacing:0.01em;color:#111111;text-transform:uppercase;-webkit-font-smoothing:antialiased;background:transparent;padding:6px 13px;"><span>0</span>%</div>';

  function run() {
    var num = el.querySelector("span");
    var loaded = (document.readyState === "complete");
    if (!loaded) window.addEventListener("load", function () { loaded = true; });
    var fontsDone = !(document.fonts && document.fonts.ready);
    if (!fontsDone) document.fonts.ready.then(function () { fontsDone = true; });

    var t0 = performance.now();
    var p = 0, done = false;

    function finish() {
      if (done) return;
      done = true;
      num.textContent = "100";
      el.style.opacity = "0";
      setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 500);
    }

    function tick() {
      var timedOut = (performance.now() - t0) >= HARD_MS;
      var ready = (loaded && fontsDone) || timedOut;
      // creep toward 90% while loading; rush to 100% once ready
      p += ready ? (1 - p) * 0.22 : (0.9 - p) * 0.04;
      if (p > 1) p = 1;
      num.textContent = Math.round(p * 100);
      if (ready && p >= 0.999) { finish(); return; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function boot() {
    document.body.appendChild(el);
    run();
  }

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
