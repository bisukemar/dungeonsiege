const DEFAULT_SPRITE = null; // sprites disabled for now

export const MONSTER_DB = [
  { name:'Breeze Slime', level:1, hp:24, exp:4, element:'WIND',   defense:0,   speed:1.2, attackType:'melee',  attackRange:22,  attackDamage:6,  attackCooldown:45,
    // Sprite sheet uses 13 rows (0–12) and ~7 cols based on player-style layout.
    // Rows: 0-2 idle, 3-5 move, 6-8 attack, 9-11 damaged, 12 death.
    sprite:{
      src:'assets/mob/breezeslime.png',
      rows:13,
      cols:7,
      rowMap:{ idle:0, move:3, attackR:6, attackL:6, death:12 },
      frameCounts:{ idle:6, move:6, attackR:6, attackL:6, death:1 }
    }
  },
  { name:'White Shade',  level:1, hp:22, exp:3, element:'NEUTRAL',defense:0,   speed:1.1, attackType:'melee',  attackRange:20,  attackDamage:5,  attackCooldown:45 },
  { name:'Gust Wolf',    level:2, hp:36, exp:6, element:'WIND',   defense:0.5, speed:1.6, attackType:'melee',  attackRange:28,  attackDamage:8,  attackCooldown:45 },
  { name:'Cinder Imp',   level:2, hp:34, exp:6, element:'FIRE',   defense:1,   speed:1.0, attackType:'ranged', attackRange:240, attackDamage:6,  attackCooldown:65 },
  { name:'Dew Sprite',   level:2, hp:30, exp:6, element:'WATER',  defense:0.5, speed:1.1, attackType:'ranged', attackRange:260, attackDamage:5,  attackCooldown:65 },
  { name:'Stone Bruiser',level:3, hp:70, exp:9, element:'EARTH',  defense:2.5, speed:0.9, attackType:'melee',  attackRange:30,  attackDamage:12, attackCooldown:60 },
  { name:'Fire Archer',  level:3, hp:40, exp:8, element:'FIRE',   defense:0.5, speed:1.0, attackType:'ranged', attackRange:300, attackDamage:9,  attackCooldown:70 },
  { name:'Water Mage',   level:3, hp:42, exp:8, element:'WATER',  defense:0.5, speed:0.95,attackType:'ranged', attackRange:320, attackDamage:10, attackCooldown:75 },
  { name:'Pebble Golem', level:4, hp:90, exp:11,element:'EARTH',  defense:3,   speed:0.8, attackType:'melee',  attackRange:32,  attackDamage:15, attackCooldown:60 },
  { name:'Flare Bat',    level:4, hp:60, exp:10,element:'FIRE',   defense:1,   speed:1.5, attackType:'ranged', attackRange:300, attackDamage:11, attackCooldown:55 },
  { name:'Mire Crab',    level:4, hp:80, exp:10,element:'WATER',  defense:1.5, speed:0.95,attackType:'melee',  attackRange:26,  attackDamage:13, attackCooldown:65 },
  { name:'Boulderback',  level:5, hp:110,exp:14,element:'EARTH',  defense:3.5, speed:0.75,attackType:'melee',  attackRange:34,  attackDamage:18, attackCooldown:70 },
  { name:'Tempest Ranger',level:5,hp:72, exp:13,element:'WIND',   defense:1.2, speed:1.4, attackType:'ranged', attackRange:360, attackDamage:14, attackCooldown:70 },
  { name:'Arcane Wisp',  level:5, hp:66, exp:12,element:'NEUTRAL',defense:1.0, speed:1.2, attackType:'ranged', attackRange:340, attackDamage:12, attackCooldown:65 }
];

export const BOSS_DB = [
  {
    name:'Ancient Treant',
    baseHp:1200,
    element:'EARTH',
    defense:6,
    speed:0.9,
    attackType:'melee',
    attackRange:45,
    attackDamage:25,
    attackCooldown:60,
    color:'#7b9b5f',
    skills:[
      { key:'Bash', level:3 },
      { key:'Magnum', level:2 },
      { key:'Toughness', level:3 }
    ],
    bossDrops:[
      // Uncommon (4)
      'thorned_wrap','scout_vest','bronze_buckler','drill_rapier',
      // Rare (3)
      'verdant_wrap','runed_brigandine','tide_ward',
      // Legendary (2)
      'juggernaut_cuirass','titan_guard',
      // Unique (1)
      'phoenix_charm'
    ],
    sprite:DEFAULT_SPRITE
  },
  {
    name:'Inferno Drake',
    baseHp:1000,
    element:'FIRE',
    defense:4,
    speed:1.2,
    attackType:'ranged',
    attackRange:420,
    attackDamage:28,
    attackCooldown:55,
    color:'#ff6a3d',
    skills:[
      { key:'Fireball', level:4, cooldown:180 },
      { key:'Meteor', level:2, cooldownMult:1.8 },
      { key:'Haste', level:2 }
    ],
    skillCooldownFactor:1.5,
    bossDrops:[
      // Uncommon
      'ashen_wand','courier_boots','sentry_sash','breeze_hood',
      // Rare
      'emberweave_cloak','glacial_scepter','windstep_boots',
      // Legendary
      'inferno_staff','crown_of_sparks',
      // Unique
      'pyromancer_revenge'
    ],
    sprite:DEFAULT_SPRITE
  },
  {
    name:'Leviathan Spawn',
    baseHp:1100,
    element:'WATER',
    defense:5,
    speed:1.0,
    attackType:'ranged',
    attackRange:440,
    attackDamage:26,
    attackCooldown:55,
    color:'#49b0ff',
    skills:[
      { key:'Ice', level:4 },
      { key:'Magnum', level:2 },
      { key:'HPRegen', level:2 }
    ],
    bossDrops:[
      // Uncommon
      'layered_jerkin','steady_bracelet','cushioned_greaves','hide_kite',
      // Rare
      'siren_vestments','tide_ward','runed_brigandine',
      // Legendary
      'arcanist_plate','stormstride_sandals',
      // Unique
      'phoenix_charm'
    ],
    sprite:DEFAULT_SPRITE
  },
  {
    name:'Tempest Hydra',
    baseHp:950,
    element:'WIND',
    defense:4,
    speed:1.3,
    attackType:'ranged',
    attackRange:460,
    attackDamage:24,
    attackCooldown:50,
    color:'#7fe27f',
    skills:[
      { key:'Arrow', level:4 },
      { key:'Bash', level:3 },
      { key:'Haste', level:2 }
    ],
    bossDrops:[
      // Uncommon
      'breeze_hood','courier_boots','drill_rapier','bronze_buckler',
      // Rare
      'falcon_visor','runed_brigandine','windstep_boots',
      // Legendary
      'tempest_longbow','hawkeye_helm',
      // Unique
      'phoenix_charm'
    ],
    sprite:DEFAULT_SPRITE
  },
  {
    name:'Phantom King',
    baseHp:900,
    element:'NEUTRAL',
    defense:5,
    speed:1.1,
    attackType:'melee',
    attackRange:50,
    attackDamage:30,
    attackCooldown:58,
    color:'#eaeaea',
    skills:[
      { key:'Magnum', level:3 },
      { key:'Bash', level:3 },
      { key:'HPRegen', level:3 }
    ],
    bossDrops:[
      // Uncommon
      'thorned_wrap','steady_bracelet','cushioned_greaves','hide_kite',
      // Rare
      'siren_vestments','tide_ward','emberweave_cloak',
      // Legendary
      'colossus_greathammer','juggernaut_cuirass',
      // Unique
      'phoenix_charm'
    ],
    sprite:DEFAULT_SPRITE
  }
];
