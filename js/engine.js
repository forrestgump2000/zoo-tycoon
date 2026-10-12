/* Zoo Tycoon — simulation engine */
'use strict';

const SAVE_KEY = 'zooTycoonSave_v1';
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const Bus = {
  h: {},
  on(e, f) { (this.h[e] = this.h[e] || []).push(f); },
  emit(e, ...a) { (this.h[e] || []).forEach(f => f(...a)); },
};

let S = null;

function newStats() {
  return { visits: 0, revenue: 0, expenses: 0, tickets: 0, food: 0, gift: 0, rides: 0, appeal: 0, sat: 0,
    totalVisits: 0, totalRevenue: 0, totalExpenses: 0, history: [] };
}

function newBiomeState() {
  return { unlocked: false, animals: [], facilities: [], stats: newStats(), unlockedDay: 0 };
}

function newGame(zooName) {
  S = {
    v: 1, zooName: zooName || 'Sprout Valley Zoo', day: 1, money: 1000, reputation: 45, ticketPrice: 4,
    speed: 1, paused: false, askNames: true, nextId: 1,
    gate: 0, parking: 0, marketing: [],
    weather: 'sunny', event: null, lastVisitors: 0,
    biomes: {}, history: [], log: [],
    totals: { visitors: 0, revenue: 0, births: 0, animalsBought: 0 },
    started: Date.now(),
  };
  for (const b of BIOMES) S.biomes[b.id] = newBiomeState();
  unlockBiome('forest', true);
  addFacility('forest', 'keeper', 0, true);
  log('🎉 Welcome to ' + S.zooName + '! Your humble forest and its two deer await visitors.');
  return S;
}

function save() {
  if (typeof window !== "undefined" && window.__noSave) return;
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
    return true;
  } catch (e) { return false; }
}
function wipeSave() { if (typeof window !== "undefined") window.__noSave = true; try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }

function uid() { return S.nextId++; }
function log(msg) { S.log.unshift({ day: S.day, msg }); if (S.log.length > 80) S.log.length = 80; }
function randomName() { return pick(NAMES) + pick(NAME_SUFFIX); }
function season(day = S.day) { return SEASONS[Math.floor(((day - 1) % 120) / 30)]; }

function canAfford(c) { return S.money >= c; }
function spend(c) { S.money -= c; Bus.emit('money', -c); }

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
  if (!free) { log(`🗺️ Opened ${b.icon} ${b.name}! Two ${sp.name}s moved in.`); Bus.emit('unlock', id); }
  return true;
}

/* ---------- Animals ---------- */
function makeAnimal(biomeId, spKey, variant, sex, age, happy, opts = {}) {
  const a = {
    id: uid(), sp: spKey, v: variant, sex, age: Math.round(age), happy,
    name: opts.name || randomName(), ped: !!opts.ped, from: opts.from || 'starter',
    cd: 0, born: S.day - Math.round(age), parents: opts.parents || null,
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
    if (sexMode === 'M') sex = 'M';
    else if (sexMode === 'F') sex = 'F';
    else sex = males <= females ? 'M' : 'F';
    if (sex === 'M') males++; else females++;
    const age = Math.min(rint(c.age[0], c.age[1]), sp.lifespan - 25);
    made.push(makeAnimal(biomeId, spKey, variant, sex, age, c.happy + rint(-5, 5), { ped: c.pedigree, from: c.id }));
  }
  if (c.rep) S.reputation = clamp(S.reputation + c.rep * qty, 0, 100);
  S.totals.animalsBought += qty;
  log(`🚚 ${qty}× ${displayName(sp, variant)} arrived from ${c.logo} ${c.name}.`);
  Bus.emit('animalsChanged', biomeId);
  return { ok: true, made, total: q.total };
}

function animalValue(a) {
  const sp = SPECIES[a.sp];
  const lifeLeft = clamp(1 - a.age / sp.lifespan, .1, 1);
  return Math.round(speciesBaseCost(sp, a.v) * .4 * lifeLeft * (a.ped ? 1.4 : 1));
}
function sellAnimal(biomeId, id) {
  const st = S.biomes[biomeId], i = st.animals.findIndex(a => a.id === id);
  if (i < 0) return 0;
  const a = st.animals[i], val = animalValue(a);
  st.animals.splice(i, 1);
  S.money += val; Bus.emit('money', val);
  log(`🤝 Sold ${a.name} the ${SPECIES[a.sp].name} for $${fmt(val)}.`);
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
  return v;
}

/* ---------- Facilities ---------- */
function facCount(biomeId, type) { return S.biomes[biomeId].facilities.filter(f => f.type === type).length; }
function addFacility(biomeId, type, level = 0, free) {
  const def = FAC[type];
  if (facCount(biomeId, type) >= def.max) return { ok: false, why: `Max ${def.max} ${def.label.toLowerCase()} here.` };
  const L = facLevel(type, level, biomeId);
  if (!free) { if (!canAfford(L.cost)) return { ok: false, why: 'Not enough money.' }; spend(L.cost); }
  const f = { id: uid(), type, level, built: S.day, name: type === 'mascot' ? BIOME_BY_ID[biomeId].mascot : null };
  S.biomes[biomeId].facilities.push(f);
  if (!free) log(`🔨 Built ${L.icon} ${L.name} in ${BIOME_BY_ID[biomeId].name}.`);
  Bus.emit('facilitiesChanged', biomeId);
  return { ok: true, f };
}
function upgradeCost(type, level, biomeId) {
  const next = FAC[type].levels[level + 1];
  return next ? Math.round(next.cost * .8) : null;
}
function upgradeFacility(biomeId, fid) {
  const f = S.biomes[biomeId].facilities.find(x => x.id === fid);
  if (!f) return { ok: false };
  const c = upgradeCost(f.type, f.level, biomeId);
  if (c == null) return { ok: false, why: 'Already max level!' };
  if (!canAfford(c)) return { ok: false, why: 'Not enough money.' };
  spend(c); f.level++;
  const L = facLevel(f.type, f.level, biomeId);
  log(`⬆️ Upgraded to ${L.icon} ${L.name} in ${BIOME_BY_ID[biomeId].name}.`);
  Bus.emit('facilitiesChanged', biomeId);
  return { ok: true, f };
}
function demolishFacility(biomeId, fid) {
  const st = S.biomes[biomeId], i = st.facilities.findIndex(x => x.id === fid);
  if (i < 0) return { ok: false };
  const f = st.facilities[i];
  if (f.type === 'enclosure') {
    const capAfter = biomeCapacity(biomeId) - FAC.enclosure.levels[f.level].cap;
    if (capAfter < st.animals.length) return { ok: false, why: 'Animals live there! Move or sell them first.' };
  }
  const L = facLevel(f.type, f.level, biomeId);
  const refund = Math.round(L.cost * .25);
  st.facilities.splice(i, 1);
  S.money += refund; Bus.emit('money', refund);
  Bus.emit('facilitiesChanged', biomeId);
  return { ok: true, refund };
}

/* ---------- Park upgrades ---------- */
function upgradeGate() {
  const n = GATES[S.gate + 1]; if (!n) return { ok: false, why: 'Max level' };
  if (!canAfford(n.cost)) return { ok: false, why: 'Not enough money.' };
  spend(n.cost); S.gate++; S.reputation = clamp(S.reputation + n.rep, 0, 100);
  log(`${n.icon} Entrance upgraded to ${n.name}!`); return { ok: true };
}
function upgradeParking() {
  const n = PARKING[S.parking + 1]; if (!n) return { ok: false, why: 'Max level' };
  if (!canAfford(n.cost)) return { ok: false, why: 'Not enough money.' };
  spend(n.cost); S.parking++;
  log(`${n.icon} Parking upgraded to ${n.name} (${fmt(n.cap)} visitors/day).`); return { ok: true };
}
function runMarketing(id) {
  const m = MARKETING.find(x => x.id === id);
  if (S.marketing.some(x => x.id === id)) return { ok: false, why: 'That campaign is already running.' };
  if (!canAfford(m.cost)) return { ok: false, why: 'Not enough money.' };
  spend(m.cost); S.marketing.push({ id, until: S.day + m.days });
  log(`${m.icon} Launched ${m.name}: +${Math.round(m.boost * 100)}% visitors for ${m.days} days.`);
  return { ok: true };
}
function marketingBoost() { return S.marketing.reduce((s, x) => s + MARKETING.find(m => m.id === x.id).boost, 0); }

/* ---------- Derived per-biome numbers ---------- */
function biomeInfo(id) {
  const st = S.biomes[id];
  const fac = type => st.facilities.filter(f => f.type === type).map(f => facLevel(type, f.level, id));
  const enc = fac('enclosure'), keepers = fac('keeper'), mascots = fac('mascot');
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
  const avgHappy = n ? st.animals.reduce((s, a) => s + a.happy, 0) / n : 0;
  return { cap, n, handles, coverage, targetHappy, distinct, appeal, avgHappy, vet, crowd, mascotBoost };
}

function fairPrice(totalAppeal) { return 4 + Math.pow(Math.max(0, totalAppeal), .42); }

/* ---------- Day simulation ---------- */
function rollWeather() {
  const s = season();
  const r = Math.random();
  if (s.name === 'Winter') return r < .35 ? 'snowy' : r < .6 ? 'cloudy' : r < .7 ? 'stormy' : 'sunny';
  if (s.name === 'Summer') return r < .12 ? 'heat' : r < .2 ? 'stormy' : r < .32 ? 'rainy' : r < .5 ? 'cloudy' : 'sunny';
  return r < .2 ? 'rainy' : r < .27 ? 'stormy' : r < .5 ? 'cloudy' : 'sunny';
}

const EVENTS = [
  { id: 'school', w: 4, icon: '🚌', text: 'A school field trip arrived!', mult: 1.4 },
  { id: 'celebrity', w: 1, icon: '🌟', text: 'A celebrity visited and posted about your zoo!', mult: 1.9, rep: 3 },
  { id: 'news', w: 2, icon: '📰', text: 'The local news featured your zoo.', mult: 1.2, rep: 2 },
  { id: 'donation', w: 2, icon: '💝', text: 'A generous fan made a donation!', donation: true },
  { id: 'escape', w: 1, icon: '🏃', text: 'An animal briefly escaped! Visitors were spooked.', mult: .85, rep: -3, minAnimals: 6 },
  { id: 'holiday', w: 2, icon: '🎉', text: 'Public holiday! Families flock to the zoo.', mult: 1.5 },
  { id: 'inspection', w: 1, icon: '📋', text: 'Health inspectors visited.', inspection: true },
  { id: 'festival', w: 1, icon: '🎪', text: 'A town festival nearby is drawing crowds away.', mult: .8 },
];

function rollEvent() {
  if (Math.random() > .09 || S.day < 4) return null;
  const totalAnimals = BIOMES.reduce((s, b) => s + S.biomes[b.id].animals.length, 0);
  const pool = EVENTS.filter(e => !e.minAnimals || totalAnimals >= e.minAnimals);
  let t = pool.reduce((s, e) => s + e.w, 0), r = Math.random() * t;
  for (const e of pool) { r -= e.w; if (r <= 0) return e; }
  return null;
}

function simulateDay() {
  const report = { day: S.day, births: [], retired: [], biomes: {}, event: null };
  S.weather = rollWeather();
  const ev = rollEvent();
  S.event = ev ? ev.id : null;
  report.event = ev;

  const unlocked = BIOMES.filter(b => S.biomes[b.id].unlocked);
  const infos = {};

  // Animals: age, happiness, breeding, retirement
  for (const b of unlocked) {
    const st = S.biomes[b.id];
    const info = biomeInfo(b.id);
    for (const a of st.animals) {
      a.age++;
      if (a.cd > 0) a.cd--;
      const t = info.targetHappy + (a.ped ? 5 : 0) + (S.weather === 'heat' ? -4 : 0);
      a.happy = clamp(a.happy + (t - a.happy) * .15 + rnd(-2, 2), 0, 100);
    }
    // retirement
    const keep = [];
    for (const a of st.animals) {
      if (a.age > SPECIES[a.sp].lifespan) { report.retired.push({ biome: b.id, a }); log(`🌅 ${a.name} the ${SPECIES[a.sp].name} retired peacefully to a sanctuary.`); }
      else keep.push(a);
    }
    st.animals = keep;
    // breeding
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
          let p = TIER.breed[sp.tier] * (info.vet ? 1.5 : 1) * ((mom.ped || dad.ped) ? 1.3 : 1) * (.5 + (mom.happy - 50) / 50);
          if (S.biomes[b.id].animals.length >= info.cap * 1.3) break;
          if (Math.random() < p) {
            mom.cd = 22 + sp.tier * 8;
            const litter = rint(1, TIER.litter[sp.tier]);
            for (let k = 0; k < litter; k++) {
              let v = Math.random() < .5 ? mom.v : dad.v;
              let mutated = false;
              if (Math.random() < .025) {
                const idx = VARIANTS.findIndex(x => x.id === v);
                const rarer = VARIANTS.slice(idx + 1);
                if (rarer.length) { v = pick(rarer).id; mutated = true; }
              }
              const baby = makeAnimal(b.id, key, v, Math.random() < .5 ? 'M' : 'F', 0, 85,
                { ped: mom.ped && dad.ped, from: 'born', parents: [mom.name, dad.name] });
              S.totals.births++;
              report.births.push({ biome: b.id, a: baby, mutated });
              log(`🍼 ${mom.name} & ${dad.name} welcomed a baby ${displayName(sp, v)}${mutated ? ' — a rare mutation! ✨' : ''}`);
            }
          }
        }
      }
    }
    infos[b.id] = biomeInfo(b.id);
  }

  // Visitors
  const totalAppeal = unlocked.reduce((s, b) => s + infos[b.id].appeal, 0) + 4;
  const fair = fairPrice(totalAppeal);
  const priceFactor = clamp(1.4 - .4 * S.ticketPrice / fair, .15, 1.35);
  const repFactor = .5 + S.reputation / 100;
  const gate = GATES[S.gate];
  let mult = repFactor * priceFactor * season().mult * WEATHER[S.weather].mult * (1 + gate.boost) * (1 + marketingBoost());
  if (ev && ev.mult) mult *= ev.mult;
  let visitors = Math.round((4 + 4 * Math.pow(totalAppeal, .85)) * mult * rnd(.9, 1.1));
  const parkCap = PARKING[S.parking].cap;
  const turnedAway = Math.max(0, visitors - parkCap);
  visitors = Math.max(0, Math.min(visitors, parkCap));
  report.visitors = visitors; report.turnedAway = turnedAway; report.fair = fair;

  // Per biome economics
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
    // food: best spend first
    const serve = (venues, demand) => {
      let rev = 0, served = 0;
      venues.sort((x, y) => y.spend - x.spend);
      for (const v of venues) { const s = Math.min(v.cap, demand - served); if (s <= 0) break; served += s; rev += s * v.spend; }
      return { rev, served };
    };
    const foodDemand = visits * (S.weather === 'heat' ? .7 : .55);
    const food = serve(L('food'), foodDemand);
    const gift = serve(L('gift'), visits * .3);
    let rides = 0;
    for (const r of [...L('themed'), ...L('ride')]) rides += Math.min(r.cap, visits * .35) * r.fee;
    const restCap = L('restroom').reduce((s, x) => s + x.cap, 0);
    const restNeed = visits * (S.weather === 'heat' ? .6 : .45);
    const restRatio = restNeed ? Math.min(1.5, restCap / restNeed) : 1;
    const foodRatio = foodDemand ? Math.min(1, food.served / foodDemand) : 1;

    // satisfaction
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

    // expenses
    const foodCost = st.animals.reduce((s, a) => s + TIER.food[SPECIES[a.sp].tier] * (lifeStage(a) === 'Baby' ? .5 : 1), 0);
    const salaries = st.facilities.reduce((s, f) => s + (facLevel(f.type, f.level, b.id).salary || 0), 0);
    const maint = st.facilities.reduce((s, f) => s + (facLevel(f.type, f.level, b.id).maint || 0), 0);
    const exp = foodCost + salaries + maint;
    const rev = tickets + food.rev + gift.rev + rides;

    const s = st.stats;
    Object.assign(s, { visits, revenue: rev, expenses: exp, tickets, food: food.rev, gift: gift.rev, rides, appeal: info.appeal, sat,
      foodCost, salaries, maint, restRatio, foodRatio });
    s.totalVisits += visits; s.totalRevenue += rev; s.totalExpenses += exp;
    s.history.push({ d: S.day, v: visits, r: Math.round(rev), e: Math.round(exp), a: Math.round(info.appeal) });
    if (s.history.length > 120) s.history.shift();
    dayRevenue += rev; dayExpenses += exp;
    report.biomes[b.id] = { visits, rev, exp };
  }

  // Events with money
  if (ev && ev.donation) { const d = Math.round(rnd(200, 600) + dayRevenue * rnd(.5, 1.5)); S.money += d; dayRevenue += d; ev.amount = d; }
  if (ev && ev.inspection) {
    const avgSat = satW ? satSum / satW : 50;
    if (avgSat > 60) { S.reputation = clamp(S.reputation + 4, 0, 100); ev.result = 'You passed with flying colors! +Reputation'; }
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
  report.revenue = dayRevenue; report.expenses = dayExpenses; report.sat = avgSat;
  report.totalAppeal = totalAppeal;

  if (ev) log(`${ev.icon} ${ev.text}${ev.amount ? ' +$' + fmt(ev.amount) : ''}${ev.result ? ' ' + ev.result : ''}`);
  if (turnedAway > 20 && S.day % 5 === 0) log(`🅿️ Parking full! ${fmt(turnedAway)} visitors were turned away. Upgrade parking in the Shop.`);
  S.marketing = S.marketing.filter(m => m.until > S.day);

  S.day++;
  if (S.money < -5000 && !S.bankruptWarned) { S.bankruptWarned = true; log('⚠️ Deep in debt! Sell animals or cut staff before the bank calls.'); }
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

if (typeof module !== 'undefined') module.exports = { newGame, simulateDay, get S() { return S; }, buyAnimals, addFacility, upgradeFacility, unlockBiome, biomeInfo, upgradeParking, upgradeGate };
