/* Renders small portraits of 3D models for the UI (no emojis anywhere) */
import * as THREE from 'three';
import { buildAnimal, animateRig, setState } from './models.js';
import { buildFacility, buildHuman } from './props.js';

const SIZE = 192;
let R, scene, cam;
const cache = new Map(), queue = [], waiting = new Map();
function init() {
  R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(SIZE, SIZE);
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffffff', '#8a9a7a', 1.3));
  const d = new THREE.DirectionalLight('#ffffff', 1.5); d.position.set(3, 5, 4); scene.add(d);
  cam = new THREE.PerspectiveCamera(30, 1, .01, 200);
}
function frame(obj, pitch = .32, yaw = .75) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const r = Math.max(size.x, size.y, size.z) * .62 + .001;
  const dist = r / Math.tan(THREE.MathUtils.degToRad(15)) * 1.02;
  cam.position.set(c.x + Math.sin(yaw) * Math.cos(pitch) * dist, c.y + Math.sin(pitch) * dist, c.z + Math.cos(yaw) * Math.cos(pitch) * dist);
  cam.lookAt(c); cam.near = dist / 50; cam.far = dist * 4; cam.updateProjectionMatrix();
}
function render(key) {
  if (!R) init();
  const [kind, a, b, c] = key.split('|');
  let obj, cleanup = () => {};
  if (kind === 'sp') {
    const rig = buildAnimal(a, b || 'common', { sex: c || 'M' });
    setState(rig, rig.kind === 'snake' ? 'coil' : 'idle'); rig.state.blinkT = 99;
    for (let i = 0; i < 40; i++) animateRig(rig, .05, 1 + i * .05);
    obj = rig.mover; obj.scale.setScalar(1);
  } else if (kind === 'fac') {
    const f = buildFacility(a, +b, BIOME_BY_ID[c]); obj = f.group; if (f.anim) f.anim(0, 1);
  } else if (kind === 'human') {
    obj = buildHuman({ keeper: a === 'keeper', seed: +b || 3 }).mover;
  }
  scene.add(obj);
  frame(obj, kind === 'fac' ? .45 : .28, kind === 'fac' ? .6 : .85);
  R.render(scene, cam);
  const url = R.domElement.toDataURL('image/png');
  scene.remove(obj); cleanup();
  return url;
}
export function thumb(key) { return cache.get(key) || null; }
export function requestThumb(key, cb) {
  if (cache.has(key)) { cb(cache.get(key)); return; }
  if (waiting.has(key)) { waiting.get(key).push(cb); return; }
  waiting.set(key, [cb]); queue.push(key);
}
function pump() {
  const t0 = performance.now();
  while (queue.length && performance.now() - t0 < 10) {
    const key = queue.shift();
    let url = '';
    try { url = render(key); } catch (e) { console.warn('thumb failed', key, e); }
    cache.set(key, url);
    (waiting.get(key) || []).forEach(cb => cb(url));
    waiting.delete(key);
  }
  requestAnimationFrame(pump);
}
requestAnimationFrame(pump);
// fill any <img data-thumb="..."> in a container
export function fillThumbs(root = document) {
  root.querySelectorAll('img[data-thumb]:not([data-done])').forEach(img => {
    img.dataset.done = '1';
    requestThumb(img.dataset.thumb, url => { if (url) { img.src = url; img.classList.add('ready'); } });
  });
}
