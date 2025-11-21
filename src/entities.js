import { ELEMENT, MONSTER_COLOR, elementMod, PLAYER_BASE_HP, HP_PER_VIT } from './constants.js';

export class DamageText {
  constructor(x, y, amount, crit=false){
    this.x = x;
    this.y = y;
    this.amount = amount;
    this.life = 45;
    this.crit = crit;
  }
  update(){
    this.y -= 0.4;
    this.life--;
  }
  draw(ctx){
    ctx.font = this.crit ? "bold 16px ui-monospace" : "14px ui-monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = this.crit ? "#ffeb3b" : "#fff";
    ctx.fillText(this.amount, this.x, this.y);
  }
}

export class PlayerProjectile {
  constructor(x, y, vx, vy, dmg, elem, color, life=120){
    this.x=x; this.y=y;
    this.vx=vx; this.vy=vy;
    this.dmg=dmg;
    this.element=elem;
    this.color=color;
    this.life=life;
  }
  update(paused){
    if (paused) return;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }
}

export class BasicArc {
  constructor(x, y, dirX, dirY, range, dmg){
    this.x = x;
    this.y = y;
    this.dx = dirX;
    this.dy = dirY;
    this.range = range;
    this.dmg = dmg;
    this.life = 6;
  }
  update(){
    this.life--;
  }
  hits(m){
    const dx = m.x - this.x;
    const dy = m.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.range + m.r) return false;
    const baseAngle = Math.atan2(this.dy, this.dx);
    const ang = Math.atan2(dy, dx);
    return Math.abs(ang - baseAngle) < 0.6;
  }
}

export class Player {
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.r = 14;

    this.stats = {
      str: 3,
      agi: 3,
      int: 3,
      dex: 3,
      vit: 3,
      luck: 3
    };

    this.skillLevel = {};
    this.unlocks = {};
    this.skillCooldowns = {};

    this.inventory = [];
    this.equip = {
      head:null, armor:null, weapon:null, shield:null,
      garment:null, shoes:null,
      accL:null, accR:null
    };

    this.hp = this.getMaxHp();
    this.level = 1;
    this.exp = 0;
    this.expToLevel = this.getExpToLevelRequirement(this.level);

    this.baseAttackCooldown = 60;   // frames
    this.defaultAttackTimer = 0;

    this.dx = 1;
    this.dy = 0;
  }

  getMaxHp(){
    let hp = PLAYER_BASE_HP + this.stats.vit*HP_PER_VIT;
    // gear bonuses
    for (const slot in this.equip){
      const it = this.equip[slot];
      if (!it) continue;
      if (it.bonuses?.maxHp) hp += it.bonuses.maxHp;
      if (it.bonuses?.vit) hp += it.bonuses.vit*HP_PER_VIT;
    }
    return hp;
  }

  getMoveSpeed(){
    let ms = 2.4 + this.stats.agi*0.04;
    for (const slot in this.equip){
      const it = this.equip[slot];
      if (!it) continue;
      if (it.bonuses?.moveSpeed) ms += it.bonuses.moveSpeed;
    }
    if (ms < 1.2) ms = 1.2;
    if (ms > 5.5) ms = 5.5;
    return ms;
  }
		  
  // Vampire Survivors–style EXP curve:
  // - Early levels: cheap, so players level up quickly.
  // - Every 10 levels, EXP jumps a bit harder.
 getExpToLevelRequirement(level){
    const base = 20;                       // cost for level 1 → 2
    const linear = base + (level - 1) * 8; // base linear growth

    // Mild scaling every 10 levels (same as before)
    let curveFactor = 1 + Math.floor((level - 1) / 10) * 0.25;

    // After level 10, ramp up strongly so post-boss leveling slows down
    if (level > 10) {
      const over = level - 10;            // how far past 10 we are
      // Each level past 10 multiplies the requirement more and more
      curveFactor *= (1 + over * 0.7);    // L11 ≈ 2.1x, L15 ≈ 5.6x, etc.
    }

    const req = Math.floor(linear * curveFactor);
    return Math.max(20, req);
  }


  getAttackCooldown(){
    let cd = this.baseAttackCooldown;
    cd -= this.stats.agi;
    if (cd < 8) cd = 8;
    for (const slot in this.equip){
      const it = this.equip[slot];
      if (!it) continue;
      if (it.bonuses?.hasOwnProperty('attackCooldown')){
        cd += it.bonuses.attackCooldown;
      }
      if (it.bonuses?.hasOwnProperty('attackSpeed')){
        cd -= it.bonuses.attackSpeed;
      }
    }
    if (cd < 4) cd = 4;
    return cd;
  }

  getCritChance(){
    let cc = 0.05 + this.stats.luck*0.005;
    for (const slot in this.equip){
      const it = this.equip[slot];
      if (!it) continue;
      if (it.bonuses?.critChance) cc += it.bonuses.critChance;
    }
    const precisionLevel = this.getEffectiveSkillLevel('Precision');
    if (precisionLevel>0){
      cc += precisionLevel * 0.02;
    }
    if (cc>0.8) cc=0.8;
    return cc;
  }

  getCritDamage(){
    let cd=1.5;
    for (const slot in this.equip){
      const it = this.equip[slot];
      if (!it) continue;
      if (it.bonuses?.critDamage) cd += it.bonuses.critDamage;
    }
    return cd;
  }

  getSkillBonusLevel(skillKey){
    if (!this.equip) return 0;
    let bonus = 0;
    for (const slot in this.equip){
      const it = this.equip[slot];
      const skillBonus = it?.bonuses?.skill;
      if (!skillBonus) continue;
      const val = skillBonus[skillKey];
      if (val) bonus += val;
    }
    return bonus;
  }

  getEffectiveSkillLevel(skillKey){
    const base = this.skillLevel?.[skillKey] || 0;
    return base + this.getSkillBonusLevel(skillKey);
  }

  addSkillBonusDamage(skillKey, base){
    return base + this.getSkillBonusLevel(skillKey);
  }

  move(keys, paused, canvas, analogInput){
    if (paused) return;

    let ms = this.getMoveSpeed();
    let dx = 0, dy = 0;
    if (keys['w']||keys['ArrowUp']) dy -= ms;
    if (keys['s']||keys['ArrowDown']) dy += ms;
    if (keys['a']||keys['ArrowLeft']) dx -= ms;
    if (keys['d']||keys['ArrowRight']) dx += ms;

    if (analogInput){
      dx += (analogInput.x || 0) * ms;
      dy += (analogInput.y || 0) * ms;
    }

    this.x += dx;
    this.y += dy;
  }

  // No more default melee attack: this just triggers skill casts based on cooldown.
  tryAttack(action){
    const cd = this.getAttackCooldown();

    // cooldown gate
    if (this.defaultAttackTimer > 0) {
      this.defaultAttackTimer--;
      return;
    }

    // Only skills will fire now.
    if (action.castSkills){
      action.castSkills();
    }

    // reset attack cooldown
    this.defaultAttackTimer = cd;
  }

    gainExp(amount, onLevelUp){
    this.exp += amount;

    // Allow multiple level-ups if you gain a big chunk of EXP at once
    while (this.exp >= this.expToLevel){
      this.exp -= this.expToLevel;
      this.level++;
      this.expToLevel = this.getExpToLevelRequirement(this.level);
      if (onLevelUp) onLevelUp(this.level);
    }
  }

}


		  
// ==========================
// MONSTER PROJECTILES
// ==========================
export class MonsterProjectile {
  constructor(x, y, vx, vy, dmg, life, color, element){
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.dmg = dmg;
    this.life = life;
    this.color = color;
    this.element = element;
  }
  update(paused){
    if (paused) return;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }
}

// ==========================
// MONSTER & BOSS
// ==========================
export class Monster {
  constructor(tpl, round, x, y){
    this.name = tpl.name || 'Monster';
    this.level = tpl.level || 1;
    this.element = tpl.element || ELEMENT.NEUTRAL;
    this.color = tpl.color || MONSTER_COLOR[this.element] || '#eaeaea';

    this.x = x;
    this.y = y;
    this.r = tpl.radius || 16;

    const baseHp = tpl.hp ?? tpl.baseHp ?? 20;
    const roundScale = 1 + Math.max(0, round - 1) * 0.15;
    this.maxHp = Math.floor(baseHp * roundScale);
    this.hp = this.maxHp;

    this.attackDamage = tpl.attackDamage ?? 5;
    this.attackRange = tpl.attackRange ?? 60;
    this.attackCooldownMax = tpl.attackCooldown ?? 60;
    this.attackCooldown = Math.floor(Math.random() * this.attackCooldownMax);

    // movement & type
    this.moveSpeed = tpl.moveSpeed ?? 1.4;
    this.attackType = tpl.attackType || tpl.type || 'melee';

    const baseExp = tpl.exp ?? 5;
    this.expValue = Math.floor(baseExp * (0.5 + round * 0.25));

    this.slowTimer = 0;
    this.isBoss = false;
  }

moveTo(player, paused){
  if (paused) return;

  let spd = this.moveSpeed;
  if (this.slowTimer > 0){
    this.slowTimer--;
    spd *= 0.45; // slowed by skills like Bash/Ice
  }

  const dx = player.x - this.x;
  const dy = player.y - this.y;
  const dist = Math.hypot(dx, dy) || 1;

  const isRanged = (this.attackType === 'ranged');

  if (isRanged){
    // Ranged enemies:
    // - Do NOT kite away when the player is close.
    // - Only move closer if they are too far from their attack range.
    const tooFar = dist > this.attackRange * 0.9;

    if (tooFar){
      this.x += (dx / dist) * spd;
      this.y += (dy / dist) * spd;
    }
    // If already within ~90% of attackRange, they hold position and just shoot.
  } else {
    // Melee enemies always move toward the player
    this.x += (dx / dist) * spd;
    this.y += (dy / dist) * spd;
  }
}


}

export class Boss extends Monster {
  constructor(tpl, round, x, y){
    // Boss templates use baseHp; adapt it to the Monster constructor
    const adaptedTpl = { ...tpl, hp: tpl.baseHp ?? tpl.hp };
    super(adaptedTpl, round, x, y);

    this.isBoss = true;

    // Make bosses visually larger and much tankier
    this.r *= 1.6;
    this.maxHp = Math.floor(this.maxHp * (1.8 + round * 0.1));
    this.hp = this.maxHp;

    // Bigger EXP payout for bosses
    const baseBossExp = tpl.exp ?? 30;
    this.expValue = Math.floor(baseBossExp * (1 + round * 0.5));
  }
}

// ==========================
// DAMAGE RESOLUTION
// ==========================
export function applyDamageToMonster(mon, dmg, atkElement){
  const mElem = mon.element || ELEMENT.NEUTRAL;
  const mod = elementMod(mElem, atkElement);
  const final = Math.max(1, Math.round(dmg * mod));
  mon.hp -= final;
  if (mon.hp < 0) mon.hp = 0;
  return final;
}
