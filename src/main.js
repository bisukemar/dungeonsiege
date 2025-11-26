import { WORLD } from './constants.js';
import {
  Player,
  MonsterProjectile,
  PlayerProjectile,
  DamageText,
  applyDamageToMonster,
  BasicArc,
  Boss
} from './entities.js';
import {
  castFireball,
  castArrow,
  castArrowShower,
  castIceWave,
  castBash,
  castMagnum,
	castMeteorStorm,
  MeteorStrike,
  castQuagmire
} from './skills.js';
import {
  spawnMonsterForRound,
  spawnBoss,
  nearestMonster
} from './spawn.js';
import { makeOverlay } from './ui.js';
import { SKILL_DB } from './databases/skillDB.js';
import { ITEMS_DB } from './databases/itemDB.js';

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
const titleRankingBtn = document.getElementById('titleRankingBtn');
const titleOptionsBtn = document.getElementById('titleOptionsBtn');
const optionsModal = document.getElementById('optionsModal');
const optionsCloseBtn = document.getElementById('optionsCloseBtn');
const adminToggle = document.getElementById('adminToggle');
const genderMaleRadio = document.getElementById('genderMale');
const genderFemaleRadio = document.getElementById('genderFemale');
const installBtn = document.getElementById('installBtn');
const genderPreview = document.getElementById('genderPreview');
const genderPreviewCtx = genderPreview ? genderPreview.getContext('2d') : null;
const joystick = createMobileJoystick(canvas);
const rankingModal = document.getElementById('rankingModal');
const rankingCloseBtn = document.getElementById('rankingCloseBtn');
const rankingList = document.getElementById('rankingList');
const nameModal = document.getElementById('nameModal');
const nameInput = document.getElementById('nameInput');
const nameSaveBtn = document.getElementById('nameSaveBtn');
const nameCloseBtn = document.getElementById('nameCloseBtn');

// ========= PLAYER SPRITE / ANIMATION =========
const PLAYER_SHEET_ROWS = 10;
const PLAYER_SPRITE_ROWS = {
  idle: [0, 1, 2],
  move: [3, 4, 5],
  attack: [6, 7, 8],
  death: [9]
};
const PLAYER_SPRITE_SCALE = 0.35;
const GENDER_STORAGE_KEY = 'dungeonsiege_gender';
let playerGender = 'male';
const arrowSprite = { img: new Image(), ready: false };
const chestSprite = { img: new Image(), ready: false, frameH: 0, frameW: 0 };
const monsterSpriteCache = new Map();
const ITEM_MAP = Object.fromEntries((ITEMS_DB || []).map((it) => [it.id, it]));
const previewSprite = {
  img: new Image(),
  ready: false,
  frameW: 0,
  frameH: 0,
  cols: 1,
  frame: 0,
  frameTimer: 0
};

const playerSprite = {
  img: new Image(),
  ready: false,
  frameW: 0,
  frameH: 0,
  cols: 1,
  state: 'idle',
  dir: 'down',
  frame: 0,
  frameTimer: 0,
  attackTimer: 0
};

playerSprite.img.onload = () => {
  playerSprite.frameH = playerSprite.img.height / PLAYER_SHEET_ROWS;
  const assumedSquare = playerSprite.frameH || 1;
  playerSprite.cols = Math.max(1, Math.floor(playerSprite.img.width / assumedSquare));
  playerSprite.frameW = playerSprite.img.width / playerSprite.cols;
  playerSprite.ready = true;
};

function spritePathForGender(g) {
  return g === 'female' ? 'assets/player_f.png' : 'assets/player.png';
}

function getMonsterSprite(def){
  if (!def || !def.src) return null;
  if (monsterSpriteCache.has(def.src)) return monsterSpriteCache.get(def.src);
  const img = new Image();
  const record = {
    img,
    ready:false,
    rows:def.rows || 1,
    cols:def.cols || 1,
    rowMap:def.rowMap || {},
    frameCounts:def.frameCounts || {}
  };
  img.onload = () => {
    record.rows = def.rows || 1;
    record.frameH = Math.round(img.height / record.rows);
    record.cols = def.cols || 1;
    record.frameW = Math.round(img.width / record.cols);
    record.ready = true;
  };
  img.src = def.src;
  monsterSpriteCache.set(def.src, record);
  return record;
}

function updateMonsterAnimState(mon, moved, paused=false){
  if (!mon) return;
  if (!mon.anim) mon.anim = { frame:0, timer:0, state:'idle', facing:1 };

  if (!paused && mon.attackAnimTimer > 0) {
    mon.attackAnimTimer--;
  }

  const prevState = mon.anim.state;
  if (mon.hp <= 0) {
    mon.anim.state = 'death';
  } else if (mon.attackAnimTimer > 0) {
    mon.anim.state = mon.anim.facing >= 0 ? 'attackR' : 'attackL';
  } else if (moved) {
    mon.anim.state = 'move';
  } else {
    mon.anim.state = 'idle';
  }
  if (mon.anim.state !== prevState) {
    mon.anim.frame = 0;
    mon.anim.timer = 0;
  }

  mon.anim.timer = (mon.anim.timer || 0) + 1;
  const sprite = getMonsterSprite(mon.spriteDef);
  if (!sprite || !sprite.ready) return;
  if (mon.anim.state === 'death') {
    mon.anim.frame = 0;
    mon.anim.timer = 0;
    return;
  }
  const speed = mon.anim.state === 'idle' ? 12 : 8;
  if (mon.anim.timer >= speed) {
    mon.anim.timer = 0;
    const rowIdx = sprite.rowMap?.[mon.anim.state] ?? 0;
    const frameCountForState = sprite.frameCounts?.[mon.anim.state] || sprite.cols || 1;
    const maxFrame = frameCountForState - 1;
    if (rowIdx === (sprite.rowMap?.death ?? -1)) {
      // death anim: stop at last frame
      mon.anim.frame = Math.min(maxFrame, mon.anim.frame + 1);
    } else {
      mon.anim.frame = (mon.anim.frame + 1) % (maxFrame + 1);
    }
  }
}

function drawMonster(ctx, mon, moved, paused=false){
  const sprite = getMonsterSprite(mon.spriteDef);
  if (!sprite || !sprite.ready) {
    ctx.beginPath();
    ctx.arc(mon.x, mon.y, mon.r, 0, Math.PI * 2);
    ctx.fillStyle = mon.color || '#fff';
    ctx.fill();
    return;
  }
  updateMonsterAnimState(mon, moved, paused);
  const rowMap = sprite.rowMap || {};
  const state = mon.anim?.state || 'idle';
  const rowIdx = rowMap[state] ?? 0;
  const sx = Math.floor((mon.anim?.frame || 0) * (sprite.frameW || 0));
  const sy = Math.floor((rowIdx || 0) * (sprite.frameH || 0));
  const dw = sprite.frameW || 32;
  const dh = sprite.frameH || 32;
  const flip = (mon.anim?.facing || 1) < 0;
  ctx.save();
  ctx.translate(mon.x, mon.y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(sprite.img, sx, sy, sprite.frameW, sprite.frameH, -dw/2, -dh/2, dw, dh);
  ctx.restore();
}

arrowSprite.img.onload = () => {
  arrowSprite.ready = true;
};
arrowSprite.img.src = 'assets/arrow01.png';

chestSprite.img.onload = () => {
  chestSprite.frameH = chestSprite.img.height / 2;
  chestSprite.frameW = chestSprite.img.width;
  chestSprite.ready = true;
};
chestSprite.img.src = 'assets/chest.png';

previewSprite.img.onload = () => {
  previewSprite.frameH = previewSprite.img.height / PLAYER_SHEET_ROWS;
  const assumedSquare = previewSprite.frameH || 1;
  previewSprite.cols = Math.max(1, Math.floor(previewSprite.img.width / assumedSquare));
  previewSprite.frameW = previewSprite.img.width / previewSprite.cols;
  previewSprite.ready = true;
};

function loadGenderFromStorage() {
  try {
    const stored = localStorage.getItem(GENDER_STORAGE_KEY);
    if (stored === 'female' || stored === 'male') return stored;
  } catch (e) { /* ignore */ }
  return 'male';
}

function applyGender(g) {
  playerGender = g === 'female' ? 'female' : 'male';
  try {
    localStorage.setItem(GENDER_STORAGE_KEY, playerGender);
  } catch (e) { /* ignore */ }
  playerSprite.ready = false;
  playerSprite.img.src = spritePathForGender(playerGender);
  previewSprite.ready = false;
  previewSprite.img.src = spritePathForGender(playerGender);
  if (genderMaleRadio) genderMaleRadio.checked = playerGender === 'male';
  if (genderFemaleRadio) genderFemaleRadio.checked = playerGender === 'female';
}

applyGender(loadGenderFromStorage());

// ========= GROUND TILE =========
const ground = {
  img: new Image(),
  ready: false,
  pattern: null,
  size: 16
};

ground.img.onload = () => {
  ground.ready = true;
  ground.size = ground.img.width || 16;
  ground.pattern = ctx.createPattern(ground.img, 'repeat');
};
ground.img.src = 'assets/grass.png';

function facingDirFromVector(dx, dy) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax < 0.05 && ay < 0.05) return null;
  if (ax > ay) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'down' : 'up';
}

function resolveRowForState(state, dir) {
  const rows = PLAYER_SPRITE_ROWS[state] || PLAYER_SPRITE_ROWS.idle;
  const dirIndex = dir === 'up' ? 2 : dir === 'down' ? 0 : 1;
  const row = rows[Math.min(dirIndex, rows.length - 1)] ?? rows[0];
  const flipX = dir === 'right';
  return { row, flipX };
}

function lockAttackAnimation() {
  playerSprite.attackTimer = Math.max(playerSprite.attackTimer, 18);
  if (playerSprite.state !== 'attack') {
    playerSprite.frame = 0;
    playerSprite.frameTimer = 0;
  }
}

function stepPlayerAnimation(moving, paused, isDead) {
  if (!paused && playerSprite.attackTimer > 0) {
    playerSprite.attackTimer--;
  }

  const dir = facingDirFromVector(player.dx, player.dy);
  if (dir) playerSprite.dir = dir;

  const nextState = isDead
    ? 'death'
    : playerSprite.attackTimer > 0
    ? 'attack'
    : moving
    ? 'move'
    : 'idle';

  if (nextState !== playerSprite.state) {
    playerSprite.state = nextState;
    playerSprite.frame = 0;
    playerSprite.frameTimer = 0;
  }

  if (!playerSprite.ready || paused) return;

  const speedMap = { idle: 16, move: 8, attack: 6, death: 14 };
  const step = speedMap[playerSprite.state] || 10;

  playerSprite.frameTimer++;
  if (playerSprite.frameTimer < step) return;
  playerSprite.frameTimer = 0;

  if (playerSprite.state === 'death') {
    const last = Math.max(0, playerSprite.cols - 1);
    if (playerSprite.frame < last) playerSprite.frame++;
    return;
  }

  playerSprite.frame = (playerSprite.frame + 1) % playerSprite.cols;
}

function drawGround() {
  if (ground.pattern) {
    const tile = ground.size || 16;
    const startX = Math.floor(cam.x / tile) * tile;
    const startY = Math.floor(cam.y / tile) * tile;
    const w = canvas.width + tile;
    const h = canvas.height + tile;
    ctx.save();
    ctx.beginPath();
    ctx.rect(cam.x, cam.y, canvas.width, canvas.height);
    ctx.clip();
    ctx.fillStyle = ground.pattern;
    ctx.fillRect(startX, startY, w, h);
    ctx.restore();
  } else {
    ctx.fillStyle = '#151b22';
    ctx.fillRect(cam.x, cam.y, canvas.width, canvas.height);
  }
}

function drawPlayer(ctx, player) {
  if (!playerSprite.ready || !playerSprite.frameW || !playerSprite.frameH) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fillStyle = 'cyan';
    ctx.fill();
    return { visualHeight: player.r * 2 };
  }

  const { row, flipX } = resolveRowForState(playerSprite.state, playerSprite.dir);
  const sx = playerSprite.frame * playerSprite.frameW;
  const sy = row * playerSprite.frameH;
  const dw = playerSprite.frameW * PLAYER_SPRITE_SCALE;
  const dh = playerSprite.frameH * PLAYER_SPRITE_SCALE;

  ctx.save();
  ctx.translate(player.x, player.y);
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(
    playerSprite.img,
    sx,
    sy,
    playerSprite.frameW,
    playerSprite.frameH,
    -dw / 2,
    -dh / 2,
    dw,
    dh
  );
  ctx.restore();

  return { visualHeight: dh };
}

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
let pendingLeaderboardLevel = null;
let previewAnimStarted = false;
let deferredInstallPrompt = null;
let installReady = false;
let installSupported = false;
let activeChest = null;

const RARITY_COLOR = {
  Common: '#1f2937',
  Uncommon: '#0f766e',
  Rare: '#2563eb',
  Legendary: '#b45309',
  Unique: '#9d174d'
};
const CHEST_REROLL_COST = 500;
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

function getItemById(id) {
  return ITEM_MAP[id] || null;
}

function summarizeItem(item){
  if (!item || !item.bonuses) return item?.desc || '';
  const b = item.bonuses;
  const parts = [];
  if (b.maxHp) parts.push(`+${b.maxHp} HP`);
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
  return item.desc || parts.join(', ');
}

function rarityTag(item) {
  const r = item?.rarity || 'Common';
  const color = RARITY_COLOR[r] || '#1f2937';
  const span = document.createElement('span');
  span.textContent = r;
  span.style.fontSize = '.7rem';
  span.style.fontWeight = '700';
  span.style.color = color;
  return span;
}

// ========= LEADERBOARD =========
const LEADERBOARD_KEY = 'dungeonsiege_leaderboard_v1';

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveLeaderboard(list) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore storage errors (e.g., private mode)
  }
}

function addLeaderboardEntry(name, level) {
  const list = loadLeaderboard();
  list.push({ name, level, ts: Date.now() });
  list.sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return (a.ts || 0) - (b.ts || 0);
  });
  saveLeaderboard(list.slice(0, 50));
}

function renderLeaderboard() {
  if (!rankingList) return;
  const list = loadLeaderboard();
  rankingList.innerHTML = '';
  if (!list.length) {
    rankingList.textContent = 'No runs recorded yet. Play a game to add your first entry!';
    return;
  }
  const ol = document.createElement('ol');
  ol.style.paddingLeft = '1.2rem';
  list.slice(0, 10).forEach((entry) => {
    const li = document.createElement('li');
    const date = entry.ts ? new Date(entry.ts).toLocaleDateString() : '';
    li.textContent = `${entry.name} — Lv ${entry.level}${date ? ` (${date})` : ''}`;
    ol.appendChild(li);
  });
  rankingList.appendChild(ol);
}

function openRankingModal() {
  if (!rankingModal) return;
  renderLeaderboard();
  rankingModal.style.display = 'grid';
}

function closeRankingModal() {
  if (rankingModal) rankingModal.style.display = 'none';
}

function openNameModal(level) {
  pendingLeaderboardLevel = level;
  if (!nameModal || !nameInput || !nameSaveBtn) {
    // Fallback to prompt if modal is missing
    const fallbackName = prompt('Enter your name for the leaderboard:', 'Hero') || 'Unknown Adventurer';
    const clean = (fallbackName || '').trim() || 'Unknown Adventurer';
    addLeaderboardEntry(clean, level);
    renderLeaderboard();
    showMsg(`YOU DIED — ${clean}'s run saved at Lv ${level}. Refresh to restart`, 5000);
    return;
  }
  nameInput.value = 'Hero';
  nameModal.style.display = 'grid';
  setTimeout(() => nameInput && nameInput.focus(), 10);
}

function closeNameModal() {
  if (nameModal) nameModal.style.display = 'none';
}

function submitNameModal(useInput=true) {
  const level = pendingLeaderboardLevel || player.level || 1;
  let name = 'Unknown Adventurer';
  if (useInput && nameInput) {
    name = (nameInput.value || '').trim() || 'Hero';
  }
  addLeaderboardEntry(name, level);
  renderLeaderboard();
  closeNameModal();
  pendingLeaderboardLevel = null;
  showMsg(`YOU DIED — ${name}'s run saved at Lv ${level}. Refresh to restart`, 5000);
}

function startGameLoop() {
  if (gameLoopStarted) return;
  gameLoopStarted = true;
  requestAnimationFrame(loop);
}

// Service worker registration for PWA installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('SW registration failed', err);
    });
  });
}

function stepGenderPreview() {
  if (!genderPreviewCtx || !genderPreview) return;
  requestAnimationFrame(stepGenderPreview);

  // clear
  genderPreviewCtx.clearRect(0, 0, genderPreview.width, genderPreview.height);

  if (!previewSprite.ready) return;

  previewSprite.frameTimer++;
  if (previewSprite.frameTimer >= 10) {
    previewSprite.frameTimer = 0;
    previewSprite.frame = (previewSprite.frame + 1) % previewSprite.cols;
  }

  const idleRow = (PLAYER_SPRITE_ROWS.idle && PLAYER_SPRITE_ROWS.idle[0]) || 0;
  const sx = previewSprite.frame * previewSprite.frameW;
  const sy = idleRow * previewSprite.frameH;
  const dw = previewSprite.frameW * PLAYER_SPRITE_SCALE;
  const dh = previewSprite.frameH * PLAYER_SPRITE_SCALE;
  const scale = Math.min(
    (genderPreview.width - 4) / dw,
    (genderPreview.height - 4) / dh
  );

  const drawW = dw * scale;
  const drawH = dh * scale;

  genderPreviewCtx.drawImage(
    previewSprite.img,
    sx,
    sy,
    previewSprite.frameW,
    previewSprite.frameH,
    (genderPreview.width - drawW) / 2,
    (genderPreview.height - drawH) / 2,
    drawW,
    drawH
  );
}

// ========= TITLE SCREEN / OPTIONS =========

titleOptionsBtn.onclick = () => {
  if (!optionsModal) return;
  optionsModal.style.display = 'grid';
};

if (titleRankingBtn) {
  titleRankingBtn.onclick = () => {
    if (optionsModal) optionsModal.style.display = 'none';
    openRankingModal();
  };
}

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

if (genderMaleRadio) {
  genderMaleRadio.onclick = () => applyGender('male');
}
if (genderFemaleRadio) {
  genderFemaleRadio.onclick = () => applyGender('female');
}
if (!previewAnimStarted && genderPreviewCtx) {
  previewAnimStarted = true;
  requestAnimationFrame(stepGenderPreview);
}

if (rankingCloseBtn) {
  rankingCloseBtn.onclick = () => closeRankingModal();
}

if (rankingModal) {
  rankingModal.addEventListener('click', (e) => {
    if (e.target === rankingModal) closeRankingModal();
  });
}

if (nameSaveBtn) {
  nameSaveBtn.onclick = () => submitNameModal(true);
}

if (nameCloseBtn) {
  nameCloseBtn.onclick = () => submitNameModal(false);
}

if (nameModal) {
  nameModal.addEventListener('click', (e) => {
    if (e.target === nameModal) submitNameModal(false);
  });
}

// PWA install prompt
function updateInstallBtn() {
  if (!installBtn) return;
  installBtn.style.display = 'block';
  const installed = isAppInstalled();
  if (installed) {
    installBtn.textContent = 'Installed';
    installBtn.disabled = true;
    installBtn.style.cursor = 'default';
    installBtn.style.opacity = '0.7';
    return;
  }
  if (!installSupported) {
    installBtn.textContent = 'How to Install App';
    installBtn.disabled = false;
    installBtn.style.opacity = '1';
    installBtn.style.cursor = 'pointer';
    return;
  }
  installBtn.disabled = !installReady;
  installBtn.textContent = installReady ? 'Install App' : 'Install (not available)';
  installBtn.style.opacity = installReady ? '1' : '0.6';
  installBtn.style.cursor = installReady ? 'pointer' : 'not-allowed';
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installReady = true;
  installSupported = true;
  updateInstallBtn();
});

function isAppInstalled() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;
}

if (installBtn) {
  updateInstallBtn();
  installBtn.onclick = async () => {
    if (isAppInstalled()) {
      updateInstallBtn();
      return;
    }
    if (!installSupported) {
      showMsg('iOS: Open in Safari → Share → "Add to Home Screen"', 2800);
      return;
    }
    if (!installReady || !deferredInstallPrompt) {
      showMsg('Install prompt not ready. Try again shortly.', 1800);
      return;
    }
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      installBtn.textContent = 'Installed';
      installBtn.disabled = true;
      installBtn.style.cursor = 'default';
    }
    deferredInstallPrompt = null;
    installReady = false;
    updateInstallBtn();
  };
}

// Called when "Start Game" is clicked on title screen
titleStartBtn.onclick = () => {
  if (optionsModal) optionsModal.style.display = 'none';
  closeRankingModal();
  // Hide title screen
  if (titleScreen) titleScreen.style.display = 'none';

  // Prep for pre-game setup
  preGameSetup = true;
  gameStarted = false;

  // Initial stat and skill points for setup
  if (adminModeEnabled) {
    player.adminMode = true;
    player.statPoints = 999;
    player.skillPoints = 999;
    player.gold = 999999;
  } else {
    player.adminMode = false;
    player.statPoints = 9;
    player.skillPoints = 1;
    player.gold = INITIAL_GOLD;
  }

  // Re-apply gender selection on start
  applyGender(loadGenderFromStorage());

  // Reset stats to base values (no admin stat boost)
  player.stats = { str:3, agi:3, int:3, dex:3, vit:3, luck:3 };

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

  if (e.key === 'Enter' && nameModal && nameModal.style.display === 'grid') {
    submitNameModal(true);
  }
});

// ========= OVERLAY / PANELS =========

function handleOverlayClosed() {
  overlayOpen = false;

  // If we are finishing the pre-game setup, enforce conditions
  if (preGameSetup && !gameStarted) {
    const activeSkills = ['Fireball', 'Bash', 'Arrow', 'Ice', 'Magnum'];
    const hasActiveSkill = activeSkills.some(
      (k) => getEffectiveSkillLevel(k) > 0
    );

    if (!hasActiveSkill) {
      alert('Before starting, choose at least one active skill (e.g., Fireball or Bash).');
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
    obstacles.length = 0;

    paused = false;
    pausedText.style.display = 'none';
    resumeCountdown = 0;
    msgTimer = 0;
    msgDiv.innerHTML = '';

    startGameLoop();
    return;
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



let overlay = null;
function getOverlay() {
  if (!overlay) {
    const useMobileOverlay = window.innerWidth < 960;
    overlay = makeOverlay(document, player, handleOverlayClosed, { forceMobile: useMobileOverlay });
  }
  return overlay;
}

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
  getOverlay().open(tab);
}


function closeOverlay() {
  if (overlay) overlay.close();
}

// Admin debug: uses same stats/skills UI but with separate point pool
function openAdminPanel() {
  if (!adminModeEnabled) return;
  if (player.adminMode) return;

  player.adminMode = true;

  // Admin defaults: massive points and max gold, no prompts
  player.statPoints = 999;
  player.skillPoints = 999;
  player.gold = 999999;

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

// --- Boss Chest UI ---
let chestOverlay = null;

function closeChestOverlay() {
  if (chestOverlay) {
    document.body.removeChild(chestOverlay);
    chestOverlay = null;
  }
  activeChest = null;
  if (gameStarted) {
    paused = false;
    pausedText.style.display = 'none';
  }
}

function pickChestOptions(poolIds) {
  const pool = poolIds
    .map((id) => getItemById(id))
    .filter(Boolean);
  // fallback: rare+ items if pool empty
  let choicesSource = pool;
  if (!choicesSource.length) {
    choicesSource = (ITEMS_DB || []).filter((it) =>
      ['Rare','Legendary','Unique'].includes(it.rarity)
    );
  }
  if (!choicesSource.length) return [];

  const picks = [];
  const used = new Set();
  const maxPicks = Math.min(3, choicesSource.length);
  while (picks.length < maxPicks) {
    const idx = Math.floor(Math.random() * choicesSource.length);
    if (used.has(idx)) continue;
    used.add(idx);
    picks.push(choicesSource[idx]);
  }
  return picks;
}

function openChestOverlay(chest) {
  if (!chest) return;
  chest.opened = true;
  activeChest = chest;
  if (gameStarted) {
    paused = true;
    pausedText.style.display = 'block';
  }

  if (chestOverlay) closeChestOverlay();

  chestOverlay = document.createElement('div');
  chestOverlay.style.position = 'fixed';
  chestOverlay.style.inset = '0';
  chestOverlay.style.display = 'flex';
  chestOverlay.style.alignItems = 'center';
  chestOverlay.style.justifyContent = 'center';
  chestOverlay.style.background = 'rgba(14,39,86,0.32)';
  chestOverlay.style.backdropFilter = 'blur(3px)';
  chestOverlay.style.zIndex = '1400';

  const panel = document.createElement('div');
  panel.style.background = 'linear-gradient(180deg, #fefefe 0%, #e6f0ff 55%, #cfdef7 100%)';
  panel.style.borderRadius = '1rem';
  panel.style.border = '2px solid #7da8d9';
  panel.style.padding = '1rem 1.2rem';
  panel.style.width = 'min(720px, 94vw)';
  panel.style.boxShadow = '0 24px 64px rgba(22, 41, 84, 0.4)';
  panel.style.color = '#1b2d4b';
  panel.style.fontFamily = "Trebuchet MS, 'Segoe UI', system-ui, -apple-system, sans-serif";
  panel.onclick = (e) => e.stopPropagation();
  chestOverlay.appendChild(panel);

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.marginBottom = '.6rem';
  const title = document.createElement('div');
  title.textContent = 'Boss Chest';
  title.style.fontSize = '1.05rem';
  title.style.fontWeight = '700';
  header.appendChild(title);

  const reroll = document.createElement('button');
  reroll.textContent = `Re-roll (${CHEST_REROLL_COST} gold)`;
  reroll.style.borderRadius = '999px';
  reroll.style.border = '1px solid #d1a85c';
  reroll.style.background = 'linear-gradient(180deg, #fff9ea 0%, #f0dfad 100%)';
  reroll.style.color = '#5c4108';
  reroll.style.padding = '.35rem .75rem';
  reroll.style.cursor = 'pointer';
  reroll.onclick = () => {
    if ((player.gold || 0) < CHEST_REROLL_COST) {
      showMsg('Not enough gold to re-roll!', 1500);
      return;
    }
    player.gold -= CHEST_REROLL_COST;
    chest.options = pickChestOptions(chest.poolIds || []);
    openChestOverlay(chest);
  };
  header.appendChild(reroll);
  panel.appendChild(header);

  const subtitle = document.createElement('div');
  subtitle.textContent = 'Choose one reward';
  subtitle.style.fontSize = '.85rem';
  subtitle.style.opacity = '0.8';
  subtitle.style.marginBottom = '.6rem';
  panel.appendChild(subtitle);

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
  grid.style.gap = '.6rem';
  panel.appendChild(grid);

  const options = chest.options && chest.options.length ? chest.options : pickChestOptions(chest.poolIds || []);
  chest.options = options;

  options.forEach((item) => {
    const card = document.createElement('div');
    card.style.display = 'grid';
    card.style.gridTemplateRows = 'auto auto 1fr auto';
    card.style.gap = '.3rem';
    card.style.padding = '.65rem .7rem';
    card.style.background = 'rgba(255,255,255,0.95)';
    card.style.border = '1px solid #b8cff1';
    card.style.borderRadius = '.65rem';
    card.style.boxShadow = '0 8px 20px rgba(13,35,78,0.12)';

    const rarityRow = document.createElement('div');
    rarityRow.style.display = 'flex';
    rarityRow.style.justifyContent = 'space-between';
    rarityRow.style.alignItems = 'center';
    rarityRow.appendChild(rarityTag(item));
    const slotSpan = document.createElement('span');
    slotSpan.textContent = item.slot ? (SLOT_LABEL[item.slot] || item.slot) : 'Item';
    slotSpan.style.fontSize = '.72rem';
    slotSpan.style.opacity = '0.8';
    rarityRow.appendChild(slotSpan);
    card.appendChild(rarityRow);

    const name = document.createElement('div');
    name.textContent = item.name;
    name.style.fontWeight = '700';
    name.style.fontSize = '.9rem';
    card.appendChild(name);

    const spriteBox = document.createElement('div');
    spriteBox.style.height = '70px';
    spriteBox.style.borderRadius = '.55rem';
    spriteBox.style.background = 'linear-gradient(180deg, #fefefe 0%, #e5edfb 100%)';
    spriteBox.style.border = '1px dashed #b8cff1';
    spriteBox.style.display = 'flex';
    spriteBox.style.alignItems = 'center';
    spriteBox.style.justifyContent = 'center';
    spriteBox.textContent = 'Item Sprite';
    spriteBox.style.color = '#6b7280';
    spriteBox.style.fontSize = '.75rem';
    card.appendChild(spriteBox);

    const desc = document.createElement('div');
    desc.style.fontSize = '.76rem';
    desc.style.opacity = '0.88';
    desc.textContent = summarizeItem(item);
    card.appendChild(desc);

    const btn = document.createElement('button');
    btn.textContent = 'Obtain';
    btn.style.borderRadius = '0.65rem';
    btn.style.border = '1px solid #7fa8d7';
    btn.style.background = 'linear-gradient(180deg, #ffffff 0%, #d7e8ff 100%)';
    btn.style.color = '#143165';
    btn.style.padding = '.35rem .6rem';
    btn.style.cursor = 'pointer';
    btn.onclick = () => {
      if (!player.inventory) player.inventory = [];
      player.inventory.push({ ...item });
      showMsg(`${item.name} acquired!`, 1800);
      const idx = bossChests.indexOf(chest);
      if (idx >= 0) bossChests.splice(idx, 1);
      closeChestOverlay();
    };
    card.appendChild(btn);

    grid.appendChild(card);
  });

  chestOverlay.addEventListener('click', (e) => {
    if (e.target === chestOverlay) closeChestOverlay();
  });

  document.body.appendChild(chestOverlay);
}

function spawnBossChest(boss) {
  const chest = {
    x: boss.x,
    y: boss.y,
    r: 18,
    poolIds: Array.isArray(boss?.bossDrops) ? boss.bossDrops.slice() : [],
    options: null,
    opened: false
  };
  bossChests.push(chest);
  showMsg('A boss chest has appeared!', 2200);
}
// ========= OBSTACLES =========
const obstacles = [];
function addRandomObstacles(round, playerRef) {
  const count = 2 + Math.floor(round / 2);
  const maxAttempts = 20;
  for (let i = 0; i < count; i++) {
    const w = 120 + Math.random() * 80 + round * 4;
    const h = 80 + Math.random() * 80 + round * 4;
    let placed = false;
    for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
      const x = Math.random() * (world.width - w);
      const y = Math.random() * (world.height - h);
      const rect = { x, y, w, h };
      const overlapsPlayer =
        playerRef &&
        circleRectCollision(playerRef.x, playerRef.y, playerRef.r + 12, rect);
      if (!overlapsPlayer) {
        obstacles.push(rect);
        placed = true;
      }
    }
  }
}

function resetObstaclesForRound(round, playerRef) {
  obstacles.length = 0;
  addRandomObstacles(round, playerRef);
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
const bossProjectiles = [];
const monsterProjectiles = [];
const iceWaves = [];
const bashWaves = [];
const magnumWaves = [];
const meleeArcs = [];
const meteorStrikes = [];
const quagmires = [];
const bossChests = [];
const damageTexts = [];
const coins = [];

let round = 1;
let killsThisRound = 0;
let spawnTimer = 0;
let bossMode = false;
let bossEntity = null;
let regenTimer = 360;

// Obstacles are generated after each boss round (see resetObstaclesForRound).

// ========= ROUND & SCALING =========
function killsForRound(r) {
  const base = 8 + r * 5;              // ramps per round
  const lateRamp = 1 + Math.max(0, r - 5) * 0.15; // more kills later
  let need = Math.round(base * lateRamp);
  if (player.adminMode) need = Math.max(1, Math.round(need * 0.5));
  return need;
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

function bossPseudoStats(m){
  return {
    str: m.attackDamage || 10,
    agi: Math.round((m.moveSpeed || 1) * 10),
    dex: Math.round((m.attackDamage || 10) * 0.8),
    int: m.attackDamage || 10,
    vit: Math.round((m.maxHp || 200) / 30),
    luck: 0
  };
}

function bossSkillDamage(m, skillKey, level){
  const def = SKILL_DB[skillKey];
  const stats = bossPseudoStats(m);
  if (def?.baseDamage) {
    try {
      return def.baseDamage(stats, level);
    } catch (e) {
      return m.attackDamage || 12;
    }
  }
  return (m.attackDamage || 12) + level * 2;
}

function bossCastSkill(key, boss, level){
  const dmg = bossSkillDamage(boss, key, level);
  const dx = player.x - boss.x;
  const dy = player.y - boss.y;
  const dist = Math.hypot(dx, dy) || 1;
  const dirX = dx / dist;
  const dirY = dy / dist;

  if (key === 'Fireball') {
    const speed = 5.0;
    const vx = dirX * speed;
    const vy = dirY * speed;
    const life = 180;
    bossProjectiles.push(new PlayerProjectile(boss.x, boss.y, vx, vy, dmg, 'FIRE', '#ff9800', life));
  } else if (key === 'Arrow') {
    const speed = 7.0;
    const vx = dirX * speed;
    const vy = dirY * speed;
    const life = 180;
    const proj = new PlayerProjectile(boss.x, boss.y, vx, vy, dmg, 'NEUTRAL', '#ffffff', life);
    proj.type = 'arrow';
    proj.angle = Math.atan2(vy, vx);
    bossProjectiles.push(proj);
  } else if (key === 'ArrowShower') {
    const baseAngle = Math.atan2(dirY, dirX);
    const spread = Math.PI / 2.8;
    const step = spread / 4;
    const speed = 6.5;
    const life = 170;
    for (let i = 0; i < 5; i++) {
      const ang = baseAngle + (i - 2) * step;
      const vx = Math.cos(ang) * speed;
      const vy = Math.sin(ang) * speed;
      const proj = new PlayerProjectile(
        boss.x,
        boss.y,
        vx,
        vy,
        dmg,
        'NEUTRAL',
        '#c5e1ff',
        life
      );
      proj.type = 'arrow';
      proj.angle = ang;
      bossProjectiles.push(proj);
    }
  } else if (key === 'Ice') {
    const speed = 4.4;
    const vx = dirX * speed;
    const vy = dirY * speed;
    const life = 160;
    bossProjectiles.push(new PlayerProjectile(boss.x, boss.y, vx, vy, dmg, 'WATER', '#6cf', life));
  } else if (key === 'Bash') {
    if (dist <= boss.attackRange + 32) {
      player.hp -= dmg;
      player.x -= dirX * 3;
      player.y -= dirY * 3;
    }
  } else if (key === 'Magnum') {
    if (dist < 180) {
      player.hp -= dmg;
    }
  } else if (key === 'Meteor') {
    const radius = 80 + level * 8;
    const delay = Math.max(30, 120 - level * 10);
    meteorStrikes.push(new MeteorStrike(player.x, player.y, radius, delay, dmg));
  }
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
  if (L >= 5) {
    unlock('Magnum');
    unlock('DoubleAttack');
  }
  if (L >= 6) {
    unlock('Ice');
    unlock('ArrowShower');
  }
  if (L >= 7) unlock('Quagmire');
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
    if (round % 5 === 0) {
      bossMode = true;
      bossEntity = spawnBoss(canvas, round);
      monsters.length = 0;
      showMsg(`BOSS: ${bossEntity.name}`, 2500);
    } else {
      round++;
      killsThisRound = 0;
      showMsg(`Round ${round} begins!`, 2000);
    }
  }
}

function spawnDamageText(x, y, amount, crit = false, opts) {
  damageTexts.push(new DamageText(x, y, amount, crit, opts || {}));
}

function handleMonsterDeath(mon) {
  if (mon.hp > 0 || mon.__dead) return;
  mon.__dead = true;

  if (mon.isBoss) {
    spawnBossChest(mon);
    bossMode = false;
    bossEntity = null;
    round++;
    killsThisRound = 0;
    resetObstaclesForRound(round, player);
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
  handleMonsterDeath(mon);

  // Passive: Double Attack extra strike
  const daLevel = player.getEffectiveSkillLevel('DoubleAttack');
  if (mon.hp > 0 && daLevel > 0) {
    let chance = 0.12 + (daLevel - 1) * 0.06;
    if (chance > 0.5) chance = 0.5;
    if (Math.random() < chance) {
      const extra = applyDamageToMonster(mon, rawDmg, elem);
      spawnDamageText(mon.x, mon.y - mon.r - 4, extra, false, { variant:'double' });
      handleMonsterDeath(mon);
    }
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

  drawGround();

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

  // collide player with obstacles: if overlapping, gently slide out to the nearest edge
  obstacles.forEach((o) => {
    if (!circleRectCollision(player.x, player.y, player.r, o)) return;
    const leftPen = player.x + player.r - o.x;
    const rightPen = o.x + o.w - (player.x - player.r);
    const topPen = player.y + player.r - o.y;
    const bottomPen = o.y + o.h - (player.y - player.r);
    const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);
    const push = Math.max(0.35, Math.min(minPen, 2.5)); // slow slide out
    if (minPen === leftPen) {
      player.x -= push;
    } else if (minPen === rightPen) {
      player.x += push;
    } else if (minPen === topPen) {
      player.y -= push;
    } else {
      player.y += push;
    }
  });

  // clamp to world
  if (player.x < player.r) player.x = player.r;
  if (player.y < player.r) player.y = player.r;
  if (player.x > world.width - player.r) player.x = world.width - player.r;
  if (player.y > world.height - player.r) player.y = world.height - player.r;

  const movedThisFrame = player.x !== prevPx || player.y !== prevPy;


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

    const basePickup = player.r + 10; // baseline radius near the player
    const luck = (player.stats && player.stats.luck) || 0;

    // Scale LUK so 99 LUK can reach roughly the whole screen.
    const screenRadius = Math.hypot(canvas.width, canvas.height) / 2;
    const extraPerLuck = screenRadius / 99;
    let pickupRadius = basePickup + luck * extraPerLuck;
    if (pickupRadius > screenRadius) pickupRadius = screenRadius;

    if (d < pickupRadius) {
      player.gold = (player.gold || 0) + c.amount;
      coins.splice(i, 1);
    }
  }

  // ----- CHEST INTERACTION -----
  if (!overlayOpen && !chestOverlay) {
    bossChests.forEach((chest) => {
      const d = Math.hypot(chest.x - player.x, chest.y - player.y);
      if (d < (chest.r || 18) + player.r + 6) {
        openChestOverlay(chest);
      }
    });
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

        const nearestWithFacing = (x, y) => {
          const target = nearest(x, y);
          if (target) {
            const ang = Math.atan2(target.y - player.y, target.x - player.x);
            player.dx = Math.cos(ang);
            player.dy = Math.sin(ang);
          }
          return target;
        };

        function useSkill(key, baseCdFrames, caster) {
          const lvl = getEffectiveSkillLevel(key);
          if (lvl <= 0) return;
          if (player.skillCooldowns[key] > 0) return;
          caster();
          lockAttackAnimation();
          const agiFactor = Math.floor(player.stats.agi * 1);
          let cd = baseCdFrames - agiFactor;
          if (cd < 10) cd = 10;
          player.skillCooldowns[key] = cd;
        }

        useSkill('Fireball', 90, () =>
          castFireball(player, playerProjectiles, nearestWithFacing)
        );
        useSkill('Arrow', 40, () =>
          castArrow(player, playerProjectiles, nearestWithFacing)
        );
        useSkill('ArrowShower', 320, () =>
          castArrowShower(player, playerProjectiles, nearestWithFacing)
        );
        useSkill('Ice', 120, () => {
          const t = nearestWithFacing(player.x, player.y);
          if (!t) return;
          const ang = Math.atan2(t.y - player.y, t.x - player.x);
          player.dx = Math.cos(ang);
          player.dy = Math.sin(ang);
          castIceWave(player, iceWaves);
        });
        useSkill('Bash', 70, () => {
          const t = nearestWithFacing(player.x, player.y);
          if (!t) return;
          const ang = Math.atan2(t.y - player.y, t.x - player.x);
          player.dx = Math.cos(ang);
          player.dy = Math.sin(ang);
          castBash(player, bashWaves);
        });
        useSkill('Magnum', 180, () => castMagnum(player, magnumWaves));
        useSkill('Quagmire', 260, () =>
          castQuagmire(player, quagmires, nearestWithFacing)
        );
		  
		  useSkill('Meteor', 240, () =>
        castMeteorStorm(player, meteorStrikes, nearestWithFacing)
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
	
  for (let i = quagmires.length - 1; i >= 0; i--) {
    const field = quagmires[i];
    field.update(paused);

    if (!paused && field.shouldTick()) {
      currentMonsters.forEach((m) => {
        if (field.contains(m)) {
          const dealt = applyDamageToMonster(m, field.tickDamage, field.element);
          spawnDamageText(m.x, m.y - m.r - 8, dealt, false, { variant:'poison' });
          m.fireVulnTimer = Math.max(m.fireVulnTimer || 0, 300);
          m.fireVulnBonus = Math.max(m.fireVulnBonus || 0, field.fireVulnBonus || 0);
          m.quagmireTimer = Math.max(m.quagmireTimer || 0, 300);
          handleMonsterDeath(m);
        }
      });
      field.resetTick();
    }

    if (field.isDone()) {
      quagmires.splice(i, 1);
    }
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


function tryBossSkills(m){
  if (!m.skillLoadout || !m.skillLoadout.length) {
    // safety: give a default set if missing
    m.skillLoadout = [
      { key:'Fireball', level:2 },
      { key:'Bash', level:2 }
    ];
  }
  if (!m.skillCooldowns) m.skillCooldowns = {};

  m.skillLoadout.forEach((entry) => {
    const key = entry.key;
    const level = entry.level || 1;
    if (!key) return;
    const def = SKILL_DB[key] || {};
    const skillCdOverride = entry.cooldown ?? entry.cooldownFrames;
    const skillCdMult = entry.cooldownMult ?? entry.cooldownMultiplier ?? 1;
    const bossCdFactor = m.skillCooldownFactor || 1;
    const baseFromSkill = def.cooldown ? Math.max(40, def.cooldown - level * 6) : 90;
    const cdBase = skillCdOverride != null ? skillCdOverride : baseFromSkill;
    const cdFinal = Math.max(20, Math.round(cdBase * skillCdMult * bossCdFactor));
    const timer = m.skillCooldowns[key] ?? 0;
    if (timer > 0) {
      m.skillCooldowns[key] = timer - 1;
      return;
    }

    const dx = player.x - m.x;
    const dy = player.y - m.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    const launchProjectile = (speed, color, element='NEUTRAL', type=null, angleOverride=null) => {
      const vx = dirX * speed;
      const vy = dirY * speed;
      const proj = new PlayerProjectile(
        m.x,
        m.y,
        vx,
        vy,
        dmg,
        element,
        color || m.color,
        160
      );
      if (type) {
        proj.type = type;
        proj.angle = angleOverride ?? Math.atan2(vy, vx);
      }
      bossProjectiles.push(proj);
    };

    const applyMeleeHit = (rangeBonus = 0, slow = false) => {
      const reach = m.attackRange + rangeBonus;
      if (dist <= reach) {
        player.hp -= dmg;
        if (slow) {
          player.x -= dirX * 2;
          player.y -= dirY * 2;
        }
        return true;
      }
      return false;
    };

    bossCastSkill(key, m, level);

    m.skillCooldowns[key] = cdFinal;
  });
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

  // ----- BOSS SKILL PROJECTILES (same visuals as player) -----
  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    const p = bossProjectiles[i];
    p.update(paused);
    const d = Math.hypot(p.x - player.x, p.y - player.y);
    if (d < player.r + 6) {
      player.hp -= p.dmg;
      bossProjectiles.splice(i, 1);
      continue;
    }
    let hitObs = false;
    obstacles.forEach((o) => {
      if (hitObs) return;
      if (circleRectCollision(p.x, p.y, 4, o)) hitObs = true;
    });
    if (hitObs || p.life <= 0) {
      bossProjectiles.splice(i, 1);
      continue;
    }
  }

  // ----- MONSTERS & BOSS -----
  currentMonsters.forEach((m) => {
    if (!paused) {
      if (m.fireVulnTimer > 0) {
        m.fireVulnTimer--;
        if (m.fireVulnTimer <= 0) m.fireVulnBonus = 0;
      }
      if (m.quagmireTimer > 0) m.quagmireTimer--;
    }

    // ----- MOVEMENT -----
    const prevMx = m.x;
    const prevMy = m.y;

    m.moveTo(player, paused);
    const movedThisFrame = m.x !== prevMx || m.y !== prevMy;
    if (!m.anim) m.anim = { facing:1 };
    const toPlayerX = player.x - m.x;
    if (Math.abs(toPlayerX) > 1) {
      m.anim.facing = toPlayerX >= 0 ? 1 : -1;
    }

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

    // Boss passive regen
    if (!paused && m.isBoss && m.passives?.hpRegen) {
      if (!m._regenTimer) m._regenTimer = 360;
      if (--m._regenTimer <= 0) {
        m.hp = Math.min(m.maxHp, m.hp + (2 + m.passives.hpRegen * 3));
        m._regenTimer = 360;
      }
    }

    // ----- ATTACKS -----
    if (!paused) {
      if (m.isBoss) {
        tryBossSkills(m);
      }
      if (m.attackCooldown-- <= 0) {
        const d2 = Math.hypot(player.x - m.x, player.y - m.y);
        const contactDist = m.r + player.r + 4;
        const inRange = d2 <= Math.max(m.attackRange, contactDist);

        if (inRange) {
          const dirX = player.x - m.x;
          if (!m.anim) m.anim = { facing:1 };
          m.anim.facing = dirX >= 0 ? 1 : -1;
          m.attackAnimTimer = 18;
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
    drawMonster(ctx, m, movedThisFrame, paused);

    if (m.quagmireTimer > 0) {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(129, 199, 132, 0.9)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

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
      if (arrowSprite.ready) {
        const w = arrowSprite.img.width;
        const h = arrowSprite.img.height;
        ctx.drawImage(arrowSprite.img, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = p.color || '#ffffff';
        ctx.fillRect(-10, -2, 20, 4);
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(4, -4);
        ctx.lineTo(4, 4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = p.color || '#ff9800';
    ctx.fill();
  });

  bossProjectiles.forEach((p) => {
    if (p.type === 'arrow') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle || 0);

      if (arrowSprite.ready) {
        const w = arrowSprite.img.width;
        const h = arrowSprite.img.height;
        ctx.drawImage(arrowSprite.img, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = p.color || '#ffffff';
        ctx.fillRect(-10, -2, 20, 4);
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(4, -4);
        ctx.lineTo(4, 4);
        ctx.closePath();
        ctx.fill();
      }
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
	
  quagmires.forEach((f) => {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(76, 175, 80, 0.28)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 195, 74, 0.9)';
    ctx.lineWidth = 3;
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

  // ----- BOSS CHESTS -----
  bossChests.forEach((c) => {
    if (chestSprite.ready) {
      const w = chestSprite.frameW;
      const h = chestSprite.frameH;
      const sy = c.opened ? h : 0;
      ctx.drawImage(chestSprite.img, 0, sy, w, h, c.x - w / 2, c.y - h / 2, w, h);
    } else {
      ctx.beginPath();
      ctx.rect(c.x - 14, c.y - 10, 28, 20);
      ctx.fillStyle = '#d1a85c';
      ctx.strokeStyle = '#7a5c1d';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c.x - 14, c.y);
      ctx.lineTo(c.x + 14, c.y);
      ctx.stroke();
    }
  });

  stepPlayerAnimation(movedThisFrame, paused, player.hp <= 0);

  // ----- PLAYER -----
  const playerDraw = drawPlayer(ctx, player);

  const hpFrac = Math.max(0, Math.min(1, player.hp / player.getMaxHp()));

  // HP bar background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  const barWidth = 40;
  const barY =
    player.y - (playerDraw?.visualHeight || player.r * 2) / 2 - 12;
  ctx.fillRect(player.x - barWidth / 2, barY, barWidth, 6);

  // HP bar color: green >50%, orange >25–50%, red ≤25%
  let hpColor = '#22c55e'; // green
  if (hpFrac <= 0.25) {
    hpColor = '#ef4444';   // red
  } else if (hpFrac <= 0.5) {
    hpColor = '#f97316';   // orange
  }

  ctx.fillStyle = hpColor;
  ctx.fillRect(player.x - barWidth / 2, barY, barWidth * hpFrac, 6);


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
    const lvlReached = player.level || 1;
    openNameModal(lvlReached);
  }

  updateHUD();

  if (!gameOver && (!overlayOpen || resumeCountdown > 0)) requestAnimationFrame(loop);
}

// NOTE: we do NOT start the loop here.
// It only starts after the pre-game setup is valid.
