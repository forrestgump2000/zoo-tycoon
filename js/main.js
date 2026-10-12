/* Zoo Tycoon — game loop */
'use strict';

const DAY_MS = 2600;

const Game = {
  acc: 0, last: 0, held: false, sinceSave: 0,

  start() {
    const loaded = load();
    if (!loaded) newGame();
    UI.init();
    if (!loaded) { this.holdForModal(true); UI.welcome(); }
    else UI.toast(`👋 Welcome back to ${esc(S.zooName)}! Day ${S.day}.`);
    document.addEventListener('keydown', e => {
      if (e.target.closest('input, textarea, select') || UI.modalOpen) return;
      if (e.code === 'Space') { e.preventDefault(); this.setSpeed(S.paused ? (S.speed || 1) : 0); }
      else if (e.key === 'n' || e.key === 'N') this.advanceDay();
      else if (['1', '2', '3', '4'].includes(e.key)) this.setSpeed([1, 2, 5, 10][+e.key - 1]);
    });
    window.addEventListener('beforeunload', () => save());
    document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
    requestAnimationFrame(t => { this.last = t; this.frame(t); });
  },

  setSpeed(s) {
    if (s === 0) S.paused = true; else { S.paused = false; S.speed = s; }
    UI.updateTopbar();
  },
  holdForModal(on) { this.held = on; },

  advanceDay() {
    const report = simulateDay();
    this.acc = 0;
    UI.onDay(report);
    if (++this.sinceSave >= 5) { this.sinceSave = 0; save(); }
  },

  frame(t) {
    const dt = Math.min(250, t - this.last);
    this.last = t;
    if (!S.paused && !this.held && !UI.modalOpen) {
      this.acc += dt * S.speed;
      if (this.acc >= DAY_MS) { this.acc -= DAY_MS; if (this.acc > DAY_MS) this.acc = 0; this.advanceDay(); }
    }
    const p = this.acc / DAY_MS;
    UI.setClock(p);
    UI.tickMoney();
    Scene.tick(dt, p);
    requestAnimationFrame(tt => this.frame(tt));
  },
};

window.addEventListener('DOMContentLoaded', () => Game.start());
