/* Zoo Tycoon 3D — boot & game loop */
import { World } from './three/world.js';
import { UI } from './ui.js';

const DAY_MS = 8000; // one in-game day at 1x speed

const Game = {
  acc: 0, last: 0, held: false, sinceSave: 0,
  start() {
    const loaded = load();
    if (!loaded) newGame();
    World.init(document.getElementById('world'));
    UI.init(Game);
    window.__zoo = { World, UI, Game, get S() { return S; }, forceRareEvent: id => { const r = forceRareEvent(id); if (r) UI.rareCard(r); return r; } };
    if (!loaded) { this.holdForModal(true); UI.welcome(); }
    else UI.toast(`Welcome back to ${S.zooName}! Day ${S.day}.`);
    document.addEventListener('keydown', e => {
      if (e.target.closest('input, textarea, select') || UI.modalOpen) return;
      if (e.code === 'Space') { e.preventDefault(); this.setSpeed(S.paused ? (S.speed || 1) : 0); }
      else if (e.key === 'n' || e.key === 'N') this.advanceDay();
      else if (['1', '2', '3', '4'].includes(e.key)) this.setSpeed([1, 2, 5, 10][+e.key - 1]);
      else if (e.key === 'Escape') { UI.close(); document.getElementById('animal-card').classList.remove('show'); }
    });
    window.addEventListener('beforeunload', () => save());
    document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
    const ld = document.getElementById('loading');
    requestAnimationFrame(t => { this.last = t; this.frame(t); setTimeout(() => ld.classList.add('done'), 300); });
  },
  setSpeed(s) { if (s === 0) S.paused = true; else { S.paused = false; S.speed = s; } UI.updateHud(); },
  holdForModal(on) { this.held = on; },
  advanceDay() {
    const report = simulateDay();
    this.acc = 0;
    World.onDay(report);
    UI.onDay(report);
    if (++this.sinceSave >= 5) { this.sinceSave = 0; save(); }
  },
  frame(t) {
    const dt = Math.min(100, t - this.last) / 1000;
    this.last = t;
    if (!S.paused && !this.held && !UI.modalOpen) {
      this.acc += dt * 1000 * S.speed;
      if (this.acc >= DAY_MS) { this.acc = Math.min(this.acc - DAY_MS, DAY_MS * .5); this.advanceDay(); }
    }
    const p = this.acc / DAY_MS;
    UI.tick(p);
    try { World.update(dt, p); } catch (e) { console.error(e); }
    requestAnimationFrame(tt => this.frame(tt));
  },
};
window.addEventListener('DOMContentLoaded', () => Game.start());
