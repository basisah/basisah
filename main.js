(function () {
  "use strict";
  // project links: paste each repo or live site here
  const PROJECT_LINKS = {
    ccfrauddetect: "https://github.com/basisah/CCfraudDetect",
    studentbankassist: "https://github.com/basisah/StudentBankAssist",
    ingrid: "https://github.com/basisah/InGrid",
    netwatch: "https://github.com/basisah/netwatch"
  };
  document.querySelectorAll("a[data-link]").forEach(a => { const u = PROJECT_LINKS[a.dataset.link]; if (u) a.href = u; });
  const INK = "#0d0d0d", PAPER = "#fbf8f8", CHALK = "#f7f2f2", TIE = "#c3141f";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const smooth = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
  const lerp = (a, b, k) => a + (b - a) * k;

  // ---------- seeded randomness ----------
  let seed = 20261005;
  function rand() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }

  // ---------- Polychromos-style pencil painting ----------
  function paintFill(ctx, W, H, base, edgeColor, edgeAmt, sides = "tblr") {
    ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
    const dark = base === INK;
    const n = Math.floor(W * H / 22);
    for (let i = 0; i < n; i++) {
      const x = rand() * W, y = rand() * H, horiz = rand() < 0.5;
      ctx.fillStyle = rand() < 0.55 ? (dark ? "rgba(20,0,6,0.07)" : "rgba(69,8,24,0.025)") : (dark ? "rgba(255,225,232,0.035)" : "rgba(255,255,255,0.4)");
      if (horiz) ctx.fillRect(x, y, 2 + rand() * 5, 1); else ctx.fillRect(x, y, 1, 2 + rand() * 5);
    }
    if (dark) {
      const s = Math.floor(W * H * 0.0009);
      for (let i = 0; i < s; i++) { ctx.fillStyle = hexA(CHALK, 0.25 + rand() * 0.5); ctx.fillRect(rand() * W, rand() * H, 1, 1); }
    }
    if (edgeAmt > 0) {
      const depth = Math.max(3, Math.min(W, H) * 0.06) * edgeAmt;
      const all = { t: [W, (t, d) => [t, d]], b: [W, (t, d) => [t, H - d]], l: [H, (t, d) => [d, t]], r: [H, (t, d) => [W - d, t]] };
      for (const k of sides) {
        const [len, map] = all[k];
        const cnt = Math.floor(len * 2.2 * edgeAmt * 4);
        for (let i = 0; i < cnt; i++) {
          const d = -Math.log(1 - rand() * 0.999) * depth * 0.35;
          const [x, y] = map(rand() * len, d);
          ctx.fillStyle = hexA(edgeColor, 0.25 + rand() * 0.55);
          ctx.fillRect(x, y, 1.2, 1.2);
        }
      }
    }
  }
  function densify(pts, step) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let k = 0; k < n; k++) out.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function pencil(ctx, pts, width, color, taperEnds = true) {
    const P = densify(pts, 0.9);
    ctx.fillStyle = color;
    const phase = rand() * 10;
    for (let i = 0; i < P.length; i++) {
      const a = P[Math.max(0, i - 3)], b = P[Math.min(P.length - 1, i + 3)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L;
      const nx = -ty, ny = tx;
      const t = P.length > 1 ? i / (P.length - 1) : 0.5;
      const taper = taperEnds ? Math.min(1, Math.min(t, 1 - t) * 7 + 0.3) : 1;
      const hw = width * 0.5 * taper * (0.85 + 0.15 * Math.sin(i * 0.045 + phase));
      const count = Math.ceil(hw * 1.9) + 1;
      for (let k = 0; k < count; k++) {
        const o = rand() * 2 - 1, d = Math.abs(o);
        const keep = d < 0.45 ? 0.96 : (1 - d) * 1.7;
        if (rand() > keep) continue;
        ctx.globalAlpha = 0.5 + rand() * 0.5;
        ctx.fillRect(P[i][0] + nx * o * hw + (rand() - 0.5), P[i][1] + ny * o * hw + (rand() - 0.5), 1.4, 1.4);
      }
    }
    ctx.globalAlpha = 1;
  }
  function polyFill(ctx, pts, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath(); ctx.fill();
  }
  function arc(cx, cy, rx, ry, a0, a1, n = 40) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }
  function quad(p0, p1, p2, n = 30) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
  function star(cx, cy, r) { const o = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; o.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return o; }

  // ---------- page decorations drawn with the same brush ----------
  (function () {
    const set = (name, c) => document.documentElement.style.setProperty(name, `url(${c.toDataURL()})`);
    let c = document.createElement("canvas"); c.width = 1400; c.height = 12;
    pencil(c.getContext("2d"), quad([4, 7], [700, 4.5], [1396, 6.5], 120), 2.6, hexA(CHALK, 0.85)); set("--pencil-rule", c);
    c = document.createElement("canvas"); c.width = 300; c.height = 10;
    pencil(c.getContext("2d"), quad([6, 6], [150, 3], [294, 5], 50), 3, CHALK); set("--pencil-under", c);
    // curtain hem: a wavy gathered edge with a grainy shadow
    c = document.createElement("canvas"); c.width = 52; c.height = 1400; let x = c.getContext("2d");
    for (let i = 0; i < 9000; i++) { const yy = rand() * 1400, d = -Math.log(1 - rand() * 0.99) * 7; x.fillStyle = hexA("#000000", 0.08 + rand() * 0.18); x.fillRect(26 + d, yy, 1.4, 1.4); }
    const hem = []; for (let yy = 0; yy <= 1400; yy += 10) hem.push([24 + Math.sin(yy / 90) * 5 + Math.sin(yy / 23) * 1.2, yy]);
    pencil(x, hem, 3.4, hexA(CHALK, 0.9), false); set("--pencil-edge", c);
    // fabric folds that appear while she pulls
    c = document.createElement("canvas"); c.width = 260; c.height = 1400; x = c.getContext("2d");
    for (const fx of [60, 150, 215]) { const p = []; for (let yy = 0; yy <= 1400; yy += 20) p.push([fx + Math.sin(yy / 140 + fx) * 6, yy]); pencil(x, p, 1.6, hexA("#000000", 0.35), false); }
    set("--pencil-folds", c);

    // red velvet, generated: soft pile grain, crushed sheen, and (for the curtain) deep vertical folds
    function velvet(w, h, base, folds, sheen) {
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      const g = cv.getContext("2d"), img = g.createImageData(w, h), d = img.data;
      // wrapping value noise for the crushed look
      const GN = 32, grid = []; for (let i = 0; i < GN * GN; i++) grid.push(rand());
      const vn = (u, v, P) => {
        const x0 = ((Math.floor(u) % P) + P) % P, y0 = ((Math.floor(v) % P) + P) % P, x1 = (x0 + 1) % P, y1 = (y0 + 1) % P;
        const fx = u - Math.floor(u), fy = v - Math.floor(v), sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const a = grid[y0 * GN + x0], b = grid[y0 * GN + x1], c2 = grid[y1 * GN + x0], e = grid[y1 * GN + x1];
        return (a + (b - a) * sx) * (1 - sy) + (c2 + (e - c2) * sx) * sy;
      };
      const fbm = (u, v) => (vn(u * 4, v * 4, 4) + 0.5 * vn(u * 8, v * 8, 8) + 0.25 * vn(u * 16, v * 16, 16)) / 1.75 - 0.5;
      const TAU2 = Math.PI * 2;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const u = x / w, v = y / h;
          let f = 0;
          if (folds) f = 0.55 * Math.sin(u * TAU2 * 3 + Math.sin(v * 3) * 0.25) + 0.3 * Math.sin(u * TAU2 * 7 + 1.3) + 0.15 * Math.sin(u * TAU2 * 13 + 0.4);
          const crush = fbm(u, v);
          let lum = 0.73 + folds * 0.3 * f + crush * (folds ? 0.18 : 0.55);
          const shine = folds ? Math.pow(Math.max(0, f), 3) * sheen : Math.pow(Math.max(0, crush * 2.2), 2) * sheen;
          lum *= 0.94 + (rand() - 0.5) * 0.16; // velvet pile
          const i = (y * w + x) * 4;
          d[i] = Math.min(255, base[0] * lum + shine * 120);
          d[i + 1] = Math.min(255, base[1] * lum + shine * 26);
          d[i + 2] = Math.min(255, base[2] * lum + shine * 36);
          d[i + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
      // folds darken toward the bottom like a hanging curtain
      if (folds) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(0,0,0,0.18)"); gr.addColorStop(0.25, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,0.28)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
      return cv;
    }
    set("--velvet-curtain", velvet(640, 900, [168, 16, 34], 1, 0.55));
    set("--velvet-work", velvet(640, 640, [128, 12, 28], 0, 0.35));
    set("--velvet-about", velvet(640, 640, [108, 10, 24], 0, 0.3));
  })();

  // ---------- scroll timeline, in viewport heights ----------
  // A: she pulls the curtain off (projects)   B: she pushes a board across (about)   C: she brings a stool, sits, bows
  const T = { aEnd: 1.6, bStart: 2.1, bEnd: 3.7, cStart: 3.8 }; // page ends at 3.9: the last screen doesn't scroll
  const scrolly = document.querySelector(".scrolly");
  const curtain = document.getElementById("curtain"), folds = document.getElementById("folds");
  const revealWrap = document.getElementById("revealWrap"), hint = document.getElementById("hint");
  let S = 0, stageW = 1;
  function readScroll() { S = Math.max(0, -scrolly.getBoundingClientRect().top / window.innerHeight); return S; }
  const seg = (a, b) => clamp01((S - a) / (b - a));
  const TURN_END = 0.1;
  const walkProgress = p => clamp01((p - 0.06) / 0.94);
  function applyCurtain(pA) {
    const travel = walkProgress(pA) * (stageW + 40);
    curtain.style.transform = `translate3d(${-travel}px,0,0)`;
    folds.style.opacity = (Math.min(1, walkProgress(pA) * 3) * 0.7).toFixed(3);
    hint.style.opacity = (1 - clamp01(pA * 10)).toFixed(3);
    return travel;
  }
  function applyReveal(px) { revealWrap.style.transform = `translate3d(${Math.min(0, px)}px,0,0)`; }

  // nav links glide through the same scroll so the curtain and the push play out
  let glide = null;
  const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
  function targetFor(id) {
    if (id === "work") return 1.85 * window.innerHeight;
    if (id === "about" || id === "contact") return maxScroll();
    return 0;
  }
  function glideTo(y) {
    const from = window.scrollY, dist = y - from;
    if (Math.abs(dist) < 2) return;
    const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!motionOK) { window.scrollTo(0, y); return; }
    const dur = Math.max(700, Math.min(3800, Math.abs(dist) / window.innerHeight * 1100));
    const start = performance.now(), id = {};
    glide = id;
    const step = now => {
      if (glide !== id) return;
      const k = Math.min(1, (now - start) / dur), e = 0.5 - Math.cos(Math.PI * k) / 2;
      window.scrollTo(0, from + dist * e);
      if (k < 1) requestAnimationFrame(step); else glide = null;
    };
    requestAnimationFrame(step);
  }
  for (const ev of ["wheel", "touchstart", "keydown"]) window.addEventListener(ev, () => { glide = null; }, { passive: true });
  document.querySelectorAll('header a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    e.preventDefault(); glideTo(targetFor(a.getAttribute("href").slice(1)));
  }));

  // ---------- renderer ----------
  const canvas = document.getElementById("scene");
  const sticky = document.getElementById("sticky");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    if (!renderer.getContext()) throw new Error("no gl");
  } catch (e) {
    document.documentElement.classList.add("no-webgl");
    const tick = () => { stageW = sticky.clientWidth; readScroll(); applyCurtain(seg(0, T.aEnd)); applyReveal(-seg(T.bStart, T.bEnd) * (stageW + 60)); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0xffffff, 0);

  // soft cel shading (anime/vtuber feel) on top of the pencil textures
  const gradMap = new THREE.DataTexture(new Uint8Array([168, 168, 168, 255, 212, 212, 212, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  gradMap.minFilter = gradMap.magFilter = THREE.NearestFilter; gradMap.needsUpdate = true;

  const PPU = 210;
  function texFromCanvas(c) { const t = new THREE.CanvasTexture(c); t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; }
  function faceMat(wu, hu, base, painter, opts = {}) {
    const edge = opts.edge ?? 1, sides = opts.sides ?? "tblr";
    const W = Math.max(16, Math.min(720, Math.round(wu * PPU))), H = Math.max(16, Math.min(640, Math.round(hu * PPU)));
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    paintFill(ctx, W, H, base, base === INK ? CHALK : INK, edge * (base === INK ? 0.55 : 1), sides);
    if (painter) {
      const P = pts => pts.map(([x, y]) => [x * W, y * H]);
      painter({
        W, H, ctx, quad, aspect: W / H,
        line: (pts, wu2, col = CHALK, taper) => pencil(ctx, P(pts), wu2 * PPU, col, taper),
        fill: (pts, col) => polyFill(ctx, P(pts), col),
        grainFill: (pts, col) => { polyFill(ctx, P(pts), col); pencil(ctx, P([...pts, pts[0]]), 0.018 * PPU, col, false); },
        arc, star
      });
    }
    const m = new THREE.MeshToonMaterial({ map: texFromCanvas(c), gradientMap: gradMap });
    if (opts.double) m.side = THREE.DoubleSide;
    return m;
  }
  const inkMat = faceMat(1.2, 1.2, INK, null, { edge: 0.55 });
  const paperMat = faceMat(0.6, 0.6, PAPER, null, { edge: 1 });
  const inkPlain = faceMat(1.2, 1.2, INK, null, { edge: 0 });
  const paperPlain = faceMat(0.6, 0.6, PAPER, null, { edge: 0.4 });

  function box(w, h, d, base = INK, painters = {}, edge = 1) {
    const g = new THREE.BoxGeometry(w, h, d);
    const dims = { px: [d, h], nx: [d, h], py: [w, d], ny: [w, d], pz: [w, h], nz: [w, h] };
    const mats = ["px", "nx", "py", "ny", "pz", "nz"].map(k => {
      if (painters[k] || painters.all || edge !== 1) return faceMat(dims[k][0], dims[k][1], base, painters[k] || painters.all, { edge });
      return base === INK ? inkMat : paperMat;
    });
    return new THREE.Mesh(g, mats);
  }

  // smooth rounded body parts: lathe from a radius profile sampled evenly in height,
  // so canvas y maps straight to height and canvas x = 0.5 is the front centre.
  function profile(keys) {
    return y => {
      for (let i = 0; i < keys.length - 1; i++) {
        const [y0, r0] = keys[i], [y1, r1] = keys[i + 1];
        if (y <= y1) { const s = smooth((y - y0) / (y1 - y0 || 1)); return r0 + (r1 - r0) * s; }
      }
      return keys[keys.length - 1][1];
    };
  }
  function lathe(keys, opts = {}) {
    const H = keys[keys.length - 1][0], f = profile(keys), N = opts.samples || 30;
    const pts = []; let rMax = 0;
    for (let i = 0; i <= N; i++) { const y = H * i / N, r = Math.max(0.0005, f(y)); rMax = Math.max(rMax, r); pts.push(new THREE.Vector2(r, y)); }
    const g = new THREE.LatheGeometry(pts, opts.seg || 44, Math.PI, Math.PI * 2);
    const sz = opts.scaleZ ?? 1;
    const circ = Math.PI * rMax * (1 + sz);
    const m = new THREE.Mesh(g, faceMat(circ, H, opts.base || INK, opts.painter, { edge: opts.edge ?? 0.8, sides: opts.sides ?? "tb", double: true }));
    m.scale.z = sz;
    return m;
  }
  const sphere = (r, mat) => new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  const LOOK_Y = 3.25;
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 0.36); key.position.set(-3, 5, 8); scene.add(key);
  const back = new THREE.DirectionalLight(0xffffff, 0.22); back.position.set(3, 4, -8); scene.add(back);
  const spotWarm = new THREE.DirectionalLight(0xff7a45, 0.22); spotWarm.position.set(0, 6, 6); scene.add(spotWarm); // warm spill from the stage spotlight

  const root = new THREE.Group(); scene.add(root);   // stage space: props live here
  const char = new THREE.Group(); root.add(char);    // her position and facing
  const body = new THREE.Group(); char.add(body);

  // pencil ground shadow
  let shadowMesh;
  (function () {
    const c = document.createElement("canvas"); c.width = 512; c.height = 256; const ctx = c.getContext("2d");
    for (let i = 0; i < 9000; i++) {
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand());
      ctx.fillStyle = hexA(INK, (1 - r) * 0.22 * rand()); ctx.fillRect(256 + Math.cos(a) * r * 240, 128 + Math.sin(a) * r * 110, 2, 1.4);
    }
    shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ map: texFromCanvas(c), transparent: true, depthWrite: false }));
    shadowMesh.rotation.x = -Math.PI / 2; shadowMesh.position.y = 0.005; root.add(shadowMesh);
  })();

  // ---------- legs: flared trousers on hip pivots, platform shoes ----------
  const hips = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.23, 2.82, 0); body.add(hip);
    const outer = s > 0 ? 0.75 : 0.25;
    const leg = lathe([[0, 0.31], [0.55, 0.255], [1.25, 0.215], [1.95, 0.235], [2.42, 0.27], [2.56, 0.18], [2.6, 0.0]], {
      scaleZ: 0.92,
      painter: f => {
        f.line(f.quad([0.5, 0.06], [0.51, 0.5], [0.5, 0.97]), 0.04);
        f.line(f.quad([outer, 0.12], [outer + 0.01 * s, 0.5], [outer, 0.93]), 0.03);
        f.line(f.quad([0.02, 0.12], [0.015, 0.5], [0.02, 0.9]), 0.028);
        f.line([[0, 0.985], [1, 0.985]], 0.03, CHALK, false);
      }
    });
    leg.position.y = -2.44; hip.add(leg);
    const sole = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.2, 28), inkMat);
    sole.scale.z = 1.75; sole.position.set(0, -2.72, 0.1); hip.add(sole);
    const toe = sphere(0.165, paperMat); toe.scale.set(1, 0.62, 1.45); toe.position.set(0, -2.55, 0.16); hip.add(toe);
    hips.push(hip);
  }
  const pelvis = lathe([[0, 0.5], [0.3, 0.5], [0.42, 0.0]], { scaleZ: 0.62, edge: 0 }); pelvis.position.y = 2.62; body.add(pelvis);

  // ---------- jacket: cinched waist, soft chest and shoulders ----------
  const torso = lathe([[0, 0.6], [0.12, 0.56], [0.45, 0.45], [0.62, 0.45], [0.95, 0.53], [1.22, 0.56], [1.42, 0.53], [1.58, 0.38], [1.68, 0.17], [1.72, 0.0]], {
    scaleZ: 0.64, samples: 36, seg: 56,
    painter: f => {
      // shirt V and the gap under the button
      f.fill([[0.43, 0.02], [0.57, 0.02], [0.5, 0.43]], PAPER);
      f.fill([[0.497, 0.47], [0.503, 0.47], [0.512, 0.94], [0.488, 0.94]], PAPER);
      // tie
      f.fill([[0.491, 0.05], [0.509, 0.05], [0.514, 0.29], [0.5, 0.35], [0.486, 0.29]], TIE);
      f.line([[0.491, 0.05], [0.509, 0.05], [0.514, 0.29], [0.5, 0.35], [0.486, 0.29], [0.491, 0.05]], 0.008, "#8a0a12", false);
      f.line([[0.488, 0.08], [0.512, 0.08]], 0.012, "#8a0a12");
      // lapels with notches
      const lap = [[0.428, 0.03], [0.418, 0.2], [0.44, 0.245], [0.432, 0.28], [0.5, 0.45]];
      f.line(lap, 0.04); f.line(lap.map(([x, y]) => [1 - x, y]), 0.04);
      // front edges, hem, waist darts, pockets
      f.line(f.quad([0.5, 0.45], [0.5, 0.75], [0.486, 0.95]), 0.035);
      f.line(f.quad([0.5, 0.45], [0.505, 0.75], [0.514, 0.95]), 0.035);
      f.line([[0, 0.955], [1, 0.955]], 0.04, CHALK, false);
      for (const dx of [-1, 1]) {
        f.line(f.quad([0.5 + dx * 0.085, 0.42], [0.5 + dx * 0.075, 0.62], [0.5 + dx * 0.085, 0.82]), 0.018);
        f.line([[0.5 + dx * 0.055, 0.79], [0.5 + dx * 0.115, 0.785]], 0.025);
        f.line([[0.5 + dx * 0.25, 0.3], [0.5 + dx * 0.25, 0.9]], 0.022);
      }
      // back: collar line and centre seam (seam sits at x = 0 / 1)
      f.line(f.quad([0.94, 0.06], [1.0, 0.04], [1.06 - 1, 0.06].map((v, i) => i ? v : 0.999)), 0.0001);
      f.line([[0.008, 0.25], [0.008, 0.94]], 0.025);
      f.line([[0.992, 0.25], [0.992, 0.94]], 0.025);
    }
  });
  torso.position.y = 2.62; body.add(torso);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.32, 18), paperPlain);
  neck.position.set(0, 4.36, 0); body.add(neck);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 8, 24), paperPlain);
  collar.rotation.x = Math.PI / 2; collar.scale.y = 0.8; collar.position.set(0, 4.27, 0.01); body.add(collar);

  // ---------- arms: tapered sleeves with a little bell at the cuff ----------
  function makeArm(side) {
    const shoulder = new THREE.Group(); shoulder.position.set(side * 0.62, 4.0, 0); body.add(shoulder);
    const cap = sphere(0.165, inkPlain); cap.scale.set(1, 0.9, 1); shoulder.add(cap);
    const upper = lathe([[0, 0.12], [0.1, 0.135], [0.6, 0.145], [0.84, 0.16], [0.86, 0.0]], {
      edge: 0, painter: f => f.line(f.quad([0.5, 0.2], [0.53, 0.1], [0.5, 0.03]), 0.025)
    });
    upper.position.y = -0.84; shoulder.add(upper);
    const elbow = new THREE.Group(); elbow.position.y = -0.8; shoulder.add(elbow);
    elbow.add(sphere(0.125, inkPlain));
    const fore = lathe([[0, 0.175], [0.12, 0.16], [0.4, 0.135], [0.78, 0.125], [0.8, 0.0]], {
      sides: "b", painter: f => { f.line([[0, 0.93], [1, 0.93]], 0.035, CHALK, false); }
    });
    fore.position.y = -0.8; elbow.add(fore);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.12, 0.07, 18), paperPlain); cuff.position.y = -0.83; elbow.add(cuff);
    const hand = sphere(0.1, paperMat); hand.scale.set(1.05, 1.5, 0.72); hand.position.set(0, -0.98, 0); elbow.add(hand);
    const thumb = sphere(0.042, paperMat); thumb.scale.set(1, 1.5, 1); thumb.position.set(-side * 0.075, -0.92, 0.045); elbow.add(thumb);
    const grip = new THREE.Object3D(); grip.position.y = -1.04; elbow.add(grip);
    return { shoulder, elbow, grip };
  }
  const armL = makeArm(1), armR = makeArm(-1);

  // ---------- head (unchanged look: face, glasses, hair, hat) ----------
  const headPivot = new THREE.Group(); headPivot.position.set(0, 4.46, 0); body.add(headPivot);
  const GX = 0.2, GY = 0.5, faceH = 1.06, headCY = 0.53;
  const head = box(1.0, faceH, 0.95, INK, {
    pz: f => {
      paintFill(f.ctx, f.W, f.H, PAPER, INK, 0);
      const gy = 0.5 - (GY - headCY) / faceH;
      for (const gx of [0.5 - GX, 0.5 + GX]) f.line(f.arc(gx, gy, 0.165, 0.165 * f.aspect, 0, Math.PI * 2, 70), 0.04, INK, false);
      f.line(f.quad([0.5 - GX + 0.165, gy], [0.5, gy - 0.05], [0.5 + GX - 0.165, gy]), 0.03, INK);
      f.line([[0.5 - GX - 0.165, gy - 0.01], [0.02, gy - 0.04]], 0.025, INK);
      f.line([[0.5 + GX + 0.165, gy - 0.01], [0.98, gy - 0.04]], 0.025, INK);
      f.line(f.arc(0.55, 0.73, 0.075, 0.05, 0.2, Math.PI - 0.25, 24), 0.03, INK);
      f.line(f.arc(0.2, 0.7, 0.04, 0.02, 0, Math.PI * 2, 20), 0.012, "#d9a3aa");
      f.line(f.arc(0.8, 0.7, 0.04, 0.02, 0, Math.PI * 2, 20), 0.012, "#d9a3aa");
    }
  });
  head.position.y = headCY; headPivot.add(head);

  const pupils = [];
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const sx of [-1, 1]) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CircleGeometry(0.085, 28), pupilMat));
    const glint = new THREE.Mesh(new THREE.CircleGeometry(0.026, 14), glintMat); glint.position.set(0.028, 0.03, 0.002); g.add(glint);
    g.userData.base = new THREE.Vector3(sx * GX, GY, 0.481);
    g.position.copy(g.userData.base); headPivot.add(g); pupils.push(g);
  }

  const hairTop = box(1.08, 0.12, 1.0, INK); hairTop.position.set(0, 1.0, -0.02); headPivot.add(hairTop);
  const bangs = box(1.04, 0.24, 0.07, INK); bangs.position.set(0, 0.92, 0.49); headPivot.add(bangs);
  for (const s of [-1, 1]) { const sd = box(0.14, 1.08, 1.02, INK); sd.position.set(s * 0.57, 0.49, -0.06); headPivot.add(sd); }
  const hairBackUp = box(1.22, 0.85, 0.22, INK); hairBackUp.position.set(0, 0.62, -0.58); headPivot.add(hairBackUp);
  // long hair down her back: a curved sheet so it drapes instead of being a block
  const hairLowPivot = new THREE.Group(); hairLowPivot.position.copy(headPivot.position); body.add(hairLowPivot);
  const hairGeo = new THREE.CylinderGeometry(0.62, 0.5, 1.5, 28, 6, true, Math.PI * 2 / 3, Math.PI * 2 / 3);
  const hp = hairGeo.attributes.position;
  for (let i = 0; i < hp.count; i++) { const y = hp.getY(i); if (y < -0.6) { const x = hp.getX(i); hp.setY(i, y + Math.abs(Math.sin(x * 9)) * 0.08); } }
  hairGeo.computeVertexNormals();
  const hairLow = new THREE.Mesh(hairGeo, faceMat(1.3, 1.5, INK, f => {
    f.line(f.quad([0.35, 0.05], [0.33, 0.5], [0.36, 0.9]), 0.012, "#3a3a3a");
    f.line(f.quad([0.66, 0.1], [0.68, 0.5], [0.64, 0.92]), 0.012, "#3a3a3a");
  }, { edge: 0.8, sides: "b", double: true }));
  hairLow.position.set(0, -0.45, -0.12); hairLowPivot.add(hairLow);

  const hatSlot = new THREE.Object3D(); hatSlot.position.set(0, 1.04, -0.02); headPivot.add(hatSlot);
  const hat = new THREE.Group(); body.add(hat);
  (function () {
    const R = 1.0;
    const brimGeo = new THREE.CylinderGeometry(R, R, 0.06, 64, 1);
    const pos = brimGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, pos.getY(i) + Math.pow(Math.abs(x) / R, 3) * 0.42 - Math.pow(Math.max(0, z) / R, 2) * 0.06);
    }
    brimGeo.computeVertexNormals();
    const brimTop = faceMat(2, 2, INK, f => {
      f.line(f.arc(0.5, 0.5, 0.42, 0.42, -1.05, 1.05, 60), 0.05);
      f.line(f.arc(0.5, 0.5, 0.26, 0.26, -0.9, 0.9, 40), 0.03);
    }, { edge: 0.3, double: true });
    const brim = new THREE.Mesh(brimGeo, [inkMat, brimTop, inkMat]);
    brim.scale.set(1.18, 1, 0.92); hat.add(brim);
    const crownGeo = new THREE.CylinderGeometry(0.43, 0.53, 0.62, 48, 1, false, Math.PI, Math.PI * 2);
    const cp = crownGeo.attributes.position;
    for (let i = 0; i < cp.count; i++) { if (cp.getY(i) > 0) { const x = cp.getX(i); cp.setY(i, cp.getY(i) - (1 - Math.abs(x) / 0.43) * 0.07 + Math.abs(x) * 0.08); } }
    crownGeo.computeVertexNormals();
    const crownSide = faceMat(3.1, 0.62, INK, f => {
      f.line([[0, 0.66], [1, 0.66]], 0.02, "#3a3a3a", false);
      f.grainFill(f.star(0.5 * f.W, 0.42 * f.H, 0.14 * f.H).map(([x, y]) => [x / f.W, y / f.H]), CHALK);
      for (const dx of [-0.055, 0.055]) f.grainFill(f.star((0.5 + dx) * f.W, 0.47 * f.H, 0.07 * f.H).map(([x, y]) => [x / f.W, y / f.H]), CHALK);
    }, { edge: 0.4 });
    const crownTop = faceMat(1, 1, INK, f => f.line(f.quad([0.5, 0.15], [0.62, 0.5], [0.5, 0.85]), 0.04), { edge: 0.3 });
    const crown = new THREE.Mesh(crownGeo, [crownSide, crownTop, inkMat]);
    crown.scale.z = 0.86; crown.position.y = 0.33; hat.add(crown);
  })();

  // ---------- lasso for the cowboy emote ----------
  const lasso = new THREE.Group(); body.add(lasso); lasso.visible = false;
  const lassoSpin = new THREE.Group(); lasso.add(lassoSpin);
  const ropeMat = new THREE.MeshBasicMaterial({ color: 0x2b2b2b });
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.022, 6, 56), ropeMat);
  loop.rotation.x = Math.PI / 2; loop.position.x = 0.48; lassoSpin.add(loop);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6), ropeMat);
  tail.position.set(0.04, -0.25, 0); tail.rotation.z = 0.2; lasso.add(tail);

  const REACH = 1.45; // how far ahead of her body her hands are when pushing

  // ---------- the bar stool ----------
  const stoolPivot = new THREE.Group(); root.add(stoolPivot); stoolPivot.visible = false;
  const stool = new THREE.Group(); stool.position.x = -0.45; stoolPivot.add(stool);
  (function () {
    const SH = 2.24;
    const seatTop = faceMat(0.9, 0.9, INK, f => { f.line(f.arc(0.5, 0.5, 0.38, 0.38, 0, Math.PI * 2, 60), 0.03, CHALK, false); }, { edge: 0 });
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.42, 0.12, 32), [faceMat(2.8, 0.12, INK, null, { edge: 0.6 }), seatTop, inkMat]);
    seat.position.y = SH; stool.add(seat);
    const up = new THREE.Vector3(0, 1, 0);
    function rod(a, b, r, mat) {
      const d = new THREE.Vector3().subVectors(b, a), L = d.length();
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 10), mat);
      m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(up, d.normalize()); stool.add(m);
    }
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; rod(new THREE.Vector3(Math.cos(a) * 0.28, SH - 0.05, Math.sin(a) * 0.28), new THREE.Vector3(Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45), 0.035, inkPlain); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.026, 6, 44), new THREE.MeshBasicMaterial({ color: 0xf1e4e8 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.8; stool.add(ring);
    const ringIn = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.016, 6, 44), inkPlain);
    ringIn.rotation.x = Math.PI / 2; ringIn.position.y = 0.76; stool.add(ringIn);
  })();

  // where the hat sits when she holds it to her chest
  const hatHold = new THREE.Object3D(); hatHold.position.set(0.02, -1.12, 0.05); hatHold.rotation.set(Math.PI - 0.35, 0, 0); armR.elbow.add(hatHold);

  // ---------- sizing ----------
  let worldPerPx = 0.01;
  function resize() {
    const w = sticky.clientWidth, h = sticky.clientHeight;
    stageW = w;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vFov = 28 * Math.PI / 180;
    const distV = 7.6 / 2 / Math.tan(vFov / 2);
    const distW = 5.0 / 2 / (Math.tan(vFov / 2) * camera.aspect);
    const dist = Math.max(distV, distW) * 1.08;
    camera.position.set(0, LOOK_Y + 0.35, dist);
    camera.lookAt(0, LOOK_Y, 0);
    camera.updateProjectionMatrix();
    worldPerPx = 2 * dist * Math.tan(vFov / 2) / h;
  }
  new ResizeObserver(resize).observe(sticky); resize();

  // ---------- pointer ----------
  const ndc = new THREE.Vector2(0, 0.15);
  let pointerSeen = false;
  const ray = new THREE.Raycaster();
  function setNdc(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ndc.x = Math.max(-3, Math.min(3, ndc.x)); ndc.y = Math.max(-3, Math.min(3, ndc.y));
    pointerSeen = true;
  }
  const hitsHer = (cx, cy) => { setNdc(cx, cy); ray.setFromCamera(ndc, camera); return ray.intersectObject(char, true).length > 0; };
  window.addEventListener("pointermove", e => setNdc(e.clientX, e.clientY), { passive: true });

  let userRot = 0, dragging = false, lastX = 0, downX = 0, downY = 0, vel = 0, turnTarget = null;
  canvas.addEventListener("pointerdown", e => {
    if (S > 0.05) return;
    dragging = true; lastX = downX = e.clientX; downY = e.clientY; vel = 0; turnTarget = null;
    canvas.setPointerCapture(e.pointerId); canvas.classList.add("dragging");
  });
  canvas.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    userRot += dx * 0.011; vel = dx * 0.011;
  });
  canvas.addEventListener("pointerup", e => {
    if (!dragging) return; dragging = false; canvas.classList.remove("dragging");
    if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6 && hitsHer(e.clientX, e.clientY)) play(emote === "wave" ? "yeehaw" : "wave", true);
  });
  canvas.addEventListener("pointercancel", () => { dragging = false; canvas.classList.remove("dragging"); });
  // once she's seated in About, clicking her gets another bow
  sticky.addEventListener("click", e => {
    if (S >= T.cStart && bowStart !== null && hitsHer(e.clientX, e.clientY)) bowStart = clock.getElapsedTime() - 0.4 * BOW_DUR;
  });
  const TAU = Math.PI * 2;
  canvas.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    if (k === "arrowleft") { turnTarget = (turnTarget ?? userRot) - Math.PI / 4; vel = 0; e.preventDefault(); }
    else if (k === "arrowright") { turnTarget = (turnTarget ?? userRot) + Math.PI / 4; vel = 0; e.preventDefault(); }
    else if (k === "w" || k === "enter") { play("wave", true); e.preventDefault(); }
    else if (k === "y") { play("yeehaw", true); e.preventDefault(); }
  });

  // ---------- emotes ----------
  const clock = new THREE.Clock();
  const DUR = { wave: 2.6, yeehaw: 3.8 }, BOW_DUR = 3.6;
  let emote = null, emoteStart = 0, hopT = -1, nextIdle = 0.8, idleIdx = 0, bowStart = null, cStartT = null;
  // going back up from About: she stands, walks off left, then drags the work page back in from the left
  let prevPhase = "A", bMode = "push", exitStart = null, qShown = 0, walkDrag = 0;
  const EXIT_DUR = 2.6;
  function play(name, hop) {
    if (S > 0.05) return;
    emote = name; emoteStart = clock.getElapsedTime();
    if (hop) hopT = emoteStart;
    nextIdle = emoteStart + DUR[name] + 5;
  }
  let waveE = 0, lassoE = 0, hatOffS = 0;

  // arm pose keyframes for the seated bow: [shoulderX, shoulderZ, elbowX, elbowZ]
  const R_REST = [-0.35, -0.12, -0.55, 0], R_REACH = [0.35, -2.5, 0, -1.0], R_FLOURISH = [0.3, -1.7, 0, -0.15], R_CHEST = [-0.45, -0.05, -1.45, 0.75];
  const BOW_KEYS = [[0, R_REST], [0.2, R_REACH], [0.42, R_FLOURISH], [0.62, R_CHEST], [1, R_CHEST]];
  function bowPose(k) {
    for (let i = 0; i < BOW_KEYS.length - 1; i++) {
      const [k0, a] = BOW_KEYS[i], [k1, b] = BOW_KEYS[i + 1];
      if (k <= k1) { const s = smooth((k - k0) / (k1 - k0)); return a.map((v, j) => lerp(v, b[j], s)); }
    }
    return R_CHEST;
  }

  // ---------- animation ----------
  let yawS = 0, pitchS = 0, eyeX = 0, eyeY = 0, blinkAt = 2.5;
  const tmp = new THREE.Vector3(), headW = new THREE.Vector3(), plane = new THREE.Plane(), hit = new THREE.Vector3(), camDir = new THREE.Vector3();
  const inv = new THREE.Matrix4(), m1 = new THREE.Matrix4(), pa = new THREE.Vector3(), pb = new THREE.Vector3(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), sv = new THREE.Vector3();
  const bubble = document.getElementById("bubble");
  const angleTo = (from, to) => { const d = ((to - from) % TAU + TAU + Math.PI) % TAU - Math.PI; return from + d; };

  function frame() {
    const t = clock.getElapsedTime();
    readScroll();
    const pA = seg(0, T.aEnd), pB = seg(T.bStart, T.bEnd);
    const phaseName = S < T.bStart ? "A" : (S < T.cStart ? "B" : "C");
    const travelA = applyCurtain(pA);
    canvas.classList.toggle("passive", S > 0.05);
    const mobile = stageW < 760;
    const halfW = stageW / 2 * worldPerPx;

    // user spin (hero only)
    if (!dragging) {
      if (turnTarget !== null) {
        userRot += (turnTarget - userRot) * 0.09;
        if (Math.abs(turnTarget - userRot) < 0.002) { userRot = turnTarget; turnTarget = null; }
      } else if (Math.abs(vel) > 0.0001) { userRot += vel; vel *= 0.93; }
    }

    // ---- where she is and what she's doing, by scroll phase ----
    let x = 0, rotY = 0, sc = 1, walkK = 0, pull = 0, pullAngle = 1.05, push = 0, seatK = 0, lookK = 1, lean = 0, glance = 0, dragR = 0;
    let revealHand = null; // which hand the work page's edge follows this frame
    stoolPivot.visible = phaseName === "C";
    stoolPivot.scale.setScalar(1);
    if (phaseName !== "C") cStartT = null;

    // direction bookkeeping
    if (prevPhase === "C" && phaseName !== "C") { bMode = "drag"; exitStart = t; qShown = 0; }
    if (phaseName === "C" || (phaseName === "A" && pA < 0.999)) bMode = "push";
    const scC = mobile ? 0.55 : 1, seatFrac = mobile ? 0.7 : 0.74;
    const draggingPage = bMode === "drag" && (phaseName === "B" || phaseName === "A");

    if (draggingPage) {
      const exT = t - exitStart;
      if (exT < EXIT_DUR && !reduceMotion) {
        // stand up off the stool, turn left, walk out
        sc = scC;
        const seatX = (stageW * seatFrac - stageW / 2) * worldPerPx / sc;
        const stand = smooth(exT / 0.6), turn = smooth((exT - 0.4) / 0.5), go = clamp01((exT - 0.8) / 1.8);
        x = lerp(seatX, -halfW / sc - 1.6, go);
        rotY = lerp(0, -Math.PI / 2, turn);
        seatK = 1 - stand; walkK = go > 0 && go < 1 ? 1 : 0; lookK = 1 - turn; lean = 0.06 * turn;
        stoolPivot.visible = true; stoolPivot.position.set(seatX + 0.45, 0, -0.3); stoolPivot.rotation.z = 0;
        applyReveal(-(stageW + 60));
      } else {
        // walk back in from the left, dragging the work page's edge behind her
        const qT = phaseName === "A" ? 1 : 1 - pB;
        const before = qShown;
        qShown += (qT - qShown) * 0.07;
        if (Math.abs(qT - qShown) < 0.0005) qShown = qT;
        walkDrag += ((Math.abs(qShown - before) > 0.0004 ? 1 : 0) - walkDrag) * 0.15;
        x = lerp(-halfW - 1.0, halfW + REACH + 0.6, qShown);
        rotY = Math.PI / 2; dragR = 1; walkK = walkDrag; lookK = 0; lean = 0.1;
        glance = -0.4 * smooth((qShown - 0.1) * 4) * (1 - smooth((qShown - 0.6) * 4));
        revealHand = "R";
        // the stool she left behind gets covered by the page as it slides over
        stoolPivot.visible = true; stoolPivot.scale.setScalar(scC); stoolPivot.rotation.z = 0;
        stoolPivot.position.set((stageW * seatFrac - stageW / 2) * worldPerPx + 0.45 * scC, 0, -0.3 * scC);
        if (phaseName === "A" && qShown >= 0.999) bMode = "push";
      }
    } else if (phaseName === "A") {
      const turnK = smooth(pA / TURN_END);
      x = -travelA * worldPerPx;
      rotY = lerp(userRot, angleTo(userRot, -Math.PI / 2), turnK);
      walkK = smooth(walkProgress(pA) * 12);
      pull = turnK; lookK = 1 - turnK; lean = 0.1 * turnK;
      glance = 0.45 * walkK * (1 - smooth((walkProgress(pA) - 0.5) * 3));
      applyReveal(0);
    } else if (phaseName === "B") {
      // she pushes the work page itself: its right edge sits at her hands (set after posing)
      x = lerp(halfW + REACH + 0.4, -halfW - 1.0, pB);
      rotY = -Math.PI / 2; walkK = pB > 0 && pB < 1 ? 1 : 0; push = 1; lookK = 0; lean = 0.2;
      glance = 0.35 * smooth((pB - 0.15) * 4) * (1 - smooth((pB - 0.55) * 4));
      revealHand = "both";
    } else {
      applyReveal(-(stageW + 60));
      sc = mobile ? 0.55 : 1;
      const seatX = (stageW * (mobile ? 0.7 : 0.74) - stageW / 2) * worldPerPx / sc;
      // last screen: plays on its own as soon as you arrive, not tied to scrolling
      if (cStartT === null) cStartT = reduceMotion ? t - 5 : t;
      const cT = t - cStartT;
      const e = clamp01(cT / 2.8), turn = smooth((cT - 2.8) / 0.6), sit = smooth((cT - 3.4) / 0.6);
      x = lerp(halfW / sc + 3.2, seatX, e);
      rotY = lerp(-Math.PI / 2, 0, turn);
      walkK = 1 - smooth((e - 0.9) / 0.1);
      pull = 1 - turn; pullAngle = 0.6;
      seatK = sit; lookK = turn; lean = 0.06 * (1 - turn);
      stoolPivot.position.set(lerp(x + 2.39, x + 0.45, turn), 0, lerp(0, -0.3, turn));
      stoolPivot.rotation.z = lerp(0.2, 0, turn);
    }
    prevPhase = phaseName;
    root.scale.setScalar(sc);
    char.position.x = x; char.rotation.y = rotY;
    shadowMesh.position.x = x;

    // ---- emotes (hero only) ----
    if (S > 0.04) emote = null;
    if (!reduceMotion && !emote && S < 0.01 && t > nextIdle) play(idleIdx++ % 2 ? "yeehaw" : "wave", false);
    let env = 0, k = 0;
    if (emote) {
      k = (t - emoteStart) / DUR[emote];
      if (k >= 1) emote = null; else env = smooth(k / 0.14) * (1 - smooth((k - 0.86) / 0.14));
    }
    waveE += ((emote === "wave" ? env : 0) - waveE) * 0.2;
    lassoE += ((emote === "yeehaw" ? env : 0) - lassoE) * 0.2;

    // ---- seated bow (plays once she has sat down) ----
    if (phaseName === "C" && seatK >= 0.999) { if (bowStart === null && !reduceMotion) bowStart = t + 0.25; }
    else if (phaseName !== "C") bowStart = null;
    const bk = bowStart === null ? 0 : clamp01((t - bowStart) / BOW_DUR);
    const bowAmt = smooth((bk - 0.45) / 0.12) * (1 - smooth((bk - 0.78) / 0.15));
    const hatTarget = bowStart === null ? 0 : smooth((bk - 0.17) / 0.1);
    hatOffS += (hatTarget - hatOffS) * 0.18;

    const walkPhase = x * 2.6;
    const swing = Math.sin(walkPhase) * walkK;
    const wv = Math.sin(t * 10.5), spin = t * 9;

    // right arm
    let rx = -swing * 0.45, rz = -0.2, ex = -0.15, ez = 0;
    rz = lerp(rz, -2.62 + wv * 0.06, waveE); rx = lerp(rx, 0.3, waveE); ez = lerp(ez, -0.15 + wv * 0.5, waveE); ex = lerp(ex, 0, waveE);
    rz = lerp(rz, -2.8, lassoE); rx = lerp(rx, 0.1, lassoE); ez = lerp(ez, -0.25 + Math.sin(spin) * 0.3, lassoE); ex = lerp(ex, Math.cos(spin) * 0.3, lassoE);
    rx = lerp(rx, -1.35, push); rz = lerp(rz, 0.15, push); ex = lerp(ex, -0.3, push); ez = lerp(ez, 0, push);
    rx = lerp(rx, 1.05 + Math.sin(walkPhase * 2) * 0.03 * walkK, dragR); rz = lerp(rz, -0.3, dragR); ex = lerp(ex, 0.25, dragR); ez = lerp(ez, 0, dragR);
    const bp = bowPose(bk);
    rx = lerp(rx, bp[0], seatK); rz = lerp(rz, bp[1], seatK); ex = lerp(ex, bp[2], seatK); ez = lerp(ez, bp[3], seatK);
    armR.shoulder.rotation.set(rx, 0, rz); armR.elbow.rotation.set(ex, 0, ez);

    // left arm
    const sway = reduceMotion ? 0 : Math.sin(t * 1.4) * 0.025;
    let lx = swing * 0.3, lz = 0.2 + sway, lex = -0.15, lez = 0;
    lz = lerp(lz, 0.75, lassoE); lx = lerp(lx, -0.25, lassoE); lez = lerp(lez, -1.9, lassoE); lex = lerp(lex, -0.2, lassoE);
    lz = lerp(lz, 0.3, pull); lx = lerp(lx, pullAngle + Math.sin(walkPhase * 2) * 0.03 * walkK, pull); lez = lerp(lez, 0, pull); lex = lerp(lex, 0.25, pull);
    lx = lerp(lx, -1.35, push); lz = lerp(lz, -0.15, push); lex = lerp(lex, -0.3, push); lez = lerp(lez, 0, push);
    lx = lerp(lx, -0.35 + 0.2 * bowAmt, seatK); lz = lerp(lz, 0.12 + 0.55 * bowAmt, seatK); lex = lerp(lex, -0.55 + 0.4 * bowAmt, seatK); lez = lerp(lez, 0, seatK);
    armL.shoulder.rotation.set(lx, 0, lz); armL.elbow.rotation.set(lex, 0, lez);

    // legs: walking swing, then forward when perched on the stool
    hips[0].rotation.x = swing * 0.5 - 0.32 * seatK; hips[1].rotation.x = -swing * 0.5 - 0.32 * seatK;
    hips[0].rotation.z = 0.04 * seatK; hips[1].rotation.z = -0.04 * seatK;

    // body
    let y = reduceMotion ? 0 : Math.sin(t * 2.1) * 0.02 * (1 - walkK);
    y += Math.abs(Math.cos(walkPhase)) * 0.07 * walkK;
    if (hopT >= 0) { const h = (t - hopT) / 0.45; if (h < 1) y += Math.sin(h * Math.PI) * 0.32; else hopT = -1; }
    body.position.y = y - 0.32 * seatK;
    body.rotation.z = Math.sin(t * 4.6) * 0.045 * lassoE;
    body.rotation.x = lean + 0.35 * bowAmt;

    // lasso
    lasso.visible = lassoE > 0.03;
    if (lasso.visible) {
      root.updateMatrixWorld();
      armR.grip.getWorldPosition(tmp); body.worldToLocal(tmp);
      lasso.position.copy(tmp); lasso.scale.setScalar(lassoE);
      lassoSpin.rotation.y = spin; loop.rotation.y = Math.sin(spin) * 0.12;
    }
    const tip = emote === "yeehaw" ? smooth((k - 0.62) / 0.12) * (1 - smooth((k - 0.86) / 0.12)) : 0;
    hatSlot.rotation.x = 0.28 * tip;

    // look at the pointer while facing the viewer
    let tgtYaw = 0, tgtPitch = 0, ex2 = 0, ey2 = 0;
    if (pointerSeen && lookK > 0.01) {
      root.updateMatrixWorld();
      headPivot.getWorldPosition(headW); headW.y += 0.5;
      camera.getWorldDirection(camDir);
      plane.setFromNormalAndCoplanarPoint(camDir.clone().negate(), tmp.copy(headW).addScaledVector(camDir, -5));
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, hit)) {
        const local = body.worldToLocal(hit.clone());
        local.sub(headPivot.position); local.y -= 0.5;
        const horiz = Math.hypot(local.x, local.z);
        const facing = THREE.MathUtils.smoothstep(local.z / (horiz + 1e-6), -0.05, 0.55) * lookK;
        const yaw = Math.atan2(local.x, local.z), pitch = -Math.atan2(local.y, horiz);
        tgtYaw = THREE.MathUtils.clamp(yaw, -0.55, 0.55) * facing;
        tgtPitch = THREE.MathUtils.clamp(pitch, -0.28, 0.32) * facing;
        ex2 = THREE.MathUtils.clamp(yaw * 0.16, -0.07, 0.07) * facing;
        ey2 = THREE.MathUtils.clamp(-pitch * 0.16, -0.06, 0.06) * facing;
      }
    } else if (!reduceMotion && lookK > 0.01) {
      tgtYaw = Math.sin(t * 0.5) * 0.18 * lookK; ex2 = Math.sin(t * 0.5) * 0.03 * lookK;
    }
    tgtYaw += glance;
    yawS += (tgtYaw - yawS) * 0.12; pitchS += (tgtPitch - pitchS) * 0.12;
    eyeX += (ex2 - eyeX) * 0.25; eyeY += (ey2 - eyeY) * 0.25;
    headPivot.rotation.set(pitchS + 0.1 * tip + 0.22 * bowAmt, yawS, 0.07 * waveE * Math.sin(t * 5.25) + 0.06 * lassoE);
    hairLowPivot.rotation.y = yawS * 0.35;

    let lid = 1;
    if (t > blinkAt) { const b = (t - blinkAt) / 0.14; if (b < 1) lid = Math.max(0.08, Math.abs(1 - 2 * b)); else blinkAt = t + 2.5 + rand() * 3.5; }
    if (bowAmt > 0.5) lid = Math.min(lid, 0.15); // eyes closed mid-bow
    for (const pp of pupils) { pp.position.set(pp.userData.base.x + eyeX, pp.userData.base.y + eyeY, pp.userData.base.z); pp.scale.set(1, lid, 1); }

    // hat: on her head, or in her hand once she's taken it off
    root.updateMatrixWorld(true);
    if (revealHand) {
      armR.grip.getWorldPosition(pa);
      if (revealHand === "both") { armL.grip.getWorldPosition(pb); pa.add(pb).multiplyScalar(0.5); }
      pa.project(camera);
      const edgePx = (pa.x + 1) / 2 * stageW;
      applyReveal(edgePx - stageW);
      if (revealHand === "R") stoolPivot.visible = edgePx < stageW * seatFrac - 0.45 * scC / worldPerPx;
    }
    inv.copy(body.matrixWorld).invert();
    m1.multiplyMatrices(inv, hatSlot.matrixWorld).decompose(pa, qa, sv);
    m1.multiplyMatrices(inv, hatHold.matrixWorld).decompose(pb, qb, sv);
    hat.position.lerpVectors(pa, pb, hatOffS);
    hat.quaternion.copy(qa).slerp(qb, hatOffS);

    // speech bubble: yeehaw in the hero, a thank-you after the bow
    let say = "";
    if (emote === "yeehaw" && k > 0.15 && k < 0.92) say = "Yeehaw!";
    else if (bowStart !== null && bk > 0.5 && bk < 0.98) say = "Thanks for scrolling!";
    bubble.style.opacity = say ? 1 : 0;
    if (say) {
      if (bubble.textContent !== say) bubble.textContent = say;
      headPivot.getWorldPosition(tmp); tmp.y += 1.9 * sc; tmp.x += (say.length > 8 ? -0.2 : 0.9) * sc;
      tmp.project(camera);
      bubble.style.left = ((tmp.x + 1) / 2 * stageW) + "px";
      bubble.style.top = ((1 - tmp.y) / 2 * sticky.clientHeight) + "px";
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  if (reduceMotion) nextIdle = Infinity;
  requestAnimationFrame(frame);
})();
