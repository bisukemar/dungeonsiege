import { WORLD } from './constants.js';
import {
  Player,
  MonsterProjectile,
  DamageText,
  applyDamageToMonster,
  BasicArc
} from './entities.js';
import {
  castFireball,
  castArrow,
  castIceWave,
  castBash,
  castMagnum,
	castMeteorStorm 
} from './skills.js';
import {
  spawnMonsterForRound,
  spawnBoss,
  nearestMonster
} from './spawn.js';
import { makeOverlay } from './ui.js';
import { SKILL_DB } from './databases/skillDB.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const uiDiv = document.getElementById('ui');
const msgDiv = document.getElementById('msg');
const pausedText = document.getElementById('pausedText');

const topBar = document.getElementById('topBar');
const statsBtn = document.getElementById('statsBtn');
const adminBtn = document.getElementById('adminBtn');

// Title + options
const titleScreen = document.getElementById('titleScreen');
const titleStartBtn = document.getElementById('titleStartBtn');
const titleOptionsBtn = document.getElementById('titleOptionsBtn');
const optionsModal = document.getElementById('optionsModal');
const optionsCloseBtn = document.getElementById('optionsCloseBtn');
const adminToggle = document.getElementById('adminToggle');
const joystick = createMobileJoystick(canvas);

// ========= CANVAS / CAMERA =========
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const world = { width: WORLD.width, height: WORLD.height };
const cam = { x: 0, y: 0 };

function centerCamera(player) {
  cam.x = Math.max(
    0,
    Math.min(world.width - canvas.width, player.x - canvas.width / 2)
  );
  cam.y = Math.max(
    0,
    Math.min(world.height - canvas.height, player.y - canvas.height / 2)
  );
}

// ========= PLAYER & STATE =========
const INITIAL_GOLD = 100;
const player = new Player(world.width / 2, world.height / 2);
player.hp = player.getMaxHp();
player.gold = INITIAL_GOLD;

// Real (level-up) points
player.statPoints = 0;
player.skillPoints = 0;

// Admin-mode bookkeeping so we don't mix legit points and debug points
player.adminMode = false;
player._savedStatPoints = 0;
player._savedSkillPoints = 0;

// Skills: start all at 0 and locked; we will unlock some on game setup
player.skillLevel = {
  Fireball: 0,
  Arrow: 0,
  Ice: 0,
  Bash: 0,
  Magnum: 0,
  Toughness: 0,
  Haste: 0,
  Precision: 0,
  HPRegen: 0,
Meteor: 0
};
player.unlocks = {
  Fireball: false,
  Arrow: false,
  Ice: false,
  Bash: false,
  Magnum: false,
  Toughness: false,
  Haste: false,
  Precision: false,
  HPRegen: false,
	Meteor: false 
};

// Skill cooldowns table
player.skillCooldowns = {};
Object.keys(SKILL_DB).forEach((k) => (player.skillCooldowns[k] = 0));

function getEffectiveSkillLevel(key) {
  if (typeof player.getEffectiveSkillLevel === 'function') {
    return player.getEffectiveSkillLevel(key);
  }
  return (player.skillLevel && player.skillLevel[key]) || 0;
}

function createMobileJoystick(canvasEl) {
  const state = {
    active: false,
    dirX: 0,
    dirY: 0,
    id: null,
    startX: 0,
    startY: 0
  };

  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.width = '160px';
  root.style.height = '160px';
  root.style.transform = 'translate(-50%, -50%)';
  root.style.left = '80px';
  root.style.top = '80px';
  root.style.pointerEvents = 'none';
  root.style.opacity = '0.92';
  root.style.zIndex = '80';
  root.style.display = 'none';

  const base = document.createElement('div');
  base.style.position = 'absolute';
  base.style.left = '0';
  base.style.top = '0';
  base.style.width = '160px';
  base.style.height = '160px';
  base.style.borderRadius = '50%';
  base.style.border = '2px solid rgba(23, 37, 84, 0.45)';
  base.style.background = 'radial-gradient(circle, rgba(255,255,255,0.6), rgba(180,205,244,0.35))';
  root.appendChild(base);

  const thumb = document.createElement('div');
  thumb.style.position = 'absolute';
  thumb.style.left = '50%';
  thumb.style.top = '50%';
  thumb.style.width = '70px';
  thumb.style.height = '70px';
  thumb.style.borderRadius = '50%';
  thumb.style.transform = 'translate(-50%, -50%)';
  thumb.style.background = 'linear-gradient(180deg, #fffefb 0%, #d7e8ff 100%)';
  thumb.style.boxShadow = '0 6px 14px rgba(21,44,90,0.28)';
  thumb.style.border = '1px solid rgba(23,37,84,0.25)';
  root.appendChild(thumb);

  function hide() {
    state.active = false;
    state.dirX = 0;
    state.dirY = 0;
    state.id = null;
    root.style.display = 'none';
    thumb.style.transform = 'translate(-50%, -50%)';
  }

  function updateThumb(touchX, touchY) {
    const dx = touchX - state.startX;
    const dy = touchY - state.startY;
    const maxR = 55;
    const dist = Math.hypot(dx, dy);
    const clamped = dist > maxR ? maxR : dist;
    const angle = Math.atan2(dy, dx) || 0;
    const offsetX = Math.cos(angle) * clamped;
    const offsetY = Math.sin(angle) * clamped;
    thumb.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    if (clamped < 6) {
      state.dirX = 0;
      state.dirY = 0;
    } else {
      state.dirX = offsetX / maxR;
      state.dirY = offsetY / maxR;
    }
  }

  function handleStart(e) {
    if (state.active) return;
    if (overlayOpen) return;
    const target = e.target;
    if (
      target &&
      target.closest &&
      target.closest('button, input, select, textarea, label, #overlay, #titleScreen, #topBar, #optionsModal')
    ) {
      return;
    }
    if (canvasEl && target && !canvasEl.contains(target) && target !== document.body) {
      return;
    }
    const touch = e.changedTouches[0];
    state.id = touch.identifier;
    state.startX = touch.clientX;
    state.startY = touch.clientY;
    root.style.left = `${touch.clientX}px`;
    root.style.top = `${touch.clientY}px`;
    root.style.display = 'block';
    state.active = true;
    updateThumb(touch.clientX, touch.clientY);
    e.preventDefault();
  }

  function handleMove(e) {
    if (!state.active) return;
    for (const t of e.changedTouches) {
      if (t.identifier === state.id) {
        updateThumb(t.clientX, t.clientY);
        break;
      }
    }
  }

  function handleEnd(e) {
    if (!state.active) return;
    for (const t of e.changedTouches) {
      if (t.identifier === state.id) {
        hide();
        break;
      }
    }
  }

  window.addEventListener('touchstart', handleStart, { passive: false });
  window.addEventListener('touchmove', handleMove, { passive: false });
  window.addEventListener('touchend', handleEnd, { passive: false });
  window.addEventListener('touchcancel', handleEnd, { passive: false });

  document.body.appendChild(root);
  return state;
}

// Facing direction for some skills
let facingX = 1;
let facingY = 0;
player.dx = facingX;
player.dy = facingY;

// Global game state flags
let keys = {};
let paused = false;
let gameOver = false;
let overlayOpen = false;
let resumeCountdown = 0;
let adminModeEnabled = false; // toggled in options
let gameStarted = false;      // true only after setup is valid
let preGameSetup = false;     // true only during the initial allocation
let gameLoopStarted = false;  // so we don't start loop twice

function startGameLoop() {
  if (gameLoopStarted) return;
  gameLoopStarted = true;
  requestAnimationFrame(loop);
}

// ========= TITLE SCREEN / OPTIONS =========

titleOptionsBtn.onclick = () => {
  if (!optionsModal) return;
  optionsModal.style.display = 'grid';
};

if (optionsCloseBtn) {
  optionsCloseBtn.onclick = () => {
    optionsModal.style.display = 'none';
  };
}

if (optionsModal) {
  optionsModal.addEventListener('click', (e) => {
    if (e.target === optionsModal) {
      optionsModal.style.display = 'none';
    }
  });
}

if (adminToggle) {
  adminToggle.onchange = (e) => {
    adminModeEnabled = !!e.target.checked;
    if (adminBtn) {
      adminBtn.style.display = adminModeEnabled ? 'inline-block' : 'none';
    }
  };
}

if (adminBtn) {
  // Start hidden; only show if adminModeEnabled is true
  adminBtn.style.display = adminModeEnabled ? 'inline-block' : 'none';
  adminBtn.onclick = () => {
    if (!adminModeEnabled) {
      alert('Admin Mode is disabled. Enable it first in Options on the title screen.');
      return;
    }
    openAdminPanel();
  };
}

// Called when "Start Game" is clicked on title screen
titleStartBtn.onclick = () => {
  if (optionsModal) optionsModal.style.display = 'none';
  // Hide title screen
  if (titleScreen) titleScreen.style.display = 'none';

  // Prep for pre-game setup
  preGameSetup = true;
  gameStarted = false;

  // Initial stat and skill points for setup
  player.statPoints = 9;
  player.skillPoints = 1;

  // Ensure player is at Level 1 baseline
  player.level = 1;
  player.exp = 0;
  player.expToLevel = 50;
  player.hp = player.getMaxHp();

  // Unlock starting active skills so the player can choose one
  player.unlocks.Fireball = true;
  player.unlocks.Bash = true;

  // Make the in-game top bar visible now (Character, Shop, etc.)
  if (topBar) topBar.style.display = 'flex';

  // Open stats/skills panel for initial allocation
  openOverlay('Stats');
};

// ========= INPUT =========

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (e.key === 'p' || e.key === 'P') togglePause();
  if (e.key === 'Escape' && overlayOpen) closeOverlay();

  // Optional: F2 = admin shortcut, but only if admin mode is enabled
  if (e.key === 'F2' && adminModeEnabled) {
    openAdminPanel();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// ========= OVERLAY / PANELS =========

function handleOverlayClosed() {
  overlayOpen = false;

  // If we are finishing the pre-game setup, enforce conditions
  if (preGameSetup && !gameStarted) {
    const remainingStat = player.statPoints || 0;

    const activeSkills = ['Fireball', 'Bash', 'Arrow', 'Ice', 'Magnum'];
    const hasActiveSkill = activeSkills.some(
      (k) => getEffectiveSkillLevel(k) > 0
    );

    if (remainingStat > 0 || !hasActiveSkill) {
      alert(
        'Before starting, spend all 9 stat points and choose at least one active skill (e.g., Fireball or Bash).'
      );
      // Force the player back to the stats panel
      openOverlay('Stats');
      return;
    }

    // Setup complete; start the game immediately (no countdown here)
    gameStarted = true;
    preGameSetup = false;

    // Reset round & spawn state so the first wave always appears
    round = 1;
    killsThisRound = 0;
    bossMode = false;
    bossEntity = null;
    monsters.length = 0;
    spawnTimer = 0;
    addRandomObstacles(round);

    paused = false;
    pausedText.style.display = 'none';
    resumeCountdown = 0;
    msgTimer = 0;
    msgDiv.innerHTML = '';

    startGameLoop();
    return;
  }

  // If we were in admin-mode panel, restore real point counters
  if (player.adminMode) {
    player.adminMode = false;
    if (player._savedStatPoints !== undefined) {
      player.statPoints = player._savedStatPoints;
      delete player._savedStatPoints;
    }
    if (player._savedSkillPoints !== undefined) {
      player.skillPoints = player._savedSkillPoints;
      delete player._savedSkillPoints;
    }
    // Gold remains whatever you set in admin mode (for shop debugging)
  }

  // For in-game windows (Character / Shop / Inventory) closed via X:
  // start a 3-second resume countdown.
  if (gameStarted && !preGameSetup && !gameOver) {
    paused = true;
    // Hide the static "Paused Game" text; we'll show the countdown banner instead
    pausedText.style.display = 'none';
    resumeCountdown = 3 * 60; // ~3 seconds at 60 FPS
    msgTimer = 0;
    msgDiv.innerHTML = '';

    // Ensure the loop is running to tick down the countdown
    requestAnimationFrame(loop);
  }
}



const useMobileOverlay = window.innerWidth < 960;
const overlay = makeOverlay(document, player, handleOverlayClosed, { forceMobile: useMobileOverlay });

statsBtn.onclick = () => {
  if (!gameOver && gameLoopStarted) openOverlay('Stats');
};

function openOverlay(tab) {
  overlayOpen = true;
  // Only pause the actual game if it has already started.
  if (gameStarted) {
    paused = true;
    pausedText.style.display = 'block';
  }
  overlay.open(tab);
}


function closeOverlay() {
  overlay.close();
}

// Admin debug: uses same stats/skills UI but with separate point pool
function openAdminPanel() {
  if (!adminModeEnabled) return;
  if (player.adminMode) return;

  player.adminMode = true;

  // Save real level-up points
  player._savedStatPoints = player.statPoints;
  player._savedSkillPoints = player.skillPoints;

  // Let you tweak gold too
  const currentGold = player.gold || 0;
  const input = prompt('Set player gold for debug:', String(currentGold));
  if (input !== null) {
    const val = parseInt(input, 10);
    if (!Number.isNaN(val)) {
      player.gold = val;
    }
  }

  // Give huge admin points just inside this panel
  player.statPoints = 999;
  player.skillPoints = 999;

  openOverlay('Stats');
}

// --- Shop choice mini-modal ---
let shopChoiceOverlay = null;

function closeShopChoiceOverlay() {
  if (shopChoiceOverlay) {
    document.body.removeChild(shopChoiceOverlay);
    shopChoiceOverlay = null;
  }
}

function openShopWithChoice() {
  if (shopChoiceOverlay) {
    closeShopChoiceOverlay();
  }

  if (gameStarted) {
    paused = true;
    pausedText.style.display = 'block';
  }

  shopChoiceOverlay = document.createElement('div');
  shopChoiceOverlay.style.position = 'fixed';
  shopChoiceOverlay.style.inset = '0';
  shopChoiceOverlay.style.display = 'flex';
  shopChoiceOverlay.style.alignItems = 'center';
  shopChoiceOverlay.style.justifyContent = 'center';
  shopChoiceOverlay.style.background = 'rgba(0,0,0,0.6)';
  shopChoiceOverlay.style.zIndex = '1000';

  const panel = document.createElement('div');
  panel.style.background = '#151b27';
  panel.style.borderRadius = '0.75rem';
  panel.style.border = '1px solid rgba(255,255,255,0.12)';
  panel.style.padding = '1rem 1.4rem 1.1rem';
  panel.style.minWidth = '220px';
  panel.style.maxWidth = '90vw';
  panel.style.fontFamily =
    "system-ui,-apple-system,BlinkMacSystemFont,Inter,'Segoe UI',sans-serif";

  const title = document.createElement('div');
  title.textContent = 'Choose shop mode';
  title.style.fontWeight = '700';
  title.style.marginBottom = '.4rem';
  panel.appendChild(title);

  const label = document.createElement('div');
  label.textContent = 'What would you like to do?';
  label.style.fontSize = '.85rem';
  label.style.opacity = '0.85';
  label.style.marginBottom = '.8rem';
  panel.appendChild(label);

  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.justifyContent = 'space-between';
  btnRow.style.gap = '.5rem';

  function makeModeButton(text, mode) {
    const b = document.createElement('button');
    b.textContent = text;
    b.style.flex = '1';
    b.style.padding = '.45rem .7rem';
    b.style.fontSize = '.85rem';
    b.style.borderRadius = '.45rem';
    b.style.border = '1px solid rgba(255,255,255,0.18)';
    b.style.background = mode === 'buy' ? '#1e3a5f' : '#3b290d';
    b.style.color = '#f5f5f5';
    b.style.cursor = 'pointer';
    b.onclick = () => {
      if (overlay.setShopMode) overlay.setShopMode(mode);
      closeShopChoiceOverlay();
      openOverlay('Shop');
    };
    return b;
  }

  const buyBtn = makeModeButton('Buy', 'buy');
  const sellBtn = makeModeButton('Sell', 'sell');
  btnRow.appendChild(buyBtn);
  btnRow.appendChild(sellBtn);
  panel.appendChild(btnRow);

  const cancelRow = document.createElement('div');
  cancelRow.style.display = 'flex';
  cancelRow.style.justifyContent = 'flex-end';
  cancelRow.style.marginTop = '.6rem';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.fontSize = '.8rem';
  cancelBtn.style.padding = '.25rem .7rem';
  cancelBtn.style.borderRadius = '.4rem';
  cancelBtn.style.border = '1px solid rgba(255,255,255,0.15)';
  cancelBtn.style.background = 'transparent';
  cancelBtn.style.color = '#e0e0e0';
  cancelBtn.style.cursor = 'pointer';
  cancelBtn.onclick = () => closeShopChoiceOverlay();
	
	if (gameStarted) {
      paused = false;
      pausedText.style.display = 'none';
    }
	
  cancelRow.appendChild(cancelBtn);

  panel.appendChild(cancelRow);

  shopChoiceOverlay.appendChild(panel);
  shopChoiceOverlay.addEventListener('click', (e) => {
   if (e.target === shopChoiceOverlay) {
      closeShopChoiceOverlay();
      if (gameStarted) {
        paused = false;
        pausedText.style.display = 'none';
      }
    }
  });

  document.body.appendChild(shopChoiceOverlay);
}

// ========= OBSTACLES =========
const obstacles = [];
function addRandomObstacles(round) {
  const count = 2 + Math.floor(round / 2);
  for (let i = 0; i < count; i++) {
    const w = 120 + Math.random() * 80 + round * 4;
    const h = 80 + Math.random() * 80 + round * 4;
    const x = Math.random() * (world.width - w);
    const y = Math.random() * (world.height - h);
    obstacles.push({ x, y, w, h });
  }
}

function circleRectCollision(cx, cy, r, rect) {
  const rx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ry = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - rx;
  const dy = cy - ry;
  return dx * dx + dy * dy <= r * r;
}

// ========= GAME ARRAYS =========
const monsters = [];
const playerProjectiles = [];
const monsterProjectiles = [];
const iceWaves = [];
const bashWaves = [];
const magnumWaves = [];
const meleeArcs = [];
const meteorStrikes = [];
const damageTexts = [];
const coins = [];

let round = 1;
let killsThisRound = 0;
let spawnTimer = 0;
let bossMode = false;
let bossEntity = null;
let regenTimer = 360;

addRandomObstacles(1);

// ========= ROUND & SCALING =========
function killsForRound(r) {
  if (r <= 10) return 6 + r * 4;
  return 6 + 10 * 4 + (r - 10) * 8;
}
function maxMonstersForRound(r) {
  let base = 4 + r * 2;
  if (r > 10) base += (r - 10) * 3;
  return Math.min(40, base);
}
function spawnIntervalForRound(r) {
  let base = 70 - r * 5;
  if (r > 10) base -= (r - 10) * 3;
  if (base < 10) base = 10;
  return base;
}

// ========= MESSAGES / HUD =========
let msgTimer = 0;

function showMsg(text, ms = 2000) {
  msgDiv.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'banner';
  box.textContent = text;
  msgDiv.appendChild(box);
  msgTimer = ms / 16;
}


function updateHUD() {
  const need = killsForRound(round);
  const bossTxt = bossMode ? ' BOSS ROUND' : '';
  uiDiv.textContent =
    `LV ${player.level}  EXP ${player.exp}/${player.expToLevel}${bossTxt}\n` +
    `HP ${Math.round(player.hp)}/${Math.round(player.getMaxHp())}\n` +
    `StatPts: ${player.statPoints}   SkillPts: ${player.skillPoints}\n` +
    `Gold: ${player.gold || 0}\n` +
    `Round: ${round}   Kills: ${killsThisRound}/${need}`;
}

// ========= PAUSE / LEVEL-UP =========
function togglePause() {
  if (!gameStarted || gameOver) return;
  paused = !paused;
  pausedText.style.display = paused ? 'block' : 'none';
  if (!paused && !overlayOpen) {
    requestAnimationFrame(loop);
  }
}

function handleLevelUp() {
  player.statPoints += 5;
  player.skillPoints += 1;

  const L = player.level;
  function unlock(key) {
    if (!player.unlocks[key]) player.unlocks[key] = true;
  }

  if (L >= 2) unlock('Fireball');
  if (L >= 3) unlock('Bash');
  if (L >= 4) {
    unlock('Arrow');
    unlock('Toughness');
    unlock('Haste');
    unlock('Precision');
    unlock('HPRegen');
  }
  if (L >= 5) unlock('Magnum');
  if (L >= 6) unlock('Ice');
  if (L >= 8) unlock('Meteor');

  openOverlay('Stats');
}

function onMonsterKilled(mon) {
  killsThisRound++;

  if (!mon.isBoss) {
    const lvl = mon.level || 1;
    const gold = Math.floor(1 + lvl * 0.5 + Math.pow(round, 1.2) / 4);
    if (Math.random() < Math.min(0.7, 0.25 + round * 0.02)) {
      coins.push({ x: mon.x, y: mon.y, amount: gold });
    }
  }

  const need = killsForRound(round);
  if (!bossMode && killsThisRound >= need) {
    if (round % 3 === 0) {
      bossMode = true;
      bossEntity = spawnBoss(canvas, round);
      monsters.length = 0;
      showMsg(`BOSS: ${bossEntity.name}`, 2500);
    } else {
      round++;
      killsThisRound = 0;
      addRandomObstacles(round);
      showMsg(`Round ${round} begins!`, 2000);
    }
  }
}

function spawnDamageText(x, y, amount, crit = false) {
  damageTexts.push(new DamageText(x, y, amount, crit));
}

function hitTarget(mon, rawDmg, elem) {
  let dmg = rawDmg;
  const critChance = player.getCritChance();
  const critMult = player.getCritDamage();
  let crit = false;

  if (Math.random() < critChance) {
    dmg *= critMult;
    crit = true;
  }

  const dealt = applyDamageToMonster(mon, dmg, elem);
  spawnDamageText(mon.x, mon.y - mon.r - 10, dealt, crit);

  if (mon.hp <= 0) {
    if (mon.isBoss) {
      bossMode = false;
      bossEntity = null;
      round++;
      killsThisRound = 0;
      addRandomObstacles(round);
      showMsg(`Boss defeated! Round ${round} begins.`, 2500);
    } else {
      const idx = monsters.indexOf(mon);
      if (idx >= 0) monsters.splice(idx, 1);
      onMonsterKilled(mon);
    }
    player.gainExp(mon.expValue || 5, (leveled) => {
      if (leveled) handleLevelUp();
    });
  }
}

// ========= MAIN LOOP =========
function loop() {
  if (!gameStarted) return; // safety: should not run before setup
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameOver) {
    updateHUD();
    return;
  }

  centerCamera(player);

  // ----- WORLD & GRID -----
  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  ctx.fillStyle = '#151b22';
  ctx.fillRect(cam.x, cam.y, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  const gx0 = Math.floor(cam.x / 40) * 40;
  const gy0 = Math.floor(cam.y / 40) * 40;
  for (let x = gx0; x < cam.x + canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, cam.y);
    ctx.lineTo(x, cam.y + canvas.height);
    ctx.stroke();
  }
  for (let y = gy0; y < cam.y + canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(cam.x, y);
    ctx.lineTo(cam.x + canvas.width, y);
    ctx.stroke();
  }

  // ----- OBSTACLES -----
  ctx.fillStyle = '#222c38';
  obstacles.forEach((o) => {
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });

  // ----- MOVEMENT -----
  if (!paused) {
    let dX = 0;
    let dY = 0;
    if (keys['w'] || keys['ArrowUp']) dY -= 1;
    if (keys['s'] || keys['ArrowDown']) dY += 1;
    if (keys['a'] || keys['ArrowLeft']) dX -= 1;
    if (keys['d'] || keys['ArrowRight']) dX += 1;

    const joyX = joystick && joystick.active ? joystick.dirX : 0;
    const joyY = joystick && joystick.active ? joystick.dirY : 0;
    dX += joyX;
    dY += joyY;

    if (dX !== 0 || dY !== 0) {
      const len = Math.hypot(dX, dY) || 1;
      facingX = dX / len;
      facingY = dY / len;
      player.dx = facingX;
      player.dy = facingY;
    }
  }

    // ----- PLAYER MOVEMENT (with obstacle collision) -----
  const prevPx = player.x;
  const prevPy = player.y;
  const analogInput =
    joystick && joystick.active ? { x: joystick.dirX, y: joystick.dirY } : null;
  player.move(keys, paused, canvas, analogInput);

  // collide player with obstacles: if new position intersects, revert
  obstacles.forEach((o) => {
    if (circleRectCollision(player.x, player.y, player.r, o)) {
      player.x = prevPx;
      player.y = prevPy;
    }
  });

  // clamp to world
  if (player.x < player.r) player.x = player.r;
  if (player.y < player.r) player.y = player.r;
  if (player.x > world.width - player.r) player.x = world.width - player.r;
  if (player.y > world.height - player.r) player.y = world.height - player.r;


  // ----- HP REGEN -----
  if (!paused) {
    const regenLevel = getEffectiveSkillLevel('HPRegen');
    if (regenLevel > 0 && regenTimer-- <= 0) {
      const heal = 2 + regenLevel * 3;
      player.hp = Math.min(player.getMaxHp(), player.hp + heal);
      regenTimer = 360;
    }
  }

  // ----- COIN PICKUP (Luck increases pick-up radius) -----
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    const d = Math.hypot(c.x - player.x, c.y - player.y);

    const basePickup = player.r + 10;          // original radius
    const luck = (player.stats && player.stats.luck) || 0;
    const extraPickup = luck * 2.5;            // +2.5px per Luck
    let pickupRadius = basePickup + extraPickup;

    // hard cap so it doesn't vacuum the whole map
    if (pickupRadius > 160) pickupRadius = 160;

    if (d < pickupRadius) {
      player.gold = (player.gold || 0) + c.amount;
      coins.splice(i, 1);
    }
  }


  // ----- SKILL COOLDOWNS (tick every frame) -----
  if (!paused) {
    Object.keys(player.skillCooldowns).forEach((k) => {
      if (player.skillCooldowns[k] > 0) player.skillCooldowns[k]--;
    });
  }

  // ----- ATTACKS & SKILLS -----
  if (!paused) {
    player.tryAttack({
      basicMelee: () => {}, // default attack removed
      castSkills: () => {
        const nearest = (x, y) =>
          bossMode && bossEntity ? bossEntity : nearestMonster(x, y, monsters);

        function useSkill(key, baseCdFrames, caster) {
          const lvl = getEffectiveSkillLevel(key);
          if (lvl <= 0) return;
          if (player.skillCooldowns[key] > 0) return;
          caster();
          const agiFactor = Math.floor(player.stats.agi * 1);
          let cd = baseCdFrames - agiFactor;
          if (cd < 10) cd = 10;
          player.skillCooldowns[key] = cd;
        }

        useSkill('Fireball', 90, () =>
          castFireball(player, playerProjectiles, nearest)
        );
        useSkill('Arrow', 40, () =>
          castArrow(player, playerProjectiles, nearest)
        );
        useSkill('Ice', 120, () => {
          const t = nearest(player.x, player.y);
          if (!t) return;
          const ang = Math.atan2(t.y - player.y, t.x - player.x);
          player.dx = Math.cos(ang);
          player.dy = Math.sin(ang);
          castIceWave(player, iceWaves);
        });
        useSkill('Bash', 70, () => {
          const t = nearest(player.x, player.y);
          if (!t) return;
          const ang = Math.atan2(t.y - player.y, t.x - player.x);
          player.dx = Math.cos(ang);
          player.dy = Math.sin(ang);
          castBash(player, bashWaves);
        });
        useSkill('Magnum', 180, () => castMagnum(player, magnumWaves));
		  
		  useSkill('Meteor', 240, () =>
        castMeteorStorm(player, meteorStrikes, nearest)
      );
		  
      }
    });
  }

  // ----- SPAWN MONSTERS -----
  if (!paused && !bossMode) {
    if (monsters.length < maxMonstersForRound(round)) {
      if (spawnTimer-- <= 0) {
        monsters.push(spawnMonsterForRound(canvas, round, cam));
        spawnTimer = spawnIntervalForRound(round);
      }
    }
  }

  const currentMonsters = bossMode && bossEntity ? [bossEntity] : monsters;

  // ----- PLAYER PROJECTILES (FIREBALL/ARROW) -----
  for (let i = playerProjectiles.length - 1; i >= 0; i--) {
    const p = playerProjectiles[i];
    p.update(paused);

    let hit = false;
    currentMonsters.forEach((m) => {
      if (hit) return;
      const d = Math.hypot(p.x - m.x, p.y - m.y);
      if (d < m.r + 5) {
        hitTarget(m, p.dmg, p.element);
        hit = true;
      }
    });

    let hitObs = false;
    obstacles.forEach((o) => {
      if (hitObs) return;
      if (circleRectCollision(p.x, p.y, 4, o)) hitObs = true;
    });

    if (hit || hitObs || p.life <= 0) {
      playerProjectiles.splice(i, 1);
    }
  }

  // ----- ICE / BASH / MAGNUM WAVES -----
  for (let i = iceWaves.length - 1; i >= 0; i--) {
    const w = iceWaves[i];
    w.update();
    currentMonsters.forEach((m) => {
      if (w.hits(m)) {
        hitTarget(m, w.dmg / 3, 'WATER');
      }
    });
    if (w.life <= 0) iceWaves.splice(i, 1);
  }

  for (let i = bashWaves.length - 1; i >= 0; i--) {
    const w = bashWaves[i];
    w.update();
    currentMonsters.forEach((m) => {
      if (w.hits(m)) {
        hitTarget(m, w.dmg / 2, 'NEUTRAL');
        m.slowTimer = Math.max(m.slowTimer || 0, 20);
      }
    });
    if (w.life <= 0) bashWaves.splice(i, 1);
  }

  for (let i = magnumWaves.length - 1; i >= 0; i--) {
    const w = magnumWaves[i];
    w.update();
    currentMonsters.forEach((m) => {
      if (w.hits(m)) {
        hitTarget(m, w.dmg, 'NEUTRAL');
      }
    });
    if (w.life <= 0) magnumWaves.splice(i, 1);
  }
	
	  for (let i = meteorStrikes.length - 1; i >= 0; i--) {
    const s = meteorStrikes[i];
    s.update();

    // Damage only after the meteor lands
    if (s.delay <= 0) {
      currentMonsters.forEach((m) => {
        if (s.hits(m)) {
          hitTarget(m, s.dmg, 'FIRE');
        }
      });
    }

    if (s.isDone()) {
      meteorStrikes.splice(i, 1);
    }
  }


  // ----- DEFAULT MELEE ARCS (unused but safe if array empty) -----
  for (let i = meleeArcs.length - 1; i >= 0; i--) {
    const arc = meleeArcs[i];
    arc.update();
    const current = bossMode && bossEntity ? [bossEntity] : monsters;
    current.forEach((m) => {
      if (!arc.hitSet) arc.hitSet = new Set();
      if (arc.hitSet.has(m)) return;
      if (arc.hits(m)) {
        arc.hitSet.add(m);
        hitTarget(m, arc.dmg, 'NEUTRAL');
      }
    });
    if (arc.life <= 0) meleeArcs.splice(i, 1);
  }

  // ----- MONSTER PROJECTILES -----
  for (let i = monsterProjectiles.length - 1; i >= 0; i--) {
    const p = monsterProjectiles[i];
    p.update(paused);
    const d = Math.hypot(p.x - player.x, p.y - player.y);
    if (d < player.r + 5) {
      player.hp -= p.dmg;
      monsterProjectiles.splice(i, 1);
      continue;
    }
    let hitObs = false;
    obstacles.forEach((o) => {
      if (hitObs) return;
      if (circleRectCollision(p.x, p.y, 4, o)) hitObs = true;
    });
    if (hitObs || p.life <= 0) {
      monsterProjectiles.splice(i, 1);
      continue;
    }
  }

    // ----- MONSTERS & BOSS -----
  currentMonsters.forEach((m) => {
    // ----- MOVEMENT -----
    const prevMx = m.x;
    const prevMy = m.y;

    m.moveTo(player, paused);

    // collide monsters with obstacles; if they intersect, revert movement
     obstacles.forEach((o) => {
    if (circleRectCollision(m.x, m.y, m.r, o)) {
      const cx = m.x;
      const cy = m.y;

      // penetration depth to each side of the inflated rectangle
      const leftPen   = cx - (o.x - m.r);
      const rightPen  = (o.x + o.w + m.r) - cx;
      const topPen    = cy - (o.y - m.r);
      const bottomPen = (o.y + o.h + m.r) - cy;

      const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);

      if (minPen === leftPen) {
        // push to the left of the obstacle
        m.x = o.x - m.r;
      } else if (minPen === rightPen) {
        // push to the right
        m.x = o.x + o.w + m.r;
      } else if (minPen === topPen) {
        // push above
        m.y = o.y - m.r;
      } else {
        // push below
        m.y = o.y + o.h + m.r;
      }
    }
  });

    // pushback from player to avoid overlapping
    const dx = player.x - m.x;
    const dy = player.y - m.y;
    const dist = Math.hypot(dx, dy);
    const minDist = m.r + player.r;
    if (dist < minDist && dist > 0) {
      const push = (minDist - dist) / 2;
      const nx = dx / dist;
      const ny = dy / dist;
      m.x -= nx * push;
      m.y -= ny * push;
      player.x += nx * push;
      player.y += ny * push;
    }

    // ----- ATTACKS -----
    if (!paused) {
      if (m.attackCooldown-- <= 0) {
        const d2 = Math.hypot(player.x - m.x, player.y - m.y);
        const contactDist = m.r + player.r + 4;
        const inRange = d2 <= Math.max(m.attackRange, contactDist);

        if (inRange) {
          if (m.attackType === 'melee') {
            // melee hit
            player.hp -= m.attackDamage;
          } else {
            // ranged projectile
            const vx = ((player.x - m.x) / d2) * 4;
            const vy = ((player.y - m.y) / d2) * 4;
            monsterProjectiles.push(
              new MonsterProjectile(
                m.x,
                m.y,
                vx,
                vy,
                m.attackDamage,
                160,
                m.color,
                m.element
              )
            );
          }
          m.attackCooldown = m.attackCooldownMax;
        }
      }
    }

    // ----- DRAW MONSTER -----
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fillStyle = m.color || '#fff';
    ctx.fill();

    // HP bar
    const w = 30;
    const h = 4;
    const frac = Math.max(0, Math.min(1, m.hp / m.maxHp));
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(m.x - w / 2, m.y - m.r - 10, w, h);
    ctx.fillStyle = '#69f0ae';
    ctx.fillRect(m.x - w / 2, m.y - m.r - 10, w * frac, h);
  });


  // ----- DRAW PROJECTILES & WAVES -----
  playerProjectiles.forEach((p) => {
    if (p.type === 'arrow') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle || 0);

      ctx.fillStyle = '#ffffff';
      // shaft
      ctx.fillRect(-10, -2, 20, 4);
      // head
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(4, -4);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = p.color || '#ff9800';
    ctx.fill();
  });

  iceWaves.forEach((w) => {
    const baseAngle = Math.atan2(w.dirY, w.dirX);
    ctx.beginPath();
    ctx.arc(
      w.x,
      w.y,
      w.radius,
      baseAngle - w.span,
      baseAngle + w.span
    );
    ctx.strokeStyle = 'rgba(128, 222, 234, 0.9)';
    ctx.lineWidth = w.thickness || 6;
    ctx.stroke();
  });

  bashWaves.forEach((w) => {
    const baseAngle = Math.atan2(w.dirY, w.dirX);
    ctx.beginPath();
    ctx.arc(
      w.x,
      w.y,
      w.radius,
      baseAngle - w.span,
      baseAngle + w.span
    );
    ctx.strokeStyle = 'rgba(255, 241, 118, 0.9)';
    ctx.lineWidth = w.thickness || 5;
    ctx.stroke();
  });

  meleeArcs.forEach((w) => {
    const baseAngle = Math.atan2(w.dy, w.dx);
    ctx.beginPath();
    ctx.arc(
      w.x,
      w.y,
      w.range,
      baseAngle - 0.5,
      baseAngle + 0.5
    );
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 4;
    ctx.stroke();
  });

  magnumWaves.forEach((w) => {
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 138, 101, 0.9)';
    ctx.lineWidth = w.thickness || 6;
    ctx.stroke();
  });
	
  meteorStrikes.forEach((s) => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    if (s.delay > 0) {
      // Telegraph: red circle on the ground
      ctx.strokeStyle = 'rgba(244, 67, 54, 0.85)';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      // Impact: bright fiery circle
      ctx.fillStyle = 'rgba(255, 160, 0, 0.8)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 249, 196, 0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });


  monsterProjectiles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = p.color || '#ff5252';
    ctx.fill();
  });

  // ----- COINS -----
  coins.forEach((c) => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffeb3b';
    ctx.fill();
  });

  // ----- PLAYER -----
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fillStyle = 'cyan';
  ctx.fill();

  const hpFrac = Math.max(0, Math.min(1, player.hp / player.getMaxHp()));

  // HP bar background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(player.x - 20, player.y - 28, 40, 6);

  // HP bar color: green >50%, orange >25–50%, red ≤25%
  let hpColor = '#22c55e'; // green
  if (hpFrac <= 0.25) {
    hpColor = '#ef4444';   // red
  } else if (hpFrac <= 0.5) {
    hpColor = '#f97316';   // orange
  }

  ctx.fillStyle = hpColor;
  ctx.fillRect(player.x - 20, player.y - 28, 40 * hpFrac, 6);


  // ----- DAMAGE TEXTS -----
  for (let i = damageTexts.length - 1; i >= 0; i--) {
    const t = damageTexts[i];
    t.update();
    t.draw(ctx);
    if (t.life <= 0) damageTexts.splice(i, 1);
  }

  // ----- BOSS HP BAR -----
  if (bossMode && bossEntity) {
    const w = Math.min(canvas.width - 80, 500);
    const x = cam.x + (canvas.width - w) / 2;
    const y = cam.y + 20;
    const frac = Math.max(0, Math.min(1, bossEntity.hp / bossEntity.maxHp));
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x, y, w, 10);
    ctx.fillStyle = '#ff5252';
    ctx.fillRect(x, y, w * frac, 10);
    ctx.font = 'bold 14px system-ui';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(bossEntity.name, cam.x + canvas.width / 2, y - 4);
    ctx.textAlign = 'left';
  }

  ctx.restore();

  // ----- MESSAGE TIMER -----
  if (msgTimer > 0) {
    msgTimer--;
    if (msgTimer <= 0) {
      msgDiv.innerHTML = '';
    }
  }
	
	 // ----- RESUME COUNTDOWN -----
  if (resumeCountdown > 0) {
    resumeCountdown--;
    const secondsLeft = Math.ceil(resumeCountdown / 60);
    msgDiv.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'banner';
    box.textContent = `Resuming in ${secondsLeft}...`;
    msgDiv.appendChild(box);
    if (resumeCountdown <= 0) {
      paused = false;
      pausedText.style.display = 'none';
      msgDiv.innerHTML = '';
    }
  }

  // ----- GAME OVER -----
  if (player.hp <= 0 && !gameOver) {
    gameOver = true;
    paused = true;
    showMsg('YOU DIED — refresh the page to restart', 4000);
  }

  updateHUD();

  if (!gameOver && (!overlayOpen || resumeCountdown > 0)) requestAnimationFrame(loop);
}

// NOTE: we do NOT start the loop here.
// It only starts after the pre-game setup is valid.
