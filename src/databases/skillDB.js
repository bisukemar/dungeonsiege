export const SKILL_DB = {
  Fireball: {
    key:'Fireball',
    name:'Fireball',
    category:'Magic',
    element:'FIRE',
    maxLevel:7,
    perLevel:2,
    cooldown:90,
    desc:'Fiery orb at nearest enemy. Scales with INT.',
    unlockLevel:1,   // was 2; now can be chosen as starting skill
    baseDamage:(s,l)=>Math.max(1,Math.floor(s.int*2+l))
  },
    Arrow: {
    key:'Arrow',
    name:'Arrow Shot',
    category:'Physical',
    element:'NEUTRAL',
    maxLevel:7,
    perLevel:2,
    cooldown:40,
    desc:'Arrow to nearest enemy. Scales with STR and DEX.',
    // fallback for old code, also the requirement for Lv1
    unlockLevel:4,
    // per-skill-level character requirements
    // Lv1 → 4, Lv2 → 6, Lv3 → 8, ...
    levelReqs: {
      1: 4,
      2: 6,
      3: 8,
      4: 10,
      5: 12,
      6: 14,
      7: 16
    },
    baseDamage:(s,l)=>Math.max(1,Math.floor(s.str*2 + s.dex*0.5 + l))
  },

  Ice: {
    key:'Ice',
    name:'Ice Wave',
    category:'Magic',
    element:'WATER',
    maxLevel:7,
    perLevel:2,
    cooldown:120,
    desc:'Forward crescent; AoE, slows. Scales with INT.',
    unlockLevel:6,
    baseDamage:(s,l)=>Math.max(1,Math.floor(s.int*1.6+l))
  },
  Bash: {
    key:'Bash',
    name:'Bash',
    category:'Physical',
    element:'NEUTRAL',
    maxLevel:7,
    perLevel:2,
    cooldown:70,
    desc:'Narrow forward melee arc. Scales with STR.',
    unlockLevel:1,
    baseDamage:(s,l)=>Math.max(1,Math.floor(s.str*2.2+l))
  },
  Magnum: {
    key:'Magnum',
    name:'Magnum Break',
    category:'Physical',
    element:'NEUTRAL',
    maxLevel:7,
    perLevel:3,
    cooldown:180,
    desc:'360° expanding blast; radius & damage scale.',
    unlockLevel:5,
    baseDamage:(s,l)=>Math.max(1,Math.floor(s.str*1.8+s.dex*0.3+l*2))
  },
  Toughness:{
    key:'Toughness',
    name:'Toughness',
    category:'Passive',
    element:'NEUTRAL',
    maxLevel:5,
    perLevel:1,
    desc:'+10 Max HP per level.',
    unlockLevel:3
  },
  Haste:{
    key:'Haste',
    name:'Haste',
    category:'Passive',
    element:'NEUTRAL',
    maxLevel:5,
    perLevel:1,
    desc:'-1 attack cooldown frame per level (min 6).',
    unlockLevel:3
  },
  Precision:{
    key:'Precision',
    name:'Precision',
    category:'Passive',
    element:'NEUTRAL',
    maxLevel:5,
    perLevel:1,
    desc:'+2% critical chance per level.',
    unlockLevel:4
  },
  HPRegen:{
    key:'HPRegen',
    name:'HP Regen',
    category:'Passive',
    element:'NEUTRAL',
    maxLevel:5,
    perLevel:3,
    desc:'Regenerate HP every 6s. Amount increases per level.',
    unlockLevel:4
  },
	    Meteor: {
    key:'Meteor',
    name:'Meteor Storm',
    type:'active',
    category:'Magic',
    element:'FIRE',

    desc:'Call down a delayed meteor that explodes in an area. Higher level = larger radius and shorter delay.',
    maxLevel:5,
    cost:1,

    // Minimum requirement for the first level (fallback)
    unlockLevel:8,

    // Per-skill-level character requirements:
    // Lv1 → 8, Lv2 → 10, Lv3 → 12, Lv4 → 14, Lv5 → 16
    levelReqs: {
      1: 8,
      2: 10,
      3: 12,
      4: 14,
      5: 16
    },

    // Requires Fireball at least Lv 2 to learn Meteor at all
    prereqSkills: {
      Fireball: 2
    },

    // Parameters used by the skill implementation
    baseRadius: 60,           // px
    radiusPerLevel: 10,       // + per skill level
    baseDelay: 90,            // frames before impact at Lv1
    delayPerLevel: 8,         // delay reduction per level
    baseDamageMultiplier: 3,  // scales with INT
    bonusDamagePerLevel: 4
  },

};
