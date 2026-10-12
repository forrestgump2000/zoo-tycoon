/* Zoo Tycoon — animated biome scenes */
'use strict';

function seeded(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  return function () {
    h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const VISITOR_EMOJI = ['🚶', '🚶‍♀️', '🚶‍♂️', '🧍', '👨‍👩‍👧', '👩‍👦', '🧑‍🦯', '🧑‍🦽', '👴', '👵', '🧒', '👫', '👭', '🏃'];
const VISITOR_ITEMS = ['', '', '', '🎈', '🍦', '📸', '🧸', '🥤', '🍿', '🧢'];
const PARTICLES = {
  leaves: { n: 12, make: r => ({ html: r() < .5 ? '🍂' : '🍃', cls: 'fall', size: 12 + r() * 10, dur: 8 + r() * 8 }) },
  pollen: { n: 14, make: r => ({ html: r() < .2 ? '🐝' : '<i class="dust" style="background:#fff59d"></i>', cls: 'float', size: 12, dur: 5 + r() * 5, top: 30 + r() * 50 }) },
  sand: { n: 26, make: r => ({ html: '<i class="dust"></i>', cls: 'blow', dur: 3 + r() * 4, top: 30 + r() * 65, left: -5 }) },
  mist: { n: 3, mist: true, make: r => ({ html: r() < .5 ? '<i class="firefly"></i>' : '🍃', cls: 'float', size: 12, dur: 6 + r() * 4, top: 40 + r() * 40 }) },
  snowlight: { n: 14, make: r => ({ html: '❄', cls: 'fall', size: 8 + r() * 8, dur: 9 + r() * 8, color: '#fff' }) },
  snow: { n: 30, make: r => ({ html: r() < .3 ? '❄' : '<i class="dust" style="background:#fff;width:6px;height:6px"></i>', cls: 'fall', size: 8 + r() * 10, dur: 6 + r() * 7, color: '#fff' }) },
  sparkle: { n: 16, make: r => ({ html: r() < .5 ? '✨' : '🌸', cls: 'float', size: 10 + r() * 6, dur: 4 + r() * 4, top: 20 + r() * 60 }) },
  petals: { n: 16, make: r => ({ html: '🌸', cls: 'fall', size: 10 + r() * 8, dur: 8 + r() * 8 }) },
  dust: { n: 18, make: r => ({ html: '<i class="dust" style="background:rgba(255,224,178,.9)"></i>', cls: 'blow', dur: 4 + r() * 5, top: 35 + r() * 60, left: -5 }) },
  rain: { n: 40, rain: true, make: r => ({ html: '<i class="drop-rain"></i>', cls: 'rainfall', dur: .6 + r() * .6 }) },
  feathers: { n: 10, make: r => ({ html: '🪶', cls: 'fall', size: 12 + r() * 8, dur: 10 + r() * 8 }) },
  bubbles: { n: 26, rays: true, make: r => ({ html: '<i class="bubble" style="width:' + (6 + r() * 12) + 'px;height:' + (6 + r() * 12) + 'px"></i>', cls: 'rise', dur: 5 + r() * 7 }) },
  fireflies: { n: 22, stars: true, make: r => ({ html: '<i class="firefly"></i>', cls: 'float', dur: 4 + r() * 5, top: 25 + r() * 70 }) },
  embers: { n: 18, make: r => ({ html: '<i class="ember"></i>', cls: 'rise', dur: 5 + r() * 6 }) },
};
const EMOTES_HAPPY = ['❤️', '🎵', '😊', '✨', '💕', '😋', '🥰'];
const EMOTES_MID = ['💤', '🍃', '❔', '🍖', '👀', '🎶'];
const EMOTES_SAD = ['💢', '😿', '💧', '😤', '😰'];

const Scene = {
  el: null, biomeId: null, sprites: new Map(), keepers: [], lastEmote: 0, pens: [],

  mount(container, biomeId) {
    this.biomeId = biomeId;
    this.sprites.clear(); this.keepers = [];
    const b = BIOME_BY_ID[biomeId];
    const r = seeded(biomeId);
    const el = document.createElement('div');
    el.className = 'scene ' + biomeId + (b.night ? ' night-biome' : '');
    el.style.cssText = `--sky1:${b.sky[0]};--sky2:${b.sky[1]};--g1:${b.ground[0]};--g2:${b.ground[1]};--path:${b.path};--fence:${b.fence}`;
    const P = PARTICLES[b.particles] || PARTICLES.leaves;
    let h = '<div class="sky"></div><div class="dusk"></div>';
    if (biomeId !== 'aquarium') h += `<div class="celestial"><div class="${b.night ? 'moon' : 'sun'}"></div></div>`;
    if (b.night || P.stars) for (let i = 0; i < 40; i++) h += `<i class="star" style="left:${r() * 100}%;top:${r() * 35}%;animation-delay:${-r() * 3}s"></i>`;
    if (!b.night && biomeId !== 'aquarium') for (let i = 0; i < 3; i++) h += `<div class="cloud" style="top:${4 + r() * 18}%;animation-duration:${50 + r() * 50}s;animation-delay:${-r() * 80}s;font-size:${40 + r() * 30}px">☁️</div>`;
    if (P.rays) for (let i = 0; i < 5; i++) h += `<div class="lightray" style="left:${i * 22 + r() * 8}%;animation-delay:${-r() * 7}s;z-index:1"></div>`;
    h += '<div class="far">' + b.far.map(e => `<span>${e}</span>`).join('') + '</div>';
    h += '<div class="hills"></div><div class="ground"></div>';
    h += '<div class="horizon">';
    for (let i = 0; i < 22; i++) {
      const s = 26 + r() * 30;
      h += `<span style="left:${(i / 22) * 100 + r() * 3 - 2}%;bottom:${r() * 30}%;font-size:${s}px;animation-duration:${3 + r() * 3}s;animation-delay:${-r() * 3}s;z-index:${Math.round(40 - s)}">${pick.call(null, b.decor)}</span>`;
    }
    h += '</div>';
    h += '<div class="pens"></div><div class="facrow"></div><div class="path"></div>';
    h += '<div class="fg">';
    for (let i = 0; i < 4; i++) {
      const left = i < 2 ? r() * 6 - 3 : 94 + r() * 6;
      h += `<span style="left:${left}%;bottom:${10 + r() * 25}%;font-size:${44 + r() * 20}px;animation-duration:${3 + r() * 2}s">${b.decor[Math.floor(r() * b.decor.length)]}</span>`;
    }
    h += '</div>';
    h += '<div class="particles"></div><div class="weather"></div>';
    h += `<div class="scene-title"><h2><span class="bi">${b.icon}</span>${b.name}</h2><p>${b.desc}</p></div>`;
    h += '<div class="scene-stats"></div><div class="fx"></div>';
    el.innerHTML = h;
    // particles
    const pl = el.querySelector('.particles');
    let ph = '';
    if (P.mist) for (let i = 0; i < 3; i++) ph += `<div class="mist" style="top:${45 + i * 15}%;animation-delay:${-i * 5}s"></div>`;
    for (let i = 0; i < P.n; i++) {
      const p = P.make(r);
      const left = p.left != null ? p.left : r() * 100;
      const pos = p.top != null ? `top:${p.top}%;` : '';
      ph += `<div class="pt ${p.cls}" style="left:${left}%;${pos}font-size:${p.size || 12}px;color:${p.color || 'inherit'};animation-duration:${p.dur}s;animation-delay:${-r() * p.dur}s">${p.html}</div>`;
    }
    pl.innerHTML = ph;
    // fix horizon picks deterministic
    el.querySelectorAll('.horizon span').forEach(s => { s.textContent = b.decor[Math.floor(r() * b.decor.length)]; });
    container.innerHTML = '';
    container.appendChild(el);
    this.el = el;
    this.syncAll();
  },

  syncAll() { if (!this.el) return; this.syncPens(); this.syncFacilities(); this.syncVisitors(); this.syncWeather(); this.syncStats(); },

  syncPens() {
    const st = S.biomes[this.biomeId];
    const pensEl = this.el.querySelector('.pens');
    const enc = st.facilities.filter(f => f.type === 'enclosure');
    const shown = enc.slice(0, 8);
    const cols = Math.min(4, Math.max(1, shown.length));
    pensEl.style.gridTemplateColumns = shown.map(f => (FAC.enclosure.levels[f.level].cap + 6) + 'fr').slice(0, cols).join(' ');
    pensEl.style.gridTemplateRows = shown.length > 4 ? '1fr 1fr' : '1fr';
    const key = shown.map(f => f.id + ':' + f.level).join(',');
    if (pensEl.dataset.key !== key) {
      pensEl.dataset.key = key;
      pensEl.innerHTML = shown.map((f, i) => {
        const L = FAC.enclosure.levels[f.level];
        return `<div class="pen l${f.level}" data-i="${i}"><div class="pen-sign">${L.icon} ${L.name}</div><div class="pen-inner"></div></div>`;
      }).join('') || '<div class="pen"><div class="pen-sign full">No enclosure! Build one 🔨</div><div class="pen-inner"></div></div>';
      this.sprites.clear(); this.keepers = [];
    }
    this.pens = [...pensEl.querySelectorAll('.pen-inner')];
    this.syncAnimals();
  },

  syncAnimals(newIds) {
    const st = S.biomes[this.biomeId];
    if (!this.pens.length) return;
    const MAX = 70;
    const animals = st.animals.slice(0, MAX);
    const alive = new Set(animals.map(a => a.id));
    for (const [id, s] of this.sprites) if (!alive.has(id)) { s.el.remove(); this.sprites.delete(id); }
    // capacity per pen for labels
    const encs = st.facilities.filter(f => f.type === 'enclosure').slice(0, 8);
    animals.forEach((a, idx) => {
      let s = this.sprites.get(a.id);
      const sp = SPECIES[a.sp], v = VARIANT_BY_ID[a.v];
      const stage = lifeStage(a);
      const babyScale = stage === 'Baby' ? .55 : stage === 'Juvenile' ? .78 : 1;
      const size = Math.round(sp.size * (v.scale || 1) * babyScale);
      if (!s) {
        const penIdx = idx % this.pens.length;
        const el = document.createElement('div');
        const motion = sp.motion;
        el.className = `sprite m-${motion} left${stage === 'Baby' ? ' baby' : ''}${v.rainbow ? ' v-rainbow' : ''}${newIds && newIds.has(a.id) ? ' drop' : ''}`;
        const filt = (v.filter ? v.filter + ' ' : '') + (v.glow ? `drop-shadow(0 0 6px ${v.glow}) ` : '') + 'drop-shadow(0 3px 2px rgba(0,0,0,.2))';
        el.innerHTML = `<div class="sp-flip"><span class="sp-body" style="font-size:${size}px;${v.rainbow ? '' : 'filter:' + filt}">${sp.emoji}</span></div><div class="sp-shadow"></div>${v.glow || v.rainbow ? '<span class="sp-spark">✨</span>' : ''}<div class="sp-tag"><span class="sex-${a.sex.toLowerCase()}">${a.sex === 'M' ? '♂' : '♀'}</span> ${esc(a.name)} · ${stage}</div>`;
        el.addEventListener('click', () => UI.animalPopup(a.id));
        const y0 = this.yRange(motion);
        s = { el, a, motion, pen: penIdx, x: .1 + Math.random() * .8, y: y0[0] + Math.random() * (y0[1] - y0[0]), tx: 0, ty: 0, wait: Math.random() * 2, speed: this.speedFor(motion) * (stage === 'Baby' ? 1.3 : 1), phase: Math.random() * 6, size };
        s.tx = s.x; s.ty = s.y;
        this.pens[penIdx].appendChild(el);
        this.sprites.set(a.id, s);
        this.place(s);
      } else if (s.size !== size) {
        s.size = size; s.el.querySelector('.sp-body').style.fontSize = size + 'px';
        s.el.classList.toggle('baby', stage === 'Baby');
      }
    });
    // keepers
    const keeperCount = Math.min(st.facilities.filter(f => f.type === 'keeper').length, 6);
    while (this.keepers.length > keeperCount) this.keepers.pop().el.remove();
    const kfac = st.facilities.filter(f => f.type === 'keeper');
    while (this.keepers.length < keeperCount) {
      const L = FAC.keeper.levels[kfac[this.keepers.length].level];
      const el = document.createElement('div');
      el.className = 'sprite m-walk left keeper-sprite';
      el.innerHTML = `<div class="sp-flip"><span class="sp-body">${L.icon}</span></div><div class="sp-shadow"></div><div class="sp-tag">${L.name}</div>`;
      const pen = this.keepers.length % this.pens.length;
      const s = { el, motion: 'walk', pen, x: Math.random(), y: .5 + Math.random() * .4, tx: .5, ty: .7, wait: 0, speed: .09, phase: 0, keeper: true };
      this.pens[pen].appendChild(el);
      this.keepers.push(s); this.place(s);
    }
    // labels
    const penEls = this.el.querySelectorAll('.pen');
    const per = this.pens.map(() => 0);
    for (const s of this.sprites.values()) per[s.pen]++;
    const capTot = encs.reduce((t, f) => t + FAC.enclosure.levels[f.level].cap, 0);
    penEls.forEach((pe, i) => {
      const f = encs[i]; if (!f) return;
      const L = FAC.enclosure.levels[f.level];
      const sign = pe.querySelector('.pen-sign');
      const over = st.animals.length > capTot;
      sign.textContent = `${L.icon} ${L.name}${over ? ' · CROWDED!' : ''}`;
      sign.classList.toggle('full', over);
      let mb = pe.querySelector('.more-badge');
      if (i === 0 && st.animals.length > MAX) {
        if (!mb) { mb = document.createElement('div'); mb.className = 'more-badge'; pe.appendChild(mb); }
        mb.textContent = `+${st.animals.length - MAX} more`;
      } else if (mb) mb.remove();
    });
  },

  yRange(m) {
    if (m === 'fly' || m === 'flutter') return [.3, .8];
    if (m === 'swim') return [.3, .95];
    return [.42, .98];
  },
  speedFor(m) { return { walk: .07, hop: .11, fly: .16, flutter: .13, swim: .08, slither: .045 }[m] || .07; },

  place(s) {
    const bob = (s.motion === 'fly' || s.motion === 'flutter') ? Math.sin(s.phase) * .05 : s.motion === 'swim' ? Math.sin(s.phase) * .03 : 0;
    s.el.style.left = (s.x * 100) + '%';
    s.el.style.top = ((s.y + bob) * 100) + '%';
    s.el.style.zIndex = Math.round(s.y * 100);
  },

  syncFacilities() {
    const st = S.biomes[this.biomeId];
    const row = this.el.querySelector('.facrow');
    const items = st.facilities.filter(f => !['enclosure', 'keeper', 'mascot'].includes(f.type)).slice(0, 18);
    row.innerHTML = items.map(f => {
      const L = facLevel(f.type, f.level, this.biomeId);
      const spin = (f.type === 'ride' && L.icon === '🎡') ? ' spin' : '';
      return `<span class="fac-ico f-${f.type}${spin}" title="${esc(L.name)}" style="animation-delay:${-Math.random() * 3}s">${L.icon}</span>`;
    }).join('');
    // mascot
    const path = this.el.querySelector('.path');
    path.querySelectorAll('.mascot').forEach(m => m.remove());
    const masc = st.facilities.filter(f => f.type === 'mascot');
    const b = BIOME_BY_ID[this.biomeId];
    masc.forEach((f, i) => {
      const L = FAC.mascot.levels[f.level];
      const hat = ['🧢', '🎩', '👑'][f.level];
      const m = document.createElement('div');
      m.className = 'mascot';
      m.style.animationDelay = (-i * 11) + 's';
      m.style.fontSize = (36 + f.level * 6) + 'px';
      const lines = ['Welcome!', 'Hi there! 👋', 'Selfie? 📸', 'Love this zoo!', 'Follow me!', '★ ' + L.name + ' ★'];
      m.innerHTML = `<span class="mb">${SPECIES[b.starterKey].emoji}</span><span class="hat">${hat}</span><span class="say">${b.mascot.split(' ')[0]}: ${lines[Math.floor(Math.random() * lines.length)]}</span>`;
      path.appendChild(m);
    });
  },

  syncVisitors() {
    const st = S.biomes[this.biomeId];
    const path = this.el.querySelector('.path');
    const n = clamp(Math.round(Math.sqrt(st.stats.visits || 4) * 1.1), 2, 22);
    if (+path.dataset.n === n) return;
    path.dataset.n = n;
    path.querySelectorAll('.visitor').forEach(v => v.remove());
    for (let i = 0; i < n; i++) {
      const v = document.createElement('div');
      const dur = 14 + Math.random() * 16;
      v.className = 'visitor' + (Math.random() < .5 ? ' rev' : '');
      v.style.cssText = `bottom:${8 + Math.random() * 50}%;animation-duration:${dur}s;animation-delay:${-Math.random() * dur}s;font-size:${26 + Math.random() * 10}px`;
      const item = pick(VISITOR_ITEMS);
      v.innerHTML = `<span class="vb" style="animation-duration:${.35 + Math.random() * .2}s">${pick(VISITOR_EMOJI)}</span>${item ? `<span class="vi">${item}</span>` : ''}`;
      path.appendChild(v);
    }
  },

  syncWeather() {
    const w = this.el.querySelector('.weather');
    const indoor = ['aquarium', 'nocturnal'].includes(this.biomeId);
    const wk = indoor ? 'indoor' : S.weather;
    if (w.dataset.w === wk) return;
    w.dataset.w = wk;
    let h = '';
    if (!indoor) {
      if (wk === 'rainy' || wk === 'stormy') {
        h += '<div class="weather-dark"></div><div class="particles">';
        for (let i = 0; i < 60; i++) h += `<div class="pt rainfall" style="left:${Math.random() * 105}%;animation-duration:${.5 + Math.random() * .4}s;animation-delay:${-Math.random()}s"><i class="drop-rain"></i></div>`;
        h += '</div>';
        if (wk === 'stormy') h += '<div class="lightning"></div>';
      } else if (wk === 'snowy') {
        h += '<div class="particles">';
        for (let i = 0; i < 40; i++) h += `<div class="pt fall" style="left:${Math.random() * 100}%;color:#fff;font-size:${8 + Math.random() * 10}px;animation-duration:${6 + Math.random() * 6}s;animation-delay:${-Math.random() * 10}s">❄</div>`;
        h += '</div>';
      } else if (wk === 'cloudy') {
        h += '<div class="weather-dark" style="background:rgba(120,130,140,.15)"></div>';
        for (let i = 0; i < 4; i++) h += `<div class="cloud" style="z-index:9;top:${2 + Math.random() * 14}%;animation-duration:${40 + Math.random() * 40}s;animation-delay:${-Math.random() * 60}s;font-size:${60 + Math.random() * 30}px">☁️</div>`;
      } else if (wk === 'heat') h += '<div class="heat-haze"></div>';
    }
    w.innerHTML = h;
  },

  syncStats() {
    const st = S.biomes[this.biomeId], info = biomeInfo(this.biomeId);
    this.el.querySelector('.scene-stats').innerHTML =
      `<span class="chip">👥 ${fmt(st.stats.visits)} visits</span><span class="chip">💰 ${money(st.stats.revenue)}/day</span><span class="chip">🐾 ${info.n}/${info.cap}</span><span class="chip">${moodIcon(info.avgHappy)} ${Math.round(info.avgHappy)}% happy</span>`;
  },

  tick(dt, progress) {
    if (!this.el || !this.el.isConnected) return;
    // sun/moon
    const c = this.el.querySelector('.celestial') || { style: {} };
    const b = BIOME_BY_ID[this.biomeId];
    const p = b.night ? .5 + Math.sin(performance.now() / 20000) * .3 : progress;
    c.style.left = (6 + p * 88) + '%';
    c.style.top = (30 - Math.sin(Math.PI * p) * 22) + '%';
    this.el.style.setProperty('--dusk', b.night || this.biomeId === 'aquarium' ? 0 : Math.max(0, (progress - .7) / .3).toFixed(3));
    const step = Math.min(dt, 100) / 1000;
    const all = [...this.sprites.values(), ...this.keepers];
    for (const s of all) {
      s.phase += step * 3;
      if (s.wait > 0) {
        s.wait -= step;
        if (s.wait <= 0) {
          const yr = s.keeper ? [.55, .98] : this.yRange(s.motion);
          s.tx = .06 + Math.random() * .88; s.ty = yr[0] + Math.random() * (yr[1] - yr[0]);
          s.el.classList.add('moving');
          const dir = s.tx > s.x ? 'right' : 'left';
          s.el.classList.toggle('right', dir === 'right'); s.el.classList.toggle('left', dir === 'left');
        }
        if (s.motion === 'fly' || s.motion === 'flutter' || s.motion === 'swim') this.place(s);
        continue;
      }
      const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
      const sp = s.speed * step;
      if (d <= sp) {
        s.x = s.tx; s.y = s.ty;
        s.wait = (s.motion === 'fly' || s.motion === 'flutter') ? .3 + Math.random() * 1.5 : 1 + Math.random() * 4;
        s.el.classList.remove('moving');
      } else { s.x += dx / d * sp; s.y += dy / d * sp; }
      this.place(s);
    }
    // emotes
    const now = performance.now();
    if (now - this.lastEmote > 1400 && this.sprites.size) {
      this.lastEmote = now;
      const arr = [...this.sprites.values()];
      const s = arr[Math.floor(Math.random() * arr.length)];
      const h = s.a.happy;
      const e = pick(h > 72 ? EMOTES_HAPPY : h > 45 ? EMOTES_MID : EMOTES_SAD);
      const em = document.createElement('div');
      em.className = 'emote'; em.textContent = e;
      s.el.appendChild(em);
      setTimeout(() => em.remove(), 2300);
    }
  },

  /* effects */
  fx() { return this.el && this.el.querySelector('.fx'); },
  popMoney(amount) {
    const fx = this.fx(); if (!fx) return;
    const n = clamp(Math.round(Math.log10(Math.abs(amount) + 1) * 2), 1, 7);
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'coin'; c.textContent = '🪙';
      c.style.left = (15 + Math.random() * 70) + '%'; c.style.top = (60 + Math.random() * 25) + '%';
      c.style.setProperty('--tx', (Math.random() * 200 - 100) + 'px'); c.style.setProperty('--ty', '-300px');
      c.style.animationDelay = (i * .08) + 's';
      fx.appendChild(c); setTimeout(() => c.remove(), 2000);
    }
    const t = document.createElement('div');
    t.className = 'float-money' + (amount < 0 ? ' neg' : '');
    t.textContent = (amount >= 0 ? '+' : '') + money(amount);
    t.style.left = (35 + Math.random() * 30) + '%'; t.style.top = '55%';
    fx.appendChild(t); setTimeout(() => t.remove(), 2100);
  },
  hearts(animalId) {
    const s = this.sprites.get(animalId); const fx = this.fx(); if (!fx) return;
    const rect = this.el.getBoundingClientRect();
    let x = 50, y = 50;
    if (s) { const r2 = s.el.getBoundingClientRect(); x = (r2.left + r2.width / 2 - rect.left) / rect.width * 100; y = (r2.top - rect.top) / rect.height * 100; }
    for (let i = 0; i < 8; i++) {
      const h = document.createElement('div');
      h.className = 'heart'; h.textContent = pick(['💕', '❤️', '💖', '🍼', '✨']);
      h.style.left = x + '%'; h.style.top = y + '%';
      h.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
      h.style.animationDelay = (i * .1) + 's';
      fx.appendChild(h); setTimeout(() => h.remove(), 2600);
    }
  },
  confetti() {
    const fx = this.fx(); if (!fx) return;
    const colors = ['#f44336', '#ffeb3b', '#4caf50', '#2196f3', '#e91e63', '#ff9800', '#9c27b0'];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + '%'; c.style.background = pick(colors);
      c.style.setProperty('--tx', (Math.random() * 160 - 80) + 'px');
      c.style.animationDelay = Math.random() * .6 + 's';
      c.style.borderRadius = Math.random() < .5 ? '50%' : '2px';
      fx.appendChild(c); setTimeout(() => c.remove(), 3400);
    }
  },
  banner(text) {
    const fx = this.fx(); if (!fx) return;
    const d = document.createElement('div'); d.className = 'banner'; d.textContent = text;
    fx.appendChild(d); setTimeout(() => d.remove(), 2700);
  },
};

function moodIcon(h) { return h > 80 ? '😄' : h > 65 ? '🙂' : h > 45 ? '😐' : h > 25 ? '😟' : '😢'; }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
