/* Zoo Tycoon 3D — interface overlay (no emojis: icons are SVG, creatures are rendered 3D thumbnails) */
import { World } from './three/world.js';
import { fillThumbs, requestThumb } from './three/thumbs.js';
import { BEHAVIORS, presetBase } from './three/models.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const BIOME_COLORS = ['#4caf50', '#ff9800', '#e5a54a', '#26a69a', '#5c7cfa', '#ec407a', '#29b6f6', '#8d6e63', '#e53935', '#fbc02d', '#2e7d32', '#ab47bc', '#1565c0', '#d84315', '#3949ab', '#6d4c41'];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shortName = b => b.name.replace(/ \(.*\)/, '');
const spThumb = (key, v = 'common', sex = 'M') => `sp|${key}|${v}|${sex}`;
const img = (key, cls = '') => `<img class="thumb ${cls}" data-thumb="${key}" alt="">`;

export const UI = {
  panel: null, biome: 'forest', tab: 'animals', shopTab: 'expansions',
  shopFilter: { q: '', variant: 'all', tier: 'all', sort: 'tier', page: 0 },
  animalSort: 'species', nameQueue: [], modalOpen: false,

  init(Game) {
    this.Game = Game;
    this.renderHud();
    this.renderDock();
    Bus.on('money', () => this.flashMoney());
    World.onPick(hit => this.onPick(hit));
    const mm = $('#minimap canvas');
    mm.addEventListener('click', e => { const r = mm.getBoundingClientRect(); World.minimapClick((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height * (360 / 360)); });
    setInterval(() => { World.drawMinimap(mm); }, 250);
    $('#cam-tools').innerHTML = `
      <button class="tool" id="t-walk" title="Explore on foot (WASD + Shift to run)">${icon('walk', 22)}<span>Walk</span></button>
      <button class="tool" id="t-gate" title="Fly to the entrance">${icon('gate', 22)}<span>Gate</span></button>
      <button class="tool" id="t-help" title="Controls">${icon('question', 22)}<span>Help</span></button>`;
    $('#t-walk').onclick = () => { World.setWalk(!World.walk); $('#t-walk').classList.toggle('on', World.walk); $('#t-walk span').textContent = World.walk ? 'Fly' : 'Walk'; $('#t-walk').innerHTML = `${icon(World.walk ? 'orbit' : 'walk', 22)}<span>${World.walk ? 'Fly' : 'Walk'}</span>`; this.toast(World.walk ? 'Exploring on foot: WASD to walk, Shift to run, right-drag to look around.' : 'Back to the bird\'s-eye view.'); };
    $('#t-gate').onclick = () => { World.followId = null; World.focus(0, GATE_Z_UI - 30, 90); };
    $('#t-help').onclick = () => this.help();
  },

  /* ---------- HUD ---------- */
  renderHud() {
    $('#hud').innerHTML = `
      <div class="brand"><img src="assets/icon-192.png" alt=""><div><div class="zname" title="Rename your zoo">${esc(S.zooName)}</div><div class="sub" id="h-day"></div></div></div>
      <div class="hchips">
        <span class="chip" id="h-weather"></span>
        <span class="chip clockchip"><span class="clock"><i id="h-clock"></i></span></span>
        <span class="chip money" id="h-money">$0</span>
        <span class="delta" id="h-delta"></span>
        <span class="chip" id="h-rep"></span>
        <span class="chip" id="h-vis"></span>
      </div>
      <div class="speed" id="h-speed">
        <button data-s="0" title="Pause (Space)">${icon('pause', 18)}</button>
        <button data-s="1" title="Normal (1)">${icon('play', 18)}</button>
        <button data-s="2" title="Fast (2)">${icon('ff', 18)}</button>
        <button data-s="5" title="Faster (3)">${icon('ff2', 18)}</button>
        <button data-s="10" title="Ultra (4)">${icon('rocket', 18)}</button>
      </div>
      <button class="btn gold" id="h-next" title="Simulate one day (N)">Next Day ${icon('next', 16)}</button>`;
    $('#h-speed').addEventListener('click', e => { const b = e.target.closest('button'); if (b) this.Game.setSpeed(+b.dataset.s); });
    $('#h-next').addEventListener('click', () => this.Game.advanceDay());
    $('.zname').addEventListener('click', () => this.prompt('Name your zoo', S.zooName, v => { S.zooName = v.slice(0, 40); this.updateHud(); World.rebuildPark(); save(); }));
    this.updateHud();
  },
  updateHud() {
    const s = season(), w = WEATHER[S.weather];
    $('#h-day').innerHTML = `${icon('calendar', 14)} Day ${S.day} &middot; ${icon(s.icon, 14)} ${s.name}`;
    $('#h-weather').innerHTML = `${icon(w.icon, 18)} <small>${w.name}</small>`;
    $('#h-rep').innerHTML = `${icon('star', 18)} ${Math.round(S.reputation)} <small>rep</small>`;
    $('#h-vis').innerHTML = `${icon('people', 18)} ${fmt(S.lastVisitors)} <small>/ ${fmt(PARKING[S.parking].cap)}</small>`;
    $$('#h-speed button').forEach(b => b.classList.toggle('on', +b.dataset.s === (S.paused ? 0 : S.speed)));
    $('.zname').textContent = S.zooName;
    this.moneyTarget = S.money; if (this.moneyShown == null) this.moneyShown = S.money;
    const last = S.history[S.history.length - 1], d = $('#h-delta');
    if (last) { const net = last.r - last.e; d.textContent = (net >= 0 ? '+' : '') + money(net) + '/day'; d.className = 'delta ' + (net >= 0 ? 'pos' : 'neg'); }
  },
  tick(p) {
    const c = $('#h-clock'); if (c) c.style.width = (p * 100).toFixed(1) + '%';
    if (this.moneyShown == null) return;
    const diff = this.moneyTarget - this.moneyShown;
    this.moneyShown = Math.abs(diff) < 1 ? this.moneyTarget : this.moneyShown + diff * .15;
    const el = $('#h-money'); el.textContent = money(this.moneyShown); el.classList.toggle('neg', this.moneyShown < 0);
  },
  flashMoney() { const el = $('#h-money'); el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); this.moneyTarget = S.money; this.refreshAffordability(); },

  /* ---------- dock ---------- */
  renderDock() {
    const items = [['areas', 'map', 'Areas'], ['shop', 'cart', 'Shop'], ['stats', 'chart', 'Stats'], ['log', 'book', 'Diary'], ['settings', 'gear', 'Settings']];
    const affordable = BIOMES.some(b => !S.biomes[b.id].unlocked && S.money >= b.cost);
    $('#dock').innerHTML = items.map(([k, ic, l]) => `<button class="dock-btn ${this.panel === k ? 'on' : ''}" data-p="${k}">${icon(ic, 26)}<span>${l}</span>${k === 'shop' && affordable ? '<i class="dot"></i>' : ''}</button>`).join('') +
      '<div class="dock-sep"></div>' + BIOMES.filter(b => S.biomes[b.id].unlocked).map(b => `<button class="dock-area ${this.panel === 'area' && this.biome === b.id ? 'on' : ''}" data-b="${b.id}" title="${esc(b.name)}">${img(spThumb(b.starterKey))}</button>`).join('');
    $$('#dock .dock-btn').forEach(b => b.onclick = () => this.open(b.dataset.p));
    $$('#dock .dock-area').forEach(b => b.onclick = () => { this.openArea(b.dataset.b); World.focusBiome(b.dataset.b); });
    fillThumbs($('#dock'));
  },
  open(panel) {
    if (this.panel === panel && panel !== 'area') { this.close(); return; }
    this.panel = panel;
    $('#drawer').classList.add('open');
    this.renderDock();
    this.render(true);
  },
  openArea(id, tab) { this.biome = id; if (tab) this.tab = tab; this.panel = 'area'; $('#drawer').classList.add('open'); this.renderDock(); this.render(true); },
  close() { this.panel = null; $('#drawer').classList.remove('open'); this.renderDock(); },
  render(fresh) {
    const d = $('#drawer'); if (!this.panel) return;
    const body = $('#drawer-body') || d;
    const sc = fresh ? 0 : (body.scrollTop || 0);
    const fn = { area: 'renderArea', areas: 'renderAreas', shop: 'renderShop', stats: 'renderStats', log: 'renderLog', settings: 'renderSettings' }[this.panel];
    d.innerHTML = `<button class="drawer-close" title="Close">${icon('close', 18)}</button><div id="drawer-body"></div>`;
    $('.drawer-close', d).onclick = () => this.close();
    this[fn]($('#drawer-body'));
    $('#drawer-body').scrollTop = sc;
    fillThumbs(d);
    this.refreshAffordability();
  },
  onDay(report) {
    this.updateHud(); this.renderDock();
    if (this.panel && ['area', 'areas', 'stats', 'log'].includes(this.panel) && !(this.panel === 'area' && this.tab === 'shop')) this.render(false);
    else this.refreshAffordability();
    if (report.event) this.toast(`${icon(report.event.icon, 18)} ${report.event.text}${report.event.amount ? ' +' + money(report.event.amount) : ''}${report.event.result ? ' ' + report.event.result : ''}`, report.event.mult < 1 ? 'bad' : 'gold');
    for (const r of report.retired.slice(0, 3)) this.toast(`${icon('sunset', 18)} ${esc(r.a.name)} the ${SPECIES[r.a.sp].name} retired.`);
    const mut = report.births.find(b => b.mutated);
    if (mut) this.toast(`${icon('sparkle', 18)} Rare mutation! A ${displayName(SPECIES[mut.a.sp], mut.a.v)} was born!`, 'gold');
    else if (report.births.length && !S.askNames) this.toast(`${icon('baby', 18)} ${report.births.length} baby animal${report.births.length > 1 ? 's' : ''} born!`);
    if (S.askNames && report.births.length) { this.nameQueue.push(...report.births.map(b => b.a.id)); this.nextNaming(); }
    for (const r of report.rare) this.rareCard(r);
    for (const id of report.recaptured) { const [, a] = findAnimal(id); if (a) this.toast(`${icon('check', 18)} Keepers finally caught ${esc(a.name)} and brought them home.`); }
    if (report.turnedAway > 0 && S.day % 7 === 0) this.toast(`${icon('car', 18)} Parking full: ${fmt(report.turnedAway)} visitors turned away!`, 'bad');
  },
  refreshAffordability() {
    $$('[data-cost]').forEach(el => {
      const c = +el.dataset.cost;
      if (el.tagName === 'BUTTON') el.disabled = S.money < c || el.dataset.block === '1';
      else el.classList.toggle('cant', S.money < c);
    });
  },

  /* ---------- world picks ---------- */
  onPick(hit) {
    if (hit.type === 'escaped') {
      if (captureEscapee(hit.id)) { World.capture(hit.id); const [, a] = findAnimal(hit.id); this.toast(`${icon('check', 18)} You caught ${esc(a ? a.name : 'the escapee')}! Back home safe. +Reputation`, 'gold'); $('#event-card').classList.remove('show'); }
      return;
    }
    if (hit.type === 'animal') return this.animalCard(hit.id);
    if (hit.type === 'facility') { this.openArea(hit.biome, 'build'); return; }
    if (hit.type === 'plot') {
      if (S.biomes[hit.biome].unlocked) { this.openArea(hit.biome); World.focusBiome(hit.biome); }
      else this.unlock(hit.biome);
    }
  },
  animalCard(id) {
    const [bid, a] = findAnimal(id); if (!a) return;
    const sp = SPECIES[a.sp];
    const el = $('#animal-card');
    el.innerHTML = `<button class="drawer-close" title="Close">${icon('close', 16)}</button>
      <div class="ac-top">${img(spThumb(a.sp, a.v, a.sex), 'big')}<div>
        <h3>${esc(a.name)} ${a.ped ? icon('crown', 16) : ''}${a.trick ? icon('sparkle', 16) : ''}</h3>
        <div class="muted">${displayName(sp, a.v)} &middot; ${icon(a.sex === 'M' ? 'male' : 'female', 14)} ${a.sex === 'M' ? 'Male' : 'Female'}</div>
        <div class="tags"><span class="tag t${sp.tier}">${TIER.label[sp.tier]}</span><span class="tag">${lifeStage(a)} &middot; ${a.age}d</span></div>
      </div></div>
      <div class="ac-stats"><div>${icon(moodIconName(a.happy), 18)} ${Math.round(a.happy)}% happy</div><div>${icon('star', 18)} ${animalAppeal(a).toFixed(1)} appeal</div><div>${icon('money', 18)} ${money(animalValue(a))}</div></div>
      <div class="muted small">${originLabel(a, true)} &middot; ${BIOME_BY_ID[bid].name}</div>
      <div class="row">
        <button class="btn sm blue" id="ac-follow">${icon('follow', 16)} Follow</button>
        <button class="btn sm ghost" id="ac-ren">${icon('edit', 16)} Rename</button>
        <button class="btn sm ghost" id="ac-area">${icon('map', 16)} Area</button>
        <button class="btn sm red" id="ac-sell">${icon('sell', 16)} ${money(animalValue(a))}</button>
      </div>`;
    el.classList.add('show');
    fillThumbs(el);
    $('.drawer-close', el).onclick = () => el.classList.remove('show');
    $('#ac-follow', el).onclick = () => { World.focusAnimal(id); this.toast(`${icon('follow', 18)} Following ${esc(a.name)}. Drag to look away, WASD to stop.`); };
    $('#ac-ren', el).onclick = () => this.renameAnimal(id, () => this.animalCard(id));
    $('#ac-area', el).onclick = () => { this.openArea(bid, 'animals'); el.classList.remove('show'); };
    $('#ac-sell', el).onclick = () => this.confirm('Sell this animal?', `${esc(a.name)} will go to another zoo for ${money(animalValue(a))}.`, () => { sellAnimal(bid, id); el.classList.remove('show'); this.toast(`${icon('sell', 18)} Sold ${esc(a.name)}.`); if (this.panel) this.render(false); });
  },

  /* ---------- rare events ---------- */
  rareCard(r) {
    const el = $('#event-card');
    el.className = 'show ' + (r.good ? 'good' : 'bad');
    el.innerHTML = `<div class="ev-ic">${icon(r.icon, 44)}</div><div class="ev-body"><div class="ev-kicker">${r.good ? 'Incredible!' : 'Uh oh!'} Rare event</div><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p>
      <div class="row"><button class="btn sm" id="ev-show">${icon('eye', 16)} Show me</button>${r.type === 'escape' ? `<button class="btn sm gold" id="ev-chase">${icon('follow', 16)} Chase it</button>` : ''}<button class="btn sm ghost" id="ev-x">Dismiss</button></div></div>`;
    $('#ev-x').onclick = () => el.classList.remove('show');
    $('#ev-show').onclick = () => { if (r.animalId && World.findAgent(r.animalId)) World.focusAnimal(r.animalId); else if (r.biome) World.focusBiome(r.biome); else World.focus(0, GATE_Z_UI - 20, 60); };
    if ($('#ev-chase')) $('#ev-chase').onclick = () => World.focusAnimal(r.animalId);
    clearTimeout(this._evT); this._evT = setTimeout(() => el.classList.remove('show'), r.type === 'escape' ? 30000 : 16000);
    World.playRare(r);
    if (this.panel) this.render(false);
  },

  /* ---------- area drawer ---------- */
  renderArea(v) {
    const b = BIOME_BY_ID[this.biome];
    if (!S.biomes[b.id].unlocked) { this.panel = 'areas'; return this.renderAreas(v); }
    const info = biomeInfo(b.id), s = S.biomes[b.id].stats;
    v.innerHTML = `<div class="area-head" style="--g:${b.ground};--a:${b.accent}">${img(spThumb(b.starterKey), 'head')}<div><h2>${esc(b.name)}</h2><p>${esc(b.desc)}</p>
      <div class="tags"><span class="tag">${icon('paw', 14)} ${info.n}/${info.cap}</span><span class="tag">${icon('people', 14)} ${fmt(s.visits)}/day</span><span class="tag">${icon('money', 14)} ${money(s.revenue)}/day</span><span class="tag">${icon(moodIconName(info.avgHappy), 14)} ${Math.round(info.avgHappy)}%</span></div></div>
      <button class="btn sm ghost fly" title="Fly camera here">${icon('eye', 16)}</button></div>
      <div class="tabs" id="btabs">${[['animals', 'paw', 'Animals'], ['shop', 'cart', 'Animal Shop'], ['build', 'hammer', 'Build'], ['stats', 'chart', 'Stats']].map(([k, ic, l]) => `<button class="tab ${this.tab === k ? 'on' : ''}" data-t="${k}">${icon(ic, 16)} ${l}</button>`).join('')}</div>
      <div id="tab-body"></div>`;
    $('.fly', v).onclick = () => World.focusBiome(b.id);
    $('#btabs').onclick = e => { const t = e.target.closest('.tab'); if (!t) return; this.tab = t.dataset.t; this.render(true); };
    ({ animals: this.tabAnimals, shop: this.tabShop, build: this.tabBuild, stats: this.tabBiomeStats })[this.tab].call(this, $('#tab-body'));
  },
  tabAnimals(body) {
    const id = this.biome, st = S.biomes[id], info = biomeInfo(id);
    const list = [...st.animals];
    const sorters = { species: (a, b) => a.sp.localeCompare(b.sp) || a.v.localeCompare(b.v) || a.age - b.age, happy: (a, b) => b.happy - a.happy, age: (a, b) => a.age - b.age, appeal: (a, b) => animalAppeal(b) - animalAppeal(a), name: (a, b) => a.name.localeCompare(b.name) };
    list.sort(sorters[this.animalSort]);
    let warn = '';
    if (info.n > info.cap) warn = `<div class="status bad">${icon('alert', 16)} Overcrowded (${info.n}/${info.cap})! Animals are stressed and breeding stops. Build or upgrade enclosures.</div>`;
    else if (info.coverage < 1) warn = `<div class="status warn">${icon('alert', 16)} Keepers can only care for ${info.handles} of ${info.n} animals. Hire more zookeepers!</div>`;
    const escCount = S.escapes.filter(e => e.biome === id).length;
    if (escCount) warn += `<div class="status bad">${icon('run', 16)} ${escCount} animal${escCount > 1 ? 's are' : ' is'} on the loose! Find ${escCount > 1 ? 'them' : 'it'} in the zoo (red marker) and click to catch.</div>`;
    body.innerHTML = `${warn}
      <div class="row"><b>${list.length} residents</b>${list.length > 40 ? '<span class="muted small">(40 roam in the world)</span>' : ''}<span class="spacer"></span>
      <select class="input sm" id="asort">${['species', 'name', 'age', 'happy', 'appeal'].map(k => `<option ${k === this.animalSort ? 'selected' : ''}>${k}</option>`).join('')}</select>
      <button class="btn sm" id="goshop">${icon('plus', 14)} Buy</button></div>
      <div class="alist">${list.map(a => { const sp = SPECIES[a.sp]; const esc_ = S.escapes.some(e => e.id === a.id); return `<div class="arow ${esc_ ? 'escaped' : ''}">
        ${img(spThumb(a.sp, a.v, a.sex), 'sm')}
        <div class="an"><b>${esc(a.name)}</b>${a.ped ? icon('crown', 13) : ''}${a.trick ? icon('sparkle', 13) : ''}${esc_ ? `<span class="tag t4">LOOSE</span>` : ''}<div class="muted small">${displayName(sp, a.v)} &middot; ${icon(a.sex === 'M' ? 'male' : 'female', 12)} &middot; ${lifeStage(a)} ${a.age}d</div></div>
        <div class="bar" title="${Math.round(a.happy)}% happy"><i style="width:${a.happy}%;background:${happyColor(a.happy)}"></i></div>
        <button class="ib" data-follow="${a.id}" title="Follow with camera">${icon('follow', 16)}</button>
        <button class="ib" data-ren="${a.id}" title="Rename">${icon('edit', 16)}</button>
        <button class="ib red" data-sell="${a.id}" title="Sell for ${money(animalValue(a))}">${icon('sell', 16)}</button></div>`; }).join('') || '<p class="muted">No animals yet. Visit the Animal Shop!</p>'}</div>`;
    $('#asort').onchange = e => { this.animalSort = e.target.value; this.render(false); };
    $('#goshop').onclick = () => { this.tab = 'shop'; this.render(true); };
    body.onclick = e => {
      const f = e.target.closest('[data-follow]'), r = e.target.closest('[data-ren]'), s = e.target.closest('[data-sell]');
      if (f) { World.focusAnimal(+f.dataset.follow); }
      if (r) this.renameAnimal(+r.dataset.ren, () => this.render(false));
      if (s) this.confirm('Sell this animal?', 'It will go to another zoo. This cannot be undone.', () => { const val = sellAnimal(id, +s.dataset.sell); this.toast(`${icon('sell', 18)} Sold for ${money(val)}`); this.render(false); this.renderDock(); });
    };
  },
  tabShop(body) {
    const id = this.biome, b = BIOME_BY_ID[id], f = this.shopFilter;
    let items = [];
    for (const k of b.speciesKeys) for (const v of VARIANTS) items.push({ k, v: v.id, sp: SPECIES[k], vv: v });
    const total = items.length;
    if (f.q) items = items.filter(i => displayName(i.sp, i.v).toLowerCase().includes(f.q.toLowerCase()));
    if (f.variant !== 'all') items = items.filter(i => i.v === f.variant);
    if (f.tier !== 'all') items = items.filter(i => i.sp.tier === +f.tier);
    const cost = i => speciesBaseCost(i.sp, i.v);
    const sorts = { tier: (a, b) => a.sp.tier - b.sp.tier || cost(a) - cost(b), cheap: (a, b) => cost(a) - cost(b), pricey: (a, b) => cost(b) - cost(a), appeal: (a, b) => speciesAttr(b.sp, b.v) - speciesAttr(a.sp, a.v), name: (a, b) => a.sp.name.localeCompare(b.sp.name) };
    items.sort(sorts[f.sort]);
    const PER = 36, pages = Math.max(1, Math.ceil(items.length / PER));
    f.page = Math.min(f.page, pages - 1);
    const shown = items.slice(f.page * PER, f.page * PER + PER);
    const free = freeSpace(id);
    body.innerHTML = `<div class="row"><span class="tag">${total} animals for sale</span><span class="tag ${free > 0 ? 't3' : 't4'}">${icon('home', 13)} ${free} free space${free === 1 ? '' : 's'}</span></div>
      <div class="filters">
        <input class="input" id="sq" placeholder="Search animals..." value="${esc(f.q)}">
        <select class="input" id="sv"><option value="all">All variants</option>${VARIANTS.map(v => `<option value="${v.id}" ${f.variant === v.id ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
        <select class="input" id="st"><option value="all">All tiers</option>${[1, 2, 3, 4, 5, 6, 7].map(t => `<option value="${t}" ${f.tier == t ? 'selected' : ''}>${TIER.label[t]}</option>`).join('')}</select>
        <select class="input" id="ss">${[['tier', 'Sort: Tier'], ['cheap', 'Price low-high'], ['pricey', 'Price high-low'], ['appeal', 'Most appeal'], ['name', 'Name']].map(([k, l]) => `<option value="${k}" ${f.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      </div>
      <div class="shop-grid">${shown.map(i => { const c = cost(i); return `<div class="scard v-${i.v} ${i.sp.mythic ? 'mythic' : ''} ${S.money < c ? 'cant' : ''}" data-cost="${c}" data-buy="${i.k}|${i.v}">
        ${i.vv.name ? `<span class="tag vtag">${i.vv.label}</span>` : ''}${i.sp.mythic ? `<span class="tag vtag myth">MYTHIC</span>` : ''}
        ${img(spThumb(i.k, i.v))}
        <div class="sn">${displayName(i.sp, i.v)}</div>
        <div class="sm">${icon('star', 12)} ${fmt(speciesAttr(i.sp, i.v))} &middot; <span class="tag t${i.sp.tier}">${TIER.label[i.sp.tier]}</span></div>
        <div class="sp">${money(c)}</div></div>`; }).join('') || '<p class="muted">No animals match.</p>'}</div>
      ${pages > 1 ? `<div class="pager">${Array.from({ length: pages }, (_, p) => `<button class="btn sm ${p === f.page ? '' : 'ghost'}" data-pg="${p}">${p + 1}</button>`).join('')}</div>` : ''}`;
    const re = () => { f.page = 0; this.render(false); };
    $('#sq').oninput = e => { f.q = e.target.value; clearTimeout(this._sq); this._sq = setTimeout(() => { re(); const i = $('#sq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); };
    $('#sv').onchange = e => { f.variant = e.target.value; re(); };
    $('#st').onchange = e => { f.tier = e.target.value; re(); };
    $('#ss').onchange = e => { f.sort = e.target.value; re(); };
    $('.shop-grid', body).onclick = e => { const c = e.target.closest('[data-buy]'); if (c) { const [k, v] = c.dataset.buy.split('|'); this.buyModal(k, v); } };
    $$('[data-pg]', body).forEach(btn => btn.onclick = () => { f.page = +btn.dataset.pg; this.render(false); $('#drawer-body').scrollTop = 0; });
  },
  buyModal(spKey, variant) {
    const sp = SPECIES[spKey], id = this.biome;
    let company = 'global', qty = Math.min(2, Math.max(1, freeSpace(id))), sexMode = 'mix';
    const m = this.modal(`<div class="mhead">${img(spThumb(spKey, variant), 'hero')}
      <div><h2>${displayName(sp, variant)}</h2><div class="tags"><span class="tag t${sp.tier}">${TIER.label[sp.tier]}</span><span class="tag">${icon('star', 13)} ${fmt(speciesAttr(sp, variant))} appeal each</span><span class="tag">${icon('food', 13)} $${fmt(TIER.food[sp.tier])}/day</span><span class="tag">${icon('clock', 13)} ~${sp.lifespan} days</span>${sp.predator ? `<span class="tag t4">${icon('alert', 13)} Predator</span>` : ''}</div>
      ${sp.mythic ? '<p class="muted small">A legendary creature! Enormous crowd appeal. Rarely breeds.</p>' : ''}</div></div>
      <h3 class="mh3">1. Choose an import company</h3><div class="comp-list" id="comps"></div>
      <h3 class="mh3">2. How many?</h3>
      <div class="qty" id="qty">${[1, 2, 5, 10, 25, 50].map(n => `<button class="btn ghost sm" data-q="${n}">${n}</button>`).join('')}<input class="input" id="qin" type="number" min="1" max="200" style="width:80px"><span class="muted small">Bulk: 5+ -5%, 10+ -10%, 25+ -15%, 50+ -22%</span></div>
      <div class="row" style="margin-top:10px"><h3 class="mh3" style="margin:0">3. Sexes</h3><select class="input" id="sexm"><option value="mix">Balanced mix (best for breeding)</option><option value="M">All male</option><option value="F">All female</option></select></div>
      <div class="summary" id="sum"></div>
      <div class="row"><span class="spacer"></span><button class="btn ghost" data-close>Cancel</button><button class="btn" id="dobuy">Buy</button></div>`);
    const upd = () => {
      $('#comps', m).innerHTML = COMPANIES.map(c => { const q = quoteAnimals(spKey, variant, c.id, 1); return `<div class="comp ${c.id === company ? 'on' : ''}" data-c="${c.id}">${icon(c.icon, 30)}<div><div class="cn">${c.name}</div><div class="cd">${c.desc}<br>Ages ${c.age[0]}-${c.age[1]} days &middot; starts ${c.happy}% happy</div></div><div class="cp">${money(q.unit)}<div class="cd">each</div></div></div>`; }).join('');
      $$('#qty [data-q]', m).forEach(b => b.classList.toggle('ghost', +b.dataset.q !== qty));
      $('#qin', m).value = qty;
      const q = quoteAnimals(spKey, variant, company, qty), free = freeSpace(id), problems = [];
      if (qty > free) problems.push(`Only ${free} free space${free === 1 ? '' : 's'}. Build or upgrade enclosures.`);
      if (q.total > S.money) problems.push('Not enough money.');
      $('#sum', m).innerHTML = `<div>${qty} x ${money(q.unit)}${q.disc ? ` <span class="tag t3">-${Math.round(q.disc * 100)}% bulk</span>` : ''}</div><div class="tot">Total: ${money(q.total)}</div><div class="muted">You have ${money(S.money)} &middot; ${free} spaces free</div>${problems.map(p => `<div class="err">${icon('alert', 14)} ${p}</div>`).join('')}`;
      $('#dobuy', m).disabled = problems.length > 0;
    };
    $('#comps', m).onclick = e => { const c = e.target.closest('[data-c]'); if (c) { company = c.dataset.c; upd(); } };
    $('#qty', m).onclick = e => { const b = e.target.closest('[data-q]'); if (b) { qty = +b.dataset.q; upd(); } };
    $('#qin', m).onchange = e => { qty = clamp(Math.round(+e.target.value || 1), 1, 200); upd(); };
    $('#sexm', m).onchange = e => { sexMode = e.target.value; };
    $('#dobuy', m).onclick = () => {
      const r = buyAnimals(id, spKey, variant, company, qty, sexMode);
      if (!r.ok) return this.toast(r.why, 'bad');
      this.closeModal();
      this.toast(`${icon('truck', 18)} ${qty}x ${displayName(sp, variant)} arrived! (-${money(r.total)})`);
      World.focusBiome(id); World.confetti(World.plots[id].center, 80);
      this.renderDock(); this.render(false);
    };
    upd(); fillThumbs(m);
  },
  tabBuild(body) {
    const id = this.biome, st = S.biomes[id], info = biomeInfo(id), s = st.stats, b = BIOME_BY_ID[id];
    const status = {
      enclosure: info.n > info.cap ? ['bad', `${info.n} animals in space for ${info.cap}!`] : [info.cap - info.n <= 1 ? 'warn' : '', `${info.n}/${info.cap} spaces used`],
      keeper: info.coverage < 1 ? ['bad', `Keepers cover ${info.handles}/${info.n} animals`] : ['', `Keepers cover ${info.handles} animals (${info.n} resident)`],
      restroom: s.restRatio != null && s.restRatio < 1 ? ['bad', `Lines too long! Capacity covers ${Math.round(s.restRatio * 100)}% of demand`] : ['', 'Restrooms keeping up'],
      food: effect('foodClosed', id) ? ['bad', 'CLOSED by health inspectors!'] : s.foodRatio != null && s.foodRatio < 1 ? ['warn', `Only ${Math.round(s.foodRatio * 100)}% of hungry guests were served`] : ['', `Food revenue yesterday: ${money(s.food || 0)}`],
      gift: ['', `Gift revenue yesterday: ${money(s.gift || 0)}`], ride: ['', `Ride & attraction revenue: ${money(s.rides || 0)}`], themed: ['', `Ride & attraction revenue: ${money(s.rides || 0)}`],
      mascot: ['', `Mascots boost appeal by +${Math.round(info.mascotBoost * 100)}%`], seating: ['', 'Rest areas raise guest satisfaction'],
    };
    body.innerHTML = FAC_ORDER.map(type => {
      const def = FAC[type], mine = st.facilities.filter(f => f.type === type), L0 = facLevel(type, 0, id), atMax = mine.length >= def.max;
      const [cls, txt] = status[type];
      const thumbKey = (t, l) => type === 'keeper' ? `human|keeper|${l + 1}` : type === 'mascot' ? spThumb(b.starterKey) : type === 'enclosure' ? null : `fac|${t}|${l}|${id}`;
      return `<div class="fac-sec"><div class="fh">${icon(def.icon, 28)}<div><h3>${def.label} <span class="tag">${mine.length}/${def.max}</span></h3><div class="muted small">${def.desc}</div></div></div>
        <div class="status ${cls}">${txt}</div>
        <div class="fac-list">${mine.map(f => {
          const L = facLevel(type, f.level, id), uc = upgradeCost(type, f.level), N = uc != null ? facLevel(type, f.level + 1, id) : null, tk = thumbKey(type, f.level);
          return `<div class="fac-item">${tk ? img(tk, 'fac') : `<div class="fac-ph">${icon('fence', 34)}</div>`}<div class="fi-body"><div class="nm">${esc(f.name && (type === 'mascot' || type === 'keeper') ? f.name + ' - ' + L.name : L.name)}</div><div class="lv">${'<b></b>'.repeat(f.level + 1)}${'<i></i>'.repeat(def.levels.length - f.level - 1)}</div><div class="info">${facInfo(type, L)}</div>
            <div class="row">${N ? `<button class="btn blue sm" data-up="${f.id}" data-cost="${uc}">${icon('up', 14)} ${N.name} &middot; ${money(uc)}</button>` : '<span class="tag t6">MAX</span>'}<span class="spacer"></span><button class="ib" data-del="${f.id}" title="Demolish (25% refund)">${icon('close', 14)}</button></div></div></div>`;
        }).join('')}
        <button class="add-card" data-add="${type}" data-cost="${L0.cost}" data-block="${atMax ? 1 : 0}" ${atMax ? 'disabled' : ''}>${icon('plus', 18)} Build ${L0.name} &middot; ${money(L0.cost)}</button></div></div>`;
    }).join('');
    body.onclick = e => {
      const a = e.target.closest('[data-add]'), u = e.target.closest('[data-up]'), d = e.target.closest('[data-del]');
      if (a && !a.disabled) { const r = addFacility(id, a.dataset.add); if (!r.ok) return this.toast(r.why, 'bad'); this.toast(`${icon('hammer', 18)} Built ${facLevel(r.f.type, 0, id).name}!`); this.render(false); World.after(.3, () => World.confetti(World.plots[id].center, 60)); }
      if (u) { const r = upgradeFacility(id, +u.dataset.up); if (!r.ok) return this.toast(r.why, 'bad'); this.toast(`${icon('up', 18)} Upgraded to ${facLevel(r.f.type, r.f.level, id).name}!`, 'gold'); this.render(false); }
      if (d) this.confirm('Demolish?', 'You get a 25% refund.', () => { const r = demolishFacility(id, +d.dataset.del); if (!r.ok) return this.toast(r.why, 'bad'); this.toast(`Demolished (+${money(r.refund)})`); this.render(false); });
    };
  },
  tabBiomeStats(body) {
    const s = S.biomes[this.biome].stats, h = s.history.slice(-60);
    body.innerHTML = `<div class="kpis">
      ${kpi('Visits', fmt(s.visits), 'people')}${kpi('Revenue', money(s.revenue), 'money')}${kpi('Expenses', money(s.expenses), 'clipboard')}${kpi('Profit', money(s.revenue - s.expenses), 'chart')}
      ${kpi('Satisfaction', Math.round(s.sat) + '%', 'mood4')}${kpi('Total visits', fmt(s.totalVisits), 'ticket')}${kpi('Total revenue', money(s.totalRevenue), 'coins')}${kpi('Total profit', money(s.totalRevenue - s.totalExpenses), 'trophy')}</div>
      <div class="chart-box"><h3>Revenue vs expenses (60 days)</h3><canvas id="c1"></canvas><div class="legend"><span><i style="background:#3f9b4f"></i>Revenue</span><span><i style="background:#e0533d"></i>Expenses</span></div></div>
      <div class="chart-box"><h3>Daily visits</h3><canvas id="c2"></canvas></div>
      <div class="chart-box"><h3>Yesterday's income</h3>${hbars([['Tickets', s.tickets], ['Food', s.food], ['Gifts', s.gift], ['Rides', s.rides]], ['#3a8fd9', '#ff9800', '#e91e63', '#8e5bd6'])}<h3 style="margin-top:10px">Costs</h3>${hbars([['Animal food', s.foodCost], ['Salaries', s.salaries], ['Maintenance', s.maint]], ['#795548', '#607d8b', '#9e9e9e'])}</div>`;
    lineChart($('#c1'), h.map(x => x.d), [{ data: h.map(x => x.r), color: '#3f9b4f', fill: true }, { data: h.map(x => x.e), color: '#e0533d' }]);
    barChart($('#c2'), h.map(x => x.d), h.map(x => x.v), BIOME_COLORS[BIOMES.findIndex(b => b.id === this.biome)]);
  },

  /* ---------- other drawers ---------- */
  renderAreas(v) {
    const owned = BIOMES.filter(b => S.biomes[b.id].unlocked).length;
    v.innerHTML = `<h2>${icon('map', 24)} Zoo Areas</h2><p class="muted">${owned} of ${BIOMES.length} open &middot; ${fmt(LISTING_COUNT)} animals in the catalog &middot; ${SPECIES_COUNT} species with their own 3D models</p>
      <div class="area-grid">${BIOMES.map(b => areaCard(b)).join('')}</div>`;
    $$('.acard', v).forEach(c => c.onclick = e => { const id = c.dataset.id; if (e.target.closest('[data-unlock]') || !S.biomes[id].unlocked) return this.unlock(id); this.openArea(id); World.focusBiome(id); });
  },
  unlock(id) {
    const b = BIOME_BY_ID[id];
    World.focusBiome(id);
    if (S.money < b.cost) return this.toast(`Need ${money(b.cost)} to open ${b.name}.`, 'bad');
    this.confirm(`Open ${b.name}?`, `Costs ${money(b.cost)}. Comes with a pair of ${b.starter}s, a pen, a port-a-potty and a snack cart.`, () => {
      if (!unlockBiome(id)) return this.toast('Could not unlock.', 'bad');
      this.toast(`${icon('party', 18)} ${b.name} is open!`, 'gold');
      this.openArea(id, 'animals');
    });
  },
  renderShop(v) {
    const tabs = [['expansions', 'map', 'New Areas'], ['park', 'gate', 'Park'], ['marketing', 'billboard', 'Marketing'], ['pricing', 'ticket', 'Tickets']];
    v.innerHTML = `<h2>${icon('cart', 24)} Zoo Shop</h2><p class="muted">You have ${money(S.money)}.</p>
      <div class="tabs" id="stabs">${tabs.map(([k, ic, l]) => `<button class="tab ${this.shopTab === k ? 'on' : ''}" data-t="${k}">${icon(ic, 16)} ${l}</button>`).join('')}</div><div id="shop-body"></div>`;
    $('#stabs').onclick = e => { const t = e.target.closest('.tab'); if (t) { this.shopTab = t.dataset.t; this.render(true); } };
    const body = $('#shop-body');
    if (this.shopTab === 'expansions') {
      body.innerHTML = `<div class="area-grid">${BIOMES.filter(b => b.cost > 0).map(b => areaCard(b, true)).join('')}</div>`;
      $$('.acard', body).forEach(c => c.onclick = () => { const id = c.dataset.id; if (S.biomes[id].unlocked) { this.openArea(id); World.focusBiome(id); } else this.unlock(id); });
    } else if (this.shopTab === 'park') {
      const g = GATES[S.gate], gn = GATES[S.gate + 1], p = PARKING[S.parking], pn = PARKING[S.parking + 1];
      body.innerHTML = `<div class="panel"><div class="fh">${icon('gate', 34)}<div><h3>Entrance: ${g.name}</h3><div class="muted">+${Math.round(g.boost * 100)}% visitors &middot; +${g.rep} reputation</div></div></div>
        ${gn ? `<button class="btn gold" data-cost="${gn.cost}" id="ug">${icon('up', 16)} ${gn.name} &middot; ${money(gn.cost)}</button><div class="muted small">Then: +${Math.round(gn.boost * 100)}% visitors, +${gn.rep} rep</div>` : '<span class="tag t6">MAX LEVEL</span>'}
        <div class="steps">${GATES.map((x, i) => `<span class="${i <= S.gate ? 'on' : ''}">${x.name}</span>`).join('')}</div></div>
        <div class="panel"><div class="fh">${icon('car', 34)}<div><h3>Parking: ${p.name}</h3><div class="muted">Max ${fmt(p.cap)} visitors per day</div></div></div>
        ${pn ? `<button class="btn gold" data-cost="${pn.cost}" id="up">${icon('up', 16)} ${pn.name} &middot; ${money(pn.cost)}</button><div class="muted small">Then: ${fmt(pn.cap)} visitors/day</div>` : '<span class="tag t6">MAX LEVEL</span>'}
        <div class="steps">${PARKING.map((x, i) => `<span class="${i <= S.parking ? 'on' : ''}">${x.name}</span>`).join('')}</div>
        ${S.lastVisitors >= p.cap ? `<div class="status bad">${icon('alert', 16)} Your lot was full yesterday. Visitors are being turned away!</div>` : ''}</div>`;
      $('#ug') && ($('#ug').onclick = () => { const r = upgradeGate(); r.ok ? this.toast(`${icon('gate', 18)} Entrance upgraded!`, 'gold') : this.toast(r.why, 'bad'); this.render(false); this.updateHud(); World.focus(0, GATE_Z_UI - 20, 60); });
      $('#up') && ($('#up').onclick = () => { const r = upgradeParking(); r.ok ? this.toast(`${icon('car', 18)} Parking upgraded!`, 'gold') : this.toast(r.why, 'bad'); this.render(false); this.updateHud(); World.focus(0, GATE_Z_UI + 30, 80); });
    } else if (this.shopTab === 'marketing') {
      body.innerHTML = `<div class="mk-list">${MARKETING.map(m => { const run = S.marketing.find(x => x.id === m.id); return `<div class="panel row">${icon(m.icon, 32)}<div style="flex:1"><b>${m.name}</b><div class="muted small">+${Math.round(m.boost * 100)}% visitors for ${m.days} days</div></div>${run ? `<span class="tag t3">${run.until - S.day} days left</span>` : `<button class="btn sm" data-mk="${m.id}" data-cost="${m.cost}">Launch &middot; ${money(m.cost)}</button>`}</div>`; }).join('')}</div><p class="muted">Campaigns stack! Current boost: +${Math.round(marketingBoost() * 100)}%</p>`;
      body.onclick = e => { const b = e.target.closest('[data-mk]'); if (!b) return; const r = runMarketing(b.dataset.mk); r.ok ? this.toast(`${icon('billboard', 18)} Campaign launched!`, 'gold') : this.toast(r.why, 'bad'); this.render(false); };
    } else {
      const totalAppeal = BIOMES.filter(b => S.biomes[b.id].unlocked).reduce((s, b) => s + biomeInfo(b.id).appeal, 0) + 4;
      const fair = fairPrice(totalAppeal);
      body.innerHTML = `<div class="panel"><h3>${icon('ticket', 20)} Entry ticket price</h3><p class="muted small">Higher prices earn more per guest but scare some away if above what your zoo is worth.</p>
        <div class="row"><span class="bigprice" id="tp">$${S.ticketPrice}</span><span class="spacer"></span><span class="tag t3">Fair price ~ $${fair.toFixed(0)}</span></div>
        <input type="range" class="slider" id="tps" min="0" max="${Math.max(60, Math.ceil(fair * 2.5))}" value="${S.ticketPrice}"><div class="status" id="tpn"></div></div>`;
      const note = () => { const r = S.ticketPrice / fair, n = $('#tpn'); n.className = 'status ' + (r > 1.3 ? 'bad' : r > 1 ? 'warn' : ''); n.textContent = r > 1.3 ? 'Way too expensive! Guests will stay away.' : r > 1 ? 'A little pricey. Some guests will grumble.' : r < .5 ? 'Bargain! Crowds love it, but you are leaving money on the table.' : 'Great value. Guests are happy.'; };
      $('#tps').oninput = e => { S.ticketPrice = +e.target.value; $('#tp').textContent = '$' + S.ticketPrice; note(); };
      note();
    }
  },
  renderStats(v) {
    const h = S.history.slice(-90), ul = BIOMES.filter(b => S.biomes[b.id].unlocked);
    const all = ul.reduce((s, b) => s + S.biomes[b.id].animals.length, 0);
    const rows = ul.map(b => ({ b, s: S.biomes[b.id].stats, info: biomeInfo(b.id) })).sort((a, b) => b.s.revenue - a.s.revenue);
    const maxRev = Math.max(1, ...rows.map(r => r.s.revenue)), maxVis = Math.max(1, ...rows.map(r => r.s.visits));
    v.innerHTML = `<h2>${icon('chart', 24)} Zoo Statistics</h2>
      <div class="kpis">${kpi('Cash', money(S.money), 'money')}${kpi('Visitors', fmt(S.lastVisitors), 'people')}${kpi('All-time visitors', fmt(S.totals.visitors), 'ticket')}${kpi('All-time revenue', money(S.totals.revenue), 'coins')}${kpi('Reputation', Math.round(S.reputation) + '/100', 'star')}${kpi('Animals', all, 'paw')}${kpi('Babies born', fmt(S.totals.births), 'baby')}${kpi('Rare events', fmt(S.totals.rareEvents || 0), 'sparkle')}</div>
      <div class="chart-box"><h3>Cash over time</h3><canvas id="g1"></canvas></div>
      <div class="chart-box"><h3>Daily visitors</h3><canvas id="g2"></canvas></div>
      <div class="chart-box"><h3>Revenue by area (yesterday)</h3>${rows.map(r => hbar(shortName(r.b), r.s.revenue, maxRev, BIOME_COLORS[BIOMES.indexOf(r.b)], money(r.s.revenue))).join('')}</div>
      <div class="chart-box"><h3>Visits by area (yesterday)</h3>${[...rows].sort((a, b) => b.s.visits - a.s.visits).map(r => hbar(shortName(r.b), r.s.visits, maxVis, BIOME_COLORS[BIOMES.indexOf(r.b)], fmt(r.s.visits))).join('')}</div>
      <div class="chart-box"><h3>Revenue per area (60 days)</h3><canvas id="g3" style="height:220px"></canvas><div class="legend">${ul.map(b => `<span><i style="background:${BIOME_COLORS[BIOMES.indexOf(b)]}"></i>${shortName(b)}</span>`).join('')}</div></div>
      <div class="chart-box"><h3>Area breakdown</h3><div class="tbl"><table><thead><tr><th>Area</th><th>Animals</th><th>Visits</th><th>Revenue</th><th>Profit</th><th>All-time</th></tr></thead><tbody>
      ${rows.map(r => `<tr data-go="${r.b.id}"><td><b>${shortName(r.b)}</b></td><td>${r.info.n}</td><td>${fmt(r.s.visits)}</td><td>${money(r.s.revenue)}</td><td class="${r.s.revenue >= r.s.expenses ? 'pos' : 'neg'}">${money(r.s.revenue - r.s.expenses)}</td><td>${money(r.s.totalRevenue)}</td></tr>`).join('')}</tbody></table></div></div>`;
    lineChart($('#g1'), h.map(x => x.d), [{ data: h.map(x => x.m), color: '#3f9b4f', fill: true }]);
    lineChart($('#g2'), h.map(x => x.d), [{ data: h.map(x => x.v), color: '#3a8fd9', fill: true }]);
    const days = [...new Set(ul.flatMap(b => S.biomes[b.id].stats.history.slice(-60).map(x => x.d)))].sort((a, b) => a - b);
    lineChart($('#g3'), days, ul.map(b => { const m = new Map(S.biomes[b.id].stats.history.map(x => [x.d, x.r])); return { data: days.map(d => m.has(d) ? m.get(d) : null), color: BIOME_COLORS[BIOMES.indexOf(b)] }; }));
    $$('[data-go]', v).forEach(r => r.onclick = () => { this.openArea(r.dataset.go, 'stats'); World.focusBiome(r.dataset.go); });
  },
  renderLog(v) { v.innerHTML = `<h2>${icon('book', 24)} Zoo Diary</h2>` + (S.log.map(l => `<div class="log-item">${icon(l.icon || 'info', 18)}<span class="ld">Day ${l.day}</span><span>${esc(l.msg)}</span></div>`).join('') || '<p class="muted">Nothing yet.</p>'); },
  renderSettings(v) {
    const st = World.stats();
    v.innerHTML = `<h2>${icon('gear', 24)} Settings</h2><div class="panel set">
      <div class="row"><b>Zoo name</b><span class="spacer"></span><input class="input" id="zn" value="${esc(S.zooName)}" maxlength="40"><button class="btn sm" id="zns">Save</button></div>
      <label class="row"><b>Ask me to name newborn babies</b><span class="spacer"></span><input type="checkbox" id="askn" ${S.askNames ? 'checked' : ''}></label>
      <label class="row"><b>High-quality shadows</b><span class="spacer"></span><input type="checkbox" id="shad" ${World.renderer.shadowMap.enabled ? 'checked' : ''}></label>
      <div class="row"><b>Save game</b><span class="spacer"></span><button class="btn blue sm" id="svn">Save now</button></div>
      <div class="muted small">Autosaves to this browser every few days.</div>
      <div class="muted small">Controls: left-drag to pan, right-drag to rotate, scroll to zoom, WASD to move, click animals & buildings. Space = pause, N = next day, 1-4 = speed.</div>
      <div class="muted small">World: ${st.animals} creatures roaming, ${st.visitors} guests, ${SPECIES_COUNT} species models, ${animationCount().toLocaleString()} species-specific animation behaviors.</div>
      <hr><div class="row"><b class="neg">Start over</b><span class="spacer"></span><button class="btn red sm" id="rst">Reset zoo</button></div></div>`;
    $('#zns').onclick = () => { S.zooName = $('#zn').value.trim() || S.zooName; this.updateHud(); World.rebuildPark(); this.toast('Renamed!'); save(); };
    $('#askn').onchange = e => { S.askNames = e.target.checked; save(); };
    $('#shad').onchange = e => { World.renderer.shadowMap.enabled = e.target.checked; World.scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); };
    $('#svn').onclick = () => { save(); this.toast('Game saved!'); };
    $('#rst').onclick = () => this.confirm('Reset everything?', 'All progress will be lost forever.', () => { wipeSave(); location.reload(); });
  },
  help() {
    this.modal(`<h2>${icon('question', 26)} How to play</h2>
      <ul class="help"><li><b>Move the camera:</b> left-drag to pan, right-drag to rotate, scroll / pinch to zoom, or WASD.</li>
      <li><b>Walk mode:</b> explore the zoo on foot with WASD (Shift to run).</li>
      <li><b>Click anything:</b> animals show their profile, buildings and areas open their manager, empty lots can be bought.</li>
      <li><b>Time:</b> pause, play, or speed up the days in the top bar. Money comes in every day.</li>
      <li><b>Grow:</b> buy animals (5 import companies, 8 color variants, bulk discounts), build & upgrade enclosures, staff, restrooms, food, rides and mascots.</li>
      <li><b>Rare events:</b> escapes, babies booms, UFOs and more. If an animal escapes, find the red marker and click it to catch it!</li>
      <li><b>Legends:</b> every area sells mythic creatures for millions.</li></ul>
      <div class="row"><span class="spacer"></span><button class="btn" data-close>Got it</button></div>`);
  },

  /* ---------- naming & dialogs ---------- */
  renameAnimal(id, after) { const [, a] = findAnimal(id); if (!a) return; this.prompt(`Rename ${a.name}`, a.name, val => { a.name = val; this.toast(`Now called ${esc(val)}!`); after && after(); }); },
  nextNaming() {
    if (this.modalOpen || !this.nameQueue.length) return;
    const id = this.nameQueue.shift();
    const [bid, a] = findAnimal(id);
    if (!a) return this.nextNaming();
    const sp = SPECIES[a.sp];
    this.Game.holdForModal(true);
    const m = this.modal(`<div class="center">${img(spThumb(a.sp, a.v, a.sex), 'hero bounce')}
      <h2>A baby ${displayName(sp, a.v)} was born!</h2>
      <p class="muted">Parents: ${esc(a.parents ? a.parents.join(' & ') : 'unknown')} &middot; ${a.sex === 'M' ? 'Boy' : 'Girl'} &middot; in ${BIOME_BY_ID[bid].name}</p>
      <div class="row center"><input class="input big" id="bn" value="${esc(a.name)}" maxlength="30"><button class="btn ghost" id="rnd" title="Random name">${icon('dice', 20)}</button></div>
      <div class="row center"><button class="btn ghost sm" id="auto">Auto-name future babies</button><button class="btn" id="ok">${icon('heart', 16)} Name baby</button></div>
      ${this.nameQueue.length ? `<p class="muted">${this.nameQueue.length} more waiting...</p>` : ''}</div>`, { noClose: true });
    fillThumbs(m);
    const inp = $('#bn', m); inp.focus(); inp.select();
    $('#rnd', m).onclick = () => { inp.value = randomName(); };
    const done = () => { a.name = inp.value.trim() || a.name; this.closeModal(); if (this.panel === 'area') this.render(false); if (this.nameQueue.length) this.nextNaming(); else this.Game.holdForModal(false); };
    $('#ok', m).onclick = done;
    inp.onkeydown = e => { if (e.key === 'Enter') done(); };
    $('#auto', m).onclick = () => { S.askNames = false; this.nameQueue = []; done(); this.toast('Babies will be auto-named. Change this in Settings.'); };
  },
  modal(html, opts = {}) {
    this.closeModal();
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal">${html}</div>`;
    $('#modal-root').appendChild(bg); this.modalOpen = true;
    if (!opts.noClose) bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-close]')) this.closeModal(); });
    return bg.querySelector('.modal');
  },
  closeModal() { $('#modal-root').innerHTML = ''; this.modalOpen = false; },
  confirm(title, text, yes) { const m = this.modal(`<h2>${title}</h2><p>${text}</p><div class="row"><span class="spacer"></span><button class="btn ghost" data-close>Cancel</button><button class="btn" id="yes">Yes!</button></div>`); $('#yes', m).onclick = () => { this.closeModal(); yes(); }; },
  prompt(title, val, cb) {
    const m = this.modal(`<h2>${title}</h2><div class="row"><input class="input big" id="pv" value="${esc(val)}" maxlength="40" style="flex:1"><button class="btn ghost" id="pr" title="Random">${icon('dice', 20)}</button></div><div class="row"><span class="spacer"></span><button class="btn ghost" data-close>Cancel</button><button class="btn" id="ok">Save</button></div>`);
    const i = $('#pv', m); i.focus(); i.select();
    const ok = () => { const v = i.value.trim(); if (v) { this.closeModal(); cb(v); } };
    $('#ok', m).onclick = ok; $('#pr', m).onclick = () => { i.value = randomName(); }; i.onkeydown = e => { if (e.key === 'Enter') ok(); };
  },
  toast(msg, kind = '') {
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.innerHTML = msg;
    const root = $('#toasts'); root.appendChild(t);
    while (root.children.length > 4) root.firstChild.remove();
    setTimeout(() => t.remove(), 5200);
  },
  welcome() {
    const parade = BIOMES.map(b => img(spThumb(b.starterKey), 'parade')).join('');
    const m = this.modal(`<div class="center welcome"><h1>Welcome to Zoo Tycoon</h1>
      <p class="muted">You just opened a tiny startup zoo: one forest, two deer, and big dreams. Grow it into a world-famous, 16-area wildlife empire.</p>
      <div class="parade">${parade}${parade}</div>
      <ul class="help">
        <li>Fly around your open-world zoo: <b>drag</b> to pan, <b>right-drag</b> to rotate, <b>scroll</b> to zoom. Or switch to <b>Walk</b> mode.</li>
        <li>Every area has its own shop with hundreds of animals, 5 import companies, rare variants and million-dollar <b>mythic creatures</b>.</li>
        <li>Build and upgrade enclosures, keepers, restrooms, restaurants, rides and mascots.</li>
        <li>Watch out for very rare events: escapes, baby booms, UFOs...</li>
      </ul>
      <div class="row center"><input class="input big" id="wz" value="${esc(S.zooName)}" maxlength="40"><button class="btn gold" id="go">Open the gates!</button></div></div>`, { noClose: true });
    fillThumbs(m);
    $('#go', m).onclick = () => { S.zooName = $('#wz', m).value.trim() || S.zooName; this.closeModal(); this.updateHud(); World.rebuildPark(); this.Game.holdForModal(false); World.confetti(World.plots.forest.center, 160); save(); };
  },
};
const GATE_Z_UI = 160;
function animationCount() { return Object.values(SPECIES).reduce((s, sp) => s + (BEHAVIORS[presetBase(sp.model).b] || []).length, 0); }

/* ---------- helpers ---------- */
function kpi(k, v, ic) { return `<div class="kpi">${icon(ic, 22)}<div><div class="k">${k}</div><div class="v">${v}</div></div></div>`; }
function happyColor(h) { return h > 70 ? '#43a047' : h > 45 ? '#fbc02d' : '#e53935'; }
function originLabel(a, long) {
  if (a.from === 'born') return 'Born here' + (long && a.parents ? ' to ' + esc(a.parents.join(' & ')) : '');
  if (a.from === 'starter') return 'Founding resident';
  const c = COMPANY_BY_ID[a.from]; return c ? (long ? 'Imported by ' + c.name : c.name.split(' ')[0]) : '';
}
function facInfo(type, L) {
  switch (type) {
    case 'enclosure': return `Holds ${L.cap} animals &middot; +${L.happy} happiness &middot; ${money(L.maint)}/day`;
    case 'keeper': return `Cares for ${L.handles} animals &middot; +${L.happy} happy${L.breed ? ' &middot; +50% breeding' : ''} &middot; ${money(L.salary)}/day`;
    case 'restroom': return `Serves ${L.cap} guests/day &middot; ${money(L.maint)}/day`;
    case 'food': case 'gift': return `Serves ${L.cap}/day &middot; avg $${L.spend} &middot; ${money(L.maint)}/day`;
    case 'mascot': return `+${Math.round(L.boost * 100)}% appeal &middot; +${L.sat} satisfaction &middot; ${money(L.salary)}/day`;
    case 'themed': case 'ride': return `+${L.appeal} appeal &middot; $${L.fee}/ride &middot; ${money(L.maint)}/day`;
    case 'seating': return `+${L.sat} satisfaction &middot; ${money(L.maint)}/day`;
  }
  return '';
}
function hbar(label, val, max, color, txt) { return `<div class="hbar"><span class="lbl">${label}</span><span class="track"><i style="width:${Math.max(1, val / max * 100)}%;background:${color}"></i></span><span class="val">${txt}</span></div>`; }
function hbars(items, colors) { const max = Math.max(1, ...items.map(i => i[1] || 0)); return items.map((i, k) => hbar(i[0], i[1] || 0, max, colors[k], money(i[1] || 0))).join(''); }
function areaCard(b, shop) {
  const st = S.biomes[b.id], s = st.stats, aff = !st.unlocked && S.money >= b.cost;
  const myth = b.speciesKeys.filter(k => SPECIES[k].mythic).map(k => SPECIES[k].name);
  return `<div class="acard ${st.unlocked ? '' : 'locked'} ${aff ? 'affordable' : ''}" data-id="${b.id}" style="--g:${b.ground};--a:${b.accent}">
    <div class="ac-art">${img(spThumb(b.starterKey))}${myth.length ? img(spThumb(b.speciesKeys.find(k => SPECIES[k].mythic)), 'myth') : ''}${st.unlocked ? '' : `<div class="lockb">${icon('lock', 30)}</div>`}</div>
    <div class="ac-body"><h3>${esc(b.name)}</h3>
    ${st.unlocked ? `<div class="mstats"><span>${icon('paw', 14)} ${st.animals.length}</span><span>${icon('people', 14)} ${fmt(s.visits)}</span><span>${icon('money', 14)} ${money(s.revenue)}/day</span></div>`
      : `<div class="muted small">${esc(b.desc)}</div><div class="muted small">Legends: ${esc(myth.join(', '))}</div><button class="btn sm ${aff ? 'gold' : ''}" data-unlock="1" data-cost="${b.cost}">${icon('unlock', 14)} ${money(b.cost)}</button>`}</div></div>`;
}
function setupCanvas(c) { const dpr = window.devicePixelRatio || 1, w = c.clientWidth || 300, h = c.clientHeight || 180; c.width = w * dpr; c.height = h * dpr; const ctx = c.getContext('2d'); ctx.scale(dpr, dpr); return { ctx, w, h }; }
function niceAxis(max) { if (max <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(max))); const n = max / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
function drawAxes(ctx, w, h, pad, maxY, labels) {
  ctx.font = '600 11px Nunito, sans-serif'; ctx.fillStyle = '#9a9a88'; ctx.strokeStyle = '#eee4c8'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) { const y = pad.t + (h - pad.t - pad.b) * (1 - i / 4); ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(fmt(maxY * i / 4), pad.l - 6, y + 4); }
  ctx.textAlign = 'center'; const n = labels.length, step = Math.max(1, Math.ceil(n / 6));
  for (let i = 0; i < n; i += step) { const x = pad.l + (w - pad.l - pad.r) * (n === 1 ? .5 : i / (n - 1)); ctx.fillText('D' + labels[i], x, h - 6); }
}
function lineChart(c, labels, series) {
  if (!c) return; const { ctx, w, h } = setupCanvas(c), pad = { l: 48, r: 8, t: 8, b: 20 };
  if (!labels.length) { ctx.font = '700 13px Nunito'; ctx.fillStyle = '#aaa'; ctx.textAlign = 'center'; ctx.fillText('Simulate a few days to see data', w / 2, h / 2); return; }
  const vals = series.flatMap(s => s.data.filter(v => v != null)); const maxY = niceAxis(Math.max(1, ...vals));
  drawAxes(ctx, w, h, pad, maxY, labels);
  const X = i => pad.l + (w - pad.l - pad.r) * (labels.length === 1 ? .5 : i / (labels.length - 1)), Y = v => pad.t + (h - pad.t - pad.b) * (1 - Math.max(0, v) / maxY);
  for (const s of series) {
    ctx.beginPath(); let st = false, lx = 0;
    s.data.forEach((v, i) => { if (v == null) return; const x = X(i), y = Y(v); if (!st) { ctx.moveTo(x, y); st = true; } else ctx.lineTo(x, y); lx = x; });
    ctx.strokeStyle = s.color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
    if (s.fill && st) { ctx.lineTo(lx, Y(0)); ctx.lineTo(X(s.data.findIndex(v => v != null)), Y(0)); ctx.closePath(); const g = ctx.createLinearGradient(0, pad.t, 0, h - pad.b); g.addColorStop(0, s.color + '55'); g.addColorStop(1, s.color + '05'); ctx.fillStyle = g; ctx.fill(); }
  }
}
function barChart(c, labels, data, color) {
  if (!c) return; const { ctx, w, h } = setupCanvas(c), pad = { l: 44, r: 8, t: 8, b: 20 };
  if (!labels.length) return;
  const maxY = niceAxis(Math.max(1, ...data)); drawAxes(ctx, w, h, pad, maxY, labels);
  const bw = (w - pad.l - pad.r) / labels.length;
  data.forEach((v, i) => { const bh = (h - pad.t - pad.b) * v / maxY; ctx.fillStyle = color; ctx.fillRect(pad.l + i * bw + bw * .15, h - pad.b - bh, bw * .7, bh); });
}
