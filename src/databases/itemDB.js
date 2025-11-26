export const ITEMS_DB = [
  // Headgear
  { id:'cloth_bandana', name:'Cloth Bandana', slot:'head', price:40, rarity:'Common', sprite:'assets/item/cloth_bandana.gif', bonuses:{ maxHp:10 } },
  { id:'feather_headband', name:'Feather Headband', slot:'head', price:60, rarity:'Uncommon', sprite:'assets/item/feather_headband.gif', bonuses:{ critChance:0.02 } },
  { id:'training_circlet', name:'Training Circlet', slot:'head', price:80, rarity:'Uncommon', sprite:'assets/item/training_circlet.gif', bonuses:{ maxHp:8, critChance:0.01 } },
  { id:'ember_crown', name:'Ember Crown', slot:'head', rarity:'Rare', price:400, shopAvailable:false, sprite:'assets/item/ember_crown.gif', desc:'+3% crit chance, +2 Fireball level, +1 Meteor level.', bonuses:{ critChance:0.03, skill:{ Fireball:2, Meteor:1 } } },

  // Armor
  { id:'cloth_robe', name:'Cloth Robe', slot:'armor', price:60, rarity:'Common', sprite:'assets/item/cloth_robe.gif', bonuses:{ maxHp:20 } },
  { id:'leather_armor', name:'Leather Armor', slot:'armor', price:90, rarity:'Uncommon', sprite:'assets/item/leather_armor.gif', bonuses:{ maxHp:30 } },
  { id:'padded_vest', name:'Padded Vest', slot:'armor', price:110, rarity:'Uncommon', sprite:'assets/item/padded_vest.gif', bonuses:{ maxHp:25, skill:{ Bash:2 } } },
  { id:'tidal_robe', name:'Tidal Robe', slot:'armor', rarity:'Rare', price:420, shopAvailable:false, sprite:'assets/item/tidal_robe.gif', desc:'+35 HP, +2 VIT, +2 Ice level.', bonuses:{ maxHp:35, skill:{ Ice:2 }, vit:2 } },

  // Weapon
  { id:'practice_sword', name:'Practice Sword', slot:'weapon', price:80, rarity:'Common', sprite:'assets/item/practice_sword.gif', bonuses:{ skill:{ Bash:2, Magnum:1 } } },
  { id:'wooden_staff', name:'Wooden Staff', slot:'weapon', price:80, rarity:'Common', sprite:'assets/item/wooden_staff.gif', bonuses:{ skill:{ Fireball:2, Ice:1 } } },
  { id:'training_bow', name:'Training Bow', slot:'weapon', price:80, rarity:'Common', sprite:'assets/item/training_bow.gif', bonuses:{ skill:{ Arrow:3 } } },

  // Shield
  { id:'wooden_shield', name:'Wooden Shield', slot:'shield', price:70, rarity:'Common', sprite:'assets/item/wooden_shield.gif', bonuses:{ maxHp:10 } },
  { id:'buckler', name:'Buckler', slot:'shield', price:90, rarity:'Uncommon', sprite:'assets/item/buckler.gif', bonuses:{ maxHp:12 } },
  { id:'round_guard', name:'Round Guard', slot:'shield', price:110, rarity:'Uncommon', sprite:'assets/item/round_guard.gif', bonuses:{ maxHp:15, critDamage:0.1 } },

  // Garment
  { id:'cotton_cloak', name:'Cotton Cloak', slot:'garment', price:50, rarity:'Common', sprite:'assets/item/cotton_cloak.gif', bonuses:{ moveSpeed:0.1 } },
  { id:'traveler_mantle', name:'Traveler\'s Mantle', slot:'garment', price:80, rarity:'Uncommon', sprite:'assets/item/traveler_mantle.gif', bonuses:{ moveSpeed:0.15 } },
  { id:'scarf_shawl', name:'Scarf Shawl', slot:'garment', price:90, rarity:'Uncommon', sprite:'assets/item/scarf_shawl.gif', bonuses:{ moveSpeed:0.1, critChance:0.01 } },
  { id:'earthbreaker_sash', name:'Earthbreaker Sash', slot:'garment', rarity:'Legendary', price:540, shopAvailable:false, sprite:'assets/item/earthbreaker_sash.gif', desc:'+3 STR, +2 VIT, +2 Magnum level.', bonuses:{ str:3, vit:2, skill:{ Magnum:2 } } },

  // Shoes
  { id:'sandals', name:'Light Sandals', slot:'shoes', price:50, rarity:'Common', sprite:'assets/item/sandals.gif', bonuses:{ moveSpeed:0.1 } },
  { id:'leather_boots', name:'Leather Boots', slot:'shoes', price:80, rarity:'Uncommon', sprite:'assets/item/leather_boots.gif', bonuses:{ moveSpeed:0.15 } },
  { id:'runner_shoes', name:'Runner Shoes', slot:'shoes', price:110, rarity:'Uncommon', sprite:'assets/item/runner_shoes.gif', bonuses:{ moveSpeed:0.18, cooldownFlat:1 } },
  { id:'stormrunner_boots', name:'Stormrunner Boots', slot:'shoes', rarity:'Legendary', price:520, shopAvailable:false, sprite:'assets/item/stormrunner_boots.gif', desc:'+28% move speed, +2 DEX, +2 AGI.', bonuses:{ moveSpeed:0.28, dex:2, agi:2 } },

  // Accessory Left
  { id:'plain_ring', name:'Plain Ring', slot:'accL', price:60, rarity:'Common', sprite:'assets/item/plain_ring.gif', bonuses:{ critChance:0.01 } },
  { id:'focus_charm', name:'Focus Charm', slot:'accL', price:90, rarity:'Uncommon', sprite:'assets/item/focus_charm.gif', bonuses:{ skill:{ Fireball:1, Ice:1 } } },
  { id:'training_bracelet', name:'Training Bracelet', slot:'accL', price:80, rarity:'Uncommon', sprite:'assets/item/training_bracelet.gif', bonuses:{ skill:{ Bash:1, Magnum:1 } } },
  { id:'hydra_band', name:'Hydra Band', slot:'accL', rarity:'Legendary', price:600, shopAvailable:false, sprite:'assets/item/hydra_band.gif', desc:'+2 DEX, +2 INT, +2 Arrow Shower level, +1 Quagmire level.', bonuses:{ dex:2, int:2, skill:{ ArrowShower:2, Quagmire:1 } } },

  // Accessory Right
  { id:'lucky_charm', name:'Lucky Charm', slot:'accR', price:80, rarity:'Common', sprite:'assets/item/lucky_charm.gif', bonuses:{ critChance:0.02 } },
  { id:'keen_earring', name:'Keen Earring', slot:'accR', price:80, rarity:'Common', sprite:'assets/item/keen_earring.gif', bonuses:{ critDamage:0.1 } },
  { id:'steady_band', name:'Steady Band', slot:'accR', price:90, rarity:'Uncommon', sprite:'assets/item/steady_band.gif', bonuses:{ cooldownFlat:1 } },
  { id:'phoenix_charm', name:'Phoenix Charm', slot:'accR', rarity:'Unique', price:650, shopAvailable:false, sprite:'assets/item/phoenix_charm.gif', desc:'+60 Max HP, +15 HP, +1 HP Regen level, +15% crit damage.', bonuses:{ maxHp:60, hp:15, skill:{ HPRegen:1 }, critDamage:0.15 } }
];
