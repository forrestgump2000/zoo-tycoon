/* Zoo Tycoon 3D — simulation engine (no DOM / no three.js) */
'use strict';

const SAVE_KEY = 'zooTycoon3D_v2';
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const Bus = {
  h: {},
  on(e, f) { (this.h[e] = this.h[e] || []).push(f); },
  emit(e, ...a) { (this.h[e] || []).forEach(f => { try { f(...a); } catch (err) { console.error(err); } }); },
};

let S = null;

function newStats() {
  return { visits: 0, revenue: 0, expenses: 0, tickets: 0, food: 0, gift: 0, rides: 0, appeal: 0, sat: 0,
    totalVisits: 0, totalRevenue: 0, totalExpenses: 0, history: [] };
}
function newBiomeState() { return { unlocked: false, animals: [], facilities: [], stats: newStats(), unlockedDay: 0 }; }

function newGame(zooName) {
  S = {
    v: 2, zooName: zooName || 'Sprout Valley Zoo', day: 1, money: 1000, reputation: 45, ticketPrice: 4,
    speed: 1, paused: false, askNames: true, nextId: 1,
    gate: 0, parking: 0, marketing: [], effects: [], escapes: [],
    weather: 'sunny', event: null, lastVisitors: 0,
    biomes: {}, history: [], log: [],
    totals: { visitors: 0, revenue: 0, births: 0, animalsBought: 0, rareEvents: 0 },
    started: Date.now(),
  };
  for (const b of BIOMES) S.biomes[b.id] = newBiomeState();
  unlockBiome('forest', true);
  addFacility('forest', 'keeper', 0, true);
  log('Welcome to ' + S.zooName + '! Your humble forest and its two deer await visitors.', 'party');
  return S;
}

function save() {
  if (typeof window !== 'undefined' && window.__noSave) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ }
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || !d.biomes) return false;
    S = d;
    for (const b of BIOMES) if (!S.biomes[b.id]) S.biomes[b.id] = newBiomeState();
    S.effects = S.effects || []; S.escapes = S.escapes || [];
    S.totals.rareEvents = S.totals.rareEvents || 0;
    for (const b of BIOMES) S.biomes[b.id].animals = S.biomes[b.id].animals.filter(a => SPECIES[a.sp]);
    return true;
  } catch (e) { return false; }
}
function wipeSave() { if (typeof window !== 'undefined') window.__noSave = true; try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }

function uid() { return S.nextId++; }
function log(msg, icon = 'info') { S.log.unshift({ day: S.day, msg, icon }); if (S.log.length > 120) S.log.length = 120; }
function randomName() { return pick(NAMES) + pick(NAME_SUFFIX); }
function season(day = S.day) { return SEASONS[Math.floor(((day - 1) % 120) / 30)]; }
function canAfford(c) { return S.money >= c; }
function spend(c) { S.money -= c; Bus.emit('money', -c); }
function effect(type, biome) { return S.effects.find(e => e.type === type && (!biome || !e.biome || e.biome === biome)); }

/* ---------- Biomes ---------- */
function unlockBiome(id, free) {
  const b = BIOME_BY_ID[id], st = S.biomes[id];
  if (st.unlocked) return false;
  if (!free) { if (!canAfford(b.cost)) return false; spend(b.cost); }
  st.unlocked = true; st.unlockedDay = S.day;
  addFacility(id, 'enclosure', 0, true);
  addFacility(id, 'restroom', 0, true);
  addFacility(id, 'food', 0, true);
  const sp = SPECIES[b.starterKey];
  makeAnimal(id, b.starterKey, 'common', 'M', sp.adultAge + 5, 75, { name: randomName() });
  makeAnimal(id, b.starterKey, 'common', 'F', sp.adultAge + 3, 75, { name: randomName() });
  if (!free) { log(`Opened ${b.name}! Two ${sp.name}s moved in.`, 'map'); Bus.emit('unlock', id); }
  Bus.emit('worldChanged', id);
  return true;
}

/* ---------- Animals ---------- */
function makeAnimal(biomeId, spKey, variant, sex, age, happy, opts = {}) {
  const a = {
    id: uid(), sp: spKey, v: variant, sex, age: Math.round(age), happy,
    name: opts.name || randomName(), ped: !!opts.ped, from: opts.from || 'starter',
    cd: 0, born: S.day - Math.round(age), parents: opts.parents || null, trick: false,
  };
  S.biomes[biomeId].animals.push(a);
  return a;
}
function biomeCapacity(id) {
  return S.biomes[id].facilities.filter(f => f.type === 'enclosure').reduce((s, f) => s + FAC.enclosure.levels[f.level].cap, 0);
}
function freeSpace(id) { return biomeCapacity(id) - S.biomes[id].animals.length; }
function bulkDiscount(q) { for (const [n, d] of BULK) if (q >= n) return d; return 0; }

function quoteAnimals(spKey, variant, companyId, qty) {
  const sp = SPECIES[spKey], c = COMPANY_BY_ID[companyId];
  const unit = Math.round(speciesBaseCost(sp, variant) * c.mult);
  const disc = bulkDiscount(qty);
  return { unit, disc, total: Math.round(unit * qty * (1 - disc)) };
}

function buyAnimals(biomeId, spKey, variant, companyId, qty, sexMode) {
  const q = quoteAnimals(spKey, variant, companyId, qty);
  if (qty < 1) return { ok: false, why: 'Choose a quantity.' };
  if (freeSpace(biomeId) < qty) return { ok: false, why: 'Not enough enclosure space! Build or upgrade enclosures.' };
  if (!canAfford(q.total)) return { ok: false, why: 'Not enough money.' };
  spend(q.total);
  const c = COMPANY_BY_ID[companyId], sp = SPECIES[spKey];
  const existing = S.biomes[biomeId].animals.filter(a => a.sp === spKey);
  let males = existing.filter(a => a.sex === 'M').length, females = existing.length - males;
  const made = [];
  for (let i = 0; i < qty; i++) {
    let sex;
    if (sexMode === 'M') sex = 'M'; else if (sexMode === 'F') sex = 'F'; else sex = males <= females ? 'M' : 'F';
    if (sex === 'M') males++; else females++;
    const age = Math.min(rint(c.age[0], c.age[1]), sp.lifespan - 25);
    made.push(makeAnimal(biomeId, spKey, variant, sex, age, c.happy + rint(-5, 5), { ped: c.pedigree, from: c.id }));
  }
  if (c.rep) S.reputation = clamp(S.reputation + c.rep * qty, 0, 100);
  S.totals.animalsBought += qty;
  log(`${qty}x ${displayName(sp, variant)} arrived from ${c.name}.`, 'truck');
  Bus.emit('animalsChanged', biomeId, made.map(a => a.id));
  return { ok: true, made, total: q.total };
}

function animalValue(a) {
  const sp = SPECIES[a.sp];
  const lifeLeft = clamp(1 - a.age / sp.lifespan, .1, 1);
  return Math.round(speciesBaseCost(sp, a.v) * .4 * lifeLeft * (a.ped ? 1.4 : 1));
}
function removeAnimal(biomeId, id) {
  const st = S.biomes[biomeId], i = st.animals.findIndex(a => a.id === id);
  if (i < 0) return null;
  const [a] = st.animals.splice(i, 1);
  S.escapes = S.escapes.filter(e => e.id !== id);
  return a;
}
function sellAnimal(biomeId, id) {
  const a = removeAnimal(biomeId, id); if (!a) return 0;
  const val = animalValue(a);
  S.money += val; Bus.emit('money', val);
  log(`Sold ${a.name} the ${SPECIES[a.sp].name} for $${fmt(val)}.`, 'coins');
  Bus.emit('animalsChanged', biomeId);
  return val;
}
function findAnimal(id) {
  for (const b of BIOMES) { const a = S.biomes[b.id].animals.find(x => x.id === id); if (a) return [b.id, a]; }
  return [null, null];
}
function lifeStage(a) {
  const sp = SPECIES[a.sp];
  if (a.age < sp.adultAge * .5) return 'Baby';
  if (a.age < sp.adultAge) return 'Juvenile';
  if (a.age > sp.lifespan * .8) return 'Senior';
  return 'Adult';
}
function animalAppeal(a) {
  const sp = SPECIES[a.sp];
  let v = speciesAttr(sp, a.v) * (.5 + a.happy / 100);
  if (a.age < sp.adultAge * .6) v *= 1.3;
  if (a.ped) v *= 1.2;
  if (a.trick) v *= 1.5;
  if (S.escapes.some(e => e.id === a.id)) v *= .2;
  return v;
}

/* ---------- Facilities ---------- */
function facCount(biomeId, type) { return S.biomes[biomeId].facilities.filter(f => f.type === type).length; }
function addFacility(biomeId, type, level = 0, free) {
  const def = FAC[type];
  if (facCount(biomeId, type) >= def.max) return { ok: false, why: `Max ${def.max} ${def.label.toLowerCase()} here.` };
  const L = facLevel(type, level, biomeId);
  if (!free) { if (!canAfford(L.cost)) return { ok: false, why: 'Not enough money.' }; spend(L.cost); }
  const f = { id: uid(), type, level, built: S.day };
  if (type === 'mascot') f.name = BIOME_BY_ID[biomeId].mascot;
  if (type === 'keeper') f.name = pick(KEEPER_NAMES);
  S.biomes[biomeId].facilities.push(f);
  if (!free) log(`Built ${L.name} in ${BIOME_BY_ID[biomeId].name}.`, 'hammer');
  Bus.emit('worldChanged', biomeId);
  return { ok: true, f };
}
function upgradeCost(type, level) { const next = FAC[type].levels[level + 1]; return next ? Math.round(next.cost * .8) : null; }
function upgradeFacility(biomeId, fid) {
  const f = S.biomes[biomeId].facilities.find(x => x.id === fid);
  if (!f) return { ok: false };
  const c = upgradeCost(f.type, f.level);
  if (c == null) return { ok: false, why: 'Already max level!' };
  if (!canAfford(c)) return { ok: false, why: 'Not enough money.' };
  spend(c); f.level++;
  const L = facLevel(f.type, f.level, biomeId);
  log(`Upgraded to ${L.name} in ${BIOME_BY_ID[biomeId].name}.`, 'up');
  Bus.emit('worldChanged', biomeId);
  return { ok: true, f };
}
function demolishFacility(biomeId, fid, silent) {
  const st = S.biomes[biomeId], i = st.facilities.findIndex(x => x.id === fid);
  if (i < 0) return { ok: false };
  const f = st.facilities[i];
  if (f.type === 'enclosure' && !silent) {
    const capAfter = biomeCapacity(biomeId) - FAC.enclosure.levels[f.level].cap;
    if (capAfter < st.animals.length) return { ok: false, why: 'Animals live there! Move or sell them first.' };
  }
  const L = facLevel(f.type, f.level, biomeId);
  const refund = silent ? 0 : Math.round(L.cost * .25);
  st.facilities.splice(i, 1);
  if (refund) { S.money += refund; Bus.emit('money', refund); }
  Bus.emit('worldChanged', biomeId);
  return { ok: true, refund, f };
}

/* ---------- Park upgrades ---------- */
function upgradeGate() {
  const n = GATES[S.gate + 1]; if (!n) return { ok: false, why: 'Max level' };
  if (!canAfford(n.cost)) return { ok: false, why: 'Not enough money.' };
  spend(n.cost); S.gate++; S.reputation = clamp(S.reputation + n.rep, 0, 100);
  log(`Entrance upgraded to ${n.name}!`, 'gate'); Bus.emit('worldChanged', 'park'); return { ok: true };
}
function upgradeParking() {
  const n = PARKING[S.parking + 1]; if (!n) return { ok: false, why: 'Max level' };
  if (!canAfford(n.cost)) return { ok: false, why: 'Not enough money.' };
  spend(n.cost); S.parking++;
  log(`Parking upgraded to ${n.name} (${fmt(n.cap)} visitors/day).`, 'car'); Bus.emit('worldChanged', 'park'); return { ok: true };
}
function runMarketing(id) {
  const m = MARKETING.find(x => x.id === id);
  if (S.marketing.some(x => x.id === id)) return { ok: false, why: 'That campaign is already running.' };
  if (!canAfford(m.cost)) return { ok: false, why: 'Not enough money.' };
  spend(m.cost); S.marketing.push({ id, until: S.day + m.days });
  log(`Launched ${m.name}: +${Math.round(m.boost * 100)}% visitors for ${m.days} days.`, m.icon);
  return { ok: true };
}
function marketingBoost() { return S.marketing.reduce((s, x) => s + MARKETING.find(m => m.id === x.id).boost, 0); }

/* ---------- Derived per-biome numbers ---------- */
function biomeInfo(id) {
  const st = S.biomes[id];
  const fac = type => st.facilities.filter(f => f.type === type).map(f => facLevel(type, f.level, id));
  const enc = fac('enclosure'), keepers = effect('strike') ? [] : fac('keeper'), mascots = fac('mascot');
  const cap = enc.reduce((s, L) => s + L.cap, 0);
  const n = st.animals.length;
  const handles = keepers.reduce((s, L) => s + L.handles, 0);
  const coverage = n ? Math.min(1, handles / n) : 1;
  const encHappy = enc.length ? enc.reduce((s, L) => s + L.happy * L.cap, 0) / Math.max(1, cap) : 0;
  const keeperHappy = keepers.length ? Math.max(...keepers.map(L => L.happy)) : 0;
  const vet = keepers.some(L => L.breed);
  const crowd = cap ? Math.max(0, n / cap - 1) : (n ? 1 : 0);
  const targetHappy = clamp(55 + encHappy + keeperHappy - 45 * (1 - coverage) - Math.min(45, crowd * 90), 5, 100);
  const distinct = new Set(st.animals.map(a => a.sp)).size;
  let appeal = st.animals.reduce((s, a) => s + animalAppeal(a), 0);
  appeal *= 1 + Math.min(1, distinct * .04);
  const facAppeal = st.facilities.reduce((s, f) => s + (facLevel(f.type, f.level, id).appeal || 0), 0);
  const mascotBoost = mascots.reduce((s, L) => s + L.boost, 0);
  appeal = (appeal + facAppeal) * (1 + mascotBoost);
  const ghost = effect('ghost', id); if (ghost) appeal *= ghost.mult;
  const avgHappy = n ? st.animals.reduce((s, a) => s + a.happy, 0) / n : 0;
  return { cap, n, handles, coverage, targetHappy, distinct, appeal, avgHappy, vet, crowd, mascotBoost };
}
function fairPrice(totalAppeal) { return 4 + Math.pow(Math.max(0, totalAppeal), .42); }

/* ---------- Weather & common events ---------- */
function rollWeather() {
  const s = season(), r = Math.random();
  if (s.name === 'Winter') return r < .35 ? 'snowy' : r < .6 ? 'cloudy' : r < .7 ? 'stormy' : 'sunny';
  if (s.name === 'Summer') return r < .12 ? 'heat' : r < .2 ? 'stormy' : r < .32 ? 'rainy' : r < .5 ? 'cloudy' : 'sunny';
  return r < .2 ? 'rainy' : r < .27 ? 'stormy' : r < .5 ? 'cloudy' : 'sunny';
}
const EVENTS = [
  { id: 'school', w: 4, icon: 'bus', text: 'A school field trip arrived!', mult: 1.4 },
  { id: 'celebrity', w: 1, icon: 'star', text: 'A celebrity visited and posted about your zoo!', mult: 1.9, rep: 3 },
  { id: 'news', w: 2, icon: 'news', text: 'The local news featured your zoo.', mult: 1.2, rep: 2 },
  { id: 'donation', w: 2, icon: 'gift', text: 'A generous fan made a donation!', donation: true },
  { id: 'holiday', w: 2, icon: 'party', text: 'Public holiday! Families flock to the zoo.', mult: 1.5 },
  { id: 'inspection', w: 1, icon: 'clipboard', text: 'Health inspectors visited.', inspection: true },
  { id: 'festival', w: 1, icon: 'tent', text: 'A town festival nearby is drawing crowds away.', mult: .8 },
];
function rollEvent() {
  if (Math.random() > .08 || S.day < 4) return null;
  let t = EVENTS.reduce((s, e) => s + e.w, 0), r = Math.random() * t;
  for (const e of EVENTS) { r -= e.w; if (r <= 0) return e; }
  return null;
}

/* ---------- VERY RARE events ----------
   Each has a tiny daily chance. They change the game state here and are acted out in the 3D world. */
function unlockedIds() { return BIOMES.filter(b => S.biomes[b.id].unlocked).map(b => b.id); }
function allAnimals() { return unlockedIds().flatMap(id => S.biomes[id].animals.map(a => [id, a])); }
const RARE_FAC = f => !['enclosure', 'keeper', 'mascot'].includes(f.type);

const RARE_EVENTS = [
  { id: 'keeperQuit', p: .006, title: 'A Zookeeper Quit!', icon: 'door',
    can() { return unlockedIds().some(id => S.biomes[id].facilities.some(f => f.type === 'keeper')); },
    run() {
      const id = pick(unlockedIds().filter(id => S.biomes[id].facilities.some(f => f.type === 'keeper')));
      const k = pick(S.biomes[id].facilities.filter(f => f.type === 'keeper'));
      const L = FAC.keeper.levels[k.level];
      demolishFacility(id, k.id, true);
      return { biome: id, facId: k.id, keeperLevel: k.level, text: `${k.name || 'A keeper'} (${L.name}) in ${BIOME_BY_ID[id].name} handed in their badge ${pick(QUIT_REASONS)}. Hire a replacement!`, bad: true };
    } },
  { id: 'eaten', p: .004, title: 'Circle of Life...', icon: 'skull',
    pairs() {
      const out = [];
      for (const id of unlockedIds()) {
        const an = S.biomes[id].animals;
        for (const pred of an) {
          const ps = SPECIES[pred.sp]; if (!ps.predator || lifeStage(pred) === 'Baby') continue;
          for (const prey of an) {
            const qs = SPECIES[prey.sp];
            if (prey !== pred && !qs.mythic && prey.sp !== pred.sp && (qs.tier < ps.tier || (lifeStage(prey) === 'Baby' && qs.tier <= ps.tier))) out.push([id, pred, prey]);
          }
        }
      }
      return out;
    },
    can() { return this.pairs().length > 0; },
    run() {
      const [id, pred, prey] = pick(this.pairs());
      removeAnimal(id, prey.id);
      S.reputation = clamp(S.reputation - 4, 0, 100);
      pred.happy = clamp(pred.happy + 15, 0, 100);
      return { biome: id, predId: pred.id, preyId: prey.id, preySp: prey.sp, preyV: prey.v, text: `${pred.name} the ${SPECIES[pred.sp].name} ate ${prey.name} the ${SPECIES[prey.sp].name}! Visitors were horrified. Maybe keep predators and prey apart...`, bad: true };
    } },
  { id: 'escape', p: .007, title: 'ANIMAL ESCAPE!', icon: 'run',
    pool() { return allAnimals().filter(([id, a]) => id !== 'aquarium' && !S.escapes.some(e => e.id === a.id)); },
    can() { return this.pool().length > 0; },
    run() {
      const [id, a] = pick(this.pool());
      S.escapes.push({ id: a.id, biome: id, day: S.day });
      S.reputation = clamp(S.reputation - 3, 0, 100);
      return { biome: id, animalId: a.id, text: `${a.name} the ${SPECIES[a.sp].name} broke out of the enclosure and is running loose around the zoo! Click it in the world to catch it.`, bad: true };
    } },
  { id: 'megaLitter', p: .004, title: 'Baby Boom!', icon: 'baby',
    can() { return allAnimals().some(([, a]) => a.sex === 'F' && lifeStage(a) === 'Adult' && !SPECIES[a.sp].mythic); },
    run() {
      const [id, mom] = pick(allAnimals().filter(([, a]) => a.sex === 'F' && lifeStage(a) === 'Adult' && !SPECIES[a.sp].mythic));
      const n = rint(8, 16), babies = [];
      for (let i = 0; i < n; i++) {
        const b = makeAnimal(id, mom.sp, mom.v, Math.random() < .5 ? 'M' : 'F', 0, 90, { from: 'born', parents: [mom.name, 'unknown'] });
        babies.push(b.id); S.totals.births++;
      }
      return { biome: id, animalId: mom.id, babies, text: `${mom.name} the ${SPECIES[mom.sp].name} just had ${n} babies at once! The keepers are exhausted (and they may need more space).`, good: true };
    } },
  { id: 'humanFall', p: .004, title: 'Visitor in the Enclosure!', icon: 'alert',
    can() { return unlockedIds().some(id => S.biomes[id].animals.length > 0); },
    run() {
      const id = pick(unlockedIds().filter(id => S.biomes[id].animals.length > 0));
      const danger = S.biomes[id].animals.some(a => SPECIES[a.sp].predator);
      const fine = danger ? Math.round(500 + S.lastVisitors * 4) : 0;
      S.money -= fine;
      S.reputation = clamp(S.reputation - (danger ? 7 : 3), 0, 100);
      return { biome: id, danger, text: danger ? `A visitor climbed into the ${BIOME_BY_ID[id].name} enclosure with the predators! Keepers rescued them just in time. Legal fees: $${fmt(fine)}.` : `A visitor climbed into an enclosure in ${BIOME_BY_ID[id].name} for a selfie. The animals were very confused. Keepers escorted them out.`, bad: true };
    } },
  { id: 'trick', p: .006, title: 'A Star Is Born', icon: 'sparkle',
    can() { return allAnimals().some(([, a]) => !a.trick); },
    run() { const [id, a] = pick(allAnimals().filter(([, a]) => !a.trick)); a.trick = true; return { biome: id, animalId: a.id, text: `${a.name} the ${SPECIES[a.sp].name} learned an amazing trick! Their appeal is permanently +50%.`, good: true }; } },
  { id: 'viral', p: .004, title: 'Gone Viral!', icon: 'phone',
    can() { return allAnimals().length > 0; },
    run() { const [id, a] = pick(allAnimals()); S.effects.push({ type: 'viral', until: S.day + 3, mult: 2.5 }); return { biome: id, animalId: a.id, text: `A video of ${a.name} the ${SPECIES[a.sp].name} got 40 million views! Visitors x2.5 for 3 days.`, good: true }; } },
  { id: 'royal', p: .003, title: 'Royal Visit', icon: 'crown',
    can() { return S.reputation > 55; },
    run() { const d = Math.round(5000 + Math.max(0, S.money) * .05); S.money += d; S.reputation = clamp(S.reputation + 5, 0, 100); return { text: `Royalty toured your zoo in a golden carriage and left a donation of $${fmt(d)}!`, good: true }; } },
  { id: 'lightning', p: .02, title: 'Lightning Strike!', icon: 'storm',
    can() { return S.weather === 'stormy' && unlockedIds().some(id => S.biomes[id].facilities.some(RARE_FAC)); },
    run() {
      const id = pick(unlockedIds().filter(id => S.biomes[id].facilities.some(RARE_FAC)));
      const f = pick(S.biomes[id].facilities.filter(RARE_FAC));
      const L = facLevel(f.type, f.level, id);
      demolishFacility(id, f.id, true);
      return { biome: id, text: `Lightning struck the ${L.name} in ${BIOME_BY_ID[id].name} and burned it to the ground!`, bad: true };
    } },
  { id: 'poison', p: .004, title: 'Food Poisoning', icon: 'sick',
    can() { return unlockedIds().some(id => S.biomes[id].facilities.some(f => f.type === 'food')); },
    run() { const id = pick(unlockedIds().filter(id => S.biomes[id].facilities.some(f => f.type === 'food'))); S.effects.push({ type: 'foodClosed', biome: id, until: S.day + 2 }); S.reputation = clamp(S.reputation - 4, 0, 100); return { biome: id, text: `Dodgy hot dogs! Food in ${BIOME_BY_ID[id].name} is shut down by inspectors for 2 days.`, bad: true }; } },
  { id: 'rainbowBaby', p: .002, title: 'Miracle Birth', icon: 'rainbow',
    can() { return allAnimals().some(([, a]) => a.sex === 'F' && lifeStage(a) === 'Adult'); },
    run() { const [id, mom] = pick(allAnimals().filter(([, a]) => a.sex === 'F' && lifeStage(a) === 'Adult')); const b = makeAnimal(id, mom.sp, 'rainbow', Math.random() < .5 ? 'M' : 'F', 0, 95, { from: 'born', parents: [mom.name, 'a mysterious stranger'] }); S.totals.births++; return { biome: id, animalId: b.id, babies: [b.id], text: `${mom.name} gave birth to a shimmering RAINBOW baby ${SPECIES[mom.sp].name}! Scientists are baffled.`, good: true }; } },
  { id: 'egg', p: .0008, title: 'A Mysterious Egg...', icon: 'egg',
    can() { return unlockedIds().length > 0; },
    run() {
      const id = pick(unlockedIds());
      const myth = BIOME_BY_ID[id].speciesKeys.filter(k => SPECIES[k].mythic);
      if (!myth.length) return null;
      const key = pick(myth);
      const a = makeAnimal(id, key, 'common', Math.random() < .5 ? 'M' : 'F', 0, 99, { from: 'born', parents: ['the egg', 'destiny'] });
      return { biome: id, animalId: a.id, babies: [a.id], text: `A glowing egg appeared in ${BIOME_BY_ID[id].name} overnight... and hatched into a baby ${SPECIES[key].name}! (Worth millions!)`, good: true };
    } },
  { id: 'ghost', p: .003, title: 'Ghost Sighting', icon: 'ghost',
    can() { return S.biomes.nocturnal.unlocked; },
    run() { S.effects.push({ type: 'ghost', biome: 'nocturnal', until: S.day + 3, mult: 1.8 }); return { biome: 'nocturnal', text: 'Guests swear they saw a ghost in the Nocturnal House. Ghost hunters are flooding in (+80% appeal for 3 days)!', good: true }; } },
  { id: 'pickpocket', p: .004, title: 'Cash Register Heist', icon: 'mask',
    can() { return S.money > 2000; },
    run() { const amt = Math.round(S.money * rnd(.03, .08)); S.money -= amt; return { text: `A sneaky thief in a fake mustache emptied the ticket booth: -$${fmt(amt)}!`, bad: true }; } },
  { id: 'fight', p: .005, title: 'Animal Brawl', icon: 'fight',
    can() { return unlockedIds().some(id => S.biomes[id].animals.length >= 2); },
    run() { const id = pick(unlockedIds().filter(id => S.biomes[id].animals.length >= 2)); const an = S.biomes[id].animals; const a = pick(an), b = pick(an.filter(x => x !== a)); a.happy = clamp(a.happy - 25, 0, 100); b.happy = clamp(b.happy - 25, 0, 100); return { biome: id, animalId: a.id, otherId: b.id, text: `${a.name} and ${b.name} got into a huge scuffle in ${BIOME_BY_ID[id].name}. Both are sulking now.`, bad: true }; } },
  { id: 'meteor', p: .0008, title: 'Meteorite!', icon: 'meteor',
    can() { return true; },
    run() { S.meteor = (S.meteor || 0) + 1; S.reputation = clamp(S.reputation + 6, 0, 100); return { text: 'A meteorite crashed into the zoo! Nobody was hurt and the glowing crater is now a permanent attraction (+60 appeal).', good: true }; } },
  { id: 'strike', p: .003, title: 'Staff Strike!', icon: 'sign',
    can() { return unlockedIds().some(id => S.biomes[id].facilities.some(f => f.type === 'keeper')); },
    run() { S.effects.push({ type: 'strike', until: S.day + 2 }); return { text: 'Your keepers are on strike demanding better coffee! Animals will be unattended for 2 days.', bad: true }; } },
  { id: 'lottery', p: .0015, title: 'Lottery Jackpot!', icon: 'coins',
    can() { return true; },
    run() { const w = rint(20, 120) * 1000; S.money += w; return { text: `The zoo's office lottery pool won $${fmt(w)}!`, good: true }; } },
  { id: 'ufo', p: .0008, title: 'Close Encounter', icon: 'ufo',
    can() { return allAnimals().some(([, a]) => a.v !== 'golden'); },
    run() { const [id, a] = pick(allAnimals().filter(([, a]) => a.v !== 'golden')); a.v = 'golden'; return { biome: id, animalId: a.id, text: `A UFO beamed up ${a.name} the ${SPECIES[a.sp].name} at midnight... and returned them GOLDEN by morning!`, good: true }; } },
  { id: 'proposal', p: .006, title: 'Wedding Proposal', icon: 'ring',
    can() { return unlockedIds().length > 0; },
    run() { const id = pick(unlockedIds()); S.reputation = clamp(S.reputation + 2, 0, 100); return { biome: id, text: `Someone proposed in front of the ${BIOME_BY_ID[id].name} enclosure. They said yes! The animals approve.`, good: true }; } },
];

function finishRare(ev, r) {
  r.type = ev.id; r.title = ev.title; r.icon = ev.icon;
  S.totals.rareEvents++;
  log(`${ev.title} ${r.text}`, ev.icon);
  return r;
}
function rollRareEvents() {
  for (const ev of RARE_EVENTS) {
    if (Math.random() < ev.p && ev.can()) { const r = ev.run(); if (r) return [finishRare(ev, r)]; }
  }
  return [];
}
function forceRareEvent(id) {
  const ev = RARE_EVENTS.find(e => e.id === id);
  if (!ev || !ev.can()) return null;
  const r = ev.run(); return r ? finishRare(ev, r) : null;
}
function captureEscapee(id) {
  const e = S.escapes.find(x => x.id === id); if (!e) return false;
  S.escapes = S.escapes.filter(x => x.id !== id);
  S.reputation = clamp(S.reputation + 2, 0, 100);
  const [, a] = findAnimal(id);
  if (a) log(`${a.name} was safely caught and returned home. Heroic!`, 'check');
  return true;
}

/* ---------- Day simulation ---------- */
function simulateDay() {
  const report = { day: S.day, births: [], retired: [], biomes: {}, event: null, rare: [], recaptured: [] };
  S.weather = rollWeather();
  const ev = rollEvent();
  S.event = ev ? ev.id : null;
  report.event = ev;
  for (const e of [...S.escapes]) if (S.day - e.day >= 2) { S.escapes = S.escapes.filter(x => x !== e); S.reputation = clamp(S.reputation - 2, 0, 100); report.recaptured.push(e.id); }

  const unlocked = BIOMES.filter(b => S.biomes[b.id].unlocked);
  const infos = {};
  for (const b of unlocked) {
    const st = S.biomes[b.id], info = biomeInfo(b.id);
    for (const a of st.animals) {
      a.age++;
      if (a.cd > 0) a.cd--;
      const t = info.targetHappy + (a.ped ? 5 : 0) + (S.weather === 'heat' ? -4 : 0);
      a.happy = clamp(a.happy + (t - a.happy) * .15 + rnd(-2, 2), 0, 100);
    }
    const keep = [];
    for (const a of st.animals) {
      if (a.age > SPECIES[a.sp].lifespan) { report.retired.push({ biome: b.id, a }); log(`${a.name} the ${SPECIES[a.sp].name} retired peacefully to a sanctuary.`, 'sunset'); }
      else keep.push(a);
    }
    st.animals = keep;
    if (st.animals.length < info.cap * 1.3) {
      const groups = {};
      for (const a of st.animals) (groups[a.sp] = groups[a.sp] || []).push(a);
      for (const key in groups) {
        const sp = SPECIES[key];
        const g = groups[key].filter(a => a.age >= sp.adultAge && a.age < sp.lifespan * .9 && a.happy > 50);
        const males = g.filter(a => a.sex === 'M'), females = g.filter(a => a.sex === 'F' && a.cd <= 0);
        const pairs = Math.min(males.length, females.length);
        for (let i = 0; i < pairs; i++) {
          const mom = females[i], dad = males[i % males.length];
          const p = TIER.breed[sp.tier] * (info.vet ? 1.5 : 1) * ((mom.ped || dad.ped) ? 1.3 : 1) * (.5 + (mom.happy - 50) / 50);
          if (S.biomes[b.id].animals.length >= info.cap * 1.3) break;
          if (Math.random() < p) {
            mom.cd = 22 + sp.tier * 8;
            const litter = rint(1, TIER.litter[sp.tier]);
            for (let k = 0; k < litter; k++) {
              let v = Math.random() < .5 ? mom.v : dad.v, mutated = false;
              if (Math.random() < .025) {
                const idx = VARIANTS.findIndex(x => x.id === v), rarer = VARIANTS.slice(idx + 1);
                if (rarer.length) { v = pick(rarer).id; mutated = true; }
              }
              const baby = makeAnimal(b.id, key, v, Math.random() < .5 ? 'M' : 'F', 0, 85, { ped: mom.ped && dad.ped, from: 'born', parents: [mom.name, dad.name] });
              S.totals.births++;
              report.births.push({ biome: b.id, a: baby, mutated });
              log(`${mom.name} & ${dad.name} welcomed a baby ${displayName(sp, v)}${mutated ? ' - a rare mutation!' : ''}`, 'baby');
            }
          }
        }
      }
    }
    infos[b.id] = biomeInfo(b.id);
  }

  const totalAppeal = unlocked.reduce((s, b) => s + infos[b.id].appeal, 0) + 4 + (S.meteor || 0) * 60;
  const fair = fairPrice(totalAppeal);
  const priceFactor = clamp(1.4 - .4 * S.ticketPrice / fair, .15, 1.35);
  const repFactor = .5 + S.reputation / 100;
  let mult = repFactor * priceFactor * season().mult * WEATHER[S.weather].mult * (1 + GATES[S.gate].boost) * (1 + marketingBoost());
  if (ev && ev.mult) mult *= ev.mult;
  const viral = effect('viral'); if (viral) mult *= viral.mult;
  if (S.escapes.length) mult *= .75;
  let visitors = Math.round((4 + 4 * Math.pow(totalAppeal, .85)) * mult * rnd(.9, 1.1));
  const parkCap = PARKING[S.parking].cap;
  const turnedAway = Math.max(0, visitors - parkCap);
  visitors = Math.max(0, Math.min(visitors, parkCap));
  report.visitors = visitors; report.turnedAway = turnedAway; report.fair = fair;

  const maxAppeal = Math.max(1, ...unlocked.map(b => infos[b.id].appeal));
  const visitsMap = {};
  let totalVisits = 0;
  for (const b of unlocked) {
    const p = unlocked.length === 1 ? 1 : .3 + .7 * Math.pow(infos[b.id].appeal / maxAppeal, .7);
    visitsMap[b.id] = Math.round(visitors * p);
    totalVisits += visitsMap[b.id];
  }
  let dayRevenue = 0, dayExpenses = 0, satW = 0, satSum = 0;
  for (const b of unlocked) {
    const st = S.biomes[b.id], info = infos[b.id], visits = visitsMap[b.id];
    const L = type => st.facilities.filter(f => f.type === type).map(f => facLevel(type, f.level, b.id));
    const tickets = totalVisits ? visitors * S.ticketPrice * visits / totalVisits : 0;
    const serve = (venues, demand) => {
      let rev = 0, served = 0;
      venues.sort((x, y) => y.spend - x.spend);
      for (const v of venues) { const s = Math.min(v.cap, demand - served); if (s <= 0) break; served += s; rev += s * v.spend; }
      return { rev, served };
    };
    const foodDemand = visits * (S.weather === 'heat' ? .7 : .55);
    const food = effect('foodClosed', b.id) ? { rev: 0, served: 0 } : serve(L('food'), foodDemand);
    const gift = serve(L('gift'), visits * .3);
    let rides = 0;
    for (const r of [...L('themed'), ...L('ride')]) rides += Math.min(r.cap, visits * .35) * r.fee;
    const restCap = L('restroom').reduce((s, x) => s + x.cap, 0);
    const restNeed = visits * (S.weather === 'heat' ? .6 : .45);
    const restRatio = restNeed ? Math.min(1.5, restCap / restNeed) : 1;
    const foodRatio = foodDemand ? Math.min(1, food.served / foodDemand) : 1;

    let sat = 55;
    sat += restRatio < 1 ? -(1 - restRatio) * 30 : Math.min(8, Math.max(0, ...L('restroom').map(x => x.sat)) + 2);
    sat += foodRatio < 1 ? -(1 - foodRatio) * 15 : 3;
    sat += Math.min(12, L('seating').reduce((s, x) => s + x.sat, 0));
    sat += Math.min(10, L('mascot').reduce((s, x) => s + x.sat, 0));
    sat += info.n ? (info.avgHappy - 50) * .35 : -20;
    sat += Math.min(10, (L('themed').length + L('ride').length) * 2.5);
    sat += Math.min(10, unlocked.length * 1.2);
    if (S.ticketPrice > fair) sat -= (S.ticketPrice / fair - 1) * 40;
    sat = clamp(sat, 0, 100);
    satSum += sat * Math.max(1, visits); satW += Math.max(1, visits);

    const foodCost = st.animals.reduce((s, a) => s + TIER.food[SPECIES[a.sp].tier] * (lifeStage(a) === 'Baby' ? .5 : 1), 0);
    const salaries = st.facilities.reduce((s, f) => s + (facLevel(f.type, f.level, b.id).salary || 0), 0);
    const maint = st.facilities.reduce((s, f) => s + (facLevel(f.type, f.level, b.id).maint || 0), 0);
    const exp = foodCost + salaries + maint;
    const rev = tickets + food.rev + gift.rev + rides;

    const s = st.stats;
    Object.assign(s, { visits, revenue: rev, expenses: exp, tickets, food: food.rev, gift: gift.rev, rides, appeal: info.appeal, sat, foodCost, salaries, maint, restRatio, foodRatio });
    s.totalVisits += visits; s.totalRevenue += rev; s.totalExpenses += exp;
    s.history.push({ d: S.day, v: visits, r: Math.round(rev), e: Math.round(exp), a: Math.round(info.appeal) });
    if (s.history.length > 120) s.history.shift();
    dayRevenue += rev; dayExpenses += exp;
    report.biomes[b.id] = { visits, rev, exp };
  }

  if (ev && ev.donation) { const d = Math.round(rnd(200, 600) + dayRevenue * rnd(.5, 1.5)); S.money += d; dayRevenue += d; ev.amount = d; }
  if (ev && ev.inspection) {
    const avgSat = satW ? satSum / satW : 50;
    if (avgSat > 60) { S.reputation = clamp(S.reputation + 4, 0, 100); ev.result = 'You passed with flying colors!'; }
    else { const fine = Math.round(150 + dayRevenue * .3); S.money -= fine; dayExpenses += fine; ev.result = `Fined $${fmt(fine)} for poor conditions.`; }
  }
  if (ev && ev.rep) S.reputation = clamp(S.reputation + ev.rep, 0, 100);

  const avgSat = satW ? satSum / satW : 50;
  const repTarget = clamp(avgSat + GATES[S.gate].rep, 0, 100);
  S.reputation = clamp(S.reputation + (repTarget - S.reputation) * .12, 0, 100);
  if (turnedAway > 0) S.reputation = clamp(S.reputation - Math.min(1.5, turnedAway / Math.max(1, parkCap) * 3), 0, 100);

  S.money += dayRevenue - dayExpenses;
  S.lastVisitors = visitors;
  S.totals.visitors += visitors; S.totals.revenue += dayRevenue;
  S.history.push({ d: S.day, v: visitors, r: Math.round(dayRevenue), e: Math.round(dayExpenses), m: Math.round(S.money), rep: Math.round(S.reputation), sat: Math.round(avgSat) });
  if (S.history.length > 365) S.history.shift();
  report.revenue = dayRevenue; report.expenses = dayExpenses; report.sat = avgSat; report.totalAppeal = totalAppeal;

  if (ev) log(`${ev.text}${ev.amount ? ' +$' + fmt(ev.amount) : ''}${ev.result ? ' ' + ev.result : ''}`, ev.icon);
  if (turnedAway > 20 && S.day % 5 === 0) log(`Parking full! ${fmt(turnedAway)} visitors were turned away. Upgrade parking in the Shop.`, 'car');
  S.marketing = S.marketing.filter(m => m.until > S.day);
  S.effects = S.effects.filter(e => e.until > S.day);

  report.rare = S.day > 6 ? rollRareEvents() : [];

  S.day++;
  if (S.money < -5000 && !S.bankruptWarned) { S.bankruptWarned = true; log('Deep in debt! Sell animals or cut staff before the bank calls.', 'alert'); }
  if (S.money >= 0) S.bankruptWarned = false;
  return report;
}

/* ---------- Formatting ---------- */
function fmt(n) {
  n = Math.round(n);
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e5) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString('en-US');
}
function money(n) { return (n < 0 ? '-$' : '$') + fmt(Math.abs(n)); }
