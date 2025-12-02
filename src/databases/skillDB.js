export const SKILL_DB = {
  Fireball: {
    key:'Fireball',
    name:'Fireball',
    category:'Magic',
    element:'FIRE',
    icon:'assets/skill/Fireball.gif',
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
    icon:'assets/skill/Arrow.gif',
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
    icon:'assets/skill/Ice.gif',
    maxLevel:7,
    perLevel:2,
    cooldown:120,
    desc:'Forward crescent; AoE, slows. Scales with INT.',
    unlockLevel:6,
    baseDamage:(s,l)=>Math.max(1,Math.floor(s.int*1.6+l))
  },
  ChainLightning: {
    key:'ChainLightning',
    name:'Chain Lightning',
    category:'Magic',
    element:'WIND',
    icon:'assets/skill/ChainLightning.gif',
    maxLevel:7,
    perLevel:2,
    cooldown:150,
    desc:'Wind-aspected bolt that chains between clustered foes.',
    unlockLevel:6,
    prereqSkills: { LightningBolt: 2 },
    baseDamage:(s,l)=>Math.max(1,Math.floor(s.int*1.75 + l*2))
  },
  LightningBolt: {
    key:'LightningBolt',
    name:'Lightning Bolt',
    category:'Magic',
    element:'WIND',
    icon:'assets/skill/lightning.gif',
    maxLevel:7,
    perLevel:2,
    cooldown:110,
    desc:'Calls a vertical lightning strike on one foe; each level adds another rapid hit (up to 7).',
    unlockLevel:1,
    baseDamage:(s,l)=>Math.max(1,Math.floor(s.int*2.0 + l*2))
  },
  Bash: {
    key:'Bash',
    name:'Bash',
    category:'Physical',
    element:'NEUTRAL',
    icon:'assets/skill/Bash.gif',
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
    icon:'assets/skill/Magnum.gif',
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
    icon:'assets/skill/Toughness.gif',
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
    icon:'assets/skill/Haste.gif',
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
    icon:'assets/skill/Precision.gif',
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
    icon:'assets/skill/HPRegen.gif',
    maxLevel:5,
    perLevel:3,
    desc:'Regenerate HP every 6s. Amount increases per level.',
    unlockLevel:4
  },
  DoubleAttack:{
    key:'DoubleAttack',
    name:'Double Attack',
    category:'Passive',
    element:'NEUTRAL',
    icon:'assets/skill/DoubleAttack.gif',
    maxLevel:5,
    perLevel:1,
    desc:'Chance to strike twice on a hit. Bonus hit shows bold yellow text.',
    unlockLevel:5
  },
	    Meteor: {
    key:'Meteor',
    name:'Meteor Storm',
    type:'active',
    category:'Magic',
    element:'FIRE',
    icon:'assets/skill/Meteor.gif',

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
  Quagmire:{
    key:'Quagmire',
    name:'Quagmire',
    category:'Magic',
    element:'EARTH',
    icon:'assets/skill/Quagmire.gif',
    maxLevel:5,
    perLevel:2,
    cooldown:260,
    desc:'Poisonous ground for 5s; damages over time and makes targets take more fire damage.',
    unlockLevel:7
  },
  ArrowShower:{
    key:'ArrowShower',
    name:'Arrow Shower',
    category:'Range',
    element:'NEUTRAL',
    icon:'assets/skill/ArrowShower.gif',
    maxLevel:5,
    perLevel:2,
    cooldown:320,
    desc:'Launch 5 arrows in a forward crescent. Long cooldown. Damage scales with DEX.',
    unlockLevel:6
  },

};
