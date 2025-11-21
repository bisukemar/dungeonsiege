export const ITEMS_DB = [
  // Headgear
  { id:'cloth_bandana', name:'Cloth Bandana', slot:'head', price:40, bonuses:{ maxHp:10 } },
  { id:'feather_headband', name:'Feather Headband', slot:'head', price:60, bonuses:{ critChance:0.02 } },
  { id:'training_circlet', name:'Training Circlet', slot:'head', price:80, bonuses:{ maxHp:8, critChance:0.01 } },

  // Armor
  { id:'cloth_robe', name:'Cloth Robe', slot:'armor', price:60, bonuses:{ maxHp:20 } },
  { id:'leather_armor', name:'Leather Armor', slot:'armor', price:90, bonuses:{ maxHp:30 } },
  { id:'padded_vest', name:'Padded Vest', slot:'armor', price:110, bonuses:{ maxHp:25, skill:{ Bash:2 } } },

  // Weapon
  { id:'practice_sword', name:'Practice Sword', slot:'weapon', price:80, bonuses:{ skill:{ Bash:2, Magnum:1 } } },
  { id:'wooden_staff', name:'Wooden Staff', slot:'weapon', price:80, bonuses:{ skill:{ Fireball:2, Ice:1 } } },
  { id:'training_bow', name:'Training Bow', slot:'weapon', price:80, bonuses:{ skill:{ Arrow:3 } } },

  // Shield
  { id:'wooden_shield', name:'Wooden Shield', slot:'shield', price:70, bonuses:{ maxHp:10 } },
  { id:'buckler', name:'Buckler', slot:'shield', price:90, bonuses:{ maxHp:12 } },
  { id:'round_guard', name:'Round Guard', slot:'shield', price:110, bonuses:{ maxHp:15, critDamage:0.1 } },

  // Garment
  { id:'cotton_cloak', name:'Cotton Cloak', slot:'garment', price:50, bonuses:{ moveSpeed:0.1 } },
  { id:'traveler_mantle', name:'Traveler\'s Mantle', slot:'garment', price:80, bonuses:{ moveSpeed:0.15 } },
  { id:'scarf_shawl', name:'Scarf Shawl', slot:'garment', price:90, bonuses:{ moveSpeed:0.1, critChance:0.01 } },

  // Shoes
  { id:'sandals', name:'Light Sandals', slot:'shoes', price:50, bonuses:{ moveSpeed:0.1 } },
  { id:'leather_boots', name:'Leather Boots', slot:'shoes', price:80, bonuses:{ moveSpeed:0.15 } },
  { id:'runner_shoes', name:'Runner Shoes', slot:'shoes', price:110, bonuses:{ moveSpeed:0.18, cooldownFlat:1 } },

  // Accessory Left
  { id:'plain_ring', name:'Plain Ring', slot:'accL', price:60, bonuses:{ critChance:0.01 } },
  { id:'focus_charm', name:'Focus Charm', slot:'accL', price:90, bonuses:{ skill:{ Fireball:1, Ice:1 } } },
  { id:'training_bracelet', name:'Training Bracelet', slot:'accL', price:80, bonuses:{ skill:{ Bash:1, Magnum:1 } } },

  // Accessory Right
  { id:'lucky_charm', name:'Lucky Charm', slot:'accR', price:80, bonuses:{ critChance:0.02 } },
  { id:'keen_earring', name:'Keen Earring', slot:'accR', price:80, bonuses:{ critDamage:0.1 } },
  { id:'steady_band', name:'Steady Band', slot:'accR', price:90, bonuses:{ cooldownFlat:1 } }
];
