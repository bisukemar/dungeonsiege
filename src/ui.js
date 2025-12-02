import { SKILL_DB } from './databases/skillDB.js';
import { PLAYER_BASE_HP, HP_PER_VIT } from './constants.js';
import { ITEMS_DB } from './databases/itemDB.js';

// Human-friendly names for equipment slots
const SLOT_LABEL = {
  head: 'Headgear',
  armor: 'Armor',
  weapon: 'Weapon',
  shield: 'Shield',
  garment: 'Garment',
  shoes: 'Shoes',
  accL: 'Accessory (L)',
  accR: 'Accessory (R)'
};
const itemSpriteCache = new Map();
const STANDARD_PRICE = {
  Common: 60,
  Uncommon: 130,
  Rare: 250,
  Legendary: 750,
  Unique: 1000
};

const STANDARD_PRICE_BY_SLOT_COMMON = {
  head: 15,
  armor: 30,
  weapon: 25,
  shield: 25,
  garment: 20,
  shoes: 30,
  accL: 50,
  accR: 50
};

function getStandardPrice(item){
  if (!item) return STANDARD_PRICE.Common;
  const r = item.rarity || 'Common';
  if (r === 'Common' && item.slot && STANDARD_PRICE_BY_SLOT_COMMON[item.slot] != null) {
    return STANDARD_PRICE_BY_SLOT_COMMON[item.slot];
  }
  if (STANDARD_PRICE.hasOwnProperty(r)) return STANDARD_PRICE[r];
  return item.price || STANDARD_PRICE.Common;
}
const RARITY_SHIMMER_STYLE_ID = 'rarity-shimmer-style';

function ensureRarityShimmerStyle(){
  if (!document || document.getElementById(RARITY_SHIMMER_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = RARITY_SHIMMER_STYLE_ID;
  style.textContent = `
    @keyframes rarityShimmer {
      0% { background-position: 50% 50%, 50% 50%; background-size: 200% 200%, 140% 140%; filter: brightness(1); }
      50% { background-position: 40% 60%, 60% 40%; background-size: 230% 230%, 180% 180%; filter: brightness(1.08); }
      100% { background-position: 50% 50%, 50% 50%; background-size: 200% 200%, 140% 140%; filter: brightness(1); }
    }
  `;
  document.head.appendChild(style);
}

function describeItemShort(item){
  if (!item || !item.bonuses) return '';
  const b = item.bonuses;
  const parts = [];

  if (b.maxHp) parts.push(`+${b.maxHp} HP`);
  if (b.hp) parts.push(`+${b.hp} HP`);
  if (b.mp) parts.push(`+${b.mp} MP`);
  if (b.def) parts.push(`+${b.def} DEF`);
  if (b.mdef) parts.push(`+${b.mdef} MDEF`);
  if (b.atk) parts.push(`+${b.atk} ATK`);
  if (b.matk) parts.push(`+${b.matk} MATK`);

  if (b.str) parts.push(`+${b.str} STR`);
  if (b.agi) parts.push(`+${b.agi} AGI`);
  if (b.vit) parts.push(`+${b.vit} VIT`);
  if (b.int) parts.push(`+${b.int} INT`);
  if (b.dex) parts.push(`+${b.dex} DEX`);
  if (b.luck) parts.push(`+${b.luck} LUK`);

  if (b.moveSpeed) parts.push(`+${Math.round(b.moveSpeed * 100)}% move speed`);
  if (b.critChance) parts.push(`+${Math.round(b.critChance * 100)}% crit chance`);
  if (b.critDamage) parts.push(`+${Math.round(b.critDamage * 100)}% crit damage`);
  if (b.cooldownFlat) parts.push(`-${b.cooldownFlat} skill cooldown`);

  if (b.skill){
    for (const [k, v] of Object.entries(b.skill)){
      const s = SKILL_DB[k];
      const name = s ? s.name : k;
      parts.push(`+${v} ${name} level`);
    }
  }

  return parts.join(', ');
}

function makeItemIcon(item){
  const box = document.createElement('div');
  box.style.width = '42px';
  box.style.height = '42px';
  box.style.borderRadius = '.45rem';
  const rarity = (item && item.rarity) || 'Common';
  const rarityBg = rarity === 'Uncommon'
    ? 'linear-gradient(180deg, #ecfdf3 0%, #d1fae5 100%)'
    : rarity === 'Rare'
    ? 'linear-gradient(180deg, #eef2ff 0%, #dfe3ff 100%)'
    : rarity === 'Legendary'
    ? 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 45%, #fbbf24 50%, #fcd34d 55%, #fef3c7 100%)'
    : rarity === 'Unique'
    ? 'linear-gradient(135deg, #fce7ef 0%, #fbcfdc 40%, #f8b9cb 50%, #fbcfdc 60%, #fce7ef 100%)'
    : 'linear-gradient(180deg, #fefefe 0%, #e5edfb 100%)';
  // overlay burst for legendary/unique
  if (rarity === 'Legendary' || rarity === 'Unique') {
    const burst = 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.35), rgba(255,255,255,0) 60%)';
    box.style.backgroundImage = `${rarityBg}, ${burst}`;
    box.style.backgroundBlendMode = 'screen';
  } else {
    box.style.background = rarityBg;
  }
  // Animate Legendary/Unique backgrounds
  if (rarity === 'Legendary' || rarity === 'Unique') {
    ensureRarityShimmerStyle();
    box.style.backgroundSize = '240% 240%, 200% 200%';
    box.style.animation = 'rarityShimmer 2.6s ease-in-out infinite';
  }
  box.style.border = '1px dashed #b8cff1';
  box.style.display = 'flex';
  box.style.alignItems = 'center';
  box.style.justifyContent = 'center';
  box.style.fontSize = '.7rem';
  box.style.color = '#6b7280';

  const src = item?.sprite;
  if (src) {
    let cached = itemSpriteCache.get(src);
    if (!cached) {
      cached = new Image();
      cached.src = src;
      itemSpriteCache.set(src, cached);
    }
    const img = cached.cloneNode();
    img.style.maxWidth = '36px';
    img.style.maxHeight = '36px';
    img.style.objectFit = 'contain';
    box.appendChild(img);
  } else {
    box.textContent = 'Icon';
  }
  return box;
}

function showGoldChange(buttonEl, amount){
  if (!buttonEl || !document || !document.body) return;
  const toast = document.createElement('div');
  const sign = amount >= 0 ? '+' : '-';
  toast.textContent = `${sign}${Math.abs(amount)}g`;
  const rect = buttonEl.getBoundingClientRect();
  toast.style.position = 'fixed';
  toast.style.left = `${rect.left + rect.width / 2}px`;
  toast.style.top = `${rect.top - 8}px`;
  toast.style.transform = 'translate(-50%, 0)';
  toast.style.fontSize = '.75rem';
  toast.style.fontWeight = '700';
  toast.style.color = amount >= 0 ? '#16a34a' : '#b91c1c';
  toast.style.opacity = '1';
  toast.style.transition = 'all 1.6s ease-out';
  toast.style.pointerEvents = 'none';
  toast.style.zIndex = '9999';
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -22px)';
  });
  setTimeout(() => toast.remove(), 1700);
}

// Map a skill to one of the UI categories
function getSkillCategoryTab(key, skill){
  const cat = (skill.category || '').toLowerCase();
  if (cat === 'passive') return 'Passive';
  if (cat === 'magic') return 'Magic';
  if (cat === 'range') return 'Range';

  // Anything else is "Physical" – divide manually into Melee / Range
  const k = key.toLowerCase();
  if (k === 'arrow' || k === 'arrowshower') return 'Range';
  // treat Bash / Magnum as melee
  if (k === 'bash' || k === 'magnum') return 'Melee';

  // default physical skills to Melee
  if (cat === 'physical') return 'Melee';

  // fallback
  return 'Magic';
}

export function makeOverlay(doc, player, onClose, opts = {}){
  const forceMobile = !!opts.forceMobile;
  const vw = doc.defaultView ? doc.defaultView.innerWidth : 1200;
  const isNarrow = vw < 960;
  const isMobile = forceMobile || vw < 900;

  // root overlay (re-use if already exists)
  const overlayId = isMobile ? 'char-overlay-mobile' : 'char-overlay';
  let overlayEl = doc.getElementById(overlayId);
  if (!overlayEl){
    overlayEl = doc.createElement('div');
    overlayEl.id = overlayId;
    doc.body.appendChild(overlayEl);
  }
  overlayEl.innerHTML = '';
  overlayEl.style.position = 'fixed';
  overlayEl.style.inset = '0';
  overlayEl.style.display = 'none';
  overlayEl.style.placeItems = 'center';
  overlayEl.style.background = 'rgba(14,39,86,0.28)';
  overlayEl.style.zIndex = '999';

  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) close();
  });

  // main window
  const win = doc.createElement('div');
  win.style.width = isNarrow ? '96vw' : '960px';
  win.style.maxWidth = '98vw';
  win.style.maxHeight = isNarrow ? '92vh' : '90vh';
  win.style.display = 'flex';
  win.style.flexDirection = 'column';
  win.style.background = 'linear-gradient(180deg, #fdfdff 0%, #dfeaf9 50%, #c8dcf6 100%)';
  win.style.borderRadius = '1rem';
  win.style.border = '2px solid #7da8d9';
  win.style.boxShadow = '0 28px 80px rgba(22, 41, 84, 0.35)';
  win.style.color = '#1b2d4b';
  win.style.fontFamily = "Trebuchet MS, 'Segoe UI', system-ui,-apple-system,BlinkMacSystemFont,'Inter',Roboto,'Segoe UI',sans-serif";
  win.style.fontSize = '.8rem';
  if (isMobile){
    win.style.width = '100vw';
    win.style.maxWidth = '100vw';
    win.style.height = '92vh';
    win.style.maxHeight = '92vh';
  }
  overlayEl.appendChild(win);
  win.addEventListener('click', (e) => e.stopPropagation());

  // ---------- header ----------
  const header = doc.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.padding = '.6rem .8rem';
  header.style.borderBottom = '1px solid #9ab9e8';
  header.style.background = 'linear-gradient(90deg, #eef5ff 0%, #d3e4fb 60%)';
  win.appendChild(header);

  const headerLeft = doc.createElement('div');
  headerLeft.style.display = 'flex';
  headerLeft.style.flexDirection = 'column';
  headerLeft.style.gap = '.15rem';
  header.appendChild(headerLeft);

  const title = doc.createElement('div');
  title.textContent = 'Character & Skills';
  title.style.fontWeight = '600';
  title.style.fontSize = '.9rem';
  headerLeft.appendChild(title);

  const subtitle = doc.createElement('div');
  subtitle.textContent = 'Allocate stats, manage skills, gear, and items.';
  subtitle.style.fontSize = '.72rem';
  subtitle.style.opacity = '0.8';
  headerLeft.appendChild(subtitle);

  const headerRight = doc.createElement('div');
  headerRight.style.display = 'flex';
  headerRight.style.alignItems = 'center';
  headerRight.style.gap = '.75rem';
  header.appendChild(headerRight);

  const pointsInfo = doc.createElement('div');
  pointsInfo.style.fontSize = '.75rem';
  pointsInfo.style.opacity = '0.9';
  headerRight.appendChild(pointsInfo);

  const closeBtn = doc.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.border = '1px solid #9ab9e8';
  closeBtn.style.background = 'linear-gradient(180deg, #ffffff 0%, #d7e8ff 100%)';
  closeBtn.style.color = '#1b2d4b';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '1rem';
  closeBtn.onclick = () => close();
  headerRight.appendChild(closeBtn);

  // ---------- body ----------
  const body = doc.createElement('div');
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.flex = '1 1 auto';
  body.style.minHeight = '0';
  body.style.padding = isMobile ? '0.6rem' : '0.75rem 0.85rem 0.85rem';
  body.style.gap = '.6rem';
  body.style.overflowY = isMobile ? 'auto' : 'visible';
  win.appendChild(body);

  // Mobile main tabs
  let currentMainTab = isMobile ? 'Attributes' : 'All';
  const mainTabs = isMobile ? ['Attributes','Skills','Item'] : ['Attributes','Skills','Shop','Item'];
  const mainTabButtons = {};
  let mainTabBar = null;
  if (isMobile){
    mainTabBar = doc.createElement('div');
    mainTabBar.style.display = 'grid';
    mainTabBar.style.gridTemplateColumns = 'repeat(4, 1fr)';
    mainTabBar.style.gap = '.35rem';
    mainTabBar.style.marginTop = '.1rem';
    mainTabBar.style.marginBottom = '.25rem';
    body.appendChild(mainTabBar);
    mainTabs.forEach((tab) => {
      const btn = doc.createElement('button');
      btn.textContent = tab;
      btn.style.borderRadius = '.65rem';
      btn.style.border = '1px solid #b8cff1';
      btn.style.padding = '.35rem .4rem';
      btn.style.fontSize = '.78rem';
      btn.style.cursor = 'pointer';
      btn.style.background = 'linear-gradient(180deg, #ffffff 0%, #d7e8ff 100%)';
      btn.style.color = '#16315c';
      btn.onclick = () => setMainTab(tab);
      mainTabBar.appendChild(btn);
      mainTabButtons[tab] = btn;
    });
  }

  // ---- character info card ----
  const charCard = doc.createElement('div');
  charCard.style.padding = '.55rem .7rem';
  charCard.style.borderRadius = '.75rem';
  charCard.style.border = '1px solid #9ab9e8';
  charCard.style.background = 'linear-gradient(180deg, #fefefe 0%, #e6f1ff 55%, #cfe0f8 100%)';
  charCard.style.display = 'grid';
  charCard.style.gridTemplateColumns = isMobile ? '1fr' : 'minmax(0,1.4fr) minmax(0,1.5fr) minmax(0,1.3fr)';
  charCard.style.gap = '.6rem';
  body.appendChild(charCard);

  // left side: portrait + HP
  const c1 = doc.createElement('div');
  c1.style.display = 'flex';
  c1.style.flexDirection = 'column';
  c1.style.gap = '.25rem';
  charCard.appendChild(c1);

  const nameRow = doc.createElement('div');
  nameRow.style.display = 'flex';
  nameRow.style.alignItems = 'center';
  nameRow.style.gap = '.45rem';
  c1.appendChild(nameRow);

  const portrait = doc.createElement('div');
  portrait.style.width = '38px';
  portrait.style.height = '38px';
  portrait.style.borderRadius = '999px';
  portrait.style.background = 'radial-gradient(circle at 30% 20%, #facc15, #b91c1c)';
  portrait.style.display = 'flex';
  portrait.style.alignItems = 'center';
  portrait.style.justifyContent = 'center';
  portrait.style.fontSize = '1.3rem';
  portrait.textContent = '⚔️';
  nameRow.appendChild(portrait);

  const nameInfo = doc.createElement('div');
  nameInfo.style.display = 'flex';
  nameInfo.style.flexDirection = 'column';
  nameInfo.style.gap = '.1rem';
  nameRow.appendChild(nameInfo);

  const nameEl = doc.createElement('div');
  nameEl.textContent = 'Hero of Midgard';
  nameEl.style.fontWeight = '600';
  nameEl.style.fontSize = '.9rem';
  nameInfo.appendChild(nameEl);

  const classEl = doc.createElement('div');
  classEl.textContent = 'Adventurer';
  classEl.style.fontSize = '.74rem';
  classEl.style.opacity = '0.8';
  nameInfo.appendChild(classEl);

  const hpMpCol = doc.createElement('div');
  hpMpCol.style.display = 'flex';
  hpMpCol.style.flexDirection = 'column';
  hpMpCol.style.gap = '.18rem';
  c1.appendChild(hpMpCol);

  function makeBarRow(labelText, colorStart, colorEnd){
    const row = doc.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '.4rem';

    const label = doc.createElement('span');
    label.textContent = labelText;
    label.style.fontSize = '.72rem';
    label.style.opacity = '0.8';
    row.appendChild(label);

    const barOuter = doc.createElement('div');
    barOuter.style.flex = '1';
    barOuter.style.height = '8px';
    barOuter.style.borderRadius = '999px';
    barOuter.style.background = '#e3efff';
    barOuter.style.overflow = 'hidden';
    row.appendChild(barOuter);

    const barInner = doc.createElement('div');
    barInner.style.height = '100%';
    barInner.style.width = '50%';
    barInner.style.borderRadius = '999px';
    barInner.style.background = `linear-gradient(to right, ${colorStart}, ${colorEnd})`;
    barOuter.appendChild(barInner);

    const val = doc.createElement('span');
    val.style.fontSize = '.7rem';
    val.style.minWidth = '80px';
    val.style.textAlign = 'right';
    row.appendChild(val);

    return { row, barInner, val };
  }

  const hpBar = makeBarRow('HP', '#ef4444', '#f97316');
  hpMpCol.appendChild(hpBar.row);

  // middle: level
  const c2 = doc.createElement('div');
  c2.style.display = 'flex';
  c2.style.flexDirection = 'column';
  c2.style.gap = '.25rem';
  charCard.appendChild(c2);

  const lvlRow = doc.createElement('div');
  lvlRow.style.display = 'flex';
  lvlRow.style.alignItems = 'baseline';
  lvlRow.style.gap = '.5rem';
  c2.appendChild(lvlRow);

  const lvlLabel = doc.createElement('span');
  lvlLabel.textContent = 'Level';
  lvlLabel.style.fontSize = '.76rem';
  lvlLabel.style.opacity = '0.8';
  lvlRow.appendChild(lvlLabel);

  const lvlValue = doc.createElement('span');
  lvlValue.style.fontSize = '1rem';
  lvlValue.style.fontWeight = '600';
  lvlRow.appendChild(lvlValue);

  // EXP removed

  // right: gold + points
  const c3 = doc.createElement('div');
  c3.style.display = 'flex';
  c3.style.flexDirection = 'column';
  c3.style.alignItems = 'flex-end';
  c3.style.gap = '.2rem';
  charCard.appendChild(c3);

  const goldLabel = doc.createElement('div');
  goldLabel.textContent = 'Gold';
  goldLabel.style.fontSize = '.72rem';
  goldLabel.style.opacity = '0.8';
  c3.appendChild(goldLabel);

  const goldValue = doc.createElement('div');
  goldValue.style.fontSize = '.8rem';
  goldValue.style.fontWeight = '600';
  c3.appendChild(goldValue);

  const statPointsLabel = doc.createElement('div');
  statPointsLabel.style.fontSize = '.72rem';
  statPointsLabel.style.opacity = '0.85';
  c3.appendChild(statPointsLabel);

  const skillPointsLabel = doc.createElement('div');
  skillPointsLabel.style.fontSize = '.72rem';
  skillPointsLabel.style.opacity = '0.85';
  c3.appendChild(skillPointsLabel);

  // extra stats panel
  const statsBox = doc.createElement('div');
  statsBox.style.gridColumn = '1 / -1';
  statsBox.style.display = 'grid';
  statsBox.style.gridTemplateColumns = isMobile
    ? 'repeat(2, minmax(0,1fr))'
    : 'repeat(auto-fit, minmax(160px, 1fr))';
  statsBox.style.gap = '.35rem .45rem';
  statsBox.style.padding = '.45rem .6rem';
  statsBox.style.borderRadius = '.75rem';
  statsBox.style.border = '1px solid #b8cff1';
  statsBox.style.background = '#ffffff';
  statsBox.style.fontSize = '.75rem';
  charCard.appendChild(statsBox);

  const statRows = {};
  const statDescriptors = [
    { key:'critChance', label:'Crit Chance' },
    { key:'critDamage', label:'Crit Damage' },
    { key:'moveSpeed', label:'Move Speed' },
    { key:'attackSpeed', label:'Attack Speed' },
    { key:'pickupRadius', label:'Pickup Radius' },
    { key:'defense', label:'Defense' },
    { key:'cdr', label:'Cooldown Reduction' },
    { key:'hpRegen', label:'HP Regen' },
    { key:'bonusHp', label:'Bonus HP (Items/Skills)' },
    { key:'skillRange', label:'Current Skill Range' }
  ];

  statDescriptors.forEach(({ key, label }) => {
    const row = doc.createElement('div');
    row.style.display = 'flex';
    row.style.flexDirection = 'column';
    row.style.gap = '.1rem';
    row.style.padding = '.4rem .45rem';
    row.style.borderRadius = '.65rem';
    row.style.border = '1px solid rgba(148,163,184,0.55)';
    row.style.background = 'linear-gradient(180deg, rgba(238,245,255,0.95) 0%, #f8fbff 60%, #e8f2ff 100%)';
    const lab = doc.createElement('div');
    lab.textContent = label;
    lab.style.opacity = '0.7';
    lab.style.fontSize = '.72rem';
    const val = doc.createElement('div');
    val.style.fontWeight = '700';
    val.style.fontSize = '.9rem';
    row.appendChild(lab);
    row.appendChild(val);
    statsBox.appendChild(row);
    statRows[key] = val;
  });

  // ---------- main layout ----------
  const mainRow = doc.createElement('div');
  mainRow.style.display = isMobile ? 'flex' : 'grid';
  mainRow.style.flexDirection = isMobile ? 'column' : 'row';
  mainRow.style.gridTemplateColumns = isMobile ? '1fr' : 'minmax(0,1.1fr) minmax(0,1.6fr) minmax(0,1.4fr)';
  mainRow.style.gap = isMobile ? '.45rem' : '.6rem';
  mainRow.style.flex = '1 1 auto';
  mainRow.style.minHeight = '0';
  body.appendChild(mainRow);

  // ==== LEFT: attributes + equipped ====
  const leftCol = doc.createElement('div');
  leftCol.style.display = 'flex';
  leftCol.style.flexDirection = 'column';
  leftCol.style.gap = isMobile ? '.45rem' : '.55rem';
  leftCol.dataset.section = 'Attributes';
  mainRow.appendChild(leftCol);

  // attributes card
  const attrCard = doc.createElement('div');
  attrCard.style.borderRadius = '.75rem';
  attrCard.style.border = '1px solid rgba(148,163,184,0.55)';
  attrCard.style.background = 'linear-gradient(180deg, #fdfdff 0%, #e4efff 55%, #cfe0f8 100%)';
  attrCard.style.padding = isMobile ? '.5rem .55rem' : '.55rem .65rem';
  attrCard.style.display = 'flex';
  attrCard.style.flexDirection = 'column';
  attrCard.style.gap = '.35rem';
  attrCard.style.position = 'relative';
  leftCol.appendChild(attrCard);

  const attrHeader = doc.createElement('div');
  attrHeader.style.display = 'flex';
  attrHeader.style.alignItems = 'center';
  attrHeader.style.justifyContent = 'space-between';
  attrCard.appendChild(attrHeader);

  const attrTitle = doc.createElement('div');
  attrTitle.textContent = 'Attributes';
  attrTitle.style.fontSize = '.78rem';
  attrTitle.style.fontWeight = '600';
  attrHeader.appendChild(attrTitle);

  const attrPointsLabel = doc.createElement('div');
  attrPointsLabel.style.fontSize = '.74rem';
  attrPointsLabel.style.opacity = '0.9';
  attrHeader.appendChild(attrPointsLabel);

  const attrList = doc.createElement('div');
  attrList.style.display = 'flex';
  attrList.style.flexDirection = 'column';
  attrList.style.gap = '.2rem';
  attrCard.appendChild(attrList);

  const attrDescriptions = {
    str: 'Boosts physical damage: Arrow gains +2 per STR, Bash gains +2.2 per STR, and Magnum Break gains +1.8 per STR.',
    agi: 'Increases move speed (+0.04 per AGI, capped) and speeds up attacks: -1 frame from basic attack cooldown (min 4) and -1 frame from each skill cooldown on cast (min 10).',
    vit: 'Raises max HP by 20 per VIT (also benefits from gear that adds VIT or max HP).',
    int: 'Boosts magic damage: Fireball gains +2 per INT, Ice Wave +1.6 per INT, and Meteor Storm +3 per INT.',
    dex: 'Extends attack reach and adds minor damage: Fireball/Arrow travel farther, Ice/Bash/Magnum grow larger (about +4% size per DEX), Arrow gains +0.5 per DEX, and Magnum Break gains +0.3 per DEX.',
    luck: 'Raises crit chance by +0.5% per LUK (base 5%, cap 80%) and expands coin pickup radius toward full-screen range at high LUK.'
  };

  const attrTooltip = doc.createElement('div');
  attrTooltip.style.position = 'absolute';
  attrTooltip.style.minWidth = '240px';
  attrTooltip.style.maxWidth = '320px';
  attrTooltip.style.display = 'none';
  attrTooltip.style.flexDirection = 'column';
  attrTooltip.style.gap = '.25rem';
  attrTooltip.style.padding = '.55rem .65rem';
  attrTooltip.style.borderRadius = '.6rem';
  attrTooltip.style.border = '1px solid #7da8d9';
  attrTooltip.style.background = '#0f1f3b';
  attrTooltip.style.color = '#f2f6ff';
  attrTooltip.style.boxShadow = '0 10px 35px rgba(12,28,74,0.35)';
  attrTooltip.style.zIndex = '4';
  attrTooltip.style.pointerEvents = 'auto';
  attrTooltip.style.transition = 'opacity 120ms ease';
  attrTooltip.style.opacity = '0';
  attrTooltip.addEventListener('click', (e) => e.stopPropagation());
  if (!isMobile){
    attrTooltip.addEventListener('mouseleave', hideAttrTooltip);
  }
  attrCard.appendChild(attrTooltip);

  const attrTooltipHeader = doc.createElement('div');
  attrTooltipHeader.style.display = 'flex';
  attrTooltipHeader.style.alignItems = 'center';
  attrTooltipHeader.style.justifyContent = 'space-between';
  attrTooltip.appendChild(attrTooltipHeader);

  const attrTooltipTitle = doc.createElement('div');
  attrTooltipTitle.style.fontWeight = '700';
  attrTooltipTitle.style.fontSize = '.85rem';
  attrTooltipHeader.appendChild(attrTooltipTitle);

  const attrTooltipClose = doc.createElement('button');
  attrTooltipClose.textContent = '✕';
  attrTooltipClose.style.display = isMobile ? 'inline-flex' : 'none';
  attrTooltipClose.style.alignItems = 'center';
  attrTooltipClose.style.justifyContent = 'center';
  attrTooltipClose.style.width = '26px';
  attrTooltipClose.style.height = '26px';
  attrTooltipClose.style.borderRadius = '999px';
  attrTooltipClose.style.border = '1px solid rgba(255,255,255,0.35)';
  attrTooltipClose.style.background = 'rgba(255,255,255,0.08)';
  attrTooltipClose.style.color = '#f2f6ff';
  attrTooltipClose.style.cursor = 'pointer';
  attrTooltipClose.style.fontSize = '.8rem';
  attrTooltipClose.onclick = hideAttrTooltip;
  attrTooltipHeader.appendChild(attrTooltipClose);

  const attrTooltipText = doc.createElement('div');
  attrTooltipText.style.fontSize = '.78rem';
  attrTooltipText.style.lineHeight = '1.35';
  attrTooltipText.style.opacity = '0.95';
  attrTooltip.appendChild(attrTooltipText);

  const attrControls = {};

  function hideAttrTooltip(){
    attrTooltip.style.display = 'none';
    attrTooltip.style.opacity = '0';
    attrTooltip.dataset.key = '';
  }

  function showAttrTooltip(key, anchorEl, labelText){
    const desc = attrDescriptions[key];
    if (!desc) return;
    attrTooltipTitle.textContent = labelText || key.toUpperCase();
    attrTooltipText.textContent = desc;
    attrTooltip.dataset.key = key;
    attrTooltip.style.display = 'flex';
    attrTooltip.style.opacity = '1';

    const cardRect = attrCard.getBoundingClientRect();
    const labelRect = anchorEl.getBoundingClientRect();
    const desiredLeft = labelRect.left - cardRect.left;
    const desiredTop = labelRect.top - cardRect.top - attrTooltip.offsetHeight - 8;
    const maxLeft = Math.max(6, attrCard.clientWidth - attrTooltip.offsetWidth - 6);
    const finalLeft = Math.min(Math.max(6, desiredLeft), maxLeft);
    const finalTop = Math.max(6, desiredTop);

    attrTooltip.style.left = `${finalLeft}px`;
    attrTooltip.style.top = `${finalTop}px`;
  }

  function makeAttrRow(labelText, key){
    const row = doc.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';
    row.style.gap = '.5rem';
    attrList.appendChild(row);

    const label = doc.createElement('span');
    label.textContent = labelText;
    label.style.fontSize = '.76rem';
    label.style.opacity = '0.86';
    label.style.cursor = 'help';
    if (isMobile){
      label.addEventListener('click', (e) => {
        e.stopPropagation();
        showAttrTooltip(key, label, labelText);
      });
    } else {
      label.addEventListener('mouseenter', () => showAttrTooltip(key, label, labelText));
    }
    row.appendChild(label);

    const right = doc.createElement('div');
    right.style.display = 'flex';
    right.style.alignItems = 'center';
    right.style.gap = '.35rem';
    row.appendChild(right);

    const val = doc.createElement('span');
    val.style.fontSize = '.8rem';
    val.style.fontWeight = '600';
    right.appendChild(val);

    const btn = doc.createElement('button');
    btn.textContent = '+';
    btn.style.width = isMobile ? '28px' : '20px';
    btn.style.height = isMobile ? '28px' : '20px';
    btn.style.borderRadius = '999px';
    btn.style.border = '1px solid rgba(209,213,219,0.9)';
    btn.style.background = 'linear-gradient(180deg, #fefefe 0%, #dbe9fb 100%)';
    btn.style.color = '#1b2d4b';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = isMobile ? '.95rem' : '.8rem';
    btn.onclick = () => {
      if (player.statPoints > 0 && player.stats[key] < 99){
        player.stats[key]++;
        player.statPoints--;
        updateAll();
      }
    };
    right.appendChild(btn);

    attrControls[key] = { val, btn };
  }

  makeAttrRow('Strength (STR)', 'str');
  makeAttrRow('Agility (AGI)', 'agi');
  makeAttrRow('Vitality (VIT)', 'vit');
  makeAttrRow('Intelligence (INT)', 'int');
  makeAttrRow('Dexterity (DEX)', 'dex');
  makeAttrRow('Luck (LUK)', 'luck');

  // equipped card
  const equipCard = doc.createElement('div');
  equipCard.style.borderRadius = '.75rem';
  equipCard.style.border = '1px solid #9ab9e8';
  equipCard.style.background = 'linear-gradient(180deg, #fffaf0 0%, #f2e1b5 35%, #e4d09a 100%)';
  equipCard.style.padding = '.55rem .65rem';
  equipCard.style.display = 'flex';
  equipCard.style.flexDirection = 'column';
  equipCard.style.gap = '.4rem';
  leftCol.appendChild(equipCard);

  const equipHeader = doc.createElement('div');
  equipHeader.style.display = 'flex';
  equipHeader.style.alignItems = 'center';
  equipHeader.style.justifyContent = 'space-between';
  equipCard.appendChild(equipHeader);

  const equipTitle = doc.createElement('div');
  equipTitle.textContent = 'Equipped Gear';
  equipTitle.style.fontSize = '.78rem';
  equipTitle.style.fontWeight = '600';
  equipHeader.appendChild(equipTitle);

  const equipHint = doc.createElement('div');
  equipHint.textContent = 'Click a slot to unequip.';
  equipHint.style.fontSize = '.7rem';
  equipHint.style.opacity = '0.8';
  equipHeader.appendChild(equipHint);

  const equipGrid = doc.createElement('div');
  equipGrid.style.display = 'grid';
  equipGrid.style.gridTemplateColumns = 'minmax(0,1fr)';
  equipGrid.style.gap = '.35rem';
  equipCard.appendChild(equipGrid);

  const equipUI = {};

  function makeEquipRow(slotKey){
    const row = doc.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';
    row.style.gap = '.35rem';
    row.style.padding = '.3rem .4rem';
    row.style.borderRadius = '.6rem';
    row.style.background = 'rgba(255,255,255,0.9)';
    row.style.border = '1px solid #b8cff1';
    equipGrid.appendChild(row);

    const label = doc.createElement('div');
    label.textContent = SLOT_LABEL[slotKey] || slotKey;
    label.style.fontSize = '.72rem';
    label.style.opacity = '0.85';
    row.appendChild(label);

    const name = doc.createElement('div');
    name.style.fontSize = '.75rem';
    name.style.fontWeight = '500';
    name.style.textAlign = 'left';
    name.style.whiteSpace = 'nowrap';
    name.style.overflow = 'hidden';
    name.style.textOverflow = 'ellipsis';
    name.style.maxWidth = '220px';
    row.appendChild(name);

    row.onclick = () => {
      const it = player.equip?.[slotKey];
      if (!it) return;
      if (!player.inventory) player.inventory = [];
      player.inventory.push(it);
      player.equip[slotKey] = null;
      updateAll();
    };

    equipUI[slotKey] = { row, name };
  }

  ['weapon','shield','armor','garment','shoes','head','accL','accR'].forEach(makeEquipRow);

  // ==== MIDDLE: skills ====
  const midCol = doc.createElement('div');
  midCol.style.display = 'flex';
  midCol.style.flexDirection = 'column';
  midCol.style.gap = isMobile ? '.45rem' : '.55rem';
  midCol.dataset.section = 'Skills';
  mainRow.appendChild(midCol);

  const skillsCard = doc.createElement('div');
  skillsCard.style.borderRadius = '.75rem';
  skillsCard.style.border = '1px solid #9ab9e8';
  skillsCard.style.background = 'linear-gradient(180deg, #fefefe 0%, #e6f0ff 55%, #cfdef7 100%)';
  skillsCard.style.padding = '.55rem .65rem';
  skillsCard.style.display = 'flex';
  skillsCard.style.flexDirection = 'column';
  skillsCard.style.gap = '.4rem';
  midCol.appendChild(skillsCard);

  const skillsHeader = doc.createElement('div');
  skillsHeader.style.display = 'flex';
  skillsHeader.style.alignItems = 'center';
  skillsHeader.style.justifyContent = 'space-between';
  skillsCard.appendChild(skillsHeader);

  const skillsTitle = doc.createElement('div');
  skillsTitle.textContent = 'Skills';
  skillsTitle.style.fontWeight = '600';
  skillsHeader.appendChild(skillsTitle);

  const skillsPtsEl = doc.createElement('div');
  skillsPtsEl.style.fontSize = '.78rem';
  skillsPtsEl.style.opacity = '0.9';
  skillsHeader.appendChild(skillsPtsEl);

  // Category tabs: All / Magic / Melee / Range / Passive
  const skillFilterBar = doc.createElement('div');
  skillFilterBar.style.display = 'inline-flex';
  skillFilterBar.style.gap = '.25rem';
  skillFilterBar.style.fontSize = '.75rem';
  skillsCard.appendChild(skillFilterBar);

  const SKILL_TABS = ['All','Magic','Melee','Range','Passive'];
  let skillTab = 'All';
  const skillTabButtons = {};
  let hideLocked = false;

  function setSkillTab(tab){
    skillTab = tab;
    Object.entries(skillTabButtons).forEach(([key, btn]) => {
      const active = key === skillTab;
      btn.style.background = active ? '#1f2937' : 'transparent';
      btn.style.color = active ? '#fefefe' : '#1b2d4b';
      btn.style.boxShadow = active ? '0 0 0 1px #9ab9e8 inset, 0 6px 10px rgba(21,44,90,0.25)' : 'none';
      btn.style.opacity = active ? '1' : '0.75';
    });
    renderSkills();
  }

  SKILL_TABS.forEach((tab) => {
    const btn = doc.createElement('button');
    btn.textContent = tab;
    btn.style.borderRadius = '999px';
    btn.style.border = 'none';
    btn.style.padding = '.2rem .6rem';
    btn.style.fontSize = '.75rem';
    btn.style.cursor = 'pointer';
    btn.style.background = 'transparent';
    btn.style.color = '#1b2d4b';
    btn.style.opacity = '0.75';
    btn.onclick = () => setSkillTab(tab);
    skillFilterBar.appendChild(btn);
    skillTabButtons[tab] = btn;
  });

  const skillList = doc.createElement('div');
  skillList.style.display = 'flex';
  skillList.style.flexDirection = 'column';
  skillList.style.gap = '.25rem';
  skillList.style.marginTop = '.25rem';
  skillList.style.fontSize = '.78rem';
  skillList.style.minHeight = '0';
  const listMaxHeight = isMobile ? '52vh' : '320px';
  skillList.style.maxHeight = listMaxHeight;
  skillList.style.overflowY = 'auto';
  skillsCard.appendChild(skillList);

  // Hide locked toggle
  const hideLockedRow = doc.createElement('label');
  hideLockedRow.style.display = 'flex';
  hideLockedRow.style.alignItems = 'center';
  hideLockedRow.style.gap = '.4rem';
  hideLockedRow.style.fontSize = '.76rem';
  hideLockedRow.style.marginTop = '.1rem';
  hideLockedRow.style.cursor = 'pointer';

  const hideLockedInput = doc.createElement('input');
  hideLockedInput.type = 'checkbox';
  hideLockedInput.checked = hideLocked;
  hideLockedInput.style.width = '1rem';
  hideLockedInput.style.height = '1rem';
  hideLockedInput.onchange = () => {
    hideLocked = !!hideLockedInput.checked;
    renderSkills();
  };

  const hideLockedLabel = doc.createElement('span');
  hideLockedLabel.textContent = 'Hide locked skills';

  hideLockedRow.appendChild(hideLockedInput);
  hideLockedRow.appendChild(hideLockedLabel);
  skillsCard.appendChild(hideLockedRow);

  // ==== RIGHT: shop / inventory ====
  const rightCol = doc.createElement('div');
  rightCol.style.display = 'flex';
  rightCol.style.flexDirection = 'column';
  rightCol.style.gap = isMobile ? '.45rem' : '.55rem';
  rightCol.dataset.section = 'Item';
  mainRow.appendChild(rightCol);

  function setMainTab(tab){
    currentMainTab = tab;
    if (!isMobile) return;
    if (mainTabBar){
      Object.entries(mainTabButtons).forEach(([key, btn]) => {
        const active = key === tab;
        btn.style.background = active ? '#1f2937' : 'linear-gradient(180deg, #ffffff 0%, #d7e8ff 100%)';
        btn.style.color = active ? '#fefefe' : '#16315c';
        btn.style.boxShadow = active ? '0 0 0 1px #9ab9e8 inset, 0 6px 10px rgba(21,44,90,0.25)' : 'none';
      });
    }
    const showAttr = tab === 'Attributes';
    const showSkills = tab === 'Skills';
    const showItem = tab === 'Item';
    leftCol.style.display = showAttr ? 'flex' : 'none';
    midCol.style.display = showSkills ? 'flex' : 'none';
    rightCol.style.display = showItem ? 'flex' : 'none';
    if (showItem && currentRightMode === 'Shop') setRightMode('Inventory');
  }

  const modeCard = doc.createElement('div');
  modeCard.style.borderRadius = '.75rem';
  modeCard.style.border = '1px solid #d1a85c';
  modeCard.style.background = 'linear-gradient(180deg, #fff7e6 0%, #f1deac 100%)';
  modeCard.style.padding = '.45rem .6rem';
  modeCard.style.display = 'flex';
  modeCard.style.alignItems = 'center';
  modeCard.style.justifyContent = 'space-between';
  rightCol.appendChild(modeCard);

  const modeLabel = doc.createElement('div');
  modeLabel.textContent = 'Item Tabs:';
  modeLabel.style.fontSize = '.75rem';
  modeLabel.style.opacity = '0.8';
  modeCard.appendChild(modeLabel);

  const modeTabs = doc.createElement('div');
  modeTabs.style.display = 'inline-flex';
  modeTabs.style.gap = '.35rem';
  modeCard.appendChild(modeTabs);

  const rightModes = isMobile ? ['Inventory','Equipped','Shop'] : ['Inventory','Shop'];
  const rightModeButtons = {};
  let currentRightMode = 'Inventory';

  function setRightMode(mode){
    currentRightMode = mode;
    Object.entries(rightModeButtons).forEach(([key, btn]) => {
      const active = key === currentRightMode;
      btn.style.background = active ? '#1f2937' : 'transparent';
      btn.style.color = active ? '#fefefe' : '#1b2d4b';
      btn.style.boxShadow = active ? '0 0 0 1px #9ab9e8 inset, 0 6px 10px rgba(21,44,90,0.25)' : 'none';
      btn.style.opacity = active ? '1' : '0.75';
    });
    renderRightPanel();
  }

  rightModes.forEach((mode) => {
    const btn = doc.createElement('button');
    btn.textContent = mode;
    btn.style.borderRadius = '999px';
    btn.style.border = 'none';
    btn.style.padding = '.2rem .6rem';
    btn.style.fontSize = '.75rem';
    btn.style.cursor = 'pointer';
    btn.style.background = 'transparent';
    btn.style.color = '#1b2d4b';
    btn.style.opacity = '0.75';
    btn.onclick = () => setRightMode(mode);
    modeTabs.appendChild(btn);
    rightModeButtons[mode] = btn;
  });

  const rightPanel = doc.createElement('div');
  rightPanel.style.borderRadius = '.75rem';
  rightPanel.style.border = '1px solid rgba(148,163,184,0.55)';
  rightPanel.style.background = 'linear-gradient(180deg, #fefefe 0%, #e6f0ff 60%, #cfdef7 100%)';
  rightPanel.style.padding = '.5rem .6rem';
  rightPanel.style.flex = '1 1 auto';
  rightPanel.style.minHeight = '0';
  rightPanel.style.display = 'flex';
  rightPanel.style.flexDirection = 'column';
  rightPanel.style.gap = '.4rem';
  rightCol.appendChild(rightPanel);

  // shop panel elements
  let shopMode = 'buy'; // 'buy' or 'sell'

  const shopModeRow = doc.createElement('div');
  shopModeRow.style.display = 'flex';
  shopModeRow.style.alignItems = 'center';
  shopModeRow.style.justifyContent = 'space-between';
  shopModeRow.style.gap = '.5rem';
  shopModeRow.style.marginBottom = '.3rem';

  const shopModeLabel = doc.createElement('div');
  shopModeLabel.textContent = 'Shop Mode:';
  shopModeLabel.style.fontSize = '.73rem';
  shopModeLabel.style.opacity = '0.8';
  shopModeRow.appendChild(shopModeLabel);

  const shopModeTabs = doc.createElement('div');
  shopModeTabs.style.display = 'inline-flex';
  shopModeTabs.style.gap = '.35rem';
  shopModeRow.appendChild(shopModeTabs);

  const shopModeButtons = {};

  function updateShopModeButtons(){
    Object.entries(shopModeButtons).forEach(([mode, btn]) => {
      const active = mode === shopMode;
      btn.style.background = active ? '#1f2937' : 'transparent';
      btn.style.color = active ? '#fefefe' : '#1b2d4b';
      btn.style.boxShadow = active ? '0 0 0 1px #9ab9e8 inset, 0 6px 10px rgba(21,44,90,0.25)' : 'none';
      btn.style.opacity = active ? '1' : '0.8';
    });
  }

  function setShopMode(mode){
    shopMode = mode;
    activeItemFilters = new Set(['All']);
    updateShopModeButtons();
    if (currentRightMode === 'Shop') renderRightPanel();
  }

  ['buy','sell'].forEach((mode) => {
    const btn = doc.createElement('button');
    btn.textContent = mode === 'buy' ? 'Buy' : 'Sell';
    btn.style.borderRadius = '999px';
    btn.style.border = '1px solid rgba(148,163,184,0.7)';
    btn.style.padding = '.15rem .55rem';
    btn.style.fontSize = '.72rem';
    btn.style.cursor = 'pointer';
    btn.style.background = 'transparent';
    btn.style.color = '#1b2d4b';
    btn.style.opacity = '0.8';
    btn.onclick = () => setShopMode(mode);
    shopModeTabs.appendChild(btn);
    shopModeButtons[mode] = btn;
  });

  const shopList = doc.createElement('div');
  shopList.style.display = 'flex';
  shopList.style.flexDirection = 'column';
  shopList.style.gap = '.25rem';
  shopList.style.minHeight = '0';
  shopList.style.flex = '1 1 auto';
  shopList.style.maxHeight = isMobile ? '48vh' : '400px';
  shopList.style.overflowY = 'auto';

  const invList = doc.createElement('div');
  invList.style.display = 'flex';
  invList.style.flexDirection = 'column';
  invList.style.gap = '.25rem';
  invList.style.minHeight = '0';
  invList.style.flex = '1 1 auto';
  invList.style.maxHeight = isMobile ? '48vh' : '400px';
  invList.style.overflowY = 'auto';
  const ITEM_FILTERS = ['All','Headgear','Armor','Weapon','Shield','Garment','Shoes','Accessory','Other'];
  let activeItemFilters = new Set(['All']);

  function createItemFilterBar(onChanged){
    const bar = doc.createElement('div');
    bar.style.position = 'relative';
    bar.style.display = 'inline-flex';
    bar.style.marginBottom = '.4rem';
    bar.style.fontSize = '.75rem';

    const filterBtn = doc.createElement('button');
    filterBtn.textContent = 'Filter Items';
    filterBtn.style.borderRadius = '999px';
    filterBtn.style.border = '1px solid rgba(148,163,184,0.7)';
    filterBtn.style.padding = '.25rem .7rem';
    filterBtn.style.fontSize = '.78rem';
    filterBtn.style.cursor = 'pointer';
    filterBtn.style.background = 'transparent';
    filterBtn.style.color = '#1b2d4b';
    bar.appendChild(filterBtn);

    const dropdown = doc.createElement('div');
    dropdown.style.position = 'absolute';
    dropdown.style.top = '110%';
    dropdown.style.left = '0';
    dropdown.style.minWidth = '180px';
    dropdown.style.background = '#fff';
    dropdown.style.border = '1px solid #b8cff1';
    dropdown.style.borderRadius = '.65rem';
    dropdown.style.boxShadow = '0 10px 26px rgba(21,44,90,0.18)';
    dropdown.style.padding = '.35rem .55rem';
    dropdown.style.display = 'none';
    dropdown.style.zIndex = '10';
    dropdown.style.color = '#1b2d4b';
    dropdown.style.fontSize = '.78rem';

  ITEM_FILTERS.forEach((cat, idx) => {
      const row = doc.createElement('label');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '.4rem';
      row.style.padding = '.15rem 0';
      const cb = doc.createElement('input');
      cb.type = 'checkbox';
      cb.checked = activeItemFilters.has(cat);
      cb.onchange = () => {
        // Only one category active at a time
        activeItemFilters = new Set([cat]);
        dropdown.querySelectorAll('input[type=checkbox]').forEach((el, i) => {
          el.checked = i === idx;
        });
        dropdown.style.display = 'block'; // keep open on toggle
        if (onChanged) onChanged();
      };
      const span = doc.createElement('span');
      span.textContent = cat;
      row.appendChild(cb);
      row.appendChild(span);
      dropdown.appendChild(row);
    });

    filterBtn.onclick = (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    };

    doc.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== filterBtn) {
        dropdown.style.display = 'none';
      }
    });

    bar.appendChild(dropdown);
    return bar;
  }

  function renderShopBuy(){
    shopList.innerHTML = '';

    // add mode row
    shopList.appendChild(shopModeRow);
    shopList.appendChild(createItemFilterBar(() => {
      if (shopMode === 'buy') renderShopBuy(); else renderShopSell();
      renderInventoryPanel();
    }));

    const listBox = doc.createElement('div');
    listBox.style.display = 'flex';
    listBox.style.flexDirection = 'column';
    listBox.style.gap = '.25rem';
    shopList.appendChild(listBox);

    // ITEMS_DB is an array
    ITEMS_DB.forEach((item) => {
      if (!item) return;
      const rarity = item.rarity || 'Common';
      if (!player.adminMode && item.shopAvailable === false) return;
      // Non-admin: show only Common items; Admin: show everything
      if (!player.adminMode && rarity !== 'Common') return;
      const slot = item.slot || '';
      const cat = slot === 'head' ? 'Headgear'
        : slot === 'armor' ? 'Armor'
        : slot === 'weapon' ? 'Weapon'
        : slot === 'shield' ? 'Shield'
        : slot === 'garment' ? 'Garment'
        : slot === 'shoes' ? 'Shoes'
        : slot === 'accL' || slot === 'accR' ? 'Accessory'
        : 'Other';
      const active = activeItemFilters.has('All') ? true : activeItemFilters.has(cat);
      if (!active) return;
      const row = doc.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '46px minmax(0,2.1fr) auto auto';
      row.style.columnGap = '.5rem';
      row.style.alignItems = 'flex-start';
      row.style.padding = '.45rem .5rem';
      row.style.borderRadius = '.65rem';
      row.style.background = 'rgba(255,255,255,0.95)';
      row.style.border = '1px solid #b8cff1';
      row.style.minHeight = '86px';
      row.style.height = 'auto';

      row.appendChild(makeItemIcon(item));

      const main = doc.createElement('div');
      main.style.display = 'flex';
      main.style.flexDirection = 'column';
      main.style.gap = '.1rem';
      row.appendChild(main);

      const top = doc.createElement('div');
      top.style.display = 'flex';
      top.style.alignItems = 'center';
      top.style.justifyContent = 'space-between';
      main.appendChild(top);

      const name = doc.createElement('span');
      name.textContent = item.name;
      name.style.fontSize = '.8rem';
      name.style.fontWeight = '600';
      name.style.color =
        rarity === 'Uncommon' ? '#0f766e' :
        rarity === 'Rare' ? '#2563eb' :
        rarity === 'Legendary' ? '#b45309' :
        rarity === 'Unique' ? '#9d174d' :
        '#1f2937';
      top.appendChild(name);

      const priceSpan = doc.createElement('span');
      priceSpan.style.fontSize = '.78rem';
      priceSpan.style.opacity = '0.9';
      const price = getStandardPrice(item);
      priceSpan.textContent = `${price}g`;
      top.appendChild(priceSpan);

      const typeSpan = doc.createElement('span');
      const slotLabel = item.slot ? (SLOT_LABEL[item.slot] || item.slot) : 'Item';
      const rarityLabel = rarity || 'Common';
      typeSpan.textContent = `${rarityLabel} ${slotLabel}`;
      typeSpan.style.fontSize = '.7rem';
      typeSpan.style.opacity = '0.78';
      main.appendChild(typeSpan);

      const descSpan = doc.createElement('div');
      descSpan.style.fontSize = '.7rem';
      descSpan.style.opacity = '0.8';
      descSpan.textContent = item.desc || describeItemShort(item);
      main.appendChild(descSpan);

      const btnBox = doc.createElement('div');
      btnBox.style.display = 'flex';
      btnBox.style.alignItems = 'center';
      btnBox.style.justifyContent = 'flex-end';
      row.appendChild(btnBox);

      const btn = doc.createElement('button');
      btn.textContent = 'Buy';
      btn.style.borderRadius = '999px';
      btn.style.border = '1px solid rgba(148,163,184,0.9)';
      btn.style.padding = '.18rem .55rem';
      btn.style.fontSize = '.73rem';
      btn.style.cursor = 'pointer';
      btn.style.background = 'linear-gradient(180deg, #fefefe 0%, #dbe9fb 100%)';
      btn.style.color = '#1b2d4b';
      btn.style.position = 'relative';

      btn.onclick = (ev) => {
        ev.stopPropagation();
        const cost = getStandardPrice(item);
        const currentGold = player.gold || 0;
        if (currentGold < cost) return;
        player.gold = currentGold - cost;
        if (!player.inventory) player.inventory = [];
        // push a shallow copy so we don't mutate DB entry
        player.inventory.push({ ...item });
        showGoldChange(btn, -cost);
        setTimeout(() => updateAll(), 10);
      };

      btnBox.appendChild(btn);

      listBox.appendChild(row);
    });
  }

  function renderShopSell(){
    shopList.innerHTML = '';
    shopList.appendChild(shopModeRow);
    shopList.appendChild(createItemFilterBar(() => {
      if (shopMode === 'buy') renderShopBuy(); else renderShopSell();
      renderInventoryPanel();
    }));

    const listBox = doc.createElement('div');
    listBox.style.display = 'flex';
    listBox.style.flexDirection = 'column';
    listBox.style.gap = '.25rem';
    shopList.appendChild(listBox);

    if (!player.inventory || player.inventory.length === 0){
      const empty = doc.createElement('div');
      empty.textContent = 'No items to sell.';
      empty.style.fontSize = '.75rem';
      empty.style.opacity = '0.8';
      listBox.appendChild(empty);
      return;
    }

    player.inventory.forEach((it, idx) => {
      const slot = it.slot || '';
      const cat = slot === 'head' ? 'Headgear'
        : slot === 'armor' ? 'Armor'
        : slot === 'weapon' ? 'Weapon'
        : slot === 'shield' ? 'Shield'
        : slot === 'garment' ? 'Garment'
        : slot === 'shoes' ? 'Shoes'
        : slot === 'accL' || slot === 'accR' ? 'Accessory'
        : 'Other';
      const active = activeItemFilters.has('All') ? true : activeItemFilters.has(cat);
      if (!active) return;
      const row = doc.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '46px minmax(0,2.1fr) auto auto';
      row.style.columnGap = '.5rem';
      row.style.alignItems = 'center';
      row.style.padding = '.45rem .5rem';
      row.style.borderRadius = '.65rem';
      row.style.background = 'rgba(255,255,255,0.95)';
      row.style.border = '1px solid #b8cff1';
      row.style.minHeight = '72px';

      row.appendChild(makeItemIcon(it));

      const main = doc.createElement('div');
      main.style.display = 'flex';
      main.style.flexDirection = 'column';
      main.style.gap = '.1rem';
      row.appendChild(main);

      const top = doc.createElement('div');
      top.style.display = 'flex';
      top.style.alignItems = 'center';
      top.style.justifyContent = 'space-between';
      main.appendChild(top);

      const rarity = it.rarity || 'Common';
      const name = doc.createElement('span');
      name.textContent = it.name || 'Item';
      name.style.fontSize = '.8rem';
      name.style.fontWeight = '600';
      name.style.color =
        rarity === 'Uncommon' ? '#0f766e' :
        rarity === 'Rare' ? '#2563eb' :
        rarity === 'Legendary' ? '#b45309' :
        rarity === 'Unique' ? '#9d174d' :
        '#1f2937';
      top.appendChild(name);

      const typeSpan = document.createElement('span');
      const slotLabel = it.slot ? (SLOT_LABEL[it.slot] || it.slot) : 'Item';
      const rarityLabel = rarity || 'Common';
      typeSpan.textContent = `${rarityLabel} ${slotLabel}`;
      typeSpan.style.fontSize = '.7rem';
      typeSpan.style.opacity = '0.78';
      main.appendChild(typeSpan);

      // Sell view: show sell price
      const base = getStandardPrice(it);
      const sellPrice = Math.floor(base * 0.5);
      const priceSpan = document.createElement('span');
      priceSpan.style.fontSize = '.78rem';
      priceSpan.style.opacity = '0.9';
      priceSpan.textContent = `${sellPrice}g`;
      top.appendChild(priceSpan);

      const descSpan = doc.createElement('div');
      descSpan.style.fontSize = '.7rem';
      descSpan.style.opacity = '0.8';
      descSpan.style.lineHeight = '1.35';
      descSpan.style.wordBreak = 'break-word';
      descSpan.textContent = it.desc || describeItemShort(it);
      main.appendChild(descSpan);

      const btnBox = doc.createElement('div');
      btnBox.style.display = 'flex';
      btnBox.style.alignItems = 'center';
      btnBox.style.justifyContent = 'flex-end';
      row.appendChild(btnBox);

      const btn = document.createElement('button');
      btn.textContent = 'Sell';
      btn.style.borderRadius = '999px';
      btn.style.border = '1px solid rgba(148,163,184,0.9)';
      btn.style.padding = '.18rem .55rem';
      btn.style.fontSize = '.73rem';
      btn.style.cursor = 'pointer';
      btn.style.background = 'linear-gradient(180deg, #fefefe 0%, #dbe9fb 100%)';
      btn.style.color = '#1b2d4b';
      btn.style.position = 'relative';

      btn.onclick = (ev) => {
        ev.stopPropagation();
        if (!player.inventory || !player.inventory[idx]) return;
        player.inventory.splice(idx, 1);
        player.gold = (player.gold || 0) + sellPrice;
        showGoldChange(btn, sellPrice);
        setTimeout(() => {
          renderShopSell();
          renderInventoryPanel();
          updateAll();
        }, 10);
      };

      btnBox.appendChild(btn);

      listBox.appendChild(row);
    });
  }

  function renderInventoryPanel(){
    invList.innerHTML = '';

    invList.appendChild(createItemFilterBar(() => {
      renderInventoryPanel();
      if (shopMode === 'buy') renderShopBuy(); else renderShopSell();
    }));

    if (!player.inventory || player.inventory.length === 0){
      const empty = doc.createElement('div');
      empty.textContent = 'Inventory is empty.';
      empty.style.fontSize = '.75rem';
      empty.style.opacity = '0.8';
      invList.appendChild(empty);
      return;
    }

    player.inventory.forEach((it, idx) => {
      const slot = it.slot || '';
      const cat = slot === 'head' ? 'Headgear'
        : slot === 'armor' ? 'Armor'
        : slot === 'weapon' ? 'Weapon'
        : slot === 'shield' ? 'Shield'
        : slot === 'garment' ? 'Garment'
        : slot === 'shoes' ? 'Shoes'
        : slot === 'accL' || slot === 'accR' ? 'Accessory'
        : 'Other';
      const active = activeItemFilters.has('All') ? true : activeItemFilters.has(cat);
      if (!active) return;
      const row = doc.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '46px minmax(0,2.1fr) auto auto';
      row.style.columnGap = '.5rem';
      row.style.alignItems = 'flex-start';
      row.style.padding = '.45rem .5rem';
      row.style.borderRadius = '.65rem';
      row.style.background = 'rgba(255,255,255,0.95)';
      row.style.border = '1px solid #b8cff1';
      row.style.minHeight = '86px';
      row.style.height = 'auto';
      invList.appendChild(row);

      row.appendChild(makeItemIcon(it));

      const main = doc.createElement('div');
      main.style.display = 'flex';
      main.style.flexDirection = 'column';
      main.style.gap = '.1rem';
      row.appendChild(main);

      const top = doc.createElement('div');
      top.style.display = 'flex';
      top.style.alignItems = 'center';
      top.style.justifyContent = 'space-between';
      main.appendChild(top);

      const rarity = it.rarity || 'Common';
      const name = doc.createElement('span');
      name.textContent = it.name || 'Item';
      name.style.fontSize = '.8rem';
      name.style.fontWeight = '600';
      name.style.color =
        rarity === 'Uncommon' ? '#0f766e' :
        rarity === 'Rare' ? '#2563eb' :
        rarity === 'Legendary' ? '#b45309' :
        rarity === 'Unique' ? '#9d174d' :
        '#1f2937';
      top.appendChild(name);

      const slotSpan = doc.createElement('span');
      const rarityLabel = rarity || 'Common';
      const slotLabel = it.slot ? (SLOT_LABEL[it.slot] || it.slot) : 'Item';
      slotSpan.textContent = `${rarityLabel} ${slotLabel}`;
      slotSpan.style.fontSize = '.7rem';
      slotSpan.style.opacity = '0.78';
      main.appendChild(slotSpan);

      const descSpan = doc.createElement('div');
      descSpan.style.fontSize = '.7rem';
      descSpan.style.opacity = '0.8';
      descSpan.style.lineHeight = '1.35';
      descSpan.style.wordBreak = 'break-word';
      descSpan.textContent = it.desc || describeItemShort(it);
      main.appendChild(descSpan);

      const btnBox = doc.createElement('div');
      btnBox.style.display = 'flex';
      btnBox.style.alignItems = 'center';
      btnBox.style.justifyContent = 'flex-end';
      btnBox.style.gap = '.4rem';
      row.appendChild(btnBox);

      const equipBtn = doc.createElement('button');
      equipBtn.textContent = it.slot ? 'Equip' : 'Use';
      equipBtn.style.fontSize = '.75rem';
      equipBtn.style.padding = '.2rem .5rem';
      equipBtn.style.borderRadius = '.3rem';
      equipBtn.style.border = '1px solid rgba(255,255,255,0.25)';
      equipBtn.style.background = 'transparent';
      equipBtn.style.color = '#1b2d4b';
      equipBtn.style.cursor = 'pointer';
      btnBox.appendChild(equipBtn);

      equipBtn.onclick = (ev) => {
        ev.stopPropagation();
        if (!it.slot) return;
        if (!player.equip) player.equip = {};
        const slot = it.slot;
        const old = player.equip[slot];
        player.equip[slot] = it;
        player.inventory.splice(idx, 1);
        if (old) player.inventory.push(old);
        updateAll();
      };

    });
  }

  function renderRightPanel(){
    rightPanel.innerHTML = '';
    if (currentRightMode === 'Shop'){
      rightPanel.appendChild(shopList);
      rightPanel.appendChild(invList); // keep both for layout but hide inv
      shopList.style.display = 'flex';
      invList.style.display = 'none';
      if (shopMode === 'buy') renderShopBuy(); else renderShopSell();
    } else if (currentRightMode === 'Equipped'){
      const eqBox = doc.createElement('div');
      eqBox.style.display = 'flex';
      eqBox.style.flexDirection = 'column';
      eqBox.style.gap = '.25rem';
      eqBox.style.fontSize = '.78rem';
      const slots = ['weapon','shield','armor','garment','shoes','head','accL','accR'];
      slots.forEach((slotKey) => {
        const row = doc.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.padding = '.32rem .4rem';
        row.style.borderRadius = '.55rem';
        row.style.background = 'rgba(255,255,255,0.92)';
        row.style.border = '1px solid #b8cff1';
        const label = doc.createElement('span');
        label.textContent = SLOT_LABEL[slotKey] || slotKey;
        label.style.fontSize = '.74rem';
        label.style.opacity = '0.9';
        row.appendChild(label);
        const name = doc.createElement('span');
        const it = player.equip?.[slotKey];
        name.textContent = it ? it.name : 'Empty';
        name.style.fontWeight = '600';
        name.style.fontSize = '.78rem';
        name.style.opacity = it ? '0.95' : '0.6';
        row.appendChild(name);
        eqBox.appendChild(row);
      });
      rightPanel.appendChild(eqBox);
  } else {
    rightPanel.appendChild(invList);
    shopList.style.display = 'none';
    invList.style.display = 'flex';
    activeItemFilters = new Set(['All']);
    renderInventoryPanel();
  }
  }

  // ========= SKILLS RENDER =========
  function renderSkills(){
    skillsPtsEl.textContent = `Skill Points: ${player.skillPoints || 0}`;
    skillList.innerHTML = '';

    const entries = Object.entries(SKILL_DB);

    entries.forEach(([key, skill]) => {
      const tabCat = getSkillCategoryTab(key, skill);
      if (skillTab !== 'All' && tabCat !== skillTab) return;

      const unlocked = !!player.unlocks?.[key];
      if (hideLocked && !unlocked) return;

      const row = doc.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '46px minmax(0,1fr) 70px';
      row.style.columnGap = '.4rem';
      row.style.rowGap = '.25rem';
      row.style.alignItems = 'start';
      row.style.padding = '.6rem .65rem';
      row.style.borderRadius = '.65rem';
      row.style.background = 'rgba(255,255,255,0.95)';
      row.style.border = '1px solid #b8cff1';
      row.style.marginBottom = '.3rem';

      const iconBox = makeItemIcon({ sprite: skill.icon || 'assets/skill/basic.gif' });
      iconBox.style.width = '44px';
      iconBox.style.height = '44px';
      row.appendChild(iconBox);

      const main = doc.createElement('div');
      main.style.display = 'flex';
      main.style.flexDirection = 'column';
      main.style.gap = '.12rem';
      row.appendChild(main);

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.gap = '.4rem';
      main.appendChild(header);

      const nameEl = document.createElement('span');
      nameEl.textContent = skill.name;
      nameEl.style.fontWeight = '700';
      nameEl.style.fontSize = '.94rem';
      header.appendChild(nameEl);

      const baseLevel = player.skillLevel?.[key] || 0;
      const bonusLevel =
        typeof player.getSkillBonusLevel === 'function'
          ? player.getSkillBonusLevel(key)
          : 0;
      const maxLv = skill.maxLevel || 5;

      const lvlEl = document.createElement('span');
      const bonusTxt = bonusLevel > 0 ? ` (+${bonusLevel})` : '';
      lvlEl.textContent = `Lv ${baseLevel}${bonusTxt}/${maxLv}`;
      lvlEl.style.fontSize = '.82rem';
      lvlEl.style.opacity = '.9';
      lvlEl.style.marginLeft = 'auto';
      header.appendChild(lvlEl);

      const metaRow = document.createElement('div');
      metaRow.style.display = 'flex';
      metaRow.style.alignItems = 'center';
      metaRow.style.gap = '.5rem';
      metaRow.style.fontSize = '.76rem';
      main.appendChild(metaRow);

      const elem = skill.element || 'NEUTRAL';
      const elemTag = document.createElement('span');
      elemTag.textContent = elem;
      elemTag.style.fontWeight = '700';
      elemTag.style.padding = '.06rem .55rem';
      elemTag.style.borderRadius = '999px';
      elemTag.style.background = getElementColor(elem) + '20';
      elemTag.style.color = getElementColor(elem);
      metaRow.appendChild(elemTag);

      const catTag = document.createElement('span');
      catTag.textContent = skill.category || 'Active';
      catTag.style.opacity = '.82';
      metaRow.appendChild(catTag);

      const descEl = document.createElement('div');
      descEl.textContent = skill.desc || skill.description || '';
      descEl.style.fontSize = '.75rem';
      descEl.style.opacity = '.9';
      descEl.style.whiteSpace = 'normal';
      descEl.style.wordBreak = 'break-word';
      descEl.style.lineHeight = '1.4';
      main.appendChild(descEl);

      const nextLevel = Math.min(baseLevel + 1, maxLv);
      let requiredCharLevel;
      const levelReqs = skill.levelReqs;
      if (levelReqs && !player.adminMode){
        if (Array.isArray(levelReqs)){
          requiredCharLevel = levelReqs[nextLevel - 1];
        } else if (typeof levelReqs === 'object'){
          requiredCharLevel = levelReqs[nextLevel];
        }
      }
      if (requiredCharLevel == null){
        requiredCharLevel = skill.unlockLevel || skill.requiredLevel || 1;
      }

      let prereqList =
        skill.prereq ||
        skill.prereqs ||
        skill.prerequisites ||
        skill.requires ||
        null;
      if (prereqList && !Array.isArray(prereqList)){
        prereqList = [prereqList];
      }

      const reqParts = [];
      if (requiredCharLevel > 1 && baseLevel < maxLv){
        reqParts.push(`Requires Lv ${requiredCharLevel} for next level`);
      }
      if (prereqList && prereqList.length){
        const names = prereqList.map((k) => {
          const s = SKILL_DB[k];
          return s ? s.name : k;
        });
        reqParts.push(`Prerequisite: ${names.join(', ')}`);
      }
      if (skill.prereqSkills){
        const skillReqText = [];
        Object.entries(skill.prereqSkills).forEach(([sKey, minLv]) => {
          const sDef = SKILL_DB[sKey];
          const sName = sDef ? sDef.name : sKey;
          skillReqText.push(`${sName} Lv ${minLv}`);
        });
        if (skillReqText.length){
          reqParts.push(`Requires: ${skillReqText.join(', ')}`);
        }
      }

      const reqRow = document.createElement('div');
      reqRow.style.fontSize = '.68rem';
      reqRow.style.opacity = '.78';
      reqRow.style.whiteSpace = 'normal';
      reqRow.style.wordBreak = 'break-word';
      reqRow.textContent = reqParts.join(' • ');
      main.appendChild(reqRow);

      const btnBox = doc.createElement('div');
      btnBox.style.display = 'flex';
      btnBox.style.justifyContent = 'flex-end';
      btnBox.style.alignSelf = 'start';
      btnBox.style.gridColumn = '3 / 4';
      row.appendChild(btnBox);

      const addBtn = doc.createElement('button');
      addBtn.textContent = '+';
      addBtn.style.fontSize = isMobile ? '.95rem' : '.85rem';
      addBtn.style.padding = isMobile ? '.35rem .75rem' : '.24rem .6rem';
      addBtn.style.borderRadius = '.45rem';
      addBtn.style.border = '1px solid rgba(255,255,255,0.25)';
      addBtn.style.background = 'linear-gradient(180deg, #fefefe 0%, #dbe9fb 100%)';
      addBtn.style.color = '#1b2d4b';

      const cost = skill.cost || 1;
      const pointsOk = (player.skillPoints || 0) >= cost;
      const notMaxed = baseLevel < maxLv;
      const levelOk = (player.level || 1) >= requiredCharLevel;

      let prereqOk = true;
      if (prereqList && prereqList.length && !player.adminMode){
        prereqOk = prereqList.every((k) => (player.skillLevel?.[k] || 0) > 0);
      }
      if (skill.prereqSkills && !player.adminMode){
        prereqOk = prereqOk && Object.entries(skill.prereqSkills).every(([sKey, minLv]) => {
          return (player.skillLevel?.[sKey] || 0) >= minLv;
        });
      }

      const canLearn = pointsOk && notMaxed && (player.adminMode ? true : levelOk) && (player.adminMode ? true : prereqOk);
      addBtn.disabled = !canLearn;
      addBtn.style.opacity = canLearn ? '1' : '0.4';
      addBtn.style.cursor = canLearn ? 'pointer' : 'default';

      let tooltip = '';
      if (!notMaxed) tooltip = 'Skill is already at max level.';
      else if (!levelOk) tooltip = `Requires character level ${requiredCharLevel} for next level.`;
      else if (!prereqOk) tooltip = 'Requires prerequisite skill(s) / levels.';
      else if (!pointsOk) tooltip = 'Not enough skill points.';
      if (tooltip) addBtn.title = tooltip;

      addBtn.onclick = () => {
        if (!canLearn) return;
        const lvl = player.skillLevel?.[key] || 0;
        if (lvl >= maxLv) return;
        if ((player.skillPoints || 0) < cost) return;

        player.skillPoints -= cost;
        if (!player.skillLevel) player.skillLevel = {};
        player.skillLevel[key] = lvl + 1;
        if (!player.unlocks) player.unlocks = {};
        player.unlocks[key] = true;
        updateAll();
      };

      btnBox.appendChild(addBtn);
      skillList.appendChild(row);
    });
  }

  // ========= GLOBAL UPDATE =========
  function updateAll(){
        const maxHp = player.getMaxHp ? player.getMaxHp() : (player.maxHp || 1);
    const hpPct = Math.max(0, Math.min(1, player.hp / maxHp));

    // HP bar color: green >50%, orange >25–50%, red ≤25%
    let hpGradient = 'linear-gradient(to right, #22c55e, #16a34a)'; // green
    if (hpPct <= 0.25) {
      hpGradient = 'linear-gradient(to right, #ef4444, #b91c1c)';   // red
    } else if (hpPct <= 0.5) {
      hpGradient = 'linear-gradient(to right, #f97316, #ea580c)';   // orange
    }
    hpBar.barInner.style.background = hpGradient;

    hpBar.barInner.style.width = (hpPct * 100) + '%';
    hpBar.val.textContent = `${Math.floor(player.hp)}/${maxHp}`;


    const lvl = player.level || 1;
    lvlValue.textContent = `Lv ${lvl}`;

    const sp = player.statPoints || 0;
    const kp = player.skillPoints || 0;
    pointsInfo.textContent = `Stat Points: ${sp} • Skill Points: ${kp}`;
    attrPointsLabel.textContent = `Stat Points: ${sp}`;
    statPointsLabel.textContent = `Unspent Stat Points: ${sp}`;
    skillPointsLabel.textContent = `Unspent Skill Points: ${kp}`;

    // derived stats
    const cc = typeof player.getCritChance === 'function' ? player.getCritChance() : 0;
    const cd = typeof player.getCritDamage === 'function' ? player.getCritDamage() : 1.5;
    const ms = typeof player.getMoveSpeed === 'function' ? player.getMoveSpeed() : 0;
    const atkCd = typeof player.getAttackCooldown === 'function' ? player.getAttackCooldown() : 0;
    const atkSpd = atkCd > 0 ? (60 / atkCd) : 0;
    const luck = (player.stats && player.stats.luck) || 0;
    const vw = doc.defaultView ? doc.defaultView.innerWidth : 800;
    const vh = doc.defaultView ? doc.defaultView.innerHeight : 600;
    const screenRadius = Math.hypot(vw, vh) / 2;
    const basePickup = (player.r || 0) + 10;
    const extraPerLuck = screenRadius / 99;
    const pickupRadius = Math.min(screenRadius, basePickup + luck * extraPerLuck);
    const defense = typeof player.getDefense === 'function' ? player.getDefense() : (player.defense || 0);

    // helper to format base + bonus with colored bonus
    const formatBaseBonus = (base, total, suffix='') => {
      const bonus = Math.max(0, total - base);
      const baseTxt = `${base}${suffix}`;
      const bonusTxt = bonus > 0 ? ` <span style="color:#16a34a;">(+${bonus}${suffix})</span>` : '';
      return baseTxt + bonusTxt;
    };

    // Crit chance: base from LUK + 5%, bonus = gear/skills (cap-aware)
    const baseCrit = Math.min(0.8, 0.05 + luck * 0.003);
    const bonusCrit = Math.max(0, cc - baseCrit);
    if (statRows.critChance) {
      statRows.critChance.innerHTML = `${(baseCrit * 100).toFixed(1)}%` +
        (bonusCrit > 0 ? ` <span style="color:#16a34a;">(+${(bonusCrit * 100).toFixed(1)}%)</span>` : '');
    }

    // Crit damage: base 1.5x
    const baseCd = 1.5;
    const bonusCd = Math.max(0, cd - baseCd);
    if (statRows.critDamage) {
      statRows.critDamage.innerHTML = `${baseCd.toFixed(2)}x` +
        (bonusCd > 0 ? ` <span style="color:#16a34a;">(+${bonusCd.toFixed(2)}x)</span>` : '');
    }

    // Move speed: fixed base; only gear bonuses apply
    const baseMs = 2.4;
    const bonusMs = Math.max(0, ms - baseMs);
    if (statRows.moveSpeed) {
      statRows.moveSpeed.innerHTML = `${baseMs.toFixed(2)} u/f` +
        (bonusMs > 0.0001 ? ` <span style="color:#16a34a;">(+${bonusMs.toFixed(2)})</span>` : '');
    }

    if (statRows.attackSpeed) statRows.attackSpeed.textContent = `${atkSpd.toFixed(2)} /s`;
    if (statRows.pickupRadius) statRows.pickupRadius.textContent = `${Math.round(pickupRadius)} px`;
    if (statRows.defense) statRows.defense.textContent = `${defense}`;

    // Cooldown Reduction (flat cooldown reduction shown as frames)
    if (statRows.cdr) {
      const flatCd = player.equip
        ? Object.values(player.equip).reduce((acc, it) => acc + (it?.bonuses?.cooldownFlat || 0), 0)
        : 0;
      const atkSpeedBonus = player.equip
        ? Object.values(player.equip).reduce((acc, it) => acc + (it?.bonuses?.attackSpeed || 0), 0)
        : 0;
      const totalCdFrames = flatCd - atkSpeedBonus; // atkSpeed lowers cooldown
      statRows.cdr.textContent = totalCdFrames !== 0 ? `${totalCdFrames} frames` : '0';
    }

    // HP Regen: show per second from skill/gear
    if (statRows.hpRegen) {
      const regenLevel = typeof player.getEffectiveSkillLevel === 'function'
        ? player.getEffectiveSkillLevel('HPRegen')
        : (player.skillLevel?.HPRegen || 0);
      const regenFromSkill = regenLevel > 0 ? (2 + regenLevel * 3) * (60 / 360) : 0; // tick every 360f
      const regenFromGear = player.equip
        ? Object.values(player.equip).reduce((acc, it) => acc + (it?.bonuses?.hp || 0), 0)
        : 0;
      const totalRegenPerSec = regenFromSkill + regenFromGear * 0.02; // assume +hp gives small passive regen
      statRows.hpRegen.textContent = `${totalRegenPerSec.toFixed(2)} /s`;
    }

    // Bonus HP from items and skills
    if (statRows.bonusHp) {
      const baseHp = PLAYER_BASE_HP + (player.stats?.vit || 0) * HP_PER_VIT;
      let bonusHp = 0;
      if (player.equip) {
        Object.values(player.equip).forEach((it) => {
          if (!it) return;
          if (it.bonuses?.maxHp) bonusHp += it.bonuses.maxHp;
          if (it.bonuses?.vit) bonusHp += it.bonuses.vit * HP_PER_VIT;
        });
      }
      const fromSkills = 0; // placeholder if future skills add HP
      bonusHp += fromSkills;
      statRows.bonusHp.textContent = `${Math.round(bonusHp)} (of ${Math.round(baseHp + bonusHp)})`;
    }

    // Current Skill Range: use nearest active skill; fallback to arrow/fireball average
    if (statRows.skillRange) {
      const dex = player.stats?.dex || 0;
      const rangeArrow = 240 + Math.min(40, dex) * 12; // matches computeProjectileLifeForDex baseRange
      const rangeFire = 200 + Math.min(40, dex) * 12;
      const avgRange = Math.round((rangeArrow + rangeFire) / 2);
      statRows.skillRange.textContent = `${avgRange} px`;
    }

    // attributes
    if (!player.stats) player.stats = { str:0, agi:0, vit:0, int:0, dex:0, luck:0 };
    attrControls.str.val.textContent = player.stats.str;
    attrControls.agi.val.textContent = player.stats.agi;
    attrControls.vit.val.textContent = player.stats.vit;
    attrControls.int.val.textContent = player.stats.int;
    attrControls.dex.val.textContent = player.stats.dex;
    attrControls.luck.val.textContent = player.stats.luck;

    Object.entries(attrControls).forEach(([key, ctrl]) => {
      const can = (player.statPoints || 0) > 0 && (player.stats?.[key] ?? 0) < 99;
      ctrl.btn.disabled = !can;
      ctrl.btn.style.opacity = can ? '1' : '0.4';
      ctrl.btn.style.cursor = can ? 'pointer' : 'default';
    });

    // gold
    goldValue.textContent = `${player.gold || 0} gold`;

    // equipment
    if (!player.equip) player.equip = { head:null, armor:null, weapon:null, shield:null, garment:null, shoes:null, accL:null, accR:null };
    Object.entries(equipUI).forEach(([slotKey, ui]) => {
      const it = player.equip[slotKey];
      ui.name.textContent = it ? it.name : 'Empty';
      ui.name.style.opacity = it ? '0.96' : '0.6';
    });

    // skill list + shop / inv
    activeItemFilters = new Set(['All']);
    renderSkills();
    renderRightPanel();
    updateShopModeButtons();
  }

  function open(tab){
    overlayEl.style.display = 'grid';
    if (isMobile){
      if (tab === 'Inv' || tab === 'Shop') {
        setMainTab('Item');
        if (tab === 'Shop') setRightMode('Shop');
      } else if (tab === 'Skills') {
        setMainTab('Skills');
      } else {
        setMainTab('Attributes');
      }
    } else {
      if (tab === 'Shop') setRightMode('Shop');
      else if (tab === 'Inv') setRightMode('Inventory');
    }
    updateAll();
  }

  function close(){
    overlayEl.style.display = 'none';
    if (onClose) onClose();
  }

  // initial
  setRightMode('Inventory');
  setShopMode('buy');
  setSkillTab('All');
  if (isMobile) setMainTab(currentMainTab);

  return {
    open,
    close,
    setShopMode
  };
}
const ELEMENT_COLOR = {
  FIRE:'#e34a4a',
  WATER:'#4aa3e3',
  WIND:'#4caf50',
  EARTH:'#8b5a2b',
  NEUTRAL:'#9ca3af'
};

function getElementColor(elem){
  return ELEMENT_COLOR[elem] || '#9ca3af';
}
