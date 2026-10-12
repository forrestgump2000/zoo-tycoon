/* Zoo Tycoon 3D — procedural cartoon creature models + procedural animation.
   Every species maps to a preset (body plan + proportions + features + colors).
   Body plans: quad, biped, bird, snake, fish, ray, bug, blob, frog, bat, seal, special. */
import * as THREE from 'three';

/* ---------------- shared geometry & materials ---------------- */
export const GEO = {
  sph: new THREE.SphereGeometry(1, 18, 14),
  sphLo: new THREE.SphereGeometry(1, 10, 8),
  limb: (() => { const g = new THREE.CylinderGeometry(1, .72, 1, 10); g.translate(0, -.5, 0); return g; })(),
  up: (() => { const g = new THREE.CylinderGeometry(.78, 1, 1, 10); g.translate(0, .5, 0); return g; })(),
  cone: (() => { const g = new THREE.ConeGeometry(1, 1, 10); g.translate(0, .5, 0); return g; })(),
  wedge: (() => { const g = new THREE.ConeGeometry(1, 1, 4); g.translate(0, .5, 0); return g; })(),
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 16),
  hemi: new THREE.SphereGeometry(1, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2),
  torus: new THREE.TorusGeometry(1, .3, 8, 20),
  ring: new THREE.TorusGeometry(1, .06, 6, 28),
};
const GRAD = (() => {
  const d = new Uint8Array([80, 160, 220, 255]);
  const t = new THREE.DataTexture(d, 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
})();
export { GRAD };
const MATS = new Map();
export function toon(color, o = {}) {
  const op = o.opacity ?? 1;
  const key = [color, o.emissive || '', o.ei || 0, op, o.map ? o.map.uuid : '', o.side || 0, o.basic ? 1 : 0].join('|');
  let m = MATS.get(key);
  if (m) return m;
  if (o.basic) m = new THREE.MeshBasicMaterial({ color, transparent: op < 1, opacity: op, side: o.side || THREE.FrontSide, depthWrite: op >= 1 });
  else m = new THREE.MeshToonMaterial({ color, gradientMap: GRAD, emissive: o.emissive || '#000000', emissiveIntensity: o.ei || 0, transparent: op < 1, opacity: op, map: o.map || null, side: o.side || THREE.FrontSide, depthWrite: op >= 1 });
  MATS.set(key, m);
  return m;
}
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
export function mix(a, b, t) { _c1.set(a); _c2.set(b); return '#' + _c1.lerp(_c2, t).getHexString(); }
export function shade(a, t) { return t < 0 ? mix(a, '#000000', -t) : mix(a, '#ffffff', t); }

/* ---------------- procedural pattern textures ---------------- */
const PAT = new Map();
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
export { hashStr, rng };
function patternTex(type, base, mark) {
  const key = type + base + mark;
  if (PAT.has(key)) return PAT.get(key);
  const W = 256, H = 128, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), r = rng(hashStr(key));
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  g.fillStyle = mark; g.strokeStyle = mark;
  const blob = (x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, rx, ry, r() * 3, 0, 7); g.fill(); };
  switch (type) {
    case 'spots': for (let i = 0; i < 60; i++) blob(r() * W, 15 + r() * (H - 30), 4 + r() * 6, 4 + r() * 5); break;
    case 'stripes': for (let x = 0; x < W; x += 14 + r() * 8) { g.lineWidth = 4 + r() * 5; g.beginPath(); g.moveTo(x, 8); g.bezierCurveTo(x + 8, H * .35, x - 8, H * .65, x + r() * 6, H - 8); g.stroke(); } break;
    case 'thinstripes': g.lineWidth = 2.5; for (let x = 20; x < W; x += 22) { g.beginPath(); g.moveTo(x, H * .25); g.lineTo(x + 3, H * .7); g.stroke(); } break;
    case 'patches': for (let i = 0; i < 14; i++) blob(r() * W, 10 + r() * (H - 20), 14 + r() * 18, 10 + r() * 14); break;
    case 'rosettes': for (let i = 0; i < 46; i++) { const x = r() * W, y = 14 + r() * (H - 28); g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, 6, 5, 0, 0, 7); g.stroke(); } break;
    case 'clouds': for (let i = 0; i < 22; i++) { const x = r() * W, y = 14 + r() * (H - 28); g.lineWidth = 4; g.beginPath(); g.ellipse(x, y, 12 + r() * 6, 8, r(), 0, 7); g.stroke(); } break;
    case 'bands': for (let y = 6; y < H; y += 20) g.fillRect(0, y, W, 9); break;
    case 'rings': for (let x = 0; x < W; x += 24) g.fillRect(x, 0, 11, H); break;
    case 'blotch': for (let i = 0; i < 26; i++) blob(r() * W, 10 + r() * (H - 20), 9 + r() * 9, 6 + r() * 6); break;
    case 'scales': g.lineWidth = 2; for (let y = 0; y < H; y += 10) for (let x = (y / 10 % 2) * 6; x < W; x += 12) { g.beginPath(); g.arc(x, y, 6, 0, Math.PI); g.stroke(); } break;
    case 'backstripe': g.fillRect(0, 0, W, H * .22); break;
    case 'saddle': g.fillRect(W * .3, 0, W * .25, H); g.fillRect(W * .8, 0, W * .2, H); break;
    case 'flank': g.fillRect(0, H * .5, W, H * .1); break;
    case 'panda': g.fillRect(W * .18, 0, W * .14, H); g.fillRect(W * .68, 0, W * .14, H); break;
    case 'zigzag': g.lineWidth = 5; for (let y = 16; y < H; y += 28) { g.beginPath(); for (let x = 0; x <= W; x += 16) g.lineTo(x, y + (x / 16 % 2 ? 9 : -9)); g.stroke(); } break;
    case 'dots': for (let i = 0; i < 140; i++) blob(r() * W, r() * H, 2, 2); break;
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
  PAT.set(key, t);
  return t;
}

/* ---------------- tiny scene-graph helpers ---------------- */
function G(parent, pos, rot) { const g = new THREE.Group(); if (pos) g.position.set(pos[0], pos[1], pos[2]); if (rot) g.rotation.set(rot[0], rot[1], rot[2]); parent.add(g); return g; }
function P(parent, geo, mat, pos, scl, rot) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  if (scl) m.scale.set(scl[0], scl[1], scl[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = !scl || Math.max(scl[0], scl[1], scl[2]) > .07;
  parent.add(m);
  return m;
}
// chain of tapering segments; each segment is a group placed at the previous tip
function chain(parent, n, len, r0, r1, bend, mat, opt = {}) {
  const segs = []; let g = parent;
  for (let i = 0; i < n; i++) {
    const s = G(g, i ? [0, len, 0] : [0, 0, 0]);
    if (i) s.rotation.set(bend[0], bend[1] || 0, bend[2] || 0);
    const r = r0 + (r1 - r0) * (i / Math.max(1, n - 1));
    const m = opt.mats ? opt.mats[i % opt.mats.length] : mat;
    P(s, GEO.up, m, [0, 0, 0], [r, len * 1.05, r * (opt.flat || 1)]);
    if (opt.puff) P(s, GEO.sphLo, m, [0, len * .6, 0], [r * opt.puff, len * .7, r * opt.puff]);
    segs.push(s); g = s;
  }
  return segs;
}

/* ---------------- palette & variants ---------------- */
function palette(colors, variantId, p, rig) {
  const v = VARIANT_BY_ID[variantId] || VARIANT_BY_ID.common;
  let [main, second, accent] = [colors[0] || '#a0a0a0', colors[1] || colors[0] || '#d0d0d0', colors[2] || '#303030'];
  if (v.id === 'golden') { main = mix(main, '#f2c230', .78); second = mix(second, '#ffe680', .7); accent = mix(accent, '#c08a10', .55); }
  if (v.id === 'shadow') { main = mix(main, '#241c38', .78); second = mix(second, '#3a2e58', .7); accent = mix(accent, '#140f22', .5); }
  if (v.id === 'albino') { main = mix(main, '#fbf8f2', .88); second = mix(second, '#fff6f0', .8); accent = mix(accent, '#f0d0d8', .75); }
  const em = v.id === 'golden' ? { emissive: '#7a5200', ei: .35 } : p.glow ? { emissive: p.glowColor || second, ei: .55 } : {};
  const patType = v.pattern || p.pattern;
  const patMark = p.patternColor === 'second' ? second : p.patternColor === 'main' ? main : (p.patternColor || accent);
  const patBase = p.patternBase === 'second' ? second : main;
  const glowEyes = v.glowEyes || p.glowEyes;
  const eye = v.eyes || glowEyes || p.eyeColor || '#1a1410';
  const mk = (c, o) => rig.rainbow ? new THREE.MeshToonMaterial({ color: c, gradientMap: GRAD, ...(o && o.map ? { map: o.map, color: '#ffffff' } : {}) }) : toon(c, o);
  const K = {
    mainHex: main, secondHex: second, accentHex: accent,
    skin: patType ? mk('#ffffff', { map: patternTex(patType, patBase, patMark), ...em }) : mk(main, em),
    main: mk(main, em), second: mk(second, em), accent: mk(accent, em),
    dark: toon(shade(main, -.6)), nose: toon('#2a1c18'), white: toon('#ffffff'), eyeW: toon(p.eyeWhite || '#ffffff'),
    pupil: glowEyes ? toon(eye, { emissive: eye, ei: 1.4 }) : toon(eye),
    pink: toon(p.pinkColor || mix(main, '#f4a0b0', .65)), horn: toon(p.hornColor || '#efe3c6'), hoof: toon(p.hoofColor || '#3a2a20'),
    beak: toon(p.beakColor || '#f2a830'), teeth: toon('#fffbe8'), claw: toon('#f0e8d8'),
    glow: toon(p.glowColor || accent, { emissive: p.glowColor || accent, ei: 1.3 }),
    glass: toon('#d8f0ff', { opacity: .35 }),
  };
  K.leg = p.legC ? K[p.legC] : K.main;
  K.snout = p.snoutC ? K[p.snoutC] : K.second;
  K.headM = p.headC ? K[p.headC] : K.skin;
  K.tailM = p.tailC ? K[p.tailC] : K.main;
  K.earM = p.earC ? K[p.earC] : K.main;
  if (rig.rainbow) rig.rainbowMats.push(K.skin, K.main, K.second);
  if (v.id === 'golden' || p.glow) rig.glowMats.push(K.main);
  return K;
}

/* ---------------- EYES / EARS / HORNS / TAILS ---------------- */
function eyes(parent, x, y, z, r, K, rig, side = 0) {
  for (const sx of [1, -1]) {
    const g = G(parent, [sx * x, y, z]);
    g.rotation.y = sx * side;
    P(g, GEO.sph, K.eyeW, [0, 0, 0], [r, r, r * .75]);
    P(g, GEO.sph, K.pupil, [0, r * .05, r * .48], [r * .6, r * .66, r * .4]);
    P(g, GEO.sphLo, K.white, [r * .22, r * .3, r * .8], [r * .2, r * .2, r * .1]);
    rig.eyes.push(g);
  }
}
function ears(head, type, hr, K, rig, s = 1) {
  if (!type || type === 'none') return;
  for (const sx of [1, -1]) {
    let e;
    switch (type) {
      case 'pointy': case 'tufted': case 'fennec': {
        const big = type === 'fennec' ? 1.9 : 1;
        e = G(head, [sx * hr * .5, hr * .62, -hr * .05], [0, 0, -sx * .32]);
        P(e, GEO.cone, K.earM, [0, 0, 0], [hr * .27 * s * big, hr * .62 * s * big, hr * .12 * s]);
        P(e, GEO.cone, K.pink, [0, hr * .04, hr * .04 * s], [hr * .16 * s * big, hr * .46 * s * big, hr * .06 * s]);
        if (type === 'tufted') P(e, GEO.cone, K.dark, [0, hr * .6 * s, 0], [hr * .05, hr * .3 * s, hr * .05]);
        break;
      }
      case 'round':
        e = G(head, [sx * hr * .62, hr * .62, -hr * .05]);
        P(e, GEO.sph, K.earM, [0, 0, 0], [hr * .3 * s, hr * .3 * s, hr * .12 * s]);
        P(e, GEO.sph, K.pink, [0, 0, hr * .05], [hr * .18 * s, hr * .18 * s, hr * .06 * s]);
        break;
      case 'long':
        e = G(head, [sx * hr * .32, hr * .7, -hr * .1], [-.15, 0, -sx * .12]);
        P(e, GEO.sph, K.earM, [0, hr * 1.0 * s, 0], [hr * .2 * s, hr * 1.0 * s, hr * .1 * s]);
        P(e, GEO.sph, K.pink, [0, hr * 1.0 * s, hr * .06], [hr * .12 * s, hr * .8 * s, hr * .05 * s]);
        break;
      case 'floppy':
        e = G(head, [sx * hr * .78, hr * .35, -hr * .05], [0, 0, sx * .5]);
        P(e, GEO.sph, K.earM, [0, -hr * .38 * s, 0], [hr * .14 * s, hr * .48 * s, hr * .28 * s]);
        break;
      case 'side':
        e = G(head, [sx * hr * .7, hr * .45, -hr * .15], [0, 0, -sx * 1.15]);
        P(e, GEO.sph, K.earM, [0, hr * .36 * s, 0], [hr * .15 * s, hr * .4 * s, hr * .08]);
        P(e, GEO.sph, K.pink, [0, hr * .36 * s, hr * .04], [hr * .09 * s, hr * .28 * s, hr * .04]);
        break;
      case 'big':
        e = G(head, [sx * hr * .8, hr * .15, -hr * .2], [0, sx * .4, 0]);
        P(e, GEO.sph, K.earM, [sx * hr * .55 * s, 0, 0], [hr * .75 * s, hr * .85 * s, hr * .07]);
        break;
      case 'tiny':
        e = G(head, [sx * hr * .55, hr * .7, -hr * .1]);
        P(e, GEO.sphLo, K.earM, [0, 0, 0], [hr * .12 * s, hr * .14 * s, hr * .08]);
        break;
      default: return;
    }
    rig.ears.push({ g: e, sx, base: e.rotation.x });
  }
}
function hornSide(head, sx, hr, K, kind, s, rig) {
  const hm = K.horn;
  const g = G(head, [sx * hr * .32, hr * .78, -hr * .05]);
  switch (kind) {
    case 'antlers': case 'palmate': {
      g.rotation.set(-.35, 0, -sx * .45);
      const beam = chain(g, 3, hr * .55 * s, hr * .07, hr * .045, [-.35, 0, sx * .15], toon('#8a6a48'));
      for (let i = 0; i < 3; i++) { const t = G(beam[i], [0, hr * .3 * s, 0], [.6, 0, sx * (i % 2 ? .5 : -.4)]); P(t, GEO.cone, toon('#8a6a48'), [0, 0, 0], [hr * .04, hr * .45 * s, hr * .04]); }
      if (kind === 'palmate') P(beam[1], GEO.sph, toon('#9a7a52'), [sx * hr * .25 * s, hr * .45 * s, 0], [hr * .55 * s, hr * .4 * s, hr * .08]);
      break;
    }
    case 'curl': {
      g.position.set(sx * hr * .45, hr * .6, -hr * .1); g.rotation.set(0, 0, -sx * .8);
      chain(g, 7, hr * .28 * s, hr * .16, hr * .06, [-.75, 0, sx * .12], hm);
      break;
    }
    case 'spiral': case 'corkscrew': {
      g.rotation.set(-.5, 0, -sx * .3);
      chain(g, 6, hr * .3 * s, hr * .07, hr * .03, [-.12, sx * .9, sx * .25], hm);
      break;
    }
    case 'straight': g.rotation.set(-.9, 0, -sx * .12); P(g, GEO.cone, hm, [0, 0, 0], [hr * .06, hr * 2.6 * s, hr * .06]); break;
    case 'lyre': g.rotation.set(-.5, 0, -sx * .2); chain(g, 4, hr * .4 * s, hr * .06, hr * .03, [-.15, 0, sx * .25], hm); break;
    case 'scimitar': g.rotation.set(-.5, 0, -sx * .15); chain(g, 5, hr * .5 * s, hr * .11, hr * .04, [-.3, 0, 0], hm); break;
    case 'hook': g.rotation.set(-.1, 0, -sx * .1); chain(g, 3, hr * .25 * s, hr * .05, hr * .03, [-.9, 0, 0], toon('#2a2420')); break;
    case 'small': g.rotation.set(-.6, 0, -sx * .25); P(g, GEO.cone, hm, [0, 0, 0], [hr * .08, hr * .5 * s, hr * .08]); break;
    case 'cow': g.position.set(sx * hr * .55, hr * .62, -hr * .1); g.rotation.set(0, 0, -sx * 1.4); chain(g, 3, hr * .22 * s, hr * .08, hr * .04, [0, 0, sx * .5], hm); break;
    case 'wide': g.position.set(sx * hr * .55, hr * .55, -hr * .1); g.rotation.set(0, 0, -sx * 1.45); chain(g, 4, hr * .32 * s, hr * .11, hr * .045, [-.15, 0, sx * .38], hm); break;
    case 'swept': g.position.set(sx * hr * .5, hr * .6, -hr * .1); g.rotation.set(-.4, 0, -sx * 1.3); chain(g, 5, hr * .35 * s, hr * .13, hr * .04, [-.2, 0, sx * .25], toon('#4a4038')); break;
    case 'boss': g.position.set(sx * hr * .35, hr * .72, 0); g.rotation.set(0, 0, -sx * 1.5); chain(g, 4, hr * .28 * s, hr * .15, hr * .05, [0, 0, sx * .7], toon('#3a3430')); break;
    case 'ossicone': g.rotation.set(-.2, 0, -sx * .15); P(g, GEO.up, K.main, [0, 0, 0], [hr * .07, hr * .5 * s, hr * .07]); P(g, GEO.sphLo, K.dark, [0, hr * .52 * s, 0], [hr * .09, hr * .08, hr * .09]); break;
    case 'dragon': g.rotation.set(-1, 0, -sx * .3); chain(g, 3, hr * .45 * s, hr * .1, hr * .03, [-.3, 0, 0], K.horn); break;
  }
}
function horns(head, kind, hr, K, s = 1, rig, opts) {
  if (!kind) return;
  if (kind === 'unicorn') { const g = G(head, [0, hr * .75, hr * .45], [.7, 0, 0]); chain(g, 4, hr * .32 * s, hr * .09, hr * .02, [0, .4, 0], toon('#ffe9a8', { emissive: '#ffcc55', ei: .4 })); return; }
  if (kind === 'nose' || kind === 'nose2') {
    const g = G(head, [0, hr * .1, hr * 1.25], [.5, 0, 0]);
    P(g, GEO.cone, K.horn, [0, 0, 0], [hr * .2, hr * .9 * s, hr * .2]);
    if (kind === 'nose2') P(g, GEO.cone, K.horn, [0, hr * .05, -hr * .45], [hr * .14, hr * .45 * s, hr * .14]);
    return;
  }
  if (kind === 'tusks' || kind === 'bigtusks') {
    for (const sx of [1, -1]) {
      const g = G(head, [sx * hr * .32, -hr * .45, hr * .55], [kind === 'bigtusks' ? 2.2 : 2.5, 0, sx * .2]);
      chain(g, 3, hr * (kind === 'bigtusks' ? .55 : .35) * s, hr * .09, hr * .04, [kind === 'bigtusks' ? -.55 : -.3, 0, -sx * .2], K.teeth);
    }
    return;
  }
  if (kind === 'tricera') {
    P(head, GEO.sph, K.accent, [0, hr * .45, -hr * .45], [hr * 1.25, hr * 1.05, hr * .18], [-.6, 0, 0]);
    for (const sx of [1, -1]) { const g = G(head, [sx * hr * .38, hr * .55, hr * .3], [.9, 0, -sx * .15]); P(g, GEO.cone, K.horn, [0, 0, 0], [hr * .1, hr * 1.1, hr * .1]); }
    const n = G(head, [0, hr * .05, hr * 1.1], [.6, 0, 0]); P(n, GEO.cone, K.horn, [0, 0, 0], [hr * .09, hr * .45, hr * .09]);
    return;
  }
  if ((kind === 'antlers' || kind === 'palmate') && opts && opts.sex === 'F' && !opts.antlersBoth) return;
  for (const sx of [1, -1]) hornSide(head, sx, hr, K, kind, s, rig);
}
function tail(parent, type, pos, len, r, K, rig, opt = {}) {
  if (!type || type === 'none') return;
  const base = G(parent, pos);
  base.rotation.x = opt.angle ?? -2.2;
  const m = opt.mat || K.tailM;
  let segs = [];
  switch (type) {
    case 'thin': segs = chain(base, 4, len / 4, r, r * .5, [.12, 0, 0], m); break;
    case 'long': segs = chain(base, 6, len / 6, r, r * .55, [opt.curl ?? .18, 0, 0], m); break;
    case 'curlup': segs = chain(base, 6, len / 6, r, r * .6, [-.38, 0, 0], m); break;
    case 'tuft': segs = chain(base, 4, len / 4, r, r * .6, [.1, 0, 0], m); P(segs[3], GEO.sphLo, opt.tipMat || K.dark, [0, len / 4, 0], [r * 2.4, r * 3.2, r * 2.4]); break;
    case 'horse': segs = chain(base, 4, len / 4, r * 1.6, r * 1.1, [.15, 0, 0], opt.tipMat || K.dark, { puff: 1.6 }); break;
    case 'bushy': segs = chain(base, 4, len / 4, r * 1.6, r * 2.1, [-.05, 0, 0], m, { puff: 1.45 }); P(segs[3], GEO.sph, opt.tipMat || K.white, [0, len / 4, 0], [r * 2, r * 2.4, r * 2]); break;
    case 'squirrel': segs = chain(base, 5, len / 5, r * 2, r * 2.6, [-.42, 0, 0], m, { puff: 1.35 }); break;
    case 'ringed': segs = chain(base, 6, len / 6, r * 1.3, r * 1.1, [opt.curl ?? -.05, 0, 0], m, { mats: [m, K.dark], puff: 1.25 }); break;
    case 'short': segs = [G(base)]; P(segs[0], GEO.sph, opt.tipMat || K.white, [0, len * .4, 0], [r * 2.2, len * .5, r * 1.6]); break;
    case 'stub': segs = [G(base)]; P(segs[0], GEO.sphLo, m, [0, len * .2, 0], [r * 1.4, len * .3, r * 1.4]); break;
    case 'fluffy': segs = [G(base)]; P(segs[0], GEO.sph, opt.tipMat || K.white, [0, len * .2, 0], [r * 2.6, r * 2.6, r * 2.6]); break;
    case 'flat': segs = [G(base)]; P(segs[0], GEO.sph, K.dark, [0, len * .5, 0], [r * 3, len * .55, r * .7]); break;
    case 'curly': segs = [G(base)]; P(segs[0], GEO.torus, m, [0, len * .25, 0], [len * .18, len * .18, len * .18], [0, Math.PI / 2, 0]); break;
    case 'heavy': segs = chain(base, opt.n || 6, len / (opt.n || 6), r, r * .18, [opt.curl ?? .04, 0, 0], m); break;
    case 'kangaroo': segs = chain(base, 5, len / 5, r, r * .35, [.12, 0, 0], m); break;
    case 'fan': segs = [G(base)]; for (let i = -3; i <= 3; i++) P(segs[0], GEO.sph, i % 2 ? K.main : K.accent, [i * len * .12, len * .55, 0], [len * .08, len * .55, len * .02], [0, 0, -i * .22]); break;
    default: segs = chain(base, 3, len / 3, r, r * .5, [.1, 0, 0], m);
  }
  if (opt.club) P(segs[segs.length - 1], GEO.sph, K.accent, [0, len / (opt.n || 6), 0], [r * 3, r * 2, r * 2.6]);
  if (opt.spikes) for (const s of segs.slice(-2)) for (const sx of [1, -1]) P(s, GEO.cone, K.horn, [sx * r * .6, len / 12, 0], [r * .4, r * 3.5, r * .4], [0, 0, -sx * 1.2]);
  rig.tail = segs; rig.tailBase = base; rig.tailAngle = base.rotation.x;
}
function wings(parent, pos, span, chord, mat, rig, type = 'feather', opt = {}) {
  for (const sx of [1, -1]) {
    const w = G(parent, [sx * pos[0], pos[1], pos[2]]);
    const inner = G(w, [0, 0, 0]);
    if (type === 'membrane') {
      P(inner, GEO.limb, opt.boneMat || mat, [sx * span * .5, 0, 0], [span * .03, span, span * .03], [0, 0, sx * Math.PI / 2]);
      P(inner, GEO.sph, mat, [sx * span * .5, 0, -chord * .4], [span * .52, chord * .05, chord * .6]);
      for (let i = 0; i < 3; i++) P(inner, GEO.sph, mat, [sx * span * (.35 + i * .25), 0, -chord * .7], [span * .14, chord * .04, chord * .45]);
    } else if (type === 'insect') {
      P(inner, GEO.sph, mat, [sx * span * .55, 0, chord * .1], [span * .55, chord * .02, chord * .55]);
      if (opt.hind) P(inner, GEO.sph, opt.hindMat || mat, [sx * span * .42, 0, -chord * .55], [span * .42, chord * .02, chord * .42]);
    } else {
      P(inner, GEO.sph, mat, [sx * span * .45, 0, -chord * .1], [span * .5, chord * .1, chord * .5]);
      P(inner, GEO.sph, opt.tipMat || mat, [sx * span * .8, 0, -chord * .35], [span * .28, chord * .07, chord * .32]);
    }
    rig.wings.push({ g: w, sx, fold: opt.fold ?? 0 });
  }
}
function legPair(parent, x, y, z, len, r, mat, footMat, rig, front, opt = {}) {
  for (const sx of [1, -1]) {
    const hip = G(parent, [sx * x, y, z]);
    if (opt.sprawl) hip.rotation.z = sx * opt.sprawl;
    const L = opt.sprawl ? len / Math.cos(opt.sprawl) : len;
    P(hip, GEO.limb, mat, [0, 0, 0], [r, L, r]);
    if (footMat) P(hip, GEO.sph, footMat, [0, -L, r * .4], [r * 1.05, r * .7, r * (opt.footL || 1.4)]);
    if (opt.claws) for (let i = -1; i <= 1; i++) P(hip, GEO.cone, opt.claws, [i * r * .5, -L, r * 1.3], [r * .18, r * .7, r * .18], [Math.PI / 2, 0, 0]);
    rig.legs.push({ g: hip, ph: (sx > 0) === !!front ? 0 : Math.PI, front, sx });
  }
}

/* ---------------- PRESETS ---------------- */
const PRESETS = {};
function def(key, b, p) { PRESETS[key] = Object.assign({ b }, p); }
function ext(key, base, p) { PRESETS[key] = Object.assign({}, PRESETS[base], { extras: undefined }, PRESETS[base].extras ? { extras: PRESETS[base].extras.slice() } : {}, p); }

// ---- quadrupeds ----
def('deer', 'quad', { s: 1.6, legL: .58, legR: .045, bodyL: 1, bodyH: .44, bodyW: .36, neckL: .34, neckA: .45, neckR: .085, headR: .14, headL: 1.25, snoutL: .13, snoutR: .065, ears: 'side', earS: 1.2, tail: 'short', tailA: -.7, horns: 'antlers', hornS: 1, spd: 1.1 });
ext('elk', 'deer', { s: 2.1, hornS: 1.45, bodyH: .5, extras: ['ruff'] });
ext('moose', 'deer', { s: 2.5, legL: .72, bodyH: .6, headL: 1.7, snoutL: .2, snoutR: .1, horns: 'palmate', hornS: 1.2, extras: ['dewlap', 'hump'] });
ext('reindeer', 'deer', { s: 1.8, antlersBoth: true, hornS: 1.3, extras: ['ruff'] });
ext('stag', 'deer', { s: 2, antlersBoth: true, hornS: 1.6, eyeColor: '#3a6ad0' });
ext('spiritstag', 'deer', { s: 2.3, antlersBoth: true, hornS: 1.8, glow: true, glowColor: '#7affd0', aura: '#7affd0', glowEyes: '#bfffff' });
ext('muskdeer', 'deer', { s: 1.1, horns: null, extras: ['fangs'], ears: 'round' });
ext('waterdeer', 'deer', { s: 1.1, horns: null, extras: ['fangs'], ears: 'round', earS: 1.3 });
ext('muntjac', 'deer', { s: 1.1, horns: 'small', legL: .45 });
ext('pdavid', 'deer', { s: 1.9, tail: 'tuft', hornS: 1.3 });
ext('irishelk', 'deer', { s: 2.6, horns: 'palmate', hornS: 1.9, antlersBoth: true });
ext('gazelle', 'deer', { s: 1.3, legL: .6, legR: .035, horns: 'straight', hornS: .55, antlersBoth: true, pattern: 'flank', tail: 'thin', tailA: -2.6 });
ext('impala', 'gazelle', { s: 1.4, horns: 'lyre', hornS: 1 });
ext('addax', 'gazelle', { s: 1.6, horns: 'spiral', hornS: 1.2, pattern: null });
ext('oryx', 'gazelle', { s: 1.8, horns: 'straight', hornS: 1.1, pattern: 'flank', patternColor: '#2a2a2a', tail: 'horse' });
ext('kudu', 'gazelle', { s: 2, horns: 'spiral', hornS: 1.8, pattern: 'thinstripes', patternColor: '#ffffff' });
ext('wildebeest', 'deer', { s: 2, legL: .6, bodyH: .52, horns: 'boss', hornS: 1, antlersBoth: true, tail: 'horse', extras: ['beard', 'mane'], headL: 1.4 });
def('giraffe', 'quad', { s: 3.6, legL: .95, legR: .05, bodyL: .9, bodyH: .5, bodyW: .4, neckL: 1.15, neckA: .28, neckR: .07, headR: .12, headL: 1.5, snoutL: .12, snoutR: .07, ears: 'side', horns: 'ossicone', antlersBoth: true, tail: 'tuft', pattern: 'patches', patternBase: 'main', patternColor: 'second', extras: ['mane'], spd: .9 });
ext('okapi', 'giraffe', { s: 2.1, legL: .62, neckL: .38, neckA: .55, pattern: null, extras: ['legstripes'], ears: 'side', earS: 1.6, hornS: .6 });
ext('mokele', 'giraffe', { s: 4.5, legL: .5, legR: .12, bodyL: 1.3, bodyH: .7, bodyW: .6, neckL: 1.5, neckA: .7, neckR: .13, horns: null, ears: 'none', tail: 'heavy', tailL: 1.6, pattern: 'blotch', extras: [] });
def('horse', 'quad', { s: 2, legL: .62, legR: .055, bodyL: 1, bodyH: .48, bodyW: .38, neckL: .42, neckA: .5, neckR: .1, headR: .13, headL: 1.8, snoutL: .1, snoutR: .08, ears: 'pointy', earS: .8, tail: 'horse', tailA: -2.5, extras: ['mane'], spd: 1.3 });
ext('zebra', 'horse', { s: 1.8, pattern: 'stripes', patternColor: '#1a1a1a', extras: ['mohawk'] });
ext('pony', 'horse', { s: 1.35, legL: .45, bodyH: .55 });
ext('clydesdale', 'horse', { s: 2.6, extras: ['mane', 'feathers'] });
ext('przewalski', 'horse', { s: 1.8, extras: ['mohawk'], legC: 'accent' });
ext('donkey', 'horse', { s: 1.4, ears: 'long', earS: .65, tail: 'tuft', extras: ['mohawk'] });
ext('mule', 'donkey', { s: 1.6 });
ext('unicorn', 'horse', { s: 2.2, horns: 'unicorn', hornS: 1.3, glow: true, glowColor: '#ffd0f0', extras: ['mane', 'rainbowMane'], aura: '#ffc0f0' });
ext('qilin', 'horse', { s: 2.2, horns: 'unicorn', pattern: 'scales', glow: true, glowColor: '#ffb030', extras: ['flameMane'], aura: '#ffa030', tail: 'bushy' });
ext('flyingpig', 'horse', {});
def('camel1', 'quad', { s: 2.4, legL: .8, legR: .055, bodyL: 1, bodyH: .48, bodyW: .4, neckL: .55, neckA: .95, neckR: .09, headR: .12, headL: 1.6, snoutL: .12, snoutR: .08, ears: 'tiny', tail: 'tuft', extras: ['hump'], spd: .8 });
ext('camel2', 'camel1', { extras: ['hump2', 'shaggyNeck'] });
def('llama', 'quad', { s: 1.9, legL: .55, legR: .055, bodyL: .9, bodyH: .48, bodyW: .4, neckL: .6, neckA: .12, neckR: .09, headR: .12, headL: 1.3, snoutL: .1, snoutR: .07, ears: 'pointy', earS: 1.3, tail: 'stub', extras: ['woolly'], spd: .9 });
ext('alpaca', 'llama', { s: 1.5, extras: ['woolly', 'topknot'] });
ext('vicuna', 'llama', { s: 1.5, extras: [] });
def('cow', 'quad', { s: 2, legL: .45, legR: .07, bodyL: 1.1, bodyH: .6, bodyW: .52, neckL: .15, neckA: 1.05, neckR: .15, headR: .17, headL: 1.25, snoutL: .1, snoutR: .1, snoutC: 'pink', ears: 'side', horns: 'cow', antlersBoth: true, tail: 'tuft', tailA: -2.7, pattern: 'patches', patternColor: 'second', extras: ['udder'], spd: .7 });
ext('highland', 'cow', { s: 1.9, pattern: null, horns: 'wide', extras: ['shaggy', 'bangs'] });
ext('ox', 'cow', { s: 2.3, pattern: null, horns: 'wide', extras: [] });
ext('yak', 'cow', { s: 2.1, pattern: null, horns: 'wide', extras: ['shaggy', 'hump'], tail: 'horse' });
ext('waterbuffalo', 'cow', { s: 2.2, pattern: null, horns: 'swept', hornS: 1.2, extras: [] });
ext('buffalo', 'cow', { s: 2.3, pattern: null, horns: 'boss', extras: [] });
ext('bison', 'cow', { s: 2.4, pattern: null, horns: 'small', hornS: .6, hornColor: '#2a2420', extras: ['hump', 'shaggyFront', 'beard'], legL: .42, snoutC: 'accent' });
ext('muskox', 'cow', { s: 2, pattern: null, horns: 'boss', extras: ['shaggy'] });
ext('takin', 'cow', { s: 2, pattern: null, horns: 'hook', headL: 1.5, extras: ['shaggy'], snoutC: 'accent' });
def('pig', 'quad', { s: 1.2, legL: .22, legR: .06, bodyL: 1, bodyH: .58, bodyW: .55, neckL: 0, neckA: 1.4, headR: .21, headL: 1, snoutL: .08, snoutR: .1, snoutC: 'pink', nose: 'pig', ears: 'floppy', tail: 'curly', tailA: -1.3, spd: .7, hoofColor: '#d07a90' });
ext('minipig', 'pig', { s: .8, pattern: 'patches', patternColor: 'second' });
ext('flyingpig', 'pig', { s: 1.3, extras: ['wings'], flier: true, glow: true, glowColor: '#ffd0e0' });
ext('boar', 'pig', { s: 1.3, ears: 'pointy', extras: ['tusks', 'mohawk'], snoutC: 'accent', tail: 'thin', hoofColor: '#2a2420', nose: 'pig' });
ext('warthog', 'boar', { s: 1.3, extras: ['tusks', 'mane', 'warts'], tail: 'tuft', tailA: -.3 });
ext('javelina', 'boar', { s: 1, extras: ['collar'] });
ext('tapir', 'pig', { s: 1.8, legL: .35, nose: 'trunkShort', pattern: 'saddle', patternColor: 'second', ears: 'round', tail: 'stub', snoutC: 'main', hoofColor: '#222' });
def('hippo', 'quad', { s: 3, legL: .3, legR: .13, bodyL: 1.3, bodyH: .75, bodyW: .78, neckL: 0, neckA: 1.3, headR: .33, headL: 1.3, snoutL: .2, snoutR: .26, snoutC: 'main', ears: 'tiny', eyeY: .55, tail: 'stub', extras: ['nostrils'], spd: .6, swimmer: true });
def('rhino', 'quad', { s: 3, legL: .45, legR: .12, bodyL: 1.2, bodyH: .72, bodyW: .62, neckL: .05, neckA: 1.2, headR: .25, headL: 1.6, snoutL: .12, snoutR: .14, snoutC: 'main', ears: 'pointy', earS: .7, horns: 'nose2', hornS: 1.1, tail: 'thin', spd: .7 });
ext('woollyrhino', 'rhino', { s: 3.2, extras: ['shaggy'], hornS: 1.6 });
def('elephant', 'quad', { s: 3.8, legL: .7, legR: .14, bodyL: 1.1, bodyH: .82, bodyW: .72, neckL: .05, neckA: 1.1, headR: .32, headL: 1, snoutL: .05, snoutR: .1, snoutC: 'main', nose: 'trunk', ears: 'big', horns: 'tusks', tail: 'tuft', spd: .55 });
ext('mammoth', 'elephant', { s: 4.1, ears: 'tiny', horns: 'bigtusks', extras: ['shaggy', 'hump'] });
def('sheep', 'quad', { s: 1.1, legL: .36, legR: .045, legC: 'second', bodyL: .9, bodyH: .58, bodyW: .55, neckL: .1, neckA: 1, headR: .14, headL: 1.25, headC: 'second', snoutC: 'second', ears: 'floppy', earS: .8, earC: 'second', tail: 'fluffy', extras: ['woolly'], spd: .7 });
def('goat', 'quad', { s: 1.1, legL: .45, legR: .045, bodyL: .85, bodyH: .44, bodyW: .38, neckL: .22, neckA: .7, headR: .13, headL: 1.35, snoutL: .1, snoutR: .065, ears: 'side', horns: 'small', antlersBoth: true, tail: 'short', tailA: -.4, tailC: 'main', extras: ['beard'], spd: .9 });
ext('angora', 'goat', { extras: ['woolly', 'beard'], horns: 'curl', hornS: .7 });
ext('mountaingoat', 'goat', { s: 1.35, extras: ['beard', 'shaggy'], hornColor: '#1a1a1a' });
ext('ibex', 'goat', { s: 1.4, horns: 'scimitar', hornS: 1.4, hornColor: '#7a6a5a' });
ext('bighorn', 'goat', { s: 1.5, horns: 'curl', hornS: 1.25, hornColor: '#c8b090', extras: [] });
ext('markhor', 'goat', { s: 1.6, horns: 'corkscrew', hornS: 1.8, hornColor: '#6a5a4a', extras: ['beard', 'mane'] });
ext('tahr', 'goat', { s: 1.3, extras: ['mane', 'shaggy'], hornS: .6 });
ext('chamois', 'goat', { s: 1.2, horns: 'hook', hornS: 1, extras: ['facestripe'] });
def('dog', 'quad', { s: .95, legL: .36, legR: .05, bodyL: .82, bodyH: .4, bodyW: .34, neckL: .15, neckA: .85, neckR: .1, headR: .16, headL: 1.05, snoutL: .15, snoutR: .075, ears: 'floppy', tail: 'curlup', tailA: -1.3, spd: 1.3, rollable: true, pattern: 'patches', patternColor: 'second' });
ext('stbernard', 'dog', { s: 1.4, bodyH: .5, extras: ['barrel'] });
def('wolf', 'quad', { s: 1.35, legL: .42, legR: .05, bodyL: .9, bodyH: .42, bodyW: .34, neckL: .18, neckA: .8, neckR: .11, headR: .16, headL: 1.05, snoutL: .2, snoutR: .07, ears: 'pointy', tail: 'bushy', tailA: -2.3, tailTip: 'main', spd: 1.4, rollable: true, extras: ['ruff'] });
ext('fox', 'wolf', { s: .95, legL: .3, legC: 'accent', tailTip: 'white', extras: [], earS: 1.2 });
ext('arcticfox', 'fox', { s: .9, earS: .8, extras: ['ruff'] });
ext('fennec', 'fox', { s: .6, ears: 'fennec', tailTip: 'accent' });
ext('tibetanfox', 'fox', { s: .85, headR: .2, snoutL: .18, earS: .7 });
ext('coyote', 'wolf', { s: 1.1, extras: [] });
ext('dingo', 'wolf', { s: 1.1, extras: [], tailTip: 'white' });
ext('dhole', 'wolf', { s: 1, ears: 'round', earS: 1.3, tailTip: 'accent', extras: [] });
ext('hyena', 'wolf', { s: 1.35, bodyH: .5, frontTall: .12, pattern: 'spots', ears: 'round', earS: 1.2, tail: 'tuft', extras: ['mohawk'], rollable: false });
ext('wilddog', 'wolf', { s: 1.15, pattern: 'patches', patternColor: 'second', ears: 'round', earS: 1.6, tailTip: 'white', extras: [] });
ext('husky', 'wolf', { s: 1.1, tail: 'curlup', pattern: 'backstripe', patternBase: 'second', patternColor: 'main', extras: [], eyeColor: '#4a90d0' });
ext('frostwolf', 'wolf', { s: 1.9, glow: true, glowColor: '#8ad8ff', aura: '#8ad8ff', glowEyes: '#bff4ff' });
ext('chupacabra', 'wolf', { s: 1.1, ears: 'pointy', earS: 1.5, tail: 'thin', extras: ['spikesBack', 'fangs'], glowEyes: '#ff4040', rollable: false });
def('cat', 'quad', { s: .62, legL: .26, legR: .04, bodyL: .72, bodyH: .32, bodyW: .27, neckL: .08, neckA: .85, neckR: .08, headR: .15, headL: .95, snoutL: .05, snoutR: .07, ears: 'pointy', tail: 'curlup', tailA: -1.1, extras: ['whiskers'], eyeS: .32, spd: 1.2, rollable: true, eyeColor: '#3a8a3a', pattern: 'thinstripes' });
ext('bobcat', 'cat', { s: .95, ears: 'tufted', tail: 'stub', pattern: 'spots' });
ext('lynx', 'cat', { s: 1.05, legL: .34, ears: 'tufted', earS: 1.2, tail: 'stub', pattern: 'spots', extras: ['whiskers', 'ruff'] });
ext('caracal', 'cat', { s: .95, legL: .32, ears: 'tufted', earS: 1.5, pattern: null, tail: 'thin' });
ext('serval', 'cat', { s: .95, legL: .42, earS: 1.5, pattern: 'spots', tail: 'thin' });
ext('sandcat', 'cat', { s: .6, earS: 1.3, pattern: null });
ext('ocelot', 'cat', { s: .95, pattern: 'rosettes', tail: 'long' });
ext('cougar', 'cat', { s: 1.6, legL: .36, pattern: null, tail: 'long', tailA: -2.4, eyeColor: '#c89a2a' });
ext('lion', 'cat', { s: 2, legL: .4, bodyH: .42, headR: .19, pattern: null, tail: 'tuft', tailA: -2.5, extras: ['whiskers', 'mane'], maneMale: true, eyeColor: '#c88a1a', earS: .7 });
ext('tiger', 'cat', { s: 2.1, legL: .38, headR: .18, pattern: 'stripes', patternColor: '#1a1a1a', tail: 'long', tailA: -2.4, extras: ['whiskers', 'cheeks'], ears: 'round', eyeColor: '#d8a020' });
ext('leopard', 'cat', { s: 1.6, pattern: 'rosettes', tail: 'long', tailA: -2.4, ears: 'round', eyeColor: '#d8b020' });
ext('jaguar', 'leopard', { s: 1.7, bodyH: .36 });
ext('cheetah', 'cat', { s: 1.6, legL: .5, bodyH: .3, pattern: 'spots', tail: 'long', tailA: -2.4, ears: 'round', extras: ['whiskers', 'tearlines'] });
ext('snowleopard', 'leopard', { s: 1.5, pattern: 'rosettes', patternColor: '#4a4a4a', tailR: 1.6, eyeColor: '#7ab0c0' });
ext('cloudedleopard', 'leopard', { s: 1.3, pattern: 'clouds' });
ext('panther', 'leopard', { s: 1.7, pattern: null, glowEyes: '#f2e030' });
ext('spiritpanther', 'panther', { s: 2.1, glow: true, glowColor: '#a070ff', aura: '#b080ff', glowEyes: '#e0c0ff' });
ext('smilodon', 'cat', { s: 2, legL: .38, headR: .19, tail: 'stub', pattern: null, extras: ['whiskers', 'sabers'] });
ext('manticore', 'lion', { s: 2.7, extras: ['mane', 'wings', 'scorpTail'], maneMale: false, tail: 'none', flier: true });
ext('sphinx', 'lion', { s: 3.2, extras: ['mane', 'headdress', 'wings'], maneMale: false, sitter: true });
ext('griffin', 'lion', { s: 2.7, extras: ['wings', 'eagleHead'], maneMale: false, flier: true, ears: 'none' });
def('bear', 'quad', { s: 2, legL: .36, legR: .12, bodyL: 1, bodyH: .64, bodyW: .6, neckL: .1, neckA: .9, neckR: .2, headR: .24, headL: 1, snoutL: .12, snoutR: .1, ears: 'round', tail: 'stub', spd: .8, rollable: true, standUp: true });
ext('grizzly', 'bear', { s: 2.4, extras: ['hump'] });
ext('polarbear', 'bear', { s: 2.6, headL: 1.3, neckL: .22, ears: 'round', earS: .7, swimmer: true });
ext('cavebear', 'bear', { s: 2.7, extras: ['hump'] });
ext('moonbear', 'bear', { s: 2, extras: ['chestMoon'], earS: 1.4 });
ext('sunbear', 'bear', { s: 1.4, extras: ['chestMoon'], snoutC: 'second' });
ext('spectacledbear', 'bear', { s: 1.7, extras: ['spectacles'] });
ext('panda', 'bear', { s: 1.8, legC: 'second', earC: 'second', extras: ['pandaMarks'], pattern: 'panda', patternColor: 'second', snoutC: 'main' });
def('redpanda', 'quad', { s: .85, legL: .2, legR: .06, legC: 'accent', bodyL: .75, bodyH: .38, bodyW: .34, neckL: .08, neckA: .9, headR: .16, headL: 1, snoutL: .06, snoutR: .07, snoutC: 'second', ears: 'pointy', earC: 'second', tail: 'ringed', tailA: -2.2, tailR: 1.5, extras: ['facemask'], spd: .9 });
def('raccoon', 'quad', { s: .75, legL: .2, legR: .05, legC: 'accent', bodyL: .7, bodyH: .44, bodyW: .4, neckL: .05, neckA: 1, headR: .16, headL: 1, snoutL: .1, snoutR: .06, ears: 'pointy', tail: 'ringed', tailA: -2.3, extras: ['mask'], spd: .9 });
ext('coati', 'raccoon', { snoutL: .22, snoutR: .05, tail: 'ringed', tailA: -.6, extras: [], s: .85 });
ext('kinkajou', 'raccoon', { ears: 'round', tail: 'long', tailA: -2, extras: [], s: .65 });
ext('binturong', 'raccoon', { s: .95, ears: 'tufted', tail: 'long', extras: ['shaggy'] });
def('badger', 'quad', { s: .85, legL: .15, legR: .07, bodyL: .9, bodyH: .34, bodyW: .5, neckL: .05, neckA: 1.1, headR: .15, headL: 1.2, snoutL: .12, snoutR: .06, ears: 'tiny', tail: 'stub', extras: ['headStripe'], spd: .7 });
ext('wolverine', 'badger', { s: 1, tail: 'bushy', tailTip: 'main', extras: [] });
ext('tasdevil', 'badger', { s: .75, ears: 'round', earS: 1.3, earC: 'pink', extras: ['chestBand'], tail: 'thin' });
ext('skunk', 'badger', { s: .6, legL: .18, bodyW: .38, tail: 'squirrel', tailR: 1.3, extras: ['backStripe'], ears: 'tiny' });
def('otter', 'quad', { s: 1.1, legL: .14, legR: .05, bodyL: 1.25, bodyH: .3, bodyW: .3, neckL: .2, neckA: .6, neckR: .1, headR: .13, headL: 1, snoutL: .06, snoutR: .07, ears: 'tiny', tail: 'heavy', tailL: .6, tailR: .09, tailA: -1.9, extras: ['whiskers'], spd: 1.1, swimmer: true, gait: 'bound' });
ext('ermine', 'otter', { s: .55, tailTipDark: true, swimmer: false });
ext('marten', 'otter', { s: .75, tail: 'bushy', tailL: .45, tailTip: 'main', swimmer: false, ears: 'round' });
ext('sable', 'marten', {});
def('rabbit', 'quad', { s: .55, legL: .14, legR: .05, bodyL: .62, bodyH: .52, bodyW: .46, neckL: 0, neckA: 1.2, headR: .18, headL: 1, snoutL: .04, snoutR: .08, nose: 'pink', ears: 'long', tail: 'fluffy', tailA: -1.6, extras: ['whiskers', 'buckteeth'], gait: 'hop', spd: 1.1 });
ext('hare', 'rabbit', { s: .72, legL: .2, earS: 1.25 });
ext('jackrabbit', 'hare', { earS: 1.6 });
ext('jackalope', 'hare', { s: .85, horns: 'antlers', hornS: .7, antlersBoth: true, glow: true, glowColor: '#ffe0a0' });
ext('bilby', 'rabbit', { s: .5, snoutL: .14, earS: 1.1, tail: 'tuft' });
ext('pika', 'rabbit', { s: .32, ears: 'round', earS: 1.1 });
ext('quokka', 'rabbit', { s: .5, ears: 'round', earS: 1.1, tail: 'thin', extras: ['smile'] });
def('squirrel', 'quad', { s: .45, legL: .12, legR: .04, bodyL: .55, bodyH: .34, bodyW: .3, neckL: .04, neckA: 1, headR: .15, headL: 1, snoutL: .04, snoutR: .06, ears: 'pointy', earS: .8, tail: 'squirrel', tailA: -1.3, tailR: 1.2, tailL: .7, extras: ['buckteeth'], gait: 'hop', spd: 1.3 });
ext('chipmunk', 'squirrel', { s: .36, extras: ['backStripes', 'buckteeth'], tailR: .9 });
ext('flyingsquirrel', 'squirrel', { extras: ['membrane'], s: .42 });
ext('sugarglider', 'flyingsquirrel', { s: .38, extras: ['membrane', 'backStripe'], ears: 'round', earS: 1.3, eyeS: .4 });
ext('marmot', 'squirrel', { s: .65, bodyH: .45, bodyW: .42, tail: 'bushy', tailL: .35, tailTip: 'main', ears: 'tiny', gait: 'walk' });
ext('numbat', 'squirrel', { s: .5, snoutL: .12, pattern: 'bands', patternColor: '#ffffff', tail: 'bushy', tailTip: 'main', gait: 'walk' });
def('mouse', 'quad', { s: .3, legL: .08, legR: .035, bodyL: .55, bodyH: .32, bodyW: .3, neckL: 0, neckA: 1.2, headR: .15, headL: 1.25, snoutL: .08, snoutR: .05, nose: 'pink', ears: 'round', earS: 1.6, earC: 'pink', tail: 'thin', tailC: 'pink', tailL: .7, tailA: -1.9, extras: ['whiskers'], spd: 1.3 });
ext('rat', 'mouse', { s: .42, earS: 1.1 });
ext('hamster', 'mouse', { s: .32, bodyL: .5, bodyH: .45, bodyW: .45, headR: .2, ears: 'round', earS: .8, tail: 'stub', extras: ['cheeks'] });
ext('guineapig', 'hamster', { s: .42, bodyL: .65, tail: 'none', pattern: 'patches', patternColor: 'second' });
ext('lemming', 'hamster', { s: .3, pattern: 'backstripe', patternColor: '#3a2a1a' });
ext('chinchilla', 'mouse', { s: .45, bodyH: .42, earS: 1.8, earC: 'main', tail: 'bushy', tailL: .35, tailTip: 'main', tailC: 'main' });
ext('jerboa', 'mouse', { s: .35, gait: 'hop', earS: 2, tail: 'tuft', tailL: 1.1, tailC: 'main', backTall: .2 });
ext('kangaroorat', 'jerboa', { earS: 1.2 });
ext('muskrat', 'mouse', { s: .6, ears: 'tiny', tailC: 'dark', swimmer: true });
ext('nutria', 'mouse', { s: .75, ears: 'tiny', tailC: 'dark', extras: ['buckteeth', 'whiskers'], swimmer: true });
ext('possum', 'mouse', { s: .55, earS: 1.1, tail: 'long', tailC: 'pink', extras: ['whiskers'] });
ext('opossum', 'possum', { snoutL: .16 });
def('beaver', 'quad', { s: .85, legL: .16, legR: .06, legC: 'accent', bodyL: .85, bodyH: .48, bodyW: .45, neckL: 0, neckA: 1.2, headR: .17, headL: 1, snoutL: .06, snoutR: .08, ears: 'tiny', tail: 'flat', tailA: -1.75, tailL: .5, tailR: .1, extras: ['buckteeth'], spd: .7, swimmer: true });
def('capybara', 'quad', { s: 1.25, legL: .25, legR: .07, bodyL: 1, bodyH: .55, bodyW: .5, neckL: .05, neckA: 1.1, headR: .2, headL: 1.4, snoutL: .1, snoutR: .12, snoutC: 'main', ears: 'tiny', tail: 'none', spd: .6, swimmer: true });
def('porcupine', 'quad', { s: .85, legL: .15, legR: .06, legC: 'accent', bodyL: .8, bodyH: .5, bodyW: .5, neckL: 0, neckA: 1.2, headR: .15, snoutL: .06, snoutR: .07, ears: 'tiny', tail: 'stub', extras: ['quills'], spd: .5 });
ext('hedgehog', 'porcupine', { s: .45, legL: .08, extras: ['spines'], snoutL: .12, snoutR: .05, snoutC: 'second', nose: 'dark' });
ext('echidna', 'hedgehog', { s: .6, nose: 'beakLong', extras: ['spines'] });
def('armadillo', 'quad', { s: .6, legL: .14, legR: .045, bodyL: .8, bodyH: .44, bodyW: .42, neckL: 0, neckA: 1.2, headR: .13, headL: 1.4, snoutL: .16, snoutR: .05, ears: 'pointy', earS: .9, tail: 'heavy', tailL: .45, tailR: .05, pattern: 'bands', patternColor: 'accent', extras: ['shellBands'], spd: .6 });
ext('pangolin', 'armadillo', { s: .95, pattern: 'scales', ears: 'none', headR: .1, tailL: .9, tailR: .12, extras: ['scales'] });
ext('aardvark', 'armadillo', { s: 1.25, pattern: null, ears: 'long', earS: .8, snoutL: .3, snoutR: .07, tailL: .7, tailR: .12, extras: [], legL: .25 });
ext('glyptodon', 'armadillo', { s: 2.2, pattern: 'scales', extras: ['domeShell'], tail: 'heavy', tailClub: true, ears: 'tiny' });
def('wombat', 'quad', { s: .85, legL: .15, legR: .07, bodyL: .8, bodyH: .52, bodyW: .52, neckL: 0, neckA: 1.2, headR: .2, headL: .9, snoutL: .05, snoutR: .1, snoutC: 'accent', ears: 'pointy', earS: .6, tail: 'none', spd: .6 });
def('platypus', 'quad', { s: .65, legL: .1, legR: .05, sprawl: .6, legC: 'accent', bodyL: .9, bodyH: .3, bodyW: .38, neckL: 0, neckA: 1.4, headR: .13, headL: 1, nose: 'bill', ears: 'none', tail: 'flat', tailA: -1.6, tailL: .45, tailR: .1, spd: .7, swimmer: true });
def('koala', 'quad', { s: .75, legL: .22, legR: .07, bodyL: .62, bodyH: .52, bodyW: .5, neckL: 0, neckA: 1.1, headR: .22, headL: .9, snoutL: .02, snoutR: .07, nose: 'bigBlack', ears: 'round', earS: 1.5, earC: 'second', tail: 'none', spd: .4, sitter: true });
ext('dropbear', 'koala', { s: .95, extras: ['fangs'], glowEyes: '#ff3030' });
def('sloth', 'quad', { s: .95, legL: .42, legR: .055, bodyL: .7, bodyH: .48, bodyW: .45, neckL: .05, neckA: 1, headR: .17, headL: .9, snoutL: .03, snoutR: .07, snoutC: 'second', ears: 'none', tail: 'stub', extras: ['slothFace', 'shaggy'], spd: .2, claws: true });
ext('giantsloth', 'sloth', { s: 2.8, bodyH: .62, tail: 'heavy', tailL: .6, tailR: .14, spd: .3 });
// lizards & reptiles (quad sprawl)
def('lizard', 'quad', { s: .75, legL: .15, legR: .045, sprawl: .85, bodyL: 1, bodyH: .24, bodyW: .3, neckL: .05, neckA: 1.35, headR: .12, headL: 1.45, snoutL: .1, snoutR: .07, snoutC: 'main', ears: 'none', tail: 'heavy', tailL: 1.1, tailR: .1, tailA: -1.75, eyeS: .3, gait: 'scuttle', spd: 1.1, claws: true });
ext('iguana', 'lizard', { s: 1.05, extras: ['spinesBack', 'dewlap'] });
ext('gecko', 'lizard', { s: .45, eyeS: .45, pattern: 'spots', extras: [] });
ext('chameleon', 'lizard', { s: .6, legL: .25, sprawl: .25, tail: 'curlup', tailA: -1.8, extras: ['casque'], eyeS: .42, spd: .25, chameleon: true });
ext('monitor', 'lizard', { s: 1.6, neckL: .2, neckA: 1.1, pattern: 'dots' });
ext('goanna', 'monitor', { s: 1.3, pattern: 'bands' });
ext('gila', 'lizard', { s: .85, bodyW: .36, pattern: 'blotch', patternColor: 'second' });
ext('hornedlizard', 'lizard', { s: .45, bodyW: .5, tailL: .4, extras: ['crownSpikes'] });
ext('thornydevil', 'lizard', { s: .45, bodyW: .45, tailL: .5, extras: ['spikesAll'], pattern: 'blotch' });
ext('frilledlizard', 'lizard', { s: .8, extras: ['frill'] });
ext('beardeddragon', 'lizard', { s: .7, bodyW: .4, extras: ['beardSpikes'] });
ext('uromastyx', 'lizard', { s: .7, bodyW: .4, tailSpikes: true, tailL: .6, tailR: .14 });
ext('salamander', 'lizard', { s: .42, eyeS: .28, pattern: 'spots', patternColor: 'second', claws: false });
ext('newt', 'salamander', { s: .36, pattern: 'dots' });
ext('axolotl', 'salamander', { s: .55, pattern: null, extras: ['gills', 'smile'], swimmer: true });
ext('giantsalamander', 'salamander', { s: 1.4, bodyW: .42, pattern: 'blotch', swimmer: true });
ext('dimetrodon', 'lizard', { s: 1.9, extras: ['sail'], legL: .22, sprawl: .6 });
ext('crocodile', 'lizard', { s: 3, bodyL: 1.4, bodyH: .26, bodyW: .4, headL: 2.6, headR: .14, snoutL: .3, snoutR: .1, tailL: 1.5, tailR: .16, extras: ['scutes', 'teeth'], eyeY: .5, spd: .6, swimmer: true, jaw: true });
ext('alligator', 'crocodile', { s: 2.8, snoutR: .13 });
ext('caiman', 'crocodile', { s: 2, extras: ['scutes', 'teeth', 'brow'] });
def('turtle', 'quad', { s: .55, legL: .1, legR: .06, sprawl: .9, legC: 'main', bodyL: .7, bodyH: .26, bodyW: .55, neckL: .12, neckA: 1.3, neckR: .07, headR: .1, headL: 1.2, snoutL: .03, snoutR: .05, snoutC: 'main', ears: 'none', tail: 'stub', extras: ['shell'], shellH: .55, spd: .2, pattern: null, shellPat: 'scales' });
ext('tortoise', 'turtle', { s: .85, shellH: .8 });
ext('snapping', 'turtle', { s: .8, shellH: .45, extras: ['shell', 'ridges'], headR: .14 });
ext('softshell', 'turtle', { s: .65, shellH: .25, snoutL: .1, shellPat: 'dots' });
ext('seaturtle', 'turtle', { s: 1.4, shellH: .4, extras: ['shell', 'flippers'], swimmer: true, swimOnly: true });
// dinosaurs (quad)
def('triceratops', 'quad', { s: 3.5, legL: .45, legR: .13, bodyL: 1.2, bodyH: .66, bodyW: .6, neckL: .06, neckA: 1.25, headR: .3, headL: 1.35, snoutL: .12, snoutR: .1, snoutC: 'main', nose: 'beak', horns: 'tricera', ears: 'none', tail: 'heavy', tailL: .9, tailR: .2, tailA: -1.8, spd: .55 });
def('stegosaurus', 'quad', { s: 3.5, legL: .52, legR: .12, frontTall: -.22, bodyL: 1.2, bodyH: .62, bodyW: .5, neckL: .2, neckA: 1.4, neckR: .1, headR: .12, headL: 1.5, snoutL: .1, snoutR: .06, snoutC: 'main', ears: 'none', tail: 'heavy', tailL: 1.1, tailR: .18, tailA: -1.6, tailSpikes: true, extras: ['plates'], spd: .5 });
def('ankylosaurus', 'quad', { s: 3.1, legL: .3, legR: .14, bodyL: 1.2, bodyH: .5, bodyW: .82, neckL: .03, neckA: 1.3, headR: .2, headL: 1.2, snoutL: .06, snoutR: .1, snoutC: 'main', ears: 'none', tail: 'heavy', tailL: 1, tailR: .14, tailA: -1.65, tailClub: true, extras: ['armor'], spd: .45 });
def('brachiosaurus', 'quad', { s: 6.5, legL: .9, legR: .12, frontTall: .3, bodyL: 1.2, bodyH: .62, bodyW: .55, neckL: 1.9, neckA: .25, neckR: .11, headR: .13, headL: 1.4, snoutL: .07, snoutR: .07, snoutC: 'main', ears: 'none', tail: 'heavy', tailL: 1.3, tailR: .17, tailA: -1.85, extras: ['crestNose'], spd: .4, pattern: 'blotch' });
ext('diplodocus', 'brachiosaurus', { s: 6.5, frontTall: -.05, neckL: 1.8, neckA: .85, tailL: 2.2, extras: [], pattern: 'bands' });
ext('titanosaur', 'brachiosaurus', { s: 8.5, neckA: .55, extras: ['armorDots'], glowEyes: '#ffd060' });
def('dragon', 'quad', { s: 4.2, legL: .5, legR: .12, bodyL: 1.25, bodyH: .58, bodyW: .55, neckL: .7, neckA: .55, neckR: .12, headR: .2, headL: 1.6, snoutL: .2, snoutR: .1, snoutC: 'main', ears: 'none', horns: 'dragon', antlersBoth: true, tail: 'heavy', tailL: 1.8, tailR: .16, tailA: -1.85, extras: ['wings', 'spikesBack', 'teeth'], claws: true, flier: true, glowEyes: '#ffd040', breath: '#ff6a10', spd: .8, pattern: 'scales', patternColor: 'second' });
ext('frostdragon', 'dragon', { breath: '#9ae8ff', glow: true, glowColor: '#9ae8ff', glowEyes: '#d0ffff' });
ext('hydra', 'dragon', { s: 3.8, extras: ['spikesBack', 'hydraHeads'], flier: false, neckL: .8, breath: '#7aff6a' });
// ---- bipeds ----
def('monkey', 'biped', { s: 1, legL: .32, legR: .045, torsoH: .38, torsoW: .26, torsoD: .24, lean: .45, armL: .45, armR: .04, headR: .14, snoutL: .04, snoutR: .07, snoutC: 'second', faceC: 'second', ears: 'round', earS: .8, tail: 'long', tailL: .8, tailR: .03, tailA: -2.3, curl: -.3, spd: 1, climber: true });
ext('spidermonkey', 'monkey', { armL: .6, legL: .38 });
ext('howler', 'monkey', { s: 1.1, extras: ['beard'] });
ext('macaque', 'monkey', { s: .95, tail: 'stub', faceC: 'pink', snoutC: 'pink' });
ext('baboon', 'monkey', { s: 1.25, lean: 1.15, knuckle: true, snoutL: .16, snoutR: .07, tail: 'long', tailA: -1.2, tailL: .5, extras: ['mane'] });
ext('mandrill', 'baboon', { extras: ['mane', 'colorFace'], tail: 'stub' });
ext('gibbon', 'monkey', { armL: .85, tail: 'none', lean: .15, faceC: 'dark', extras: ['cheekRing'] });
ext('snubmonkey', 'monkey', { faceC: 'accent', snoutC: 'accent', extras: ['shaggy'], tail: 'long' });
ext('tamarin', 'monkey', { s: .45, extras: ['mustache'], faceC: 'dark', snoutC: 'dark' });
ext('marmoset', 'monkey', { s: .4, ears: 'tufted', earC: 'second', tail: 'ringed', tailR: .05 });
ext('tarsier', 'monkey', { s: .35, eyeS: .62, legL: .45, ears: 'round', earS: 1.4, tail: 'thin', faceC: 'main', snoutC: 'main', hopper: true });
ext('lemur', 'monkey', { s: .85, snoutL: .12, snoutC: 'dark', tail: 'ringed', tailL: 1, tailA: -1.4, tailR: .06, eyeColor: '#f2a020', extras: ['mask'] });
ext('bushbaby', 'monkey', { s: .4, eyeS: .5, ears: 'round', earS: 1.6, tail: 'bushy', hopper: true, eyeColor: '#a0602a' });
ext('loris', 'monkey', { s: .45, eyeS: .52, tail: 'none', extras: ['mask'], spd: .25, eyeColor: '#7a4a1a' });
ext('ayeaye', 'monkey', { s: .6, eyeS: .45, ears: 'round', earS: 2.4, tail: 'bushy', extras: ['shaggy'], eyeColor: '#f2c230' });
ext('nightmonkey', 'monkey', { s: .5, eyeS: .55, eyeColor: '#c8902a', tail: 'long' });
ext('chimp', 'monkey', { s: 1.35, lean: .75, knuckle: true, armL: .55, torsoW: .34, ears: 'round', earS: 1.3, tail: 'none', faceC: 'second' });
ext('gorilla', 'chimp', { s: 2, lean: .9, torsoW: .5, torsoH: .45, armL: .62, armR: .07, legR: .07, ears: 'tiny', faceC: 'dark', snoutC: 'dark', extras: ['silverback', 'brow'] });
ext('titanape', 'gorilla', { s: 6.5, glowEyes: '#ff5a3a' });
ext('orangutan', 'chimp', { s: 1.7, lean: .55, armL: .85, extras: ['shaggy', 'cheekPads'], faceC: 'pink' });
ext('yeti', 'gorilla', { s: 2.8, lean: .2, knuckle: false, faceC: 'accent', snoutC: 'accent', extras: ['shaggy', 'fangs'], eyeColor: '#2a4a8a' });
ext('bigfoot', 'yeti', { s: 2.7, faceC: 'second', snoutC: 'second', extras: ['shaggy', 'bigFeet'], eyeColor: '#1a1410' });
ext('swampmonster', 'yeti', { s: 2.5, lean: .4, extras: ['moss', 'drips'], glowEyes: '#d0ff60', faceC: 'main' });
def('kangaroo', 'biped', { s: 1.7, legL: .34, legR: .07, footL: 2.6, torsoH: .45, torsoW: .3, torsoD: .3, lean: .55, armL: .2, armR: .035, headR: .13, snoutL: .1, snoutR: .07, ears: 'long', earS: .55, tail: 'kangaroo', tailL: .9, tailR: .09, tailA: -2, hopper: true, extras: ['pouch'], spd: 1.3 });
ext('wallaby', 'kangaroo', { s: 1.2 });
ext('redkangaroo', 'kangaroo', { s: 2 });
ext('treekangaroo', 'kangaroo', { s: 1.1, legL: .26, tail: 'long', tailL: .8, tailR: .05, ears: 'round', earS: .9 });
def('meerkat', 'biped', { s: .55, legL: .14, legR: .04, torsoH: .4, torsoW: .2, torsoD: .2, lean: 0, armL: .16, armR: .03, headR: .1, snoutL: .07, snoutR: .05, ears: 'tiny', tail: 'thin', tailL: .4, tailR: .025, tailA: -2.6, extras: ['mask'], spd: 1.2, sentry: true });
def('theropod', 'biped', { s: 2, legL: .55, legR: .09, footL: 1.6, torsoH: .5, torsoW: .34, torsoD: .5, lean: 1.25, armL: .18, armR: .035, headR: .17, snoutL: .24, snoutR: .1, snoutC: 'main', ears: 'none', tail: 'heavy', tailL: 1.4, tailR: .14, tailA: -1.65, jaw: true, extras: ['teeth'], claws: true, spd: 1.1, roarer: true });
ext('compy', 'theropod', { s: .75, extras: [], tailL: 1.2 });
ext('raptor', 'theropod', { s: 1.6, extras: ['feathersArms', 'teeth'], armL: .26 });
ext('dilopho', 'theropod', { s: 2.3, extras: ['doubleCrest', 'teeth', 'frillNeck'] });
ext('allosaurus', 'theropod', { s: 3.6, extras: ['teeth', 'brow'] });
ext('trex', 'theropod', { s: 5, headR: .3, snoutL: .25, snoutR: .16, armL: .11, torsoD: .55, extras: ['teeth', 'brow'] });
ext('spinosaurus', 'theropod', { s: 5.5, snoutL: .4, snoutR: .07, extras: ['sail', 'teeth'], armL: .3 });
ext('iguanodon', 'theropod', { s: 3, lean: .9, armL: .35, armR: .05, jaw: false, extras: ['thumbSpike'], roarer: false, spd: .7 });
ext('parasaur', 'iguanodon', { extras: ['tubeCrest'], roarer: true });
ext('pachy', 'iguanodon', { s: 2, extras: ['dome'], snoutL: .1 });
ext('kaiju', 'theropod', { s: 9, lean: .22, legL: .5, legR: .14, torsoH: .7, torsoW: .5, torsoD: .45, armL: .38, armR: .07, headR: .17, snoutL: .16, snoutR: .1, tailL: 2, tailR: .2, tailA: -2.6, extras: ['dorsalPlates', 'teeth'], glowColor: '#7fe8ff', breath: '#7fe8ff', spd: .5, stomp: true });
def('golem', 'biped', { s: 3, legL: .4, legR: .14, torsoH: .6, torsoW: .55, torsoD: .4, lean: .15, armL: .55, armR: .12, headR: .2, ears: 'none', tail: 'none', blocky: true, glowEyes: '#ffb030', spd: .4, stomp: true });
def('mermaid', 'special', { s: 1.7, swimmer: true, swimOnly: true });
def('fairy', 'special', { s: .55, flier: true, glow: true, glowColor: '#ffd0ff' });
def('sponge', 'special', { s: 1.1, spd: 1 });
def('wisp', 'special', { s: .9, flier: true, glow: true });
// ---- birds ----
def('bird', 'bird', { s: .4, bodyR: .25, bodyL: 1.25, upright: .25, legL: .14, legR: .018, neckL: .06, headR: .12, beak: 'cone', beakL: .1, wingS: 1, tail: 'short', spd: 1, beakColor: '#e8a020' });
ext('songbird', 'bird', { s: .32 });
ext('woodpecker', 'bird', { s: .38, crest: 'tuft', crestC: 'accent', beakL: .16, beakColor: '#3a3a3a', tail: 'short' });
ext('bluejay', 'bird', { s: .36, crest: 'tuft', crestC: 'main' });
ext('cardinal', 'bird', { s: .34, crest: 'tuft', crestC: 'main', beakColor: '#ff7a2a', extras: ['mask'] });
ext('canary', 'bird', { s: .28 });
ext('quail', 'bird', { s: .32, bodyL: 1.05, crest: 'topknot', legL: .08, pattern: 'dots', patternColor: '#ffffff', flightless: true });
ext('ptarmigan', 'quail', { s: .4, crest: null, extras: ['featherFeet'], pattern: null });
ext('capercaillie', 'ptarmigan', { s: .8, tail: 'fan', beakColor: '#e8e0c0', extras: ['wattleEye'] });
ext('pigeon', 'bird', { s: .42, beakColor: '#5a5a5a', headBob: true, pattern: 'bands', patternColor: 'accent' });
ext('dove', 'pigeon', { s: .4, pattern: null, beakColor: '#c08070' });
ext('raven', 'bird', { s: .5, beakL: .17, beakColor: '#1a1a1a', tail: 'long', headBob: true });
ext('parakeet', 'bird', { s: .34, beak: 'hook', beakColor: '#f0e0c0', tail: 'long', tailL: 1.4, upright: .45, flier: true });
ext('cockatiel', 'parakeet', { crest: 'tall', crestC: 'second', extras: ['cheekDots'] });
ext('lovebird', 'parakeet', { s: .3, headC: 'second', beakColor: '#e04a2a', tail: 'short' });
ext('parrot', 'parakeet', { s: .5, beakL: .14, tail: 'short', tailC: 'accent', beakColor: '#2a2a2a' });
ext('macaw', 'parakeet', { s: .8, beakL: .18, tail: 'long', tailL: 2, beakColor: '#e8e0d0', extras: ['faceWhite'] });
ext('cockatoo', 'parakeet', { s: .55, crest: 'tall', crestC: 'second', beakColor: '#2a2a2a', tail: 'short' });
ext('galah', 'cockatoo', { s: .45, headC: 'second', bellyC: 'main' });
ext('toucan', 'bird', { s: .6, beak: 'big', beakL: .4, beakColor: '#f28a1a', beakTip: '#d03a1a', extras: ['bib'], flier: true });
ext('hornbill', 'toucan', { s: .75, beakColor: '#f2c230', extras: ['casque'], tail: 'long' });
ext('kookaburra', 'bird', { s: .5, beakL: .2, beakColor: '#3a3a3a', headR: .15, tail: 'long', extras: ['eyeStripe'] });
ext('kingfisher', 'bird', { s: .35, beakL: .22, beakColor: '#2a2a2a', headR: .14, tail: 'stub', flier: true, bellyC: 'second' });
ext('hummingbird', 'bird', { s: .25, beakL: .3, beak: 'needle', beakColor: '#1a1a1a', flier: true, hover: true, tail: 'short' });
ext('roadrunner', 'bird', { s: .55, crest: 'tuft', crestC: 'main', tail: 'long', tailL: 1.8, legL: .22, beakL: .16, flightless: true, spd: 2 });
def('owl', 'bird', { s: .65, bodyR: .3, bodyL: .95, upright: .9, legL: .08, neckL: 0, headR: .22, beak: 'hook', beakL: .05, beakColor: '#d8b060', eyesFront: true, eyeS: .42, eyeColor: '#1a1410', eyeWhite: '#f2c230', tail: 'stub', flier: true, spd: .7, facialDisc: true });
ext('snowyowl', 'owl', { s: .7, pattern: 'dots', patternColor: '#3a3a3a', eyeWhite: '#f2e030' });
def('raptorbird', 'bird', { s: 1, bodyR: .27, bodyL: 1.3, upright: .45, legL: .16, legR: .03, neckL: .04, headR: .14, beak: 'hook', beakL: .12, beakColor: '#f2c230', wingS: 1.6, tail: 'short', flier: true, legC: 'beak', spd: 1, soar: true });
ext('eagle', 'raptorbird', { headC: 'second' });
ext('baldeagle', 'raptorbird', { s: 1.05, headC: 'second', tailC: 'second' });
ext('hawk', 'raptorbird', { s: .8, bellyC: 'second' });
ext('falcon', 'raptorbird', { s: .62, extras: ['eyeStripe'] });
ext('harpy', 'raptorbird', { s: 1.1, crest: 'double', crestC: 'dark', headC: 'main', bellyC: 'second' });
ext('vulture', 'raptorbird', { s: 1, neckL: .12, headC: 'pink', extras: ['ruff'], beakColor: '#6a5a4a' });
ext('condor', 'vulture', { s: 1.25, extras: ['ruff'] });
ext('secretarybird', 'raptorbird', { s: 1.3, legL: .6, legC: 'beak', crest: 'quills', crestC: 'dark', tail: 'long', tailL: 1.6, flier: false, flightless: true });
ext('roc', 'raptorbird', { s: 3.8 });
ext('thunderbird', 'raptorbird', { s: 2.6, glow: true, glowColor: '#8ab0ff', aura: '#f2e030', crest: 'tall', crestC: 'accent' });
def('wader', 'bird', { s: 1.2, bodyR: .22, bodyL: 1.3, upright: .2, legL: .62, legR: .015, neckL: .5, neckR: .035, neckS: true, headR: .09, beak: 'cone', beakL: .2, beakColor: '#f2c230', tail: 'short', flier: true, spd: .7, legC: 'beakish' });
ext('heron', 'wader', { crest: 'plume', crestC: 'dark' });
ext('egret', 'wader', { s: 1.05, crest: 'plume', crestC: 'main' });
ext('stork', 'wader', { s: 1.2, beakColor: '#ff5a2a', wingTip: 'second' });
ext('crane', 'wader', { s: 1.4, crest: 'cap', crestC: 'accent', beakColor: '#8a8a7a', tailC: 'second' });
ext('crownedcrane', 'crane', { crest: 'crown', crestC: 'accent', extras: ['cheekWhite'] });
ext('ibis', 'wader', { s: 1, beak: 'curved', beakL: .28, beakColor: '#d32f2f', headC: 'accent' });
ext('spoonbill', 'wader', { s: 1.05, beak: 'spoon', beakL: .26, beakColor: '#8a7a6a' });
ext('flamingo', 'wader', { s: 1.35, legL: .7, neckL: .6, beak: 'flamingo', beakL: .14, beakColor: '#f8e0e0', legC: 'main', tailC: 'accent' });
ext('shoebill', 'wader', { s: 1.35, neckL: .25, headR: .16, beak: 'shoe', beakL: .28, beakColor: '#c8b080', flier: false });
ext('pelican', 'wader', { s: 1.2, legL: .25, neckL: .3, headR: .1, beak: 'pouch', beakL: .5, beakColor: '#f2b030', swimmer: true });
def('waterfowl', 'bird', { s: .5, bodyR: .26, bodyL: 1.35, upright: .1, legL: .1, legC: 'beak', neckL: .14, neckR: .07, headR: .12, beak: 'flat', beakL: .12, beakColor: '#f2a020', tail: 'stub', swimmer: true, waddle: true, flier: true });
ext('duck', 'waterfowl', {});
ext('mallard', 'waterfowl', { headC: 'second', beakColor: '#f2c230', extras: ['neckRing'] });
ext('mandarinduck', 'waterfowl', { s: .45, crest: 'mane', crestC: 'main', headC: 'accent', extras: ['sails'] });
ext('goose', 'waterfowl', { s: .75, neckL: .3, neckS: true, headC: 'second' });
ext('goldengoose', 'goose', { s: 1.3, glow: true, glowColor: '#ffe080', aura: '#ffe080', headC: 'main' });
ext('swan', 'waterfowl', { s: 1.15, neckL: .55, neckS: true, beakColor: '#ff7a2a', extras: ['beakKnob'] });
ext('blackswan', 'swan', { beakColor: '#d32f2f' });
def('fowl', 'bird', { s: .52, bodyR: .25, bodyL: 1.1, upright: .35, legL: .17, legC: 'beak', neckL: .07, headR: .11, beak: 'cone', beakL: .07, beakColor: '#f2b030', crest: 'comb', crestC: 'accent', extras: ['wattle'], tail: 'chicken', flightless: true, spd: .8, headBob: true });
ext('chicken', 'fowl', {});
ext('rooster', 'fowl', { s: .6, tail: 'sickle', tailC: 'second', headC: 'main' });
ext('megahen', 'fowl', { s: 3.2 });
ext('turkey', 'fowl', { s: .95, tail: 'fan', crest: null, headC: 'pink', extras: ['wattle', 'snood'] });
ext('peacock', 'fowl', { s: 1.05, crest: 'crown', crestC: 'accent', tail: 'peacock', tailC: 'second', extras: [], beakColor: '#7a7a6a', display: true });
ext('goldenpheasant', 'fowl', { s: .85, crest: 'mane', crestC: 'main', tail: 'long', tailL: 2.2, extras: ['cape'] });
ext('lyrebird', 'fowl', { s: .8, crest: null, tail: 'lyre', extras: [], display: true });
ext('birdofparadise', 'fowl', { s: .6, crest: null, tail: 'plumes', tailC: 'main', extras: [], display: true, flier: true });
def('penguin', 'bird', { s: .7, bodyR: .27, bodyL: 1.25, upright: 1, legL: .05, legC: 'beak', neckL: 0, headR: .16, beak: 'cone', beakL: .12, beakColor: '#2a2a2a', wing: 'flipper', tail: 'stub', flightless: true, waddle: true, swimmer: true, bellyC: 'second', spd: .5 });
ext('kingpenguin', 'penguin', { s: .95, beakColor: '#f2a030', extras: ['cheekPatch'] });
ext('emperorpenguin', 'kingpenguin', { s: 1.15 });
ext('rockhopper', 'penguin', { s: .5, beakColor: '#e0503a', extras: ['eyebrows'], hopper: true });
ext('puffin', 'penguin', { s: .45, upright: .75, beak: 'puffin', beakL: .1, beakColor: '#f28a1a', extras: ['faceWhite'], flier: true });
ext('tern', 'bird', { s: .45, beakColor: '#d32f2f', crest: 'cap', crestC: 'dark', tail: 'forked', wingS: 1.5, flier: true, soar: true });
ext('petrel', 'tern', { crest: null, beakColor: '#2a2a2a' });
def('ratite', 'bird', { s: 2.2, bodyR: .3, bodyL: 1.2, upright: .3, legL: .95, legR: .03, legC: 'pink', neckL: .8, neckR: .04, headR: .1, beak: 'cone', beakL: .1, beakColor: '#c8a080', wing: 'fluffy', tail: 'fluffy', flightless: true, spd: 1.6 });
ext('ostrich', 'ratite', { neckC: 'pink' });
ext('emu', 'ratite', { s: 1.8, wing: 'none', extras: ['shaggy'], neckC: 'accent' });
ext('cassowary', 'ratite', { s: 1.75, neckL: .5, extras: ['casqueHelmet', 'wattle'], neckC: 'second', wing: 'none' });
ext('moa', 'ratite', { s: 2.6, wing: 'none', extras: ['shaggy'] });
ext('terrorbird', 'ratite', { s: 2.4, neckL: .45, headR: .17, beak: 'hook', beakL: .25, beakColor: '#f2a030', extras: [] });
def('kiwi', 'bird', { s: .45, bodyR: .3, bodyL: 1.1, upright: .1, legL: .1, legC: 'second', neckL: 0, headR: .12, beak: 'needle', beakL: .35, beakColor: '#e8d8b0', wing: 'none', tail: 'none', flightless: true, extras: ['shaggy'], spd: .8 });
ext('dodo', 'kiwi', { s: .75, bodyR: .33, beak: 'hook', beakL: .2, beakColor: '#e8d8a0', legL: .14, tail: 'fluffy', extras: [], headR: .16 });
ext('archaeopteryx', 'bird', { s: .65, tail: 'long', tailL: 2, beakColor: '#5a5a5a', extras: ['teeth', 'wingClaws'], flier: true });
def('pteranodon', 'bird', { s: 2.2, bodyR: .2, bodyL: 1.4, upright: .5, legL: .14, neckL: .2, headR: .12, beak: 'needle', beakL: .55, beakColor: 'main', crest: 'ptero', crestC: 'accent', wing: 'membrane', wingS: 2.6, tail: 'stub', flier: true, soar: true, spd: 1 });
ext('quetzal', 'pteranodon', { s: 4.2, neckL: .55, beakL: .7, crest: 'ptero' });
def('phoenix', 'bird', { s: 1.6, bodyR: .26, bodyL: 1.25, upright: .4, legL: .16, neckL: .12, headR: .13, beak: 'hook', beakL: .1, beakColor: '#f2c230', crest: 'flame', crestC: 'accent', tail: 'plumes', tailC: 'accent', wingS: 1.7, flier: true, glow: true, glowColor: '#ff8a20', aura: '#ff7a10', fire: true, soar: true });
ext('fenghuang', 'phoenix', { glowColor: '#ffd040', aura: '#ffd040', tail: 'peacock', fire: false });
// ---- snakes & serpents ----
def('snake', 'snake', { s: 1, n: 14, r: .055, len: .09, headR: .085, pattern: 'zigzag', patternColor: 'accent', spd: .5 });
ext('rattlesnake', 'snake', { extras: ['rattle'], pattern: 'blotch' });
ext('sidewinder', 'snake', { s: .8, pattern: 'blotch', sidewind: true });
ext('python', 'snake', { s: 1.6, n: 18, r: .09, len: .1, headR: .12, pattern: 'blotch' });
ext('boa', 'python', { s: 1.5 });
ext('anaconda', 'python', { s: 2.1, pattern: 'spots', swimmer: true });
ext('moray', 'snake', { s: 1.3, swimmer: true, swimOnly: true, pattern: 'dots', extras: ['jawOpen', 'finRidge'], headR: .1 });
ext('caterpillar', 'snake', { s: .5, n: 9, r: .11, len: .12, headR: .11, pattern: null, bands: true, extras: ['antennae', 'stubLegs', 'spots'], spd: .3 });
ext('silkworm', 'caterpillar', { bands: false, extras: ['stubLegs', 'horn'] });
ext('glowworm', 'caterpillar', { glow: true, glowColor: '#a0ff80', extras: ['stubLegs'] });
ext('worm', 'snake', { s: .5, n: 10, r: .07, len: .1, headR: .07, pattern: 'rings', patternColor: 'second', noEyes: false, spd: .2 });
ext('centipede', 'snake', { s: .55, n: 12, r: .055, len: .08, headR: .06, pattern: null, bands: true, extras: ['manyLegs', 'antennae'], spd: .8 });
ext('easterndragon', 'snake', { s: 4.5, n: 22, r: .1, len: .1, headR: .14, pattern: 'scales', patternColor: 'second', extras: ['dragonHead', 'dragonLegs', 'finRidge'], flier: true, glowEyes: '#ffe040', spd: .7 });
ext('featheredserpent', 'easterndragon', { s: 4, extras: ['featherRuff', 'smallWings', 'finRidge'], glowEyes: '#ff6040', pattern: 'scales' });
ext('seaserpent', 'easterndragon', { s: 6, n: 22, r: .12, extras: ['dragonHead', 'finRidge'], swimmer: true, swimOnly: true, flier: false, glow: true, glowColor: '#80e0ff' });
ext('sandworm', 'snake', { s: 6, n: 12, r: .16, len: .14, headR: .17, pattern: 'rings', patternColor: 'second', extras: ['wormMouth'], noEyes: true, burrow: true, spd: .5 });
// ---- fish & sea mammals ----
def('fish', 'fish', { s: .5, bodyL: 1, bodyH: .42, bodyW: .22, tailFin: .35, dorsal: .2, spd: 1 });
ext('goldfish', 'fish', { s: .38, bodyH: .55, tailFin: .55, fancyTail: true });
ext('clownfish', 'fish', { s: .32, bodyH: .5, pattern: 'rings', patternColor: 'second' });
ext('betta', 'fish', { s: .34, tailFin: .8, fancyTail: true, dorsal: .45, extras: ['longFins'] });
ext('koi', 'fish', { s: .6, pattern: 'patches', patternBase: 'main', patternColor: 'second', extras: ['whiskers'] });
ext('catfish', 'fish', { s: .7, bodyH: .3, bodyW: .3, extras: ['whiskers'], pattern: 'spots' });
ext('gar', 'fish', { s: .9, bodyH: .2, snout: 'sword', snoutL: .35 });
ext('piranha', 'fish', { s: .4, bodyH: .62, extras: ['teeth'], bellyC: 'second' });
ext('tang', 'fish', { s: .4, bodyH: .7, bodyW: .15, tailC: 'accent' });
ext('angelfish', 'fish', { s: .4, bodyH: .9, bodyW: .12, dorsal: .7, pattern: 'rings', patternColor: 'accent', extras: ['longFins'] });
ext('pufferfish', 'fish', { s: .45, bodyH: .8, bodyW: .7, bodyL: .8, extras: ['puffSpikes'], pattern: 'spots', patternColor: 'accent' });
ext('lionfish', 'fish', { s: .5, pattern: 'stripes', patternColor: 'second', extras: ['spikyFins'] });
ext('swordfish', 'fish', { s: 1.8, bodyH: .32, snout: 'sword', snoutL: .6, dorsal: .45 });
ext('sunfish', 'fish', { s: 1.6, bodyL: .7, bodyH: 1, bodyW: .2, dorsal: .8, tailFin: .15, extras: ['analFin'] });
ext('shark', 'fish', { s: 2.4, bodyH: .3, bodyW: .26, dorsal: .45, tailFin: .55, shark: true, bellyC: 'second', extras: ['gills'] });
ext('hammerhead', 'shark', { s: 2.6, snout: 'hammer' });
ext('greatwhite', 'shark', { s: 3.6, bodyH: .36, extras: ['teeth', 'gills'] });
ext('whaleshark', 'shark', { s: 5.5, bodyH: .32, bodyW: .34, pattern: 'dots', patternColor: 'second', extras: ['wideMouth'] });
ext('dolphin', 'fish', { s: 2, bodyH: .3, bodyW: .28, snout: 'beak', snoutL: .18, dorsal: .3, flukes: true, bellyC: 'second', smile: true, jumper: true });
ext('orca', 'dolphin', { s: 4.2, snout: null, dorsal: .7, pattern: 'patches', patternColor: 'second', extras: ['eyePatch'] });
ext('beluga', 'dolphin', { s: 3, dorsal: 0, extras: ['melon'], snoutL: .08 });
ext('narwhal', 'dolphin', { s: 3, dorsal: 0, snout: 'tusk', snoutL: .9, pattern: 'dots', patternColor: 'accent' });
ext('whale', 'dolphin', { s: 6.5, bodyH: .4, bodyW: .4, dorsal: .05, snout: null, extras: ['bigHead', 'blowhole'], jumper: false });
ext('humpback', 'whale', { extras: ['longFlippers', 'blowhole'], bodyH: .36 });
ext('aurorawhale', 'whale', { glow: true, glowColor: '#8ef0ff', aura: '#c080ff', pattern: 'stripes', patternColor: 'second' });
def('seahorse', 'special', { s: .45, swimmer: true, swimOnly: true });
def('stingray', 'ray', { s: 1.1, spd: .7 });
ext('mantaray', 'stingray', { s: 3, horns: true, bellyC: 'second' });
def('seal', 'seal', { s: 1.4, swimmer: true, spd: .5, pattern: 'spots', patternColor: 'accent' });
ext('leopardseal', 'seal', { s: 2.2, headR: 1.3 });
ext('elephantseal', 'seal', { s: 2.6, extras: ['proboscis'], pattern: null });
ext('walrus', 'seal', { s: 2.6, extras: ['tusks', 'mustache'], pattern: null });
ext('manatee', 'seal', { s: 2.4, manatee: true, pattern: null, swimOnly: true });
// ---- frogs ----
def('frog', 'frog', { s: .42, spd: 1 });
ext('toad', 'frog', { s: .45, bumpy: true });
ext('treefrog', 'frog', { s: .35, eyeColor: '#d02a2a', eyeWhite: '#ff4a2a' });
ext('dartfrog', 'frog', { s: .28, pattern: 'spots', patternColor: 'second' });
// ---- bats ----
def('bat', 'bat', { s: .55, flier: true, ears: 'pointy' });
ext('fruitbat', 'bat', { s: .65, snoutL: .1 });
ext('batlord', 'bat', { s: 2.4, glowEyes: '#ff3050', extras: ['fangs', 'cape'] });
// ---- bugs ----
def('bug', 'bug', { s: .45, legs: 6, headR: .1, thoraxR: .12, abdomen: [.2, .14, .16], antennae: 'thin', wings: null, spd: .6 });
ext('ant', 'bug', { s: .38, abdomen: [.2, .14, .16], antennae: 'elbow', thin: true });
ext('beetle', 'bug', { s: .42, abdomen: [.28, .16, .22], wings: 'elytra', shiny: true });
ext('dungbeetle', 'beetle', { extras: ['dungBall'] });
ext('stagbeetle', 'beetle', { s: .55, extras: ['mandibles'] });
ext('rhinobeetle', 'beetle', { s: .55, extras: ['hornBug'] });
ext('herculesbeetle', 'beetle', { s: .7, extras: ['hornLong'], wingColor: 'main' });
ext('goliathbeetle', 'beetle', { s: .6, pattern: 'stripes', patternColor: 'second' });
ext('ladybug', 'beetle', { s: .35, abdomen: [.24, .16, .24], pattern: 'spots', patternColor: 'second' });
ext('firefly', 'beetle', { s: .32, glowTail: '#f2f040', flier: true, wings: 'clear' });
ext('cockroach', 'beetle', { s: .45, abdomen: [.32, .08, .2], antennae: 'long' });
ext('bee', 'bug', { s: .38, abdomen: [.22, .17, .17], pattern: 'bands', patternColor: 'second', wings: 'clear', flier: true, fuzzy: true, extras: ['stinger'] });
ext('bumblebee', 'bee', { s: .45, abdomen: [.24, .21, .21] });
ext('fly', 'bug', { s: .28, wings: 'clear', flier: true, eyeBig: true, eyeColor: '#c02a2a' });
ext('mosquito', 'fly', { s: .32, longLegs: true, extras: ['proboscis'] });
ext('butterfly', 'bug', { s: .55, abdomen: [.22, .05, .05], wings: 'butterfly', flier: true, flutter: true, antennae: 'club', wingPattern: 'spots' });
ext('birdwing', 'butterfly', { s: .8, wingPattern: 'stripes' });
ext('moth', 'butterfly', { s: .75, fuzzy: true, antennae: 'feather', wingPattern: 'eyes' });
ext('lunamoth', 'moth', { s: .6, extras: ['wingTails'] });
ext('colossalmoth', 'moth', { s: 4.2, glow: true, glowColor: '#ffe0a0', aura: '#ffd080', eyeColor: '#40c0ff', glowEyes: '#60e0ff' });
ext('dragonfly', 'bug', { s: .55, abdomen: [.5, .04, .04], wings: 'dragonfly', flier: true, hover: true, eyeBig: true });
ext('mantis', 'bug', { s: .6, abdomen: [.3, .08, .1], antennae: 'thin', extras: ['raptorArms', 'longThorax'], wings: null });
ext('orchidmantis', 'mantis', { extras: ['raptorArms', 'longThorax', 'petals'] });
ext('grasshopper', 'bug', { s: .45, abdomen: [.3, .09, .1], extras: ['jumpLegs'], jumper: true });
ext('cricket', 'grasshopper', { antennae: 'long' });
ext('leafinsect', 'bug', { s: .6, abdomen: [.35, .03, .2], extras: ['leafy'] });
ext('stickinsect', 'bug', { s: .7, abdomen: [.5, .035, .035], longLegs: true, thin: true, spd: .2 });
ext('tarantula', 'bug', { s: .6, legs: 8, abdomen: [.2, .18, .2], antennae: null, fuzzy: true, headR: .09, thoraxR: .14, eyeBig: false });
ext('scorpion', 'bug', { s: .65, legs: 8, abdomen: [.22, .08, .14], antennae: null, extras: ['pincers', 'stingerTail'] });
ext('crayfish', 'bug', { s: .5, legs: 8, abdomen: [.3, .1, .12], antennae: 'long', extras: ['pincers', 'tailFan'], swimmer: true });
ext('lobster', 'crayfish', { s: .7 });
ext('shrimp', 'crayfish', { s: .35, extras: ['tailFan'], swimOnly: true });
ext('hermitcrab', 'bug', { s: .45, legs: 8, crab: true, extras: ['pincers', 'snailShell'], antennae: 'thin' });
// ---- blobs ----
def('jellyfish', 'blob', { s: .7, form: 'jelly', glow: true, swimOnly: true, swimmer: true });
def('octopus', 'blob', { s: 1, form: 'octopus', swimOnly: true, swimmer: true });
ext('kraken', 'octopus', { s: 7, glowEyes: '#ffe040' });
def('squid', 'blob', { s: 1, form: 'squid', swimOnly: true, swimmer: true });
ext('giantsquid', 'squid', { s: 4 });
def('starfish', 'blob', { s: .5, form: 'star' });
def('snail', 'blob', { s: .45, form: 'snail', spd: .1 });
def('nautilus', 'blob', { s: .55, form: 'nautilus', swimOnly: true, swimmer: true });
def('oyster', 'blob', { s: .45, form: 'oyster' });
def('coral', 'blob', { s: .8, form: 'coral' });

const ALIAS = { theropodbase: 'theropod' };
const presetCache = new Map();
export function presetFor(model, name) {
  const ck = model + '|' + name;
  if (presetCache.has(ck)) return presetCache.get(ck);
  const base = PRESETS[model] || PRESETS[ALIAS[model]] || PRESETS.dog;
  const p = Object.assign({}, base, { extras: (base.extras || []).slice() });
  // deterministic per-species proportion jitter so every species looks unique
  const r = rng(hashStr(name));
  for (const k of ['bodyL', 'bodyH', 'legL', 'headR', 'neckL', 'snoutL', 'earS', 'tailL', 'bodyR']) if (typeof p[k] === 'number') p[k] *= .92 + r() * .16;
  p.personality = { playful: r(), lazy: r(), curious: r(), vocal: r() };
  presetCache.set(ck, p);
  return p;
}
export function presetBase(model) { return PRESETS[model] || PRESETS.dog; }

/* ---------------- BUILDERS ---------------- */
function addExtras(rig, p, K, d, opts) {
  const { body, head } = rig, bl = d.bl, bh = d.bh, bw = d.bw, hr = d.hr;
  const ex = new Set(p.extras || []);
  const has = k => ex.has(k);
  if (has('mane') && !(p.maneMale && opts.sex === 'F')) {
    if (p.b === 'quad' && p.maneMale !== undefined) P(head, GEO.sph, K.accent, [0, hr * .15, -hr * .25], [hr * 1.55, hr * 1.5, hr * 1.1]);
    else if (rig.neck) for (let i = 0; i < 4; i++) P(rig.neck, GEO.sph, K.accent, [0, d.nl * (i / 4 + .1), -d.nr * .9], [d.nr * .5, d.nl * .17, d.nr * .7]);
    else P(head, GEO.sph, K.accent, [0, hr * .2, -hr * .3], [hr * 1.3, hr * 1.3, hr * 1]);
  }
  if (has('mohawk') && rig.neck) for (let i = 0; i < 4; i++) P(rig.neck, GEO.sph, K.dark, [0, d.nl * (i / 4 + .12), -d.nr * .85], [d.nr * .3, d.nl * .16, d.nr * .45]);
  if (has('rainbowMane') && rig.neck) { const cs = ['#ff7a9a', '#ffc070', '#fff080', '#90f0a0', '#80c8ff', '#c090ff']; for (let i = 0; i < 6; i++) P(rig.neck, GEO.sph, toon(cs[i], { emissive: cs[i], ei: .3 }), [0, d.nl * (i / 6 + .05), -d.nr * .95], [d.nr * .5, d.nl * .14, d.nr * .7]); }
  if (has('flameMane') && rig.neck) for (let i = 0; i < 5; i++) P(rig.neck, GEO.cone, K.glow, [0, d.nl * (i / 5 + .1), -d.nr * .9], [d.nr * .35, d.nl * .4, d.nr * .25], [-.9, 0, 0]);
  if (has('ruff')) P(body, GEO.sph, K.second, [0, bh * .1, bl * .38], [bw * .55, bh * .55, bl * .2]);
  if (has('hump')) P(body, GEO.sph, K.main, [0, bh * .42, bl * (p.b === 'quad' && p.model === 'bison' ? .15 : 0)], [bw * .38, bh * .45, bl * .3]);
  if (has('hump2')) for (const z of [.18, -.15]) P(body, GEO.sph, K.main, [0, bh * .42, bl * z], [bw * .32, bh * .42, bl * .18]);
  if (has('dewlap')) P(head, GEO.sph, K.main, [0, -hr * .9, hr * .1], [hr * .2, hr * .5, hr * .2]);
  if (has('udder') && opts.sex !== 'M') P(body, GEO.sph, K.pink, [0, -bh * .45, -bl * .2], [bw * .2, bh * .15, bl * .12]);
  if (has('shaggy') || has('woolly')) {
    const m = has('woolly') ? K.skin : K.main;
    const n = has('woolly') ? 11 : 7, r = rng(hashStr(p.model + 'w'));
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; P(body, GEO.sphLo, m, [Math.cos(a) * bw * .35, bh * (.05 + r() * .25) * (has('woolly') ? 1 : .5) - (has('shaggy') ? bh * .2 : 0), (r() - .5) * bl * .8], [bw * .35, bh * (has('shaggy') ? .45 : .35), bl * .25]); }
  }
  if (has('shaggyFront')) P(body, GEO.sph, K.accent, [0, bh * .05, bl * .25], [bw * .62, bh * .62, bl * .32]);
  if (has('shaggyNeck') && rig.neck) P(rig.neck, GEO.sph, K.second, [0, d.nl * .4, 0], [d.nr * 1.6, d.nl * .45, d.nr * 1.6]);
  if (has('bangs')) P(head, GEO.sph, K.main, [0, hr * .5, hr * .5], [hr * .85, hr * .45, hr * .55]);
  if (has('topknot')) P(head, GEO.sph, K.second, [0, hr * .8, 0], [hr * .5, hr * .45, hr * .5]);
  if (has('beard')) P(head, GEO.cone, K.dark, [0, -hr * .55, hr * .7], [hr * .15, hr * .5, hr * .15], [Math.PI, 0, 0]);
  if (has('fangs') || has('sabers')) for (const sx of [1, -1]) P(rig.snout || head, GEO.cone, K.teeth, [sx * hr * .2, -hr * .25, hr * .1 + (rig.snoutLen || 0)], [hr * .06, hr * (has('sabers') ? .9 : .3), hr * .06], [Math.PI, 0, 0]);
  if (has('tusks') && !p.horns) for (const sx of [1, -1]) P(rig.snout || head, GEO.cone, K.teeth, [sx * hr * .3, -hr * .05, (rig.snoutLen || hr) * .7], [hr * .07, hr * (p.model === 'walrus' ? 1.4 : .45), hr * .07], [p.model === 'walrus' ? Math.PI : -.5, 0, sx * .2]);
  if (has('whiskers')) for (const sx of [1, -1]) for (let i = 0; i < 3; i++) P(rig.snout || head, GEO.cyl, K.white, [sx * hr * .4, -hr * .05 + i * hr * .06, (rig.snoutLen || hr * .5) * .8], [hr * .006, hr * .7, hr * .006], [0, 0, sx * (1.35 + i * .12)]);
  if (has('mask')) P(head, GEO.sph, K.dark, [0, hr * .2, hr * .55], [hr * .82, hr * .28, hr * .5]);
  if (has('facemask')) P(head, GEO.sph, K.white, [0, -hr * .05, hr * .5], [hr * .7, hr * .45, hr * .55]);
  if (has('headStripe')) P(head, GEO.sph, K.white, [0, hr * .55, hr * .3], [hr * .2, hr * .3, hr * .95]);
  if (has('backStripe') || has('stripe')) P(body, GEO.sph, K.white, [0, bh * .4, 0], [bw * .15, bh * .14, bl * .5]);
  if (has('backStripes')) for (const sx of [1, 0, -1]) P(body, GEO.sph, sx ? K.white : K.dark, [sx * bw * .18, bh * .42, 0], [bw * .07, bh * .1, bl * .45]);
  if (has('chestMoon')) P(body, GEO.sph, K.second, [0, bh * .05, bl * .47], [bw * .35, bh * .18, bl * .05]);
  if (has('chestBand')) P(body, GEO.sph, K.white, [0, 0, bl * .42], [bw * .52, bh * .12, bl * .1]);
  if (has('spectacles')) for (const sx of [1, -1]) P(head, GEO.ring, K.second, [sx * hr * .38, hr * .25, hr * .7], [hr * .2, hr * .2, hr * .2]);
  if (has('pandaMarks')) { for (const sx of [1, -1]) P(head, GEO.sph, K.second, [sx * hr * .38, hr * .2, hr * .62], [hr * .22, hr * .28, hr * .12], [0, 0, sx * .5]); }
  if (has('quills') || has('spines')) {
    const n = has('quills') ? 26 : 34, r = rng(7);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * .9 - Math.PI * .45, zz = (r() - .5) * bl * .85;
      const g = G(body, [Math.sin(a) * bw * .45, Math.cos(a) * bh * .42, zz], [-.6 - r() * .4, 0, -a]);
      P(g, GEO.cone, i % 3 ? K.second : K.dark, [0, 0, 0], [bw * .04, bh * (has('quills') ? .75 : .4), bw * .04]);
    }
  }
  if (has('shell')) {
    const sh = G(body, [0, bh * .1, 0]);
    P(sh, GEO.hemi, toon('#ffffff', { map: patternTex(p.shellPat || 'scales', K.secondHex, K.accentHex) }), [0, 0, 0], [bw * .62, bh * (p.shellH || .5) * 2.4, bl * .62]);
    P(sh, GEO.cyl, K.accent, [0, 0, 0], [bw * .63, bh * .08, bl * .63]);
    if (has('ridges')) for (let i = -1; i <= 1; i++) P(sh, GEO.cone, K.accent, [0, bh * (p.shellH || .5) * 2.2, i * bl * .2], [bw * .06, bh * .25, bw * .06]);
  }
  if (has('flippers')) for (const leg of rig.legs) leg.g.scale.set(2.5, .5, 1.6);
  if (has('scales') || has('armor') || has('armorDots')) for (let i = 0; i < 9; i++) P(body, GEO.cone, K.accent, [((i % 3) - 1) * bw * .25, bh * .38, (Math.floor(i / 3) - 1) * bl * .28], [bw * .07, bh * .2, bw * .07]);
  if (has('shellBands')) for (let i = -2; i <= 2; i++) P(body, GEO.torus, K.accent, [0, 0, i * bl * .12], [bw * .5, bh * .5, bl * .1], [0, 0, 0]);
  if (has('domeShell')) P(body, GEO.hemi, toon('#ffffff', { map: patternTex('scales', K.mainHex, K.accentHex) }), [0, -bh * .05, 0], [bw * .68, bh * 1.1, bl * .62]);
  if (has('spinesBack') || has('spikesBack') || has('scutes') || has('plates') || has('dorsalPlates') || has('sail')) {
    const n = has('sail') ? 1 : has('plates') || has('dorsalPlates') ? 7 : 8;
    if (has('sail')) P(body, GEO.sph, K.accent, [0, bh * .5, 0], [bw * .04, bh * .9, bl * .4]);
    else for (let i = 0; i < n; i++) {
      const z = (i / (n - 1) - .5) * bl * .85;
      const big = has('plates') || has('dorsalPlates');
      const m = has('dorsalPlates') ? K.glow : big ? K.accent : K.horn;
      const h = big ? bh * (.6 - Math.abs(i / (n - 1) - .5) * .6) : bh * .22;
      const pl = P(body, big ? GEO.wedge : GEO.cone, m, [0, bh * .38, z], [big ? bw * .05 : bw * .05, h, big ? bl * .08 : bw * .05]);
      if (has('dorsalPlates')) rig.glow.push(pl);
    }
  }
  if (has('frill')) P(head, GEO.disc, K.accent, [0, 0, -hr * .2], [hr * 1.6, hr * .03, hr * 1.6], [Math.PI / 2, 0, 0]);
  if (has('frillNeck')) P(head, GEO.disc, K.accent, [0, 0, -hr * .4], [hr * 1.2, hr * .03, hr * 1.2], [Math.PI / 2, 0, 0]);
  if (has('casque')) P(head, GEO.cone, K.main, [0, hr * .4, -hr * .2], [hr * .4, hr * .7, hr * .3], [-.6, 0, 0]);
  if (has('crownSpikes') || has('spikesAll')) for (let i = 0; i < (has('spikesAll') ? 16 : 6); i++) { const a = i / (has('spikesAll') ? 16 : 6) * Math.PI * 2; P(has('spikesAll') ? body : head, GEO.cone, K.accent, [Math.cos(a) * (has('spikesAll') ? bw * .4 : hr * .7), (has('spikesAll') ? bh * .3 : hr * .4), Math.sin(a) * (has('spikesAll') ? bl * .35 : hr * .4) - (has('spikesAll') ? 0 : hr * .3)], [bw * .04, hr * .45, bw * .04], [0, 0, -Math.cos(a) * .6]); }
  if (has('beardSpikes')) for (let i = -2; i <= 2; i++) P(head, GEO.cone, K.accent, [i * hr * .2, -hr * .55, hr * .4], [hr * .06, hr * .3, hr * .06], [Math.PI * .8, 0, 0]);
  if (has('gills')) for (const sx of [1, -1]) for (let i = 0; i < 3; i++) P(head, GEO.cone, K.accent, [sx * hr * .75, hr * .1, -hr * .1 * i], [hr * .06, hr * .5, hr * .06], [-.3 * i, 0, -sx * (.9 + i * .2)]);
  if (has('smile')) P(head, GEO.torus, K.dark, [0, -hr * .25, hr * .9], [hr * .25, hr * .25, hr * .25], [0, 0, Math.PI]);
  if (has('buckteeth')) P(rig.snout || head, GEO.box, K.teeth, [0, -hr * .32, (rig.snoutLen || hr) * .9], [hr * .2, hr * .25, hr * .05]);
  if (has('teeth') && rig.snout) for (let i = 0; i < 6; i++) for (const sx of [1, -1]) P(rig.snout, GEO.cone, K.teeth, [sx * d.sr * .75, -d.sr * .55, d.sl * (.2 + i * .14)], [d.sr * .09, d.sr * .3, d.sr * .09], [Math.PI, 0, 0]);
  if (has('barrel')) P(body, GEO.cyl, toon('#a0662a'), [0, bh * .1, bl * .5], [bw * .15, bw * .25, bw * .15], [0, 0, Math.PI / 2]);
  if (has('cheeks')) for (const sx of [1, -1]) P(head, GEO.sph, K.second, [sx * hr * .55, -hr * .2, hr * .3], [hr * .4, hr * .35, hr * .35]);
  if (has('tearlines')) for (const sx of [1, -1]) P(head, GEO.cyl, K.dark, [sx * hr * .3, -hr * .05, hr * .8], [hr * .03, hr * .35, hr * .03], [0, 0, sx * .2]);
  if (has('legstripes')) for (const leg of rig.legs) for (let i = 1; i < 4; i++) P(leg.g, GEO.cyl, K.white, [0, -d.legLen * (.2 + i * .15), 0], [p.legR * 1.05, d.legLen * .05, p.legR * 1.05]);
  if (has('feathers')) for (const leg of rig.legs) P(leg.g, GEO.sph, K.white, [0, -d.legLen * .9, 0], [p.legR * 1.8, d.legLen * .14, p.legR * 1.8]);
  if (has('facestripe')) P(head, GEO.sph, K.dark, [0, hr * .1, hr * .5], [hr * .3, hr * .7, hr * .7]);
  if (has('warts')) for (const sx of [1, -1]) P(head, GEO.sphLo, K.main, [sx * hr * .55, -hr * .1, hr * .75], [hr * .12, hr * .12, hr * .12]);
  if (has('collar')) P(body, GEO.sph, K.white, [0, 0, bl * .38], [bw * .52, bh * .1, bl * .05]);
  if (has('headdress')) { for (const sx of [1, -1]) P(head, GEO.box, toon('#2a5aa0'), [sx * hr * .75, -hr * .1, -hr * .1], [hr * .25, hr * 1.2, hr * .7]); P(head, GEO.box, toon('#f2c230'), [0, hr * .7, -hr * .1], [hr * 1.5, hr * .3, hr * .9]); }
  if (has('crestNose')) P(head, GEO.sph, K.main, [0, hr * .7, hr * .4], [hr * .4, hr * .5, hr * .5]);
  if (has('membrane')) for (const sx of [1, -1]) P(body, GEO.sph, K.main, [sx * bw * .55, -bh * .1, 0], [bw * .35, bh * .06, bl * .4]);
  if (has('nostrils')) for (const sx of [1, -1]) P(rig.snout, GEO.sphLo, K.dark, [sx * d.sr * .45, d.sr * .55, d.sl * .9], [d.sr * .1, d.sr * .06, d.sr * .1]);
  if (has('slothFace')) { P(head, GEO.sph, K.second, [0, 0, hr * .5], [hr * .75, hr * .65, hr * .5]); for (const sx of [1, -1]) P(head, GEO.sph, K.dark, [sx * hr * .32, hr * .12, hr * .72], [hr * .28, hr * .14, hr * .1], [0, 0, -sx * .3]); }
  if (has('wings')) wings(body, [bw * .35, bh * .35, bl * .15], bl * (p.model === 'flyingpig' ? .45 : 1.3), bl * .7, p.model === 'flyingpig' || p.model === 'griffin' || p.model === 'sphinx' || p.model === 'manticore' ? (p.model === 'flyingpig' ? K.white : K.second) : K.accent, rig, p.model === 'flyingpig' || p.model === 'griffin' || p.model === 'sphinx' ? 'feather' : 'membrane', { fold: .9, boneMat: K.main });
  if (has('scorpTail')) { const t = G(body, [0, bh * .2, -bl * .45], [-.4, 0, 0]); const segs = chain(t, 6, bl * .14, bw * .1, bw * .06, [-.42, 0, 0], K.accent); P(segs[5], GEO.cone, K.dark, [0, bl * .14, 0], [bw * .07, bl * .18, bw * .07], [-.6, 0, 0]); rig.tail = segs; rig.tailBase = t; rig.tailAngle = -.4; }
  if (has('eagleHead')) { head.children.forEach(c => { c.visible = false; }); const eh = G(head, [0, 0, 0]); P(eh, GEO.sph, K.white, [0, 0, hr * .2], [hr * 1.05, hr * 1.05, hr * 1.1]); P(eh, GEO.cone, K.beak, [0, -hr * .1, hr * 1.1], [hr * .25, hr * .7, hr * .3], [Math.PI / 2 + .3, 0, 0]); rig.eyes = []; eyes(eh, hr * .5, hr * .25, hr * .75, hr * .25, K, rig, .4); }
  if (has('hydraHeads')) {
    rig.extraHeads = [];
    for (let i = 0; i < 4; i++) {
      const sx = i < 2 ? 1 : -1, off = (i % 2 ? .5 : .2);
      const n = G(body, [sx * bw * off, bh * .3, bl * .35], [.5, sx * off * .9, 0]);
      const segs = chain(n, 4, d.nl * .28, d.nr, d.nr * .7, [-.12, 0, 0], K.skin);
      const h = G(segs[3], [0, d.nl * .3, 0], [-.4, 0, 0]);
      P(h, GEO.sph, K.skin, [0, 0, hr * .4], [hr * .7, hr * .6, hr * 1.1]);
      eyes(h, hr * .35, hr * .3, hr * .8, hr * .2, K, rig, .3);
      rig.extraHeads.push(n);
    }
  }
  if (has('legstripes')) { /* handled above */ }
  if (has('cape')) P(body, GEO.sph, K.accent, [0, bh * .3, bl * .2], [bw * .7, bh * .3, bl * .3]);
  if (p.claws && rig.legs.length && p.b === 'quad') for (const leg of rig.legs) for (const i of [-1, 1]) P(leg.g, GEO.cone, K.claw, [i * p.legR * .5, -d.legLen, p.legR * 1.2], [p.legR * .2, p.legR * .9, p.legR * .2], [Math.PI / 2, 0, 0]);
}

function buildQuad(p, K, rig, opts) {
  const R = rig.root;
  const bl = p.bodyL, bh = p.bodyH, bw = p.bodyW, L = p.legL;
  const bodyY = L + bh * .32 + (p.model === 'turtle' ? 0 : 0);
  const body = rig.body = G(R, [0, bodyY, 0]);
  rig.baseY = bodyY;
  P(body, GEO.sph, K.skin, [0, 0, 0], [bw / 2, bh / 2, bl / 2]);
  if (!p.noBelly) P(body, GEO.sph, K.second, [0, -bh * .16, bl * .02], [bw * .4, bh * .34, bl * .4]);
  const hipY = -bh * .15, legLen = bodyY + hipY;
  const ft = p.frontTall || 0, bt = p.backTall || 0;
  legPair(body, bw * .3, hipY, bl * .32, legLen * (1 + ft), p.legR, K.leg, K.hoof, rig, true, { sprawl: p.sprawl });
  legPair(body, bw * .3, hipY, -bl * .32, legLen * (1 + bt), p.legR * 1.15, K.leg, K.hoof, rig, false, { sprawl: p.sprawl });
  rig.baseRX = (ft || bt) ? Math.atan2((bt - ft) * legLen, bl * .64) : 0;
  body.rotation.x = rig.baseRX;
  // neck & head
  const nl = p.neckL || 0, nr = p.neckR || bw * .22;
  const neck = rig.neck = G(body, [0, bh * .16 + (p.neckY || 0), bl * .42]);
  neck.rotation.x = p.neckA ?? .8;
  rig.neckA = neck.rotation.x;
  if (nl > .03) P(neck, GEO.up, p.neckC ? K[p.neckC] : K.skin, [0, 0, 0], [nr, nl * 1.05, nr * .9]);
  const head = rig.head = G(neck, [0, nl, 0]);
  head.rotation.x = -rig.neckA + (p.headPitch || 0);
  rig.headA = head.rotation.x;
  const hr = p.headR, hl = p.headL ?? 1.1;
  P(head, GEO.sph, K.headM, [0, 0, hr * .25], [hr * .95, hr * .88, hr * hl]);
  const sl = p.snoutL ?? .12, sr = p.snoutR ?? hr * .55;
  const snout = rig.snout = G(head, [0, -hr * .22, hr * (.55 + hl * .35)]);
  rig.snoutLen = sl;
  const nose = p.nose;
  if (nose === 'trunk') {
    const tr = G(snout, [0, 0, 0], [2.2, 0, 0]);
    rig.trunk = chain(tr, 6, hr * .3, hr * .2, hr * .1, [.18, 0, 0], K.main);
  } else if (nose === 'trunkShort') {
    P(snout, GEO.sph, K.main, [0, 0, sl * .6], [sr * .8, sr * .7, sl * 1.4]);
  } else if (nose === 'bill') {
    P(snout, GEO.sph, K.dark, [0, 0, hr * .45], [hr * .6, hr * .14, hr * .7]);
  } else if (nose === 'beak') {
    P(snout, GEO.cone, K.dark, [0, 0, sl * .4], [sr * .9, sl * 1.6, sr * .7], [Math.PI / 2, 0, 0]);
  } else if (nose === 'beakLong') {
    P(snout, GEO.cyl, K.dark, [0, 0, hr * .5], [hr * .1, hr * 1, hr * .1], [Math.PI / 2, 0, 0]);
  } else {
    P(snout, GEO.sph, K.snout, [0, 0, sl * .5], [sr, sr * .82, Math.max(sl, sr * .7)]);
    if (nose === 'pig') P(snout, GEO.cyl, K.pink, [0, 0, sl * 1.2 + sr * .2], [sr * .8, sr * .2, sr * .7], [Math.PI / 2, 0, 0]);
    else if (nose === 'bigBlack') P(snout, GEO.sph, K.nose, [0, sr * .2, sl + sr * .5], [sr * .9, sr * 1.1, sr * .6]);
    else P(snout, GEO.sph, nose === 'pink' ? K.pink : K.nose, [0, sr * .32, sl * 1.15 + sr * .1], [sr * .42, sr * .3, sr * .28]);
    if (p.jaw) { rig.jaw = G(snout, [0, -sr * .35, 0]); P(rig.jaw, GEO.sph, K.snout, [0, 0, sl * .5], [sr * .9, sr * .35, sl * .95]); }
  }
  const eyeY = p.eyeY ?? .28;
  eyes(head, hr * .52, hr * eyeY, hr * .55, hr * (p.eyeS ?? .27), K, rig, p.predatorEyes ? .1 : .45);
  ears(head, p.ears, hr, K, rig, p.earS || 1);
  horns(head, p.horns, hr, K, p.hornS || 1, rig, { sex: opts.sex, antlersBoth: p.antlersBoth });
  // tail
  const tailKind = p.tail || 'thin';
  const tipMat = p.tailTip === 'white' ? K.white : p.tailTip === 'main' ? K.main : p.tailTip === 'accent' ? K.accent : p.tailTipDark ? K.dark : undefined;
  tail(body, tailKind, [0, bh * .12, -bl * .46], (p.tailL || .45) * (tailKind === 'heavy' ? 1 : 1), (p.tailR ? p.tailR * .04 : .035) * (tailKind === 'heavy' ? p.tailR ? 25 : 4 : 1), K, rig, { angle: p.tailA ?? -2.2, tipMat, club: p.tailClub, spikes: p.tailSpikes, n: tailKind === 'heavy' ? 7 : undefined });
  rig.kindSub = ['cat', 'lion', 'tiger', 'leopard', 'cheetah', 'cougar'].some(k => (p.model || '').includes(k)) ? 'cat' : '';
  addExtras(rig, p, K, { bl, bh, bw, hr, nl, nr, sl, sr, legLen }, opts);
}

function buildBiped(p, K, rig, opts) {
  const R = rig.root;
  const L = p.legL, th = p.torsoH, tw = p.torsoW, td = p.torsoD ?? tw;
  const hips = rig.body = G(R, [0, L, 0]);
  rig.baseY = L;
  const legM = p.blocky ? K.second : K.main;
  for (const sx of [1, -1]) {
    const hip = G(hips, [sx * tw * .3, 0, 0]);
    if (p.blocky) P(hip, GEO.box, legM, [0, -L * .5, 0], [p.legR * 2, L, p.legR * 2]);
    else P(hip, GEO.limb, legM, [0, 0, 0], [p.legR * (p.lean > 1 ? 1.6 : 1), L, p.legR * (p.lean > 1 ? 1.6 : 1)]);
    P(hip, GEO.sph, p.blocky ? K.dark : K.dark, [0, -L, p.legR * (p.footL || 1.2) * .6], [p.legR * 1.2, p.legR * .7, p.legR * (p.footL || 1.4) * (p.extras.includes('bigFeet') ? 1.6 : 1)]);
    if (p.claws) for (const i of [-1, 0, 1]) P(hip, GEO.cone, K.claw, [i * p.legR * .5, -L, p.legR * (p.footL || 1.4) * 1.3], [p.legR * .15, p.legR * .6, p.legR * .15], [Math.PI / 2, 0, 0]);
    rig.legs.push({ g: hip, ph: sx > 0 ? 0 : Math.PI, front: sx > 0, sx, biped: true });
  }
  const torso = rig.torso = G(hips, [0, 0, 0], [p.lean, 0, 0]);
  rig.lean = p.lean;
  if (p.blocky) P(torso, GEO.box, K.main, [0, th * .5, 0], [tw, th, td]);
  else P(torso, GEO.sph, K.skin, [0, th * .5, 0], [tw * .5, th * .58, td * .5]);
  if (!p.blocky) P(torso, GEO.sph, K.second, [0, th * .45, td * .14], [tw * .38, th * .42, td * .38]);
  // arms
  for (const sx of [1, -1]) {
    const sh = G(torso, [sx * tw * .48, th * .82, 0]);
    sh.rotation.x = -p.lean * (p.knuckle ? .95 : .55);
    const aL = p.armL;
    if (p.blocky) P(sh, GEO.box, K.second, [0, -aL * .5, 0], [p.armR * 2, aL, p.armR * 2]);
    else P(sh, GEO.limb, K.main, [0, 0, 0], [p.armR, aL, p.armR]);
    P(sh, GEO.sph, p.faceC ? K[p.faceC] : K.dark, [0, -aL, 0], [p.armR * 1.15, p.armR * 1.1, p.armR * 1.2]);
    if (p.claws) for (const i of [-1, 1]) P(sh, GEO.cone, K.claw, [i * p.armR * .4, -aL - p.armR, p.armR * .4], [p.armR * .2, p.armR * .8, p.armR * .2], [Math.PI, 0, 0]);
    if (p.extras.includes('feathersArms')) P(sh, GEO.sph, K.accent, [0, -aL * .5, -p.armR * 2], [p.armR * .6, aL * .5, p.armR * 3]);
    if (p.extras.includes('thumbSpike')) P(sh, GEO.cone, K.claw, [0, -aL, p.armR], [p.armR * .3, p.armR * 1.5, p.armR * .3], [-.5, 0, 0]);
    rig.arms.push({ g: sh, sx, ph: sx > 0 ? Math.PI : 0, base: sh.rotation.x });
  }
  // head
  const neck = rig.neck = G(torso, [0, th * .98, td * .05]);
  rig.neckA = 0;
  const head = rig.head = G(neck, [0, p.headR * .7, 0], [-p.lean * (p.lean > 1 ? .9 : .75), 0, 0]);
  rig.headA = head.rotation.x;
  const hr = p.headR;
  if (p.blocky) P(head, GEO.box, K.main, [0, 0, 0], [hr * 1.8, hr * 1.5, hr * 1.6]);
  else P(head, GEO.sph, K.headM, [0, 0, 0], [hr, hr * .95, hr * (1 + (p.snoutL > .15 ? .3 : 0))]);
  if (p.faceC && !p.blocky) P(head, GEO.sph, K[p.faceC], [0, -hr * .05, hr * .45], [hr * .72, hr * .7, hr * .62]);
  const sl = p.snoutL || 0, sr = p.snoutR || hr * .4;
  const snout = rig.snout = G(head, [0, -hr * .25, hr * .75]);
  rig.snoutLen = sl;
  if (sl > .02) P(snout, GEO.sph, p.snoutC ? K[p.snoutC] : K.second, [0, 0, sl * .55], [sr, sr * .8, sl]);
  if (p.jaw) { rig.jaw = G(snout, [0, -sr * .4, 0]); P(rig.jaw, GEO.sph, p.snoutC ? K[p.snoutC] : K.second, [0, 0, sl * .5], [sr * .9, sr * .32, sl * .95]); }
  if (!p.blocky && sl > .02) P(snout, GEO.sph, K.nose, [0, sr * .35, sl * 1.1], [sr * .3, sr * .22, sr * .22]);
  eyes(head, hr * .42, hr * .22, hr * .72, hr * (p.eyeS ?? .26), K, rig, .2);
  if (p.blocky && rig.eyes.length) rig.eyes.forEach(e => e.scale.set(1, .6, 1));
  ears(head, p.ears, hr, K, rig, p.earS || 1);
  // tail from hips
  if (p.tail && p.tail !== 'none') tail(hips, p.tail, [0, p.lean > 1 ? 0 : th * .1, -td * .4], p.tailL || .5, p.tailR || .03, K, rig, { angle: p.tailA ?? -2.2, curl: p.curl });
  addBipedExtras(rig, p, K, { th, tw, td, hr, sl, sr, L, torso, head });
}
function addBipedExtras(rig, p, K, d) {
  const ex = new Set(p.extras || []), { torso, head, hr, th, tw, td } = d;
  if (ex.has('pouch')) P(torso, GEO.sph, K.second, [0, th * .3, td * .3], [tw * .35, th * .25, td * .2]);
  if (ex.has('mask')) P(head, GEO.sph, K.dark, [0, hr * .2, hr * .55], [hr * .8, hr * .3, hr * .5]);
  if (ex.has('mane')) P(head, GEO.sph, K.second, [0, hr * .1, -hr * .3], [hr * 1.5, hr * 1.4, hr * 1.2]);
  if (ex.has('beard')) P(head, GEO.sph, K.main, [0, -hr * .7, hr * .3], [hr * .6, hr * .5, hr * .5]);
  if (ex.has('colorFace')) { P(d.head, GEO.sph, toon('#2a6ad0'), [0, -hr * .05, hr * .7], [hr * .55, hr * .6, hr * .45]); P(rig.snout, GEO.sph, toon('#d32f2f'), [0, 0, d.sl * 1.0], [d.sr * .9, d.sr * .6, d.sr * .5]); }
  if (ex.has('cheekRing')) P(head, GEO.torus, K.second, [0, 0, hr * .6], [hr * .7, hr * .7, hr * .5]);
  if (ex.has('shaggy')) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; P(torso, GEO.sphLo, K.main, [Math.cos(a) * tw * .45, th * (.3 + (i % 2) * .3), Math.sin(a) * td * .4], [tw * .25, th * .32, td * .25]); }
  if (ex.has('mustache')) for (const sx of [1, -1]) P(head, GEO.cone, K.white, [sx * hr * .3, -hr * .3, hr * .8], [hr * .08, hr * .7, hr * .08], [0, 0, sx * 2.2]);
  if (ex.has('silverback')) P(torso, GEO.sph, K.second, [0, th * .65, -td * .25], [tw * .45, th * .3, td * .3]);
  if (ex.has('brow')) P(head, GEO.sph, K.main, [0, hr * .45, hr * .55], [hr * .8, hr * .2, hr * .3]);
  if (ex.has('cheekPads')) for (const sx of [1, -1]) P(head, GEO.sph, K.dark, [sx * hr * .8, 0, hr * .3], [hr * .35, hr * .7, hr * .15]);
  if (ex.has('fangs')) for (const sx of [1, -1]) P(head, GEO.cone, K.teeth, [sx * hr * .2, -hr * .55, hr * .8], [hr * .07, hr * .3, hr * .07], [Math.PI, 0, 0]);
  if (ex.has('moss')) for (let i = 0; i < 8; i++) P(torso, GEO.sphLo, toon('#4a7a2a'), [(Math.random() - .5) * tw, th * Math.random(), td * .4 * (Math.random() < .5 ? 1 : -1)], [tw * .2, th * .15, td * .15]);
  if (ex.has('drips')) for (let i = 0; i < 6; i++) P(torso, GEO.cyl, toon('#7aa04a'), [(i / 5 - .5) * tw * .8, th * .1, td * .45], [tw * .03, th * .35, tw * .03]);
  if (ex.has('teeth') && rig.snout) for (let i = 0; i < 5; i++) for (const sx of [1, -1]) P(rig.snout, GEO.cone, K.teeth, [sx * d.sr * .7, -d.sr * .5, d.sl * (.25 + i * .16)], [d.sr * .1, d.sr * .35, d.sr * .1], [Math.PI, 0, 0]);
  if (ex.has('doubleCrest')) for (const sx of [1, -1]) P(head, GEO.sph, K.accent, [sx * hr * .3, hr * .7, hr * .4], [hr * .06, hr * .45, hr * .8]);
  if (ex.has('frillNeck')) P(head, GEO.disc, K.accent, [0, 0, -hr * .3], [hr * 1.5, hr * .02, hr * 1.5], [Math.PI / 2 - .3, 0, 0]);
  if (ex.has('tubeCrest')) P(head, GEO.cyl, K.accent, [0, hr * .7, -hr * .7], [hr * .12, hr * 1.5, hr * .12], [-1.0, 0, 0]);
  if (ex.has('dome')) P(head, GEO.sph, K.accent, [0, hr * .45, -hr * .05], [hr * 1.02, hr * .8, hr * .95]);
  if (ex.has('sail')) P(torso, GEO.sph, K.accent, [0, th * .6, -td * .4], [tw * .04, th * .8, td * .7]);
  if (ex.has('dorsalPlates')) for (let i = 0; i < 6; i++) { const pl = P(torso, GEO.wedge, K.glow, [0, th * (.2 + i * .14), -td * .45], [tw * .05, th * .3, td * .25], [-.6, 0, 0]); rig.glow.push(pl); }
  if (ex.has('dorsalPlates') && rig.tail) for (const s of rig.tail) { const pl = P(s, GEO.wedge, K.glow, [0, .02, -.02], [.02, .1, .04], [-1.2, 0, 0]); rig.glow.push(pl); }
}

function buildBird(p, K, rig, opts) {
  const R = rig.root;
  const br = p.bodyR, bl = p.bodyL, L = p.legL, up = p.upright || 0;
  const bodyY = L + br * (.75 + up * .4);
  const body = rig.body = G(R, [0, bodyY, 0]);
  rig.baseY = bodyY;
  const tilt = G(body, [0, 0, 0], [-up * 1.35, 0, 0]);
  rig.tilt = tilt;
  P(tilt, GEO.sph, K.skin, [0, 0, 0], [br * .95, br, br * bl]);
  P(tilt, GEO.sph, p.bellyC ? K[p.bellyC] : K.second, [0, -br * .22, br * .2], [br * .75, br * .72, br * bl * .78]);
  // legs
  const legM = p.legC === 'beak' || p.legC === 'beakish' ? K.beak : p.legC ? K[p.legC] : K.beak;
  if (L > .02) for (const sx of [1, -1]) {
    const hip = G(body, [sx * br * .38, -br * .55, 0]);
    P(hip, GEO.limb, legM, [0, 0, 0], [p.legR || .02, L + br * .1, p.legR || .02]);
    for (const a of [-.5, 0, .5]) P(hip, GEO.cone, legM, [0, -L - br * .1, 0], [p.legR * 1.2 || .025, br * .55, p.legR * 1.2 || .025], [Math.PI / 2, a, 0]);
    if (p.extras && p.extras.includes('featherFeet')) P(hip, GEO.sph, K.white, [0, -L, 0], [br * .2, br * .15, br * .25]);
    rig.legs.push({ g: hip, ph: sx > 0 ? 0 : Math.PI, front: sx > 0, sx, biped: true });
  }
  // wings
  const wt = p.wing || 'feather';
  if (wt === 'flipper') wings(tilt, [br * .85, br * .2, 0], br * .9, br * .8, K.main, rig, 'feather', { fold: 0 });
  else if (wt === 'membrane') wings(tilt, [br * .7, br * .3, br * .2], br * (p.wingS || 1.5) * 1.6, br * 1.1, K.main, rig, 'membrane', { fold: .9, boneMat: K.main });
  else if (wt === 'fluffy') wings(tilt, [br * .8, br * .3, -br * .2], br * .7, br * .8, K.second, rig, 'feather', { fold: 1.2 });
  else if (wt !== 'none') wings(tilt, [br * .8, br * .35, 0], br * (p.wingS || 1) * 1.15, br * 1.15, K.main, rig, 'feather', { fold: 1.25, tipMat: p.wingTip ? K[p.wingTip] : K.accent });
  // neck & head
  const nl = p.neckL || 0;
  const neck = rig.neck = G(body, [0, br * .55, br * bl * .55 * (1 - up * .8)]);
  neck.rotation.x = p.neckS ? .2 : .35 - up * .3;
  rig.neckA = neck.rotation.x;
  if (nl > .02) {
    const nm = p.neckC ? K[p.neckC] : (p.headC ? K[p.headC] : K.skin);
    if (p.neckS) { rig.neckSegs = chain(neck, 3, nl / 3, p.neckR || br * .2, (p.neckR || br * .2) * .8, [.45, 0, 0], nm); rig.neckSegs[0].rotation.x = -.7; }
    else P(neck, GEO.up, nm, [0, 0, 0], [p.neckR || br * .3, nl, p.neckR || br * .3]);
  }
  const headParent = rig.neckSegs ? rig.neckSegs[2] : neck;
  const head = rig.head = G(headParent, [0, rig.neckSegs ? nl / 3 : nl, 0]);
  head.rotation.x = rig.neckSegs ? -(rig.neckSegs.reduce((s, g) => s + g.rotation.x, 0) + neck.rotation.x) : -neck.rotation.x;
  rig.headA = head.rotation.x;
  const hr = p.headR;
  P(head, GEO.sph, p.headC ? K[p.headC] : K.skin, [0, 0, 0], [hr, hr, hr * 1.05]);
  if (p.facialDisc) P(head, GEO.sph, K.second, [0, -hr * .05, hr * .5], [hr * .85, hr * .8, hr * .5]);
  // beak
  const bk = G(head, [0, -hr * .1, hr * .85]);
  rig.snout = bk;
  const bL = p.beakL || .1, bc = p.beakColor === 'main' ? K.main : K.beak;
  switch (p.beak) {
    case 'hook': P(bk, GEO.cone, bc, [0, 0, 0], [hr * .35, bL + hr * .2, hr * .3], [Math.PI / 2 + .45, 0, 0]); break;
    case 'flat': P(bk, GEO.sph, bc, [0, -hr * .05, bL * .6], [hr * .38, hr * .12, bL]); break;
    case 'big': P(bk, GEO.sph, bc, [0, 0, bL * .55], [hr * .45, hr * .55, bL]); P(bk, GEO.sph, toon(p.beakTip || '#2a2a2a'), [0, 0, bL * 1.35], [hr * .2, hr * .25, bL * .2]); break;
    case 'needle': P(bk, GEO.cyl, bc, [0, 0, bL * .5], [hr * .05, bL, hr * .05], [Math.PI / 2 + .1, 0, 0]); break;
    case 'curved': { const c = G(bk, [0, 0, 0], [Math.PI / 2, 0, 0]); chain(c, 3, bL / 3, hr * .08, hr * .04, [.25, 0, 0], bc); break; }
    case 'spoon': P(bk, GEO.cyl, bc, [0, 0, bL * .45], [hr * .06, bL * .9, hr * .04], [Math.PI / 2, 0, 0]); P(bk, GEO.sph, bc, [0, 0, bL * .95], [hr * .25, hr * .06, hr * .3]); break;
    case 'flamingo': { const c = G(bk, [0, 0, 0], [Math.PI / 2, 0, 0]); chain(c, 2, bL / 2, hr * .2, hr * .1, [.9, 0, 0], bc); P(c, GEO.sph, K.dark, [0, bL * .9, hr * .1], [hr * .12, hr * .15, hr * .12]); break; }
    case 'shoe': P(bk, GEO.sph, bc, [0, -hr * .1, bL * .5], [hr * .6, hr * .45, bL]); break;
    case 'pouch': P(bk, GEO.sph, bc, [0, 0, bL * .5], [hr * .25, hr * .12, bL]); P(bk, GEO.sph, toon(mix(K.accentHex, '#f2b030', .5)), [0, -hr * .25, bL * .45], [hr * .25, hr * .3, bL * .8]); break;
    case 'puffin': P(bk, GEO.cone, bc, [0, 0, 0], [hr * .3, bL + hr * .2, hr * .5], [Math.PI / 2, 0, 0]); P(bk, GEO.cyl, toon('#2a5aa0'), [0, 0, hr * .1], [hr * .32, hr * .04, hr * .52], [Math.PI / 2, 0, 0]); break;
    default: P(bk, GEO.cone, bc, [0, 0, 0], [hr * .22, bL + hr * .15, hr * .2], [Math.PI / 2, 0, 0]);
  }
  if (p.eyesFront) eyes(head, hr * .38, hr * .15, hr * .78, hr * (p.eyeS || .34), K, rig, 0);
  else eyes(head, hr * .55, hr * .22, hr * .5, hr * (p.eyeS || .26), K, rig, .9);
  // crest
  const cm = p.crestC ? K[p.crestC] : K.accent;
  switch (p.crest) {
    case 'comb': for (let i = 0; i < 3; i++) P(head, GEO.sph, cm, [0, hr * (.85 + (i === 1 ? .12 : 0)), hr * (.35 - i * .3)], [hr * .1, hr * .25, hr * .15]); break;
    case 'tuft': P(head, GEO.cone, cm, [0, hr * .6, -hr * .1], [hr * .25, hr * .9, hr * .25], [-.6, 0, 0]); break;
    case 'tall': for (let i = 0; i < 3; i++) P(head, GEO.cone, cm, [0, hr * .6, -hr * .1 * i], [hr * .12, hr * 1.4, hr * .12], [-.3 - i * .25, 0, 0]); break;
    case 'crown': for (let i = -2; i <= 2; i++) { P(head, GEO.cyl, cm, [i * hr * .12, hr * 1.05, 0], [hr * .02, hr * .6, hr * .02], [0, 0, i * .2]); P(head, GEO.sphLo, cm, [i * hr * .24, hr * 1.35, 0], [hr * .08, hr * .08, hr * .08]); } break;
    case 'plume': P(head, GEO.cone, cm, [0, hr * .1, -hr * .8], [hr * .06, hr * 1.4, hr * .06], [-2, 0, 0]); break;
    case 'cap': P(head, GEO.hemi, cm, [0, hr * .15, -hr * .1], [hr * 1.02, hr * .9, hr * 1]); break;
    case 'topknot': P(head, GEO.sph, cm, [0, hr * .9, hr * .3], [hr * .12, hr * .35, hr * .2], [.5, 0, 0]); break;
    case 'mane': P(head, GEO.sph, cm, [0, hr * .5, -hr * .4], [hr * .7, hr * .6, hr * .9]); break;
    case 'double': for (const sx of [1, -1]) P(head, GEO.cone, cm, [sx * hr * .3, hr * .7, -hr * .2], [hr * .12, hr * .7, hr * .12], [-.5, 0, sx * -.3]); break;
    case 'quills': for (let i = 0; i < 5; i++) P(head, GEO.cyl, cm, [0, hr * .4, -hr * .6], [hr * .02, hr * 1.4, hr * .02], [-1.8 + i * .15, (i - 2) * .2, 0]); break;
    case 'ptero': P(head, GEO.cone, cm, [0, hr * .3, -hr * .6], [hr * .2, hr * 2.4, hr * .08], [-1.9, 0, 0]); break;
    case 'flame': for (let i = 0; i < 4; i++) P(head, GEO.cone, K.glow, [0, hr * .7, -hr * .2 * i], [hr * .18, hr * (1.1 - i * .15), hr * .1], [-.5 - i * .3, 0, 0]); break;
  }
  const ex = new Set(p.extras || []);
  if (ex.has('wattle')) P(head, GEO.sph, toon('#d32f2f'), [0, -hr * .65, hr * .6], [hr * .12, hr * .25, hr * .1]);
  if (ex.has('snood')) P(head, GEO.cyl, toon('#d32f2f'), [0, hr * .3, hr * 1.0], [hr * .05, hr * .5, hr * .05], [.3, 0, 0]);
  if (ex.has('ruff')) P(neck, GEO.sph, K.white, [0, 0, 0], [br * .45, br * .25, br * .45]);
  if (ex.has('cheekDots')) for (const sx of [1, -1]) P(head, GEO.sph, toon('#ff8a3a'), [sx * hr * .65, -hr * .1, hr * .45], [hr * .2, hr * .2, hr * .1]);
  if (ex.has('cheekPatch') || ex.has('cheekWhite')) for (const sx of [1, -1]) P(head, GEO.sph, ex.has('cheekWhite') ? K.white : K.beak, [sx * hr * .7, -hr * .2, 0], [hr * .2, hr * .35, hr * .3]);
  if (ex.has('eyebrows')) for (const sx of [1, -1]) P(head, GEO.cone, toon('#f2e030'), [sx * hr * .5, hr * .5, hr * .2], [hr * .06, hr * .8, hr * .06], [-.8, 0, -sx * 1.1]);
  if (ex.has('faceWhite')) P(head, GEO.sph, K.white, [0, 0, hr * .45], [hr * .8, hr * .7, hr * .6]);
  if (ex.has('bib')) P(tilt, GEO.sph, K.white, [0, br * .2, br * bl * .6], [br * .6, br * .5, br * .3]);
  if (ex.has('casque')) P(head, GEO.sph, K.beak, [0, hr * .45, hr * 1.1], [hr * .25, hr * .3, hr * .6]);
  if (ex.has('casqueHelmet')) P(head, GEO.cone, toon('#8a6a3a'), [0, hr * .7, 0], [hr * .4, hr * 1, hr * .5], [-.3, 0, 0]);
  if (ex.has('eyeStripe') || ex.has('mask')) P(head, GEO.sph, K.dark, [0, hr * .2, hr * .3], [hr * 1.02, hr * .2, hr * .7]);
  if (ex.has('neckRing')) P(neck, GEO.torus, K.white, [0, nl * .2, 0], [p.neckR * 1.05 || .05, p.neckR * 1.05 || .05, .03], [Math.PI / 2, 0, 0]);
  if (ex.has('beakKnob')) P(bk, GEO.sph, K.dark, [0, hr * .15, 0], [hr * .15, hr * .15, hr * .12]);
  if (ex.has('shaggy')) for (let i = 0; i < 6; i++) P(tilt, GEO.sphLo, K.main, [(i % 2 ? 1 : -1) * br * .6, -br * .2, (i / 5 - .5) * br * bl], [br * .4, br * .6, br * .3]);
  if (ex.has('sails')) for (const sx of [1, -1]) P(tilt, GEO.wedge, K.main, [sx * br * .5, br * .6, -br * .3], [br * .05, br * .6, br * .4]);
  if (ex.has('teeth')) for (let i = 0; i < 3; i++) P(bk, GEO.cone, K.teeth, [0, -hr * .1, hr * .1 * i], [hr * .03, hr * .1, hr * .03], [Math.PI, 0, 0]);
  if (ex.has('cape')) P(tilt, GEO.sph, K.second, [0, br * .5, br * .3], [br * .9, br * .3, br * .8]);
  // tail
  const tg = G(tilt, [0, br * .2, -br * bl * .85]);
  rig.tailBase = tg; rig.tail = [tg]; rig.tailAngle = 0;
  const tm = p.tailC ? K[p.tailC] : K.main, tL = (p.tailL || 1) * br;
  switch (p.tail) {
    case 'long': P(tg, GEO.sph, tm, [0, 0, -tL * .6], [br * .25, br * .06, tL * .8]); break;
    case 'fan': for (let i = -4; i <= 4; i++) P(tg, GEO.sph, i % 2 ? K.main : K.accent, [i * br * .12, br * .45, -br * .2], [br * .12, br * .65, br * .04], [-.3, 0, -i * .17]); break;
    case 'chicken': for (let i = -1; i <= 1; i++) P(tg, GEO.sph, tm, [i * br * .1, br * .3, -br * .1], [br * .1, br * .45, br * .25], [-.5, 0, -i * .3]); break;
    case 'sickle': for (let i = -2; i <= 2; i++) { const c = G(tg, [i * br * .07, br * .2, 0], [-.4, 0, -i * .2]); chain(c, 3, br * .35, br * .05, br * .03, [.45, 0, 0], tm); } break;
    case 'peacock': {
      rig.fan = G(tg, [0, 0, 0], [-1.45, 0, 0]);
      for (let i = -6; i <= 6; i++) { const f = G(rig.fan, [0, 0, 0], [0, 0, i * .15]); P(f, GEO.sph, K.second, [0, br * 1.4, 0], [br * .12, br * 1.5, br * .03]); P(f, GEO.sph, K.accent, [0, br * 2.6, br * .02], [br * .15, br * .2, br * .03]); P(f, GEO.sph, K.main, [0, br * 2.6, br * .04], [br * .07, br * .1, br * .03]); }
      break;
    }
    case 'lyre': for (const sx of [1, -1]) { const c = G(tg, [sx * br * .1, 0, 0], [-1.1, 0, sx * .2]); chain(c, 5, br * .3, br * .05, br * .04, [.25, 0, -sx * .15], K.second); } break;
    case 'plumes': for (let i = -2; i <= 2; i++) { const c = G(tg, [i * br * .06, 0, 0], [-1.9, 0, i * .25]); chain(c, 4, br * .35 * (p.tailL || 1), br * .05, br * .09, [.12, 0, 0], tm); } break;
    case 'forked': for (const sx of [1, -1]) P(tg, GEO.cone, tm, [sx * br * .1, 0, 0], [br * .1, br * .9, br * .03], [-1.7, 0, sx * .3]); break;
    case 'fluffy': P(tg, GEO.sph, K.second, [0, br * .2, 0], [br * .45, br * .4, br * .35]); break;
    case 'stub': P(tg, GEO.sph, tm, [0, 0, -br * .1], [br * .2, br * .06, br * .3]); break;
    case 'none': break;
    default: P(tg, GEO.sph, tm, [0, 0, -br * .3], [br * .3, br * .06, br * .45]);
  }
}

function buildSnake(p, K, rig, opts) {
  const R = rig.root, n = p.n, r = p.r, len = p.len;
  rig.segs = [];
  rig.baseY = r;
  const mats = p.bands ? [K.skin, K.second] : [K.skin];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const rr = r * (i === 0 ? .95 : 1 - Math.pow(t, 1.6) * .8);
    const g = G(R, [0, rr, -i * len]);
    P(g, GEO.sph, mats[i % mats.length], [0, 0, 0], [rr, rr * (p.burrow ? 1 : .85), len * .85]);
    if (p.extras.includes('stubLegs') && i % 1 === 0 && i > 0) for (const sx of [1, -1]) P(g, GEO.sphLo, K.second, [sx * rr * .8, -rr * .8, 0], [rr * .2, rr * .3, rr * .2]);
    if (p.extras.includes('manyLegs') && i > 0) for (const sx of [1, -1]) P(g, GEO.cyl, K.accent, [sx * rr * 1.2, -rr * .5, 0], [rr * .1, rr * 1.4, rr * .1], [0, 0, sx * 1.1]);
    if (p.extras.includes('finRidge') && i > 0 && i < n - 1) P(g, GEO.wedge, K.accent, [0, rr * .8, 0], [rr * .05, rr * .8, len * .4]);
    if (p.extras.includes('spots') && i % 2) P(g, GEO.sphLo, K.accent, [0, rr * .8, 0], [rr * .25, rr * .15, rr * .25]);
    if (p.extras.includes('featherRuff') && i < 3) for (let k = 0; k < 6; k++) P(g, GEO.cone, k % 2 ? K.accent : K.second, [0, 0, 0], [rr * .25, rr * 2.2, rr * .1], [0, 0, k / 6 * Math.PI * 2]);
    if (p.extras.includes('dragonLegs') && (i === 3 || i === Math.floor(n * .6))) for (const sx of [1, -1]) { const lg = G(g, [sx * rr, 0, 0], [0, 0, sx * .9]); P(lg, GEO.limb, K.main, [0, 0, 0], [rr * .25, rr * 2, rr * .25]); for (const c of [-1, 0, 1]) P(lg, GEO.cone, K.claw, [c * rr * .1, -rr * 2, rr * .1], [rr * .06, rr * .4, rr * .06], [Math.PI / 2, 0, 0]); }
    if (p.extras.includes('smallWings') && i === 2) wings(g, [rr, rr * .4, 0], rr * 5, rr * 4, K.accent, rig, 'feather', { fold: .3 });
    rig.segs.push(g);
  }
  if (p.glow) rig.glowMats.push(K.skin);
  const head = rig.head = G(rig.segs[0], [0, 0, len * .5]);
  const hr = p.headR;
  if (p.extras.includes('wormMouth')) {
    P(head, GEO.torus, K.second, [0, 0, 0], [hr, hr, hr * .8]);
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; P(head, GEO.cone, K.teeth, [Math.cos(a) * hr * .8, Math.sin(a) * hr * .8, 0], [hr * .08, hr * .5, hr * .08], [Math.PI / 2, 0, a + Math.PI / 2]); }
    P(head, GEO.disc, toon('#5a1a1a'), [0, 0, -hr * .2], [hr * .8, hr * .1, hr * .8], [Math.PI / 2, 0, 0]);
  } else {
    P(head, GEO.sph, K.skin, [0, 0, hr * .3], [hr * 1.1, hr * .78, hr * 1.4]);
    if (!p.noEyes) eyes(head, hr * .6, hr * .35, hr * .7, hr * .32, K, rig, .5);
    const tongue = rig.tongue = G(head, [0, -hr * .2, hr * 1.5]);
    P(tongue, GEO.cyl, toon('#e0304a'), [0, 0, hr * .3], [hr * .05, hr * .6, hr * .05], [Math.PI / 2, 0, 0]);
    tongue.scale.set(1, 1, .01);
    if (p.extras.includes('antennae')) for (const sx of [1, -1]) P(head, GEO.cyl, K.dark, [sx * hr * .4, hr * .9, hr * .5], [hr * .05, hr * .9, hr * .05], [.4, 0, -sx * .4]);
    if (p.extras.includes('horn')) P(rig.segs[n - 1], GEO.cone, K.dark, [0, r * .3, 0], [r * .15, r * .8, r * .15], [-.4, 0, 0]);
    if (p.extras.includes('dragonHead')) {
      P(head, GEO.sph, K.second, [0, -hr * .2, hr * 1.2], [hr * .8, hr * .5, hr * .8]);
      for (const sx of [1, -1]) {
        const h = G(head, [sx * hr * .5, hr * .6, 0], [-.9, 0, -sx * .5]); chain(h, 3, hr * .5, hr * .1, hr * .05, [-.3, 0, sx * .2], K.horn);
        P(head, GEO.cyl, K.accent, [sx * hr * .8, -hr * .3, hr * 1.5], [hr * .03, hr * 2.4, hr * .03], [.3, 0, sx * 1.1]);
      }
      for (let k = 0; k < 5; k++) P(head, GEO.cone, K.accent, [0, hr * .5, -hr * .2 * k], [hr * .3, hr * .8, hr * .1], [-1.1 - k * .1, 0, 0]);
      rig.jaw = G(head, [0, -hr * .45, hr * .3]); P(rig.jaw, GEO.sph, K.second, [0, 0, hr * .7], [hr * .7, hr * .25, hr * .9]);
    }
    if (p.extras.includes('jawOpen')) { rig.jaw = G(head, [0, -hr * .35, hr * .2]); P(rig.jaw, GEO.sph, K.second, [0, 0, hr * .6], [hr * .8, hr * .3, hr * .9]); }
  }
  if (p.extras.includes('rattle')) for (let k = 0; k < 3; k++) P(rig.segs[n - 1], GEO.sph, toon('#e8d8a8'), [0, 0, -len * (.5 + k * .35)], [r * .5, r * .4, len * .3]);
}

function buildFish(p, K, rig, opts) {
  const R = rig.root, bl = p.bodyL, bh = p.bodyH, bw = p.bodyW;
  const body = rig.body = G(R, [0, 0, 0]);
  rig.baseY = 0;
  const front = G(body, [0, 0, bl * .1]);
  P(front, GEO.sph, K.skin, [0, 0, 0], [bw / 2, bh / 2, bl * .42]);
  if (p.bellyC) P(front, GEO.sph, K[p.bellyC], [0, -bh * .12, 0], [bw * .42, bh * .38, bl * .38]);
  const back = rig.back = G(body, [0, 0, -bl * .2]);
  P(back, GEO.sph, K.skin, [0, 0, -bl * .12], [bw * .4, bh * .38, bl * .32]);
  const tf = rig.tailFin = G(back, [0, 0, -bl * .42]);
  const ts = p.tailFin || .35;
  if (p.flukes) { for (const sx of [1, -1]) P(tf, GEO.sph, K.main, [sx * ts * .5, 0, -ts * .25], [ts * .55, bh * .05, ts * .28], [0, sx * .4, 0]); }
  else if (p.fancyTail) for (const a of [-.5, .5]) P(tf, GEO.sph, K.accent === K.main ? K.main : K.main, [0, a * ts * .6, -ts * .5], [bw * .05, ts * .7, ts * .55], [a, 0, 0]);
  else for (const a of [-.55, .55]) P(tf, GEO.wedge, p.tailC ? K[p.tailC] : K.main, [0, 0, 0], [bw * .06, ts, ts * .45], [-Math.PI / 2 + a, 0, 0]);
  if (p.dorsal) { const dg = G(front, [0, bh * .4, -bl * .05]); P(dg, GEO.wedge, p.shark || p.flukes ? K.main : K.accent, [0, 0, 0], [bw * .06, p.dorsal * (p.shark ? 1.2 : 1), bl * .22], [-.3, 0, 0]); rig.dorsal = dg; }
  if (p.extras.includes('analFin')) P(front, GEO.wedge, K.main, [0, -bh * .4, -bl * .05], [bw * .06, p.dorsal, bl * .2], [Math.PI + .3, 0, 0]);
  rig.fins = [];
  for (const sx of [1, -1]) { const f = G(front, [sx * bw * .45, -bh * .15, bl * .05]); P(f, GEO.sph, p.extras.includes('longFlippers') ? K.second : K.main, [sx * bh * (p.extras.includes('longFlippers') ? .6 : .2), 0, 0], [bh * (p.extras.includes('longFlippers') ? .7 : .22), bw * .03, bl * .1]); rig.fins.push({ g: f, sx }); }
  // head features
  const head = rig.head = G(front, [0, 0, bl * .35]);
  rig.snout = head;
  const er = Math.min(bh, bl) * (p.flukes ? .1 : .16);
  if (p.snout === 'hammer') { P(head, GEO.sph, K.main, [0, 0, bl * .05], [bh * 1.2, bh * .12, bl * .1]); for (const sx of [1, -1]) { const g = G(head, [sx * bh * 1.1, 0, bl * .05]); P(g, GEO.sph, K.eyeW, [0, 0, 0], [er, er, er]); P(g, GEO.sph, K.pupil, [sx * er * .5, 0, 0], [er * .6, er * .6, er * .6]); rig.eyes.push(g); } }
  else eyes(head, bw * .38, bh * .1, bl * .02, er, K, rig, 1.1);
  if (p.snout === 'sword') P(head, GEO.cone, K.main, [0, 0, bl * .05], [bh * .06, p.snoutL, bh * .06], [Math.PI / 2, 0, 0]);
  if (p.snout === 'beak') P(head, GEO.sph, K.main, [0, -bh * .1, bl * .12], [bw * .25, bh * .14, p.snoutL]);
  if (p.snout === 'tusk') { const t = G(head, [bw * .1, 0, bl * .05], [Math.PI / 2, 0, 0]); chain(t, 3, p.snoutL / 3, bh * .04, bh * .02, [0, .5, 0], K.horn); }
  if (p.smile) P(head, GEO.torus, K.dark, [0, -bh * .18, bl * .05], [bw * .2, bw * .2, bw * .2], [0, 0, Math.PI]);
  const ex = new Set(p.extras || []);
  if (ex.has('whiskers')) for (const sx of [1, -1]) P(head, GEO.cyl, K.dark, [sx * bw * .3, -bh * .2, bl * .05], [bw * .02, bh * .7, bw * .02], [0, 0, sx * 1.9]);
  if (ex.has('teeth')) for (let i = -2; i <= 2; i++) P(head, GEO.cone, K.teeth, [i * bw * .08, -bh * .2, bl * .04], [bw * .03, bh * .1, bw * .03], [Math.PI, 0, 0]);
  if (ex.has('wideMouth')) P(head, GEO.sph, K.dark, [0, -bh * .15, bl * .06], [bw * .4, bh * .06, bl * .03]);
  if (ex.has('puffSpikes')) for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, b = (i % 3) - 1; P(front, GEO.cone, K.accent, [Math.cos(a) * bw * .45, Math.sin(a) * bh * .45, b * bl * .2], [bw * .03, bh * .15, bw * .03], [0, 0, a - Math.PI / 2]); }
  if (ex.has('spikyFins')) for (let i = 0; i < 9; i++) P(front, GEO.cyl, i % 2 ? K.second : K.main, [0, bh * .3, (i / 8 - .5) * bl * .6], [bw * .02, bh * .9, bw * .02], [-.3, 0, (i % 2 ? 1 : -1) * .5 * (i % 3)]);
  if (ex.has('longFins')) for (const sx of [1, -1]) P(back, GEO.sph, K.accent, [0, sx * bh * .45, -bl * .1], [bw * .04, bh * .5, bl * .3], [sx * .6, 0, 0]);
  if (ex.has('melon')) P(head, GEO.sph, K.main, [0, bh * .15, 0], [bw * .5, bh * .45, bl * .12]);
  if (ex.has('bigHead')) P(front, GEO.sph, K.main, [0, bh * .05, bl * .25], [bw * .55, bh * .58, bl * .28]);
  if (ex.has('eyePatch')) for (const sx of [1, -1]) P(head, GEO.sph, K.white, [sx * bw * .42, bh * .12, -bl * .05], [bw * .1, bh * .1, bl * .1]);
  if (ex.has('gills')) for (const sx of [1, -1]) for (let i = 0; i < 3; i++) P(front, GEO.cyl, K.dark, [sx * bw * .48, 0, bl * (.25 - i * .04)], [bw * .01, bh * .3, bw * .01]);
  if (ex.has('blowhole')) rig.blowhole = G(front, [0, bh * .5, bl * .2]);
}
function buildRay(p, K, rig) {
  const R = rig.root, s = 1;
  const body = rig.body = G(R, [0, 0, 0]);
  rig.baseY = 0;
  P(body, GEO.sph, K.skin, [0, 0, 0], [.18, .07, .35]);
  rig.fins = [];
  for (const sx of [1, -1]) { const w = G(body, [sx * .12, 0, 0]); P(w, GEO.sph, K.skin, [sx * .28, 0, -.02], [.32, .025, .26], [0, sx * .3, 0]); if (p.bellyC) P(w, GEO.sph, K[p.bellyC], [sx * .28, -.012, -.02], [.3, .02, .24], [0, sx * .3, 0]); rig.fins.push({ g: w, sx }); }
  const t = rig.tailFin = G(body, [0, 0, -.3]); P(t, GEO.cyl, K.dark, [0, 0, -.3], [.012, .6, .012], [Math.PI / 2, 0, 0]);
  rig.back = t;
  eyes(body, .08, .06, .22, .035, K, rig, .3);
  if (p.horns) for (const sx of [1, -1]) P(body, GEO.sph, K.skin, [sx * .1, 0, .38], [.04, .02, .08], [0, sx * .3, 0]);
}
function buildBug(p, K, rig, opts) {
  const R = rig.root;
  const legsN = p.legs || 6, hr = p.headR, tr = p.thoraxR, [al, ah, aw] = p.abdomen;
  const body = rig.body = G(R, [0, (p.longLegs ? .16 : .1) + ah * .2, 0]);
  rig.baseY = body.position.y;
  const shinyO = p.shiny ? { emissive: K.mainHex, ei: .15 } : undefined;
  const thorax = G(body, [0, 0, 0]);
  P(thorax, GEO.sph, K.main, [0, 0, 0], [tr * (p.thin ? .6 : 1), tr * (p.thin ? .7 : 1), tr * (p.extras.includes('longThorax') ? 2.2 : 1.1)]);
  const abd = rig.back = G(body, [0, ah * .2, -tr * 1.1]);
  P(abd, GEO.sph, K.skin, [0, 0, -al * .5], [aw, ah, al * .6]);
  if (p.glowTail) { const gm = toon(p.glowTail, { emissive: p.glowTail, ei: 1.5 }); P(abd, GEO.sph, gm, [0, 0, -al * .95], [aw * .7, ah * .7, al * .3]); }
  if (p.wings === 'elytra') { for (const sx of [1, -1]) { const w = G(abd, [sx * aw * .02, ah * .3, 0]); P(w, GEO.sph, p.pattern ? K.skin : toon(p.wingColor ? K.mainHex : K.mainHex, shinyO), [sx * aw * .45, 0, -al * .5], [aw * .55, ah * .85, al * .62]); rig.wings.push({ g: w, sx, fold: 0, elytra: true }); } }
  const head = rig.head = G(body, [0, tr * .1, tr * (p.extras.includes('longThorax') ? 2.4 : 1.1)]);
  P(head, GEO.sph, K.main, [0, 0, hr * .5], [hr, hr * .9, hr]);
  const eb = p.eyeBig;
  eyes(head, hr * (eb ? .6 : .5), hr * .3, hr * .9, hr * (eb ? .55 : .34), K, rig, .8);
  // antennae
  if (p.antennae) for (const sx of [1, -1]) {
    const a = G(head, [sx * hr * .3, hr * .6, hr * .8], [-.6, 0, -sx * .35]);
    const L = p.antennae === 'long' ? hr * 4 : hr * 2;
    const seg = chain(a, 2, L / 2, hr * .06, hr * .04, [p.antennae === 'elbow' ? .9 : .3, 0, 0], K.dark);
    if (p.antennae === 'club') P(seg[1], GEO.sph, K.dark, [0, L / 2, 0], [hr * .14, hr * .2, hr * .14]);
    if (p.antennae === 'feather') P(seg[1], GEO.sph, K.second, [0, L / 4, 0], [hr * .3, L / 3, hr * .05]);
    rig.ears.push({ g: a, sx, base: a.rotation.x });
  }
  // legs
  const pairs = legsN / 2, lL = p.longLegs ? .5 : .3;
  for (let i = 0; i < pairs; i++) for (const sx of [1, -1]) {
    const z = tr * (.8 - i * (1.6 / Math.max(1, pairs - 1)));
    const g = G(thorax, [sx * tr * .6, -tr * .2, z], [0, sx * (i - (pairs - 1) / 2) * .35, -sx * 1.0]);
    const ext = p.extras.includes('jumpLegs') && i === pairs - 1 ? 1.8 : 1;
    const seg = chain(g, 2, lL * .5 * ext, hr * .2, hr * .13, [0, 0, sx * -1.3], i === pairs - 1 && p.extras.includes('jumpLegs') ? K.second : K.dark);
    if (p.fuzzy) P(seg[0], GEO.sphLo, K.main, [0, lL * .25, 0], [hr * .12, lL * .3, hr * .12]);
    rig.legs.push({ g, ph: (i % 2 === 0) === (sx > 0) ? 0 : Math.PI, sx, bug: true, base: g.rotation.y });
  }
  // wings
  const wM = p.wings === 'butterfly' || p.wings === 'moth' ? toon('#ffffff', { map: patternTex(p.wingPattern || 'spots', K.mainHex, K.secondHex), side: THREE.DoubleSide }) : toon('#e8f6ff', { opacity: .45, side: THREE.DoubleSide });
  if (p.wings === 'butterfly') wings(thorax, [tr * .3, tr * .5, 0], tr * 4.2, tr * 4, wM, rig, 'insect', { hind: true, hindMat: wM });
  else if (p.wings === 'clear') wings(thorax, [tr * .3, tr * .6, -tr * .3], tr * 2.2, tr * 1.6, wM, rig, 'insect', { hind: false });
  else if (p.wings === 'dragonfly') wings(thorax, [tr * .3, tr * .5, 0], tr * 4, tr * 1, wM, rig, 'insect', { hind: true });
  const ex = new Set(p.extras || []);
  if (ex.has('mandibles')) for (const sx of [1, -1]) P(head, GEO.cone, K.accent, [sx * hr * .4, 0, hr * 1.2], [hr * .12, hr * 1.6, hr * .12], [Math.PI / 2 - .1, sx * -.4, 0]);
  if (ex.has('hornBug')) P(head, GEO.cone, K.accent, [0, hr * .3, hr], [hr * .15, hr * 1.4, hr * .15], [.6, 0, 0]);
  if (ex.has('hornLong')) { P(head, GEO.cone, K.dark, [0, hr * .3, hr], [hr * .12, hr * 3, hr * .12], [1.1, 0, 0]); P(thorax, GEO.cone, K.dark, [0, tr * .8, tr * .5], [tr * .12, tr * 3, tr * .12], [1.2, 0, 0]); }
  if (ex.has('stinger')) P(abd, GEO.cone, K.dark, [0, 0, -al * 1.1], [aw * .1, al * .3, aw * .1], [-Math.PI / 2, 0, 0]);
  if (ex.has('proboscis')) P(head, GEO.cyl, K.dark, [0, -hr * .2, hr * 1.4], [hr * .03, hr * 1.4, hr * .03], [Math.PI / 2 + .4, 0, 0]);
  if (ex.has('pincers')) for (const sx of [1, -1]) { const g = G(thorax, [sx * tr * .8, 0, tr * 1.1], [0, sx * .5, 0]); P(g, GEO.limb, K.main, [0, 0, 0], [tr * .25, tr * 1.3, tr * .25], [-Math.PI / 2, 0, 0]); P(g, GEO.sph, K.skin, [0, 0, tr * 1.6], [tr * .55, tr * .35, tr * .7]); rig.arms.push({ g, sx, ph: sx > 0 ? 0 : Math.PI, base: g.rotation.x }); }
  if (ex.has('stingerTail')) { const t = G(abd, [0, ah * .3, -al * .9], [-.5, 0, 0]); const segs = chain(t, 5, al * .3, aw * .3, aw * .2, [-.55, 0, 0], K.skin); P(segs[4], GEO.cone, K.accent, [0, al * .3, 0], [aw * .18, al * .4, aw * .18], [-.8, 0, 0]); rig.tail = segs; rig.tailBase = t; rig.tailAngle = -.5; }
  if (ex.has('tailFan')) for (let i = -1; i <= 1; i++) P(abd, GEO.sph, K.accent, [i * aw * .5, 0, -al * 1.1], [aw * .35, ah * .1, al * .25], [0, i * .4, 0]);
  if (ex.has('raptorArms')) for (const sx of [1, -1]) { const g = G(thorax, [sx * tr * .4, 0, tr * 1.6], [-.8, 0, 0]); chain(g, 2, tr * 1, tr * .12, tr * .1, [2, 0, 0], ex.has('petals') ? K.second : K.main); rig.arms.push({ g, sx, ph: 0, base: g.rotation.x }); }
  if (ex.has('petals')) for (let i = 0; i < 4; i++) P(abd, GEO.sph, K.second, [(i % 2 ? 1 : -1) * aw * 1.2, 0, -al * (.2 + Math.floor(i / 2) * .4)], [aw * .6, ah * .1, al * .25]);
  if (ex.has('leafy')) P(abd, GEO.sph, K.second, [0, 0, -al * .5], [aw * 1.6, ah * .3, al * .7]);
  if (ex.has('dungBall')) { rig.ball = G(R, [0, .16, .55]); P(rig.ball, GEO.sph, toon('#6a4a2a'), [0, 0, 0], [.16, .16, .16]); }
  if (ex.has('wingTails')) for (const w of rig.wings) P(w.g, GEO.cone, wM, [w.sx * tr * 3, 0, -tr * 3], [tr * .5, tr * 4, tr * .1], [-2.4, 0, 0]);
  if (p.crab) { body.scale.set(1.6, .7, .8); }
  if (ex.has('snailShell')) { const sh = G(body, [0, ah * 1.4, -tr]); for (let i = 0; i < 4; i++) P(sh, GEO.torus, i % 2 ? K.accent : K.second, [0, i * tr * .25, 0], [tr * (1.2 - i * .25), tr * (1.2 - i * .25), tr * (1.2 - i * .25)], [Math.PI / 2, 0, 0]); }
}
function buildBlob(p, K, rig, opts) {
  const R = rig.root, f = p.form;
  const body = rig.body = G(R, [0, 0, 0]);
  rig.baseY = 0; rig.tentacles = [];
  if (f === 'jelly') {
    const jm = toon(K.mainHex, { opacity: .6, emissive: K.accentHex, ei: .4 });
    rig.bell = G(body, [0, .25, 0]);
    P(rig.bell, GEO.hemi, jm, [0, 0, 0], [.3, .28, .3]);
    P(rig.bell, GEO.hemi, toon(K.accentHex, { emissive: K.accentHex, ei: .8 }), [0, .02, 0], [.12, .1, .12]);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const t = G(rig.bell, [Math.cos(a) * .2, 0, Math.sin(a) * .2], [Math.PI, 0, 0]); rig.tentacles.push(chain(t, 4, .14, .015, .008, [.1, 0, 0], jm)); }
    rig.glowMats.push(jm);
  } else if (f === 'octopus') {
    const hd = rig.head = G(body, [0, .32, 0]);
    P(hd, GEO.sph, K.skin, [0, .12, -.08], [.3, .36, .32]);
    eyes(hd, .15, .02, .15, .07, K, rig, .4);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const t = G(hd, [Math.cos(a) * .15, -.12, Math.sin(a) * .15], [Math.PI * .65, a, 0]); t.rotation.order = 'YXZ'; t.rotation.set(Math.PI * .62, a, 0); rig.tentacles.push(chain(t, 5, .1, .06, .02, [-.18, 0, 0], K.skin, { mats: [K.skin, K.skin, K.second] })); }
  } else if (f === 'squid') {
    const hd = rig.head = G(body, [0, .2, 0], [Math.PI / 2 - .3, 0, 0]);
    P(hd, GEO.sph, K.skin, [0, -.3, 0], [.13, .4, .13]);
    for (const sx of [1, -1]) P(hd, GEO.sph, K.second, [sx * .1, -.6, 0], [.12, .1, .02], [0, 0, sx * .5]);
    eyes(hd, .1, .05, .06, .05, K, rig, 1.2);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const t = G(hd, [Math.cos(a) * .06, .05, Math.sin(a) * .06], [Math.cos(a) * .2, 0, Math.sin(a) * .2]); rig.tentacles.push(chain(t, 4, .12, .025, .01, [.05, 0, 0], K.second)); }
    rig.squid = true;
  } else if (f === 'star') {
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const t = G(body, [0, .04, 0], [0, a, 0]); const arm = G(t, [0, 0, 0], [Math.PI / 2, 0, 0]); rig.tentacles.push(chain(arm, 3, .1, .07, .03, [0, 0, 0], K.skin, { flat: .5 })); }
    P(body, GEO.sph, K.second, [0, .05, 0], [.1, .05, .1]);
    eyes(body, .03, .09, .04, .02, K, rig, 0);
  } else if (f === 'snail') {
    rig.head = G(body, [0, .05, .15]);
    P(body, GEO.sph, K.second, [0, .04, 0], [.08, .05, .26]);
    const sh = G(body, [0, .16, -.04], [0, Math.PI / 2, 0]);
    for (let i = 0; i < 5; i++) P(sh, GEO.torus, i % 2 ? K.main : K.accent, [0, 0, i * .015], [.14 - i * .025, .14 - i * .025, .14], [0, 0, 0]);
    for (const sx of [1, -1]) { const s = G(rig.head, [sx * .03, .03, 0], [-.3, 0, -sx * .3]); P(s, GEO.cyl, K.second, [0, .06, 0], [.008, .12, .008]); P(s, GEO.sph, K.dark, [0, .12, 0], [.018, .018, .018]); rig.ears.push({ g: s, sx, base: -.3 }); }
  } else if (f === 'nautilus') {
    const sh = G(body, [0, .15, 0]);
    P(sh, GEO.sph, toon('#ffffff', { map: patternTex('stripes', K.mainHex, K.secondHex) }), [0, 0, 0], [.08, .18, .18]);
    eyes(sh, .06, 0, .15, .03, K, rig, .5);
    for (let i = 0; i < 10; i++) { const t = G(sh, [(i % 2 ? .02 : -.02), -.05 + (i % 5) * .02, .16], [1.3, 0, (i - 5) * .1]); rig.tentacles.push(chain(t, 2, .07, .008, .005, [.3, 0, 0], K.second)); }
  } else if (f === 'oyster') {
    P(body, GEO.hemi, K.main, [0, 0, 0], [.22, .06, .18], [Math.PI, 0, 0]);
    rig.lid = G(body, [0, .01, -.15]);
    P(rig.lid, GEO.hemi, K.main, [0, 0, .15], [.22, .06, .18]);
    P(body, GEO.sph, toon('#fffaf4', { emissive: '#ffffff', ei: .3 }), [0, .03, 0], [.04, .04, .04]);
  } else if (f === 'coral') {
    const r = rng(hashStr(K.mainHex));
    for (let i = 0; i < 7; i++) { const g = G(body, [(r() - .5) * .3, 0, (r() - .5) * .3], [(r() - .5) * .8, 0, (r() - .5) * .8]); rig.tentacles.push(chain(g, 3, .12, .05, .03, [(r() - .5) * .6, 0, (r() - .5) * .6], i % 2 ? K.main : K.second)); }
    P(body, GEO.sph, K.accent, [0, .05, 0], [.2, .1, .2]);
    rig.coral = true;
  }
}
function buildFrog(p, K, rig) {
  const R = rig.root;
  const body = rig.body = G(R, [0, .14, 0], [-.35, 0, 0]);
  rig.baseY = .14;
  P(body, GEO.sph, K.skin, [0, 0, 0], [.2, .14, .22]);
  P(body, GEO.sph, K.second, [0, -.05, .04], [.16, .09, .17]);
  if (p.bumpy) for (let i = 0; i < 10; i++) P(body, GEO.sphLo, K.accent, [(i % 4 - 1.5) * .07, .1, (Math.floor(i / 4) - 1) * .07], [.025, .02, .025]);
  rig.head = G(body, [0, .04, .16]);
  P(rig.head, GEO.sph, K.skin, [0, 0, .04], [.17, .1, .12]);
  rig.throat = P(rig.head, GEO.sph, K.second, [0, -.07, .06], [.1, .05, .08]);
  eyes(rig.head, .09, .1, .04, .055, K, rig, .5);
  P(rig.head, GEO.torus, K.dark, [0, -.02, .15], [.07, .07, .07], [0, 0, Math.PI]);
  for (const sx of [1, -1]) {
    const f = G(body, [sx * .12, -.06, .12], [.4, 0, sx * .2]); P(f, GEO.limb, K.main, [0, 0, 0], [.03, .12, .03]); P(f, GEO.sph, K.accent, [0, -.12, .02], [.04, .015, .05]);
    rig.arms.push({ g: f, sx, ph: 0, base: .4 });
    const b = G(body, [sx * .15, -.04, -.12]);
    const th = G(b, [0, 0, 0], [-1.4, 0, 0]); P(th, GEO.sph, K.main, [0, .06, 0], [.06, .1, .06]);
    const sh = G(th, [0, .12, 0], [2.6, 0, 0]); P(sh, GEO.up, K.main, [0, 0, 0], [.03, .14, .03]);
    P(sh, GEO.sph, K.accent, [0, .14, .03], [.05, .015, .07]);
    rig.legs.push({ g: th, shin: sh, sx, ph: 0, frog: true });
  }
}
function buildBat(p, K, rig) {
  const R = rig.root;
  const body = rig.body = G(R, [0, .35, 0]);
  rig.baseY = .35;
  P(body, GEO.sph, K.skin, [0, 0, 0], [.12, .16, .12]);
  rig.head = G(body, [0, .16, .03]);
  P(rig.head, GEO.sph, K.main, [0, 0, 0], [.1, .09, .1]);
  if (p.snoutL) P(rig.head, GEO.sph, K.second, [0, -.02, .1], [.05, .04, p.snoutL]);
  eyes(rig.head, .045, .02, .08, .03, K, rig, .2);
  ears(rig.head, 'pointy', .1, K, rig, 1.4);
  wings(body, [.1, .06, 0], .55, .38, toon(K.secondHex, { side: THREE.DoubleSide }), rig, 'membrane', { fold: .9, boneMat: K.main });
  if ((p.extras || []).includes('fangs')) for (const sx of [1, -1]) P(rig.head, GEO.cone, K.teeth, [sx * .02, -.06, .08], [.01, .04, .01], [Math.PI, 0, 0]);
  if ((p.extras || []).includes('cape')) P(body, GEO.sph, K.accent, [0, .08, -.06], [.15, .12, .05]);
  for (const sx of [1, -1]) { const l = G(body, [sx * .05, -.14, 0]); P(l, GEO.limb, K.main, [0, 0, 0], [.015, .1, .015]); rig.legs.push({ g: l, sx, ph: 0 }); }
}
function buildSeal(p, K, rig) {
  const R = rig.root, hrm = p.headR || 1;
  const body = rig.body = G(R, [0, .2, 0]);
  rig.baseY = .2;
  rig.segs = [];
  const front = G(body, [0, 0, .15]); P(front, GEO.sph, K.skin, [0, 0, 0], [.26, .22, .32]);
  P(front, GEO.sph, K.second, [0, -.07, .05], [.2, .15, .25]);
  const back = rig.back = G(body, [0, -.03, -.15]); P(back, GEO.sph, K.skin, [0, 0, -.12], [.2, .16, .3]);
  const tf = rig.tailFin = G(back, [0, -.04, -.38]);
  if (p.manatee) P(tf, GEO.sph, K.main, [0, 0, -.1], [.22, .03, .14]);
  else for (const sx of [1, -1]) P(tf, GEO.sph, K.dark, [sx * .08, 0, -.06], [.07, .025, .14], [0, sx * .4, 0]);
  rig.fins = [];
  for (const sx of [1, -1]) { const f = G(front, [sx * .2, -.15, .1], [0, 0, sx * .3]); P(f, GEO.sph, K.dark, [sx * .06, -.02, 0], [.05, .02, .12]); rig.fins.push({ g: f, sx }); }
  const neck = rig.neck = G(front, [0, .08, .26], [.5, 0, 0]);
  rig.neckA = .5;
  const head = rig.head = G(neck, [0, .1, 0], [-.5, 0, 0]);
  rig.headA = -.5;
  P(head, GEO.sph, K.skin, [0, 0, 0], [.16 * hrm, .14 * hrm, .16 * hrm]);
  rig.snout = G(head, [0, -.04, .12 * hrm]);
  P(rig.snout, GEO.sph, K.second, [0, 0, .02], [.09, .07, .08]);
  P(rig.snout, GEO.sph, K.nose, [0, .03, .09], [.03, .02, .02]);
  eyes(head, .08 * hrm, .05, .1 * hrm, .05, K, rig, .3);
  const ex = new Set(p.extras || []);
  if (ex.has('tusks')) for (const sx of [1, -1]) P(rig.snout, GEO.cone, K.teeth, [sx * .04, -.04, .05], [.02, .28, .02], [Math.PI + .2, 0, 0]);
  if (ex.has('mustache')) P(rig.snout, GEO.sph, K.second, [0, -.02, .05], [.12, .06, .06]);
  if (ex.has('proboscis')) P(rig.snout, GEO.sph, K.main, [0, 0, .08], [.06, .07, .1]);
  if (p.manatee) { head.scale.set(1.2, 1, 1); rig.snout.scale.set(1.5, 1.3, 1); }
}
function buildSpecial(p, K, rig, opts) {
  const R = rig.root, m = p.model;
  if (m === 'mermaid') {
    const body = rig.body = G(R, [0, 0, 0]); rig.baseY = 0;
    const tail = rig.back = G(body, [0, 0, 0]);
    const segs = chain(G(tail, [0, 0, 0], [-Math.PI / 2 - .2, 0, 0]), 4, .18, .11, .05, [.1, 0, 0], K.skin);
    rig.segs2 = segs;
    P(segs[3], GEO.sph, K.accent, [0, .2, 0], [.25, .06, .15]);
    const torso = G(body, [0, .02, .02], [.3, 0, 0]);
    P(torso, GEO.sph, K.second, [0, .2, 0], [.13, .2, .1]);
    P(torso, GEO.sph, K.accent, [0, .3, .05], [.12, .06, .07]);
    const head = rig.head = G(torso, [0, .48, 0]);
    P(head, GEO.sph, K.second, [0, 0, 0], [.1, .11, .1]);
    P(head, GEO.sph, K.accent, [0, .03, -.04], [.12, .13, .12]);
    for (let i = 0; i < 5; i++) P(head, GEO.sph, K.accent, [(i - 2) * .03, -.12 - i % 2 * .05, -.08], [.04, .15, .04]);
    eyes(head, .04, .02, .08, .025, K, rig, .1);
    for (const sx of [1, -1]) { const a = G(torso, [sx * .12, .34, 0], [0, 0, sx * .3]); P(a, GEO.limb, K.second, [0, 0, 0], [.025, .22, .025]); rig.arms.push({ g: a, sx, ph: sx > 0 ? 0 : Math.PI, base: 0 }); }
    rig.mermaid = true;
  } else if (m === 'fairy') {
    const body = rig.body = G(R, [0, .5, 0]); rig.baseY = .5;
    P(body, GEO.cone, K.main, [0, -.15, 0], [.08, .25, .08]);
    const head = rig.head = G(body, [0, .16, 0]);
    P(head, GEO.sph, K.second, [0, 0, 0], [.07, .07, .07]);
    P(head, GEO.sph, K.accent, [0, .03, -.02], [.08, .07, .08]);
    eyes(head, .025, .01, .055, .018, K, rig, 0);
    wings(body, [.03, .05, -.03], .22, .2, toon(K.accentHex, { opacity: .5, emissive: K.accentHex, ei: .8, side: THREE.DoubleSide }), rig, 'insect', { hind: true });
    rig.glowMats.push(K.main);
  } else if (m === 'sponge') {
    const body = rig.body = G(R, [0, .32, 0]); rig.baseY = .32;
    const r2 = rng(5);
    P(body, GEO.box, K.skin, [0, 0, 0], [.42, .5, .3]);
    for (let i = 0; i < 12; i++) P(body, GEO.sphLo, K.accent, [(r2() - .5) * .38, (r2() - .5) * .44, .15], [.035, .035, .02]);
    rig.head = body;
    eyes(body, .09, .1, .14, .07, K, rig, 0);
    P(body, GEO.torus, toon('#7a2a1a'), [0, -.06, .155], [.1, .1, .05], [0, 0, Math.PI]);
    P(body, GEO.box, K.white, [0, -.1, .15], [.08, .04, .02]);
    for (const sx of [1, -1]) P(body, GEO.sph, toon('#ff7a7a'), [sx * .14, -.02, .15], [.04, .025, .01]);
    for (const sx of [1, -1]) { const a = G(body, [sx * .21, -.02, 0], [0, 0, sx * .5]); P(a, GEO.limb, K.second, [0, 0, 0], [.02, .18, .02]); P(a, GEO.sph, K.white, [0, -.19, 0], [.035, .035, .035]); rig.arms.push({ g: a, sx, ph: sx > 0 ? 0 : Math.PI, base: 0 }); }
    for (const sx of [1, -1]) { const l = G(body, [sx * .09, -.25, 0]); P(l, GEO.limb, K.second, [0, 0, 0], [.02, .07, .02]); P(l, GEO.sph, K.dark, [0, -.08, .02], [.04, .025, .06]); rig.legs.push({ g: l, sx, ph: sx > 0 ? 0 : Math.PI, biped: true }); }
    rig.sponge = true;
  } else if (m === 'wisp') {
    const body = rig.body = G(R, [0, .6, 0]); rig.baseY = .6;
    const core = toon(K.mainHex, { emissive: K.mainHex, ei: 1.6 });
    P(body, GEO.sph, core, [0, 0, 0], [.12, .14, .12]);
    P(body, GEO.sph, toon(K.accentHex, { opacity: .35, emissive: K.accentHex, ei: 1 }), [0, 0, 0], [.22, .24, .22]);
    rig.tentacles.push(chain(G(body, [0, -.05, -.05], [-2.4, 0, 0]), 4, .08, .07, .02, [.15, 0, 0], toon(K.accentHex, { opacity: .5, emissive: K.accentHex, ei: 1 })));
    eyes(body, .045, .02, .1, .025, K, rig, 0);
    rig.wisp = true;
  } else if (m === 'seahorse') {
    const body = rig.body = G(R, [0, 0, 0]); rig.baseY = 0;
    const segs = chain(G(body, [0, .1, 0], [Math.PI, 0, 0]), 6, .06, .055, .015, [-.35, 0, 0], K.skin);
    rig.segs2 = segs;
    const head = rig.head = G(body, [0, .16, .02], [.4, 0, 0]);
    P(head, GEO.sph, K.skin, [0, 0, 0], [.05, .06, .06]);
    P(head, GEO.cyl, K.skin, [0, -.02, .08], [.018, .08, .018], [Math.PI / 2 + .3, 0, 0]);
    eyes(head, .035, .01, .02, .018, K, rig, 1);
    P(body, GEO.sph, K.second, [0, .12, -.04], [.012, .06, .04]);
    rig.dorsal = G(body, [0, .1, -.05]);
    P(rig.dorsal, GEO.sph, K.accent, [0, 0, 0], [.01, .04, .03]);
  }
}
const BUILDERS = { quad: buildQuad, biped: buildBiped, bird: buildBird, snake: buildSnake, fish: buildFish, ray: buildRay, bug: buildBug, blob: buildBlob, frog: buildFrog, bat: buildBat, seal: buildSeal, special: buildSpecial };

/* ---------------- public API ---------------- */
export function buildAnimal(spKey, variant = 'common', opts = {}) {
  const sp = SPECIES[spKey];
  const p = Object.assign({}, presetFor(sp.model, sp.name), { model: sp.model });
  const v = VARIANT_BY_ID[variant] || VARIANT_BY_ID.common;
  const rig = {
    root: new THREE.Group(), kind: p.b, p, sp, variant: v.id,
    legs: [], arms: [], ears: [], tail: [], wings: [], eyes: [], fins: [], segs: [], tentacles: [], glow: [], glowMats: [], rainbowMats: [],
    rainbow: !!v.rainbow, flier: !!p.flier, swimmer: !!p.swimmer, swimOnly: !!p.swimOnly,
  };
  rig.mover = new THREE.Group(); // agent moves this; root carries the model
  const K = palette(sp.colors, v.id, p, rig);
  rig.K = K;
  try { BUILDERS[p.b](p, K, rig, opts); }
  catch (e) { console.warn('model build failed for', sp.model, e); }
  rig.mover.add(rig.root);
  // per-species base scale (cartoon-exaggerated so small creatures are visible)
  rig.size = Math.max(.32, p.s) * (v.scale || 1);
  rig.mover.userData.rig = rig;
  if (v.sparkle || p.aura) rig.sparkle = v.sparkle ? (v.id === 'golden' ? '#ffe680' : '#ff7ad0') : p.aura;
  rig.root.traverse(o => { if (o.isMesh) o.userData.rig = rig; });
  rig.state = { name: 'idle', t: 0, mv: 0, blinkT: Math.random() * 4, earT: Math.random() * 3, phase: Math.random() * 10 };
  return rig;
}

/* ---------------- ANIMATION ---------------- */
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
function dampRot(o, axis, target, k, dt) { o.rotation[axis] = damp(o.rotation[axis], target, k, dt); }
const _hsl = {};
// Behaviors each body plan supports (used by the agent AI)
export const BEHAVIORS = {
  quad: ['idle', 'walk', 'run', 'eat', 'look', 'sit', 'sleep', 'play', 'call', 'groom', 'shake', 'jump', 'scratch', 'stretch', 'sniff', 'roll', 'beg', 'yawn', 'flap'],
  biped: ['idle', 'walk', 'run', 'eat', 'look', 'sit', 'sleep', 'play', 'call', 'groom', 'jump', 'dance', 'wave', 'scratch', 'stomp', 'yawn', 'clap', 'stretch'],
  bird: ['idle', 'walk', 'run', 'peck', 'look', 'flap', 'preen', 'sleep', 'display', 'fly', 'call', 'hop', 'shake', 'dance'],
  snake: ['idle', 'walk', 'look', 'strike', 'sleep', 'coil', 'taste', 'sway'],
  fish: ['idle', 'walk', 'run', 'look', 'turn', 'nibble', 'jump', 'spin'],
  ray: ['idle', 'walk', 'glide', 'flap'],
  bug: ['idle', 'walk', 'run', 'groom', 'look', 'fly', 'jump', 'wiggle', 'dance'],
  blob: ['idle', 'walk', 'pulse', 'look', 'curl', 'wave'],
  frog: ['idle', 'walk', 'croak', 'look', 'sleep', 'jump', 'tongue'],
  bat: ['idle', 'fly', 'hang', 'groom', 'look', 'flap'],
  seal: ['idle', 'walk', 'call', 'sleep', 'roll', 'look', 'clap', 'play'],
  special: ['idle', 'walk', 'look', 'play', 'dance', 'wave', 'spin'],
};

export function animateRig(rig, dt, time) {
  const st = rig.state, p = rig.p, S_ = st.name;
  st.t += dt;
  const mv = st.mv || 0;
  const sizeK = 1 / Math.pow(rig.size, .35);
  st.phase += dt * (mv > .01 ? (5 + mv * 7) * sizeK : 0);
  const ph = st.phase;
  const k = 10;
  // blink
  st.blinkT -= dt;
  let eyeOpen = 1;
  if (st.blinkT < 0) { if (st.blinkT < -.14) st.blinkT = 2 + Math.random() * 4; else eyeOpen = .1; }
  if (S_ === 'sleep') eyeOpen = .08;
  for (const e of rig.eyes) e.scale.y = damp(e.scale.y, eyeOpen, 25, dt);
  // ear flicks / antennae
  st.earT -= dt;
  for (const e of rig.ears) {
    const flick = st.earT < 0 && st.earT > -.25 ? Math.sin(st.earT * 40) * .35 : 0;
    e.g.rotation.x = e.base + flick + (S_ === 'call' ? -.25 : 0) + (rig.kind === 'bug' ? Math.sin(time * 6 + e.sx) * .15 : 0);
  }
  if (st.earT < -.3) st.earT = 1.5 + Math.random() * 4;
  // rainbow & glow
  if (rig.rainbowMats.length) rig.rainbowMats.forEach((m, i) => m.color.setHSL((time * .12 + i * .17) % 1, .75, .6));
  if (rig.glow.length) { const gI = 1 + Math.sin(time * 3) * .5 + (S_ === 'call' ? 2.5 : 0); rig.glow.forEach(g => { if (g.material.emissiveIntensity !== undefined) g.material.emissiveIntensity = gI; }); }
  const breath = 1 + Math.sin(time * 2.2 + ph * .1) * .02;
  ANIM[rig.kind](rig, dt, time, st, mv, ph, k, breath);
  // tail wag shared
  if (rig.tail.length && rig.kind !== 'bird' && rig.kind !== 'bug') {
    const wagSpeed = S_ === 'play' || S_ === 'beg' ? 14 : mv > .1 ? 6 : 2.5, wagAmp = S_ === 'sleep' ? .04 : S_ === 'play' ? .5 : .22;
    rig.tail.forEach((s, i) => { s.rotation.y = Math.sin(time * wagSpeed - i * .6) * wagAmp * (i ? .6 : 1); });
  }
  // wings shared for flappers on non-birds
}
function legsWalk(rig, ph, amp, dt) {
  for (const L of rig.legs) {
    if (L.bug) { L.g.rotation.y = L.base + Math.sin(ph * 1.6 + L.ph) * amp * .7; L.g.rotation.x = Math.max(0, Math.sin(ph * 1.6 + L.ph)) * amp * .5; continue; }
    if (L.frog) continue;
    L.g.rotation.x = damp(L.g.rotation.x, Math.sin(ph + L.ph) * amp, 14, dt);
  }
}
const ANIM = {
  quad(rig, dt, time, st, mv, ph, k, breath) {
    const p = rig.p, S_ = st.name, t = st.t, B = rig.body;
    let amp = mv > .01 ? Math.min(.75, .35 + mv * .5) : 0, bodyY = rig.baseY, bodyRX = 0, bodyRZ = 0;
    let neckX = rig.neckA, headX = rig.headA, neckY = 0, headY = 0, snoutO = 0, rootY = 0, fold = 0, foldB = 0, wingF = 0;
    const gait = p.gait;
    if (mv > .01) {
      bodyY += Math.abs(Math.sin(ph)) * .025 * (1 + mv);
      if (gait === 'hop') { rootY = Math.abs(Math.sin(ph * .7)) * .35 * p.legL * 2 + .02; }
      if (gait === 'bound') bodyRX = Math.sin(ph) * .12;
      neckX += Math.sin(ph * 2) * .04;
      if (gait === 'scuttle') bodyRZ = Math.sin(ph) * .06;
    } else {
      switch (S_) {
        case 'eat': case 'sniff': neckX += 1.0; headX += .35; snoutO = Math.max(0, Math.sin(t * (S_ === 'sniff' ? 20 : 9))) * .25; break;
        case 'sleep': fold = 1; foldB = 1; bodyY = rig.baseY * .42; neckX += .55; headX += .2; break;
        case 'sit': foldB = 1; bodyRX = -.42; bodyY = rig.baseY * .82; neckX -= .25; break;
        case 'call': neckX -= .55; headX -= .25; snoutO = .4 + Math.sin(t * 14) * .3; bodyRZ = Math.sin(t * 20) * .02; break;
        case 'yawn': neckX -= .3; snoutO = Math.min(1, t) * .9; break;
        case 'look': headY = Math.sin(t * 1.4) * .9; break;
        case 'groom': case 'scratch': neckY = .9; neckX += .55; headX += .3; if (S_ === 'scratch' && rig.legs[2]) rig.legs[2].g.rotation.x = -1 + Math.sin(t * 25) * .4; break;
        case 'shake': bodyRZ = Math.sin(t * 38) * .32 * Math.max(0, 1 - t); break;
        case 'play': rootY = Math.abs(Math.sin(t * 7)) * .3 * rig.baseY; bodyRX = Math.sin(t * 7) * .25; amp = .5; st.phase += dt * 10; break;
        case 'jump': rootY = Math.max(0, Math.sin(Math.min(1, t * 1.6) * Math.PI)) * rig.baseY * .9; amp = .3; break;
        case 'stretch': fold = .55; bodyRX = .3; neckX -= .3; break;
        case 'roll': if (p.rollable) { bodyRZ = Math.min(2.8, t * 6); bodyY = rig.baseY * .55; amp = .6; st.phase += dt * 14; } break;
        case 'beg': if (p.standUp) { bodyRX = -1.1; bodyY = rig.baseY * 1.25; foldB = .2; } else { foldB = 1; bodyRX = -.5; } break;
        case 'flap': wingF = 1; break;
        default: neckX += Math.sin(time * .7 + ph) * .05;
      }
    }
    if (p.chameleon) { amp *= .6; st.phase -= dt * 3; }
    if (p.sitter && mv < .01 && S_ !== 'sleep') { foldB = 1; bodyRX = -.45; bodyY = rig.baseY * .8; }
    B.position.y = damp(B.position.y, bodyY, k, dt) ;
    rig.root.position.y = damp(rig.root.position.y, rootY, 18, dt);
    dampRot(B, 'x', bodyRX + (rig.baseRX || 0), k, dt); dampRot(B, 'z', bodyRZ, k, dt);
    B.scale.set(1, breath, 1);
    if (rig.neck) { dampRot(rig.neck, 'x', neckX, k, dt); dampRot(rig.neck, 'y', neckY, k, dt); }
    if (rig.head) { dampRot(rig.head, 'x', headX, k, dt); dampRot(rig.head, 'y', headY, k, dt); }
    if (rig.jaw) dampRot(rig.jaw, 'x', snoutO * .9, 18, dt); else if (rig.snout) rig.snout.scale.y = damp(rig.snout.scale.y, 1 + snoutO * .5, 18, dt);
    if (rig.trunk) rig.trunk.forEach((s, i) => { s.rotation.x = .18 + Math.sin(time * 1.8 + i * .5) * .14 + (S_ === 'call' ? -.5 : 0) + (S_ === 'eat' ? .1 : 0); s.rotation.z = Math.sin(time * 1.2 + i) * .08; });
    if (rig.extraHeads) rig.extraHeads.forEach((h, i) => { h.rotation.y = Math.sin(time * 1.3 + i * 1.7) * .5; h.rotation.x = .5 + Math.sin(time * 1.1 + i) * .2; });
    if (gait === 'hop' && mv > .01) { for (const L of rig.legs) L.g.rotation.x = damp(L.g.rotation.x, (L.front ? -1 : 1) * Math.sin(ph * .7) * .6, 14, dt); }
    else legsWalk(rig, ph, amp, dt);
    if (fold || foldB) for (const L of rig.legs) { const f = L.front ? fold : foldB; if (f) L.g.rotation.x = damp(L.g.rotation.x, (L.front ? 1.45 : -1.45) * f, k, dt); }
    for (const w of rig.wings) { const fl = rig.flying ? Math.sin(time * 9) * .9 : wingF ? Math.sin(time * 12) * .8 : 0; w.g.rotation.z = damp(w.g.rotation.z, w.sx * (fl + (rig.flying || wingF ? 0 : -w.fold * .2)), 20, dt); w.g.rotation.y = rig.flying || wingF ? 0 : w.sx * -w.fold; }
  },
  biped(rig, dt, time, st, mv, ph, k, breath) {
    const p = rig.p, S_ = st.name, t = st.t, B = rig.body, T = rig.torso;
    let amp = mv > .01 ? Math.min(.9, .4 + mv * .5) : 0, bodyY = rig.baseY, lean = rig.lean, rootY = 0, armUp = 0, armAmp = amp * .8, headX = rig.headA, headY = 0, jawO = 0, twist = 0, crouch = 0;
    const hopper = p.hopper;
    if (mv > .01) {
      if (hopper) { rootY = Math.abs(Math.sin(ph * .55)) * rig.baseY * .9; }
      else bodyY += Math.abs(Math.sin(ph)) * .03;
      if (p.stomp) twist = Math.sin(ph) * .08;
    } else {
      switch (S_) {
        case 'eat': lean += .35; armUp = 1.2; jawO = Math.max(0, Math.sin(t * 9)) * .3; break;
        case 'sit': crouch = 1; lean = Math.min(lean, .1); break;
        case 'sleep': crouch = 1; lean = .2; headX += .5; break;
        case 'call': case 'stomp': headX -= .5; jawO = .5 + Math.sin(t * 15) * .3; if (p.extras.includes('silverback') || p.model === 'gorilla' || p.model === 'titanape') { armUp = 1.6; armAmp = 0; } if (S_ === 'stomp') rootY = Math.abs(Math.sin(t * 6)) * .05; break;
        case 'look': headY = Math.sin(t * 1.4) * .9; break;
        case 'play': case 'dance': rootY = Math.abs(Math.sin(t * 6)) * rig.baseY * .25; twist = Math.sin(t * 6) * .35; armUp = 1.4 + Math.sin(t * 12) * .4; break;
        case 'wave': armUp = 0; break;
        case 'clap': armUp = 1.3; break;
        case 'groom': case 'scratch': armUp = 2.4; headY = .4; break;
        case 'jump': rootY = Math.max(0, Math.sin(Math.min(1, t * 1.5) * Math.PI)) * rig.baseY * .8; armUp = 2; break;
        case 'yawn': jawO = Math.min(1, t) * .9; armUp = 2.6; headX -= .3; break;
        case 'stretch': armUp = 2.8; lean = Math.min(lean, .1); break;
        default: headY = Math.sin(time * .5 + ph) * .2;
      }
    }
    B.position.y = damp(B.position.y, bodyY * (1 - crouch * .55), k, dt);
    rig.root.position.y = damp(rig.root.position.y, rootY, 16, dt);
    dampRot(T, 'x', lean, k, dt); dampRot(T, 'y', twist, k, dt);
    T.scale.set(1, breath, 1);
    for (const L of rig.legs) {
      const target = hopper && mv > .01 ? Math.sin(ph * .55) * .7 : crouch ? -1.4 : Math.sin(ph + L.ph) * amp;
      L.g.rotation.x = damp(L.g.rotation.x, target, 14, dt);
    }
    rig.arms.forEach((A, i) => {
      let target = A.base;
      if (p.knuckle && mv > .01) target = A.base + Math.sin(ph + A.ph + Math.PI) * amp;
      else target = A.base - armUp + Math.sin(ph + A.ph) * armAmp;
      if (S_ === 'wave' && i === 0) target = A.base - 2.6 + Math.sin(t * 10) * .3;
      if (S_ === 'clap') A.g.rotation.z = damp(A.g.rotation.z, -A.sx * (.6 + Math.sin(t * 16) * .35), 20, dt);
      else A.g.rotation.z = damp(A.g.rotation.z, 0, 8, dt);
      A.g.rotation.x = damp(A.g.rotation.x, target, 12, dt);
    });
    if (rig.head) { dampRot(rig.head, 'x', headX, k, dt); dampRot(rig.head, 'y', headY, k, dt); }
    if (rig.jaw) dampRot(rig.jaw, 'x', jawO, 18, dt);
    if (rig.tail.length) rig.tail.forEach((s, i) => { s.rotation.x = damp(s.rotation.x, i ? (p.curl ?? .05) + Math.sin(time * 1.5 + i * .4) * .05 : 0, 6, dt); });
  },
  bird(rig, dt, time, st, mv, ph, k, breath) {
    const p = rig.p, S_ = st.name, t = st.t, B = rig.body;
    let amp = mv > .01 && !rig.flying ? .7 : 0, bodyY = rig.baseY, neckX = rig.neckA, headX = rig.headA, headY = 0, wingFlap = 0, bodyRZ = 0, rootY = 0, tailUp = 0, fanUp = 0, tilt = 0;
    if (rig.flying) { wingFlap = (p.soar && Math.sin(time * .4) > .2 ? .15 : 1); for (const L of rig.legs) L.g.rotation.x = damp(L.g.rotation.x, .9, 8, dt); tilt = .35; }
    else if (mv > .01) {
      bodyY += Math.abs(Math.sin(ph)) * .02;
      if (p.waddle) bodyRZ = Math.sin(ph) * .15;
      if (p.headBob) neckX += Math.sin(ph * 2) * .25;
      if (p.hopper) rootY = Math.abs(Math.sin(ph * .7)) * .12;
    } else {
      switch (S_) {
        case 'peck': neckX += 1.2 * Math.max(0, Math.sin(t * 7)); headX += .4; break;
        case 'flap': wingFlap = 1; rootY = Math.abs(Math.sin(t * 7)) * .04; break;
        case 'preen': headY = 1.8; neckX += .4; break;
        case 'sleep': bodyY *= .82; headY = 2.4; neckX -= .2; break;
        case 'display': fanUp = 1; tailUp = 1; wingFlap = .15; bodyRZ = Math.sin(t * 9) * .06; break;
        case 'call': neckX -= .4; headX -= .3; if (rig.snout) rig.snout.rotation.x = Math.sin(t * 15) * .1; break;
        case 'look': headY = Math.sin(t * 1.5) * (p.facialDisc ? 2.4 : 1); break;
        case 'hop': rootY = Math.abs(Math.sin(t * 8)) * .12; break;
        case 'shake': bodyRZ = Math.sin(t * 40) * .3 * Math.max(0, 1 - t); break;
        case 'dance': bodyRZ = Math.sin(t * 6) * .25; neckX += Math.sin(t * 12) * .3; wingFlap = .4; break;
        default: headY = Math.sin(time * .9 + ph) * .3;
      }
    }
    B.position.y = damp(B.position.y, bodyY, k, dt);
    rig.root.position.y = damp(rig.root.position.y, rootY, 16, dt);
    dampRot(B, 'z', bodyRZ, k, dt); dampRot(B, 'x', tilt, 6, dt);
    B.scale.set(1, breath, 1);
    if (!rig.flying) legsWalk(rig, ph, amp, dt);
    if (rig.neck) dampRot(rig.neck, 'x', neckX, 14, dt);
    if (rig.head) { dampRot(rig.head, 'x', headX, 14, dt); dampRot(rig.head, 'y', headY, 10, dt); }
    for (const w of rig.wings) {
      const flap = wingFlap ? Math.sin(time * (p.hover ? 40 : 11)) * (p.hover ? .6 : 1.0) * wingFlap : 0;
      const open = wingFlap ? 1 : 0;
      w.g.rotation.y = damp(w.g.rotation.y, w.sx * -w.fold * (1 - open), 10, dt);
      w.g.rotation.z = damp(w.g.rotation.z, w.sx * (flap + (open ? .1 : 0)), 25, dt);
    }
    if (rig.fan) { rig.fan.scale.setScalar(damp(rig.fan.scale.x, fanUp ? 1 : .35, 6, dt)); dampRot(rig.fan, 'x', fanUp ? -.2 : -1.45, 6, dt); }
    if (rig.tailBase) dampRot(rig.tailBase, 'x', tailUp * -.5 + Math.sin(time * 2) * .05, 8, dt);
  },
  snake(rig, dt, time, st, mv, ph, k) {
    const p = rig.p, S_ = st.name, t = st.t, n = rig.segs.length, len = p.len;
    const moving = mv > .01;
    const flying = rig.flying || rig.swimming;
    const speed = moving ? 4 + mv * 4 : 1;
    const amp = moving ? .55 * p.r * 6 : S_ === 'coil' ? 0 : .15 * p.r * 4;
    for (let i = 0; i < n; i++) {
      const g = rig.segs[i];
      let x = Math.sin(time * speed - i * .55) * amp * Math.min(1, i / 3 + .2);
      let y = g.position.y, z = -i * len;
      if (S_ === 'coil' && !moving) { const a = i * .7, rr = len * (1.2 + i * .12); x = Math.cos(a) * rr; z = Math.sin(a) * rr - len * 2; }
      if (flying) y = Math.sin(time * speed * .8 - i * .5) * p.r * 3 + p.r;
      else if (p.burrow) y = Math.sin(time * 1.2 - i * .45) * p.r * 2.2;
      else y = p.r * (i === 0 && (S_ === 'look' || S_ === 'strike' || S_ === 'sway') ? 4 : 1);
      if (i === 1 && (S_ === 'look' || S_ === 'sway')) y = p.r * 2.4;
      g.position.x = damp(g.position.x, x + (S_ === 'sway' ? Math.sin(time * 2) * p.r * 2 * (1 - i / n) : 0), 10, dt);
      g.position.y = damp(g.position.y, y, 8, dt);
      g.position.z = damp(g.position.z, z + (S_ === 'strike' && i === 0 ? Math.max(0, Math.sin(t * 6)) * len * 4 : 0), 14, dt);
      if (i > 0) { const pr = rig.segs[i - 1]; g.rotation.y = Math.atan2(pr.position.x - g.position.x, pr.position.z - g.position.z); }
    }
    if (rig.segs[0] && rig.segs[1]) rig.segs[0].rotation.y = rig.segs[1].rotation.y;
    if (rig.tongue) rig.tongue.scale.z = (S_ === 'taste' || Math.sin(time * 3) > .85) ? 1 : .01;
    if (rig.jaw) dampRot(rig.jaw, 'x', S_ === 'strike' || S_ === 'call' ? .6 : .05, 14, dt);
    for (const w of rig.wings) w.g.rotation.z = w.sx * Math.sin(time * 8) * .7;
  },
  fish(rig, dt, time, st, mv, ph, k) {
    const p = rig.p, S_ = st.name, t = st.t;
    const sp = mv > .01 ? 6 + mv * 8 : 3;
    const a = mv > .01 ? .35 : .15;
    if (p.flukes) { dampRot(rig.back, 'x', Math.sin(time * sp * .6) * a * .5, 10, dt); dampRot(rig.tailFin, 'x', Math.sin(time * sp * .6 - .8) * a * .9, 10, dt); }
    else { dampRot(rig.back, 'y', Math.sin(time * sp) * a, 12, dt); dampRot(rig.tailFin, 'y', Math.sin(time * sp - .9) * a * 1.4, 12, dt); }
    for (const f of rig.fins) f.g.rotation.z = f.sx * (Math.sin(time * 5 + f.sx) * .3);
    if (rig.body) { rig.body.rotation.z = damp(rig.body.rotation.z, S_ === 'spin' ? t * 10 : 0, 6, dt); }
    if (S_ === 'jump' && p.jumper) rig.root.position.y = Math.max(0, Math.sin(Math.min(1, t * .8) * Math.PI)) * 1.6; else rig.root.position.y = damp(rig.root.position.y, 0, 4, dt);
    if (S_ === 'nibble' && rig.head) rig.head.scale.y = 1 + Math.max(0, Math.sin(t * 14)) * .2;
  },
  ray(rig, dt, time, st, mv) {
    const sp = mv > .01 ? 4 : 2;
    rig.fins.forEach(f => { f.g.rotation.z = f.sx * Math.sin(time * sp) * .45; });
    if (rig.tailFin) rig.tailFin.rotation.y = Math.sin(time * 2) * .3;
  },
  bug(rig, dt, time, st, mv, ph, k) {
    const p = rig.p, S_ = st.name, t = st.t;
    const flying = rig.flying;
    legsWalk(rig, ph * 1.5, flying ? .1 : mv > .01 ? .6 : 0, dt);
    for (const w of rig.wings) {
      if (w.elytra) { const open = flying ? 1 : 0; w.g.rotation.z = damp(w.g.rotation.z, w.sx * open * .9, 10, dt); continue; }
      const f = flying ? (p.flutter ? Math.sin(time * 9) * 1.0 : Math.sin(time * 45) * .5) : (p.flutter ? .9 + Math.sin(time * 1.5) * .25 : 0);
      w.g.rotation.z = w.sx * f;
    }
    if (rig.body) rig.body.position.y = damp(rig.body.position.y, rig.baseY + (S_ === 'wiggle' ? Math.abs(Math.sin(t * 12)) * .03 : 0), 12, dt);
    if (S_ === 'jump' && p.jumper) rig.root.position.y = Math.max(0, Math.sin(Math.min(1, t * 1.6) * Math.PI)) * .6; else if (!flying) rig.root.position.y = damp(rig.root.position.y, 0, 8, dt);
    if (rig.back) rig.back.rotation.x = Math.sin(time * 3) * .05 + (S_ === 'groom' ? .3 : 0);
    if (rig.tail.length) rig.tail.forEach((s, i) => { s.rotation.x = -.55 + Math.sin(time * 2 + i) * .08 + (S_ === 'wiggle' ? Math.sin(t * 10) * .2 : 0); });
    for (const A of rig.arms) A.g.rotation.x = A.base + (S_ === 'groom' ? Math.sin(t * 12) * .4 : Math.sin(time * 2 + A.ph) * .1);
    if (rig.ball && mv > .01) rig.ball.rotation.x += dt * mv * 8;
  },
  blob(rig, dt, time, st, mv, ph, k) {
    const p = rig.p, S_ = st.name;
    if (rig.bell) { const s = 1 + Math.sin(time * 3) * .15; rig.bell.scale.set(s, 2 - s, s); rig.tentacles.forEach((tc, i) => tc.forEach((g, j) => { g.rotation.x = Math.sin(time * 3 - j * .8 + i) * .25; })); return; }
    if (rig.coral) { rig.tentacles.forEach((tc, i) => tc.forEach((g, j) => { g.rotation.z = Math.sin(time * 1.2 + i + j) * .05; })); return; }
    if (rig.lid) { rig.lid.rotation.x = -Math.max(0, Math.sin(time * .7)) * .8; return; }
    if (rig.squid) { rig.tentacles.forEach((tc, i) => tc.forEach((g, j) => { g.rotation.x = Math.sin(time * 4 - j * .6 + i) * .25; })); if (rig.head) rig.head.position.y = .2 + Math.sin(time * 2) * .02; return; }
    const curl = S_ === 'curl' ? .5 : 0;
    rig.tentacles.forEach((tc, i) => tc.forEach((g, j) => { g.rotation.x = (j ? -.18 - curl : g.rotation.x) + (j ? Math.sin(time * (mv > .01 ? 6 : 2.5) - j * .9 + i * 1.3) * .22 : 0); if (j === 0 && rig.head) g.rotation.x = Math.PI * .62 + Math.sin(time * 2 + i) * .12; }));
    if (rig.head) { rig.head.position.y = damp(rig.head.position.y, .32 + (S_ === 'pulse' ? Math.sin(st.t * 5) * .05 : 0), 8, dt); rig.head.scale.y = 1 + Math.sin(time * 2) * .04; }
    for (const e of rig.ears) e.g.rotation.x = e.base + Math.sin(time * 2 + e.sx) * .2;
  },
  frog(rig, dt, time, st, mv, ph, k) {
    const S_ = st.name, t = st.t;
    const hopping = mv > .01 || S_ === 'jump';
    const hp = hopping ? Math.max(0, Math.sin((mv > .01 ? ph * .6 : t * 3))) : 0;
    rig.root.position.y = damp(rig.root.position.y, hp * .25, 20, dt);
    for (const L of rig.legs) { L.g.rotation.x = damp(L.g.rotation.x, -1.4 + hp * 1.3, 20, dt); L.shin.rotation.x = damp(L.shin.rotation.x, 2.6 - hp * 2.2, 20, dt); }
    if (rig.throat) { const s = S_ === 'croak' ? 1 + Math.max(0, Math.sin(t * 8)) * 1.4 : 1 + Math.sin(time * 3) * .1; rig.throat.scale.set(.1 * s, .05 * s, .08 * s); }
    if (rig.body) rig.body.rotation.x = damp(rig.body.rotation.x, hopping ? -.6 + hp * .4 : -.35, 12, dt);
  },
  bat(rig, dt, time, st, mv) {
    const S_ = st.name, flying = rig.flying;
    rig.body.rotation.z = damp(rig.body.rotation.z, S_ === 'hang' && !flying ? Math.PI : 0, 6, dt);
    for (const w of rig.wings) {
      const f = flying || S_ === 'flap' ? Math.sin(time * 14) * 1.0 : 0;
      w.g.rotation.y = damp(w.g.rotation.y, flying || S_ === 'flap' ? 0 : w.sx * -1.2, 8, dt);
      w.g.rotation.z = w.sx * f;
    }
    if (rig.head) rig.head.rotation.y = S_ === 'look' ? Math.sin(st.t * 2) * .8 : 0;
  },
  seal(rig, dt, time, st, mv, ph, k) {
    const S_ = st.name, t = st.t;
    const moving = mv > .01;
    const swim = rig.swimming;
    const w = moving ? Math.sin(ph * .8) : 0;
    rig.body.position.y = damp(rig.body.position.y, rig.baseY + (moving && !swim ? Math.abs(w) * .06 : 0), 12, dt);
    rig.back.rotation.x = damp(rig.back.rotation.x, w * .25 + (S_ === 'call' ? -.2 : 0), 10, dt);
    rig.tailFin.rotation.x = damp(rig.tailFin.rotation.x, w * .4 + Math.sin(time * 2) * .1, 10, dt);
    for (const f of rig.fins) f.g.rotation.x = moving ? Math.sin(ph * .8 + f.sx) * .6 : S_ === 'clap' ? 0 : 0;
    for (const f of rig.fins) f.g.rotation.z = f.sx * (S_ === 'clap' ? -1.2 + Math.sin(t * 16) * .4 : .3);
    if (rig.neck) dampRot(rig.neck, 'x', rig.neckA + (S_ === 'call' ? -.7 : S_ === 'sleep' ? .7 : 0), 10, dt);
    if (rig.snout) rig.snout.scale.y = damp(rig.snout.scale.y, S_ === 'call' ? 1.3 + Math.sin(t * 14) * .3 : 1, 14, dt);
    rig.body.rotation.z = damp(rig.body.rotation.z, S_ === 'roll' ? Math.min(Math.PI, t * 3) : 0, 6, dt);
    if (rig.head) rig.head.rotation.y = S_ === 'look' ? Math.sin(t * 1.5) * .8 : 0;
  },
  special(rig, dt, time, st, mv, ph, k) {
    const S_ = st.name, t = st.t;
    if (rig.mermaid) { (rig.segs2 || []).forEach((s, i) => { s.rotation.x = .1 + Math.sin(time * 4 - i * .8) * .25; }); rig.arms.forEach(A => { A.g.rotation.x = Math.sin(time * 2 + A.ph) * .4 - (S_ === 'wave' && A.sx > 0 ? 2.4 : 0); }); return; }
    if (rig.sponge) {
      const hop = mv > .01 ? Math.abs(Math.sin(ph * .8)) * .1 : S_ === 'play' || S_ === 'dance' ? Math.abs(Math.sin(t * 8)) * .15 : 0;
      rig.root.position.y = damp(rig.root.position.y, hop, 20, dt);
      const sq = 1 + Math.sin(time * (S_ === 'play' ? 16 : 3)) * (S_ === 'play' ? .08 : .03);
      rig.body.scale.set(2 - sq, sq, 1);
      legsWalk(rig, ph, mv > .01 ? .7 : 0, dt);
      rig.arms.forEach((A, i) => { A.g.rotation.x = Math.sin(ph + A.ph) * .6 * (mv > .01 ? 1 : 0) - (S_ === 'wave' && i === 0 ? 2.6 : S_ === 'dance' ? 2.2 + Math.sin(t * 12) * .4 : 0); });
      rig.body.rotation.y = S_ === 'spin' ? t * 8 : damp(rig.body.rotation.y, 0, 6, dt);
      return;
    }
    if (rig.wisp) { rig.body.position.y = rig.baseY + Math.sin(time * 2) * .08; rig.body.scale.setScalar(1 + Math.sin(time * 9) * .05); rig.tentacles.forEach(tc => tc.forEach((g, j) => { g.rotation.x = .15 + Math.sin(time * 5 - j) * .2; })); return; }
    if (rig.segs2) { rig.segs2.forEach((s, i) => { s.rotation.x = -.35 + Math.sin(time * 1.5 - i * .5) * .08; }); rig.root.position.y = Math.sin(time * 1.4) * .03; if (rig.dorsal) rig.dorsal.rotation.y = Math.sin(time * 20) * .5; return; }
    if (rig.wings.length) { for (const w of rig.wings) w.g.rotation.z = w.sx * Math.sin(time * 18) * .6; rig.body.position.y = rig.baseY + Math.sin(time * 2.4) * .05; }
  },
};
export function setState(rig, name) { if (rig.state.name !== name) { rig.state.name = name; rig.state.t = 0; } }
