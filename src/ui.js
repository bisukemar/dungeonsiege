import { SKILL_DB } from './databases/skillDB.js';
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

// Map a skill to one of the UI categories
function getSkillCategoryTab(key, skill){
  const cat = (skill.category || '').toLowerCase();
  if (cat === 'passive') return 'Passive';
  if (cat === 'magic') return 'Magic';

  // Anything else is "Physical" – divide manually into Melee / Range
  const k = key.toLowerCase();
  if (k === 'arrow') return 'Range';
  // treat Bash / Magnum as melee
  if (k === 'bash' || k === 'magnum') return 'Melee';

  // default physical skills to Melee
  if (cat === 'physical') return 'Melee';

  // fallback
  return 'Magic';
}

export function makeOverlay(doc, player, onClose){
  // root overlay (re-use if already exists)
  let overlayEl = doc.getElementById('char-overlay');
  if (!overlayEl){
    overlayEl = doc.createElement('div');
    overlayEl.id = 'char-overlay';
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
  win.style.width = '960px';
  win.style.maxWidth = '96vw';
  win.style.maxHeight = '90vh';
  win.style.display = 'flex';
  win.style.flexDirection = 'column';
  win.style.background = 'linear-gradient(180deg, #fdfdff 0%, #dfeaf9 50%, #c8dcf6 100%)';
  win.style.borderRadius = '1rem';
  win.style.border = '2px solid #7da8d9';
  win.style.boxShadow = '0 28px 80px rgba(22, 41, 84, 0.35)';
  win.style.color = '#1b2d4b';
  win.style.fontFamily = "Trebuchet MS, 'Segoe UI', system-ui,-apple-system,BlinkMacSystemFont,'Inter',Roboto,'Segoe UI',sans-serif";
  win.style.fontSize = '.8rem';
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
  body.style.padding = '0.75rem 0.85rem 0.85rem';
  body.style.gap = '.6rem';
  win.appendChild(body);

  // ---- character info card ----
  const charCard = doc.createElement('div');
  charCard.style.padding = '.55rem .7rem';
  charCard.style.borderRadius = '.75rem';
  charCard.style.border = '1px solid #9ab9e8';
  charCard.style.background = 'linear-gradient(180deg, #fefefe 0%, #e6f1ff 55%, #cfe0f8 100%)';
  charCard.style.display = 'grid';
  charCard.style.gridTemplateColumns = 'minmax(0,1.4fr) minmax(0,1.5fr) minmax(0,1.3fr)';
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

  // middle: level / EXP
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

  const expBarOuter = doc.createElement('div');
  expBarOuter.style.width = '100%';
  expBarOuter.style.height = '6px';
  expBarOuter.style.borderRadius = '999px';
  expBarOuter.style.background = '#e3efff';
  expBarOuter.style.overflow = 'hidden';
  c2.appendChild(expBarOuter);

  const expBarInner = doc.createElement('div');
  expBarInner.style.height = '100%';
  expBarInner.style.width = '0%';
  expBarInner.style.borderRadius = '999px';
  expBarInner.style.background = 'linear-gradient(to right, #a855f7, #22c55e)';
  expBarOuter.appendChild(expBarInner);

  const expText = doc.createElement('div');
  expText.style.fontSize = '.72rem';
  expText.style.opacity = '.85';
  c2.appendChild(expText);

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

  // ---------- main 3-column layout ----------
  const mainRow = doc.createElement('div');
  mainRow.style.display = 'grid';
  mainRow.style.gridTemplateColumns = 'minmax(0,1.1fr) minmax(0,1.6fr) minmax(0,1.4fr)';
  mainRow.style.gap = '.6rem';
  mainRow.style.flex = '1 1 auto';
  mainRow.style.minHeight = '0';
  body.appendChild(mainRow);

  // ==== LEFT: attributes + equipped ====
  const leftCol = doc.createElement('div');
  leftCol.style.display = 'flex';
  leftCol.style.flexDirection = 'column';
  leftCol.style.gap = '.55rem';
  mainRow.appendChild(leftCol);

  // attributes card
  const attrCard = doc.createElement('div');
  attrCard.style.borderRadius = '.75rem';
  attrCard.style.border = '1px solid rgba(148,163,184,0.55)';
  attrCard.style.background = 'linear-gradient(180deg, #fdfdff 0%, #e4efff 55%, #cfe0f8 100%)';
  attrCard.style.padding = '.55rem .65rem';
  attrCard.style.display = 'flex';
  attrCard.style.flexDirection = 'column';
  attrCard.style.gap = '.35rem';
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

  const attrControls = {};

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
    btn.style.width = '20px';
    btn.style.height = '20px';
    btn.style.borderRadius = '999px';
    btn.style.border = '1px solid rgba(209,213,219,0.9)';
    btn.style.background = 'linear-gradient(180deg, #fefefe 0%, #dbe9fb 100%)';
    btn.style.color = '#1b2d4b';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '.8rem';
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
  midCol.style.gap = '.55rem';
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
  skillList.style.maxHeight = '320px';
  skillList.style.overflowY = 'auto';
  skillsCard.appendChild(skillList);

  // ==== RIGHT: shop / inventory ====
  const rightCol = doc.createElement('div');
  rightCol.style.display = 'flex';
  rightCol.style.flexDirection = 'column';
  rightCol.style.gap = '.55rem';
  mainRow.appendChild(rightCol);

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
  modeLabel.textContent = 'Item Panel:';
  modeLabel.style.fontSize = '.75rem';
  modeLabel.style.opacity = '0.8';
  modeCard.appendChild(modeLabel);

  const modeTabs = doc.createElement('div');
  modeTabs.style.display = 'inline-flex';
  modeTabs.style.gap = '.35rem';
  modeCard.appendChild(modeTabs);

  const rightModes = ['Shop','Inventory'];
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
  shopList.style.maxHeight = '320px';
  shopList.style.overflowY = 'auto';

  const invList = doc.createElement('div');
  invList.style.display = 'flex';
  invList.style.flexDirection = 'column';
  invList.style.gap = '.25rem';
  invList.style.minHeight = '0';
  invList.style.maxHeight = '320px';
  invList.style.overflowY = 'auto';

  function renderShopBuy(){
    shopList.innerHTML = '';

    // add mode row
    shopList.appendChild(shopModeRow);

    const listBox = doc.createElement('div');
    listBox.style.display = 'flex';
    listBox.style.flexDirection = 'column';
    listBox.style.gap = '.25rem';
    shopList.appendChild(listBox);

    // ITEMS_DB is an array
    ITEMS_DB.forEach((item) => {
      if (!item) return;
      const row = doc.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = 'minmax(0,2.1fr) auto auto';
      row.style.gap = '.35rem';
      row.style.alignItems = 'center';
      row.style.padding = '.3rem .35rem';
      row.style.borderRadius = '.6rem';
      row.style.background = 'rgba(255,255,255,0.95)';
      row.style.border = '1px solid #b8cff1';

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
      name.style.fontWeight = '500';
      top.appendChild(name);

      const priceSpan = doc.createElement('span');
      priceSpan.style.fontSize = '.78rem';
      priceSpan.style.opacity = '0.9';
      const price = item.price || 100;
      priceSpan.textContent = `Buy: ${price} gold`;
      top.appendChild(priceSpan);

      const typeSpan = doc.createElement('span');
      typeSpan.textContent = item.slot ? (SLOT_LABEL[item.slot] || item.slot) : 'Item';
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

      btn.onclick = (ev) => {
        ev.stopPropagation();
        const cost = item.price || 100;
        const currentGold = player.gold || 0;
        if (currentGold < cost) return;
        player.gold = currentGold - cost;
        if (!player.inventory) player.inventory = [];
        // push a shallow copy so we don't mutate DB entry
        player.inventory.push({ ...item });
        updateAll();
      };

      btnBox.appendChild(btn);
      row.onclick = () => btn.click();

      listBox.appendChild(row);
    });
  }

  function renderShopSell(){
    shopList.innerHTML = '';
    shopList.appendChild(shopModeRow);

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
      const row = doc.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = 'minmax(0,2.1fr) auto auto';
      row.style.gap = '.35rem';
      row.style.alignItems = 'center';
      row.style.padding = '.3rem .35rem';
      row.style.borderRadius = '.6rem';
      row.style.background = 'rgba(255,255,255,0.95)';
      row.style.border = '1px solid #b8cff1';

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
      name.textContent = it.name || 'Item';
      name.style.fontSize = '.8rem';
      name.style.fontWeight = '500';
      top.appendChild(name);

      const base = it.price || 100;
      const sellPrice = Math.floor(base * 0.5);
      const priceSpan = doc.createElement('span');
      priceSpan.style.fontSize = '.78rem';
      priceSpan.style.opacity = '0.9';
      priceSpan.textContent = `Sell: ${sellPrice} gold`;
      top.appendChild(priceSpan);

      const typeSpan = doc.createElement('span');
      typeSpan.textContent = it.slot ? (SLOT_LABEL[it.slot] || it.slot) : 'Item';
      typeSpan.style.fontSize = '.7rem';
      typeSpan.style.opacity = '0.78';
      main.appendChild(typeSpan);

      const descSpan = doc.createElement('div');
      descSpan.style.fontSize = '.7rem';
      descSpan.style.opacity = '0.8';
      descSpan.textContent = it.desc || describeItemShort(it);
      main.appendChild(descSpan);

      const btnBox = doc.createElement('div');
      btnBox.style.display = 'flex';
      btnBox.style.alignItems = 'center';
      btnBox.style.justifyContent = 'flex-end';
      row.appendChild(btnBox);

      const btn = doc.createElement('button');
      btn.textContent = 'Sell';
      btn.style.borderRadius = '999px';
      btn.style.border = '1px solid rgba(148,163,184,0.9)';
      btn.style.padding = '.18rem .55rem';
      btn.style.fontSize = '.73rem';
      btn.style.cursor = 'pointer';
      btn.style.background = 'linear-gradient(180deg, #fefefe 0%, #dbe9fb 100%)';
      btn.style.color = '#1b2d4b';

      btn.onclick = (ev) => {
        ev.stopPropagation();
        if (!player.inventory || !player.inventory[idx]) return;
        player.inventory.splice(idx, 1);
        player.gold = (player.gold || 0) + sellPrice;
        updateAll();
      };

      btnBox.appendChild(btn);
      row.onclick = () => btn.click();

      listBox.appendChild(row);
    });
  }

  function renderInventoryPanel(){
    invList.innerHTML = '';

    if (!player.inventory || player.inventory.length === 0){
      const empty = doc.createElement('div');
      empty.textContent = 'Inventory is empty.';
      empty.style.fontSize = '.75rem';
      empty.style.opacity = '0.8';
      invList.appendChild(empty);
      return;
    }

    player.inventory.forEach((it, idx) => {
      const row = doc.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = 'minmax(0,2.1fr) auto auto';
      row.style.gap = '.35rem';
      row.style.alignItems = 'center';
      row.style.padding = '.3rem .35rem';
      row.style.borderRadius = '.6rem';
      row.style.background = 'rgba(255,255,255,0.95)';
      row.style.border = '1px solid #b8cff1';
      invList.appendChild(row);

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
      name.textContent = it.name || 'Item';
      name.style.fontSize = '.8rem';
      name.style.fontWeight = '500';
      top.appendChild(name);

      const slotSpan = doc.createElement('span');
      slotSpan.textContent = it.slot ? (SLOT_LABEL[it.slot] || it.slot) : 'Item';
      slotSpan.style.fontSize = '.7rem';
      slotSpan.style.opacity = '0.78';
      main.appendChild(slotSpan);

      const descSpan = doc.createElement('div');
      descSpan.style.fontSize = '.7rem';
      descSpan.style.opacity = '0.8';
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

      const dropBtn = doc.createElement('button');
      dropBtn.textContent = 'Drop';
      dropBtn.style.fontSize = '.75rem';
      dropBtn.style.padding = '.2rem .5rem';
      dropBtn.style.borderRadius = '.3rem';
      dropBtn.style.border = '1px solid rgba(255,255,255,0.25)';
      dropBtn.style.background = 'transparent';
      dropBtn.style.color = '#1b2d4b';
      dropBtn.style.cursor = 'pointer';
      btnBox.appendChild(dropBtn);

      dropBtn.onclick = (ev) => {
        ev.stopPropagation();
        if (!player.inventory || !player.inventory[idx]) return;
        player.inventory.splice(idx, 1);
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
    } else {
      rightPanel.appendChild(invList);
      shopList.style.display = 'none';
      invList.style.display = 'flex';
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

      const row = doc.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = 'minmax(0,2.4fr) auto auto';
      row.style.gap = '.35rem';
      row.style.alignItems = 'center';
      row.style.padding = '.35rem .45rem';
      row.style.borderRadius = '.45rem';
      row.style.background = 'rgba(255,255,255,0.92)';
      row.style.border = '1px solid #b8cff1';
      row.style.marginBottom = '.25rem';

      const main = doc.createElement('div');
      main.style.display = 'flex';
      main.style.flexDirection = 'column';
      main.style.gap = '.1rem';
      row.appendChild(main);

      const top = doc.createElement('div');
      top.style.display = 'flex';
      top.style.alignItems = 'center';
      top.style.gap = '.4rem';
      main.appendChild(top);

      const nameEl2 = doc.createElement('span');
      nameEl2.textContent = skill.name;
      nameEl2.style.fontWeight = '600';
      nameEl2.style.fontSize = '.82rem';
      top.appendChild(nameEl2);

      const baseLevel = player.skillLevel?.[key] || 0;
      const bonusLevel =
        typeof player.getSkillBonusLevel === 'function'
          ? player.getSkillBonusLevel(key)
          : 0;
      const effectiveLevel = baseLevel + bonusLevel;
      const maxLv = skill.maxLevel || 5;

      const lvlEl = doc.createElement('span');
      const bonusTxt = bonusLevel > 0 ? ` (+${bonusLevel})` : '';
      lvlEl.textContent = `Lv ${effectiveLevel}/${maxLv}${bonusTxt}`;
      lvlEl.style.fontSize = '.75rem';
      lvlEl.style.opacity = '.85';
      top.appendChild(lvlEl);

      const descEl = doc.createElement('div');
      descEl.textContent = skill.desc || skill.description || '';
      descEl.style.fontSize = '.74rem';
      descEl.style.opacity = '.85';
      main.appendChild(descEl);

      // per-level character level requirements
      const nextLevel = Math.min(baseLevel + 1, maxLv);
      let requiredCharLevel;
      const levelReqs = skill.levelReqs;

      if (levelReqs){
        if (Array.isArray(levelReqs)){
          requiredCharLevel = levelReqs[nextLevel - 1];
        } else if (typeof levelReqs === 'object'){
          requiredCharLevel = levelReqs[nextLevel];
        }
      }

      if (requiredCharLevel == null){
        requiredCharLevel = skill.unlockLevel || skill.requiredLevel || 1;
      }

      // simple prereq list
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

      if (reqParts.length){
        const reqEl = doc.createElement('div');
        reqEl.textContent = reqParts.join(' • ');
        reqEl.style.fontSize = '.68rem';
        reqEl.style.opacity = '.75';
        main.appendChild(reqEl);
      }

      // cost
      const cost = skill.cost || 1;
      const costEl = doc.createElement('div');
      costEl.textContent = `Cost: ${cost} point(s)`;
      costEl.style.fontSize = '.7rem';
      costEl.style.opacity = '.8';
      main.appendChild(costEl);

      const typeEl = doc.createElement('div');
      typeEl.textContent = (skill.category || 'Active');
      typeEl.style.fontSize = '.7rem';
      typeEl.style.opacity = '.75';
      row.appendChild(typeEl);

      const btnBox = doc.createElement('div');
      btnBox.style.display = 'flex';
      btnBox.style.justifyContent = 'flex-end';
      row.appendChild(btnBox);

      const addBtn = doc.createElement('button');
      addBtn.textContent = '+';
      addBtn.style.fontSize = '.75rem';
      addBtn.style.padding = '.18rem .45rem';
      addBtn.style.borderRadius = '.35rem';
      addBtn.style.border = '1px solid rgba(255,255,255,0.25)';
      addBtn.style.background = 'linear-gradient(180deg, #fefefe 0%, #dbe9fb 100%)';
      addBtn.style.color = '#1b2d4b';

      const pointsOk = (player.skillPoints || 0) >= cost;
      const notMaxed = baseLevel < maxLv;
      const levelOk = (player.level || 1) >= requiredCharLevel;

      let prereqOk = true;

      if (prereqList && prereqList.length){
        prereqOk = prereqList.every((k) => (player.skillLevel?.[k] || 0) > 0);
      }

      if (skill.prereqSkills){
        prereqOk = prereqOk && Object.entries(skill.prereqSkills).every(([sKey, minLv]) => {
          return (player.skillLevel?.[sKey] || 0) >= minLv;
        });
      }

      const canLearn = pointsOk && notMaxed && levelOk && prereqOk;

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
    const exp = player.exp || 0;
    const getReq = player.getExpToLevelRequirement ? player.getExpToLevelRequirement.bind(player) : null;
    const nextReq = getReq ? getReq(lvl) : 100;
    const prevReq = getReq ? getReq(lvl - 1) : 0;
    const span = nextReq - prevReq;
    const current = exp - prevReq;
    const expPct = span > 0 ? Math.max(0, Math.min(1, current / span)) : 0;

    expBarInner.style.width = (expPct * 100) + '%';
    lvlValue.textContent = `Lv ${lvl}`;
    expText.textContent = `${current}/${span} EXP to next level`;

    const sp = player.statPoints || 0;
    const kp = player.skillPoints || 0;
    pointsInfo.textContent = `Stat Points: ${sp} • Skill Points: ${kp}`;
    attrPointsLabel.textContent = `Stat Points: ${sp}`;
    statPointsLabel.textContent = `Unspent Stat Points: ${sp}`;
    skillPointsLabel.textContent = `Unspent Skill Points: ${kp}`;

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
    renderSkills();
    renderRightPanel();
    updateShopModeButtons();
  }

  function open(tab){
    overlayEl.style.display = 'grid';
    if (tab === 'Shop') setRightMode('Shop');
    else if (tab === 'Inv') setRightMode('Inventory');
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

  return {
    open,
    close,
    setShopMode
  };
}
