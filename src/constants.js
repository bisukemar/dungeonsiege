export const ELEMENT = {
  NEUTRAL:'NEUTRAL',
  FIRE:'FIRE',
  WATER:'WATER',
  WIND:'WIND',
  EARTH:'EARTH'
};

export const MONSTER_COLOR = {
  [ELEMENT.WIND]:  '#4caf50',
  [ELEMENT.FIRE]:  '#e34a4a',
  [ELEMENT.WATER]: '#4aa3e3',
  [ELEMENT.NEUTRAL]:'#eaeaea',
  [ELEMENT.EARTH]: '#8b5a2b'
};

// simplified Ragnarok-style element interaction
export const ELEMENT_TABLE = {
  WIND:   { NEUTRAL:1.00, FIRE:1.00, WATER:0.50, WIND:0.25, EARTH:2.00 },
  FIRE:   { WATER:2.00, EARTH:0.75, FIRE:0.25 },
  WATER:  { WIND:2.00, FIRE:0.50, WATER:0.25 },
  EARTH:  { WIND:0.50, FIRE:2.00 },
  NEUTRAL:{}
};

export function elementMod(monsterElem, atkElem){
  const row = ELEMENT_TABLE[monsterElem]||{};
  return row[atkElem] ?? 1.0;
}

export const PLAYER_BASE_HP = 100;
export const HP_PER_VIT = 20;

// virtual world size (camera scrolls inside this)
export const WORLD = { width: 3600, height: 2400 };
