// Central item database

// Reusable unique item effects (can be attached to bonuses.uniqueAbility)
export function meteorEchoAbility({ centerX, centerY, radius, delay, dmg, spawnStrike }) {
  if (typeof spawnStrike !== 'function') return;
  const ang = Math.random() * Math.PI * 2;
  const extraRadius = Math.max(30, radius * 0.55);
  const minGap = 18;
  const minDist = radius + extraRadius + minGap;
  const maxDist = Math.max(minDist + 30, radius * 1.35);
  const dist = minDist + Math.random() * (maxDist - minDist);
  const extraX = centerX + Math.cos(ang) * dist;
  const extraY = centerY + Math.sin(ang) * dist;
  const extraDmg = Math.max(1, Math.round(dmg * 0.5));
  // delay spawning the telegraph itself by ~0.5 second
  setTimeout(() => spawnStrike(extraX, extraY, extraRadius, delay, extraDmg), 500);
}

// Unique revive effect: schedule a revive after a delay, consuming the item
export function phoenixReviveAbility({ reviveWithDelay }) {
  if (typeof reviveWithDelay !== 'function') return;
  reviveWithDelay(5); // seconds
}

export const ITEMS_DB = [
  // =======================
  // Headgear
  // =======================
  {
    id: 'cloth_bandana',
    name: 'Cloth Bandana',
    slot: 'head',
    price: 15,
    rarity: 'Common',
    sprite: 'assets/item/cloth_bandana.gif',
    desc: ' Max HP. A simple cloth to keep sweat off your eyes.',
    bonuses: { 
      maxHp: 10 
    }
  },
  {
    id: 'feather_headband',
    name: 'Feather Headband',
    slot: 'head',
    price: 15,
    rarity: 'Uncommon',
    sprite: 'assets/item/feather_headband.gif',
    desc: '+1% crit chance. Light as a feather, sharpens your focus.',
    bonuses: { 
      critChance: 0.01 
    }
  },
  {
    id: 'training_circlet',
    name: 'Training Circlet',
    slot: 'head',
    price: 15,
    rarity: 'Uncommon',
    sprite: 'assets/item/training_circlet.gif',
    desc: '+1 Int. A basic circlet for new adventurers.',
    bonuses: { 
      int:1, 
      critChance: 0.01 
    }
  },
  {
    id: 'breeze_hood',
    name: 'Breeze Hood',
    slot: 'head',
    price: 95,
    rarity: 'Uncommon',
    sprite: 'assets/item/breeze_hood.gif',
    desc: '+1 AGI, +0.5 DEF. Light hood that rides the wind.',
    bonuses: { agi: 1, defense: 0.5 }
  },
  {
    id: 'watchers_visor',
    name: "Watcher's Visor",
    slot: 'head',
    price: 105,
    rarity: 'Uncommon',
    sprite: 'assets/item/watchers_visor.gif',
    desc: '+1 DEX, +1% crit chance. Keeps your eyes sharp.',
    bonuses: { dex: 1, critChance: 0.01 }
  },
  {
    id: 'aether_circlet',
    name: 'Aether Circlet',
    slot: 'head',
    price: 220,
    rarity: 'Rare',
    sprite: 'assets/item/aether_circlet.gif',
    desc: '+2 INT, +2% crit chance. A circlet humming with arcane focus.',
    bonuses: { int: 2, critChance: 0.02 }
  },
  {
    id: 'falcon_visor',
    name: 'Falcon Visor',
    slot: 'head',
    price: 240,
    rarity: 'Rare',
    sprite: 'assets/item/falcon_visor.gif',
    desc: '+2 DEX, +3% crit chance. Visor that sharpens a hunter’s gaze.',
    bonuses: { dex: 2, critChance: 0.03 }
  },
  {
    id: 'crown_of_sparks',
    name: 'Crown of Sparks',
    slot: 'head',
    price: 520,
    rarity: 'Legendary',
    sprite: 'assets/item/crown_of_sparks.gif',
    desc: '+3 INT, +4% crit chance, +1 Fireball level. Wreathed in crackling motes.',
    bonuses: { int: 3, critChance: 0.04, skill: { Fireball: 1 } }
  },
  {
    id: 'hawkeye_helm',
    name: 'Hawkeye Helm',
    slot: 'head',
    price: 540,
    rarity: 'Legendary',
    sprite: 'assets/item/hawkeye_helm.gif',
    desc: '+3 DEX, +5% crit chance. Helm with lenses for eagle-eyed shots.',
    bonuses: { dex: 3, critChance: 0.05 }
  },
  {
    id: 'warbanner_visor',
    name: 'Warbanner Visor',
    slot: 'head',
    price: 560,
    rarity: 'Legendary',
    sprite: 'assets/item/warbanner_visor.gif',
    desc: '+2 STR, +1 VIT, +12% crit damage. Visor adorned with battle sigils.',
    bonuses: { str: 2, vit: 1, critDamage: 0.12 }
  },
  {
    id: 'wool_beanie',
    name: 'Wool Beanie',
    slot: 'head',
    price: 15,
    rarity: 'Common',
    sprite: 'assets/item/wool_beanie.gif',
    desc: ' Max HP. A cozy knit beanie for chilly mornings.',
    bonuses: { maxHp: 5 }
  },
  {
    id: 'dust_visor',
    name: 'Dust Visor',
    slot: 'head',
    price: 15,
    rarity: 'Common',
    sprite: 'assets/item/dust_visor.gif',
    desc: '+1 DEX. Keeps grit out of your eyes on long treks.',
    bonuses: { dex: 1 }
  },
  {
    id: 'scout_cap',
    name: 'Scout Cap',
    slot: 'head',
    price: 15,
    rarity: 'Common',
    sprite: 'assets/item/scout_cap.gif',
    desc: '+1 AGI. Lightweight cap for quick movers.',
    bonuses: { agi: 1 }
  },
  {
    id: 'ember_crown',
    name: 'Ember Crown',
    slot: 'head',
    rarity: 'Legendary', // was Rare; now Legendary to match +3 skill levels
    price: 400,
    shopAvailable: false,
    sprite: 'assets/item/ember_crown.gif',
    desc: '+3% crit chance, +2 Fireball level, +1 Meteor level. A crown wreathed in eternal embers.',
    bonuses: {
      critChance: 0.03,
      skill: { Fireball: 2, Meteor: 1 } // total = 3 (Legendary rule)
    }
  },

  // =======================
  // Armor
  // =======================
  {
    id: 'cloth_robe',
    name: 'Cloth Robe',
    slot: 'armor',
    price: 30,
    rarity: 'Common',
    sprite: 'assets/item/cloth_robe.gif',
    desc: ' Max HP. Simple robe offering light protection.',
    bonuses: { 
      maxHp: 20
     }
  },
  {
    id: 'leather_armor',
    name: 'Leather Armor',
    slot: 'armor',
    price: 30,
    rarity: 'Uncommon',
    sprite: 'assets/item/leather_armor.gif',
    desc: ' Max HP. Sturdy leather armor for frontline trainees.',
    bonuses: { 
      maxHp: 30
     }
  },
  {
    id: 'padded_vest',
    name: 'Padded Vest',
    slot: 'armor',
    price: 30,
    rarity: 'Rare', // was Uncommon; now Rare to match +2 skill levels
    sprite: 'assets/item/padded_vest.gif',
    desc: ' Max HP, +1 Bash level. Extra padding for practicing heavy strikes.',
    bonuses: {
      maxHp: 25,
      skill: { Bash: 1 }
    }
  },
  {
    id: 'tidal_robe',
    name: 'Tidal Robe',
    slot: 'armor',
    rarity: 'Legendary',
    price: 420,
    shopAvailable: false,
    sprite: 'assets/item/tidal_robe.gif',
    desc: ' Max HP, +3 VIT, +2 Ice level. Robes imbued with the chill of rolling tides.',
    bonuses: {
      maxHp: 35,
      vit: 2,
      skill: { Ice: 2 } 
    }
  },
  {
    id: 'padded_jerkin',
    name: 'Padded Jerkin',
    slot: 'armor',
    price: 30,
    rarity: 'Common',
    sprite: 'assets/item/padded_jerkin.gif',
    desc: ' Max HP. Light padding for novice adventurers.',
    bonuses: { maxHp: 10 }
  },
  {
    id: 'linen_vest',
    name: 'Linen Vest',
    slot: 'armor',
    price: 30,
    rarity: 'Common',
    sprite: 'assets/item/linen_vest.gif',
    desc: '+1 VIT. Breathable vest favored by travelers.',
    bonuses: { vit: 1 }
  },
  {
    id: 'runners_tunic',
    name: "Runner's Tunic",
    slot: 'armor',
    price: 30,
    rarity: 'Common',
    sprite: 'assets/item/runners_tunic.gif',
    desc: '+1 AGI. Tunic cut for ease of movement.',
    bonuses: { agi: 1 }
  },
  {
    id: 'layered_jerkin',
    name: 'Layered Jerkin',
    slot: 'armor',
    price: 120,
    rarity: 'Uncommon',
    sprite: 'assets/item/layered_jerkin.gif',
    desc: ' Max HP, +1 VIT. Extra layers for staying power.',
    bonuses: { maxHp: 15, vit: 1 }
  },
  {
    id: 'scout_vest',
    name: 'Scout Vest',
    slot: 'armor',
    price: 125,
    rarity: 'Uncommon',
    sprite: 'assets/item/scout_vest.gif',
    desc: '+1 AGI, +0.5 DEF. Light protection for mobile scouts.',
    bonuses: { agi: 1, defense: 0.5 }
  },
  {
    id: 'runed_brigandine',
    name: 'Runed Brigandine',
    slot: 'armor',
    price: 260,
    rarity: 'Rare',
    sprite: 'assets/item/runed_brigandine.gif',
    desc: ' Max HP, +2 DEF. Reinforced plates etched with wards.',
    bonuses: { maxHp: 40, defense: 2 }
  },
  {
    id: 'siren_vestments',
    name: 'Siren Vestments',
    slot: 'armor',
    price: 250,
    rarity: 'Rare',
    sprite: 'assets/item/siren_vestments.gif',
    desc: '+2 VIT,  Max HP. Flowing vestments that steady the breath.',
    bonuses: { vit: 2, maxHp: 25 }
  },
  {
    id: 'arcanist_plate',
    name: 'Arcanist Plate',
    slot: 'armor',
    price: 620,
    rarity: 'Legendary',
    sprite: 'assets/item/arcanist_plate.gif',
    desc: ' Max HP, +2 DEF, +2 INT. Plate etched with arcane sigils.',
    bonuses: { maxHp: 50, defense: 2, int: 2 }
  },
  {
    id: 'ranger_hauberk',
    name: 'Ranger Hauberk',
    slot: 'armor',
    price: 610,
    rarity: 'Legendary',
    sprite: 'assets/item/ranger_hauberk.gif',
    desc: '+2 DEX, +2 AGI, +1 DEF. Mail favored by expert marksmen.',
    bonuses: { dex: 2, agi: 2, defense: 1 }
  },
  {
    id: 'juggernaut_cuirass',
    name: 'Juggernaut Cuirass',
    slot: 'armor',
    price: 640,
    rarity: 'Legendary',
    sprite: 'assets/item/juggernaut_cuirass.gif',
    desc: ' Max HP, +2 STR, +2 VIT, +2 DEF. Heavy cuirass for unstoppable fronts.',
    bonuses: { maxHp: 60, str: 2, vit: 2, defense: 2 }
  },

  // =======================
  // Weapon
  // =======================
  {
    id: 'practice_sword',
    name: 'Practice Sword',
    slot: 'weapon',
    price: 25,
    rarity: 'Common',
    sprite: 'assets/item/practice_sword.gif',
    desc: '+1 Str. Lightweight sword for training basic sword skills.',
    bonuses: { str: 1 }
  },
  {
    id: 'wooden_staff',
    name: 'Wooden Staff',
    slot: 'weapon',
    price: 25,
    rarity: 'Common',
    sprite: 'assets/item/wooden_staff.gif',
    desc: '+1 Int. A simple staff for novice mages.',
    bonuses: { int: 1 }
  },
  {
    id: 'training_bow',
    name: 'Training Bow',
    slot: 'weapon',
    price: 25,
    rarity: 'Common',
    sprite: 'assets/item/training_bow.gif',
    desc: '+1 Dex. A basic bow used in archery drills.',
    bonuses: { dex: 1 }
  },
  {
    id: 'oak_rod',
    name: 'Oak Rod',
    slot: 'weapon',
    price: 25,
    rarity: 'Common',
    sprite: 'assets/item/oak_rod.gif',
    desc: '+1 INT. A sturdy rod carved from oak.',
    bonuses: { int: 1 }
  },
  {
    id: 'blunt_shortsword',
    name: 'Blunt Shortsword',
    slot: 'weapon',
    price: 25,
    rarity: 'Common',
    sprite: 'assets/item/blunt_shortsword.gif',
    desc: '+1 STR, +5% crit damage. A dulled blade that still hits hard.',
    bonuses: { str: 1, critDamage: 0.05 }
  },
  {
    id: 'foragers_bow',
    name: "Forager's Bow",
    slot: 'weapon',
    price: 25,
    rarity: 'Common',
    sprite: 'assets/item/foragers_bow.gif',
    desc: '+1 DEX, +1% crit chance. Simple bow favored by foragers.',
    bonuses: { dex: 1, critChance: 0.01 }
  },
  {
    id: 'ashen_wand',
    name: 'Ashen Wand',
    slot: 'weapon',
    price: 120,
    rarity: 'Uncommon',
    sprite: 'assets/item/ashen_wand.gif',
    desc: '+1 INT, +1 Fireball level. Wand still warm to the touch.',
    bonuses: { int: 1, skill: { Fireball: 1 } }
  },
  {
    id: 'drill_rapier',
    name: 'Drill Rapier',
    slot: 'weapon',
    price: 125,
    rarity: 'Uncommon',
    sprite: 'assets/item/drill_rapier.gif',
    desc: '+1 STR, +1 DEX. Piercing blade for precise thrusts.',
    bonuses: { str: 1, dex: 1 }
  },
  {
    id: 'glacial_scepter',
    name: 'Glacial Scepter',
    slot: 'weapon',
    price: 260,
    rarity: 'Rare',
    sprite: 'assets/item/glacial_scepter.gif',
    desc: '+2 INT, +1 Ice level. Scepter chilled to the core.',
    bonuses: { int: 2, skill: { Ice: 1 } }
  },
  {
    id: 'shocklance',
    name: 'Shocklance',
    slot: 'weapon',
    price: 255,
    rarity: 'Rare',
    sprite: 'assets/item/shocklance.gif',
    desc: '+1 STR, +1 DEX, +1 Arrow level. Lance that crackles on thrust.',
    bonuses: { str: 1, dex: 1, skill: { Arrow: 1 } }
  },
  {
    id: 'inferno_staff',
    name: 'Inferno Staff',
    slot: 'weapon',
    price: 700,
    rarity: 'Legendary',
    sprite: 'assets/item/inferno_staff.gif',
    desc: '+3 INT, +2 Fireball level, +1 Meteor level. Staff blazing with inner fire.',
    bonuses: { int: 3, skill: { Fireball: 2, Meteor: 1 } }
  },
  {
    id: 'tempest_longbow',
    name: 'Tempest Longbow',
    slot: 'weapon',
    price: 690,
    rarity: 'Legendary',
    sprite: 'assets/item/tempest_longbow.gif',
    desc: '+3 DEX, +2 Arrow level, +1 Arrow Shower level. Bow that rides the storm.',
    bonuses: { dex: 3, skill: { Arrow: 2, ArrowShower: 1 } }
  },
  {
    id: 'colossus_greathammer',
    name: 'Colossus Greathammer',
    slot: 'weapon',
    price: 710,
    rarity: 'Legendary',
    sprite: 'assets/item/colossus_greathammer.gif',
    desc: '+3 STR, +2 Bash level, +1 Magnum level. A hammer that shakes the ground.',
    bonuses: { str: 3, skill: { Bash: 2, Magnum: 1 } }
  },
  {
    id: 'pyromancer_revenge',
    name: "Pyromancer's Revenge",
    slot: 'weapon',
    rarity: 'Unique',
    price: 700,
    shopAvailable: false,
    sprite: 'assets/item/pyromancer_revenge.gif',
    desc: 'INT +2, DEX +2. Meteor Storm drops an additional smaller impact nearby for bonus damage.',
    bonuses: {
      int: 2,
      dex: 2,
      uniqueAbility: {
        onMeteorCast: meteorEchoAbility
      }
    }
  },

  // =======================
  // Shield
  // =======================
  {
    id: 'wooden_shield',
    name: 'Wooden Shield',
    slot: 'shield',
    price: 25,
    rarity: 'Common',
    sprite: 'assets/item/wooden_shield.gif',
    desc: '+0.5 Def.  Max HP. A crude shield carved from sturdy planks.',
    bonuses: { 
      defense: 0.5,
      maxHp: 10 
    }
  },
  {
    id: 'buckler',
    name: 'Buckler',
    slot: 'shield',
    price: 25,
    rarity: 'Uncommon',
    sprite: 'assets/item/buckler.gif',
    desc: ' Max HP. +1 Agi. A light buckler that keeps you nimble.',
    bonuses: { 
      maxHp: 15,
      defense: 1 
    }
  },
  {
    id: 'round_guard',
    name: 'Round Guard',
    slot: 'shield',
    price: 25,
    rarity: 'Uncommon',
    sprite: 'assets/item/round_guard.gif',
    desc: ' Max HP, +2 DEF. A well-balanced shield that guards and steadies you.',
    bonuses: {
      maxHp: 20,
      defense: 2
    }
  },
  {
    id: 'bark_buckler',
    name: 'Bark Buckler',
    slot: 'shield',
    price: 25,
    rarity: 'Common',
    sprite: 'assets/item/bark_buckler.gif',
    desc: '+0.5 DEF. A thin shield of hardened bark.',
    bonuses: { defense: 0.5 }
  },
  {
    id: 'tin_roundel',
    name: 'Tin Roundel',
    slot: 'shield',
    price: 25,
    rarity: 'Common',
    sprite: 'assets/item/tin_roundel.gif',
    desc: '+1 DEF. Light metal shield for basic drills.',
    bonuses: { defense: 1 }
  },
  {
    id: 'reed_guard',
    name: 'Reed Guard',
    slot: 'shield',
    price: 25,
    rarity: 'Common',
    sprite: 'assets/item/reed_guard.gif',
    desc: ' Max HP. Woven reeds offer a touch of padding.',
    bonuses: { maxHp: 6 }
  },
  {
    id: 'bronze_buckler',
    name: 'Bronze Buckler',
    slot: 'shield',
    price: 120,
    rarity: 'Uncommon',
    sprite: 'assets/item/bronze_buckler.gif',
    desc: '+1.5 DEF. A solid bronze disc for parrying blows.',
    bonuses: { defense: 1.5 }
  },
  {
    id: 'hide_kite',
    name: 'Hide Kite',
    slot: 'shield',
    price: 115,
    rarity: 'Uncommon',
    sprite: 'assets/item/hide_kite.gif',
    desc: ' Max HP, +0.5 DEF. Tough hide stretched over a sturdy frame.',
    bonuses: { maxHp: 12, defense: 0.5 }
  },
  {
    id: 'bulwark_plate',
    name: 'Bulwark Plate',
    slot: 'shield',
    price: 260,
    rarity: 'Rare',
    sprite: 'assets/item/bulwark_plate.gif',
    desc: '+3 DEF,  Max HP. Heavy plate shield for steadfast defense.',
    bonuses: { defense: 3, maxHp: 20 }
  },
  {
    id: 'tide_ward',
    name: 'Tide Ward',
    slot: 'shield',
    price: 250,
    rarity: 'Rare',
    sprite: 'assets/item/tide_ward.gif',
    desc: '+2 DEF,  Max HP. Shell-like ward that shrugs off blows.',
    bonuses: { defense: 2, maxHp: 15 }
  },
  {
    id: 'aegis_of_embers',
    name: 'Aegis of Embers',
    slot: 'shield',
    price: 620,
    rarity: 'Legendary',
    sprite: 'assets/item/aegis_of_embers.gif',
    desc: '+4 DEF,  Max HP. Shield warm to the touch, warding and searing.',
    bonuses: { defense: 4, maxHp: 30 }
  },
  {
    id: 'wardens_bulwark',
    name: "Warden's Bulwark",
    slot: 'shield',
    price: 610,
    rarity: 'Legendary',
    sprite: 'assets/item/wardens_bulwark.gif',
    desc: '+4 DEF, +2 AGI. Broad shield for agile defenders.',
    bonuses: { defense: 4, agi: 2 }
  },
  {
    id: 'titan_guard',
    name: 'Titan Guard',
    slot: 'shield',
    price: 640,
    rarity: 'Legendary',
    sprite: 'assets/item/titan_guard.gif',
    desc: '+5 DEF,  Max HP. Massive guard that anchors the line.',
    bonuses: { defense: 5, maxHp: 40 }
  },

  // =======================
  // Garment
  // =======================
  {
    id: 'cotton_cloak',
    name: 'Cotton Cloak',
    slot: 'garment',
    price: 20,
    rarity: 'Common',
    sprite: 'assets/item/cotton_cloak.gif',
    desc: '+0.5 DEF. Light cloak that makes travel slightly easier.',
    bonuses: {
      defense: 0.5 
    }
  },
  {
    id: 'traveler_mantle',
    name: "Traveler's Mantle",
    slot: 'garment',
    price: 20,
    rarity: 'Uncommon',
    sprite: 'assets/item/traveler_mantle.gif',
    desc: '+1 DEF,  Max HP. A sturdy mantle favored by long-distance wanderers.',
    bonuses: { defense: 1, hp: 5 }
  },
  {
    id: 'scarf_shawl',
    name: 'Scarf Shawl',
    slot: 'garment',
    price: 20,
    rarity: 'Uncommon',
    sprite: 'assets/item/scarf_shawl.gif',
    desc: '+1 DEF, +1% crit chance. Fashion and function in one wrap.',
    bonuses: {
      defense: 1,
      critChance: 0.01
    }
  },
  {
    id: 'twine_sash',
    name: 'Twine Sash',
    slot: 'garment',
    price: 20,
    rarity: 'Common',
    sprite: 'assets/item/twine_sash.gif',
    desc: ' Max HP. Simple twine belt offering slight support.',
    bonuses: { maxHp: 8 }
  },
  {
    id: 'travelers_wrap',
    name: "Traveler's Wrap",
    slot: 'garment',
    price: 20,
    rarity: 'Common',
    sprite: 'assets/item/travelers_wrap.gif',
    desc: '+1 STR. Rugged wrap for hauling gear.',
    bonuses: { str: 1 }
  },
  {
    id: 'woven_shawl',
    name: 'Woven Shawl',
    slot: 'garment',
    price: 20,
    rarity: 'Common',
    sprite: 'assets/item/woven_shawl.gif',
    desc: '+1 VIT. Cozy shawl that bolsters endurance.',
    bonuses: { vit: 1 }
  },
  {
    id: 'sentry_sash',
    name: 'Sentry Sash',
    slot: 'garment',
    price: 95,
    rarity: 'Uncommon',
    sprite: 'assets/item/sentry_sash.gif',
    desc: '+1 STR, +1% crit chance. Worn by vigilant sentries.',
    bonuses: { str: 1, critChance: 0.01 }
  },
  {
    id: 'thorned_wrap',
    name: 'Thorned Wrap',
    slot: 'garment',
    price: 100,
    rarity: 'Uncommon',
    sprite: 'assets/item/thorned_wrap.gif',
    desc: '+1 VIT, +0.5 DEF. Prickly wrap that hardens your stance.',
    bonuses: { vit: 1, defense: 0.5 }
  },
  {
    id: 'emberweave_cloak',
    name: 'Emberweave Cloak',
    slot: 'garment',
    price: 250,
    rarity: 'Rare',
    sprite: 'assets/item/emberweave_cloak.gif',
    desc: '+1 STR, +10% crit damage. Cloak threaded with fiery sigils.',
    bonuses: { str: 1, critDamage: 0.10 }
  },
  {
    id: 'verdant_wrap',
    name: 'Verdant Wrap',
    slot: 'garment',
    price: 245,
    rarity: 'Rare',
    sprite: 'assets/item/verdant_wrap.gif',
    desc: '+2 VIT,  Max HP. Wrap lush with life-giving fibers.',
    bonuses: { vit: 2, maxHp: 20 }
  },
  {
    id: 'spellwoven_mantle',
    name: 'Spellwoven Mantle',
    slot: 'garment',
    price: 520,
    rarity: 'Legendary',
    sprite: 'assets/item/spellwoven_mantle.gif',
    desc: '+2 INT, +3% crit chance, +10% crit damage. Mantle stitched with runic thread.',
    bonuses: { int: 2, critChance: 0.03, critDamage: 0.10 }
  },
  {
    id: 'stalker_cape',
    name: 'Stalker Cape',
    slot: 'garment',
    price: 510,
    rarity: 'Legendary',
    sprite: 'assets/item/stalker_cape.gif',
    desc: '+2 DEX, +0.12 move speed, +3% crit chance. Cape favored by silent hunters.',
    bonuses: { dex: 2, moveSpeed: 0.12, critChance: 0.03 }
  },
  {
    id: 'battlewrap_of_might',
    name: 'Battlewrap of Might',
    slot: 'garment',
    price: 540,
    rarity: 'Legendary',
    sprite: 'assets/item/battlewrap_of_might.gif',
    desc: '+2 STR, +2 VIT, +12% crit damage. Heavy wrap for brawlers.',
    bonuses: { str: 2, vit: 2, critDamage: 0.12 }
  },
  {
    id: 'earthbreaker_sash',
    name: 'Earthbreaker Sash',
    slot: 'garment',
    rarity: 'Legendary',
    price: 540,
    shopAvailable: false,
    sprite: 'assets/item/earthbreaker_sash.gif',
    desc: '+3 STR, +2 VIT, +2 Bash level. A heavy sash that channels earth-shattering blows.',
    bonuses: {
      str: 3,
      vit: 2,
      skill: { Bash: 2 }
    }
  },

  // =======================
  // Shoes
  // =======================
  {
    id: 'sandals',
    name: 'Light Sandals',
    slot: 'shoes',
    price: 30,
    rarity: 'Common',
    sprite: 'assets/item/sandals.gif',
    desc: '+0.10 move speed. Simple sandals for beginners.',
    bonuses: { moveSpeed: 0.10 }
  },
  {
    id: 'leather_boots',
    name: 'Leather Boots',
    slot: 'shoes',
    price: 30,
    rarity: 'Uncommon',
    sprite: 'assets/item/leather_boots.gif',
    desc: '+0.15 move speed. Sturdy boots built for rough terrain.',
    bonuses: { moveSpeed: 0.15 }
  },
  {
    id: 'runner_shoes',
    name: 'Runner Shoes',
    slot: 'shoes',
    price: 30,
    rarity: 'Uncommon',
    sprite: 'assets/item/runner_shoes.gif',
    desc: '+0.18 move speed, -1 skill cooldown. Shoes made for non-stop sprinting.',
    bonuses: {
      moveSpeed: 0.18,
      cooldownFlat: 1
    }
  },
  {
    id: 'stormrunner_boots',
    name: 'Stormrunner Boots',
    slot: 'shoes',
    rarity: 'Legendary',
    price: 520,
    shopAvailable: false,
    sprite: 'assets/item/stormrunner_boots.gif',
    desc: '+28% move speed, +2 DEX, +2 AGI. Boots that ride the edge of a storm.',
    bonuses: {
      moveSpeed: 0.28,
      dex: 2,
      agi: 2
    }
  },
  {
    id: 'trail_slippers',
    name: 'Trail Slippers',
    slot: 'shoes',
    price: 30,
    rarity: 'Common',
    sprite: 'assets/item/trail_slippers.gif',
    desc: '+0.05 move speed. Light slippers for short hikes.',
    bonuses: { moveSpeed: 0.05 }
  },
  {
    id: 'field_boots',
    name: 'Field Boots',
    slot: 'shoes',
    price: 30,
    rarity: 'Common',
    sprite: 'assets/item/field_boots.gif',
    desc: '+1 AGI. Sturdy boots for farm and field.',
    bonuses: { agi: 1 }
  },
  {
    id: 'soft_moccasins',
    name: 'Soft Moccasins',
    slot: 'shoes',
    price: 30,
    rarity: 'Common',
    sprite: 'assets/item/soft_moccasins.gif',
    desc: ' Max HP. Cushioned soles ease every step.',
    bonuses: { maxHp: 6 }
  },
  {
    id: 'courier_boots',
    name: 'Courier Boots',
    slot: 'shoes',
    price: 95,
    rarity: 'Uncommon',
    sprite: 'assets/item/courier_boots.gif',
    desc: '+0.1 move speed, +1 AGI. Built for urgent deliveries.',
    bonuses: { moveSpeed: 0.1, agi: 1 }
  },
  {
    id: 'cushioned_greaves',
    name: 'Cushioned Greaves',
    slot: 'shoes',
    price: 100,
    rarity: 'Uncommon',
    sprite: 'assets/item/cushioned_greaves.gif',
    desc: ' Max HP, +0.5 DEF. Padded greaves to soften the march.',
    bonuses: { maxHp: 10, defense: 0.5 }
  },
  {
    id: 'windstep_boots',
    name: 'Windstep Boots',
    slot: 'shoes',
    price: 240,
    rarity: 'Rare',
    sprite: 'assets/item/windstep_boots.gif',
    desc: '+0.12 move speed, +1 AGI. Boots that catch every breeze.',
    bonuses: { moveSpeed: 0.12, agi: 1 }
  },
  {
    id: 'stone_treads',
    name: 'Stone Treads',
    slot: 'shoes',
    price: 235,
    rarity: 'Rare',
    sprite: 'assets/item/stone_treads.gif',
    desc: '+1.5 DEF,  Max HP. Heavy treads that root you in place.',
    bonuses: { defense: 1.5, maxHp: 15 }
  },
  {
    id: 'stormstride_sandals',
    name: 'Stormstride Sandals',
    slot: 'shoes',
    price: 520,
    rarity: 'Legendary',
    sprite: 'assets/item/stormstride_sandals.gif',
    desc: '+0.18 move speed, +1 INT, +1 AGI. Sandals that dance on thunder.',
    bonuses: { moveSpeed: 0.18, int: 1, agi: 1 }
  },
  {
    id: 'windrunner_treads',
    name: 'Windrunner Treads',
    slot: 'shoes',
    price: 510,
    rarity: 'Legendary',
    sprite: 'assets/item/windrunner_treads.gif',
    desc: '+0.2 move speed, +2 DEX. Treads made for relentless pursuit.',
    bonuses: { moveSpeed: 0.2, dex: 2 }
  },
  {
    id: 'ironclad_boots',
    name: 'Ironclad Boots',
    slot: 'shoes',
    price: 530,
    rarity: 'Legendary',
    sprite: 'assets/item/ironclad_boots.gif',
    desc: '+2 DEF,  Max HP, +1 STR. Boots that brace every impact.',
    bonuses: { defense: 2, maxHp: 25, str: 1 }
  },

  // =======================
  // Accessory Left
  // =======================
  {
    id: 'plain_ring',
    name: 'Plain Ring',
    slot: 'accL',
    price: 50,
    rarity: 'Common',
    sprite: 'assets/item/plain_ring.gif',
    desc: '+1 DEX. A simple band said to bring modest luck.',
    bonuses: { dex: 1 }
  },
  {
    id: 'focus_charm',
    name: 'Focus Charm',
    slot: 'accL',
    price: 90,
    rarity: 'Rare',
    sprite: 'assets/item/focus_charm.gif',
    desc: '+1 DEX, +1 AGI, +1 INT. A charm that sharpens all-round focus.',
    bonuses: {
      dex: 1,
      agi: 1,
      int: 1
    }
  },
  {
    id: 'training_bracelet',
    name: 'Training Bracelet',
    slot: 'accL',
    price: 80,
    rarity: 'Rare',
    sprite: 'assets/item/training_bracelet.gif',
    desc: '+1 DEX, +1 STR, +1 Bash level. A bracelet used in melee drills.',
    bonuses: {
      skill: {
        Bash: 1
      },
      dex: 1,
      str: 1
    }
  },
  {
    id: 'hydra_band',
    name: 'Hydra Band',
    slot: 'accL',
    rarity: 'Legendary',
    price: 600,
    shopAvailable: false,
    sprite: 'assets/item/hydra_band.gif',
    desc: '+3 DEX, +2 Arrow Shower level. A band bearing the mark of many-headed strikes.',
    bonuses: {
      dex: 3,
      skill: {
        ArrowShower: 2
      }
    }
  },
  {
    id: 'copper_bead',
    name: 'Copper Bead',
    slot: 'accL',
    price: 50,
    rarity: 'Common',
    sprite: 'assets/item/copper_bead.gif',
    desc: '+1 LUK. A small bead said to bring humble fortune.',
    bonuses: { luck: 1 }
  },
  {
    id: 'knotted_band',
    name: 'Knotted Band',
    slot: 'accL',
    price: 50,
    rarity: 'Common',
    sprite: 'assets/item/knotted_band.gif',
    desc: '+1 AGI. Twined cord that encourages light movement.',
    bonuses: { agi: 1 }
  },
  {
    id: 'glass_charm',
    name: 'Glass Charm',
    slot: 'accL',
    price: 50,
    rarity: 'Common',
    sprite: 'assets/item/glass_charm.gif',
    desc: '+1 INT. A polished charm that aids focus.',
    bonuses: { int: 1 }
  },
  {
    id: 'focus_loop',
    name: 'Focus Loop',
    slot: 'accL',
    price: 105,
    rarity: 'Uncommon',
    sprite: 'assets/item/focus_loop.gif',
    desc: '+1 INT, +1 Ice level. A loop that chills and sharpens thought.',
    bonuses: { int: 1, skill: { Ice: 1 } }
  },
  {
    id: 'steady_bracelet',
    name: 'Steady Bracelet',
    slot: 'accL',
    price: 110,
    rarity: 'Uncommon',
    sprite: 'assets/item/steady_bracelet.gif',
    desc: '+1 DEX, -1 skill cooldown. Keeps your rhythm steady.',
    bonuses: { dex: 1, cooldownFlat: 1 }
  },
  {
    id: 'rune_loop',
    name: 'Rune Loop',
    slot: 'accL',
    price: 230,
    rarity: 'Rare',
    sprite: 'assets/item/rune_loop.gif',
    desc: '+1 INT, -1 skill cooldown. Ring etched with time-worn runes.',
    bonuses: { int: 1, cooldownFlat: 1 }
  },
  {
    id: 'raptor_band',
    name: 'Raptor Band',
    slot: 'accL',
    price: 240,
    rarity: 'Rare',
    sprite: 'assets/item/raptor_band.gif',
    desc: '+2 DEX, +1 Arrow Shower level. Band for swift volleys.',
    bonuses: { dex: 2, skill: { ArrowShower: 1 } }
  },
  {
    id: 'sigil_loop',
    name: 'Sigil Loop',
    slot: 'accL',
    price: 520,
    rarity: 'Legendary',
    sprite: 'assets/item/sigil_loop.gif',
    desc: '+2 INT, -1 skill cooldown. Loop humming with timed runes.',
    bonuses: { int: 2, cooldownFlat: 1 }
  },
  {
    id: 'eagle_band',
    name: 'Eagle Band',
    slot: 'accL',
    price: 540,
    rarity: 'Legendary',
    sprite: 'assets/item/eagle_band.gif',
    desc: '+2 DEX, +4% crit chance, +1 Arrow Shower level. Band for lethal volleys.',
    bonuses: { dex: 2, critChance: 0.04, skill: { ArrowShower: 1 } }
  },
  {
    id: 'crusher_bangle',
    name: 'Crusher Bangle',
    slot: 'accL',
    price: 550,
    rarity: 'Legendary',
    sprite: 'assets/item/crusher_bangle.gif',
    desc: '+2 STR, +15% crit damage, +1 Bash level. Heavy bangle for crushing blows.',
    bonuses: { str: 2, critDamage: 0.15, skill: { Bash: 1 } }
  },

  // =======================
  // Accessory Right
  // =======================
  {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    slot: 'accR',
    price: 50,
    rarity: 'Common',
    sprite: 'assets/item/lucky_charm.gif',
    desc: '+5% crit chance. A small trinket said to tilt fate.',
    bonuses: { critChance: 0.05 }
  },
  {
    id: 'keen_earring',
    name: 'Keen Earring',
    slot: 'accR',
    price: 50,
    rarity: 'Common',
    sprite: 'assets/item/keen_earring.gif',
    desc: '+10% crit damage. Heightens your sense for fatal openings.',
    bonuses: { critDamage: 0.10 }
  },
  {
    id: 'brass_pendant',
    name: 'Brass Pendant',
    slot: 'accR',
    price: 50,
    rarity: 'Common',
    sprite: 'assets/item/brass_pendant.gif',
    desc: '+1 LUK. A simple pendant for a touch of fortune.',
    bonuses: { luck: 1 }
  },
  {
    id: 'iron_loop',
    name: 'Iron Loop',
    slot: 'accR',
    price: 50,
    rarity: 'Common',
    sprite: 'assets/item/iron_loop.gif',
    desc: '+1 STR. A solid loop of iron for grip strength.',
    bonuses: { str: 1 }
  },
  {
    id: 'silver_fleck',
    name: 'Silver Fleck',
    slot: 'accR',
    price: 50,
    rarity: 'Common',
    sprite: 'assets/item/silver_fleck.gif',
    desc: '+1% crit chance. A fleck of silver said to catch lucky light.',
    bonuses: { critChance: 0.01 }
  },
  {
    id: 'lucky_token',
    name: 'Lucky Token',
    slot: 'accR',
    price: 95,
    rarity: 'Uncommon',
    sprite: 'assets/item/lucky_token.gif',
    desc: '+2% crit chance. Token said to tilt fortune your way.',
    bonuses: { critChance: 0.02 }
  },
  {
    id: 'iron_sigil',
    name: 'Iron Sigil',
    slot: 'accR',
    price: 100,
    rarity: 'Uncommon',
    sprite: 'assets/item/iron_sigil.gif',
    desc: '+1 STR, +1% crit damage. Mark of a hardened warrior.',
    bonuses: { str: 1, critDamage: 0.01 }
  },
  {
    id: 'gilded_sigil',
    name: 'Gilded Sigil',
    slot: 'accR',
    price: 240,
    rarity: 'Rare',
    sprite: 'assets/item/gilded_sigil.gif',
    desc: '+1 STR, +8% crit damage. Embossed with a warrior’s crest.',
    bonuses: { str: 1, critDamage: 0.08 }
  },
  {
    id: 'opal_token',
    name: 'Opal Token',
    slot: 'accR',
    price: 235,
    rarity: 'Rare',
    sprite: 'assets/item/opal_token.gif',
    desc: '+2 LUK, +3% crit chance. Opal that shimmers with fortune.',
    bonuses: { luck: 2, critChance: 0.03 }
  },
  {
    id: 'opal_flame',
    name: 'Opal Flame',
    slot: 'accR',
    price: 520,
    rarity: 'Legendary',
    sprite: 'assets/item/opal_flame.gif',
    desc: '+2 INT, +4% crit chance. Opal burning with inner fire.',
    bonuses: { int: 2, critChance: 0.04 }
  },
  {
    id: 'golden_quill',
    name: 'Golden Quill',
    slot: 'accR',
    price: 530,
    rarity: 'Legendary',
    sprite: 'assets/item/golden_quill.gif',
    desc: '+2 DEX, +12% crit damage. Quill said to pen fated strikes.',
    bonuses: { dex: 2, critDamage: 0.12 }
  },
  {
    id: 'bloodied_crest',
    name: 'Bloodied Crest',
    slot: 'accR',
    price: 550,
    rarity: 'Legendary',
    sprite: 'assets/item/bloodied_crest.gif',
    desc: '+2 STR, +1 VIT, +15% crit damage. Crest worn by relentless warriors.',
    bonuses: { str: 2, vit: 1, critDamage: 0.15 }
  },
  {
    id: 'steady_band',
    name: 'Steady Band',
    slot: 'accR',
    price: 90,
    rarity: 'Uncommon',
    sprite: 'assets/item/steady_band.gif',
    desc: '-1 skill cooldown. Keeps your rhythm steady in battle.',
    bonuses: { cooldownFlat: 1 }
  },
  {
    id: 'phoenix_charm',
    name: 'Phoenix Charm',
    slot: 'accR',
    rarity: 'Unique',
    price: 650,
    shopAvailable: false,
    sprite: 'assets/item/phoenix_charm.gif',
    desc: ' Max HP,  Max HP Regen level, +15% crit damage. Revives you once after a short countdown.',
    bonuses: {
      maxHp: 60,
      critDamage: 0.15,
      skill: { HPRegen: 1 },
      uniqueAbility: { onDeath: phoenixReviveAbility }
    }
  }
];

// Convenience map: id -> item definition
export const ITEMS = ITEMS_DB.reduce((map, item) => {
  map[item.id] = item;
  return map;
}, {});
