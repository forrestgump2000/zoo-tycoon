/* Zoo Tycoon 3D — the open-world zoo: layout, habitats, creatures, crowds, weather, camera & events */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildAnimal, animateRig, setState, BEHAVIORS, toon, GEO, mix, shade, rng, hashStr } from './models.js';
import { Batch, PG, prop, fence, buildFacility, buildGate, buildCar, buildHuman, animateHuman, signMesh, textTexture, buildUFO, buildGhost, buildCarriage, buildBolt, buildMeteorRock, buildEgg, VC } from './props.js';

const HALF = 32, LANE = [-152, -76, 0, 76, 152], RING = 24.2, INNER = 22;
const PLOT_POS = [[1, 3], [2, 3], [0, 3], [3, 3], [1, 2], [2, 2], [0, 2], [3, 2], [1, 1], [2, 1], [0, 1], [3, 1], [1, 0], [2, 0], [0, 0], [3, 0]];
const MAX_ANIMALS_SHOWN = 40;
const GATE_Z = 160;
const SLOT_OFF = [-19, -12, -5.5, 5.5, 12, 19];
const SIDES = [{ n: 's', z: 29, rot: Math.PI }, { n: 'e', x: 29, rot: -Math.PI / 2 }, { n: 'w', x: -29, rot: Math.PI / 2 }, { n: 'n', z: -29, rot: 0 }];
const CORNERS = [[27, 27], [-27, 27], [27, -27], [-27, -27]];
const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3();
const DOT = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.55, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(cv); return t; })();
const lerp = (a, b, t) => a + (b - a) * t;
const angDamp = (a, b, k, dt) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * (1 - Math.exp(-k * dt)); };

function cellLayout(n) {
  if (n <= 1) return [[0, 0, 1, 1]];
  const cols = n <= 2 ? 1 : n <= 4 ? 2 : n <= 6 ? 3 : 4, rows = n <= 2 ? 2 : 2;
  const out = [];
  for (let i = 0; i < n; i++) { const c = i % cols, r = Math.floor(i / cols); out.push([c / cols, r / rows, (c + 1) / cols, (r + 1) / rows]); }
  if (n === 3) out[2] = [0, .5, 1, 1];
  if (n === 5) out[4] = [2 / 3, 0, 1, 1];
  if (n === 7) out[6] = [.75, .5, 1, 1];
  return out;
}

export const World = {
  ready: false, picks: [], plots: {}, visitors: [], cars: [], fx: [], timers: [], keepersOut: [],
  time: 0, tod: .3, followId: null, walk: false, keys: {}, hovered: null,

  init(container) {
    this.container = container;
    const R = this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    R.setSize(container.clientWidth, container.clientHeight);
    R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(R.domElement);
    const scene = this.scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#bfe3f5', 260, 620);
    const cam = this.camera = new THREE.PerspectiveCamera(48, container.clientWidth / container.clientHeight, .3, 1600);
    const start = this.plotCenter(0);
    cam.position.set(start.x + 18, 34, start.z + 62);
    const C = this.controls = new OrbitControls(cam, R.domElement);
    C.target.copy(start).add(new THREE.Vector3(0, 0, 14)); C.enableDamping = true; C.dampingFactor = .08;
    C.maxPolarAngle = 1.36; C.minDistance = 4; C.maxDistance = 360; C.screenSpacePanning = false; C.panSpeed = 1.1;
    C.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    C.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
    // lights
    this.hemi = new THREE.HemisphereLight('#dff4ff', '#6a8a4a', .9); scene.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight('#fff3dc', 1.6);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -90; sc.right = 90; sc.top = 90; sc.bottom = -90; sc.near = 10; sc.far = 400;
    sun.shadow.bias = -.0005; sun.shadow.normalBias = .4;
    scene.add(sun, sun.target);
    this.buildSky();
    this.buildGround();
    this.buildPaths();
    this.buildOutskirts();
    this.dyn = new THREE.Group(); scene.add(this.dyn);
    for (let i = 0; i < BIOMES.length; i++) this.plots[BIOMES[i].id] = { i, id: BIOMES[i].id, center: this.plotCenter(i), agents: new Map(), keepers: [], mascots: [], anims: [], sig: '' };
    for (const b of BIOMES) this.rebuildPlot(b.id);
    this.rebuildPark();
    this.buildWeather();
    this.buildParticles();
    this.bindInput();
    window.addEventListener('resize', () => this.resize());
    Bus.on('worldChanged', id => { if (id === 'park') this.rebuildPark(); else if (this.plots[id]) this.plots[id].dirty = true; });
    Bus.on('animalsChanged', (id, newIds) => { if (this.plots[id]) this.syncAnimals(id, new Set(newIds || [])); });
    Bus.on('unlock', id => { this.plots[id].dirty = true; setTimeout(() => { this.focusBiome(id); this.confetti(this.plots[id].center, 300); }, 50); });
    this.ready = true;
  },
  plotCenter(i) { const [c, r] = PLOT_POS[i]; return new THREE.Vector3(LANE[c] + 38, 0, LANE[r] + 38); },
  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  },

  /* ---------- sky, ground, paths ---------- */
  buildSky() {
    const g = new THREE.SphereGeometry(900, 32, 16);
    const cols = new Float32Array(g.attributes.position.count * 3);
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    this.skyMesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    this.skyMesh.renderOrder = -10;
    this.scene.add(this.skyMesh);
    this.sunBall = new THREE.Mesh(GEO.sph, new THREE.MeshBasicMaterial({ color: '#fff4b0', fog: false })); this.sunBall.scale.setScalar(28); this.scene.add(this.sunBall);
    this.moonBall = new THREE.Mesh(GEO.sph, new THREE.MeshBasicMaterial({ color: '#eef2ff', fog: false })); this.moonBall.scale.setScalar(18); this.scene.add(this.moonBall);
    const sp = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) { const a = Math.random() * Math.PI * 2, e = Math.random() * 1.3 + .1; sp[i * 3] = Math.cos(a) * Math.cos(e) * 850; sp[i * 3 + 1] = Math.sin(e) * 850; sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 850; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    this.scene.add(this.stars);
    // clouds
    this.clouds = new THREE.Group();
    const cb = new Batch(), r = rng(42);
    for (let i = 0; i < 26; i++) { const x = (r() - .5) * 900, z = (r() - .5) * 900, y = 120 + r() * 60; for (let k = 0; k < 5; k++) cb.add(PG.sph, '#ffffff', [x + (k - 2) * 9, y + (k % 2) * 4, z + (r() - .5) * 8], [12 + r() * 6, 7 + r() * 3, 9 + r() * 4]); }
    const cm = cb.build({ shadow: false }); cm.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .92, fog: false }); } });
    this.clouds.add(cm); this.scene.add(this.clouds);
  },
  buildGround() {
    const g = new THREE.PlaneGeometry(1400, 1400, 70, 70); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color(), r = rng(9);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), d = Math.max(Math.abs(x), Math.abs(z));
      if (d > 230) pos.setY(i, (Math.sin(x * .02) + Math.cos(z * .025)) * 6 * Math.min(1, (d - 230) / 80) - 1);
      else pos.setY(i, -.05);
      c.set('#6aa84f').offsetHSL(0, 0, (r() - .5) * .05); col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const ground = new THREE.Mesh(g, VC.toon); ground.receiveShadow = true; ground.userData.ground = true;
    this.scene.add(ground); this.ground = ground;
  },
  buildPaths() {
    const b = new Batch(), r = rng(3), W = 12;
    const pathC = '#d8c8a8', curb = '#a89878';
    for (const z of LANE) { b.add(PG.box, pathC, [0, .02, z], [304 + W, .06, W]); b.add(PG.box, curb, [0, .05, z - W / 2], [304 + W, .1, .4]); b.add(PG.box, curb, [0, .05, z + W / 2], [304 + W, .1, .4]); }
    for (const x of LANE) { b.add(PG.box, pathC, [x, .025, 0], [W, .06, 304 + W]); b.add(PG.box, curb, [x - W / 2, .05, 0], [.4, .1, 304 + W]); b.add(PG.box, curb, [x + W / 2, .05, 0], [.4, .1, 304 + W]); }
    // decorative pavers
    for (let i = 0; i < 260; i++) { const onX = r() < .5, L = LANE[Math.floor(r() * 5)], t = (r() - .5) * 300; b.add(PG.box, r() < .5 ? '#cbb998' : '#e2d4b8', [onX ? t : L + (r() - .5) * 9, .055, onX ? L + (r() - .5) * 9 : t], [1.2, .02, 1.2], [0, r(), 0]); }
    // plazas, lamps, benches, bins, planters at intersections & mid lanes
    for (const x of LANE) for (const z of LANE) {
      b.add(PG.cyl16, '#e8dcc0', [x, .03, z], [8, .07, 8]);
      b.add(PG.cyl16, '#c8b890', [x, .05, z], [3.2, .1, 3.2]);
      if (Math.abs(x) < 160 && Math.abs(z) < 160) { b.add(PG.cyl16, '#8a7a5a', [x, .35, z], [2, .6, 2]); prop(b, 'flowers', x, z, 1.1, 0, x * 7 + z); prop(b, 'bush', x, z, 1, 0, x + z * 3); }
      for (const [dx, dz] of [[6.6, 6.6], [-6.6, -6.6], [6.6, -6.6], [-6.6, 6.6]]) this.lamp(b, x + dx, z + dz);
    }
    for (const L of LANE) for (let k = 0; k < 4; k++) {
      const m = -114 + k * 76;
      for (const [x, z, ry] of [[m, L + 5.6, 0], [L + 5.6, m, Math.PI / 2]]) {
        this.lamp(b, x - 14, z); this.lamp(b, x + 14, z);
        b.push(); b.local(x, 0, z, ry); b.add(PG.box, '#9a6a42', [0, .45, 0], [2, .1, .55]); b.add(PG.box, '#9a6a42', [0, .8, .22], [2, .4, .08]); b.add(PG.cyl, '#3a7a3a', [3, .45, 0], [.3, .9, .3]); b.add(PG.cyl, '#2a5a2a', [3, .92, 0], [.33, .06, .33]); b.pop();
      }
    }
    // perimeter wall
    for (const s of [-1, 1]) {
      b.add(PG.box, '#b8a888', [0, 1.4, s * 166], [340, 2.8, 1.2]); b.add(PG.box, '#b8a888', [s * 166, 1.4, 0], [1.2, 2.8, 340]);
      for (let i = -8; i <= 8; i++) { b.add(PG.box, '#a89878', [i * 20, 1.8, s * 166], [1.8, 3.6, 1.8]); b.add(PG.box, '#a89878', [s * 166, 1.8, i * 20], [1.8, 3.6, 1.8]); }
    }
    // central plaza decoration
    b.add(PG.cyl16, '#c8c0b0', [0, .4, 0], [4.5, .8, 4.5]); b.add(PG.cyl16, '#6ac8f0', [0, .82, 0], [4.1, .05, 4.1], null, 'water');
    b.add(PG.cyl, '#c8c0b0', [0, 2.2, 0], [.5, 3, .5]); b.add(PG.sph, '#f2c230', [0, 4, 0], [1, 1, 1]);
    const m = b.build(); m.traverse(o => { if (o.isMesh) o.castShadow = false; });
    this.scene.add(m);
    this.fountains = [new THREE.Vector3(0, 4, 0)];
    // signposts at intersections
    for (let i = 0; i < 5; i++) for (let j = 1; j < 5; j++) if (Math.random() < .35) { const s = signMesh(['Zoo Map', 'You are here'], 2.6, 1, { size: 40, size2: 28, bg: '#2e7d32' }); s.position.set(LANE[i] - 5, 2.8, LANE[j] + 5); this.scene.add(s); const post = new THREE.Mesh(GEO.cyl, toon('#6d4c41')); post.scale.set(.08, 2.4, .08); post.position.set(LANE[i] - 5, 1.2, LANE[j] + 5); this.scene.add(post); }
  },
  lamp(b, x, z) { b.add(PG.cyl, '#3a3a3a', [x, 1.8, z], [.08, 3.6, .08]); b.add(PG.cyl, '#3a3a3a', [x, 3.65, z], [.25, .1, .25]); b.add(PG.sph, '#fff1b0', [x, 3.9, z], [.28, .3, .28], null, 'glow'); },
  buildOutskirts() {
    const b = new Batch(), r = rng(77);
    for (let i = 0; i < 260; i++) {
      const a = r() * Math.PI * 2, d = 185 + r() * 160;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (z > 160 && Math.abs(x) < 80) continue;
      prop(b, r() < .6 ? 'pine' : 'oak', x, z, 1.6 + r() * 1.6, r() * 6, i);
    }
    const m = b.build(); m.traverse(o => { if (o.isMesh) o.castShadow = false; }); this.scene.add(m);
    const mb = new Batch();
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + .2, d = 560; mb.add(PG.cone, i % 2 ? '#7a90a8' : '#8aa0b8', [Math.cos(a) * d, -10, Math.sin(a) * d], [110 + (i % 3) * 30, 140 + (i % 4) * 30, 110]); mb.add(PG.cone, '#f4f8fb', [Math.cos(a) * d, 85 + (i % 4) * 20, Math.sin(a) * d], [34, 46, 34]); }
    const mm = mb.build({ shadow: false }); mm.traverse(o => { if (o.isMesh) o.material = new THREE.MeshBasicMaterial({ vertexColors: true, fog: true }); }); this.scene.add(mm);
    // road to the zoo
    const rb = new Batch();
    rb.add(PG.box, '#5a5a62', [0, .03, 340], [16, .06, 300]);
    for (let i = 0; i < 30; i++) rb.add(PG.box, '#f2e8c0', [0, .07, 200 + i * 10], [.4, .02, 4]);
    const rm = rb.build(); this.scene.add(rm);
  },

  /* ---------- entrance & parking ---------- */
  rebuildPark() {
    if (this.parkGroup) this.scene.remove(this.parkGroup);
    const g = this.parkGroup = new THREE.Group();
    const gate = buildGate(S.gate, S.zooName); gate.position.set(0, 0, GATE_Z); g.add(gate);
    const b = new Batch();
    const lvl = S.parking;
    const pw = 70 + lvl * 18, pd = 46 + lvl * 8;
    b.add(PG.box, lvl === 0 ? '#9a8060' : lvl === 1 ? '#b0a898' : '#4a4a52', [0, .03, GATE_Z + 14 + pd / 2], [pw, .06, pd]);
    this.parkSlots = [];
    for (let row = 0; row < Math.floor(pd / 7); row++) for (let col = 0; col < Math.floor(pw / 3.4); col++) {
      const x = -pw / 2 + 2 + col * 3.4, z = GATE_Z + 18 + row * 7;
      if (Math.abs(x) < 7) continue;
      if (lvl >= 2) b.add(PG.box, '#f2f2f2', [x - 1.7, .07, z], [.12, .02, 5]);
      this.parkSlots.push([x, z]);
    }
    if (lvl >= 3) { b.add(PG.box, '#8a8a92', [pw / 2 + 12, 6, GATE_Z + 40], [20, 12, 30]); for (let i = 1; i < 4; i++) b.add(PG.box, '#6a6a72', [pw / 2 + 12, i * 3, GATE_Z + 40], [20.5, .3, 30.5]); }
    g.add(b.build());
    // monorail loop for the top parking tier
    this.monorail = null;
    if (lvl >= 5) {
      const pts = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * 175, 9, Math.sin(a) * 175)); }
      const curve = new THREE.CatmullRomCurve3(pts, true);
      const track = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, .6, 6, true), toon('#d8d8e0')); g.add(track);
      const pb = new Batch(); for (let i = 0; i < 48; i += 2) { const p = curve.getPoint(i / 48); pb.add(PG.cyl, '#b8b8c0', [p.x, 4.5, p.z], [.6, 9, .6]); } g.add(pb.build());
      const tb = new Batch(); for (let i = 0; i < 4; i++) { tb.add(PG.box, i ? '#ffffff' : '#2a7ad0', [0, 10.4, -i * 5.4], [2.6, 2.6, 5]); tb.add(PG.box, '#9ad0f0', [0, 10.8, -i * 5.4], [2.65, .9, 4.4], null, 'glass'); }
      const train = tb.build(); g.add(train);
      this.monorail = { curve, train };
    }
    this.scene.add(g);
    this.syncCars(true);
  },
  syncCars(force) {
    const want = Math.min(this.parkSlots.length, Math.round(4 + Math.sqrt(S.lastVisitors || 10) * 2.4));
    if (force) { for (const c of this.cars) this.parkGroup.remove(c.mesh); this.cars = []; }
    const r = rng(S.day * 13 + 1);
    while (this.cars.length < want) {
      const slot = this.parkSlots[Math.floor(r() * this.parkSlots.length)];
      if (this.cars.some(c => c.slot === slot)) { if (this.cars.length > this.parkSlots.length * .8) break; continue; }
      const m = buildCar(['#e03a3a', '#3a7ad0', '#f2c230', '#ffffff', '#2a2a2a', '#3aa04a', '#c070ff', '#ff8a3a', '#8a8a8a'][Math.floor(r() * 9)]);
      m.position.set(slot[0], 0, slot[1]); m.rotation.y = r() < .5 ? 0 : Math.PI;
      this.parkGroup.add(m); this.cars.push({ mesh: m, slot });
    }
    while (this.cars.length > want) { const c = this.cars.pop(); this.parkGroup.remove(c.mesh); }
    if (S.parking >= 4 && !this.bus) { this.bus = buildCar('#f2c230', 'bus'); this.bus.position.set(-20, 0, 200); this.scene.add(this.bus); }
  },

  /* ---------- plots ---------- */
  rebuildPlot(id) {
    const P = this.plots[id], b = BIOME_BY_ID[id], st = S.biomes[id];
    if (P.group) { this.scene.remove(P.group); P.group.traverse(o => { if (o.isMesh && o.geometry && !Object.values(GEO).includes(o.geometry) && !Object.values(PG).includes(o.geometry)) o.geometry.dispose(); }); }
    const group = P.group = new THREE.Group();
    group.position.copy(P.center);
    P.anims = []; P.cells = []; P.slots = []; P.fountains = []; P.volcanoes = []; P.foodSpots = [];
    const B = new Batch(), r = rng(hashStr(id) + 7);
    if (!st.unlocked) {
      B.add(PG.box, '#a08060', [0, .03, 0], [64, .06, 64]);
      for (let i = 0; i < 40; i++) B.add(PG.sph, '#8a6a4a', [(r() - .5) * 56, .05, (r() - .5) * 56], [1 + r() * 2, .15, 1 + r() * 2]);
      const barrier = (x0, z0, x1, z1) => { const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 4); for (let i = 0; i < n; i++) { const t = (i + .5) / n; B.add(PG.box, i % 2 ? '#ff7a1a' : '#ffffff', [lerp(x0, x1, t), .7, lerp(z0, z1, t)], x0 === x1 ? [.2, .5, 3.6] : [3.6, .5, .2]); } };
      barrier(-30, -30, 30, -30); barrier(-30, 30, 30, 30); barrier(-30, -30, -30, 30); barrier(30, -30, 30, 30);
      for (let i = 0; i < 6; i++) { const x = (r() - .5) * 40, z = (r() - .5) * 40; B.add(PG.cone, '#ff7a1a', [x, 0, z], [.35, .8, .35]); B.add(PG.cyl, '#ffffff', [x, .45, z], [.25, .1, .25]); }
      B.add(PG.box, '#f2c230', [8, .6, 6], [3, 1.2, 1.6]); B.add(PG.box, '#2a2a2a', [8, 1.4, 6.5], [1, .6, .4]);
      const sign = signMesh([b.name.replace(/ \(.*\)/, ''), 'FOR SALE  $' + fmt(b.cost)], 13, 3.6, { size: 46, size2: 40, bg: '#2e5d1e', border: '#f2c230' });
      sign.position.set(0, 4.6, 12); group.add(sign);
      for (const sx of [-1, 1]) B.add(PG.cyl, '#6d4c41', [sx * 6, 2.2, 12], [.25, 4.4, .25]);
      P.sign = sign;
      group.add(B.build());
      const pick = new THREE.Mesh(new THREE.BoxGeometry(64, .5, 64), new THREE.MeshBasicMaterial({ visible: false })); pick.userData.plot = id; group.add(pick);
      P.pick = pick;
      this.scene.add(group);
      P.sig = 'locked';
      return;
    }
    // themed ground
    B.add(PG.box, b.ground, [0, .04, 0], [64, .08, 64]);
    for (let i = 0; i < 70; i++) B.add(PG.cyl, r() < .5 ? b.ground2 : shade(b.ground, (r() - .5) * .12), [(r() - .5) * 60, .085, (r() - .5) * 60], [1 + r() * 3, .02, 1 + r() * 3]);
    // ring promenade
    const pc = b.night ? '#5a5a7a' : mix(b.ground, '#e8dcc0', .65);
    for (const s of [-1, 1]) { B.add(PG.box, pc, [0, .1, s * RING], [RING * 2 + 3, .05, 3.2]); B.add(PG.box, pc, [s * RING, .1, 0], [3.2, .05, RING * 2 + 3]); }
    for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) B.add(PG.box, pc, [dx * 28.5, .1, dz * 28.5], dx ? [7.5, .05, 3.6] : [3.6, .05, 7.5]);
    // hedges along plot border
    for (const s of [-1, 1]) for (let k = -15; k <= 15; k++) { if (Math.abs(k) < 2) continue; B.add(PG.box, shade(b.ground, -.25), [k * 2, .4, s * 31.6], [1.9, .8, .7]); B.add(PG.box, shade(b.ground, -.25), [s * 31.6, .4, k * 2], [.7, .8, 1.9]); }
    // entrance arch
    const arch = new Batch();
    for (const sx of [-1, 1]) { arch.add(PG.cyl, b.accent, [sx * 3.4, 2.4, 32], [.35, 4.8, .35]); arch.add(PG.sph, mix(b.accent, '#ffffff', .4), [sx * 3.4, 5, 32], [.5, .5, .5]); }
    arch.add(PG.box, b.accent, [0, 5, 32], [8, .5, .5]);
    group.add(arch.build());
    const sign = signMesh([b.name.replace(/ \(.*\)/, '')], 8.5, 1.6, { size: 54, bg: mix(b.accent, '#000000', .2), border: mix(b.accent, '#ffffff', .4) });
    sign.position.set(0, 6.1, 32.3); group.add(sign);
    // enclosures
    const encs = st.facilities.filter(f => f.type === 'enclosure');
    const lay = cellLayout(Math.max(1, encs.length));
    const indoor = b.indoor, gap = 1.6;
    encs.forEach((f, i) => {
      const [u0, v0, u1, v1] = lay[i];
      const x0 = -INNER + u0 * INNER * 2 + (u0 > 0 ? gap / 2 : 0), x1 = -INNER + u1 * INNER * 2 - (u1 < 1 ? gap / 2 : 0);
      const z0 = -INNER + v0 * INNER * 2 + (v0 > 0 ? gap / 2 : 0), z1 = -INNER + v1 * INNER * 2 - (v1 < 1 ? gap / 2 : 0);
      const cell = { x0, z0, x1, z1, level: f.level, fid: f.id, h: 6, pond: null };
      P.cells.push(cell);
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
      B.add(PG.box, indoor === 'aquarium' ? '#e8d3a8' : shade(b.ground2, f.level * .02), [cx, .1, cz], [w - .4, .05, d - .4]);
      if (indoor === 'aquarium') {
        cell.h = 6;
        B.add(PG.box, '#e8d3a8', [cx, .3, cz], [w - .2, .6, d - .2]); for (let k = 0; k < 8; k++) B.add(PG.sph, '#f4e4c0', [lerp(x0 + 1, x1 - 1, r()), .6, lerp(z0 + 1, z1 - 1, r())], [1.2 + r(), .15, 1 + r()]);
        B.add(PG.box, '#9ad8ff', [cx, 3.3, cz], [w - .6, 5.6, d - .6], null, 'glass');
        
        for (const [ex, ez] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) B.add(PG.box, '#2a3a4a', [ex, 3.2, ez], [.4, 6.4, .4]);
        for (const s of [z0, z1]) B.add(PG.box, '#2a3a4a', [cx, 6.3, s], [w, .3, .3]);
        for (const s of [x0, x1]) B.add(PG.box, '#2a3a4a', [s, 6.3, cz], [.3, .3, d]);
        for (let k = 0; k < 3 + f.level * 2; k++) prop(B, ['coral', 'kelp', 'rock', 'shell'][k % 4], lerp(x0 + 1.5, x1 - 1.5, r()), lerp(z0 + 1.5, z1 - 1.5, r()), .8 + r() * .7, r() * 6, k + i * 31);
        cell.swimY = [.9, 5.3];
      } else {
        const style = b.fence;
        fence(B, style === 'net' || style === 'tank' ? 'wire' : style, f.level, x0, z0, x1, z1);
        if (indoor === 'greenhouse') { B.add(PG.box, '#e0f4ff', [cx, 2.6, cz], [w, 5.2, d], null, 'glass'); for (const [ex, ez] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) B.add(PG.box, '#7a8a7a', [ex, 2.6, ez], [.2, 5.2, .2]); cell.h = 5; }
        if (b.fence === 'net' || b.motion === 'fly') {
          const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#c8d8e8', wireframe: true, transparent: true, opacity: .35 }));
          dome.scale.set(w / 2, Math.min(12, Math.max(w, d) * .55), d / 2); dome.position.set(cx, 0, cz); group.add(dome); cell.h = dome.scale.y * .85;
        }
        // habitat features scale with level
        const hasSwimmer = st.animals.some(a => SPECIES[a.sp] && (SPECIES[a.sp].model && ['hippo', 'otter', 'beaver', 'capybara', 'crocodile', 'alligator', 'caiman', 'duck', 'mallard', 'goose', 'swan', 'penguin', 'seal', 'walrus', 'polarbear', 'manatee', 'flamingo', 'pelican'].includes(SPECIES[a.sp].model)));
        if ((b.pond || hasSwimmer) && Math.min(w, d) > 7) {
          const pr = Math.min(5.5, Math.min(w, d) * (.13 + f.level * .015)), px = cx + w * .2, pz = cz - d * .18;
          B.add(PG.cyl16, shade(b.ground2, -.2), [px, .1, pz], [pr + .6, .08, pr * .8 + .6]);
          B.add(PG.cyl16, b.water, [px, .14, pz], [pr, .06, pr * .8], null, 'water');
          if (b.props.includes('lilypad')) for (let k = 0; k < 3; k++) prop(B, 'lilypad', px + (r() - .5) * pr, pz + (r() - .5) * pr * .6, .9, 0, k);
          cell.pond = { x: px, z: pz, r: pr };
          for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; B.add(PG.sph, '#9a9890', [px + Math.cos(a) * (pr + .5), .2, pz + Math.sin(a) * (pr * .8 + .5)], [.5, .3, .4]); }
        }
        const nProps = 3 + f.level * 2 + Math.round(w * d / 70);
        for (let k = 0; k < nProps; k++) {
          const t = b.props[Math.floor(r() * b.props.length)];
          if (['igloo', 'barn', 'pagoda', 'cabin', 'chalet', 'volcano', 'lilypad'].includes(t)) continue;
          const px = lerp(x0 + 1.5, x1 - 1.5, r()), pz = lerp(z0 + 1.5, z1 - 1.5, r());
          if (cell.pond && Math.hypot(px - cell.pond.x, pz - cell.pond.z) < cell.pond.r + 1.5) continue;
          prop(B, t, px, pz, .7 + r() * .5, r() * 6, k * 17 + i);
        }
        for (let k = 0; k < Math.round(w * d / 25); k++) { const gx = lerp(x0 + .8, x1 - .8, r()), gz = lerp(z0 + .8, z1 - .8, r()); if (cell.pond && Math.hypot(gx - cell.pond.x, gz - cell.pond.z) < cell.pond.r + .5) continue; if (b.indoor !== 'aquarium') B.add(PG.cone, shade(b.ground, (r() - .3) * .3), [gx, 0, gz], [.1, .35 + r() * .4, .1], [(r() - .5) * .5, 0, (r() - .5) * .5]); if (r() < .25) B.add(PG.sph, '#9a9890', [gx + .4, .1, gz], [.25, .15, .2]); }
        if (f.level >= 2) { const hx = x0 + 2.2, hz = z0 + 2.2; B.add(PG.box, shade(b.accent, .1), [hx, .9, hz], [2.6, 1.8, 2]); B.add(PG.cone4, shade(b.accent, -.2), [hx, 1.8, hz], [2.2, 1, 1.8]); B.add(PG.box, '#2a2a2a', [hx, .7, hz + 1.01], [.9, 1.2, .05]); }
        B.add(PG.box, '#8a7a6a', [x1 - 1.5, .3, z1 - 1.2], [1.4, .35, .6]); B.add(PG.box, '#7ab040', [x1 - 1.5, .5, z1 - 1.2], [1.2, .1, .45]);
        if (f.level >= 4) for (const [ex, ez] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) { B.add(PG.cyl, '#3a3a3a', [ex, 2.5, ez], [.12, 5, .12]); B.add(PG.sph, '#fff3a0', [ex, 5.1, ez], [.35, .35, .35], null, 'glow'); }
      }
    });
    // biome landmarks in outer corners if no ride there
    const cornerUsed = st.facilities.filter(f => f.type === 'ride' || f.type === 'themed').length;
    const landmark = { farm: 'barn', arctic: 'igloo', china: 'pagoda', taiga: 'cabin', alpine: 'chalet', prehistoric: 'volcano' }[id];
    if (landmark && cornerUsed < 4) { const [lx, lz] = CORNERS[3]; prop(B, landmark, lx, lz, landmark === 'volcano' ? .9 : 1.1, Math.PI / 4, 3); if (landmark === 'volcano') P.volcanoes.push(new THREE.Vector3(lx, 5.5, lz)); }
    for (let k = 0; k < 26; k++) { const t = b.props[Math.floor(r() * b.props.length)]; if (['igloo', 'barn', 'pagoda', 'cabin', 'chalet', 'volcano', 'lilypad'].includes(t)) continue; const a = r() * Math.PI * 2; const side = Math.floor(r() * 4), off = (r() - .5) * 2 * 18; const [sx, sz] = [[off, 30.5], [off, -30.5], [30.5, off], [-30.5, off]][side]; if (Math.abs(off) < 4) continue; prop(B, t, sx, sz, .6, a, k + 99); }
    for (let k = 0; k < 40; k++) { const side = Math.floor(r() * 4), off = (r() - .5) * 2 * 30; const d0 = 30.6 + r() * .4; const [fx, fz] = [[off, d0], [off, -d0], [d0, off], [-d0, off]][side]; if (Math.abs(off) < 4) continue; B.add(PG.sph, ['#ff7aa8', '#ffd23a', '#ffffff', '#b07aff', '#ff8a3a'][k % 5], [fx, .9, fz], [.18, .14, .18]); }
    group.add(B.build());
    // facilities in slots
    const slotList = [];
    for (const s of SIDES) for (const o of SLOT_OFF) slotList.push({ x: s.x ?? o, z: s.z ?? o, rot: s.rot, side: s.n });
    // order slots: south & east first (closest to entrance)
    let si = 0, ci = 0;
    for (const f of st.facilities) {
      if (['enclosure', 'keeper', 'mascot'].includes(f.type)) continue;
      const corner = f.type === 'ride' || f.type === 'themed';
      let pos;
      if (corner) { if (ci >= 4) continue; pos = { x: CORNERS[ci][0], z: CORNERS[ci][1], rot: Math.atan2(-CORNERS[ci][0], -CORNERS[ci][1]) }; ci++; }
      else { if (si >= slotList.length) continue; pos = slotList[si++]; }
      const fac = buildFacility(f.type, f.level, b);
      fac.group.position.set(pos.x, 0, pos.z); fac.group.rotation.y = pos.rot;
      fac.group.traverse(o => { if (o.isMesh) o.userData.fac = { biome: id, fid: f.id }; });
      group.add(fac.group);
      if (fac.anim) P.anims.push(fac.anim);
      const front = new THREE.Vector3(0, 0, (fac.d || 4) / 2 + 1.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), pos.rot).add(new THREE.Vector3(pos.x, 0, pos.z));
      P.slots.push({ f, x: pos.x, z: pos.z, front, type: f.type, corner });
      if (f.type === 'food') P.foodSpots.push(front.clone().add(P.center));
      if (fac.group.userData.fountain || (f.type === 'seating' && f.level === 2)) P.fountains.push(new THREE.Vector3(pos.x, 1.7, pos.z).add(P.center));
    }
    const pick = new THREE.Mesh(new THREE.BoxGeometry(64, .3, 64), new THREE.MeshBasicMaterial({ visible: false })); pick.position.y = .1; pick.userData.plot = id; group.add(pick);
    P.pick = pick;
    this.scene.add(group);
    P.sig = 'open';
    // re-home animals to the new cells
    for (const ag of P.agents.values()) { ag.cell = null; this.assignCell(P, ag); ag.pos.set(lerp(ag.cell.x0 + 1, ag.cell.x1 - 1, Math.random()) + P.center.x, ag.pos.y, lerp(ag.cell.z0 + 1, ag.cell.z1 - 1, Math.random()) + P.center.z); ag.target = null; }
    this.syncAnimals(id);
    this.syncStaff(id);
    if (this.particleSystems) this.buildPlotParticles(id);
  },

  /* ---------- animal agents ---------- */
  assignCell(P, ag) {
    if (!P.cells.length) { ag.cell = { x0: -10, z0: -10, x1: 10, z1: 10, h: 6 }; return; }
    // keep each species together: hash species into a cell, weighted by cell size
    const idx = Math.abs(hashStr(ag.a.sp + (ag.a.v === 'common' ? '' : ''))) % P.cells.length;
    let best = P.cells[idx];
    const load = new Map(); for (const g of P.agents.values()) if (g.cell) load.set(g.cell, (load.get(g.cell) || 0) + 1);
    const capOf = c => (c.x1 - c.x0) * (c.z1 - c.z0) / 12;
    if ((load.get(best) || 0) > capOf(best)) best = P.cells.reduce((m, c) => ((load.get(c) || 0) / capOf(c) < (load.get(m) || 0) / capOf(m) ? c : m), P.cells[0]);
    ag.cell = best;
  },
  syncAnimals(id, newIds = new Set()) {
    const P = this.plots[id], st = S.biomes[id];
    if (!P || !st.unlocked || !P.cells) return;
    const shown = st.animals.slice(0, MAX_ANIMALS_SHOWN);
    const keep = new Set(shown.map(a => a.id));
    for (const [aid, ag] of P.agents) if (!keep.has(aid)) { this.poof(ag.mover.position, ag.rig.K.mainHex); this.dyn.remove(ag.mover); P.agents.delete(aid); }
    for (const a of shown) {
      let ag = P.agents.get(a.id);
      if (ag && (ag.v !== a.v)) { this.dyn.remove(ag.mover); P.agents.delete(a.id); ag = null; }
      if (!ag) {
        const rig = buildAnimal(a.sp, a.v, { sex: a.sex });
        ag = { id: a.id, a, rig, mover: rig.mover, v: a.v, pos: new THREE.Vector3(), heading: Math.random() * 6.28, target: null, timer: Math.random() * 2, biome: id, born: this.time, pop: newIds.has(a.id) ? 0 : 1 };
        this.assignCell(P, ag);
        const c = ag.cell;
        ag.pos.set(lerp(c.x0 + 1.5, c.x1 - 1.5, Math.random()) + P.center.x, 0, lerp(c.z0 + 1.5, c.z1 - 1.5, Math.random()) + P.center.z);
        if (newIds.has(a.id)) { ag.pos.y = 14; ag.drop = true; }
        rig.mover.position.copy(ag.pos);
        this.dyn.add(rig.mover);
        P.agents.set(a.id, ag);
        if (rig.sparkle) this.attachSparkle(ag);
        if (a.trick) ag.star = true;
      }
      ag.a = a;
      const stage = lifeStage(a), ageS = stage === 'Baby' ? .5 : stage === 'Juvenile' ? .75 : 1;
      const cw = Math.min(ag.cell.x1 - ag.cell.x0, ag.cell.z1 - ag.cell.z0);
      const aqua = BIOME_BY_ID[id].indoor === 'aquarium' || BIOME_BY_ID[id].indoor === 'greenhouse';
      ag.scale = Math.min(Math.max(ag.rig.size, aqua ? .9 : 0) * (aqua ? 1.6 : 1) * ageS, cw * .42);
    }
  },
  syncStaff(id) {
    const P = this.plots[id], st = S.biomes[id];
    for (const k of P.keepers) this.dyn.remove(k.h.mover);
    for (const m of P.mascots) this.dyn.remove(m.rig.mover);
    P.keepers = []; P.mascots = [];
    if (!st.unlocked || !P.cells.length) return;
    const ks = st.facilities.filter(f => f.type === 'keeper').slice(0, 4);
    ks.forEach((f, i) => {
      const h = buildHuman({ keeper: true, seed: f.id * 31, kid: false, item: 'bucket' });
      const cell = P.cells[i % P.cells.length];
      const pos = new THREE.Vector3((cell.x0 + cell.x1) / 2 + P.center.x, 0, (cell.z0 + cell.z1) / 2 + P.center.z);
      h.mover.position.copy(pos); this.dyn.add(h.mover);
      P.keepers.push({ h, cell, pos, target: null, timer: 1 + i, fid: f.id });
    });
    const ms = st.facilities.filter(f => f.type === 'mascot');
    const b = BIOME_BY_ID[id];
    ms.forEach((f, i) => {
      const rig = buildAnimal(b.starterKey, 'common', { sex: 'M' });
      const hat = new THREE.Group();
      const hb = new Batch();
      const hc = ['#e03a3a', '#2a2a2a', '#f2c230'][f.level];
      if (f.level === 2) { hb.add(PG.cyl, '#f2c230', [0, .1, 0], [.5, .25, .5]); for (let k = 0; k < 5; k++) hb.add(PG.cone, '#f2c230', [Math.cos(k * 1.256) * .42, .25, Math.sin(k * 1.256) * .42], [.1, .3, .1]); }
      else { hb.add(PG.cyl16, hc, [0, 0, 0], [.6, .05, .6]); hb.add(PG.cyl16, hc, [0, .3, 0], [.38, .6, .38]); hb.add(PG.cyl16, '#ffffff', [0, .1, 0], [.39, .1, .39]); }
      hat.add(hb.build());
      const anchor = rig.head || rig.body || rig.root;
      const hr = rig.p.headR || rig.p.bodyR || .15;
      hat.scale.setScalar(hr * 2.6);
      hat.position.y = hr * .75;
      anchor.add(hat);
      const bb = new THREE.Box3().setFromObject(rig.root), hgt = Math.max(.2, bb.max.y - bb.min.y);
      const m = { rig, s: (2.3 / hgt) * (1 + f.level * .12), sParam: Math.random() * 8 * RING, dir: i % 2 ? -1 : 1, timer: 2, fid: f.id };
      rig.mover.scale.setScalar(m.s);
      this.dyn.add(rig.mover);
      P.mascots.push(m);
    });
  },
  nightFactor() { const t = this.tod; return t > .78 || t < .22 ? 1 : t > .7 ? (t - .7) / .08 : t < .3 ? (.3 - t) / .08 : 0; },
  chooseBehavior(ag) {
    const rig = ag.rig, kind = rig.kind, p = rig.p, pers = p.personality || {};
    const list = BEHAVIORS[kind] || BEHAVIORS.quad;
    const night = this.nightFactor() > .5 && !BIOME_BY_ID[ag.biome].night;
    const happy = ag.a.happy;
    const w = {};
    for (const b of list) w[b] = 1;
    w.idle = 2.5; w.look = 1.4 + (pers.curious || 0);
    if (w.walk) w.walk = 5 + (1 - (pers.lazy || .5)) * 4;
    if (w.run) w.run = happy > 70 ? 1.2 + (pers.playful || 0) * 1.5 : .3;
    if (w.eat) w.eat = 2.2; if (w.peck) w.peck = 3;
    if (w.sleep) w.sleep = night ? 10 : (pers.lazy || 0) * 1.2;
    if (w.play) w.play = happy > 72 ? 1 + (pers.playful || 0) * 2.5 : .1;
    if (w.dance) w.dance = happy > 80 ? .8 : .05;
    if (w.call) w.call = .5 + (pers.vocal || 0) * 1.2;
    if (w.roll) w.roll = p.rollable ? .6 : 0;
    if (w.beg) w.beg = p.standUp ? .4 : .1;
    if (w.fly) w.fly = rig.flier ? 5 : 0;
    if (w.display) w.display = p.display ? 1.5 : 0;
    if (w.flap) w.flap = rig.wings.length ? .8 : 0;
    if (w.jump) w.jump = p.jumper || p.gait === 'hop' ? 1 : .3;
    if (w.coil) w.coil = 2; if (w.hang) w.hang = 2;
    if (w.stomp) w.stomp = p.stomp ? 1 : 0;
    if (happy < 40) { w.sit = (w.sit || 1) + 2; w.play = 0; w.dance = 0; }
    let tot = 0; for (const k in w) tot += w[k];
    let x = Math.random() * tot;
    for (const k in w) { x -= w[k]; if (x <= 0) return k; }
    return 'idle';
  },
  updateAgent(ag, P, dt) {
    const rig = ag.rig, p = rig.p, c = ag.cell, cx = P.center.x, cz = P.center.z;
    const escaped = S.escapes.some(e => e.id === ag.id);
    ag.escaped = escaped;
    const spd = (escaped ? 3.2 : 1) * 1.4 * (p.spd || 1) * Math.sqrt(Math.max(.4, ag.scale || 1));
    const swimOnly = rig.swimOnly || BIOME_BY_ID[ag.biome].motion === 'swim';
    const flyZone = rig.flier;
    ag.timer -= dt;
    if (ag.drop) { ag.pos.y = Math.max(0, ag.pos.y - dt * 18); if (ag.pos.y <= 0) { ag.drop = false; this.poof(ag.pos, '#ffffff'); } }
    if (ag.script) { ag.script(dt); }
    else if (escaped) {
      if (!ag.route || !ag.route.length) {
        const to = { x: LANE[1 + Math.floor(Math.random() * 3)] + (Math.random() - .5) * 60, z: LANE[1 + Math.floor(Math.random() * 3)] };
        if (Math.random() < .5) [to.x, to.z] = [to.z, to.x];
        ag.route = laneRoute({ x: ag.pos.x, z: ag.pos.z }, to);
        rig.flying = false;
      }
      const wp = ag.route[0];
      tmpV.set(wp.x - ag.pos.x, 0, wp.z - ag.pos.z);
      const d = tmpV.length();
      if (d < 1) ag.route.shift();
      else { tmpV.multiplyScalar(1 / d); ag.pos.addScaledVector(tmpV, spd * dt); ag.heading = angDamp(ag.heading, Math.atan2(tmpV.x, tmpV.z), 8, dt); }
      rig.state.mv = 1; setState(rig, 'run');
      ag.pos.y = damp1(ag.pos.y, 0, 5, dt);
    } else if (ag.target) {
      tmpV.subVectors(ag.target, ag.pos);
      const flat = Math.hypot(tmpV.x, tmpV.z), d = tmpV.length();
      const run = rig.state.name === 'run';
      const v = spd * (run ? 2.1 : 1) * (rig.flying ? 1.6 : 1);
      if (d < .25 + v * dt) { ag.target = null; ag.timer = .8 + Math.random() * 4; rig.state.mv = 0; if (rig.flying && ag.landAfter) { rig.flying = false; } setState(rig, this.chooseBehavior(ag) === 'fly' ? 'idle' : this.restBehavior(ag)); }
      else {
        tmpV.multiplyScalar(1 / d);
        ag.pos.addScaledVector(tmpV, v * dt);
        if (flat > .05) ag.heading = angDamp(ag.heading, Math.atan2(tmpV.x, tmpV.z), 5, dt);
        rig.state.mv = run ? 1 : .55;
      }
    } else if (ag.timer <= 0) {
      const b = this.chooseBehavior(ag);
      const loco = b === 'walk' || b === 'run' || b === 'fly' || b === 'glide' || (swimOnly && Math.random() < .7);
      if (loco) {
        const pad = Math.min(2, (c.x1 - c.x0) * .2) + (ag.scale || 1) * .3;
        let tx = lerp(c.x0 + pad, c.x1 - pad, Math.random()) + cx, tz = lerp(c.z0 + pad, c.z1 - pad, Math.random()) + cz, ty = 0;
        if (swimOnly) { const sy = c.swimY || [.5, 3]; ty = lerp(sy[0], sy[1], Math.random()); }
        else if (flyZone && (b === 'fly' || Math.random() < .35)) { rig.flying = true; ty = 1 + Math.random() * Math.max(1.5, (c.h || 5) - 1.5); ag.landAfter = Math.random() < .5; if (ag.landAfter) ty = 0; }
        else if (c.pond && rig.swimmer && Math.random() < .35) { const a = Math.random() * 6.28, rr = Math.random() * c.pond.r * .7; tx = c.pond.x + Math.cos(a) * rr + cx; tz = c.pond.z + Math.sin(a) * rr * .8 + cz; }
        ag.target = new THREE.Vector3(tx, ty, tz);
        setState(rig, swimOnly ? (Math.random() < .2 ? 'run' : 'walk') : b === 'run' ? 'run' : 'walk');
      } else {
        setState(rig, b);
        ag.timer = b === 'sleep' ? 8 + Math.random() * 12 : 2 + Math.random() * 5;
        if (b === 'play' && rig.kind === 'quad') ag.spin = (Math.random() < .5 ? -1 : 1) * 4;
      }
    }
    if (ag.spin && rig.state.name === 'play') ag.heading += ag.spin * dt; else ag.spin = 0;
    // stay inside cell (unless escaped)
    if (!escaped && !ag.script) {
      ag.pos.x = Math.min(Math.max(ag.pos.x, c.x0 + cx + .5), c.x1 + cx - .5);
      ag.pos.z = Math.min(Math.max(ag.pos.z, c.z0 + cz + .5), c.z1 + cz - .5);
      if (!ag.target && !rig.flying && !swimOnly && !ag.drop) ag.pos.y = damp1(ag.pos.y, 0, 4, dt);
    }
    rig.swimming = swimOnly || (c.pond && Math.hypot(ag.pos.x - cx - c.pond.x, ag.pos.z - cz - c.pond.z) < c.pond.r * .9 && rig.swimmer);
    const sink = rig.swimming && !swimOnly ? -.25 * (ag.scale || 1) : 0;
    ag.pop = Math.min(1, ag.pop + dt * 2.5);
    const popS = ag.pop < 1 ? Math.sin(ag.pop * Math.PI * .5) * (1 + Math.sin(ag.pop * Math.PI) * .25) : 1;
    rig.mover.position.set(ag.pos.x, ag.pos.y + sink + (ag.lift || 0), ag.pos.z);
    rig.mover.rotation.y = ag.heading;
    rig.mover.scale.setScalar(Math.max(escaped ? 1.2 : 0, ag.scale || 1) * popS);
  },
  restBehavior(ag) { const b = this.chooseBehavior(ag); return (b === 'walk' || b === 'run' || b === 'fly') ? 'idle' : b; },

  /* ---------- visitors ---------- */
  spawnVisitor(opts = {}) {
    const ids = BIOMES.filter(b => S.biomes[b.id].unlocked).map(b => b.id);
    if (!ids.length) return;
    const h = buildHuman({ seed: (Math.random() * 1e9) | 0, ...opts.human });
    const slot = this.parkSlots[Math.floor(Math.random() * this.parkSlots.length)] || [0, 190];
    const v = { h, pos: new THREE.Vector3(slot[0], 0, slot[1]), heading: Math.PI, queue: [], speed: 1.4 + Math.random() * .7, off: [(Math.random() - .5) * 7, (Math.random() - .5) * 7], kid: h.kid };
    h.mover.position.copy(v.pos); this.dyn.add(h.mover);
    // itinerary
    const weights = ids.map(id => 1 + Math.sqrt(S.biomes[id].stats.appeal || 1));
    const n = opts.plots || 1 + Math.floor(Math.random() * Math.min(4, ids.length));
    const plan = [];
    for (let i = 0; i < n; i++) { let t = weights.reduce((s, w) => s + w, 0) * Math.random(); for (let k = 0; k < ids.length; k++) { t -= weights[k]; if (t <= 0) { plan.push(ids[k]); break; } } }
    v.queue.push({ to: { x: v.pos.x * .3, z: GATE_Z + 6 } }, { to: { x: 0, z: GATE_Z - 3 } }, { to: { x: 0, z: LANE[4] } });
    let cur = { x: 0, z: LANE[4] };
    for (const id of opts.only ? [opts.only] : plan) {
      const P = this.plots[id], c = P.center;
      const doors = [{ x: c.x, z: c.z + HALF + 6, ix: 0, iz: 1 }, { x: c.x + HALF + 6, z: c.z, ix: 1, iz: 0 }, { x: c.x - HALF - 6, z: c.z, ix: -1, iz: 0 }, { x: c.x, z: c.z - HALF - 6, ix: 0, iz: -1 }];
      const door = doors.reduce((m, d) => Math.hypot(d.x - cur.x, d.z - cur.z) < Math.hypot(m.x - cur.x, m.z - cur.z) ? d : m, doors[0]);
      for (const w of laneRoute(cur, door)) v.queue.push({ to: w, lane: true });
      const entry = { x: c.x + door.ix * RING, z: c.z + door.iz * RING };
      v.queue.push({ to: entry });
      const stops = 1 + Math.floor(Math.random() * 3);
      let ringPos = { x: door.ix * RING, z: door.iz * RING };
      for (let s = 0; s < stops; s++) {
        const sp = ringPoint(Math.random() * 8 * RING);
        for (const w of ringRoute(ringPos, sp)) v.queue.push({ to: { x: w.x + c.x, z: w.z + c.z } });
        v.queue.push({ to: { x: sp.x * .96 + c.x, z: sp.z * .96 + c.z }, watch: { biome: id, look: c } });
        ringPos = sp;
        if (Math.random() < .45 && P.slots.length) {
          const sl = P.slots[Math.floor(Math.random() * P.slots.length)];
          if (!sl.corner || Math.random() < .6) {
            const rp = nearestRing(sl.x, sl.z);
            for (const w of ringRoute(ringPos, rp)) v.queue.push({ to: { x: w.x + c.x, z: w.z + c.z } });
            v.queue.push({ to: { x: sl.front.x + c.x, z: sl.front.z + c.z }, facility: sl, biome: id });
            v.queue.push({ to: { x: rp.x + c.x, z: rp.z + c.z } });
            ringPos = rp;
          }
        }
      }
      const exitRing = { x: door.ix * RING, z: door.iz * RING };
      for (const w of ringRoute(ringPos, exitRing)) v.queue.push({ to: { x: w.x + c.x, z: w.z + c.z } });
      v.queue.push({ to: { x: door.x, z: door.z } });
      cur = { x: door.x, z: door.z };
    }
    for (const w of laneRoute(cur, { x: 0, z: LANE[4] })) v.queue.push({ to: w, lane: true });
    v.queue.push({ to: { x: 0, z: GATE_Z - 3 } }, { to: { x: v.pos.x * .3, z: GATE_Z + 6 } }, { to: { x: v.pos.x, z: v.pos.z }, leave: true });
    if (opts.setup) opts.setup(v);
    this.visitors.push(v);
    return v;
  },
  updateVisitor(v, dt) {
    const h = v.h;
    if (v.script) { v.script(dt); }
    else if (v.wait > 0) {
      v.wait -= dt; h.state.mv = 0;
      if (v.hidden && v.wait <= 0) { h.mover.visible = true; v.hidden = false; }
      if (v.lookAt) v.heading = angDamp(v.heading, Math.atan2(v.lookAt.x - v.pos.x, v.lookAt.z - v.pos.z), 4, dt);
      if (v.actT !== undefined) { v.actT -= dt; if (v.actT <= 0) { h.state.name = pick(v.watchActs || ['idle']); h.state.t = 0; v.actT = 2 + Math.random() * 3; } }
    } else {
      const step = v.queue[0];
      if (!step) { v.done = true; return; }
      const tx = step.to.x + (step.lane ? v.off[0] : 0), tz = step.to.z + (step.lane ? v.off[1] : 0);
      tmpV.set(tx - v.pos.x, 0, tz - v.pos.z);
      const d = tmpV.length();
      const spd = v.speed * (v.panic ? 2.4 : 1) * (v.kid ? 1.15 : 1);
      if (d < .35 + spd * dt) {
        v.queue.shift();
        if (step.leave) { v.done = true; return; }
        if (step.watch) {
          v.wait = 5 + Math.random() * 9; v.lookAt = step.watch.look; v.actT = 0;
          v.watchActs = ['idle', 'photo', 'point', 'look', 'clap', 'cheer', 'idle', 'photo'];
          if (h.itemName === 'icecream' || h.itemName === 'popcorn') v.watchActs.push('eat', 'eat');
        } else if (step.facility) {
          const t = step.facility.type;
          v.wait = 3 + Math.random() * 4; v.lookAt = new THREE.Vector3(step.facility.x + this.plots[step.biome].center.x, 0, step.facility.z + this.plots[step.biome].center.z);
          v.actT = undefined;
          h.state.name = t === 'food' ? 'eat' : t === 'seating' ? 'sit' : t === 'ride' || t === 'themed' ? 'cheer' : 'idle'; h.state.t = 0;
          if (t === 'restroom') { h.mover.visible = false; v.hidden = true; }
        } else { h.state.name = v.panic ? 'flee' : 'walk'; }
      } else {
        tmpV.multiplyScalar(1 / d);
        v.pos.addScaledVector(tmpV, spd * dt);
        v.heading = angDamp(v.heading, Math.atan2(tmpV.x, tmpV.z), 8, dt);
        h.state.mv = v.panic ? 1 : .5;
        if (h.state.name !== 'walk' && h.state.name !== 'flee' && h.state.name !== 'run') { h.state.name = v.panic ? 'flee' : 'walk'; h.state.t = 0; }
      }
    }
    h.mover.position.copy(v.pos);
    h.mover.rotation.y = v.heading;
  },

  /* ---------- per-frame ---------- */
  update(dt, dayProgress) {
    if (!this.ready) return;
    this.time += dt;
    const t = this.time;
    for (const P of Object.values(this.plots)) if (P.dirty) { P.dirty = false; this.rebuildPlot(P.id); }
    this.tod = (this.tod + dt / 300) % 1;
    this.updateSky();
    // camera follow / walk / keyboard
    this.updateCamera(dt);
    const camPos = this.camera.position, tgt = this.controls.target;
    this.sun.position.set(tgt.x + this.sunDir.x * 160, this.sunDir.y * 160 + 10, tgt.z + this.sunDir.z * 160);
    this.sun.target.position.copy(tgt);
    // animals
    for (const P of Object.values(this.plots)) {
      if (!P.group) continue;
      const pd = Math.hypot(P.center.x - camPos.x, P.center.z - camPos.z);
      const near = pd < 200;
      P.group.visible = pd < 520;
      for (const fn of P.anims) if (near) fn(dt, t);
      for (const ag of P.agents.values()) {
        this.updateAgent(ag, P, dt);
        const d = camPos.distanceTo(ag.mover.position);
        const vis = d < 230 || ag.escaped;
        ag.mover.visible = vis;
        if (vis && (d < 110 || ag.escaped)) animateRig(ag.rig, dt, t);
        if (ag.sparkle) { ag.sparkle.visible = vis && d < 90; if (ag.sparkle.visible) ag.sparkle.rotation.y += dt; }
      }
      for (const k of P.keepers) this.updateKeeper(k, P, dt, camPos);
      for (const m of P.mascots) this.updateMascot(m, P, dt, camPos);
    }
    // visitors
    const want = Math.round(Math.min(130, Math.max(6, Math.sqrt(S.lastVisitors || 5) * 3.2)));
    this.spawnT = (this.spawnT || 0) - dt;
    if (this.visitors.length < want && this.spawnT <= 0) { this.spawnVisitor(); this.spawnT = .35; }
    for (let i = this.visitors.length - 1; i >= 0; i--) {
      const v = this.visitors[i];
      this.updateVisitor(v, dt);
      if (v.done) { this.dyn.remove(v.h.mover); this.visitors.splice(i, 1); continue; }
      const d = camPos.distanceTo(v.pos);
      v.h.mover.visible = !v.hidden && d < 200;
      if (v.h.mover.visible && d < 100) animateHuman(v.h, dt, t);
    }
    // escapee panic
    const esc = [];
    for (const P of Object.values(this.plots)) for (const ag of P.agents.values()) if (ag.escaped) esc.push(ag);
    if (esc.length) for (const v of this.visitors) { const close = esc.some(e => e.pos.distanceTo(v.pos) < 10); if (close && !v.script) { if (!v.panicT) { v.panicT = 3; v.h.state.name = 'panic'; v.h.state.t = 0; } } if (v.panicT) { v.panicT -= dt; v.wait = Math.max(v.wait || 0, .1); if (v.panicT <= 0) v.panicT = 0; } }
    this.updateEscapeMarkers(esc, dt);
    // monorail & bus
    if (this.monorail) { const u = (t * .02) % 1, p = this.monorail.curve.getPointAt(u), q = this.monorail.curve.getPointAt((u + .005) % 1); this.monorail.train.position.set(p.x, 0, p.z); this.monorail.train.lookAt(q.x, 0, q.z); }
    if (this.bus) { const u = (t * .03) % 2; this.bus.position.set(-14, 0, u < 1 ? 330 - u * 140 : 190 + (u - 1) * 140); this.bus.rotation.y = u < 1 ? Math.PI : 0; }
    this.clouds.position.x = (t * 2) % 300 - 150;
    this.updateParticles(dt, t);
    this.updateFx(dt, t);
    for (const tm of [...this.timers]) { tm.t -= dt; if (tm.t <= 0) { this.timers.splice(this.timers.indexOf(tm), 1); tm.fn(); } }
    this.renderer.render(this.scene, this.camera);
  },
  updateKeeper(k, P, dt, camPos) {
    const h = k.h, c = k.cell, cx = P.center.x, cz = P.center.z;
    if (k.script) k.script(dt);
    else {
      k.timer -= dt;
      if (k.target) {
        tmpV.subVectors(k.target, k.pos); const d = tmpV.length();
        if (d < .3) { k.target = null; k.timer = 2 + Math.random() * 4; h.state.mv = 0; h.state.name = Math.random() < .5 ? 'feed' : 'idle'; h.state.t = 0; if (h.state.name === 'feed') this.feedFrenzy(P, k); }
        else { tmpV.multiplyScalar(1 / d); k.pos.addScaledVector(tmpV, 1.6 * dt); h.mover.rotation.y = angDamp(h.mover.rotation.y, Math.atan2(tmpV.x, tmpV.z), 6, dt); h.state.mv = .5; h.state.name = 'walk'; }
      } else if (k.timer <= 0) k.target = new THREE.Vector3(lerp(c.x0 + 1, c.x1 - 1, Math.random()) + cx, 0, lerp(c.z0 + 1, c.z1 - 1, Math.random()) + cz);
    }
    h.mover.position.copy(k.pos);
    const d = camPos.distanceTo(k.pos); h.mover.visible = d < 200;
    if (d < 100) animateHuman(h, dt, this.time);
  },
  feedFrenzy(P, k) {
    for (const ag of P.agents.values()) if (ag.cell === k.cell && Math.random() < .7 && !ag.escaped && !ag.script) { const a = Math.random() * 6.28; ag.target = new THREE.Vector3(k.pos.x + Math.cos(a) * 1.5 * (ag.scale || 1), 0, k.pos.z + Math.sin(a) * 1.5 * (ag.scale || 1)); setState(ag.rig, 'walk'); ag.rig.flying = false; }
  },
  updateMascot(m, P, dt, camPos) {
    const rig = m.rig;
    m.timer -= dt;
    if (m.timer > 0 && m.pause) { rig.state.mv = 0; }
    else {
      m.pause = false;
      m.sParam = (m.sParam + m.dir * dt * 1.6 + 8 * RING) % (8 * RING);
      rig.state.mv = .5; if (rig.state.name !== 'walk') setState(rig, 'walk');
      if (m.timer <= -6) { m.timer = 3; m.pause = true; setState(rig, pick(['play', 'dance', 'wave', 'call', 'jump', 'look'])); }
    }
    const p = ringPoint(m.sParam), p2 = ringPoint((m.sParam + m.dir + 8 * RING) % (8 * RING));
    rig.mover.position.set(p.x * .99 + P.center.x, 0, p.z * .99 + P.center.z);
    rig.mover.rotation.y = m.pause ? Math.atan2(-p.x, -p.z) + Math.PI : Math.atan2(p2.x - p.x, p2.z - p.z);
    const d = camPos.distanceTo(rig.mover.position); rig.mover.visible = d < 220;
    if (d < 110) animateRig(rig, dt, this.time);
  },

  /* ---------- sky & lighting ---------- */
  updateSky() {
    const tod = this.tod;
    const a = (tod - .25) * Math.PI * 2; // sunrise at .25
    this.sunDir = new THREE.Vector3(Math.cos(a) * .7, Math.sin(a), Math.cos(a) * .3 + .45).normalize();
    const day = THREE.MathUtils.clamp(this.sunDir.y * 2.2 + .25, 0, 1);
    const w = S.weather, gloom = w === 'stormy' ? .55 : w === 'rainy' ? .35 : w === 'cloudy' ? .2 : w === 'snowy' ? .25 : 0;
    const top = new THREE.Color().lerpColors(new THREE.Color('#0b1236'), new THREE.Color('#4aa8e8'), day).lerp(new THREE.Color('#7a8494'), gloom);
    const hor = new THREE.Color().lerpColors(new THREE.Color('#2a2050'), new THREE.Color('#cfeaf8'), day).lerp(new THREE.Color('#a8b0b8'), gloom);
    const dusk = Math.max(0, 1 - Math.abs(this.sunDir.y) * 4) * (1 - gloom);
    hor.lerp(new THREE.Color('#ff9a5a'), dusk * .55);
    const pos = this.skyMesh.geometry.attributes.position, col = this.skyMesh.geometry.attributes.color, c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 900; c.lerpColors(hor, top, Math.min(1, Math.max(0, y * 1.6))); col.setXYZ(i, c.r, c.g, c.b); }
    col.needsUpdate = true;
    this.scene.fog.color.copy(hor);
    this.sun.intensity = 1.9 * day * (1 - gloom * .6) + .05;
    this.sun.color.set(dusk > .3 ? '#ffc890' : '#fff3dc');
    this.hemi.intensity = .35 + day * .65;
    this.hemi.color.set(day > .3 ? '#e4f4ff' : '#6a78c0');
    this.stars.material.opacity = Math.max(0, 1 - day * 2.5) * (1 - gloom);
    this.sunBall.position.copy(this.sunDir).multiplyScalar(700).add(this.controls.target); this.sunBall.visible = this.sunDir.y > -.05 && gloom < .5;
    this.moonBall.position.copy(this.sunDir).multiplyScalar(-700).add(this.controls.target); this.moonBall.visible = this.sunDir.y < .1;
    VC.glow.color.setScalar(.65 + (1 - day) * .5);
  },

  /* ---------- camera ---------- */
  updateCamera(dt) {
    const C = this.controls, cam = this.camera;
    if (this.flyTo) {
      const f = this.flyTo; f.t = Math.min(1, f.t + dt / f.dur); const e = f.t < .5 ? 2 * f.t * f.t : 1 - Math.pow(-2 * f.t + 2, 2) / 2;
      C.target.lerpVectors(f.fromT, f.toT, e); cam.position.lerpVectors(f.fromP, f.toP, e);
      if (f.t >= 1) this.flyTo = null;
    }
    if (this.followId) {
      const ag = this.findAgent(this.followId);
      if (ag) { tmpV.copy(ag.mover.position); tmpV.y += 1; const delta = tmpV2.subVectors(tmpV, C.target).multiplyScalar(1 - Math.exp(-4 * dt)); C.target.add(delta); cam.position.add(delta); }
      else this.followId = null;
    }
    // keyboard pan / walk
    const k = this.keys, mvx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0), mvz = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
    if (mvx || mvz) {
      const fwd = tmpV.subVectors(C.target, cam.position); fwd.y = 0; fwd.normalize();
      const right = tmpV2.set(-fwd.z, 0, fwd.x);
      const speed = this.walk ? (k.ShiftLeft ? 11 : 5.5) : Math.max(20, cam.position.distanceTo(C.target) * .9);
      const mv = new THREE.Vector3().addScaledVector(right, mvx).addScaledVector(fwd, -mvz).normalize().multiplyScalar(speed * dt);
      if (this.walk && this.avatar) {
        const np = this.avatar.pos.clone().add(mv);
        if (!this.blocked(np)) { this.avatar.pos.copy(np); }
        this.avatar.h.state.mv = k.ShiftLeft ? 1 : .5; this.avatar.h.state.name = k.ShiftLeft ? 'run' : 'walk';
        this.avatar.h.mover.rotation.y = angDamp(this.avatar.h.mover.rotation.y, Math.atan2(mv.x, mv.z), 10, dt);
      } else { C.target.add(mv); cam.position.add(mv); }
      this.followId = null;
    } else if (this.walk && this.avatar) { this.avatar.h.state.mv = 0; if (this.avatar.h.state.name !== 'idle') { this.avatar.h.state.name = 'idle'; } }
    if (this.walk && this.avatar) {
      const a = this.avatar;
      a.h.mover.position.copy(a.pos);
      animateHuman(a.h, dt, this.time);
      tmpV.copy(a.pos); tmpV.y += 1.6;
      const delta = tmpV2.subVectors(tmpV, C.target); C.target.add(delta); cam.position.add(delta);
    }
    C.target.x = THREE.MathUtils.clamp(C.target.x, -260, 260); C.target.z = THREE.MathUtils.clamp(C.target.z, -260, 300);
    C.update();
  },
  blocked(p) {
    if (Math.abs(p.x) > 162 || p.z < -162 || p.z > 240) return true;
    for (const P of Object.values(this.plots)) {
      if (!P.cells) continue;
      const lx = p.x - P.center.x, lz = p.z - P.center.z;
      if (Math.abs(lx) > 32 || Math.abs(lz) > 32) continue;
      if (!S.biomes[P.id].unlocked) return true;
      for (const c of P.cells) if (lx > c.x0 - .3 && lx < c.x1 + .3 && lz > c.z0 - .3 && lz < c.z1 + .3) return true;
      if ((Math.abs(lx) > 30.8 || Math.abs(lz) > 30.8) && Math.abs(lx) > 4 && Math.abs(lz) > 4) return true;
    }
    return false;
  },
  focus(x, z, dist = 70, dur = 1.2) {
    const C = this.controls, cam = this.camera;
    this.followId = null;
    const dir = tmpV.subVectors(cam.position, C.target); dir.y = 0; if (dir.lengthSq() < 1) dir.set(0, 0, 1); dir.normalize();
    const toT = new THREE.Vector3(x, 0, z), toP = new THREE.Vector3(x + dir.x * dist * .75, dist * .62, z + dir.z * dist * .75);
    this.flyTo = { t: 0, dur, fromT: C.target.clone(), toT, fromP: cam.position.clone(), toP };
  },
  focusBiome(id) { const c = this.plots[id].center; this.followId = null; this.focus(c.x, c.z + 6, 78); },
  focusAnimal(id) { const ag = this.findAgent(id); if (ag) { this.focus(ag.pos.x, ag.pos.z, 16 + ag.scale * 6, 1); this.followId = id; } },
  findAgent(id) { for (const P of Object.values(this.plots)) { const a = P.agents.get(id); if (a) return a; } return null; },
  setWalk(on) {
    this.walk = on;
    if (on) {
      if (!this.avatar) { const h = buildHuman({ seed: 7, kid: false, shirt: '#2e7d32', pants: '#2a2a2a', item: '' }); this.avatar = { h, pos: new THREE.Vector3(0, 0, LANE[4]) }; this.scene.add(h.mover); }
      const c = this.controls.target; this.avatar.pos.set(c.x, 0, c.z);
      if (this.blocked(this.avatar.pos)) { const near = laneSnap(this.avatar.pos); this.avatar.pos.set(near.x, 0, near.z); }
      this.avatar.h.mover.visible = true;
      this.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE; this.controls.enablePan = false;
      this.focus(this.avatar.pos.x, this.avatar.pos.z, 13, .8);
    } else {
      if (this.avatar) this.avatar.h.mover.visible = false;
      this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN; this.controls.enablePan = true;
    }
  },

  /* ---------- input & picking ---------- */
  bindInput() {
    const el = this.renderer.domElement;
    let down = null;
    el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      const hit = this.pick(e.clientX, e.clientY);
      if (hit) this.picks.forEach(fn => fn(hit));
    });
    el.addEventListener('pointermove', e => { this.mouse = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('keydown', e => { if (e.target.closest && e.target.closest('input,textarea,select')) return; this.keys[e.code] = true; });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
  },
  pick(cx, cy) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    // escaped animals are easy to grab: anything within ~45px on screen counts
    for (const P of Object.values(this.plots)) for (const ag of P.agents.values()) if (ag.escaped) {
      const v = ag.mover.position.clone(); v.y += ag.scale * .5; v.project(this.camera);
      const sx = rect.left + (v.x + 1) / 2 * rect.width, sy = rect.top + (1 - v.y) / 2 * rect.height;
      if (v.z < 1 && Math.hypot(sx - cx, sy - cy) < 75) return { type: 'escaped', id: ag.id, biome: ag.biome };
    }
    const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, this.camera);
    const objs = [];
    for (const P of Object.values(this.plots)) { for (const ag of P.agents.values()) if (ag.mover.visible) objs.push(ag.mover); }
    let hits = ray.intersectObjects(objs, true);
    for (const h of hits) { let o = h.object; while (o && !o.userData.rig) o = o.parent; if (o && o.userData.rig) { const ag = this.agentByRig(o.userData.rig); if (ag) return { type: ag.escaped ? 'escaped' : 'animal', id: ag.id, biome: ag.biome }; } }
    const facs = [];
    for (const P of Object.values(this.plots)) if (P.group && P.group.visible) facs.push(P.group);
    hits = ray.intersectObjects(facs, true);
    for (const h of hits) { if (h.object.userData.fac) return { type: 'facility', ...h.object.userData.fac }; if (h.object.userData.plot) return { type: 'plot', biome: h.object.userData.plot }; }
    return null;
  },
  agentByRig(rig) { for (const P of Object.values(this.plots)) for (const ag of P.agents.values()) if (ag.rig === rig) return ag; return null; },
  onPick(fn) { this.picks.push(fn); },

  /* ---------- weather & ambient particles ---------- */
  buildWeather() {
    const N = 3000, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { p[i * 3] = (Math.random() - .5) * 160; p[i * 3 + 1] = Math.random() * 70; p[i * 3 + 2] = (Math.random() - .5) * 160; }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    this.weatherPts = new THREE.Points(g, new THREE.PointsMaterial({ color: '#cfe6ff', size: .35, map: DOT, transparent: true, opacity: .8, depthWrite: false }));
    this.weatherPts.frustumCulled = false;
    this.scene.add(this.weatherPts);
    this.flash = 0;
  },
  buildParticles() {
    this.particleSystems = {};
    for (const b of BIOMES) this.buildPlotParticles(b.id);
    // fountains spray
    const N = 400, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    this.spray = { pts: new THREE.Points(g, new THREE.PointsMaterial({ color: '#bfe8ff', size: .32, map: DOT, transparent: true, opacity: .85, depthWrite: false })), vel: new Float32Array(N * 3), life: new Float32Array(N) };
    this.spray.pts.frustumCulled = false; this.scene.add(this.spray.pts);
  },
  buildPlotParticles(id) {
    const old = this.particleSystems[id]; if (old) this.scene.remove(old.pts);
    delete this.particleSystems[id];
    const b = BIOME_BY_ID[id], P = this.plots[id];
    if (!S.biomes[id].unlocked) return;
    const type = b.particles;
    const cfg = {
      leaves: ['#d88a2a', .5, 160, 'fall'], pollen: ['#fff59d', .25, 160, 'float'], sand: ['#f0d8a0', .2, 260, 'drift'], mist: ['#ffffff', 2.2, 70, 'mist'],
      snowlight: ['#ffffff', .3, 220, 'fall'], snow: ['#ffffff', .35, 420, 'fall'], sparkle: ['#ffe8ff', .35, 180, 'twinkle'], petals: ['#ffb0c8', .4, 220, 'fall'],
      dust: ['#e8c890', .3, 200, 'drift'], rain: ['#bfe0ff', .22, 420, 'rain'], feathers: ['#ffffff', .4, 90, 'fall'], bubbles: ['#d8f4ff', .35, 300, 'rise'],
      fireflies: ['#f8ff8a', .45, 220, 'float'], embers: ['#ffa040', .35, 200, 'rise'],
    }[type] || ['#ffffff', .3, 100, 'float'];
    const [color, size, N, mode] = cfg;
    const g = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), seed = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos[i * 3] = P.center.x + (Math.random() - .5) * 62; pos[i * 3 + 1] = Math.random() * (mode === 'rise' && b.indoor === 'aquarium' ? 6 : 14); pos[i * 3 + 2] = P.center.z + (Math.random() - .5) * 62; seed[i] = Math.random() * 100; }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color, size: size * 1.6, map: DOT, alphaTest: .05, transparent: true, opacity: mode === 'mist' ? .18 : .9, depthWrite: false, blending: mode === 'float' && type === 'fireflies' || type === 'embers' || type === 'sparkle' ? THREE.AdditiveBlending : THREE.NormalBlending });
    const pts = new THREE.Points(g, mat);
    this.scene.add(pts);
    this.particleSystems[id] = { pts, seed, mode, N, center: P.center, aquarium: b.indoor === 'aquarium' };
  },
  updateParticles(dt, t) {
    const camT = this.controls.target;
    for (const [id, ps] of Object.entries(this.particleSystems)) {
      const vis = Math.hypot(ps.center.x - camT.x, ps.center.z - camT.z) < 170;
      ps.pts.visible = vis; if (!vis) continue;
      const a = ps.pts.geometry.attributes.position, arr = a.array, cx = ps.center.x, cz = ps.center.z;
      for (let i = 0; i < ps.N; i++) {
        const s = ps.seed[i], k = i * 3;
        switch (ps.mode) {
          case 'fall': arr[k + 1] -= dt * (1 + (s % 1) * 1.2); arr[k] += Math.sin(t + s) * dt * .8; if (arr[k + 1] < 0) arr[k + 1] = 14; break;
          case 'rain': arr[k + 1] -= dt * 22; if (arr[k + 1] < 0) arr[k + 1] = 16; break;
          case 'rise': arr[k + 1] += dt * (.6 + (s % 1)); arr[k] += Math.sin(t * 2 + s) * dt * .3; if (arr[k + 1] > (ps.aquarium ? 6 : 15)) arr[k + 1] = 0; break;
          case 'float': arr[k] += Math.sin(t * .7 + s) * dt * .6; arr[k + 1] = 1 + (Math.sin(t * .5 + s) + 1) * 3; arr[k + 2] += Math.cos(t * .6 + s) * dt * .6; break;
          case 'drift': arr[k] += dt * (2 + (s % 1) * 2); arr[k + 1] = .3 + (s % 3) + Math.sin(t + s) * .3; if (arr[k] > cx + 31) arr[k] = cx - 31; break;
          case 'twinkle': arr[k + 1] = 1 + (s % 5) + Math.sin(t * 3 + s) * .2; break;
          case 'mist': arr[k] += dt * .6; arr[k + 1] = .4 + (s % 2); if (arr[k] > cx + 31) arr[k] = cx - 31; break;
        }
      }
      a.needsUpdate = true;
      if (ps.mode === 'twinkle' || ps.mode === 'float') ps.pts.material.opacity = .6 + Math.sin(t * 4) * .3;
    }
    // weather around camera
    const w = S.weather, wp = this.weatherPts, arr = wp.geometry.attributes.position.array;
    const raining = w === 'rainy' || w === 'stormy', snowing = w === 'snowy';
    wp.visible = raining || snowing;
    if (wp.visible) {
      wp.material.size = raining ? .3 : .6; wp.material.color.set(raining ? '#bcd8f0' : '#ffffff');
      wp.position.set(camT.x, 0, camT.z);
      for (let i = 0; i < arr.length; i += 3) { arr[i + 1] -= dt * (raining ? 38 : 4); arr[i] += raining ? -dt * 3 : Math.sin(t + i) * dt; if (arr[i + 1] < 0) arr[i + 1] = 70; }
      wp.geometry.attributes.position.needsUpdate = true;
    }
    if (w === 'stormy') { this.flash -= dt; if (this.flash < -6 - Math.random() * 6) { this.flash = .25; } this.hemi.intensity += this.flash > 0 ? 2.5 : 0; }
    // fountain spray
    const sp = this.spray, pa = sp.pts.geometry.attributes.position.array;
    const fts = [...this.fountains, ...Object.values(this.plots).flatMap(P => P.fountains || [])];
    for (let i = 0; i < sp.life.length; i++) {
      sp.life[i] -= dt;
      if (sp.life[i] <= 0 && fts.length) { const f = fts[i % fts.length]; pa[i * 3] = f.x; pa[i * 3 + 1] = f.y; pa[i * 3 + 2] = f.z; const a = Math.random() * 6.28; sp.vel[i * 3] = Math.cos(a) * 1.2; sp.vel[i * 3 + 1] = 4 + Math.random() * 2; sp.vel[i * 3 + 2] = Math.sin(a) * 1.2; sp.life[i] = 1.2 + Math.random() * .4; }
      sp.vel[i * 3 + 1] -= 9.8 * dt;
      pa[i * 3] += sp.vel[i * 3] * dt; pa[i * 3 + 1] += sp.vel[i * 3 + 1] * dt; pa[i * 3 + 2] += sp.vel[i * 3 + 2] * dt;
    }
    sp.pts.geometry.attributes.position.needsUpdate = true;
    // volcano smoke & poison clouds use fx puffs
    this.smokeT = (this.smokeT || 0) - dt;
    if (this.smokeT <= 0) {
      this.smokeT = .35;
      for (const P of Object.values(this.plots)) for (const v of P.volcanoes || []) this.puff(v.clone().add(P.center), '#7a6a6a', 3, 4);
      for (const e of S.effects) if (e.type === 'foodClosed' && this.plots[e.biome]) for (const fs of this.plots[e.biome].foodSpots) this.puff(fs.clone().setY(3), '#7aff5a', 1.4, 2.5);
    }
  },

  /* ---------- FX ---------- */
  sprite(tex, pos, scale, life, vel, opts = {}) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: opts.depthTest ?? true }));
    m.position.copy(pos); m.scale.set(scale * (opts.aspect || 1), scale, 1);
    this.scene.add(m);
    this.fx.push({ obj: m, life, max: life, vel: vel || new THREE.Vector3(0, 1.5, 0), grow: opts.grow || 0, spin: opts.spin || 0, grav: opts.grav || 0 });
    return m;
  },
  floatText(text, pos, color = '#2e7d32') {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96;
    const g = cv.getContext('2d'); g.font = '800 64px Fredoka, Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = '#ffffff'; g.strokeText(text, 128, 50); g.fillStyle = color; g.fillText(text, 128, 50);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    this.sprite(tex, pos, 3, 2.6, new THREE.Vector3(0, 2.2, 0), { aspect: 2.6, depthTest: false });
  },
  heartTex() {
    if (this._heart) return this._heart;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    g.fillStyle = '#ff4a7a'; g.beginPath(); g.moveTo(32, 56); g.bezierCurveTo(-8, 30, 12, 0, 32, 18); g.bezierCurveTo(52, 0, 72, 30, 32, 56); g.fill();
    g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(20, 20, 6, 0, 7); g.fill();
    this._heart = new THREE.CanvasTexture(cv); return this._heart;
  },
  dotTex(color) {
    this._dots = this._dots || {};
    if (this._dots[color]) return this._dots[color];
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.3, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return (this._dots[color] = new THREE.CanvasTexture(cv));
  },
  hearts(pos, n = 10) { for (let i = 0; i < n; i++) this.sprite(this.heartTex(), pos.clone().add(new THREE.Vector3((Math.random() - .5) * 1.5, 1 + Math.random(), (Math.random() - .5) * 1.5)), .6 + Math.random() * .4, 1.8 + Math.random(), new THREE.Vector3((Math.random() - .5), 1.6 + Math.random(), (Math.random() - .5))); },
  poof(pos, color = '#ffffff') { for (let i = 0; i < 14; i++) { const a = Math.random() * 6.28; this.sprite(this.dotTex(mix(color, '#ffffff', .5)), pos.clone().add(new THREE.Vector3(0, .6, 0)), .9, .8, new THREE.Vector3(Math.cos(a) * 3, Math.random() * 2, Math.sin(a) * 3), { grow: 2 }); } },
  puff(pos, color, size, life) { this.sprite(this.dotTex(color), pos.clone().add(new THREE.Vector3((Math.random() - .5), 0, (Math.random() - .5))), size, life, new THREE.Vector3((Math.random() - .5) * .5, 1.5, (Math.random() - .5) * .5), { grow: 1.5 }); },
  confetti(pos, n = 120) { const cols = ['#ff4a5a', '#ffd23a', '#3a8aff', '#7ad04a', '#c070ff', '#ff8a3a']; for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, sp = 4 + Math.random() * 8; this.sprite(this.dotTex(cols[i % cols.length]), pos.clone().add(new THREE.Vector3(0, 6, 0)), .5, 2.5 + Math.random(), new THREE.Vector3(Math.cos(a) * sp, 6 + Math.random() * 8, Math.sin(a) * sp), { grav: 9 }); } },
  sparkleBurst(pos, color = '#ffe680', n = 24) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28; this.sprite(this.dotTex(color), pos.clone().add(new THREE.Vector3(0, 1, 0)), .5, 1.2, new THREE.Vector3(Math.cos(a) * 3, 1 + Math.random() * 3, Math.sin(a) * 3)); } },
  attachSparkle(ag) {
    const N = 16, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const a = i / N * 6.28; p[i * 3] = Math.cos(a) * .9; p[i * 3 + 1] = .3 + (i % 4) * .35; p[i * 3 + 2] = Math.sin(a) * .9; }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: ag.rig.sparkle, size: .3, map: DOT, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
    ag.rig.root.add(pts); ag.sparkle = pts;
  },
  updateFx(dt, t) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i]; f.life -= dt;
      if (f.life <= 0) { this.scene.remove(f.obj); if (f.obj.material) { f.obj.material.dispose(); } this.fx.splice(i, 1); continue; }
      f.vel.y -= f.grav * dt;
      f.obj.position.addScaledVector(f.vel, dt);
      if (f.grow) f.obj.scale.multiplyScalar(1 + f.grow * dt);
      if (f.obj.material) f.obj.material.opacity = Math.min(1, f.life / f.max * 2);
      if (f.update) f.update(dt, f);
    }
  },
  updateEscapeMarkers(esc, dt) {
    this.markers = this.markers || new Map();
    const alive = new Set(esc.map(e => e.id));
    for (const [id, m] of this.markers) if (!alive.has(id)) { this.scene.remove(m); this.markers.delete(id); }
    for (const e of esc) {
      let m = this.markers.get(e.id);
      if (!m) {
        m = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, .12, 6, 24), new THREE.MeshBasicMaterial({ color: '#ff2a2a' })); ring.rotation.x = Math.PI / 2; m.add(ring);
        const bang = signMesh(['!'], 1.2, 1.6, { bg: '#ff2a2a', border: '#ffffff', size: 110, w: 128, h: 170 }); bang.position.y = 4; m.add(bang);
        m.userData.ring = ring; this.scene.add(m); this.markers.set(e.id, m);
      }
      m.position.set(e.pos.x, 0, e.pos.z);
      m.children[1].position.y = 3 + e.scale * 2 + Math.sin(this.time * 6) * .3;
      m.userData.ring.scale.setScalar((1 + Math.sin(this.time * 8) * .15) * Math.max(1, e.scale));
    }
  },

  /* ---------- day-end & events ---------- */
  onDay(report) {
    for (const [id, r] of Object.entries(report.biomes)) {
      const P = this.plots[id]; if (!P) continue;
      const net = r.rev - r.exp;
      this.floatText((net >= 0 ? '+$' : '-$') + fmt(Math.abs(net)), P.center.clone().add(new THREE.Vector3(0, 9, 30)), net >= 0 ? '#1b7a2a' : '#c62828');
    }
    for (const b of report.births) { const P = this.plots[b.biome]; this.syncAnimals(b.biome, new Set([b.a.id])); const ag = P.agents.get(b.a.id); if (ag) { ag.pop = 0; this.hearts(ag.pos, 8); } }
    for (const id of BIOMES.map(b => b.id)) if (S.biomes[id].unlocked) this.syncAnimals(id);
    for (const id of report.recaptured || []) { const ag = this.findAgent(id); if (ag) this.returnHome(ag); }
    this.syncCars();
    if (this.ghost) { this.ghost.visible = !!S.effects.find(e => e.type === 'ghost'); }
    if (S.meteor && !this.meteorRock) this.placeMeteor(false);
  },
  returnHome(ag) {
    const P = this.plots[ag.biome];
    this.poof(ag.pos, '#ffffff');
    const c = ag.cell; ag.pos.set((c.x0 + c.x1) / 2 + P.center.x, 0, (c.z0 + c.z1) / 2 + P.center.z); ag.route = null; ag.target = null;
    this.poof(ag.pos, '#ffffff'); ag.pop = 0;
  },
  capture(id) {
    const ag = this.findAgent(id); if (!ag) return;
    this.sparkleBurst(ag.pos, '#7aff8a', 30);
    this.returnHome(ag);
  },
  after(t, fn) { this.timers.push({ t, fn }); },
  playRare(r) {
    const P = r.biome ? this.plots[r.biome] : null;
    const at = P ? P.center.clone() : new THREE.Vector3(0, 0, 0);
    const ag = r.animalId ? this.findAgent(r.animalId) : null;
    switch (r.type) {
      case 'escape': if (ag) { ag.route = null; this.poof(ag.pos, '#ff4a4a'); this.focus(ag.pos.x, ag.pos.z, 30); this.followId = r.animalId; } break;
      case 'eaten': {
        const pred = this.findAgent(r.predId);
        if (!pred || !P) break;
        const prey = buildAnimal(r.preySp, r.preyV || 'common', {});
        const c = pred.cell;
        const pp = new THREE.Vector3(lerp(c.x0 + 2, c.x1 - 2, Math.random()) + P.center.x, 0, lerp(c.z0 + 2, c.z1 - 2, Math.random()) + P.center.z);
        prey.mover.position.copy(pp); prey.mover.scale.setScalar(Math.min(prey.size, 2)); this.dyn.add(prey.mover);
        setState(prey.rig || prey, 'idle');
        let tt = 0;
        pred.script = dt => {
          tt += dt;
          animateRig(prey, dt, this.time);
          tmpV.subVectors(pp, pred.pos); const d = Math.hypot(tmpV.x, tmpV.z);
          if (d > 1 + pred.scale * .5 && tt < 8) { tmpV.y = 0; tmpV.normalize(); pred.pos.addScaledVector(tmpV, 7 * dt); pred.heading = angDamp(pred.heading, Math.atan2(tmpV.x, tmpV.z), 10, dt); pred.rig.state.mv = 1; setState(pred.rig, 'run'); prey.state.mv = .8; setState(prey, 'run'); prey.mover.position.x += Math.sin(tt * 3) * dt * 2; }
          else if (!pred.chomped) { pred.chomped = true; pred.rig.state.mv = 0; setState(pred.rig, 'call'); this.poof(pp, prey.K.mainHex); this.dyn.remove(prey.mover); this.after(2.5, () => { pred.script = null; pred.chomped = false; setState(pred.rig, 'groom'); }); }
        };
        this.focus(pp.x, pp.z, 26);
        break;
      }
      case 'humanFall': {
        if (!P || !P.cells.length) break;
        const c = P.cells[0];
        const h = buildHuman({ seed: 99, item: 'camera' });
        const ip = new THREE.Vector3((c.x0 + c.x1) / 2 + P.center.x, 0, c.z1 - 2 + P.center.z);
        h.mover.position.copy(ip); this.dyn.add(h.mover);
        h.state.name = 'panic';
        const keeper = buildHuman({ keeper: true, seed: 5, item: '' });
        const kp = new THREE.Vector3(P.center.x, 0, P.center.z + RING); keeper.mover.position.copy(kp); this.dyn.add(keeper.mover);
        for (const a of P.agents.values()) if (a.cell === c && !a.escaped) { a.target = ip.clone().add(new THREE.Vector3((Math.random() - .5) * 4, 0, -2 - Math.random() * 2)); setState(a.rig, 'walk'); }
        let tt = 0, phase = 0;
        const obj = { h, keeper };
        const step = dt => {
          tt += dt; animateHuman(h, dt, this.time); animateHuman(keeper, dt, this.time);
          const goal = phase === 0 ? ip : new THREE.Vector3(P.center.x, 0, P.center.z + RING);
          tmpV.subVectors(goal, keeper.mover.position); const d = tmpV.length();
          if (d > .8) { tmpV.normalize(); keeper.mover.position.addScaledVector(tmpV, 4 * dt); keeper.mover.rotation.y = Math.atan2(tmpV.x, tmpV.z); keeper.state.mv = 1; keeper.state.name = 'run'; if (phase === 1) { h.mover.position.copy(keeper.mover.position).add(new THREE.Vector3(.8, 0, 0)); h.mover.rotation.y = keeper.mover.rotation.y; h.state.mv = 1; h.state.name = 'run'; } }
          else if (phase === 0 && tt > 4) { phase = 1; }
          else if (phase === 1) { this.dyn.remove(h.mover); this.dyn.remove(keeper.mover); return true; }
          return tt > 40;
        };
        this.runScript(step);
        this.focus(ip.x, ip.z, 30);
        break;
      }
      case 'keeperQuit': {
        if (!P) break;
        const h = buildHuman({ keeper: true, seed: r.facId * 31, item: 'box' });
        h.mover.position.set(P.center.x, 0, P.center.z + RING); this.dyn.add(h.mover);
        const route = [{ x: P.center.x, z: P.center.z + HALF + 6 }, ...laneRoute({ x: P.center.x, z: P.center.z + HALF + 6 }, { x: 0, z: LANE[4] }), { x: 0, z: GATE_Z + 10 }];
        this.runScript(dt => {
          animateHuman(h, dt, this.time);
          const w = route[0]; if (!w) { this.dyn.remove(h.mover); return true; }
          tmpV.set(w.x - h.mover.position.x, 0, w.z - h.mover.position.z); const d = tmpV.length();
          if (d < .5) route.shift(); else { tmpV.normalize(); h.mover.position.addScaledVector(tmpV, 1.6 * dt); h.mover.rotation.y = Math.atan2(tmpV.x, tmpV.z); h.state.mv = .4; h.state.name = 'carry'; }
          return false;
        });
        this.focus(P.center.x, P.center.z + RING, 30);
        break;
      }
      case 'megaLitter': case 'rainbowBaby': case 'egg': {
        if (!P) break;
        this.syncAnimals(r.biome, new Set(r.babies || []));
        const mom = ag || this.findAgent((r.babies || [])[0]);
        const pos = mom ? mom.pos.clone() : at;
        if (r.type === 'egg') { const egg = buildEgg(); egg.position.copy(pos); this.scene.add(egg); this.after(2.5, () => { this.scene.remove(egg); this.sparkleBurst(pos, '#c080ff', 50); }); }
        for (const id of r.babies || []) { const b = this.findAgent(id); if (b) { b.pos.copy(pos).add(new THREE.Vector3((Math.random() - .5) * 3, 0, (Math.random() - .5) * 3)); b.pop = 0; } }
        this.hearts(pos, 24); this.confetti(pos, 80);
        if (r.type === 'rainbowBaby') { const arc = new THREE.Mesh(new THREE.TorusGeometry(14, .8, 8, 40, Math.PI), new THREE.MeshBasicMaterial({ color: '#ff70d0', transparent: true, opacity: .5 })); arc.position.copy(at); this.scene.add(arc); this.fx.push({ obj: arc, life: 8, max: 8, vel: new THREE.Vector3(), grow: 0, grav: 0, update: (dt2) => arc.material.color.offsetHSL(dt2 * .2, 0, 0) }); }
        this.focus(pos.x, pos.z, 28);
        break;
      }
      case 'lightning': {
        const pos = at.clone().add(new THREE.Vector3((Math.random() - .5) * 40, 0, 28));
        const bolt = buildBolt(); bolt.position.copy(pos); this.scene.add(bolt);
        this.fx.push({ obj: bolt, life: .6, max: .6, vel: new THREE.Vector3(), grow: 0, grav: 0 });
        this.flash = .4;
        for (let i = 0; i < 30; i++) this.after(i * .25, () => { this.puff(pos, i % 2 ? '#ff7a1a' : '#5a5a5a', 2, 2.5); });
        this.focus(pos.x, pos.z, 45);
        break;
      }
      case 'ufo': {
        if (!ag) break;
        const id = r.animalId, bid = ag.biome;
        const ufo = buildUFO(); ufo.position.set(ag.pos.x, 60, ag.pos.z); this.scene.add(ufo);
        let tt = 0, synced = false;
        this.runScript(dt => {
          tt += dt;
          const a = this.findAgent(id);
          if (a && tt < 9) { a.target = null; a.timer = 2; a.rig.state.mv = 0; ufo.position.x = a.pos.x; ufo.position.z = a.pos.z; }
          if (tt < 3) ufo.position.y = lerp(60, 14, tt / 3);
          else if (tt < 7) { if (a) { a.lift = Math.min(10, (tt - 3) * 3); a.heading += dt * 4; } }
          else if (tt < 9) { if (a) a.lift = Math.max(0, 10 - (tt - 7) * 6); if (tt > 8 && !synced) { synced = true; this.syncAnimals(bid); const b = this.findAgent(id); if (b) { b.lift = 0; this.sparkleBurst(b.pos, '#ffe680', 60); } } }
          else { if (a) a.lift = 0; ufo.position.y += dt * 30; ufo.position.x += dt * 20; }
          ufo.rotation.y += dt * 3;
          ufo.userData.beam.visible = tt > 3 && tt < 9;
          if (tt > 13) { this.scene.remove(ufo); return true; }
          return false;
        });
        this.focus(ag.pos.x, ag.pos.z, 34);
        break;
      }
      case 'meteor': this.placeMeteor(true); break;
      case 'royal': {
        const car = buildCarriage(); car.position.set(0, 0, 230); this.scene.add(car);
        const route = [{ x: 0, z: GATE_Z }, { x: 0, z: LANE[2] + 8 }, { x: 0, z: GATE_Z }, { x: 0, z: 240 }];
        this.runScript(dt => { const w = route[0]; if (!w) { this.scene.remove(car); return true; } tmpV.set(w.x - car.position.x, 0, w.z - car.position.z); const d = tmpV.length(); if (d < 1) { route.shift(); if (route.length === 2) this.confetti(car.position, 150); } else { tmpV.normalize(); car.position.addScaledVector(tmpV, 9 * dt); car.rotation.y = Math.atan2(-tmpV.x, -tmpV.z); } return false; });
        this.focus(0, GATE_Z - 20, 70);
        break;
      }
      case 'ghost': {
        if (!this.ghost) { this.ghost = buildGhost(); this.scene.add(this.ghost); }
        this.ghost.visible = true; const c = this.plots.nocturnal.center; this.ghost.userData.c = c;
        this.runScript(dt => { if (!this.ghost.visible) return true; const tt = this.time; this.ghost.position.set(c.x + Math.sin(tt * .3) * 18, 2 + Math.sin(tt * 1.3), c.z + Math.cos(tt * .37) * 18); this.ghost.rotation.y = tt; return false; });
        this.focus(c.x, c.z, 50);
        break;
      }
      case 'fight': {
        const other = this.findAgent(r.otherId);
        if (!ag) break;
        const mid = other ? ag.pos.clone().lerp(other.pos, .5) : ag.pos.clone();
        for (const a of [ag, other]) if (a) { a.target = mid.clone().add(new THREE.Vector3((Math.random() - .5) * 2, 0, (Math.random() - .5) * 2)); setState(a.rig, 'run'); }
        for (let i = 0; i < 20; i++) this.after(1.5 + i * .15, () => this.puff(mid, '#c8b8a0', 2.4, 1.2));
        this.after(5, () => { for (const a of [ag, other]) if (a) setState(a.rig, 'sit'); });
        this.focus(mid.x, mid.z, 26);
        break;
      }
      case 'proposal': {
        if (!P) break;
        const sp = ringPoint(Math.random() * 8 * RING), pos = new THREE.Vector3(sp.x + P.center.x, 0, sp.z + P.center.z);
        const a = buildHuman({ seed: 11, item: '' }), b = buildHuman({ seed: 12, item: '' });
        a.mover.position.copy(pos); b.mover.position.copy(pos).add(new THREE.Vector3(1.2, 0, 0));
        a.mover.rotation.y = Math.PI / 2; b.mover.rotation.y = -Math.PI / 2;
        this.dyn.add(a.mover, b.mover); a.state.name = 'kneel'; b.state.name = 'idle';
        let tt = 0;
        this.runScript(dt => { tt += dt; animateHuman(a, dt, this.time); animateHuman(b, dt, this.time); if (tt > 3 && b.state.name === 'idle') { b.state.name = 'cheer'; a.state.name = 'cheer'; this.hearts(pos, 30); } if (tt > 12) { this.dyn.remove(a.mover, b.mover); return true; } return false; });
        this.focus(pos.x, pos.z, 18);
        break;
      }
      case 'pickpocket': {
        const thief = buildHuman({ seed: 66, shirt: '#1a1a1a', pants: '#1a1a1a', item: 'bag' });
        thief.mover.position.set(4, 0, GATE_Z - 2); this.dyn.add(thief.mover);
        const k = buildHuman({ keeper: true, seed: 3, item: '' }); k.mover.position.set(-2, 0, GATE_Z - 6); this.dyn.add(k.mover);
        let tt = 0;
        this.runScript(dt => { tt += dt; animateHuman(thief, dt, this.time); animateHuman(k, dt, this.time); thief.state.mv = 1; thief.state.name = 'run'; k.state.mv = 1; k.state.name = 'run'; thief.mover.position.z += dt * 7; thief.mover.position.x += Math.sin(tt * 2) * dt * 4; thief.mover.rotation.y = 0; k.mover.position.lerp(thief.mover.position, dt * 1.2); k.mover.lookAt(thief.mover.position); if (tt > 9) { this.dyn.remove(thief.mover, k.mover); return true; } return false; });
        this.focus(0, GATE_Z + 10, 40);
        break;
      }
      case 'strike': {
        const hs = [];
        for (let i = 0; i < 5; i++) { const h = buildHuman({ keeper: true, seed: 200 + i, item: 'sign' }); h.mover.position.set(-8 + i * 4, 0, GATE_Z - 8); this.dyn.add(h.mover); h.state.name = 'sign'; hs.push(h); }
        let tt = 0;
        this.runScript(dt => { tt += dt; hs.forEach((h, i) => { animateHuman(h, dt, this.time); h.mover.position.x = -8 + i * 4 + Math.sin(tt * .5 + i) * 2; }); if (!S.effects.find(e => e.type === 'strike') && tt > 20) { hs.forEach(h => this.dyn.remove(h.mover)); return true; } return tt > 200; });
        this.focus(0, GATE_Z - 10, 40);
        break;
      }
      case 'trick': case 'viral': {
        if (!ag) break;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(3, 16, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#fff7c0', transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false }));
        cone.position.copy(ag.pos).add(new THREE.Vector3(0, 8, 0)); this.scene.add(cone);
        this.fx.push({ obj: cone, life: 9, max: 9, vel: new THREE.Vector3(), grow: 0, grav: 0, update: () => cone.position.set(ag.pos.x, 8, ag.pos.z) });
        setState(ag.rig, 'play'); ag.timer = 6; ag.target = null;
        for (let i = 0; i < 10; i++) this.after(i * .7, () => this.sparkleBurst(ag.pos, r.type === 'viral' ? '#9ad8ff' : '#ffe680', 16));
        if (r.type === 'viral') for (let i = 0; i < 8; i++) this.spawnVisitor({ only: ag.biome, plots: 1 });
        this.focus(ag.pos.x, ag.pos.z, 22);
        break;
      }
      case 'lottery': this.confetti(new THREE.Vector3(0, 0, GATE_Z), 220); this.focus(0, GATE_Z - 10, 50); break;
      case 'poison': if (P) this.focus(P.center.x, P.center.z + 24, 45); break;
      default: if (P) this.focusBiome(r.biome);
    }
  },
  placeMeteor(animate) {
    const pos = new THREE.Vector3(14, 0, 14);
    const place = () => { if (!this.meteorRock) { this.meteorRock = buildMeteorRock(); this.meteorRock.position.copy(pos); this.scene.add(this.meteorRock); } };
    if (!animate) return place();
    const ball = new THREE.Mesh(GEO.sph, new THREE.MeshBasicMaterial({ color: '#ffb040' })); ball.scale.setScalar(2.4); ball.position.set(pos.x - 160, 200, pos.z - 120); this.scene.add(ball);
    this.focus(pos.x, pos.z, 70);
    let tt = 0;
    this.runScript(dt => { tt += dt; ball.position.lerp(pos, Math.min(1, dt * 1.5)); this.puff(ball.position, '#ff7a1a', 4, 1.2); if (ball.position.distanceTo(pos) < 3 || tt > 6) { this.scene.remove(ball); place(); this.flash = .5; this.confetti(pos, 60); for (let i = 0; i < 20; i++) this.puff(pos, '#6a5a50', 5, 3); return true; } return false; });
  },
  runScript(fn) { const s = { fn }; const tick = dt => { if (fn(dt)) this.scripts.splice(this.scripts.indexOf(s), 1); }; s.tick = tick; this.scripts = this.scripts || []; this.scripts.push(s); },

  /* ---------- minimap ---------- */
  drawMinimap(cv) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, sc = W / 360;
    const X = x => (x + 180) * sc, Z = z => (z + 170) * sc;
    g.fillStyle = '#5f9a4a'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#d8c8a8';
    for (const L of LANE) { g.fillRect(X(-158), Z(L) - 2, 316 * sc, 4); g.fillRect(X(L) - 2, Z(-158), 4, 316 * sc); }
    for (const b of BIOMES) {
      const c = this.plots[b.id].center, st = S.biomes[b.id];
      g.fillStyle = st.unlocked ? b.ground : '#9a8060';
      g.fillRect(X(c.x - 31), Z(c.z - 31), 62 * sc, 62 * sc);
      if (!st.unlocked) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(X(c.x - 31), Z(c.z - 31), 62 * sc, 62 * sc); }
    }
    g.fillStyle = '#7a7a82'; g.fillRect(X(-40), Z(GATE_Z + 10), 80 * sc, 40 * sc);
    g.fillStyle = 'rgba(255,255,255,.85)';
    for (const v of this.visitors) g.fillRect(X(v.pos.x) - .5, Z(v.pos.z) - .5, 1.5, 1.5);
    for (const P of Object.values(this.plots)) for (const ag of P.agents.values()) if (ag.escaped) { g.fillStyle = '#ff2a2a'; g.beginPath(); g.arc(X(ag.pos.x), Z(ag.pos.z), 4, 0, 7); g.fill(); }
    // camera
    const t = this.controls.target, cam = this.camera.position;
    const ang = Math.atan2(t.x - cam.x, t.z - cam.z);
    g.save(); g.translate(X(t.x), Z(t.z)); g.rotate(-ang + Math.PI);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-14, -26); g.lineTo(14, -26); g.fill();
    g.fillStyle = '#ffffff'; g.strokeStyle = '#2e7d32'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); g.stroke(); g.restore();
  },
  minimapClick(fx, fz) { const x = fx * 360 - 180, z = fz * 360 - 170; this.followId = null; this.focus(x, z, Math.min(120, this.camera.position.distanceTo(this.controls.target))); },
  stats() { let animals = 0; for (const P of Object.values(this.plots)) animals += P.agents.size; return { animals, visitors: this.visitors.length, calls: this.renderer.info.render.calls, tris: this.renderer.info.render.triangles }; },
};
// run scripted event animations in the update loop
const _upd = World.update;
World.update = function (dt, p) { if (this.scripts) for (const s of [...this.scripts]) s.tick(dt); return _upd.call(this, dt, p); };

/* ---------- path helpers ---------- */
function damp1(a, b, k, dt) { return a + (b - a) * (1 - Math.exp(-k * dt)); }
function nearIdx(v) { let best = 0; for (let i = 1; i < LANE.length; i++) if (Math.abs(LANE[i] - v) < Math.abs(LANE[best] - v)) best = i; return best; }
function laneSnap(p) { const ix = nearIdx(p.x), iz = nearIdx(p.z); return Math.abs(LANE[ix] - p.x) < Math.abs(LANE[iz] - p.z) ? { x: LANE[ix], z: p.z } : { x: p.x, z: LANE[iz] }; }
function toIntersection(p, toward) {
  const onH = LANE.some(z => Math.abs(p.z - z) < 1.5), onV = LANE.some(x => Math.abs(p.x - x) < 1.5);
  if (onH && onV) return { x: LANE[nearIdx(p.x)], z: LANE[nearIdx(p.z)] };
  if (onH) { let lo = 0; for (let i = 0; i < 5; i++) if (LANE[i] <= p.x) lo = i; const hi = Math.min(4, lo + 1); const cand = [LANE[lo], LANE[hi]]; const x = Math.abs(cand[0] - p.x) + Math.abs(cand[0] - toward.x) < Math.abs(cand[1] - p.x) + Math.abs(cand[1] - toward.x) ? cand[0] : cand[1]; return { x, z: LANE[nearIdx(p.z)] }; }
  let lo = 0; for (let i = 0; i < 5; i++) if (LANE[i] <= p.z) lo = i; const hi = Math.min(4, lo + 1); const cand = [LANE[lo], LANE[hi]]; const z = Math.abs(cand[0] - p.z) + Math.abs(cand[0] - toward.z) < Math.abs(cand[1] - p.z) + Math.abs(cand[1] - toward.z) ? cand[0] : cand[1]; return { x: LANE[nearIdx(p.x)], z };
}
export function laneRoute(a, b) {
  const sa = laneSnap(a), sb = laneSnap(b);
  const I1 = toIntersection(sa, sb), I2 = toIntersection(sb, sa);
  const pts = [sa, I1, { x: I2.x, z: I1.z }, I2, sb];
  return pts.filter((p, i) => i === 0 || Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z) > .5);
}
function ringPoint(s) {
  const R = RING; s = ((s % (8 * R)) + 8 * R) % (8 * R);
  if (s < 2 * R) return { x: R - s, z: R };
  if (s < 4 * R) return { x: -R, z: R - (s - 2 * R) };
  if (s < 6 * R) return { x: -R + (s - 4 * R), z: -R };
  return { x: R, z: -R + (s - 6 * R) };
}
function ringS(p) { const R = RING; if (Math.abs(p.z - R) < 1) return R - p.x; if (Math.abs(p.x + R) < 1) return 2 * R + (R - p.z); if (Math.abs(p.z + R) < 1) return 4 * R + (p.x + R); return 6 * R + (p.z + R); }
function nearestRing(x, z) { const R = RING; const cx = Math.max(-R, Math.min(R, x)), cz = Math.max(-R, Math.min(R, z)); return Math.abs(Math.abs(x) - R) < Math.abs(Math.abs(z) - R) ? { x: Math.sign(x) * R, z: cz } : { x: cx, z: Math.sign(z) * R }; }
function ringRoute(a, b) {
  const R = RING, P = 8 * R, sa = ringS(a), sb = ringS(b);
  let d = ((sb - sa) % P + P) % P;
  const fwd = d <= P / 2;
  if (!fwd) d = P - d;
  const out = [];
  for (let k = 1; k <= 4; k++) {
    const corner = fwd ? Math.ceil(sa / (2 * R) - 1e-6) * 2 * R + (k - 1) * 2 * R : Math.floor(sa / (2 * R) + 1e-6) * 2 * R - (k - 1) * 2 * R;
    const dist = fwd ? corner - sa : sa - corner;
    if (dist > 0.01 && dist < d - .01) out.push(ringPoint(corner));
  }
  out.push(b);
  return out;
}
