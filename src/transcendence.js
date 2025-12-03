import { TRANSCENDENCE_EXP_TABLE, getTranscendenceExpRequirement } from './databases/transExp.js';
import { TRANSCENDENCE_SKILLS } from './databases/transSkills.js';

const STORAGE_KEY = 'dungeonsiege_transcendence_v1';

const TITLE_TIERS = [
  { level: 10, title: 'Novice' },
  { level: 20, title: 'Squire' },
  { level: 30, title: 'Knight' },
  { level: 40, title: 'Champion' },
  { level: 50, title: 'Warden' },
  { level: 60, title: 'Marshal' },
  { level: 70, title: 'High Lord' },
  { level: 80, title: 'Mythic Paladin' },
  { level: 90, title: 'Dragonknight' },
  { level: 99, title: 'Eternal Sovereign' }
];

const defaultState = () => ({
  level: 1,
  exp: 0,
  skillPoints: 0,
  skills: {}
});

let state = loadState();
let sessionExpGained = 0;

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const base = defaultState();
    if (!raw || typeof raw !== 'object') return base;
    const lvl = Math.min(99, Math.max(1, raw.level || 1));
    return {
      level: lvl,
      exp: Math.max(0, raw.exp || 0),
      skillPoints: Math.max(0, raw.skillPoints || 0),
      skills: raw.skills && typeof raw.skills === 'object' ? raw.skills : {}
    };
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // ignore storage failures (e.g., private mode)
  }
}

export function resetSessionTranscendenceRun() {
  sessionExpGained = 0;
}

export function getSessionTranscendenceExp() {
  return sessionExpGained;
}

export function getTranscendenceTitle(level = state.level) {
  let current = TITLE_TIERS[0].title;
  for (const tier of TITLE_TIERS) {
    if (level >= tier.level) current = tier.title;
  }
  return current;
}

export function getTranscendenceState() {
  return {
    ...state,
    title: getTranscendenceTitle(state.level)
  };
}

export function getTranscendenceProgress() {
  const expToNext = getTranscendenceExpRequirement(state.level);
  const frac = expToNext === Infinity ? 1 : Math.min(1, state.exp / expToNext);
  return {
    level: state.level,
    exp: state.exp,
    expToNext,
    fraction: frac,
    title: getTranscendenceTitle(state.level)
  };
}

export function addTranscendenceExp(amount) {
  const gain = Math.max(0, Math.floor(amount || 0));
  if (gain <= 0 || state.level >= 99) return { leveledUp: false, levelsGained: 0, level: state.level, exp: state.exp };

  state.exp += gain;
  sessionExpGained += gain;

  let leveledUp = false;
  let levelsGained = 0;
  while (state.level < 99) {
    const need = getTranscendenceExpRequirement(state.level);
    if (state.exp < need) break;
    state.exp -= need;
    state.level++;
    state.skillPoints = (state.skillPoints || 0) + 1;
    leveledUp = true;
    levelsGained++;
  }

  if (state.level >= 99) {
    state.level = 99;
    state.exp = 0;
  }

  saveState();
  return { leveledUp, levelsGained, level: state.level, exp: state.exp };
}

export function getTranscendenceSkillDefs() {
  return TRANSCENDENCE_SKILLS;
}

function meetsRequirements(def) {
  const req = def?.requires;
  if (!req) return true;
  if (req.level && state.level < req.level) return false;
  if (Array.isArray(req.skills)) {
    return req.skills.every((id) => (state.skills?.[id] || 0) > 0);
  }
  return true;
}

export function levelUpTranscendenceSkill(skillId) {
  const def = TRANSCENDENCE_SKILLS.find((s) => s.id === skillId);
  if (!def) return { ok: false, reason: 'Skill not found' };
  if (!meetsRequirements(def)) return { ok: false, reason: 'Requirements not met' };

  const current = state.skills?.[skillId] || 0;
  if (current >= (def.maxLevel || 1)) return { ok: false, reason: 'Max level reached' };
  if ((state.skillPoints || 0) <= 0) return { ok: false, reason: 'No skill points' };

  state.skills[skillId] = current + 1;
  state.skillPoints = Math.max(0, (state.skillPoints || 0) - 1);
  saveState();
  return { ok: true, level: state.skills[skillId], skillPoints: state.skillPoints };
}

function mergeBonuses(target, bonus) {
  if (!bonus) return;
  if (bonus.stats) {
    target.stats = target.stats || {};
    Object.entries(bonus.stats).forEach(([k, v]) => {
      target.stats[k] = (target.stats[k] || 0) + v;
    });
  }
  ['skillDamagePct', 'maxHpPct', 'moveSpeedPct', 'goldGainPct', 'pickupRadius', 'shopDiscountPct', 'chestRerollFlat'].forEach((k) => {
    if (bonus[k]) target[k] = (target[k] || 0) + bonus[k];
  });
}

function computeAggregatedBonuses() {
  const combined = {};
  TRANSCENDENCE_SKILLS.forEach((def) => {
    const lvl = state.skills?.[def.id] || 0;
    if (!lvl || typeof def.bonuses !== 'function') return;
    mergeBonuses(combined, def.bonuses(lvl));
  });
  return combined;
}

export function applyTranscendenceBonusesToPlayer(player) {
  if (!player) return;
  const bonuses = computeAggregatedBonuses();
  player.transcendenceBonuses = bonuses;
  player.transcendenceTitle = getTranscendenceTitle(state.level);
  player.transcendenceLevel = state.level;
  player.transcendenceSkillPoints = state.skillPoints || 0;

  const statBonuses = bonuses.stats || {};
  const prev = player.__transcendenceStatBonus || {};
  if (!player.stats) player.stats = {};
  Object.entries(statBonuses).forEach(([k, v]) => {
    const delta = v - (prev[k] || 0);
    if (delta !== 0) {
      player.stats[k] = (player.stats[k] || 0) + delta;
    }
  });
  player.__transcendenceStatBonus = { ...statBonuses };
  player.__transcendenceApplied = true;
}

export function setTranscendenceSkillPoints(sp) {
  state.skillPoints = Math.max(0, sp || 0);
  saveState();
}

export function getTranscendenceSkillPoints() {
  return state.skillPoints || 0;
}

export function resetTranscendenceAll() {
  state = defaultState();
  sessionExpGained = 0;
  saveState();
}
