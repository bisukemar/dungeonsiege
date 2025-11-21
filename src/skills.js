import { PlayerProjectile } from './entities.js';
import { SKILL_DB } from './databases/skillDB.js';

function getEffectiveSkillLevel(player, key) {
  if (typeof player.getEffectiveSkillLevel === 'function') {
    return player.getEffectiveSkillLevel(key);
  }
  return (player.skillLevel && player.skillLevel[key]) || 0;
}

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

export function castMeteorStorm(player, meteorStrikes, nearestFn) {
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

  let dmg = player.stats.int * baseMul + level * bonusLvl;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('Meteor', dmg);
  }

  meteorStrikes.push(new MeteorStrike(centerX, centerY, radius, delay, dmg));
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
  let dmg = player.stats.int * 2 + level;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('Fireball', dmg);
  }

  // ---- RANGE BEHAVIOR (DEX) ----
  // At low DEX, Fireball reaches only a bit beyond the visible area around the player.
  // Each point of DEX adds a modest amount of extra range.
  const baseRange = 260; // short–mid range at DEX 0–1
  const dex = player.stats.dex || 0;
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
  let dmg = player.stats.str * 2 + player.stats.dex * 0.5 + level;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('Arrow', dmg);
  }

  // ---- RANGE BEHAVIOR (DEX) ----
  // Arrow has a slightly longer base range than Fireball, but still cannot
  // hit monsters at the very edge of the screen with only 1 DEX.
  const baseRange = 320;
  const dex = player.stats.dex || 0;
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
  let dmg = player.stats.int * 1.6 + level;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('Ice', dmg);
  }

  // DEX slightly increases the size of the cone, but it still starts fairly small.
  const dex = player.stats.dex || 0;
  const rangeScale = 1 + dex * 0.04; // gentle scaling

  iceArr.push(new IceWave(player.x, player.y, dx, dy, dmg, rangeScale));
}

// ======================================================
//  BASH WAVE
// ======================================================
export class BashWave {
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

export function castBash(player, bashArr) {
  const angle = Math.atan2(player.dy || 0, player.dx || 1);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  const level = getEffectiveSkillLevel(player, 'Bash');
  let dmg = player.stats.str * 2.2 + level;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('Bash', dmg);
  }

  const dex = player.stats.dex || 0;
  const rangeScale = 1 + dex * 0.04;

  bashArr.push(new BashWave(player.x, player.y, dx, dy, dmg, rangeScale));
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
  let dmg = player.stats.str * 1.8 + player.stats.dex * 0.3 + level * 2;
  if (typeof player.addSkillBonusDamage === 'function') {
    dmg = player.addSkillBonusDamage('Magnum', dmg);
  }

  const dex = player.stats.dex || 0;
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
