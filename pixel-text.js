(function () {
  function fontReady(fontPx) {
    return !(document.fonts && document.fonts.check) || document.fonts.check(fontPx + 'px "Suisse Intl"');
  }

  function initOne(cv) {
    if (cv.__pixelInit) return;

    var text = cv.getAttribute("data-text") || "";
    var fontPx = parseFloat(cv.getAttribute("data-size")) || 15;
    var weight = cv.getAttribute("data-weight") || "400";
    var tracking = cv.getAttribute("data-tracking") || "0.15px";
    var color = cv.getAttribute("data-color") || "#111111";
    var maxBlock = parseFloat(cv.getAttribute("data-max")) || 5; // px (2x of the old 2.5)
    var altFont = cv.getAttribute("data-alt-font") || "";        // pixelated glyphs use this
    var baseFont = cv.getAttribute("data-font") || "Suisse Intl"; // crisp glyphs use this
    var fauxBold = parseFloat(cv.getAttribute("data-faux-bold")) || 0; // stroke width as fraction of fontPx
    var font = weight + " " + fontPx + 'px "' + baseFont + '", sans-serif';
    var altFontStr = altFont ? (fontPx + 'px "' + altFont + '"') : font;

    function baseReady() {
      return !(document.fonts && document.fonts.check) || document.fonts.check(fontPx + 'px "' + baseFont + '"');
    }

    // Draw a plain static label right away (generic sans-serif) so the button
    // is never blank while the web fonts are still loading.
    function drawFallback() {
      try {
        var wCss = parseFloat(cv.style.width) || cv.clientWidth || cv.width;
        var hCss = parseFloat(cv.style.height) || cv.clientHeight || cv.height;
        var scale = cv.width / wCss; // mirror buildBuffer()'s scale exactly
        var ctx = cv.getContext("2d");
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.clearRect(0, 0, wCss, hCss);
        ctx.font = weight + " " + fontPx + 'px "' + baseFont + '", "Helvetica Neue", Arial, sans-serif';
        try { ctx.letterSpacing = tracking; } catch (e) {}
        ctx.textBaseline = "middle";
        ctx.fillStyle = color;
        ctx.fillText(text, 0, hCss / 2);
        if (fauxBold > 0) {
          ctx.strokeStyle = color;
          ctx.lineWidth = fontPx * fauxBold;
          ctx.lineJoin = "round";
          ctx.strokeText(text, 0, hCss / 2);
        }
      } catch (e) {}
    }

    if (!baseReady()) {
      if (!cv.__fallbackDrawn) { cv.__fallbackDrawn = true; drawFallback(); }
      if (document.fonts && document.fonts.load) document.fonts.load(fontPx + 'px "' + baseFont + '"');
      return;
    }
    if (altFont && document.fonts && document.fonts.check && !document.fonts.check(fontPx + 'px "' + altFont + '"')) {
      if (!cv.__fallbackDrawn) { cv.__fallbackDrawn = true; drawFallback(); }
      if (document.fonts.load) document.fonts.load(fontPx + 'px "' + altFont + '"');
      return;
    }
    cv.__pixelInit = true;

    // segments as char-index ranges "0:4,4:9,10:13" (fallback: split on spaces)
    var segs = [];
    var segAttr = cv.getAttribute("data-segments");
    if (segAttr) {
      segAttr.split(",").forEach(function (r) {
        var a = r.split(":");
        segs.push({ s: parseInt(a[0], 10), e: parseInt(a[1], 10) });
      });
    } else {
      var idx = 0;
      text.split(/(\s+)/).forEach(function (w) {
        if (w.trim()) segs.push({ s: idx, e: idx + w.length });
        idx += w.length;
      });
    }

    var buf = document.createElement("canvas");
    var altBuf = document.createElement("canvas");
    var tmp = document.createElement("canvas");

    function cssW() { return parseFloat(cv.style.width) || cv.clientWidth || cv.width; }
    function cssH() { return parseFloat(cv.style.height) || cv.clientHeight || cv.height; }

    function measure(ctx, str) {
      ctx.font = font;
      try { ctx.letterSpacing = tracking; } catch (e) {}
      return ctx.measureText(str).width;
    }

    function buildBuffer() {
      var W = cv.width, H = cv.height;
      var scale = W / cssW();
      buf.width = W;
      buf.height = H;
      var bctx = buf.getContext("2d");
      bctx.setTransform(scale, 0, 0, scale, 0, 0);
      bctx.clearRect(0, 0, cssW(), cssH());
      bctx.font = font;
      try { bctx.letterSpacing = tracking; } catch (e) {}
      bctx.textBaseline = "middle";
      bctx.fillStyle = color;
      bctx.fillText(text, 0, cssH() / 2);
      // faux-bold: no bold font file, so thicken with a same-color stroke
      if (fauxBold > 0) {
        bctx.strokeStyle = color;
        bctx.lineJoin = "round";
        bctx.lineWidth = fontPx * fauxBold;
        bctx.strokeText(text, 0, cssH() / 2);
      }
      // cache css-space x boundaries per segment
      segs.forEach(function (sg) {
        sg.x0 = measure(bctx, text.slice(0, sg.s));
        sg.x1 = measure(bctx, text.slice(0, sg.e));
      });
      buildAltBuffer();
    }

    // Buffer of the pixelated (glitch) glyphs, rendered in the alt font,
    // each segment centered inside its Suisse slot so positions still line up.
    function buildAltBuffer() {
      var W = cv.width, H = cv.height;
      var scale = W / cssW();
      altBuf.width = W;
      altBuf.height = H;
      var actx = altBuf.getContext("2d");
      actx.setTransform(scale, 0, 0, scale, 0, 0);
      actx.clearRect(0, 0, cssW(), cssH());
      actx.font = altFontStr;
      actx.textBaseline = "middle";
      actx.fillStyle = color;
      segs.forEach(function (sg) {
        var s = text.slice(sg.s, sg.e);
        var slotW = sg.x1 - sg.x0;
        var w = actx.measureText(s).width;
        actx.fillText(s, sg.x0 + (slotW - w) / 2, cssH() / 2);
      });
    }

    buildBuffer();

    // per-segment glitch state
    var now = performance.now();
    segs.forEach(function (sg, k) {
      sg.active = false;
      sg.next = now + Math.random() * 700 + k * 120; // staggered kick-off
      sg.startT = 0; sg.endT = 0; sg.peak = 0;
      sg.jitter = 0;
    });

    // global cycle: a lively "active" window, then a calm "rest" window
    var gMode = "active";
    var gUntil = now + (2000 + Math.random() * 2000); // active 2–4s
    var gAmp = 1; // global intensity, eased toward 0 when resting
    var NOISE_STEP = 100; // ms → seed/flicker updates at ~10fps
    var lastNoiseT = 0;

    function kick(sg, t) {
      sg.active = true;
      sg.startT = t;
      sg.endT = t + (250 + Math.random() * 650);   // burst length
      sg.peak = Math.max(1, maxBlock * (0.15 + Math.random() * 0.85)); // 15%–100% of maxBlock
    }

    function drawSliceCrisp(ctx, sg, scale) {
      var sx = Math.floor(sg.x0 * scale);
      var sw = Math.ceil((sg.x1 - sg.x0) * scale) + 1;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buf, sx, 0, sw, cv.height, sx, 0, sw, cv.height);
    }

    function drawSlicePixel(ctx, sg, blockCss, scale, seed) {
      var H = cv.height;
      var src = altFont ? altBuf : buf;
      var sx = Math.floor(sg.x0 * scale);
      var sw = Math.ceil((sg.x1 - sg.x0) * scale) + 1;
      var block = Math.max(1, blockCss * scale);
      var dw = Math.max(1, Math.round(sw / block));
      var dh = Math.max(1, Math.round(H / block));
      tmp.width = dw;
      tmp.height = dh;
      var tctx = tmp.getContext("2d");
      tctx.imageSmoothingEnabled = true;
      tctx.clearRect(0, 0, dw, dh);
      // sample with a shifting sub-pixel origin -> the "seed" jitters the grid
      var ox = (seed % 1) * block;
      var oy = (((seed * 1.7) % 1)) * block;
      tctx.drawImage(src, sx - ox, -oy, sw + ox, H + oy, 0, 0, dw, dh);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(sx, 0, sw, H);
      ctx.drawImage(tmp, 0, 0, dw, dh, sx, 0, sw, H);
    }

    function frame(t) {
      if (!document.contains(cv)) { cv.__pixelInit = false; return; } // node gone
      if (buf.width !== cv.width || buf.height !== cv.height) buildBuffer();

      var W = cv.width, H = cv.height;
      var scale = W / cssW();
      var ctx = cv.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // advance global active/rest cycle
      if (t >= gUntil) {
        if (gMode === "active") {
          gMode = "rest";
          gUntil = t + (1000 + Math.random() * 4000); // rest 1–5s (no effect)
        } else {
          gMode = "active";
          gUntil = t + (2000 + Math.random() * 2000); // active 2–4s
          segs.forEach(function (sg) { sg.next = t + Math.random() * 400; });
        }
      }
      // ease the global intensity toward its target (slow settle when resting)
      var gTarget = gMode === "active" ? 1 : 0;
      gAmp += (gTarget - gAmp) * 0.055;

      // refresh the noise seed / flicker values at ~10fps (held steady between)
      if (t - lastNoiseT >= NOISE_STEP) {
        lastNoiseT = t;
        segs.forEach(function (sg) {
          sg.rNoise = 0.55 + Math.random() * 0.6;
          sg.rSeed = Math.random() * 3;
          sg.rDrop = Math.random();
        });
      }
      var qt = Math.floor(t / NOISE_STEP) * NOISE_STEP; // quantized time for the grid seed

      segs.forEach(function (sg) {
        if (gMode === "active" && !sg.active && t >= sg.next && Math.random() < 0.06) kick(sg, t);

        if (sg.active) {
          var p = (t - sg.startT) / (sg.endT - sg.startT);
          if (p >= 1) {
            sg.active = false;
            sg.next = t + (150 + Math.random() * 900);
            drawSliceCrisp(ctx, sg, scale);
            return;
          }
          // envelope: smooth ramp up & down; flicker/seed step at 10fps
          var env = Math.sin(Math.PI * p);
          var noise = sg.rNoise != null ? sg.rNoise : 1;
          var lvl = sg.peak * env * noise * gAmp;       // gAmp eases the whole effect out
          if (gMode === "active" && sg.rDrop < 0.12) lvl = 0; // occasional dropout (only while active)
          var seed = (qt * 0.013) + (sg.rSeed || 0);    // stepped seed
          if (lvl * scale < 1) drawSliceCrisp(ctx, sg, scale);
          else drawSlicePixel(ctx, sg, lvl, scale, seed);
        } else {
          drawSliceCrisp(ctx, sg, scale);
        }
      });

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function scan() {
    var list = document.querySelectorAll("canvas[data-pixel-text]");
    for (var i = 0; i < list.length; i++) initOne(list[i]);
  }

  function boot() {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scan);
    scan();
    setInterval(scan, 800);
  }

  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
