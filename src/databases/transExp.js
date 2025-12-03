// Transcendence EXP requirements per level (index = current level).
// Value is the EXP needed to reach the next level.
// Ranges:
//  1-10: 1500
// 11-20: 2000
// 21-30: 2500
// 31-40: 3000
// 41-50: 3500
// 51-60: 4000
// 61-70: 4500
// 71-80: 5000
// 81-90: 5500
// 91-99: 6000

const expForLevel = (lvl) => {
  if (lvl >= 91) return 6000;
  if (lvl >= 81) return 5500;
  if (lvl >= 71) return 5000;
  if (lvl >= 61) return 4500;
  if (lvl >= 51) return 4000;
  if (lvl >= 41) return 3500;
  if (lvl >= 31) return 3000;
  if (lvl >= 21) return 2500;
  if (lvl >= 11) return 2000;
  return 1500;
};

const buildTable = () => {
  const table = [0]; // placeholder for level 0
  for (let lvl = 1; lvl <= 99; lvl++) {
    table[lvl] = lvl === 99 ? Infinity : expForLevel(lvl);
  }
  return table;
};

export const TRANSCENDENCE_EXP_TABLE = buildTable();

export function getTranscendenceExpRequirement(level) {
  if (level >= 99) return Infinity;
  if (level <= 0) return TRANSCENDENCE_EXP_TABLE[1];
  return TRANSCENDENCE_EXP_TABLE[level] || TRANSCENDENCE_EXP_TABLE[TRANSCENDENCE_EXP_TABLE.length - 1];
}
