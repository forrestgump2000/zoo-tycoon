/* Zoo Tycoon 3D — scenery, buildings, rides, people & vehicles (all procedural 3D models) */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GEO, GRAD, toon, mix, shade, rng, hashStr, buildAnimal } from './models.js';

// low-poly geometry for scenery (merged into big batches)
export const PG = {
  sph: new THREE.SphereGeometry(1, 9, 7),
  sphHi: new THREE.SphereGeometry(1, 14, 10),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 9),
  cyl16: new THREE.CylinderGeometry(1, 1, 1, 16),
  cone: (() => { const g = new THREE.ConeGeometry(1, 1, 8); g.translate(0, .5, 0); return g; })(),
  cone4: (() => { const g = new THREE.ConeGeometry(1, 1, 4); g.rotateY(Math.PI / 4); g.translate(0, .5, 0); return g; })(),
  box: new THREE.BoxGeometry(1, 1, 1),
  hemi: new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2),
  torus: new THREE.TorusGeometry(1, .12, 6, 24),
  plane: (() => { const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2); return g; })(),
  prism: (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 3); g.rotateZ(Math.PI / 2); g.rotateX(-Math.PI / 2); return g; })(),
};
for (const g of Object.values(PG)) if (!g.index) { /* all indexed */ }

export const VC = {
  toon: new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: GRAD }),
  glow: new THREE.MeshBasicMaterial({ vertexColors: true }),
  glass: new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: GRAD, transparent: true, opacity: .32, depthWrite: false }),
  water: new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: GRAD, transparent: true, opacity: .78 }),
};

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
export class Batch {
  constructor() { this.lists = { toon: [], glow: [], glass: [], water: [] }; this.base = new THREE.Matrix4(); this.stack = []; this.count = 0; }
  at(x, y, z, ry = 0, s = 1) { this.base.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(s, s, s)); return this; }
  push() { this.stack.push(this.base.clone()); return this; }
  pop() { this.base.copy(this.stack.pop()); return this; }
  local(x, y, z, ry = 0, s = 1) { _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(s, s, s)); this.base.multiply(_m); return this; }
  add(geo, color, pos, scl, rot, kind = 'toon') {
    _m.compose(_v.set(pos[0], pos[1], pos[2]), _q.setFromEuler(_e.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0)), _s.set(scl[0], scl[1], scl[2]));
    this.lists[kind].push({ geo, color, M: this.base.clone().multiply(_m) });
    this.count++;
  }
  build(opts = {}) {
    const group = new THREE.Group();
    for (const kind of ['toon', 'glow', 'glass', 'water']) {
      const list = this.lists[kind]; if (!list.length) continue;
      const geos = list.map(({ geo, color, M }) => {
        const g = geo.clone(); g.applyMatrix4(M);
        const n = g.attributes.position.count; _c.set(color);
        const arr = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { arr[i * 3] = _c.r; arr[i * 3 + 1] = _c.g; arr[i * 3 + 2] = _c.b; }
        g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
        return g;
      });
      const merged = mergeGeometries(geos, false);
      geos.forEach(g => g.dispose());
      const mesh = new THREE.Mesh(merged, opts.mats && opts.mats[kind] || VC[kind]);
      if (kind === 'toon') { mesh.castShadow = opts.shadow !== false; mesh.receiveShadow = opts.receive !== false; }
      mesh.userData.kind = kind;
      group.add(mesh);
    }
    return group;
  }
}

/* ---------------- scenery props ---------------- */
const vary = (hex, r, a = .12) => shade(hex, (r() - .5) * a * 2);
export const PROPS = {
  pine(b, r) { const h = .8 + r() * .5; b.add(PG.cyl, '#6d4c33', [0, .6 * h, 0], [.18, 1.2 * h, .18]); const g = vary('#2e6b35', r); for (let i = 0; i < 3; i++) b.add(PG.cone, shade(g, i * .06), [0, (1.1 + i * .75) * h, 0], [1.25 - i * .3, 1.5 * h, 1.25 - i * .3]); },
  snowpine(b, r) { const h = .8 + r() * .5; b.add(PG.cyl, '#6d4c33', [0, .6 * h, 0], [.18, 1.2 * h, .18]); for (let i = 0; i < 3; i++) { b.add(PG.cone, vary('#3d6b4a', r), [0, (1.1 + i * .75) * h, 0], [1.25 - i * .3, 1.5 * h, 1.25 - i * .3]); b.add(PG.cone, '#f4f8fb', [0, (1.65 + i * .75) * h, 0], [(1.25 - i * .3) * .55, .8 * h, (1.25 - i * .3) * .55]); } },
  oak(b, r) { const h = .9 + r() * .5; b.add(PG.cyl, '#7a5536', [0, .9 * h, 0], [.25, 1.8 * h, .25]); const g = vary('#4f9a3c', r); b.add(PG.sph, g, [0, 2.3 * h, 0], [1.4, 1.1, 1.4]); b.add(PG.sph, shade(g, .08), [.7, 2.1 * h, .3], [.9, .8, .9]); b.add(PG.sph, shade(g, -.06), [-.6, 2.0 * h, -.4], [.95, .8, .95]); b.add(PG.sph, shade(g, .12), [0, 2.9 * h, .1], [.8, .7, .8]); },
  birch(b, r) { const h = 1 + r() * .4; b.add(PG.cyl, '#f2f0ea', [0, 1.1 * h, 0], [.15, 2.2 * h, .15]); for (let i = 0; i < 4; i++) b.add(PG.box, '#2a2a2a', [0, (.4 + i * .45) * h, .14], [.12, .05, .03]); b.add(PG.sph, vary('#a8c84a', r), [0, 2.5 * h, 0], [.9, 1.2, .9]); },
  palm(b, r) { const h = 1 + r() * .5, lean = (r() - .5) * .4; for (let i = 0; i < 5; i++) b.add(PG.cyl, i % 2 ? '#a0784a' : '#8a6438', [lean * i * .3, (.35 + i * .62) * h, 0], [.17 - i * .015, .66 * h, .17 - i * .015], [0, 0, -lean * .6]); const top = [lean * 1.5, 3.3 * h, 0]; for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; b.add(PG.sph, vary('#3e9a3a', r), [top[0] + Math.cos(a) * 1, top[1] - .25, Math.sin(a) * 1], [1.2, .08, .32], [0, -a, -.35]); } for (let i = 0; i < 3; i++) b.add(PG.sph, '#7a5a2a', [top[0] + (i - 1) * .2, top[1] - .25, .15], [.14, .14, .14]); },
  bamboo(b, r) { const n = 5 + Math.floor(r() * 4); for (let i = 0; i < n; i++) { const x = (r() - .5) * 1.4, z = (r() - .5) * 1.4, h = 3 + r() * 2.5; b.add(PG.cyl, vary('#7ab040', r), [x, h / 2, z], [.08, h, .08]); for (let j = 1; j < 5; j++) b.add(PG.cyl, '#5a8a2a', [x, h * j / 5, z], [.1, .05, .1]); b.add(PG.sph, '#5aa03a', [x + .2, h - .3, z], [.4, .08, .14], [0, r() * 3, .4]); } },
  cactus(b, r) { const h = 1.6 + r() * 1.2, c = vary('#4a9a4a', r); b.add(PG.cyl, c, [0, h / 2, 0], [.32, h, .32]); b.add(PG.sph, c, [0, h, 0], [.32, .3, .32]); for (const sx of [1, -1]) { if (r() < .3) continue; const y = h * (.35 + r() * .25); b.add(PG.cyl, c, [sx * .45, y, 0], [.18, .18, .18], [0, 0, Math.PI / 2]); b.add(PG.cyl, c, [sx * .6, y + .4, 0], [.18, .8, .18]); b.add(PG.sph, c, [sx * .6, y + .8, 0], [.18, .18, .18]); } if (r() < .5) b.add(PG.sph, '#ff6a9a', [0, h + .3, 0], [.15, .1, .15]); },
  acacia(b, r) { b.add(PG.cyl, '#6a4a2a', [0, 1.5, 0], [.2, 3, .2], [0, 0, .1]); b.add(PG.cyl, '#6a4a2a', [.5, 2.8, 0], [.1, 1.2, .1], [0, 0, -.6]); b.add(PG.sph, vary('#7a9a3a', r), [.2, 3.4, 0], [2.4, .4, 1.8]); b.add(PG.sph, vary('#6a8a32', r), [-.4, 3.25, .4], [1.4, .3, 1.2]); },
  baobab(b, r) { b.add(PG.cyl, '#9a7a5a', [0, 1.8, 0], [.9, 3.6, .9]); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; b.add(PG.cyl, '#8a6a4a', [Math.cos(a) * .6, 3.9, Math.sin(a) * .6], [.12, .9, .12], [Math.sin(a) * .5, 0, -Math.cos(a) * .5]); b.add(PG.sph, '#6a8a3a', [Math.cos(a) * 1, 4.4, Math.sin(a) * 1], [.6, .4, .6]); } },
  eucalyptus(b, r) { b.add(PG.cyl, '#d8d0c0', [0, 1.6, 0], [.18, 3.2, .18]); for (let i = 0; i < 4; i++) b.add(PG.sph, vary('#7aa08a', r), [(r() - .5) * 1.4, 3 + r() * .8, (r() - .5) * 1.4], [.8, .6, .8]); },
  cypress(b, r) { b.add(PG.cyl, '#5a4030', [0, .8, 0], [.3, 1.6, .3]); b.add(PG.cone, vary('#3a5a32', r), [0, 1, 0], [.9, 4.5, .9]); for (let i = 0; i < 3; i++) b.add(PG.cone, '#5a4030', [(r() - .5) * 1.5, 0, (r() - .5) * 1.5], [.1, .4, .1]); for (let i = 0; i < 3; i++) b.add(PG.cyl, '#8a9a8a', [(r() - .5), 2.6 - i * .4, .5], [.03, 1.2, .03]); },
  cherry(b, r) { b.add(PG.cyl, '#5a3a2a', [0, 1, 0], [.2, 2, .2]); const c = vary('#ffb0c8', r, .06); b.add(PG.sph, c, [0, 2.4, 0], [1.3, .9, 1.3]); b.add(PG.sph, shade(c, .1), [.7, 2.2, .2], [.8, .6, .8]); b.add(PG.sph, shade(c, -.05), [-.6, 2.3, -.3], [.8, .6, .8]); },
  jungletree(b, r) { const h = 1.1 + r() * .4; b.add(PG.cyl, '#5a4030', [0, 2 * h, 0], [.35, 4 * h, .35]); for (let i = 0; i < 3; i++) b.add(PG.cyl, '#5a4030', [(i - 1) * .4, .3, .3], [.12, .7, .12], [0, 0, (i - 1) * .5]); const g = vary('#2e7a32', r); b.add(PG.sph, g, [0, 4.4 * h, 0], [2.2, 1.1, 2.2]); b.add(PG.sph, shade(g, .1), [1, 4.1 * h, .5], [1.2, .8, 1.2]); for (let i = 0; i < 4; i++) b.add(PG.cyl, '#3a8a3a', [(r() - .5) * 2.5, 3.2 * h, (r() - .5) * 2.5], [.03, 1.8, .03]); },
  cycad(b, r) { b.add(PG.cyl, '#7a5a3a', [0, .6, 0], [.3, 1.2, .3]); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; b.add(PG.sph, vary('#4a8a2a', r), [Math.cos(a) * 1.1, 1.3, Math.sin(a) * 1.1], [1.3, .07, .3], [0, -a, -.4]); } },
  deadtree(b, r) { b.add(PG.cyl, '#6a5a4a', [0, 1.2, 0], [.18, 2.4, .18]); for (let i = 0; i < 4; i++) { const a = r() * 6.28; b.add(PG.cyl, '#6a5a4a', [Math.cos(a) * .4, 1.6 + i * .3, Math.sin(a) * .4], [.06, 1, .06], [Math.sin(a) * .9, 0, -Math.cos(a) * .9]); } },
  bush(b, r) { const g = vary('#4a8a3a', r); b.add(PG.sph, g, [0, .45, 0], [.7, .55, .7]); b.add(PG.sph, shade(g, .08), [.45, .35, .2], [.45, .4, .45]); b.add(PG.sph, shade(g, -.06), [-.4, .35, -.2], [.5, .4, .5]); if (r() < .4) for (let i = 0; i < 4; i++) b.add(PG.sph, ['#ff6a8a', '#ffd040', '#ffffff'][i % 3], [(r() - .5) * 1, .7 + r() * .2, (r() - .5) * 1], [.08, .08, .08]); },
  flowers(b, r) { for (let i = 0; i < 7; i++) { const x = (r() - .5) * 1.6, z = (r() - .5) * 1.6; b.add(PG.cyl, '#4a8a3a', [x, .25, z], [.03, .5, .03]); b.add(PG.sph, ['#ff5a7a', '#ffd23a', '#b07aff', '#ffffff', '#ff8a3a'][Math.floor(r() * 5)], [x, .52, z], [.14, .1, .14]); } },
  sunflower(b, r) { for (let i = 0; i < 3; i++) { const x = (i - 1) * .5, h = 1.4 + r() * .6; b.add(PG.cyl, '#4a8a3a', [x, h / 2, 0], [.05, h, .05]); b.add(PG.cyl, '#ffcc22', [x, h, .05], [.35, .05, .35], [Math.PI / 2 - .3, 0, 0]); b.add(PG.cyl, '#6a4020', [x, h, .09], [.16, .06, .16], [Math.PI / 2 - .3, 0, 0]); } },
  corn(b, r) { for (let i = 0; i < 5; i++) { const x = (r() - .5) * 1.4, z = (r() - .5) * 1.4; b.add(PG.cyl, '#7ab040', [x, .9, z], [.05, 1.8, .05]); b.add(PG.sph, '#f2d040', [x + .08, 1.1, z], [.07, .22, .07]); b.add(PG.sph, '#8ac050', [x, 1.8, z], [.3, .05, .1], [0, r() * 3, .4]); } },
  hay(b, r) { b.add(PG.cyl, '#e8c860', [0, .55, 0], [.6, 1.3, .6], [0, 0, Math.PI / 2]); b.add(PG.cyl, '#d0a840', [.66, .55, 0], [.5, .02, .5], [0, 0, Math.PI / 2]); },
  mushroom(b, r) { for (let i = 0; i < 3; i++) { const x = (r() - .5), z = (r() - .5), s = .5 + r() * .6; b.add(PG.cyl, '#f5ecd8', [x, .25 * s, z], [.08 * s, .5 * s, .08 * s]); b.add(PG.hemi, '#e03a2a', [x, .48 * s, z], [.3 * s, .25 * s, .3 * s]); b.add(PG.sph, '#ffffff', [x + .1 * s, .62 * s, z], [.05 * s, .04 * s, .05 * s]); } },
  glowshroom(b, r) { for (let i = 0; i < 4; i++) { const x = (r() - .5) * 1.2, z = (r() - .5) * 1.2, s = .6 + r() * .9; b.add(PG.cyl, '#c8e8e0', [x, .3 * s, z], [.07 * s, .6 * s, .07 * s]); b.add(PG.hemi, ['#40f0ff', '#c070ff', '#70ff9a'][i % 3], [x, .58 * s, z], [.3 * s, .22 * s, .3 * s], null, 'glow'); } },
  fern(b, r) { for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; b.add(PG.sph, vary('#3a8a3a', r), [Math.cos(a) * .5, .35, Math.sin(a) * .5], [.65, .05, .16], [0, -a, -.6]); } },
  rock(b, r) { const c = vary('#8a8a88', r); b.add(PG.sph, c, [0, .3, 0], [.8, .5, .7], [0, r() * 3, 0]); b.add(PG.sph, shade(c, .1), [.5, .2, .3], [.45, .32, .45]); },
  snowrock(b, r) { PROPS.rock(b, r); b.add(PG.sph, '#ffffff', [0, .55, 0], [.65, .2, .55]); },
  redrock(b, r) { const h = 1.5 + r() * 2.5; b.add(PG.cyl, vary('#b0502a', r), [0, h / 2, 0], [1.1, h, .9]); b.add(PG.cyl, '#c86a3a', [0, h + .05, 0], [1.15, .1, .95]); b.add(PG.sph, '#a0482a', [.9, .3, .3], [.5, .4, .5]); },
  boulder(b, r) { b.add(PG.sph, vary('#9a9890', r), [0, .7, 0], [1.4, 1, 1.2], [0, r() * 3, 0]); b.add(PG.sph, '#6a9a4a', [0, 1.5, 0], [.6, .15, .5]); },
  ice(b, r) { const h = .8 + r() * 1.4; b.add(PG.box, '#cfefff', [0, h / 2, 0], [1.2, h, 1], [0, r() * 3, 0], 'glass'); b.add(PG.box, '#ffffff', [0, h + .05, 0], [1.25, .12, 1.05]); b.add(PG.box, '#a8dcff', [0, h * .3, 0], [.9, h * .5, .7], [0, r(), 0]); },
  igloo(b) { b.add(PG.hemi, '#f8fcff', [0, 0, 0], [2, 1.8, 2]); b.add(PG.cyl, '#f0f6fa', [0, .55, 1.9], [.65, 1.1, .65], [Math.PI / 2, 0, 0]); b.add(PG.sph, '#2a3a4a', [0, .45, 2.45], [.45, .45, .05]); for (let i = 1; i < 4; i++) b.add(PG.torus, '#dceaf2', [0, i * .45, 0], [2 * Math.cos(Math.asin(i * .45 / 1.8)), 2 * Math.cos(Math.asin(i * .45 / 1.8)), 1], [Math.PI / 2, 0, 0]); },
  log(b, r) { b.add(PG.cyl, '#7a5536', [0, .3, 0], [.3, 2, .3], [0, r() * 3, Math.PI / 2]); },
  reeds(b, r) { for (let i = 0; i < 8; i++) { const x = (r() - .5) * 1.2, z = (r() - .5) * 1.2, h = .8 + r() * 1; b.add(PG.cyl, '#6a9a4a', [x, h / 2, z], [.025, h, .025]); if (i % 2) b.add(PG.cyl, '#6a4020', [x, h, z], [.06, .3, .06]); } },
  lilypad(b, r) { b.add(PG.cyl, '#4a9a3a', [0, .05, 0], [.6, .03, .6]); if (r() < .5) b.add(PG.sph, '#ffb0d0', [0, .15, 0], [.18, .12, .18]); },
  coral(b, r) { const c = ['#ff6a8a', '#ffa040', '#c070ff', '#40d0c0', '#ffd040'][Math.floor(r() * 5)]; for (let i = 0; i < 5; i++) { const a = r() * 6.28; b.add(PG.cyl, c, [Math.cos(a) * .2, .5, Math.sin(a) * .2], [.1, 1, .1], [Math.sin(a) * .5, 0, -Math.cos(a) * .5]); b.add(PG.sph, shade(c, .2), [Math.cos(a) * .5, 1, Math.sin(a) * .5], [.15, .15, .15]); } b.add(PG.sph, shade(c, -.1), [0, .2, 0], [.5, .3, .5]); },
  kelp(b, r) { for (let i = 0; i < 4; i++) { const x = (r() - .5) * 1, z = (r() - .5) * 1; for (let j = 0; j < 5; j++) b.add(PG.sph, vary('#3a8a4a', r), [x + Math.sin(j) * .15, .4 + j * .7, z], [.12, .45, .25], [0, 0, Math.sin(j) * .2]); } },
  shell(b, r) { b.add(PG.cone, '#ffd8e0', [0, 0, 0], [.4, .6, .4], [.5, 0, 0]); b.add(PG.sph, '#ffc0d0', [0, .15, .2], [.3, .2, .2]); },
  lantern(b, r) { b.add(PG.cyl, '#5a2a1a', [0, 1.2, 0], [.06, 2.4, .06]); b.add(PG.box, '#5a2a1a', [.4, 2.3, 0], [.9, .08, .08]); b.add(PG.sph, '#ff3a2a', [.75, 1.9, 0], [.28, .38, .28], null, 'glow'); b.add(PG.cyl, '#f2c230', [.75, 2.2, 0], [.18, .08, .18]); },
  pagoda(b) { const cols = ['#c62828', '#d84315']; for (let i = 0; i < 3; i++) { const s = 1.6 - i * .4, y = i * 1.5; b.add(PG.box, cols[i % 2], [0, y + .55, 0], [s * 1.3, 1.1, s * 1.3]); b.add(PG.cone4, '#2a3a3a', [0, y + 1.1, 0], [s * 1.3, .5, s * 1.3]); } b.add(PG.cone, '#f2c230', [0, 4.6, 0], [.1, .9, .1]); },
  barn(b) { b.add(PG.box, '#b03a2e', [0, 1.4, 0], [4, 2.8, 3]); b.add(PG.prism, '#5a3a2a', [0, 3.2, 0], [4.2, 1.1, 1.85]); b.add(PG.box, '#f5f0e6', [0, 1, 1.52], [1.6, 2, .05]); b.add(PG.box, '#b03a2e', [0, 1, 1.54], [1.4, 1.8, .05]); b.add(PG.box, '#f5f0e6', [0, 1, 1.56], [.1, 2.4, .02], [0, 0, .7]); b.add(PG.box, '#f5f0e6', [0, 1, 1.56], [.1, 2.4, .02], [0, 0, -.7]); },
  cabin(b) { b.add(PG.box, '#8a5a32', [0, 1, 0], [3, 2, 2.4]); for (let i = 0; i < 5; i++) b.add(PG.cyl, '#7a4a28', [0, .2 + i * .4, 1.2], [.2, 3, .2], [0, 0, Math.PI / 2]); b.add(PG.prism, '#5a3a2a', [0, 2.45, 0], [3.3, .9, 1.5]); b.add(PG.box, '#f4f8fb', [0, 2.65, 0], [3.2, .15, 2.6]); b.add(PG.box, '#5a4a3a', [1, 2.9, -.3], [.4, 1, .4]); b.add(PG.box, '#ffd070', [-.8, 1.1, 1.22], [.5, .5, .05], null, 'glow'); },
  chalet(b) { b.add(PG.box, '#f5ecd8', [0, 1.1, 0], [3.4, 2.2, 2.6]); b.add(PG.cone4, '#7a4a28', [0, 2.2, 0], [3, 1.6, 2.4]); b.add(PG.box, '#7a4a28', [0, 1.4, 1.4], [3, .1, .5]); for (const x of [-.8, .8]) b.add(PG.box, '#ff8a3a', [x, 1.5, 1.32], [.5, .5, .05]); },
  birdhouse(b) { b.add(PG.cyl, '#7a5536', [0, 1, 0], [.07, 2, .07]); b.add(PG.box, '#f2c230', [0, 2.2, 0], [.5, .5, .5]); b.add(PG.cone4, '#c62828', [0, 2.45, 0], [.5, .35, .5]); b.add(PG.cyl, '#2a2a2a', [0, 2.25, .26], [.08, .02, .08], [Math.PI / 2, 0, 0]); },
  termite(b, r) { b.add(PG.cone, vary('#b07a4a', r), [0, 0, 0], [.7, 2.5 + r() * 1.2, .7]); b.add(PG.cone, '#a06a3a', [.4, 0, .2], [.35, 1.4, .35]); },
  bone(b, r) { b.add(PG.cyl, '#f5f0e0', [0, .12, 0], [.06, .9, .06], [0, r() * 3, Math.PI / 2]); for (const x of [-.45, .45]) b.add(PG.sph, '#f5f0e0', [x, .12, 0], [.12, .12, .12]); },
  crystal(b, r) { for (let i = 0; i < 4; i++) b.add(PG.cone, ['#a070ff', '#60e0ff', '#ff70d0'][i % 3], [(r() - .5) * .8, 0, (r() - .5) * .8], [.18, .8 + r() * .8, .18], [(r() - .5) * .5, 0, (r() - .5) * .5], 'glow'); },
  volcano(b) { b.add(PG.cone, '#5a4038', [0, 0, 0], [5, 6, 5]); b.add(PG.cone, '#3a2a28', [0, 4, 0], [2.4, 2.2, 2.4]); b.add(PG.cyl, '#ff5a1a', [0, 6, 0], [1.2, .2, 1.2], null, 'glow'); for (let i = 0; i < 3; i++) b.add(PG.cyl, '#ff7a2a', [Math.cos(i * 2) * 1.5, 3.5 - i, Math.sin(i * 2) * 1.5 + 2], [.25, 3, .25], [.4, i, 0], 'glow'); },
  grass(b, r) { for (let i = 0; i < 6; i++) b.add(PG.cone, vary('#a8b04a', r), [(r() - .5) * .8, 0, (r() - .5) * .8], [.08, .6 + r() * .5, .08], [(r() - .5) * .4, 0, (r() - .5) * .4]); },
  snowman(b) { b.add(PG.sph, '#ffffff', [0, .6, 0], [.6, .6, .6]); b.add(PG.sph, '#ffffff', [0, 1.4, 0], [.42, .42, .42]); b.add(PG.sph, '#ffffff', [0, 2, 0], [.3, .3, .3]); b.add(PG.cone, '#ff8a2a', [0, 2, .3], [.05, .3, .05], [Math.PI / 2, 0, 0]); b.add(PG.cyl, '#2a2a2a', [0, 2.35, 0], [.25, .3, .25]); },
};
export function prop(b, type, x, z, s = 1, ry = 0, seed = 1) {
  const fn = PROPS[type]; if (!fn) return;
  b.push(); b.local(x, 0, z, ry, s); fn(b, rng(seed)); b.pop();
}

/* ---------------- fences ---------------- */
const FENCE = {
  wood: { post: '#7a5536', rail: '#9a6a42' }, picket: { post: '#f5f2ea', rail: '#ffffff' }, adobe: { wall: '#d8a868' }, log: { post: '#6a4428', rail: '#7a5232' },
  glass: { post: '#8a9a8a', glass: '#d8f0ff' }, ice: { wall: '#cfefff', ice: true }, stone: { wall: '#9a9890' }, lacquer: { post: '#c62828', rail: '#2a2a2a', cap: '#f2c230' },
  thorn: { post: '#7a5a3a', rail: '#5a4028' }, bamboo: { post: '#8ab040', rail: '#7aa036' }, net: { post: '#7a8a9a', net: true }, tank: { tank: true },
  wire: { post: '#8a8a8a', rail: '#c0c0c0' }, dark: { post: '#3a3a5a', rail: '#4a4a6a', glowCap: '#9a70ff' }, electric: { post: '#5a5a5a', rail: '#f2c230', glowCap: '#ffe060' },
};
export function fence(b, style, level, x0, z0, x1, z1, gaps = []) {
  const F = FENCE[style] || FENCE.wood;
  const h = 1.1 + level * .25;
  const seg = (ax, az, bx, bz) => {
    const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz), ang = Math.atan2(dx, dz);
    const n = Math.max(1, Math.round(len / 2.2));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = ax + dx * t, z = az + dz * t;
      if (gaps.some(g => Math.hypot(g[0] - x, g[1] - z) < g[2])) continue;
      if (F.wall) { if (i < n) { const mx = ax + dx * (t + .5 / n), mz = az + dz * (t + .5 / n); if (!gaps.some(g => Math.hypot(g[0] - mx, g[1] - mz) < g[2])) b.add(PG.box, shade(F.wall, (i % 2) * .05), [mx, h * .45, mz], [.5, h * .9, len / n + .02], [0, ang, 0], F.ice ? 'glass' : 'toon'); } if (F.ice && i < n) b.add(PG.box, '#ffffff', [ax + dx * (t + .5 / n), h * .9, az + dz * (t + .5 / n)], [.55, .12, len / n], [0, ang, 0]); continue; }
      b.add(level >= 2 ? PG.box : PG.cyl, F.post, [x, h * .55, z], level >= 2 ? [.28, h * 1.1, .28] : [.12, h * 1.1, .12]);
      if (level >= 2) b.add(PG.box, level >= 3 ? '#8a8a88' : F.post, [x, .15, z], [.4, .3, .4]);
      if (F.cap) b.add(PG.sph, F.cap, [x, h * 1.12, z], [.15, .12, .15]);
      if (F.glowCap || level >= 4) b.add(PG.sph, F.glowCap || '#fff3a0', [x, h * 1.15, z], [.13, .13, .13], null, 'glow');
      if (i < n) {
        const mx = ax + dx * (t + .5 / n), mz = az + dz * (t + .5 / n), L = len / n;
        if (gaps.some(g => Math.hypot(g[0] - mx, g[1] - mz) < g[2])) continue;
        if (F.glass || F.net) { b.add(PG.box, F.glass || '#c8d8e8', [mx, h * .55, mz], [.05, h * 1.05, L], [0, ang, 0], 'glass'); continue; }
        for (const y of level >= 1 ? [.35, .7, 1.0] : [.4, .85]) b.add(PG.box, F.rail, [mx, h * y, mz], [.08, .1, L], [0, ang, 0]);
        if (style === 'picket') for (let k = 0; k < 4; k++) b.add(PG.box, F.post, [ax + dx * (t + (k + .5) / 4 / n), h * .45, az + dz * (t + (k + .5) / 4 / n)], [.1, h * .9, .14], [0, ang, 0]);
        if (style === 'bamboo') for (let k = 0; k < 5; k++) b.add(PG.cyl, F.rail, [ax + dx * (t + (k + .5) / 5 / n), h * .5, az + dz * (t + (k + .5) / 5 / n)], [.07, h, .07]);
        if (level >= 3) b.add(PG.box, '#5a9a3a', [mx, .25, mz], [.4, .5, L * .9], [0, ang, 0]);
      }
    }
  };
  seg(x0, z0, x1, z0); seg(x1, z0, x1, z1); seg(x1, z1, x0, z1); seg(x0, z1, x0, z0);
}

/* ---------------- text signs (canvas textures - text only) ---------------- */
const SIGN_CACHE = new Map();
export function textTexture(lines, opts = {}) {
  const key = lines.join('|') + JSON.stringify(opts);
  if (SIGN_CACHE.has(key)) return SIGN_CACHE.get(key);
  const W = opts.w || 512, H = opts.h || 160, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = opts.bg || '#6d4c41'; g.beginPath(); g.roundRect ? g.roundRect(6, 6, W - 12, H - 12, 26) : g.rect(6, 6, W - 12, H - 12); g.fill();
  g.lineWidth = 8; g.strokeStyle = opts.border || '#3e2723'; g.stroke();
  g.fillStyle = opts.fg || '#fff8e1'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const n = lines.length;
  lines.forEach((ln, i) => { g.font = `${i === 0 ? 800 : 700} ${i === 0 ? (opts.size || 52) : (opts.size2 || 36)}px Fredoka, Nunito, Arial, sans-serif`; g.fillText(ln, W / 2, H * (i + 1) / (n + 1) + (n > 1 ? (i === 0 ? 4 : -4) : 0)); });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  SIGN_CACHE.set(key, t);
  return t;
}
export function signMesh(lines, w = 6, h = 1.9, opts = {}) {
  const g = new THREE.Group();
  const tex = textTexture(lines, opts);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  const back = front.clone(); back.rotation.y = Math.PI;
  g.add(front, back);
  return g;
}

/* ---------------- facilities ---------------- */
// Each returns { group, anim(dt,t), door:[x,z] (local, in front), w, d }
export function buildFacility(type, level, biome) {
  const b = new Batch(), acc = biome.accent || '#7a4f2a', anims = [], group = new THREE.Group();
  let w = 5, d = 4;
  const awning = (x, y, z, wid, cols) => { for (let i = 0; i < 6; i++) b.add(PG.box, i % 2 ? cols[0] : cols[1], [x - wid / 2 + wid * (i + .5) / 6, y, z], [wid / 6, .08, 1.2], [.35, 0, 0]); };
  const table = (x, z, umb) => { b.add(PG.cyl, '#8a6a4a', [x, .45, z], [.5, .06, .5]); b.add(PG.cyl, '#5a4a3a', [x, .22, z], [.05, .45, .05]); for (const a of [0, 2.1, 4.2]) b.add(PG.cyl, '#c8a070', [x + Math.cos(a) * .7, .25, z + Math.sin(a) * .7], [.18, .5, .18]); if (umb) { b.add(PG.cyl, '#eee', [x, .9, z], [.03, 1.8, .03]); b.add(PG.cone, umb, [x, 1.6, z], [.9, .4, .9]); } };
  switch (type) {
    case 'restroom': {
      if (level === 0) { w = 2; d = 2; b.add(PG.box, '#2a7ad0', [0, 1.1, 0], [1.3, 2.2, 1.3]); b.add(PG.box, '#ffffff', [0, 2.27, 0], [1.4, .14, 1.4]); b.add(PG.box, '#1a5aa0', [0, 1, .66], [.8, 1.8, .03]); b.add(PG.cyl, '#dddddd', [.4, 2.5, -.3], [.08, .4, .08]); b.add(PG.sph, '#ffe060', [0, 1.95, .68], [.12, .08, .02]); }
      else if (level === 1) { w = 4.5; d = 3.2; b.add(PG.box, '#e8dcc0', [0, 1.3, 0], [4.2, 2.6, 3]); b.add(PG.cone4, '#3a6ab0', [0, 2.6, 0], [3.4, 1.1, 2.6]); for (const [x, c] of [[-1, '#2a7ad0'], [1, '#e05a8a']]) { b.add(PG.box, '#5a4a3a', [x, .95, 1.51], [.9, 1.9, .05]); b.add(PG.box, c, [x, 2.2, 1.52], [.5, .5, .05]); } }
      else if (level === 2) { w = 5.2; d = 3.6; b.add(PG.box, '#d8eef0', [0, 1.5, 0], [5, 3, 3.4]); b.add(PG.cone4, '#2a8a8a', [0, 3, 0], [4, 1.3, 3]); for (const [x, c] of [[-1.3, '#2a7ad0'], [1.3, '#e05a8a']]) { b.add(PG.box, '#3a4a5a', [x, 1, 1.71], [1, 2, .05]); b.add(PG.box, c, [x, 2.4, 1.72], [.6, .6, .05]); } for (const x of [-2.2, 0, 2.2]) { b.add(PG.box, '#8a6a4a', [x, .3, 2.1], [.8, .6, .6]); b.add(PG.sph, '#5aa03a', [x, .8, 2.1], [.45, .4, .35]); } }
      else { w = 5.8; d = 4.2; b.add(PG.box, '#ffffff', [0, 1.6, -.4], [5.4, 3.2, 3]); b.add(PG.hemi, '#f2c230', [0, 3.2, -.4], [1.8, 1.4, 1.8]); for (const x of [-2.4, -.8, .8, 2.4]) b.add(PG.cyl, '#f5f0e6', [x, 1.6, 1.3], [.18, 3.2, .18]); b.add(PG.box, '#f5f0e6', [0, 3.25, 1.3], [5.4, .25, .5]); b.add(PG.box, '#7ad0e8', [0, .08, 2.6], [3, .12, 1.4], null, 'water'); b.add(PG.box, '#e8e0d0', [0, .05, 2.6], [3.4, .1, 1.8]); }
      break;
    }
    case 'food': {
      const theme = ['#e03a2a', '#ffffff'];
      if (level === 0) { w = 2.6; d = 2; b.add(PG.box, '#f2c230', [0, .9, 0], [1.8, 1, 1]); for (const x of [-.6, .6]) b.add(PG.cyl, '#2a2a2a', [x, .3, .55], [.28, .1, .28], [Math.PI / 2, 0, 0]); b.add(PG.cyl, '#dddddd', [0, 1.9, 0], [.04, 1.6, .04]); b.add(PG.cone, '#e03a2a', [0, 2.4, 0], [1.2, .55, 1.2]); b.add(PG.cone, '#ffffff', [0, 2.6, 0], [.6, .35, .6]); b.add(PG.cyl, '#d08a4a', [0, 1.5, .3], [.12, .9, .12], [0, 0, Math.PI / 2]); b.add(PG.cyl, '#e04a2a', [0, 1.5, .3], [.08, .95, .08], [0, 0, Math.PI / 2]); }
      else if (level === 1) { w = 3.6; d = 2.6; b.add(PG.box, '#ffffff', [0, 1.2, 0], [3.2, 2.4, 2.2]); b.add(PG.box, '#c8a070', [0, .9, 1.2], [3.2, .15, .5]); awning(0, 2.3, 1.4, 3.4, theme); b.add(PG.box, '#2a2a2a', [0, 1.5, 1.11], [2.6, 1, .03]); b.add(PG.box, acc, [0, 2.9, 0], [2.2, .7, .2]); b.add(PG.cyl, '#d08a4a', [0, 3.6, 0], [.35, 1.3, .35], [0, 0, Math.PI / 2]); }
      else if (level === 2) { w = 5; d = 4; b.add(PG.box, '#f5e8d0', [0, 1.5, -.6], [4.6, 3, 2.6]); b.add(PG.cone4, '#7a4a28', [0, 3, -.6], [3.6, 1.2, 2.2]); awning(0, 2.4, .9, 4.4, ['#2a8a5a', '#ffffff']); b.add(PG.box, '#8ad0f0', [0, 1.4, .71], [3, 1.4, .05], null, 'glass'); table(-1.4, 1.9, '#2a8a5a'); table(1.4, 1.9, '#ff8a3a'); b.add(PG.cyl, '#5a3a20', [1.6, 3.7, -.6], [.5, .4, .5]); b.add(PG.cyl, '#ffffff', [1.6, 4, -.6], [.55, .1, .55]); }
      else if (level === 3) { w = 6; d = 4.6; b.add(PG.box, '#c84a3a', [0, 1.8, -.8], [5.6, 3.6, 3]); b.add(PG.box, '#2a2a2a', [0, 3.8, -.8], [5.8, .4, 3.2]); b.add(PG.box, acc, [0, 4.4, .5], [3.4, 1, .2]); b.add(PG.box, '#ffe080', [0, 1.6, .71], [4, 1.8, .05], null, 'glass'); awning(0, 3, .9, 5.4, ['#ffffff', '#c84a3a']); for (const x of [-2, 0, 2]) table(x, 2, null); }
      else { w = 6.2; d = 4.8; b.add(PG.box, '#3a2a3a', [0, 2, -.8], [5.8, 4, 3]); for (const x of [-2, 0, 2]) { b.add(PG.cyl, '#f2c230', [x, 1.5, .75], [.6, .1, .6], [Math.PI / 2, 0, 0]); b.add(PG.box, '#ffd890', [x, 1.3, .72], [1.1, 1.6, .05], null, 'glow'); } b.add(PG.box, '#f2c230', [0, 4.1, .72], [5.8, .2, .1]); for (let i = 0; i < 12; i++) b.add(PG.sph, '#fff3a0', [-2.8 + i * .5, 3.3 - Math.sin(i / 11 * Math.PI) * .4, 2.6], [.1, .1, .1], null, 'glow'); for (const x of [-2.8, 2.8]) b.add(PG.cyl, '#2a2a2a', [x, 1.7, 2.6], [.05, 3.4, .05]); for (const x of [-1.8, .2, 2]) table(x, 2.2, null); }
      break;
    }
    case 'gift': {
      if (level === 0) {
        w = 2.8; d = 2.2; b.add(PG.cyl, '#f2e0c0', [0, 1, 0], [1, 2, 1]); b.add(PG.cone, '#e05a8a', [0, 2, 0], [1.3, .9, 1.3]);
        const bal = new THREE.Group(); group.add(bal);
        for (let i = 0; i < 5; i++) { const c = ['#ff4a5a', '#ffd23a', '#3a8aff', '#7ad04a', '#c070ff'][i]; const bb = new THREE.Group(); bb.position.set(-.8 + i * .4, 2.6 + (i % 2) * .4, .9); const m = new THREE.Mesh(GEO.sph, toon(c)); m.scale.set(.25, .32, .25); const st = new THREE.Mesh(GEO.cyl, toon('#ffffff')); st.scale.set(.01, .9, .01); st.position.y = -.6; bb.add(m, st); bal.add(bb); anims.push((dt, t) => { bb.position.y = 2.6 + (i % 2) * .4 + Math.sin(t * 2 + i) * .1; bb.rotation.z = Math.sin(t * 1.4 + i) * .1; }); }
      } else {
        w = level === 1 ? 4.6 : 6; d = level === 1 ? 3.4 : 4.4;
        b.add(PG.box, level === 1 ? '#ffe8b0' : '#b8e0ff', [0, level === 1 ? 1.4 : 1.9, -.4], [w - .4, level === 1 ? 2.8 : 3.8, d - 1]);
        b.add(PG.box, '#c8e8ff', [0, 1.3, (d - 1) / 2 - .38], [w - 1.6, 1.4, .05], null, 'glass');
        b.add(PG.box, acc, [0, level === 1 ? 2.9 : 3.9, (d - 1) / 2 - .35], [w - .2, .5, .3]);
        awning(0, level === 1 ? 2.4 : 3.2, (d - 1) / 2 - .2, w - .4, ['#e05a8a', '#ffffff']);
        // giant plush statue of the biome's starter animal on the roof
        try {
          const statue = buildAnimal(biome.starterKey, 'common', { sex: 'M' });
          const s = level === 1 ? 1.4 : 2.4;
          statue.mover.scale.setScalar(s / Math.max(.6, statue.size) * statue.size);
          statue.mover.position.set(0, level === 1 ? 2.8 : 3.8, -.4);
          group.add(statue.mover);
          anims.push((dt, t) => { statue.mover.rotation.y = Math.sin(t * .6) * .5; statue.state.mv = 0; });
          group.userData.statue = statue;
        } catch (e) { /* ignore */ }
      }
      break;
    }
    case 'seating': {
      const bench = (x, z, ry) => { b.push(); b.local(x, 0, z, ry); b.add(PG.box, '#9a6a42', [0, .45, 0], [1.6, .1, .5]); b.add(PG.box, '#9a6a42', [0, .8, -.22], [1.6, .4, .08]); for (const sx of [-.65, .65]) b.add(PG.box, '#3a3a3a', [sx, .22, 0], [.08, .45, .45]); b.pop(); };
      if (level === 0) { w = 4; d = 2; bench(-1, 0, 0); bench(1.1, 0, 0); b.add(PG.cyl, '#3a3a3a', [0, .4, .3], [.25, .8, .25]); }
      else if (level === 1) { w = 5; d = 3.5; for (const x of [-1.4, 1.4]) { b.add(PG.box, '#a07a4a', [x, .7, 0], [1.8, .1, .9]); for (const z of [-.7, .7]) b.add(PG.box, '#a07a4a', [x, .4, z], [1.8, .08, .3]); b.add(PG.cyl, '#eee', [x, 1.3, 0], [.03, 1.6, .03]); b.add(PG.cone, x < 0 ? '#e05a5a' : '#3a8ae0', [x, 1.9, 0], [1, .4, 1]); } }
      else { w = 6; d = 5; b.add(PG.cyl16, '#c8c0b0', [0, .3, 0], [1.8, .6, 1.8]); b.add(PG.cyl16, '#5ac8f0', [0, .55, 0], [1.6, .1, 1.6], null, 'water'); b.add(PG.cyl, '#c8c0b0', [0, 1, 0], [.25, 1.4, .25]); b.add(PG.cyl16, '#c8c0b0', [0, 1.6, 0], [.7, .15, .7]); for (const a of [0, 1.57, 3.14, 4.71]) { b.add(PG.box, '#7a5536', [Math.cos(a) * 2.6, .2, Math.sin(a) * 2.6], [1.4, .4, .7], [0, -a, 0]); b.add(PG.sph, '#ff7a9a', [Math.cos(a) * 2.6, .55, Math.sin(a) * 2.6], [.5, .25, .3]); } bench(0, 2.2, 0); group.userData.fountain = [0, 1.7, 0]; }
      break;
    }
    case 'themed': {
      const c2 = mix(acc, '#ffffff', .4);
      if (level === 0) { w = 4.5; d = 4.5; b.add(PG.cyl16, '#c8a070', [0, .15, 0], [2, .3, 2]); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; b.add(PG.cyl, '#f5f0e6', [Math.cos(a) * 1.7, 1.4, Math.sin(a) * 1.7], [.1, 2.5, .1]); } b.add(PG.cone, acc, [0, 2.6, 0], [2.3, 1.3, 2.3]); b.add(PG.cyl, '#eee', [0, 4.2, 0], [.04, 1.4, .04]); const flag = new THREE.Mesh(GEO.box, toon(c2)); flag.scale.set(.8, .45, .03); flag.position.set(.4, 4.6, 0); group.add(flag); anims.push((dt, t) => { flag.rotation.y = Math.sin(t * 3) * .3; }); }
      else if (level === 1) { w = 5; d = 5; b.add(PG.cyl16, '#8a8a88', [0, .2, 0], [2.2, .4, 2.2]); b.add(PG.cyl, '#c8a070', [0, 3, 0], [.8, 6, .8]); b.add(PG.cyl16, '#a07a4a', [0, 6.1, 0], [2, .25, 2]); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; b.add(PG.cyl, '#5a4a3a', [Math.cos(a) * 1.9, 6.6, Math.sin(a) * 1.9], [.05, 1, .05]); } const top = new THREE.Group(); top.position.y = 7.2; group.add(top); const m = new THREE.Mesh(GEO.cone, toon(acc)); m.scale.set(1.5, 1.5, 1.5); top.add(m); for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(GEO.box, toon(i % 2 ? c2 : '#ffd23a')); f.scale.set(1.1, .5, .04); f.position.set(Math.cos(i * 1.57) * 1.2, .6, Math.sin(i * 1.57) * 1.2); f.rotation.y = -i * 1.57; top.add(f); } anims.push((dt, t) => { top.rotation.y = t * .8; }); }
      else { w = 8; d = 8; b.add(PG.cyl16, '#d8d0c0', [0, .3, 0], [3.8, .6, 3.8]); b.add(PG.hemi, acc, [0, .5, 0], [3.4, 3.2, 3.4]); b.add(PG.box, '#2a2a2a', [0, 1, 3.3], [1.6, 2, .3]); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; b.add(PG.sph, '#fff3a0', [Math.cos(a) * 3.5, .7, Math.sin(a) * 3.5], [.15, .15, .15], null, 'glow'); } const ring = new THREE.Mesh(GEO.torus, toon('#f2c230', { emissive: '#f2c230', ei: .5 })); ring.scale.set(3.6, 3.6, 3.6); ring.position.y = 3.2; ring.rotation.x = Math.PI / 2; group.add(ring); const orb = new THREE.Mesh(GEO.sph, toon(c2, { emissive: c2, ei: 1 })); orb.scale.setScalar(.7); orb.position.y = 4.3; group.add(orb); anims.push((dt, t) => { ring.rotation.z = t * .7; ring.rotation.x = Math.PI / 2 + Math.sin(t) * .2; orb.position.y = 4.3 + Math.sin(t * 2) * .3; }); }
      break;
    }
    case 'ride': {
      if (level === 0) { // carousel
        w = 7; d = 7; b.add(PG.cyl16, '#c8b090', [0, .2, 0], [3.2, .4, 3.2]);
        const rot = new THREE.Group(); group.add(rot);
        const rb = new Batch();
        rb.add(PG.cyl16, '#ff7a9a', [0, .5, 0], [3, .2, 3]); rb.add(PG.cyl, '#f2c230', [0, 2.2, 0], [.3, 3.6, .3]); rb.add(PG.cone, '#e03a5a', [0, 4, 0], [3.4, 1.4, 3.4]); rb.add(PG.cone, '#ffffff', [0, 4.4, 0], [1.6, 1.2, 1.6]);
        for (let i = 0; i < 12; i++) rb.add(PG.sph, '#fff3a0', [Math.cos(i / 12 * 6.28) * 3.3, 4, Math.sin(i / 12 * 6.28) * 3.3], [.12, .12, .12], null, 'glow');
        rot.add(rb.build());
        const horses = [];
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, hb = new Batch(); const col = ['#ffffff', '#ffd0e0', '#d0e8ff', '#fff0b0', '#e0d0ff', '#d0ffd8'][i]; hb.add(PG.sph, col, [0, 0, 0], [.3, .3, .6]); hb.add(PG.sph, col, [0, .35, .5], [.18, .22, .3]); for (const [x, z] of [[.15, .3], [-.15, .3], [.15, -.3], [-.15, -.3]]) hb.add(PG.cyl, col, [x, -.4, z], [.05, .6, .05]); hb.add(PG.sph, '#f2c230', [0, .3, -.1], [.2, .08, .25]); hb.add(PG.cyl, '#f2c230', [0, .9, 0], [.04, 3, .04]); const h = hb.build(); h.position.set(Math.cos(a) * 2.2, 1.6, Math.sin(a) * 2.2); h.rotation.y = -a; rot.add(h); horses.push(h); }
        anims.push((dt, t) => { rot.rotation.y = t * .6; horses.forEach((h, i) => { h.position.y = 1.6 + Math.sin(t * 3 + i * 1.3) * .3; }); });
      } else if (level === 1) { // mini train
        w = 9; d = 8; for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; b.add(PG.box, '#7a5536', [Math.cos(a) * 3.8, .08, Math.sin(a) * 3], [.25, .1, 1], [0, -a, 0]); }
        b.add(PG.torus, '#8a8a8a', [0, .18, 0], [3.8, 3, 1], [Math.PI / 2, 0, 0]);
        b.add(PG.box, '#c84a3a', [0, 1, 0], [2, 2, 1.6]); b.add(PG.cone4, '#2a2a2a', [0, 2, 0], [1.6, .8, 1.3]);
        const cars = [];
        for (let i = 0; i < 3; i++) { const cb = new Batch(); const col = ['#2a7ad0', '#f2c230', '#3aa04a'][i]; cb.add(PG.box, col, [0, .5, 0], [.8, .55, 1.2]); for (const x of [-.4, .4]) for (const z of [-.35, .35]) cb.add(PG.cyl, '#2a2a2a', [x, .2, z], [.18, .08, .18], [0, 0, Math.PI / 2]); if (i === 0) { cb.add(PG.cyl, '#2a2a2a', [0, 1, .3], [.15, .6, .15]); cb.add(PG.box, '#2a2a2a', [0, .95, -.3], [.8, .8, .5]); } const c = cb.build(); group.add(c); cars.push(c); }
        anims.push((dt, t) => { cars.forEach((c, i) => { const a = t * .5 - i * .38; c.position.set(Math.cos(a) * 3.8, .2, Math.sin(a) * 3); c.rotation.y = -a + Math.PI; }); });
      } else if (level === 2) { // ferris wheel
        w = 8; d = 6; for (const sx of [-1, 1]) { b.add(PG.cyl, '#d8d8e0', [sx * .8, 3.2, 1.2], [.15, 7, .15], [-.35, 0, 0]); b.add(PG.cyl, '#d8d8e0', [sx * .8, 3.2, -1.2], [.15, 7, .15], [.35, 0, 0]); }
        b.add(PG.box, '#8a8a8a', [0, .2, 0], [3, .4, 3]);
        const wheel = new THREE.Group(); wheel.position.set(0, 6.4, 0); group.add(wheel);
        const wb = new Batch(); wb.add(PG.torus, '#e03a5a', [0, 0, 0], [5, 5, 4], [0, Math.PI / 2, 0]); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; wb.add(PG.cyl, '#f5f0e6', [0, Math.sin(a) * 2.5, Math.cos(a) * 2.5], [.05, 5, .05], [a, 0, 0]); wb.add(PG.sph, '#fff3a0', [0, Math.sin(a) * 5, Math.cos(a) * 5], [.14, .14, .14], null, 'glow'); }
        wb.add(PG.cyl, '#8a8a8a', [0, 0, 0], [.4, 1.8, .4], [0, 0, Math.PI / 2]);
        wheel.add(wb.build());
        const gondolas = [];
        for (let i = 0; i < 8; i++) { const gb = new Batch(); const col = ['#2a7ad0', '#f2c230', '#3aa04a', '#c070ff'][i % 4]; gb.add(PG.cyl, col, [0, -.6, 0], [.55, .7, .55]); gb.add(PG.cone, col, [0, -.25, 0], [.6, .4, .6]); gb.add(PG.cyl, '#aaa', [0, -.1, 0], [.03, .3, .03]); const gg = gb.build(); group.add(gg); gondolas.push(gg); }
        anims.push((dt, t) => { const r = t * .25; wheel.rotation.x = r; gondolas.forEach((g, i) => { const a = r + i / 8 * Math.PI * 2; g.position.set(0, 6.4 + Math.sin(a) * 5, Math.cos(a) * 5); g.rotation.z = Math.sin(t * 2 + i) * .05; }); });
      } else { // roller coaster
        w = 9.5; d = 9.5;
        const pts = []; for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * 4, 2.5 + Math.sin(a * 2) * 1.8 + Math.sin(a * 3) * 1.2 + 1.5, Math.sin(a) * 3.5 * Math.cos(a * .5 + .3))); }
        const curve = new THREE.CatmullRomCurve3(pts, true);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, .12, 6, true), toon('#e03a3a')); tube.castShadow = true; group.add(tube);
        const tube2 = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, .07, 5, true), toon('#ffd23a')); tube2.position.y = -.25; group.add(tube2);
        for (let i = 0; i < 16; i++) { const p = curve.getPoint(i / 16); b.add(PG.cyl, '#d8d8e0', [p.x, p.y / 2 - .15, p.z], [.08, p.y, .08]); }
        const train = [];
        for (let i = 0; i < 3; i++) { const cb = new Batch(); cb.add(PG.box, ['#2a7ad0', '#f2c230', '#3aa04a'][i], [0, .25, 0], [.7, .4, .9]); cb.add(PG.sph, '#ffd8b0', [-.15, .55, 0], [.13, .13, .13]); cb.add(PG.sph, '#ffd8b0', [.15, .55, 0], [.13, .13, .13]); const c = cb.build(); group.add(c); train.push(c); }
        const tmp = new THREE.Vector3();
        anims.push((dt, t) => { train.forEach((c, i) => { const u = ((t * .09) - i * .018) % 1; const p = curve.getPointAt((u + 1) % 1); curve.getTangentAt((u + 1) % 1, tmp); c.position.copy(p); c.lookAt(p.x + tmp.x, p.y + tmp.y, p.z + tmp.z); }); });
      }
      break;
    }
  }
  group.add(b.build());
  return { group, anim: anims.length ? (dt, t) => anims.forEach(f => f(dt, t)) : null, w, d };
}

/* ---------------- gate & parking ---------------- */
export function buildGate(level, zooName) {
  const b = new Batch(), g = new THREE.Group();
  const cols = [['#8a5a32', '#a87444'], ['#c8a070', '#3a8a4a'], ['#f5ecd8', '#c62828'], ['#f2c230', '#2a5aa0'], ['#ffffff', '#f2c230']][level];
  const H = 6 + level * 1.6, W = 14 + level * 2;
  for (const sx of [-1, 1]) {
    b.add(level >= 2 ? PG.box : PG.cyl, cols[0], [sx * W / 2, H / 2, 0], level >= 2 ? [1.6, H, 1.6] : [.8, H, .8]);
    b.add(level >= 3 ? PG.sph : PG.cone, cols[1], [sx * W / 2, H + .2, 0], level >= 3 ? [1.2, 1.2, 1.2] : [1.1, 1.6, 1.1]);
    if (level >= 1) { b.add(PG.box, '#c8a070', [sx * (W / 2 + 3), 1.3, 0], [3, 2.6, 2.4]); b.add(PG.cone4, cols[1], [sx * (W / 2 + 3), 2.6, 0], [2.6, 1.2, 2]); b.add(PG.box, '#8ad0f0', [sx * (W / 2 + 3), 1.5, 1.21], [1.6, .9, .05], null, 'glass'); }
  }
  if (level >= 3) b.add(PG.torus, cols[1], [0, H - 1, 0], [W / 2, W / 2 * .5, 3], [0, 0, 0]);
  b.add(PG.box, cols[1], [0, H - .6, 0], [W + 1.4, .9, .9]);
  for (let i = 0; i < 9; i++) b.add(PG.sph, ['#ff4a5a', '#ffd23a', '#3a8aff', '#7ad04a'][i % 4], [-W / 2 + W * i / 8, H - 1.4 - Math.sin(i / 8 * Math.PI) * .9, .5], [.3, .38, .3]);
  if (level >= 4) for (let i = 0; i < 14; i++) b.add(PG.sph, '#fff3a0', [-W / 2 + W * i / 13, H + .3, .6], [.15, .15, .15], null, 'glow');
  // turnstiles
  for (let i = -2; i <= 2; i++) { b.add(PG.box, '#9a9a9a', [i * 1.6, .5, 0], [.2, 1, 1.2]); b.add(PG.cyl, '#c8c8c8', [i * 1.6 + .5, .8, 0], [.05, .8, .05], [0, 0, Math.PI / 2]); }
  g.add(b.build());
  const sign = signMesh([zooName || 'ZOO', GATES[level].name], 9, 2.4, { bg: cols[1], border: '#2a2a2a', fg: '#ffffff' });
  sign.position.set(0, H + 1.1, .6); g.add(sign);
  return g;
}
export function buildCar(color, kind = 'car') {
  const b = new Batch();
  if (kind === 'bus') {
    b.add(PG.box, color, [0, 1.4, 0], [2.4, 2.2, 7]); b.add(PG.box, '#bfe6ff', [0, 1.9, 0], [2.45, .8, 6.2], null, 'glass');
    for (const z of [-2.3, 2.3]) for (const x of [-1.2, 1.2]) b.add(PG.cyl, '#222', [x, .45, z], [.45, .3, .45], [0, 0, Math.PI / 2]);
    b.add(PG.box, '#fff3a0', [0, 1, 3.51], [1.8, .3, .05], null, 'glow');
  } else {
    b.add(PG.box, color, [0, .6, 0], [1.7, .7, 3.6]); b.add(PG.box, color, [0, 1.15, -.2], [1.5, .6, 2]); b.add(PG.box, '#bfe6ff', [0, 1.15, -.2], [1.55, .45, 1.8], null, 'glass');
    for (const z of [-1.2, 1.2]) for (const x of [-.85, .85]) b.add(PG.cyl, '#222', [x, .32, z], [.32, .22, .32], [0, 0, Math.PI / 2]);
    for (const x of [-.55, .55]) b.add(PG.sph, '#fff6c0', [x, .65, 1.8], [.15, .1, .05], null, 'glow');
  }
  return b.build();
}

/* ---------------- people ---------------- */
const SKIN = ['#f8d8c0', '#f0c0a0', '#d8a07a', '#b07850', '#8a5a3a', '#5a3a28', '#ffe0cc'];
const HAIR = ['#2a1a10', '#5a3a1a', '#8a5a2a', '#e0c080', '#c84a2a', '#1a1a1a', '#a0a0a0', '#ff7ab0', '#5a8aff'];
const SHIRT = ['#e03a3a', '#3a7ad0', '#3aa04a', '#f2c230', '#c070ff', '#ff8a3a', '#ffffff', '#2a2a2a', '#40c8c0', '#ff6aa0'];
const PANTS = ['#2a3a5a', '#3a3a3a', '#6a5a4a', '#1a2a4a', '#8a7a6a', '#c8a080', '#4a2a5a'];
export function buildHuman(opt = {}) {
  const r = rng(opt.seed || (Math.random() * 1e9) | 0);
  const pk = a => a[Math.floor(r() * a.length)];
  const kid = opt.kid ?? r() < .25, s = kid ? .65 : .9 + r() * .2;
  const keeper = opt.keeper, vip = opt.vip;
  const skin = pk(SKIN), hair = pk(HAIR);
  const shirt = keeper ? '#c8a86a' : vip ? '#6a1a8a' : opt.shirt || pk(SHIRT);
  const pants = keeper ? '#4a6a3a' : vip ? '#f2c230' : opt.pants || pk(PANTS);
  const mover = new THREE.Group(), root = new THREE.Group(); mover.add(root);
  const h = { mover, root, kind: 'human', legs: [], arms: [], s, kid, keeper, state: { name: 'idle', t: 0, mv: 0, phase: r() * 6 } };
  // static body
  const bb = new Batch();
  bb.add(PG.sph, shirt, [0, 1.15, 0], [.27, .36, .19]);
  bb.add(PG.cyl, pants, [0, .88, 0], [.24, .18, .17]);
  if (r() < .3 && !keeper) bb.add(PG.box, pk(['#c84a2a', '#3a5a8a', '#5a8a3a']), [0, 1.18, -.2], [.32, .4, .16]);
  if (keeper) { bb.add(PG.box, '#3a5a2a', [0, 1.3, .17], [.15, .1, .03]); bb.add(PG.box, '#5a3a20', [0, .98, 0], [.5, .06, .36]); }
  h.body = new THREE.Group(); root.add(h.body);
  const head = h.head = new THREE.Group(); head.position.y = 1.62; root.add(head);
  const hb = new Batch();
  hb.add(PG.sphHi, skin, [0, 0, 0], [.2, .22, .2]);
  hb.add(PG.sph, '#1a1410', [.07, .02, .18], [.03, .04, .02]); hb.add(PG.sph, '#1a1410', [-.07, .02, .18], [.03, .04, .02]);
  hb.add(PG.torus, '#8a3a2a', [0, -.08, .17], [.05, .03, .03], [0, 0, Math.PI]);
  hb.add(PG.sph, skin, [0, -.01, .2], [.03, .035, .03]);
  const style = keeper ? 'safari' : vip ? 'crown' : pk(['short', 'long', 'bun', 'cap', 'bald', 'pony', 'curly', 'beanie']);
  if (style !== 'bald' && style !== 'safari' && style !== 'crown') hb.add(PG.sph, hair, [0, .08, -.03], [.215, .2, .21]);
  if (style === 'long') hb.add(PG.sph, hair, [0, -.12, -.1], [.2, .25, .12]);
  if (style === 'bun') hb.add(PG.sph, hair, [0, .2, -.12], [.09, .09, .09]);
  if (style === 'pony') hb.add(PG.sph, hair, [0, 0, -.25], [.07, .18, .07]);
  if (style === 'curly') for (let i = 0; i < 6; i++) hb.add(PG.sph, hair, [Math.cos(i) * .15, .12 + (i % 2) * .05, Math.sin(i) * .15 - .03], [.09, .09, .09]);
  if (style === 'cap') { const c = pk(SHIRT); hb.add(PG.hemi, c, [0, .08, 0], [.22, .14, .22]); hb.add(PG.box, c, [0, .09, .2], [.24, .02, .16]); }
  if (style === 'beanie') hb.add(PG.hemi, pk(SHIRT), [0, .06, 0], [.225, .2, .225]);
  if (style === 'safari') { hb.add(PG.cyl16, '#c8a86a', [0, .1, 0], [.36, .03, .36]); hb.add(PG.hemi, '#c8a86a', [0, .1, 0], [.21, .16, .21]); hb.add(PG.cyl16, '#5a3a20', [0, .13, 0], [.215, .03, .215]); }
  if (style === 'crown') { hb.add(PG.sph, hair, [0, .08, -.03], [.215, .2, .21]); hb.add(PG.cyl, '#f2c230', [0, .25, 0], [.16, .12, .16]); for (let i = 0; i < 5; i++) hb.add(PG.cone, '#f2c230', [Math.cos(i * 1.256) * .14, .3, Math.sin(i * 1.256) * .14], [.04, .12, .04]); }
  if (r() < .15) { hb.add(PG.torus, '#2a2a2a', [.07, .02, .19], [.05, .05, .05]); hb.add(PG.torus, '#2a2a2a', [-.07, .02, .19], [.05, .05, .05]); }
  head.add(hb.build());
  h.body.add(bb.build());
  for (const sx of [1, -1]) {
    const leg = new THREE.Group(); leg.position.set(sx * .1, .85, 0); root.add(leg);
    const lb = new Batch(); lb.add(PG.cyl, pants, [0, -.4, 0], [.085, .8, .085]); lb.add(PG.sph, keeper ? '#3a2a1a' : pk(['#2a2a2a', '#ffffff', '#c84a2a', '#5a3a1a']), [0, -.82, .05], [.09, .06, .14]);
    leg.add(lb.build()); h.legs.push({ g: leg, ph: sx > 0 ? 0 : Math.PI });
    const arm = new THREE.Group(); arm.position.set(sx * .3, 1.4, 0); root.add(arm);
    const ab = new Batch(); ab.add(PG.cyl, shirt, [0, -.15, 0], [.065, .3, .065]); ab.add(PG.cyl, skin, [0, -.42, 0], [.055, .28, .055]); ab.add(PG.sph, skin, [0, -.58, 0], [.06, .06, .06]);
    arm.add(ab.build()); h.arms.push({ g: arm, sx, ph: sx > 0 ? Math.PI : 0 });
  }
  // hand-held item
  const item = opt.item ?? (keeper ? 'bucket' : pk(['', '', '', 'balloon', 'icecream', 'camera', 'drink', 'plush', 'popcorn']));
  h.itemName = item;
  if (item) {
    const ib = new Batch(), hand = h.arms[0].g;
    if (item === 'balloon') { const c = pk(SHIRT); ib.add(PG.sphHi, c, [0, .95, 0], [.2, .25, .2]); ib.add(PG.cyl, '#ffffff', [0, .25, 0], [.006, 1.3, .006]); }
    if (item === 'icecream') { ib.add(PG.cone, '#d8a060', [0, -.62, .05], [.05, -.16, .05]); ib.add(PG.sph, pk(['#ffb0c8', '#ffffff', '#8a5a3a', '#a0e0a0']), [0, -.6, .05], [.06, .06, .06]); }
    if (item === 'camera') ib.add(PG.box, '#2a2a2a', [0, -.6, .08], [.14, .1, .08]);
    if (item === 'drink') { ib.add(PG.cyl, pk(['#e03a3a', '#3a7ad0']), [0, -.62, .05], [.05, .14, .05]); ib.add(PG.cyl, '#ffffff', [0, -.5, .05], [.01, .1, .01]); }
    if (item === 'plush') ib.add(PG.sph, pk(['#a87444', '#ffffff', '#f2c230']), [0, -.65, .1], [.1, .1, .08]);
    if (item === 'popcorn') { ib.add(PG.cyl, '#e03a3a', [0, -.65, .08], [.07, .14, .07]); ib.add(PG.sph, '#fff6d0', [0, -.56, .08], [.07, .05, .07]); }
    if (item === 'bucket') { ib.add(PG.cyl, '#7a8a9a', [0, -.7, .05], [.12, .18, .12]); ib.add(PG.sph, '#c84a2a', [0, -.6, .05], [.08, .04, .08]); }
    if (item === 'box') ib.add(PG.box, '#c8a070', [0, -.55, .2], [.4, .3, .3]);
    if (item === 'sign') { ib.add(PG.cyl, '#7a5536', [0, .2, 0], [.02, 1.2, .02]); ib.add(PG.box, '#ffffff', [0, .8, 0], [.6, .4, .03]); }
    if (item === 'bag') ib.add(PG.box, '#2a2a2a', [0, -.6, 0], [.18, .26, .1]);
    const it = ib.build(); hand.add(it); h.item = it;
  }
  root.scale.setScalar(s);
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.human = h; } });
  return h;
}
const dampH = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
export function animateHuman(h, dt, time) {
  const st = h.state, S_ = st.name, t = (st.t += dt), mv = st.mv;
  st.phase += dt * (mv > .01 ? 6 + mv * 6 : 0);
  const ph = st.phase;
  const run = S_ === 'run' || S_ === 'flee' || S_ === 'panic' && mv > .01;
  let legA = mv > .01 ? (run ? .9 : .55) : 0, armA = legA * .9, bob = mv > .01 ? Math.abs(Math.sin(ph)) * .05 : 0, armL = 0, armR = 0, sit = 0, lean = 0, headX = 0, headY = 0, jump = 0, kneel = 0;
  switch (S_) {
    case 'photo': armL = -1.6; armR = -1.5; headX = .1; break;
    case 'wave': armR = -2.8 + Math.sin(t * 10) * .3; break;
    case 'point': armR = -1.5; headY = .2; break;
    case 'cheer': armL = armR = -2.9; jump = Math.abs(Math.sin(t * 7)) * .25; break;
    case 'clap': armL = armR = -1.3; break;
    case 'eat': armR = -1.9 + Math.sin(t * 3) * .4; break;
    case 'sit': sit = 1; break;
    case 'look': headY = Math.sin(t * 1.2) * .7; break;
    case 'panic': case 'flee': armL = armR = -2.9 + Math.sin(t * 20) * .3; legA = mv > .01 ? 1 : .3; if (mv < .01) jump = Math.abs(Math.sin(t * 9)) * .15; break;
    case 'carry': armL = armR = -1.1; armA = 0; break;
    case 'feed': armR = -1 - Math.max(0, Math.sin(t * 3)) * 1.3; break;
    case 'kneel': kneel = 1; armR = -1.4; break;
    case 'sign': armL = armR = -2.6 + Math.sin(t * 4) * .2; jump = Math.abs(Math.sin(t * 4)) * .1; break;
    case 'dance': armL = -2.5 + Math.sin(t * 8) * .5; armR = -2.5 - Math.sin(t * 8) * .5; jump = Math.abs(Math.sin(t * 8)) * .12; lean = Math.sin(t * 4) * .15; break;
  }
  if (h.itemName === 'balloon' && S_ !== 'cheer') armR = Math.min(armR, -.6);
  h.root.position.y = dampH(h.root.position.y, bob + jump - sit * .38 - kneel * .3, 16, dt);
  h.root.rotation.z = dampH(h.root.rotation.z, lean, 8, dt);
  h.legs.forEach((L, i) => {
    const target = sit ? -1.5 : kneel ? (i ? -1.4 : .2) : Math.sin(ph + L.ph) * legA;
    L.g.rotation.x = dampH(L.g.rotation.x, target, 14, dt);
  });
  h.arms.forEach(A => {
    const base = A.sx > 0 ? armR : armL;
    A.g.rotation.x = dampH(A.g.rotation.x, base + Math.sin(ph + A.ph) * armA, 12, dt);
    A.g.rotation.z = dampH(A.g.rotation.z, A.sx * (S_ === 'cheer' || S_ === 'panic' ? .4 : .08), 8, dt);
  });
  h.head.rotation.x = dampH(h.head.rotation.x, headX, 8, dt);
  h.head.rotation.y = dampH(h.head.rotation.y, headY, 8, dt);
}

/* ---------------- event models ---------------- */
export function buildUFO() {
  const b = new Batch();
  b.add(PG.sphHi, '#b8c0c8', [0, 0, 0], [3, .6, 3]); b.add(PG.hemi, '#9af0ff', [0, .3, 0], [1.4, 1.1, 1.4], null, 'glass');
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; b.add(PG.sph, ['#ff4a5a', '#ffd23a', '#7aff6a'][i % 3], [Math.cos(a) * 2.6, -.1, Math.sin(a) * 2.6], [.2, .15, .2], null, 'glow'); }
  const g = b.build();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.8, 2.4, 12, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#9affb0', transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.y = -6.2; g.add(beam); g.userData.beam = beam;
  return g;
}
export function buildGhost() {
  const b = new Batch();
  b.add(PG.sphHi, '#f4f8ff', [0, 1.6, 0], [.7, .8, .6], null, 'glass');
  b.add(PG.cone, '#f4f8ff', [0, .2, 0], [.75, 1.4, .65], [Math.PI, 0, 0], 'glass');
  b.add(PG.sph, '#1a1a2a', [.22, 1.75, .5], [.12, .18, .06]); b.add(PG.sph, '#1a1a2a', [-.22, 1.75, .5], [.12, .18, .06]); b.add(PG.sph, '#1a1a2a', [0, 1.4, .55], [.12, .14, .05]);
  return b.build();
}
export function buildCarriage() {
  const b = new Batch();
  b.add(PG.sphHi, '#f2c230', [0, 1.8, 0], [1.2, 1.1, 1.6]); b.add(PG.cone, '#f2c230', [0, 2.8, 0], [.2, .6, .2]);
  for (const z of [-1, 1]) for (const x of [-1, 1]) b.add(PG.torus, '#f2c230', [x * 1.1, .7, z], [.6, .6, .6], [0, Math.PI / 2, 0]);
  b.add(PG.box, '#c8e8ff', [0, 1.9, 0], [1.3, .7, 1.2], null, 'glass');
  for (let i = 0; i < 2; i++) { b.add(PG.sph, '#ffffff', [0, 1.2, 3 + i * 1.5], [.4, .45, .8]); b.add(PG.sph, '#ffffff', [0, 1.8, 3.6 + i * 1.5], [.2, .3, .3]); for (const x of [-.2, .2]) for (const z of [-.4, .4]) b.add(PG.cyl, '#ffffff', [x, .5, 3 + i * 1.5 + z], [.06, 1, .06]); }
  return b.build();
}
export function buildBolt() {
  const pts = [];
  let x = 0, z = 0;
  for (let y = 40; y >= 0; y -= 3) { pts.push(new THREE.Vector3(x, y, z)); x += (Math.random() - .5) * 3; z += (Math.random() - .5) * 3; }
  const g = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .25, 4), new THREE.MeshBasicMaterial({ color: '#fffbd0' }));
  return g;
}
export function buildMeteorRock() {
  const b = new Batch();
  b.add(PG.sph, '#3a3038', [0, .8, 0], [1.6, 1.2, 1.4], [.3, .5, 0]); b.add(PG.sph, '#ff7a2a', [.6, 1.2, .5], [.5, .4, .4], null, 'glow'); b.add(PG.sph, '#a070ff', [-.5, 1.4, -.3], [.4, .3, .4], null, 'glow');
  b.add(PG.torus, '#5a4a40', [0, .1, 0], [3, 3, 2], [Math.PI / 2, 0, 0]);
  return b.build();
}
export function buildEgg() {
  const b = new Batch();
  b.add(PG.sphHi, '#fff4c0', [0, .7, 0], [.5, .7, .5], null, 'glow');
  for (let i = 0; i < 6; i++) b.add(PG.sph, '#a070ff', [Math.cos(i) * .45, .5 + (i % 3) * .2, Math.sin(i) * .45], [.08, .08, .08], null, 'glow');
  return b.build();
}
