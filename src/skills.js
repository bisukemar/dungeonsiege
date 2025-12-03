import { PlayerProjectile } from './entities.js';
import { SKILL_DB } from './databases/skillDB.js';

function adjustAoEPosition(cx, cy, radius, blockers = []) {
  const minGap = 8;
  const overlaps = (x, y) => blockers.some((b) => {
    const br = b?.radius ?? b?.r ?? 0;
    const dx = (b?.x ?? 0) - x;
    const dy = (b?.y ?? 0) - y;
    return Math.hypot(dx, dy) < radius + br + minGap;
  });
  if (!overlaps(cx, cy)) return { x: cx, y: cy };
  const maxBlockRadius = blockers.reduce((m, b) => Math.max(m, b?.radius ?? b?.r ?? 0), 0);
  for (let i = 0; i < 12; i++) {
    const ang = (Math.PI * 2 * i) / 12;
    const step = radius + maxBlockRadius + minGap + 20;
    const nx = cx + Math.cos(ang) * step;
    const ny = cy + Math.sin(ang) * step;
    if (!overlaps(nx, ny)) return { x: nx, y: ny };
  }
  return { x: cx, y: cy };
}

function getEffectiveSkillLevel(player, key) {
  if (typeof player.getEffectiveSkillLevel === 'function') {
    return player.getEffectiveSkillLevel(key);
  }
  return (player.skillLevel && player.skillLevel[key]) || 0;
}

const getStat = (player, key) => {
  if (player && typeof player.getTotalStat === 'function') return player.getTotalStat(key);
  return (player?.stats?.[key] || 0);
};

// Small helper so DEX controls range in a sane way for all projectile skills.
function computeProjectileLifeForDex(baseRange, speed, dex) {
  // baseRange is in world units (pixels). Each point of DEX adds a bit of range,
  // but not enough that low values can already hit the far edge of the screen.
  const extraPerDex = 12; // ~12px extra range per DEX
  const maxExtraDex = 40; // hard cap so it doesn't go infinite
  const clampedDex = Math.max(0, Math.min(dex || 0, maxExtraDex));

  const range = baseRange + clampedDex * extraPerDex;
  const life = Math.round(range / speed);
  return Math.max(15, life); // safety floor
}

function getMaxSkillRange(player) {
  const dex = Math.max(0, Math.min(getStat(player, 'dex') || 0, 40));
  return 240 + dex * 12; // matches Arrow base range scaling
}

export function castMeteorStorm(player, meteorStrikes, nearestFn, avoidFields = []) {
  const level = getEffectiveSkillLevel(player, 'Meteor');
  if (level <= 0) return;

  const target = nearestFn(player.x, player.y);
  // Fallback: drop slightly in front of the player if no target
  const fallbackX = player.x + (player.dx || 1) * 140;
  const fallbackY = player.y + (player.dy || 0) * 60;

  const centerX = target ? target.x : fallbackX;
  const centerY = target ? target.y : fallbackY;

  // Read tuning from SKILL_DB if available
  const def = SKILL_DB.Meteor || {};
  const baseRadius = def.baseRadius || 60;
  const radiusPerLevel = def.radiusPerLevel || 10;
  const baseDelay = def.baseDelay || 90;
  const delayPerLevel = def.delayPerLevel || 8;
  const baseMul = def.baseDamageMultiplier || 3;
  const bonusLvl = def.bonusDamagePerLevel || 4;

  const radius = baseRadius + (level - 1) * radiusPerLevel;
  const delay = Math.max(30, baseDelay - (level - 1) * delayPerLevel);

  let dmg = getStat(player, 'int') * baseMul + level * bonusLvl;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('Meteor', dmg);
  }

  const adj = adjustAoEPosition(centerX, centerY, radius, avoidFields);
  meteorStrikes.push(new MeteorStrike(adj.x, adj.y, radius, delay, dmg));

  // Unique item hooks (e.g., Pyromancer's Revenge via bonuses.uniqueAbility)
  const weaponAbility = player?.equip?.weapon?.bonuses?.uniqueAbility;
  if (weaponAbility?.onMeteorCast) {
    const spawnStrike = (x, y, r, dly, damageVal) => {
      const alt = adjustAoEPosition(x, y, r, avoidFields);
      meteorStrikes.push(new MeteorStrike(alt.x, alt.y, r, dly, damageVal));
    };
    weaponAbility.onMeteorCast({
      centerX,
      centerY,
      radius,
      delay,
      dmg,
      spawnStrike
    });
  }
}

// ======================================================
//  FIREBALL
// ======================================================
export function castFireball(player, projectiles, nearestFn) {
  const target = nearestFn(player.x, player.y);
  if (!target) return;

  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.hypot(dx, dy) || 1;

  const speed = 5.0;
  const vx = (dx / dist) * speed;
  const vy = (dy / dist) * speed;

  const level = getEffectiveSkillLevel(player, 'Fireball');
  let dmg = getStat(player, 'int') * 2 + level;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('Fireball', dmg);
  }

  // ---- RANGE BEHAVIOR (DEX) ----
  // At low DEX, Fireball reaches only a bit beyond the visible area around the player.
  // Each point of DEX adds a modest amount of extra range.
  const baseRange = 200; // shorter reach at low DEX
  const dex = getStat(player, 'dex');
  const life = computeProjectileLifeForDex(baseRange, speed, dex);

  const color = '#ff9800';
  projectiles.push(
    new PlayerProjectile(player.x, player.y, vx, vy, dmg, 'FIRE', color, life)
  );
}

// ======================================================
//  ARROW
// ======================================================
export function castArrow(player, projectiles, nearestFn) {
  const target = nearestFn(player.x, player.y);
  if (!target) return;

  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.hypot(dx, dy) || 1;

  const speed = 7.0;
  const vx = (dx / dist) * speed;
  const vy = (dy / dist) * speed;

  const level = getEffectiveSkillLevel(player, 'Arrow');
  let dmg = getStat(player, 'str') * 2 + getStat(player, 'dex') * 0.5 + level;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('Arrow', dmg);
  }

  // ---- RANGE BEHAVIOR (DEX) ----
  // Arrow has a slightly longer base range than Fireball, but still cannot
  // hit monsters at the very edge of the screen with only 1 DEX.
  const baseRange = 240;
  const dex = getStat(player, 'dex');
  const life = computeProjectileLifeForDex(baseRange, speed, dex);

  const angle = Math.atan2(vy, vx);

  const proj = new PlayerProjectile(
    player.x,
    player.y,
    vx,
    vy,
    dmg,
    'NEUTRAL',
    '#ffffff',
    life
  );

  // Tag for custom drawing
  proj.type = 'arrow';
  proj.angle = angle;

  projectiles.push(proj);
}

// ======================================================
//  ARROW SHOWER (5-ARROW CRESCENT)
// ======================================================
export function castArrowShower(player, projectiles, nearestFn) {
  const target = nearestFn(player.x, player.y);
  const fallbackAng = Math.atan2(player.dy || 0, player.dx || 1);
  const baseAngle = target
    ? Math.atan2(target.y - player.y, target.x - player.x)
    : fallbackAng;

  const speed = 7.2;
  const dex = getStat(player, 'dex');
  const life = computeProjectileLifeForDex(260, speed, dex);

  const level = getEffectiveSkillLevel(player, 'ArrowShower');
  let dmg = getStat(player, 'dex') * 1.4 + level * 2;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('ArrowShower', dmg);
  }

  const spread = Math.PI / 2.8; // wide crescent in front
  const step = spread / 4;

  for (let i = 0; i < 5; i++) {
    const ang = baseAngle + (i - 2) * step;
    const vx = Math.cos(ang) * speed;
    const vy = Math.sin(ang) * speed;
    const proj = new PlayerProjectile(
      player.x,
      player.y,
      vx,
      vy,
      dmg,
      'NEUTRAL',
      '#c5e1ff',
      life
    );
    proj.type = 'arrow';
    proj.angle = ang;
    projectiles.push(proj);
  }
}

// ======================================================
//  ICE WAVE
// ======================================================
export class IceWave {
  constructor(x, y, dirX, dirY, dmg, rangeScale = 1) {
    this.x = x;
    this.y = y;
    const len = Math.hypot(dirX, dirY) || 1;
    this.dirX = dirX / len;
    this.dirY = dirY / len;

    this.radius = 30 * rangeScale;
    this.growth = 3 * rangeScale;

    this.dmg = dmg;
    this.life = 20;
    this.element = 'WATER';
    this.span = Math.PI / 2;   // half-circle cone (front 180°)
    this.thickness = 6;
  }

  update() {
    this.radius += this.growth;
    this.life--;
  }

  hits(m) {
    const a = Math.atan2(this.dirY, this.dirX);
    const mx = m.x - this.x;
    const my = m.y - this.y;
    const dist = Math.hypot(mx, my);
    if (dist > this.radius + m.r) return false;
    const ang = Math.atan2(my, mx);
    return Math.abs(ang - a) < this.span;
  }
}

export function castIceWave(player, iceArr) {
  const angle = Math.atan2(player.dy || 0, player.dx || 1);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  const level = getEffectiveSkillLevel(player, 'Ice');
  let dmg = getStat(player, 'int') * 1.6 + level;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('Ice', dmg);
  }

  // DEX slightly increases the size of the cone, but it still starts fairly small.
  const dex = getStat(player, 'dex');
  const rangeScale = 1 + dex * 0.04; // gentle scaling

  iceArr.push(new IceWave(player.x, player.y, dx, dy, dmg, rangeScale));
}

// ======================================================
//  BASH WAVE
// ======================================================
export class BashWave {
  constructor(x, y, dirX, dirY, dmg, target, rangeScale = 1) {
    this.x = x;
    this.y = y;
    const len = Math.hypot(dirX, dirY) || 1;
    this.dirX = dirX / len;
    this.dirY = dirY / len;

    this.radius = 35 * rangeScale;
    this.growth = 3 * rangeScale;

    this.dmg = dmg;
    this.life = 16;
    this.element = 'NEUTRAL';
    this.span = 0.45;     // narrow cone
    this.thickness = 5;
    this.target = target || null;
    this.hitDone = false;
  }

  update() {
    this.radius += this.growth;
    this.life--;
  }

  hits(m) {
    if (this.hitDone) return false;
    if (this.target && m !== this.target) return false;
    if (this.target && this.target.hp <= 0) return false;
    const a = Math.atan2(this.dirY, this.dirX);
    const mx = m.x - this.x;
    const my = m.y - this.y;
    const dist = Math.hypot(mx, my);
    if (dist > this.radius + m.r) return false;
    const ang = Math.atan2(my, mx);
    return Math.abs(ang - a) < this.span;
  }
}

export function castBash(player, bashArr, target = null) {
  const angle = Math.atan2(player.dy || 0, player.dx || 1);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  const level = getEffectiveSkillLevel(player, 'Bash');
  let dmg = getStat(player, 'str') * 2.2 + level;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('Bash', dmg);
  }

  const dex = getStat(player, 'dex');
  const rangeScale = 1 + dex * 0.04;

  bashArr.push(new BashWave(player.x, player.y, dx, dy, dmg, target, rangeScale));
}

// ======================================================
//  PIERCING STRIKE (MULTI-HIT ARC)
// ======================================================
export class PiercingStrikeWave {
  constructor(x, y, dirX, dirY, dmg, rangeScale = 1) {
    this.x = x;
    this.y = y;
    const len = Math.hypot(dirX, dirY) || 1;
    this.dirX = dirX / len;
    this.dirY = dirY / len;

    this.radius = 35 * rangeScale;
    this.growth = 3 * rangeScale;

    this.dmg = dmg;
    this.life = 16;
    this.element = 'NEUTRAL';
    this.span = 0.45;     // narrow cone
    this.thickness = 5;
    this.hitSet = new Set();
  }

  update() {
    this.radius += this.growth;
    this.life--;
  }

  hits(m) {
    if (this.hitSet.has(m)) return false;
    const a = Math.atan2(this.dirY, this.dirX);
    const mx = m.x - this.x;
    const my = m.y - this.y;
    const dist = Math.hypot(mx, my);
    if (dist > this.radius + m.r) return false;
    const ang = Math.atan2(my, mx);
    return Math.abs(ang - a) < this.span;
  }
}

export function castPiercingStrike(player, pierceArr) {
  const angle = Math.atan2(player.dy || 0, player.dx || 1);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  const level = getEffectiveSkillLevel(player, 'PiercingStrike');
  let dmg = getStat(player, 'str') * 2.2 + level * 1.5;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('PiercingStrike', dmg);
  }

  const dex = getStat(player, 'dex');
  const rangeScale = 1 + dex * 0.04;

  pierceArr.push(new PiercingStrikeWave(player.x, player.y, dx, dy, dmg, rangeScale));
}

// ======================================================
//  MAGNUM BREAK (AOE)
// ======================================================
export class MagnumBreakWave {
  constructor(x, y, dmg, rangeScale = 1) {
    this.x = x;
    this.y = y;
    this.radius = 10 * rangeScale;
    this.growth = 4 * rangeScale;

    this.dmg = dmg;
    this.life = 22;
    this.element = 'NEUTRAL';
    this.thickness = 6;
  }

  update() {
    this.radius += this.growth;
    this.life--;
  }

  hits(m) {
    const dx = m.x - this.x;
    const dy = m.y - this.y;
    const dist = Math.hypot(dx, dy);
    return dist < this.radius + m.r;
  }
}

export function castMagnum(player, magArr) {
  const level = getEffectiveSkillLevel(player, 'Magnum');
  let dmg = getStat(player, 'str') * 1.8 + getStat(player, 'dex') * 0.3 + level * 2;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('Magnum', dmg);
  }

  const dex = getStat(player, 'dex');
  const rangeScale = 1 + dex * 0.03;

  magArr.push(new MagnumBreakWave(player.x, player.y, dmg, rangeScale));
}

export class MeteorStrike {
  constructor(x, y, radius, delayFrames, dmg) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.delay = delayFrames; // telegraph phase
    this.life = 18;           // explosion visible duration
    this.dmg = dmg;
    this.element = 'FIRE';
  }

  update() {
    if (this.delay > 0) {
      this.delay--;
    } else {
      this.life--;
    }
  }

  isDone() {
    return this.delay <= 0 && this.life <= 0;
  }

  hits(m) {
    // Only damage after the meteor actually lands
    if (this.delay > 0) return false;
    const dx = m.x - this.x;
    const dy = m.y - this.y;
    const dist = Math.hypot(dx, dy);
    return dist < this.radius + m.r;
  }
}

// ======================================================
//  ARROW STORM (AOE MULTI-HIT)
// ======================================================
export class ArrowStormStrike {
  constructor(x, y, radius, delayFrames, dmg, hits) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.delay = delayFrames;
    this.life = 22;
    this.dmg = dmg;
    this.element = 'NEUTRAL';
    this.hitsRemaining = hits;
    this.hitTimer = 0;
    this.pendingHit = false;
    this.effects = [];
  }

  update() {
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    if (this.hitsRemaining > 0) {
      if (this.hitTimer <= 0) {
        this.hitTimer = 8;
        this.hitsRemaining--;
        this.pendingHit = true;
      } else {
        this.hitTimer--;
      }
    }
    if (this.life > 0) this.life--;
  }

  isDone() {
    return this.delay <= 0 && this.life <= 0 && this.hitsRemaining <= 0 && !this.pendingHit;
  }

  hits(m) {
    if (this.delay > 0) return false;
    const dx = m.x - this.x;
    const dy = m.y - this.y;
    const dist = Math.hypot(dx, dy);
    return dist < this.radius + m.r;
  }
}

export function castArrowStorm(player, arrowStorms, nearestFn, avoidFields = []) {
  const level = getEffectiveSkillLevel(player, 'ArrowStorm');
  if (level <= 0) return;

  const target = nearestFn(player.x, player.y);
  // fallback toward facing
  const fallbackX = player.x + (player.dx || 1) * 140;
  const fallbackY = player.y + (player.dy || 0) * 60;
  const cx = target ? target.x : fallbackX;
  const cy = target ? target.y : fallbackY;

  const baseRadius = 70;
  const radius = baseRadius + (level - 1) * 6;

  let dmg = getStat(player, 'dex') * 1.5 + level * 2;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('ArrowStorm', dmg);
  }

  const hits = Math.min(3, 1 + Math.floor((level - 1) / 3));
  const def = SKILL_DB.ArrowStorm || {};
  const baseDelay = def.baseDelay || 60;
  const delay = Math.max(24, baseDelay - (level - 1) * 4);

  const adj = adjustAoEPosition(cx, cy, radius, avoidFields);
  arrowStorms.push(new ArrowStormStrike(adj.x, adj.y, radius, delay, dmg, hits));
}
// ======================================================
//  QUAGMIRE (PERSISTENT DoT FIELD)
// ======================================================
export class QuagmireField {
  constructor(x, y, radius, lifeFrames, tickDamage, fireVulnBonus = 0.1) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.life = lifeFrames;
    this.element = 'EARTH';
    this.tickDamage = tickDamage;
    this.fireVulnBonus = fireVulnBonus;
    this.tickInterval = 20;
    this.tickTimer = 0;
  }

  update(paused = false) {
    if (!paused) {
      this.life--;
      this.tickTimer--;
    }
  }

  isDone() {
    return this.life <= 0;
  }

  shouldTick() {
    return this.tickTimer <= 0;
  }

  resetTick() {
    this.tickTimer = this.tickInterval;
  }

  contains(m) {
    const dx = m.x - this.x;
    const dy = m.y - this.y;
    const dist = Math.hypot(dx, dy);
    return dist < this.radius + m.r;
  }
}

export function castQuagmire(player, quagmires, nearestFn, avoidMeteors = []) {
  const level = getEffectiveSkillLevel(player, 'Quagmire');
  if (level <= 0) return;

  const target = nearestFn(player.x, player.y);
  const fallbackX = player.x + (player.dx || 1) * 120;
  const fallbackY = player.y + (player.dy || 0) * 60;
  const cx = target ? target.x : fallbackX;
  const cy = target ? target.y : fallbackY;

  const baseRadius = 80;
  const radius = baseRadius + (level - 1) * 8;
  const tickDamage = getStat(player, 'int') * 0.5 + level * 2;
  const fireVuln = 0.1 + (level - 1) * 0.05;

  let dmg = tickDamage;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('Quagmire', dmg);
  }

  const adj = adjustAoEPosition(cx, cy, radius, avoidMeteors);
  const field = new QuagmireField(adj.x, adj.y, radius, 300, dmg, fireVuln);
  quagmires.push(field);
}

// ======================================================
//  CHAIN LIGHTNING
// ======================================================
function findChainTarget(fromPos, pool, visited, range) {
  let best = null;
  let bestDist = Infinity;
  pool.forEach((m) => {
    if (!m || m.hp <= 0) return;
    if (visited.has(m)) return;
    const d = Math.hypot(m.x - fromPos.x, m.y - fromPos.y);
    if (d <= range && d < bestDist) {
      best = m;
      bestDist = d;
    }
  });
  return best;
}

export function castChainLightning(player, chainBolts, nearestFn, monsterPool, hitFn) {
  if (typeof hitFn !== 'function') return;

  const level = getEffectiveSkillLevel(player, 'ChainLightning');
  if (level <= 0) return;

  const firstTarget = nearestFn(player.x, player.y);
  if (!firstTarget) return;

  const maxRange = getMaxSkillRange(player);
  const distToFirst = Math.hypot(firstTarget.x - player.x, firstTarget.y - player.y);
  if (distToFirst > maxRange) return;

  // Face the initial target
  const ang = Math.atan2(firstTarget.y - player.y, firstTarget.x - player.x);
  player.dx = Math.cos(ang);
  player.dy = Math.sin(ang);

  const baseRange = 210;
  const bounceRange = Math.min(maxRange, baseRange + level * 6);
  const chainCount = Math.min(5, 3 + (level >= 3 ? 1 : 0) + (level >= 6 ? 1 : 0));

  let baseDmg = getStat(player, 'int') * 1.75 + level * 2;
  if (typeof player.addSkillBonusDamage === 'function') {
    baseDmg = player.addSkillBonusDamage('ChainLightning', baseDmg);
  }
  const bounceDmg = Math.max(1, Math.round(baseDmg * 0.5));

  const pool = Array.isArray(monsterPool) ? monsterPool : [];
  const visited = new Set();
  const segments = [];

  let current = firstTarget;
  let lastPos = { x: player.x, y: player.y };

  while (current && visited.size < chainCount) {
    visited.add(current);

    const currPos = { x: current.x, y: current.y };
    segments.push({ from: lastPos, to: currPos });

    const dmg = visited.size === 1 ? baseDmg : bounceDmg;
    hitFn(current, dmg, 'WIND');

    lastPos = currPos;
    current = findChainTarget(currPos, pool, visited, bounceRange);
  }

  if (segments.length > 0 && Array.isArray(chainBolts)) {
    chainBolts.push({ segments, life: 14, maxLife: 14 });
  }
}

// ======================================================
//  LIGHTNING BOLT (MULTI-HIT SINGLE TARGET)
// ======================================================
export function castLightningBolt(player, boltArr, nearestFn, hitFn) {
  if (!Array.isArray(boltArr) || typeof hitFn !== 'function') return;

  const level = getEffectiveSkillLevel(player, 'LightningBolt');
  if (level <= 0) return;

  const target = nearestFn(player.x, player.y);
  if (!target) return;

  const maxRange = getMaxSkillRange(player);
  const distToTarget = Math.hypot(target.x - player.x, target.y - player.y);
  if (distToTarget > maxRange) return;

  const ang = Math.atan2(target.y - player.y, target.x - player.x);
  player.dx = Math.cos(ang);
  player.dy = Math.sin(ang);

  const hits = Math.min(7, Math.max(1, level));
  let dmg = getStat(player, 'int') * 2.0 + level * 2;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('LightningBolt', dmg);
  }

  const strike = {
    target,
    hitsRemaining: hits,
    dmg,
    delayFrames: 8,  // short delay between hits
    timer: 0,
    element: 'WIND',
    effects: []
  };
  boltArr.push(strike);
}
