/* Zoo Tycoon — UI */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const BIOME_COLORS = ['#4caf50', '#ff9800', '#e5a54a', '#26a69a', '#5c7cfa', '#ec407a', '#29b6f6', '#8d6e63', '#e53935', '#fbc02d', '#2e7d32', '#ab47bc', '#1565c0', '#d84315', '#3949ab', '#6d4c41'];

const UI = {
  view: 'biome', biome: 'forest', tab: 'animals', shopTab: 'expansions',
  shopFilter: { q: '', variant: 'all', tier: 'all', sort: 'tier', page: 0 },
  animalSort: 'species',
  nameQueue: [], modalOpen: false,

  init() {
    this.renderTopbar();
    this.renderSidebar();
    this.go('biome', 'forest');
    Bus.on('money', d => this.flashMoney(d));
  },

  /* ---------- Top bar ---------- */
  renderTopbar() {
    $('#topbar').innerHTML = `
      <div class="logo"><img src="assets/icon-192.png" alt=""><span class="zname" title="Rename your zoo">${esc(S.zooName)}</span></div>
      <div class="hstats">
        <span class="chip" id="h-day">📅 Day 1</span>
        <span class="chip" id="h-weather">☀️</span>
        <span class="chip"><span class="clock"><i id="h-clock"></i></span></span>
        <span class="chip money" id="h-money">$0</span>
        <span class="daily-delta" id="h-delta"></span>
        <span class="chip" id="h-rep">⭐ 50</span>
        <span class="chip" id="h-vis">👥 0</span>
        <div class="speed" id="h-speed">
          <button data-s="0" title="Pause (Space)">⏸</button>
          <button data-s="1" title="Normal">▶</button>
          <button data-s="2" title="Fast">⏩</button>
          <button data-s="5" title="Faster">⏩⏩</button>
          <button data-s="10" title="Ultra">🚀</button>
        </div>
        <button class="btn gold sm" id="h-next" title="Simulate one day (N)">Next Day ⏭</button>
      </div>`;
    $('#h-speed').addEventListener('click', e => { const b = e.target.closest('button'); if (b) Game.setSpeed(+b.dataset.s); });
    $('#h-next').addEventListener('click', () => Game.advanceDay());
    $('.zname').addEventListener('click', () => this.renameZoo());
    this.updateTopbar();
  },
  updateTopbar() {
    const s = season();
    $('#h-day').innerHTML = `📅 Day ${S.day} <small>${s.icon} ${s.name}</small>`;
    const w = WEATHER[S.weather];
    $('#h-weather').innerHTML = `${w.icon} <small>${w.name}</small>`;
    $('#h-rep').innerHTML = `⭐ ${Math.round(S.reputation)} <small>rep</small>`;
    $('#h-vis').innerHTML = `👥 ${fmt(S.lastVisitors)} <small>/ ${fmt(PARKING[S.parking].cap)}</small>`;
    $$('#h-speed button').forEach(b => b.classList.toggle('on', +b.dataset.s === (S.paused ? 0 : S.speed)));
    $('.zname').textContent = S.zooName;
    this.setMoneyTarget(S.money);
    const last = S.history[S.history.length - 1];
    const d = $('#h-delta');
    if (last) { const net = last.r - last.e; d.textContent = (net >= 0 ? '+' : '') + money(net) + '/day'; d.className = 'daily-delta ' + (net >= 0 ? 'pos' : 'neg'); }
  },
  moneyShown: null, moneyTarget: 0,
  setMoneyTarget(v) { this.moneyTarget = v; if (this.moneyShown == null) this.moneyShown = v; },
  tickMoney() {
    if (this.moneyShown == null) return;
    const diff = this.moneyTarget - this.moneyShown;
    if (Math.abs(diff) < 1) this.moneyShown = this.moneyTarget; else this.moneyShown += diff * .15;
    const el = $('#h-money');
    el.textContent = money(this.moneyShown);
    el.classList.toggle('neg', this.moneyShown < 0);
  },
  flashMoney(d) {
    const el = $('#h-money'); if (!el) return;
    el.classList.remove('up', 'down'); void el.offsetWidth; el.classList.add(d >= 0 ? 'up' : 'down');
    this.setMoneyTarget(S.money);
    this.refreshAffordability();
  },
  setClock(p) { const c = $('#h-clock'); if (c) c.style.width = (p * 100).toFixed(1) + '%'; },

  /* ---------- Sidebar ---------- */
  renderSidebar() {
    const nb = (view, icon, label, extra = '', biome = '') =>
      `<button class="nav-btn ${this.view === view && (!biome || this.biome === biome) ? 'on' : ''}" data-v="${view}" data-b="${biome}"><span class="ni">${icon}</span><span class="nl">${label}</span>${extra}</button>`;
    let h = '<div class="nav-sec">Manage</div>';
    h += nb('map', '🗺️', 'Zoo Map');
    const affordable = BIOMES.some(b => !S.biomes[b.id].unlocked && S.money >= b.cost);
    h += nb('shop', '🛒', 'Shop', affordable ? '<span class="pulse-dot"></span>' : '');
    h += nb('stats', '📊', 'Statistics');
    h += nb('log', '📜', 'Zoo Diary');
    h += nb('settings', '⚙️', 'Settings');
    h += '<div class="nav-sec">Your Zoo</div>';
    for (const b of BIOMES) {
      const st = S.biomes[b.id];
      if (!st.unlocked) continue;
      h += nb('biome', b.icon, b.name.replace(/ \(.*\)/, ''), `<span class="nb">${st.animals.length}</span>`, b.id);
    }
    const nextLocked = BIOMES.find(b => !S.biomes[b.id].unlocked);
    if (nextLocked) h += `<button class="nav-btn locked" data-v="shop"><span class="ni">🔒</span><span class="nl">Next: ${nextLocked.name.replace(/ \(.*\)/, '')}</span></button>`;
    $('#sidebar').innerHTML = h;
    $$('#sidebar .nav-btn').forEach(btn => btn.addEventListener('click', () => this.go(btn.dataset.v, btn.dataset.b || undefined)));
  },

  go(view, biome) {
    this.view = view;
    if (biome) { if (biome !== this.biome) this.shopFilter.page = 0; this.biome = biome; }
    this.renderSidebar();
    this.render(true);
    $('#view').scrollTop = 0;
  },

  render(fresh) {
    const v = $('#view');
    const scroll = v.scrollTop;
    if (this.view !== 'biome') Scene.el = null;
    const fn = { map: 'renderMap', shop: 'renderShop', stats: 'renderStats', log: 'renderLog', settings: 'renderSettings', biome: 'renderBiome' }[this.view];
    this[fn](v, fresh);
    if (!fresh) v.scrollTop = scroll;
  },

  /* Called once per simulated day */
  onDay(report) {
    this.updateTopbar();
    this.renderSidebar();
    if (this.view === 'biome') {
      Scene.syncAll();
      const br = report.biomes[this.biome];
      if (br) Scene.popMoney(br.rev - br.exp);
      for (const b of report.births) if (b.biome === this.biome) setTimeout(() => Scene.hearts(b.a.id), 50);
      if (['animals', 'build', 'stats'].includes(this.tab)) this.renderTab(true);
      else this.refreshAffordability();
    } else if (['map', 'stats', 'log'].includes(this.view)) this.render(false);
    else this.refreshAffordability();
    if (report.event) this.toast(`${report.event.icon} ${report.event.text}${report.event.amount ? ' +' + money(report.event.amount) : ''}${report.event.result ? ' ' + report.event.result : ''}`, report.event.mult < 1 || report.event.rep < 0 ? 'bad' : 'gold');
    for (const r of report.retired.slice(0, 3)) this.toast(`🌅 ${esc(r.a.name)} the ${SPECIES[r.a.sp].name} retired.`);
    const mut = report.births.find(b => b.mutated);
    if (mut) this.toast(`✨ Rare mutation! A ${displayName(SPECIES[mut.a.sp], mut.a.v)} was born!`, 'gold');
    else if (report.births.length && !S.askNames) this.toast(`🍼 ${report.births.length} baby animal${report.births.length > 1 ? 's' : ''} born!`);
    if (S.askNames && report.births.length) { this.nameQueue.push(...report.births.map(b => b.a.id)); this.nextNaming(); }
    if (report.turnedAway > 0 && S.day % 7 === 0) this.toast(`🅿️ Parking full — ${fmt(report.turnedAway)} visitors turned away!`, 'bad');
  },

  refreshAffordability() {
    $$('[data-cost]').forEach(el => {
      const c = +el.dataset.cost;
      if (el.tagName === 'BUTTON') el.disabled = S.money < c || el.dataset.block === '1';
      else el.classList.toggle('cant', S.money < c);
    });
  },

  /* ---------- Biome view ---------- */
  renderBiome(v, fresh) {
    const b = BIOME_BY_ID[this.biome];
    if (!S.biomes[this.biome].unlocked) { this.go('map'); return; }
    if (fresh || !Scene.el || !Scene.el.isConnected || Scene.biomeId !== this.biome) {
      v.innerHTML = `<div class="view-in"><div id="scene-host"></div>
        <div class="tabs" id="btabs">
          ${[['animals', '🐾 Animals'], ['shop', '🛍️ Animal Shop'], ['build', '🔨 Build & Upgrade'], ['stats', '📈 Area Stats']].map(([k, l]) => `<button class="tab ${this.tab === k ? 'on' : ''}" data-t="${k}">${l}</button>`).join('')}
        </div><div id="tab-body"></div></div>`;
      Scene.mount($('#scene-host'), this.biome);
      $('#btabs').addEventListener('click', e => {
        const t = e.target.closest('.tab'); if (!t) return;
        this.tab = t.dataset.t; $$('#btabs .tab').forEach(x => x.classList.toggle('on', x === t)); this.renderTab();
      });
    }
    this.renderTab();
  },

  renderTab(keepScroll) {
    const body = $('#tab-body'); if (!body) return;
    const v = $('#view'), sc = v.scrollTop;
    ({ animals: this.tabAnimals, shop: this.tabShop, build: this.tabBuild, stats: this.tabBiomeStats })[this.tab].call(this, body);
    if (keepScroll) v.scrollTop = sc;
    this.refreshAffordability();
  },

  tabAnimals(body) {
    const id = this.biome, st = S.biomes[id], info = biomeInfo(id);
    const list = [...st.animals];
    const sorters = {
      species: (a, b) => a.sp.localeCompare(b.sp) || a.v.localeCompare(b.v) || a.age - b.age,
      happy: (a, b) => b.happy - a.happy, age: (a, b) => a.age - b.age,
      appeal: (a, b) => animalAppeal(b) - animalAppeal(a), name: (a, b) => a.name.localeCompare(b.name),
    };
    list.sort(sorters[this.animalSort]);
    const pairs = {};
    for (const a of st.animals) { const sp = SPECIES[a.sp]; if (a.age >= sp.adultAge) { pairs[a.sp] = pairs[a.sp] || { m: 0, f: 0 }; pairs[a.sp][a.sex === 'M' ? 'm' : 'f']++; } }
    const breedingPairs = Object.values(pairs).reduce((s, p) => s + Math.min(p.m, p.f), 0);
    let warn = '';
    if (info.n > info.cap) warn = `<div class="status-line bad">🚨 Overcrowded (${info.n}/${info.cap})! Animals are stressed and breeding will stop. Build or upgrade enclosures.</div>`;
    else if (info.coverage < 1) warn = `<div class="status-line warn">⚠️ Keepers can only care for ${info.handles} of ${info.n} animals. Hire more zookeepers!</div>`;
    body.innerHTML = `
      <div class="kpis">
        ${kpi('Animals', `${info.n} / ${info.cap}`, '🐾', `${info.distinct} species`)}
        ${kpi('Avg Happiness', Math.round(info.avgHappy) + '%', moodIcon(info.avgHappy), 'target ' + Math.round(info.targetHappy) + '%')}
        ${kpi('Area Appeal', fmt(info.appeal), '✨', '+' + Math.round(Math.min(1, info.distinct * .04) * 100) + '% variety bonus')}
        ${kpi('Breeding Pairs', breedingPairs, '💞', S.biomes[id].animals.filter(a => a.from === 'born').length + ' born here')}
      </div>${warn}
      <div class="panel" style="margin-top:12px">
        <div class="row" style="margin-bottom:8px"><h3>Residents</h3><span class="spacer"></span>
          <span class="muted">Sort</span><select class="input" id="asort">${['species', 'name', 'age', 'happy', 'appeal'].map(k => `<option ${k === this.animalSort ? 'selected' : ''}>${k}</option>`).join('')}</select>
          <button class="btn sm" id="goshop">+ Buy animals</button></div>
        ${list.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th></th><th>Name</th><th>Species</th><th>Sex</th><th>Age</th><th>Happiness</th><th>Appeal</th><th>Origin</th><th></th></tr></thead><tbody>
        ${list.map(a => {
          const sp = SPECIES[a.sp], v = VARIANT_BY_ID[a.v];
          return `<tr><td><span class="aemoji" style="${v.filter ? 'filter:' + v.filter : ''}">${sp.emoji}</span></td>
          <td><b>${esc(a.name)}</b>${a.ped ? ' 👑' : ''}</td><td>${displayName(sp, a.v)} <span class="tag t${sp.tier}">${TIER.label[sp.tier]}</span></td>
          <td><span class="sex-${a.sex.toLowerCase()}">${a.sex === 'M' ? '♂' : '♀'}</span></td>
          <td>${lifeStage(a)} <span class="muted">· ${a.age}d</span></td>
          <td><div class="row" style="gap:6px;flex-wrap:nowrap"><div class="bar" style="width:70px"><i style="width:${a.happy}%;background:${happyColor(a.happy)}"></i></div>${moodIcon(a.happy)}</div></td>
          <td>${animalAppeal(a).toFixed(1)}</td>
          <td class="muted">${originLabel(a)}</td>
          <td style="white-space:nowrap"><button class="btn ghost sm" data-ren="${a.id}" title="Rename">✏️</button> <button class="btn red sm" data-sell="${a.id}" title="Sell">$${fmt(animalValue(a))}</button></td></tr>`;
        }).join('')}</tbody></table></div>` : '<p class="muted">No animals yet. Visit the Animal Shop!</p>'}
      </div>`;
    $('#asort').addEventListener('change', e => { this.animalSort = e.target.value; this.renderTab(); });
    $('#goshop').addEventListener('click', () => { this.tab = 'shop'; $$('#btabs .tab').forEach(x => x.classList.toggle('on', x.dataset.t === 'shop')); this.renderTab(); });
    body.addEventListener('click', e => {
      const r = e.target.closest('[data-ren]'), s = e.target.closest('[data-sell]');
      if (r) this.renameAnimal(+r.dataset.ren);
      if (s) this.confirm('Sell this animal?', 'It will go to another zoo. This cannot be undone.', () => { const val = sellAnimal(id, +s.dataset.sell); this.toast(`🤝 Sold for ${money(val)}`); Scene.syncAnimals(); this.renderTab(true); this.renderSidebar(); });
    });
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
    const PER = 60, pages = Math.max(1, Math.ceil(items.length / PER));
    f.page = Math.min(f.page, pages - 1);
    const shown = items.slice(f.page * PER, f.page * PER + PER);
    const free = freeSpace(id);
    body.innerHTML = `
      <div class="panel">
        <div class="row" style="margin-bottom:10px"><h3>${b.icon} ${b.name} Animal Shop</h3><span class="tag">${total} animals for sale</span><span class="spacer"></span>
          <span class="tag ${free > 0 ? 't3' : 't4'}">🏠 ${free} free space${free === 1 ? '' : 's'}</span></div>
        <div class="filters">
          <input class="input" id="sq" placeholder="🔍 Search ${b.name.split(' ')[0]} animals…" value="${esc(f.q)}" style="flex:1;min-width:160px">
          <select class="input" id="sv"><option value="all">All variants</option>${VARIANTS.map(v => `<option value="${v.id}" ${f.variant === v.id ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
          <select class="input" id="st"><option value="all">All tiers</option>${[1, 2, 3, 4, 5, 6].map(t => `<option value="${t}" ${f.tier == t ? 'selected' : ''}>${TIER.label[t]}</option>`).join('')}</select>
          <select class="input" id="ss">${[['tier', 'Sort: Tier'], ['cheap', 'Price ↑'], ['pricey', 'Price ↓'], ['appeal', 'Most appeal'], ['name', 'Name']].map(([k, l]) => `<option value="${k}" ${f.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        </div>
        <div class="shop-grid">${shown.map(i => {
          const c = cost(i);
          return `<div class="scard v-${i.v} ${S.money < c ? 'cant' : ''}" data-cost="${c}" data-buy="${i.k}|${i.v}">
            ${i.vv.name ? `<span class="tag vtag ${i.v === 'rainbow' ? 't6' : i.v === 'golden' ? 't4' : 't5'}">${i.vv.label}</span>` : ''}
            <div class="se ${i.vv.rainbow ? 'rb' : ''}" style="${i.vv.filter ? 'filter:' + i.vv.filter + (i.vv.glow ? ` drop-shadow(0 0 6px ${i.vv.glow})` : '') : ''};${i.vv.scale ? 'transform:scale(1.25)' : ''}">${i.sp.emoji}</div>
            <div class="sn">${displayName(i.sp, i.v)}</div>
            <div class="sm">✨ ${fmt(speciesAttr(i.sp, i.v))} appeal · <span class="tag t${i.sp.tier}">${TIER.label[i.sp.tier]}</span></div>
            <div class="sp">${money(c)}</div></div>`;
        }).join('') || '<p class="muted">No animals match.</p>'}</div>
        ${pages > 1 ? `<div class="pager">${Array.from({ length: pages }, (_, p) => `<button class="btn sm ${p === f.page ? '' : 'ghost'}" data-pg="${p}">${p + 1}</button>`).join('')}</div>` : ''}
      </div>`;
    const re = () => { f.page = 0; this.renderTab(); };
    $('#sq').addEventListener('input', e => { f.q = e.target.value; clearTimeout(this._sq); this._sq = setTimeout(() => { re(); const i = $('#sq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); });
    $('#sv').addEventListener('change', e => { f.variant = e.target.value; re(); });
    $('#st').addEventListener('change', e => { f.tier = e.target.value; re(); });
    $('#ss').addEventListener('change', e => { f.sort = e.target.value; re(); });
    body.querySelector('.shop-grid').addEventListener('click', e => { const c = e.target.closest('[data-buy]'); if (c) { const [k, v] = c.dataset.buy.split('|'); this.buyModal(k, v); } });
    $$('[data-pg]', body).forEach(btn => btn.addEventListener('click', () => { f.page = +btn.dataset.pg; this.renderTab(); }));
  },

  buyModal(spKey, variant) {
    const sp = SPECIES[spKey], v = VARIANT_BY_ID[variant], id = this.biome;
    let company = 'global', qty = Math.min(2, Math.max(1, freeSpace(id))), sexMode = 'mix';
    const m = this.modal(`<div class="mhead"><span class="bige" style="${v.filter ? 'filter:' + v.filter : ''}">${sp.emoji}</span>
      <div><h2>${displayName(sp, variant)}</h2><div class="row" style="gap:6px;margin-top:4px"><span class="tag t${sp.tier}">${TIER.label[sp.tier]}</span><span class="tag">✨ ${fmt(speciesAttr(sp, variant))} appeal each</span><span class="tag">🍖 $${TIER.food[sp.tier]}/day food</span><span class="tag">🕰️ lives ~${sp.lifespan} days</span></div></div></div>
      <h3 style="font-size:15px">1. Choose an import company</h3><div class="comp-list" id="comps"></div>
      <h3 style="font-size:15px">2. How many?</h3>
      <div class="qty" id="qty">${[1, 2, 5, 10, 25, 50].map(n => `<button class="btn ghost sm" data-q="${n}">${n}</button>`).join('')}<input class="input" id="qin" type="number" min="1" max="200" style="width:80px"> <span class="muted" style="font-weight:700">Bulk: 5+ −5%, 10+ −10%, 25+ −15%, 50+ −22%</span></div>
      <div class="row" style="margin-top:10px"><h3 style="font-size:15px">3. Sexes</h3><select class="input" id="sexm"><option value="mix">⚥ Balanced mix (best for breeding)</option><option value="M">♂ All male</option><option value="F">♀ All female</option></select></div>
      <div class="summary" id="sum"></div>
      <div class="row"><span class="spacer"></span><button class="btn ghost" data-close>Cancel</button><button class="btn" id="dobuy">Buy</button></div>`);
    const upd = () => {
      $('#comps', m).innerHTML = COMPANIES.map(c => {
        const q = quoteAnimals(spKey, variant, c.id, 1);
        return `<div class="comp ${c.id === company ? 'on' : ''}" data-c="${c.id}"><span class="cl">${c.logo}</span><div><div class="cn">${c.name}</div><div class="cd">${c.desc}<br>Ages ${c.age[0]}–${c.age[1]} days · starts ${c.happy}% happy</div></div><div class="cp">${money(q.unit)}<div class="cd">each</div></div></div>`;
      }).join('');
      $$('#qty [data-q]', m).forEach(b => b.classList.toggle('ghost', +b.dataset.q !== qty));
      $('#qin', m).value = qty;
      const q = quoteAnimals(spKey, variant, company, qty), free = freeSpace(id);
      const problems = [];
      if (qty > free) problems.push(`Only ${free} free space${free === 1 ? '' : 's'} — build/upgrade enclosures.`);
      if (q.total > S.money) problems.push('Not enough money.');
      $('#sum', m).innerHTML = `<div>${qty} × ${money(q.unit)}${q.disc ? ` <span class="tag t3">−${Math.round(q.disc * 100)}% bulk</span>` : ''}</div>
        <div class="tot">Total: ${money(q.total)}</div><div class="muted">You have ${money(S.money)} · ${free} spaces free</div>
        ${problems.map(p => `<div style="color:var(--red)">⚠️ ${p}</div>`).join('')}`;
      $('#dobuy', m).disabled = problems.length > 0;
    };
    $('#comps', m).addEventListener('click', e => { const c = e.target.closest('[data-c]'); if (c) { company = c.dataset.c; upd(); } });
    $('#qty', m).addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) { qty = +b.dataset.q; upd(); } });
    $('#qin', m).addEventListener('change', e => { qty = clamp(Math.round(+e.target.value || 1), 1, 200); upd(); });
    $('#sexm', m).addEventListener('change', e => { sexMode = e.target.value; });
    $('#dobuy', m).addEventListener('click', () => {
      const r = buyAnimals(id, spKey, variant, company, qty, sexMode);
      if (!r.ok) { this.toast(r.why, 'bad'); return; }
      this.closeModal();
      this.toast(`🚚 ${qty}× ${displayName(sp, variant)} arrived! (−${money(r.total)})`);
      Scene.syncAnimals(new Set(r.made.map(a => a.id))); Scene.syncStats(); Scene.confetti(); Scene.banner(`${sp.emoji} New arrivals!`);
      this.renderSidebar(); this.renderTab(true);
    });
    upd();
  },

  tabBuild(body) {
    const id = this.biome, st = S.biomes[id], info = biomeInfo(id), s = st.stats;
    const status = {
      enclosure: info.n > info.cap ? ['bad', `🚨 ${info.n} animals in space for ${info.cap}!`] : [info.cap - info.n <= 1 ? 'warn' : '', `🏠 ${info.n}/${info.cap} spaces used`],
      keeper: info.coverage < 1 ? ['bad', `⚠️ Keepers cover ${info.handles}/${info.n} animals`] : ['', `✅ Keepers cover ${info.handles} animals (${info.n} resident)`],
      restroom: s.restRatio != null && s.restRatio < 1 ? ['bad', `🚽 Lines are too long! Capacity covers ${Math.round(s.restRatio * 100)}% of demand`] : ['', '🚻 Restrooms keeping up' + (s.restRatio ? ` (${Math.round(Math.min(s.restRatio, 1.5) * 100)}%)` : '')],
      food: s.foodRatio != null && s.foodRatio < 1 ? ['warn', `🍔 Only ${Math.round(s.foodRatio * 100)}% of hungry guests were served — lost sales!`] : ['', `🍽️ Food revenue yesterday: ${money(s.food || 0)}`],
      gift: ['', `🎁 Gift revenue yesterday: ${money(s.gift || 0)}`],
      ride: ['', `🎟️ Ride & attraction revenue yesterday: ${money(s.rides || 0)}`],
      themed: ['', `🎟️ Ride & attraction revenue yesterday: ${money(s.rides || 0)}`],
      mascot: ['', `🎭 Mascots boost this area's appeal by +${Math.round(info.mascotBoost * 100)}%`],
      seating: ['', '🪑 Rest areas raise guest satisfaction'],
    };
    body.innerHTML = FAC_ORDER.map(type => {
      const def = FAC[type], mine = st.facilities.filter(f => f.type === type);
      const L0 = facLevel(type, 0, id);
      const atMax = mine.length >= def.max;
      const [cls, txt] = status[type];
      return `<div class="panel fac-sec"><div class="fh"><span class="fi">${def.icon}</span><div><h3>${def.label} <span class="tag">${mine.length}/${def.max}</span></h3><div class="muted" style="font-size:13px;font-weight:600">${def.desc}</div></div><span class="spacer"></span>
        <button class="btn sm" data-add="${type}" data-cost="${L0.cost}" data-block="${atMax ? 1 : 0}">+ ${L0.icon} ${L0.name} · ${money(L0.cost)}</button></div>
        <div class="status-line ${cls}">${txt}</div>
        <div class="fac-list">${mine.map(f => {
          const L = facLevel(type, f.level, id), uc = upgradeCost(type, f.level, id), N = uc != null ? facLevel(type, f.level + 1, id) : null;
          return `<div class="fac-item"><div class="top"><span class="ic">${L.icon}</span><div><div class="nm">${esc(f.name && type === 'mascot' ? f.name + ' (' + L.name + ')' : L.name)}</div><div class="lv-stars">${'★'.repeat(f.level + 1)}${'☆'.repeat(def.levels.length - f.level - 1)}</div></div></div>
            <div class="info">${facInfo(type, L)}</div>
            <div class="row" style="gap:6px">${N ? `<button class="btn blue sm" data-up="${f.id}" data-cost="${uc}">⬆ ${N.icon} ${N.name} · ${money(uc)}</button>` : '<span class="tag t6">MAX LEVEL</span>'}<span class="spacer"></span><button class="btn ghost sm" data-del="${f.id}" title="Demolish (25% refund)">🗑️</button></div></div>`;
        }).join('')}</div></div>`;
    }).join('');
    body.onclick = e => {
      const a = e.target.closest('[data-add]'), u = e.target.closest('[data-up]'), d = e.target.closest('[data-del]');
      if (a) { const r = addFacility(id, a.dataset.add); if (!r.ok) return this.toast(r.why, 'bad'); this.toast(`🔨 Built ${facLevel(r.f.type, 0, id).name}!`); Scene.syncAll(); Scene.confetti(); this.renderTab(true); }
      if (u) { const r = upgradeFacility(id, +u.dataset.up); if (!r.ok) return this.toast(r.why, 'bad'); const L = facLevel(r.f.type, r.f.level, id); this.toast(`⬆️ Upgraded to ${L.icon} ${L.name}!`, 'gold'); Scene.syncAll(); Scene.banner(`${L.icon} ${L.name}!`); this.renderTab(true); }
      if (d) this.confirm('Demolish?', 'You get a 25% refund.', () => { const r = demolishFacility(id, +d.dataset.del); if (!r.ok) return this.toast(r.why, 'bad'); this.toast(`🗑️ Demolished (+${money(r.refund)})`); Scene.syncAll(); this.renderTab(true); });
    };
  },

  tabBiomeStats(body) {
    const id = this.biome, s = S.biomes[id].stats, h = s.history.slice(-60);
    body.innerHTML = `
      <div class="kpis">
        ${kpi('Visits (yesterday)', fmt(s.visits), '👥')}
        ${kpi('Revenue (yesterday)', money(s.revenue), '💰')}
        ${kpi('Expenses (yesterday)', money(s.expenses), '🧾')}
        ${kpi('Profit (yesterday)', money(s.revenue - s.expenses), s.revenue >= s.expenses ? '📈' : '📉')}
        ${kpi('Guest Satisfaction', Math.round(s.sat) + '%', '😊')}
        ${kpi('Total Visits', fmt(s.totalVisits), '🎟️')}
        ${kpi('Total Revenue', money(s.totalRevenue), '🏦')}
        ${kpi('Total Profit', money(s.totalRevenue - s.totalExpenses), '💎')}
      </div>
      <div class="two-col">
        <div class="chart-box"><h3>Revenue vs Expenses (last 60 days)</h3><canvas id="c1"></canvas><div class="legend"><span><i style="background:#3f9b4f"></i>Revenue</span><span><i style="background:#e0533d"></i>Expenses</span></div></div>
        <div class="chart-box"><h3>Daily Visits</h3><canvas id="c2"></canvas></div>
      </div>
      <div class="two-col">
        <div class="panel"><h3 style="margin-bottom:8px">Where yesterday's money came from</h3>
          ${hbars([['🎟️ Tickets', s.tickets], ['🍔 Food', s.food], ['🎁 Gifts', s.gift], ['🎡 Rides & attractions', s.rides]], ['#3a8fd9', '#ff9800', '#e91e63', '#8e5bd6'])}</div>
        <div class="panel"><h3 style="margin-bottom:8px">Where it went</h3>
          ${hbars([['🍖 Animal food', s.foodCost], ['👷 Staff salaries', s.salaries], ['🔧 Maintenance', s.maint]], ['#795548', '#607d8b', '#9e9e9e'])}</div>
      </div>`;
    lineChart($('#c1'), h.map(x => x.d), [{ data: h.map(x => x.r), color: '#3f9b4f', fill: true }, { data: h.map(x => x.e), color: '#e0533d' }]);
    barChart($('#c2'), h.map(x => x.d), h.map(x => x.v), BIOME_COLORS[BIOMES.findIndex(b => b.id === id)]);
  },

  /* ---------- Map ---------- */
  renderMap(v) {
    const owned = BIOMES.filter(b => S.biomes[b.id].unlocked).length;
    v.innerHTML = `<div class="view-in"><div class="page-h"><h1>🗺️ ${esc(S.zooName)}</h1><span class="sub">${owned} of ${BIOMES.length} areas open · ${BIOMES.reduce((s, b) => s + S.biomes[b.id].animals.length, 0)} animals · ${LISTING_COUNT.toLocaleString()} animals in the catalog</span></div>
      <div class="map-grid">${BIOMES.map(b => mapCard(b)).join('')}</div></div>`;
    $$('.mcard', v).forEach(c => c.addEventListener('click', e => {
      const id = c.dataset.id;
      if (e.target.closest('[data-unlock]')) return this.unlock(id);
      if (S.biomes[id].unlocked) this.go('biome', id); else this.unlock(id);
    }));
  },

  unlock(id) {
    const b = BIOME_BY_ID[id];
    if (S.money < b.cost) return this.toast(`Need ${money(b.cost)} to open ${b.name}.`, 'bad');
    this.confirm(`Open ${b.icon} ${b.name}?`, `Costs ${money(b.cost)}. Comes with a pair of ${b.starter}s, a pen, a port-a-potty and a snack cart.`, () => {
      if (!unlockBiome(id)) return this.toast('Could not unlock.', 'bad');
      this.toast(`🎉 ${b.name} is open!`, 'gold');
      this.go('biome', id); this.tab = 'animals';
      setTimeout(() => { Scene.confetti(); Scene.banner(`${b.icon} Grand Opening!`); }, 200);
    });
  },

  /* ---------- Shop ---------- */
  renderShop(v) {
    const tabs = [['expansions', '🗺️ New Areas'], ['park', '🏛️ Park Upgrades'], ['marketing', '📣 Marketing'], ['pricing', '🎟️ Ticket Pricing']];
    v.innerHTML = `<div class="view-in"><div class="page-h"><h1>🛒 Zoo Shop</h1><span class="sub">Grow your empire. You have ${money(S.money)}.</span></div>
      <div class="tabs" id="stabs">${tabs.map(([k, l]) => `<button class="tab ${this.shopTab === k ? 'on' : ''}" data-t="${k}">${l}</button>`).join('')}</div><div id="shop-body"></div></div>`;
    $('#stabs').addEventListener('click', e => { const t = e.target.closest('.tab'); if (t) { this.shopTab = t.dataset.t; this.renderShop(v); } });
    const body = $('#shop-body');
    if (this.shopTab === 'expansions') {
      body.innerHTML = `<div class="map-grid">${BIOMES.filter(b => b.cost > 0).map(b => mapCard(b, true)).join('')}</div>`;
      $$('.mcard', body).forEach(c => c.addEventListener('click', () => { const id = c.dataset.id; if (S.biomes[id].unlocked) this.go('biome', id); else this.unlock(id); }));
    } else if (this.shopTab === 'park') {
      const g = GATES[S.gate], gn = GATES[S.gate + 1], p = PARKING[S.parking], pn = PARKING[S.parking + 1];
      body.innerHTML = `<div class="two-col">
        <div class="panel"><div class="fh row"><span style="font-size:44px" class="fi">${g.icon}</span><div><h3>Entrance: ${g.name}</h3><div class="muted">+${Math.round(g.boost * 100)}% visitors · +${g.rep} reputation</div></div></div>
          <div style="margin-top:12px">${gn ? `<button class="btn gold" data-cost="${gn.cost}" id="ug">⬆ ${gn.icon} ${gn.name} · ${money(gn.cost)}</button><div class="muted" style="margin-top:6px">→ +${Math.round(gn.boost * 100)}% visitors, +${gn.rep} rep</div>` : '<span class="tag t6">MAX LEVEL</span>'}</div>
          <div class="row" style="margin-top:12px;gap:4px">${GATES.map((x, i) => `<span title="${x.name}" style="font-size:24px;opacity:${i <= S.gate ? 1 : .3}">${x.icon}</span>`).join('→')}</div></div>
        <div class="panel"><div class="fh row"><span style="font-size:44px" class="fi">${p.icon}</span><div><h3>Parking: ${p.name}</h3><div class="muted">Max ${fmt(p.cap)} visitors per day</div></div></div>
          <div style="margin-top:12px">${pn ? `<button class="btn gold" data-cost="${pn.cost}" id="up">⬆ ${pn.icon} ${pn.name} · ${money(pn.cost)}</button><div class="muted" style="margin-top:6px">→ ${fmt(pn.cap)} visitors/day</div>` : '<span class="tag t6">MAX LEVEL</span>'}</div>
          <div class="row" style="margin-top:12px;gap:4px">${PARKING.map((x, i) => `<span title="${x.name}" style="font-size:24px;opacity:${i <= S.parking ? 1 : .3}">${x.icon}</span>`).join('→')}</div>
          ${S.lastVisitors >= p.cap ? '<div class="status-line bad">🚗 Your lot was full yesterday — visitors are being turned away!</div>' : ''}</div></div>`;
      $('#ug') && $('#ug').addEventListener('click', () => { const r = upgradeGate(); r.ok ? this.toast('🏛️ Entrance upgraded!', 'gold') : this.toast(r.why, 'bad'); this.renderShop(v); this.updateTopbar(); });
      $('#up') && $('#up').addEventListener('click', () => { const r = upgradeParking(); r.ok ? this.toast('🅿️ Parking upgraded!', 'gold') : this.toast(r.why, 'bad'); this.renderShop(v); this.updateTopbar(); });
    } else if (this.shopTab === 'marketing') {
      body.innerHTML = `<div class="fac-list">${MARKETING.map(m => {
        const run = S.marketing.find(x => x.id === m.id);
        return `<div class="fac-item"><div class="top"><span class="ic">${m.icon}</span><div><div class="nm">${m.name}</div><div class="info">+${Math.round(m.boost * 100)}% visitors for ${m.days} days</div></div></div>
          ${run ? `<span class="tag t3">Running · ${run.until - S.day} days left</span>` : `<button class="btn sm" data-mk="${m.id}" data-cost="${m.cost}">Launch · ${money(m.cost)}</button>`}</div>`;
      }).join('')}</div><p class="muted" style="font-weight:700">Campaigns stack! Total boost now: +${Math.round(marketingBoost() * 100)}%</p>`;
      body.onclick = e => { const b = e.target.closest('[data-mk]'); if (!b) return; const r = runMarketing(b.dataset.mk); r.ok ? this.toast('📣 Campaign launched!', 'gold') : this.toast(r.why, 'bad'); this.renderShop(v); };
    } else {
      const totalAppeal = BIOMES.filter(b => S.biomes[b.id].unlocked).reduce((s, b) => s + biomeInfo(b.id).appeal, 0) + 4;
      const fair = fairPrice(totalAppeal);
      body.innerHTML = `<div class="panel" style="max-width:620px"><h3>🎟️ Entry ticket price</h3>
        <p class="muted" style="font-weight:600">Higher prices earn more per guest but scare some away and hurt satisfaction if above what your zoo is worth.</p>
        <div class="row"><span style="font-family:var(--font-h);font-size:34px;font-weight:700" id="tp">$${S.ticketPrice}</span><span class="spacer"></span><span class="tag t3">Fair price for your zoo ≈ $${fair.toFixed(0)}</span></div>
        <input type="range" class="slider" id="tps" min="0" max="${Math.max(60, Math.ceil(fair * 2.5))}" value="${S.ticketPrice}">
        <div class="status-line" id="tpn"></div></div>`;
      const note = () => {
        const p = S.ticketPrice, r = p / fair, n = $('#tpn');
        n.className = 'status-line ' + (r > 1.3 ? 'bad' : r > 1 ? 'warn' : '');
        n.textContent = r > 1.3 ? '😠 Way too expensive! Guests will stay away and complain.' : r > 1 ? '😕 A little pricey — some guests will grumble.' : r < .5 ? '🤑 Bargain! Crowds love it, but you are leaving money on the table.' : '😊 Great value — guests are happy.';
      };
      $('#tps').addEventListener('input', e => { S.ticketPrice = +e.target.value; $('#tp').textContent = '$' + S.ticketPrice; note(); });
      note();
    }
    this.refreshAffordability();
  },

  /* ---------- Global stats ---------- */
  renderStats(v) {
    const h = S.history.slice(-90);
    const ul = BIOMES.filter(b => S.biomes[b.id].unlocked);
    const allAnimals = ul.reduce((s, b) => s + S.biomes[b.id].animals.length, 0);
    const rows = ul.map(b => ({ b, s: S.biomes[b.id].stats, info: biomeInfo(b.id) })).sort((a, b) => b.s.revenue - a.s.revenue);
    const maxRev = Math.max(1, ...rows.map(r => r.s.revenue)), maxVis = Math.max(1, ...rows.map(r => r.s.visits));
    v.innerHTML = `<div class="view-in"><div class="page-h"><h1>📊 Zoo Statistics</h1><span class="sub">Day ${S.day} · ${season().icon} ${season().name}</span></div>
      <div class="kpis">
        ${kpi('Cash', money(S.money), '💵')}
        ${kpi('Visitors Yesterday', fmt(S.lastVisitors), '👥', 'parking cap ' + fmt(PARKING[S.parking].cap))}
        ${kpi('All-time Visitors', fmt(S.totals.visitors), '🎟️')}
        ${kpi('All-time Revenue', money(S.totals.revenue), '🏦')}
        ${kpi('Reputation', Math.round(S.reputation) + '/100', '⭐')}
        ${kpi('Animals', allAnimals, '🐾', ul.length + ' areas')}
        ${kpi('Babies Born', fmt(S.totals.births), '🍼')}
        ${kpi('Ticket Price', '$' + S.ticketPrice, '🎫')}
      </div>
      <div class="two-col">
        <div class="chart-box"><h3>Cash over time</h3><canvas id="g1"></canvas></div>
        <div class="chart-box"><h3>Daily visitors & reputation</h3><canvas id="g2"></canvas><div class="legend"><span><i style="background:#3a8fd9"></i>Visitors</span><span><i style="background:#f3b52f"></i>Reputation (scaled)</span></div></div>
      </div>
      <div class="two-col">
        <div class="panel"><h3 style="margin-bottom:6px">💰 Revenue by area (yesterday)</h3>${rows.map(r => hbar(r.b.icon + ' ' + r.b.name.replace(/ \(.*\)/, ''), r.s.revenue, maxRev, BIOME_COLORS[BIOMES.indexOf(r.b)], money(r.s.revenue))).join('')}</div>
        <div class="panel"><h3 style="margin-bottom:6px">👥 Visits by area (yesterday)</h3>${[...rows].sort((a, b) => b.s.visits - a.s.visits).map(r => hbar(r.b.icon + ' ' + r.b.name.replace(/ \(.*\)/, ''), r.s.visits, maxVis, BIOME_COLORS[BIOMES.indexOf(r.b)], fmt(r.s.visits))).join('')}</div>
      </div>
      <div class="chart-box" style="margin-bottom:14px"><h3>Revenue per area (last 60 days)</h3><canvas id="g3" style="height:260px"></canvas><div class="legend">${ul.map(b => `<span><i style="background:${BIOME_COLORS[BIOMES.indexOf(b)]}"></i>${b.icon} ${b.name.replace(/ \(.*\)/, '')}</span>`).join('')}</div></div>
      <div class="panel"><h3 style="margin-bottom:8px">Area breakdown</h3><div class="tbl-wrap"><table class="t"><thead><tr><th>Area</th><th>Animals</th><th>Appeal</th><th>Happy</th><th>Visits</th><th>Revenue</th><th>Expenses</th><th>Profit</th><th>Total visits</th><th>Total revenue</th></tr></thead><tbody>
        ${rows.map(r => `<tr style="cursor:pointer" data-go="${r.b.id}"><td><b>${r.b.icon} ${r.b.name}</b></td><td>${r.info.n}/${r.info.cap}</td><td>${fmt(r.info.appeal)}</td><td>${moodIcon(r.info.avgHappy)} ${Math.round(r.info.avgHappy)}%</td><td>${fmt(r.s.visits)}</td><td>${money(r.s.revenue)}</td><td>${money(r.s.expenses)}</td><td style="color:${r.s.revenue >= r.s.expenses ? 'var(--green-d)' : 'var(--red)'};font-weight:800">${money(r.s.revenue - r.s.expenses)}</td><td>${fmt(r.s.totalVisits)}</td><td>${money(r.s.totalRevenue)}</td></tr>`).join('')}
      </tbody></table></div></div></div>`;
    lineChart($('#g1'), h.map(x => x.d), [{ data: h.map(x => x.m), color: '#3f9b4f', fill: true }]);
    const maxV = Math.max(1, ...h.map(x => x.v));
    lineChart($('#g2'), h.map(x => x.d), [{ data: h.map(x => x.v), color: '#3a8fd9', fill: true }, { data: h.map(x => x.rep / 100 * maxV), color: '#f3b52f' }]);
    const days = [...new Set(ul.flatMap(b => S.biomes[b.id].stats.history.slice(-60).map(x => x.d)))].sort((a, b) => a - b);
    lineChart($('#g3'), days, ul.map(b => { const m = new Map(S.biomes[b.id].stats.history.map(x => [x.d, x.r])); return { data: days.map(d => m.has(d) ? m.get(d) : null), color: BIOME_COLORS[BIOMES.indexOf(b)] }; }));
    $$('[data-go]', v).forEach(r => r.addEventListener('click', () => { this.tab = 'stats'; this.go('biome', r.dataset.go); }));
  },

  renderLog(v) {
    v.innerHTML = `<div class="view-in"><div class="page-h"><h1>📜 Zoo Diary</h1><span class="sub">Everything that's happened lately</span></div>
      <div class="panel">${S.log.map(l => `<div class="log-item"><span class="ld">Day ${l.day}</span>${esc(l.msg)}</div>`).join('') || '<p class="muted">Nothing yet.</p>'}</div></div>`;
  },

  renderSettings(v) {
    v.innerHTML = `<div class="view-in"><div class="page-h"><h1>⚙️ Settings</h1></div>
      <div class="panel" style="max-width:620px;display:grid;gap:14px">
        <div class="row"><b>Zoo name</b><span class="spacer"></span><input class="input" id="zn" value="${esc(S.zooName)}" maxlength="40"><button class="btn sm" id="zns">Save</button></div>
        <label class="row" style="cursor:pointer"><b>Ask me to name newborn babies</b><span class="spacer"></span><input type="checkbox" id="askn" ${S.askNames ? 'checked' : ''} style="width:22px;height:22px;accent-color:var(--green)"></label>
        <div class="muted" style="font-weight:600;margin-top:-8px">When off, babies get an auto-generated name (you can rename them any time).</div>
        <div class="row"><b>Save game</b><span class="spacer"></span><button class="btn blue sm" id="svn">💾 Save now</button></div>
        <div class="muted" style="font-weight:600;margin-top:-8px">The game autosaves to this browser every few days.</div>
        <div class="row"><b>Keyboard</b><span class="spacer"></span><span class="muted">Space = pause · N = next day · 1–4 = speed</span></div>
        <hr style="border:0;border-top:2px solid var(--line);width:100%">
        <div class="row"><b style="color:var(--red)">Start over</b><span class="spacer"></span><button class="btn red sm" id="rst">🔄 Reset zoo</button></div>
      </div></div>`;
    $('#zns').addEventListener('click', () => { S.zooName = $('#zn').value.trim() || S.zooName; this.updateTopbar(); this.toast('✅ Renamed!'); save(); });
    $('#askn').addEventListener('change', e => { S.askNames = e.target.checked; save(); });
    $('#svn').addEventListener('click', () => { save(); this.toast('💾 Game saved!'); });
    $('#rst').addEventListener('click', () => this.confirm('Reset everything?', 'All progress will be lost forever.', () => { wipeSave(); location.reload(); }));
  },

  /* ---------- Animal popup / naming ---------- */
  animalPopup(id) {
    const [bid, a] = findAnimal(id); if (!a) return;
    const sp = SPECIES[a.sp], v = VARIANT_BY_ID[a.v];
    const m = this.modal(`<div class="mhead"><span class="bige" style="${v.filter ? 'filter:' + v.filter : ''}">${sp.emoji}</span><div><h2>${esc(a.name)} ${a.ped ? '👑' : ''}</h2>
      <div class="muted" style="font-weight:700">${displayName(sp, a.v)} · <span class="sex-${a.sex.toLowerCase()}">${a.sex === 'M' ? '♂ Male' : '♀ Female'}</span></div></div></div>
      <div class="kpis">${kpi('Age', a.age + ' days', '🎂', lifeStage(a))}${kpi('Happiness', Math.round(a.happy) + '%', moodIcon(a.happy))}${kpi('Appeal', animalAppeal(a).toFixed(1), '✨')}${kpi('Value', money(animalValue(a)), '💲')}</div>
      <p class="muted" style="font-weight:700">${originLabel(a, true)} · Lifespan ~${sp.lifespan} days · Eats $${TIER.food[sp.tier]}/day</p>
      <div class="row"><button class="btn ghost" id="ren">✏️ Rename</button><span class="spacer"></span><button class="btn ghost" data-close>Close</button></div>`);
    $('#ren', m).addEventListener('click', () => { this.closeModal(); this.renameAnimal(id); });
  },
  renameAnimal(id) {
    const [bid, a] = findAnimal(id); if (!a) return;
    this.prompt(`Rename ${a.name}`, a.name, val => { a.name = val; this.toast(`✏️ Now called ${val}!`); if (Scene.el) { const s = Scene.sprites.get(id); if (s) { s.el.remove(); Scene.sprites.delete(id); Scene.syncAnimals(); } } if (this.view === 'biome') this.renderTab(true); });
  },
  renameZoo() { this.prompt('Name your zoo', S.zooName, val => { S.zooName = val.slice(0, 40); this.updateTopbar(); save(); }); },

  nextNaming() {
    if (this.modalOpen || !this.nameQueue.length) return;
    const id = this.nameQueue.shift();
    const [bid, a] = findAnimal(id);
    if (!a) return this.nextNaming();
    const sp = SPECIES[a.sp], v = VARIANT_BY_ID[a.v];
    Game.holdForModal(true);
    const m = this.modal(`<div class="welcome" style="text-align:center"><div class="bige" style="${v.filter ? 'filter:' + v.filter : ''};font-size:80px">${sp.emoji}</div>
      <h2>🍼 A baby ${displayName(sp, a.v)} was born!</h2>
      <p class="muted" style="font-weight:700">Parents: ${esc(a.parents ? a.parents.join(' & ') : 'unknown')} · ${a.sex === 'M' ? '♂ Boy' : '♀ Girl'} · in ${BIOME_BY_ID[bid].name}</p>
      <div class="row" style="justify-content:center;margin:14px 0"><input class="input" id="bn" value="${esc(a.name)}" maxlength="30" style="font-size:18px;text-align:center"><button class="btn ghost" id="rnd" title="Random name">🎲</button></div>
      <div class="row" style="justify-content:center"><button class="btn ghost sm" id="auto">Auto-name all future babies</button><button class="btn" id="ok">Name baby 💕</button></div>
      ${this.nameQueue.length ? `<p class="muted">${this.nameQueue.length} more baby${this.nameQueue.length > 1 ? 'ies' : ''} waiting…</p>` : ''}</div>`, { noClose: true });
    const inp = $('#bn', m); inp.focus(); inp.select();
    $('#rnd', m).addEventListener('click', () => { inp.value = randomName(); });
    const done = () => { a.name = inp.value.trim() || a.name; this.closeModal(); if (Scene.el) { const s = Scene.sprites.get(id); if (s) s.el.querySelector('.sp-tag').innerHTML = `<span class="sex-${a.sex.toLowerCase()}">${a.sex === 'M' ? '♂' : '♀'}</span> ${esc(a.name)} · Baby`; } if (this.view === 'biome' && this.tab === 'animals') this.renderTab(true); if (this.nameQueue.length) this.nextNaming(); else Game.holdForModal(false); };
    $('#ok', m).addEventListener('click', done);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') done(); });
    $('#auto', m).addEventListener('click', () => { S.askNames = false; this.nameQueue = []; done(); this.toast('Babies will be auto-named. Change in Settings.'); });
  },

  /* ---------- Modal helpers ---------- */
  modal(html, opts = {}) {
    this.closeModal();
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal">${html}</div>`;
    $('#modal-root').appendChild(bg);
    this.modalOpen = true;
    if (!opts.noClose) bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-close]')) this.closeModal(); });
    return bg.querySelector('.modal');
  },
  closeModal() {
    $('#modal-root').innerHTML = ''; this.modalOpen = false;
  },
  confirm(title, text, yes) {
    const m = this.modal(`<h2>${title}</h2><p style="font-weight:600">${text}</p><div class="row"><span class="spacer"></span><button class="btn ghost" data-close>Cancel</button><button class="btn" id="yes">Yes!</button></div>`);
    $('#yes', m).addEventListener('click', () => { this.closeModal(); yes(); });
  },
  prompt(title, val, cb) {
    const m = this.modal(`<h2>${title}</h2><div class="row" style="margin:14px 0"><input class="input" id="pv" value="${esc(val)}" maxlength="40" style="flex:1;font-size:16px"><button class="btn ghost" id="pr" title="Random">🎲</button></div><div class="row"><span class="spacer"></span><button class="btn ghost" data-close>Cancel</button><button class="btn" id="ok">Save</button></div>`);
    const i = $('#pv', m); i.focus(); i.select();
    const ok = () => { const v = i.value.trim(); if (v) { this.closeModal(); cb(v); } };
    $('#ok', m).addEventListener('click', ok);
    $('#pr', m).addEventListener('click', () => { i.value = randomName(); });
    i.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
  },
  toast(msg, kind = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind; t.innerHTML = msg;
    const root = $('#toasts');
    root.appendChild(t);
    while (root.children.length > 5) root.firstChild.remove();
    setTimeout(() => t.remove(), 4100);
  },
  welcome() {
    const parade = BIOMES.map(b => SPECIES[b.starterKey].emoji).join('');
    const m = this.modal(`<div class="welcome" style="text-align:center"><div class="bige">🦌</div><h2>Welcome to Zoo Tycoon!</h2>
      <p style="font-weight:700" class="muted">You've just opened a tiny startup zoo: one forest, two deer, and big dreams.</p>
      <div class="welcome-animals"><span>${parade}${parade}</span></div>
      <ul style="text-align:left">
        <li>⏩ Time passes day by day — use the speed buttons or <b>Next Day</b>.</li>
        <li>🛍️ Each area has its own <b>Animal Shop</b> with hundreds of animals, rare variants & 5 import companies.</li>
        <li>🔨 Build enclosures, hire zookeepers, add restrooms, restaurants, rides & mascots — then upgrade them.</li>
        <li>💞 Happy pairs have babies you get to name. Watch for rare mutations ✨</li>
        <li>🗺️ Save up to unlock ${BIOMES.length - 1} more areas from the Farm all the way to the Jurassic Frontier!</li>
      </ul>
      <div class="row" style="justify-content:center"><input class="input" id="wz" value="${esc(S.zooName)}" maxlength="40" style="text-align:center;font-size:16px"><button class="btn gold" id="go">Open the gates! 🎉</button></div></div>`, { noClose: true });
    $('#go', m).addEventListener('click', () => { S.zooName = $('#wz', m).value.trim() || S.zooName; this.closeModal(); this.updateTopbar(); Game.holdForModal(false); Scene.confetti(); Scene.banner('🎉 Grand Opening!'); save(); });
  },
};

/* ---------- helpers ---------- */
function kpi(k, v, e, d) { return `<div class="kpi"><div class="k">${k}</div><div class="v">${v}</div>${d ? `<div class="d">${d}</div>` : ''}<span class="e">${e}</span></div>`; }
function happyColor(h) { return h > 70 ? '#43a047' : h > 45 ? '#fbc02d' : '#e53935'; }
function originLabel(a, long) {
  if (a.from === 'born') return '🍼 Born here' + (long && a.parents ? ' to ' + esc(a.parents.join(' & ')) : '');
  if (a.from === 'starter') return '🌱 Founder';
  const c = COMPANY_BY_ID[a.from]; return c ? `${c.logo} ${long ? c.name : c.name.split(' ')[0]}` : '';
}
function facInfo(type, L) {
  switch (type) {
    case 'enclosure': return `Holds ${L.cap} animals · +${L.happy} happiness · ${money(L.maint)}/day`;
    case 'keeper': return `Cares for ${L.handles} animals · +${L.happy} happiness${L.breed ? ' · +50% breeding' : ''} · ${money(L.salary)}/day`;
    case 'restroom': return `Serves ${L.cap} guests/day · ${money(L.maint)}/day`;
    case 'food': case 'gift': return `Serves ${L.cap}/day · avg spend $${L.spend} · ${money(L.maint)}/day`;
    case 'mascot': return `+${Math.round(L.boost * 100)}% area appeal · +${L.sat} satisfaction · ${money(L.salary)}/day`;
    case 'themed': case 'ride': return `+${L.appeal} appeal · $${L.fee}/ride · ${L.cap} riders/day · ${money(L.maint)}/day`;
    case 'seating': return `+${L.sat} satisfaction${L.appeal ? ' · +' + L.appeal + ' appeal' : ''} · ${money(L.maint)}/day`;
  }
  return '';
}
function hbar(label, val, max, color, txt) {
  return `<div class="hbar"><span class="lbl">${label}</span><span class="track"><i style="width:${Math.max(1, val / max * 100)}%;background:${color}"></i></span><span class="val">${txt}</span></div>`;
}
function hbars(items, colors) {
  const max = Math.max(1, ...items.map(i => i[1] || 0));
  return items.map((i, k) => hbar(i[0], i[1] || 0, max, colors[k], money(i[1] || 0))).join('');
}
function mapCard(b, shop) {
  const st = S.biomes[b.id], r = seeded(b.id + 'm');
  const sp = SPECIES[b.starterKey];
  let mini = '';
  for (let i = 0; i < 6; i++) mini += `<span class="md" style="left:${i * 17 + r() * 6}%;animation-delay:${-r() * 3}s;font-size:${24 + r() * 14}px">${b.decor[Math.floor(r() * b.decor.length)]}</span>`;
  const shownAnimals = st.unlocked ? [...new Set(st.animals.map(a => SPECIES[a.sp].emoji))].slice(0, 5) : [sp.emoji];
  shownAnimals.forEach((e, i) => { mini += `<span class="ma" style="left:${8 + i * 16}%;--d:${30 + r() * 60}px;animation-duration:${6 + r() * 6}s;animation-delay:${-r() * 6}s"><span>${e}</span></span>`; });
  mini += `<span class="big-ic">${b.icon}</span>`;
  const s = st.stats;
  const affordable = !st.unlocked && S.money >= b.cost;
  return `<div class="mcard ${st.unlocked ? '' : 'locked'} ${affordable ? 'affordable' : ''}" data-id="${b.id}" style="--sky1:${b.sky[0]};--sky2:${b.sky[1]};--g1:${b.ground[0]};--g2:${b.ground[1]}">
    <div class="mini">${mini}${st.unlocked ? '' : '<div class="lock">🔒</div>'}</div>
    <div class="mbody"><h3>${b.icon} ${b.name}</h3>
    ${st.unlocked ? `<div class="mstats"><span>🐾 ${st.animals.length}</span><span>👥 ${fmt(s.visits)}/day</span><span>💰 ${money(s.revenue)}/day</span><span>🏆 ${money(s.totalRevenue)} total</span></div>`
      : `<div class="muted" style="font-size:12px;font-weight:600;margin-top:4px">${b.desc}</div><div class="row" style="margin-top:8px"><span class="tag">Starter: ${sp.emoji} ${b.starter}</span><span class="spacer"></span><button class="btn sm ${affordable ? 'gold' : ''}" data-unlock="1" data-cost="${b.cost}">🔓 ${money(b.cost)}</button></div>`}
    ${st.unlocked && shop ? '<div class="row" style="margin-top:8px"><span class="tag t3">✅ Open</span></div>' : ''}</div></div>`;
}

/* ---------- Canvas charts ---------- */
function setupCanvas(c) {
  const dpr = window.devicePixelRatio || 1, w = c.clientWidth || 300, h = c.clientHeight || 220;
  c.width = w * dpr; c.height = h * dpr;
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  return { ctx, w, h };
}
function niceAxis(max) { if (max <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(max))); const n = max / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
function drawAxes(ctx, w, h, pad, maxY, labels, fmtY) {
  ctx.font = '600 11px Nunito, sans-serif'; ctx.fillStyle = '#9a9a88'; ctx.strokeStyle = '#eee4c8'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (h - pad.t - pad.b) * (1 - i / 4);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillText(fmtY(maxY * i / 4), pad.l - 6, y + 4);
  }
  ctx.textAlign = 'center';
  const n = labels.length, step = Math.max(1, Math.ceil(n / 8));
  for (let i = 0; i < n; i += step) { const x = pad.l + (w - pad.l - pad.r) * (n === 1 ? .5 : i / (n - 1)); ctx.fillText('D' + labels[i], x, h - 6); }
}
function lineChart(c, labels, series) {
  if (!c) return;
  const { ctx, w, h } = setupCanvas(c), pad = { l: 52, r: 10, t: 10, b: 22 };
  if (!labels.length) { ctx.font = '700 14px Nunito'; ctx.fillStyle = '#aaa'; ctx.textAlign = 'center'; ctx.fillText('Simulate a few days to see data 📈', w / 2, h / 2); return; }
  const vals = series.flatMap(s => s.data.filter(v => v != null));
  const minV = Math.min(0, ...vals);
  const maxY = niceAxis(Math.max(1, ...vals));
  drawAxes(ctx, w, h, pad, maxY, labels, v => fmt(v));
  const X = i => pad.l + (w - pad.l - pad.r) * (labels.length === 1 ? .5 : i / (labels.length - 1));
  const Y = v => pad.t + (h - pad.t - pad.b) * (1 - (Math.max(minV, v) / maxY));
  for (const s of series) {
    ctx.beginPath(); let started = false, lastX = 0;
    s.data.forEach((v, i) => { if (v == null) return; const x = X(i), y = Y(v); if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y); lastX = x; });
    ctx.strokeStyle = s.color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
    if (s.fill && started) {
      ctx.lineTo(lastX, Y(0)); ctx.lineTo(X(s.data.findIndex(v => v != null)), Y(0)); ctx.closePath();
      const g = ctx.createLinearGradient(0, pad.t, 0, h - pad.b); g.addColorStop(0, s.color + '55'); g.addColorStop(1, s.color + '05');
      ctx.fillStyle = g; ctx.fill();
    }
    const li = s.data.length - 1; if (s.data[li] != null) { ctx.beginPath(); ctx.arc(X(li), Y(s.data[li]), 4, 0, 7); ctx.fillStyle = s.color; ctx.fill(); }
  }
}
function barChart(c, labels, data, color) {
  if (!c) return;
  const { ctx, w, h } = setupCanvas(c), pad = { l: 46, r: 10, t: 10, b: 22 };
  if (!labels.length) { ctx.font = '700 14px Nunito'; ctx.fillStyle = '#aaa'; ctx.textAlign = 'center'; ctx.fillText('No visits yet 👣', w / 2, h / 2); return; }
  const maxY = niceAxis(Math.max(1, ...data));
  drawAxes(ctx, w, h, pad, maxY, labels, v => fmt(v));
  const bw = (w - pad.l - pad.r) / labels.length;
  data.forEach((v, i) => {
    const bh = (h - pad.t - pad.b) * v / maxY;
    ctx.fillStyle = color;
    const x = pad.l + i * bw + bw * .15, y = h - pad.b - bh;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, bw * .7, bh, [3, 3, 0, 0]) : ctx.rect(x, y, bw * .7, bh); ctx.fill();
  });
}
