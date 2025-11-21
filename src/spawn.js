import { MONSTER_DB, BOSS_DB } from './databases/monsterDB.js'; // adjust path if yours is different
import { Monster, Boss } from './entities.js';

// Find the nearest monster to a point (used by skills)
export function nearestMonster(px, py, list) {
  let best = null;
  let bd = Infinity;
  for (const m of list) {
    const d = (m.x - px) ** 2 + (m.y - py) ** 2;
    if (d < bd) {
      bd = d;
      best = m;
    }
  }
  return best;
}

// Pick which monster template to use for a given round
function pickMonsterTemplateForRound(round) {
  // Simple loop through the DB as rounds increase
  const idx = (round - 1) % MONSTER_DB.length;
  return MONSTER_DB[idx];
}

// Spawn a regular monster somewhere just outside the current viewport
export function spawnMonsterForRound(canvas, round, cam) {
  const tpl = pickMonsterTemplateForRound(round);

  const margin = 80; // how far off-screen to spawn
  const viewLeft = cam.x;
  const viewTop = cam.y;
  const viewRight = cam.x + canvas.width;
  const viewBottom = cam.y + canvas.height;

  // 0 = left, 1 = right, 2 = top, 3 = bottom
  const side = Math.floor(Math.random() * 4);
  let x, y;

  if (side === 0) { // left
    x = viewLeft - margin;
    y = viewTop + Math.random() * canvas.height;
  } else if (side === 1) { // right
    x = viewRight + margin;
    y = viewTop + Math.random() * canvas.height;
  } else if (side === 2) { // top
    x = viewLeft + Math.random() * canvas.width;
    y = viewTop - margin;
  } else { // bottom
    x = viewLeft + Math.random() * canvas.width;
    y = viewBottom + margin;
  }

  // Create a real Monster instance
  const m = new Monster(tpl, round, x, y);

  // Just in case: clamp HP and maxHp
  m.hp = Math.floor(m.hp);
  m.maxHp = m.hp;

  return m;
}

// Spawn a boss in the middle of the canvas (camera will center on it)
export function spawnBoss(canvas, round) {
  const bIndex = ((round / 3) | 0) % BOSS_DB.length;
  const tpl = BOSS_DB[bIndex];

  const spawnX = canvas.width / 2;
  const spawnY = canvas.height / 2;

  return new Boss(tpl, round, spawnX, spawnY);
}
