export const TRANSCENDENCE_SKILLS = [
  {
    id: 'eternalStrength',
    name: 'Eternal Strength',
    icon: 'assets/skill/Quagmire.gif',
    desc: 'Permanent training that hardens muscle and spirit.',
    currentEffect: (lvl) => `+${lvl} STR`,
    nextEffect: (lvl) => `+${lvl + 1} STR`,
    maxLevel: 10,
    bonuses: (lvl) => ({ stats: { str: lvl } })
  },
  {
    id: 'arcaneWisdom',
    name: 'Arcane Wisdom',
    icon: 'assets/skill/Quagmire.gif',
    desc: 'Mind sharpened by countless incantations.',
    currentEffect: (lvl) => `+${lvl} INT`,
    nextEffect: (lvl) => `+${lvl + 1} INT`,
    maxLevel: 10,
    bonuses: (lvl) => ({ stats: { int: lvl } })
  },
  {
    id: 'unyieldingVitality',
    name: 'Unyielding Vitality',
    icon: 'assets/skill/Quagmire.gif',
    desc: 'Life force fortified beyond mortal limits.',
    currentEffect: (lvl) => `+${lvl} VIT`,
    nextEffect: (lvl) => `+${lvl + 1} VIT`,
    maxLevel: 10,
    bonuses: (lvl) => ({ stats: { vit: lvl } })
  },
  {
    id: 'fleetfoot',
    name: 'Fleetfoot',
    icon: 'assets/skill/Quagmire.gif',
    desc: 'Stride with transcendent speed.',
    currentEffect: (lvl) => `+${lvl} AGI`,
    nextEffect: (lvl) => `+${lvl + 1} AGI`,
    maxLevel: 10,
    bonuses: (lvl) => ({ stats: { agi: lvl } })
  },
  {
    id: 'finesse',
    name: 'Finesse',
    icon: 'assets/skill/Quagmire.gif',
    desc: 'Hands guided by steady focus.',
    currentEffect: (lvl) => `+${lvl} DEX`,
    nextEffect: (lvl) => `+${lvl + 1} DEX`,
    maxLevel: 10,
    bonuses: (lvl) => ({ stats: { dex: lvl } })
  },
  {
    id: 'charm',
    name: 'Charm',
    icon: 'assets/skill/Quagmire.gif',
    desc: 'Fortune favors the captivating.',
    currentEffect: (lvl) => `+${lvl} LUK`,
    nextEffect: (lvl) => `+${lvl + 1} LUK`,
    maxLevel: 10,
    bonuses: (lvl) => ({ stats: { luck: lvl } })
  },
  {
    id: 'magneticCore',
    name: 'Magnetic Core',
    icon: 'assets/skill/Quagmire.gif',
    desc: 'A transcendent pull that draws loot closer.',
    currentEffect: (lvl) => `+${(lvl * 18).toFixed(0)} pickup range`,
    nextEffect: (lvl) => `+${((lvl + 1) * 18).toFixed(0)} pickup range`,
    maxLevel: 10,
    bonuses: (lvl) => ({ pickupRadius: lvl * 18 })
  },
  {
    id: 'echoesOfFortune',
    name: 'Echoes of Fortune',
    icon: 'assets/skill/Quagmire.gif',
    desc: 'Echoes of fortune linger on every drop.',
    currentEffect: (lvl) => `+${(lvl * 2).toFixed(0)}% gold gained`,
    nextEffect: (lvl) => `+${((lvl + 1) * 2).toFixed(0)}% gold gained`,
    maxLevel: 10,
    bonuses: (lvl) => ({ goldGainPct: lvl * 0.02 })
  },
  {
    id: 'compulsaryDiscount',
    name: 'Compulsary Discount',
    icon: 'assets/skill/Quagmire.gif',
    desc: 'Vendors feel oddly generous toward you.',
    currentEffect: (lvl) => `+${(lvl * 2).toFixed(0)}% shop discount`,
    nextEffect: (lvl) => `+${((lvl + 1) * 2).toFixed(0)}% shop discount`,
    maxLevel: 10,
    bonuses: (lvl) => ({ shopDiscountPct: lvl * 0.02 })
  },
  {
    id: 'treasureMaster',
    name: 'Treasure Master',
    icon: 'assets/skill/Quagmire.gif',
    desc: 'You know every trick to pry better loot from chests.',
    currentEffect: (lvl) => `-${30 * lvl}g boss chest re-roll cost`,
    nextEffect: (lvl) => `-${30 * (lvl + 1)}g boss chest re-roll cost`,
    maxLevel: 10,
    bonuses: (lvl) => ({ chestRerollFlat: lvl * 30 })
  }
];
