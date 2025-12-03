import { ELEMENT, MONSTER_COLOR, elementMod, PLAYER_BASE_HP, HP_PER_VIT } from './constants.js';

export class DamageText {
  constructor(x, y, amount, crit=false, opts={}){
    this.x = x;
    this.y = y;
    this.amount = amount;
    this.life = 45;
    this.crit = crit;
    this.variant = opts.variant || 'normal';
  }
  update(){
    this.y -= 0.4;
    this.life--;
  }
  draw(ctx){
    const isDouble = this.variant === 'double';
    const isPoison = this.variant === 'poison';

    let font = "14px ui-monospace";
    let color = "#fff";
    if (this.crit){
      font = "bold 16px ui-monospace";
      color = "#ff9800";
    } else if (isDouble){
      font = "bold 15px ui-monospace";
      color = "#ffeb3b";
    } else if (isPoison){
      font = "13px ui-monospace";
      color = "#9ae6b4";
    }

    ctx.font = font;
    ctx.textAlign = "center";
    const text = this.crit ? `${this.amount}!` : this.amount;
    ctx.fillStyle = color;
    ctx.fillText(text, this.x, this.y);
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
    this.transcendenceBonuses = {};
    this.transcendenceTitle = 'Novice';
    this.transcendenceLevel = 1;
    this.transcendenceSkillPoints = 0;
    this.__transcendenceApplied = false;

    this.baseAttackCooldown = 60;   // frames
    this.defaultAttackTimer = 0;

    this.dx = 1;
    this.dy = 0;
  }

  getMaxHp(){
    const vit = this.getTotalStat ? this.getTotalStat('vit') : (this.stats?.vit || 0);
    let hp = PLAYER_BASE_HP + vit*HP_PER_VIT;
    // gear bonuses
    for (const slot in this.equip){
      const it = this.equip[slot];
      if (!it) continue;
      if (it.bonuses?.maxHp) hp += it.bonuses.maxHp;
    }
    const hpPct = this.transcendenceBonuses?.maxHpPct || 0;
    if (hpPct) hp *= (1 + hpPct);
    return hp;
  }

  getMoveSpeed(){
    // Base movement speed; Agility no longer increases move speed
    let ms = 2.4;
    for (const slot in this.equip){
      const it = this.equip[slot];
      if (!it) continue;
      if (it.bonuses?.moveSpeed) ms += it.bonuses.moveSpeed;
    }
    if (this.transcendenceBonuses?.moveSpeedPct) {
      ms *= (1 + this.transcendenceBonuses.moveSpeedPct);
    }
    if (ms < 1.2) ms = 1.2;
    if (ms > 5.5) ms = 5.5;
    return ms;
  }
		  
  // Vampire Survivors–style EXP curve:
  // - Early levels: cheap, so players level up quickly.
  // - Every 10 levels, EXP jumps a bit harder.
  getExpToLevelRequirement(level){
    return 0; // EXP disabled
  }


  getAttackCooldown(){
    let cd = this.baseAttackCooldown;
    const agi = this.getTotalStat ? this.getTotalStat('agi') : (this.stats?.agi || 0);
    cd -= agi;
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
    const luck = this.getTotalStat ? this.getTotalStat('luck') : (this.stats?.luck || 0);
    let cc = 0.05 + luck*0.003;
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

  getDefense(){
    let def = 0;
    if (this.equip){
      for (const slot in this.equip){
        const it = this.equip[slot];
        if (!it) continue;
        if (it.bonuses?.defense) def += it.bonuses.defense;
      }
    }
    return def;
  }

  getGearStatBonuses(){
    const res = { str:0, agi:0, int:0, dex:0, vit:0, luck:0 };
    if (!this.equip) return res;
    Object.values(this.equip).forEach((it) => {
      if (!it?.bonuses) return;
      Object.keys(res).forEach((k) => {
        if (it.bonuses[k]) res[k] += it.bonuses[k];
      });
    });
    return res;
  }

  getTotalStat(key){
    const baseTransBonus = (this.__transcendenceStatBonus?.[key] || 0);
    const base = Math.max(0, (this.stats?.[key] || 0) - baseTransBonus);
    const gearBonuses = this.getGearStatBonuses();
    const gear = gearBonuses[key] || 0;
    const trans = (this.transcendenceBonuses?.stats?.[key] || 0);
    return base + gear + trans;
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
    let val = base + this.getSkillBonusLevel(skillKey);
    if (this.transcendenceBonuses?.skillDamagePct) {
      val *= (1 + this.transcendenceBonuses.skillDamagePct);
    }
    return val;
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

  // EXP system disabled; leveling handled per-round externally.

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
    this.spriteDef = tpl.sprite || null;

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
    this.bossDrops = Array.isArray(tpl.bossDrops) ? [...tpl.bossDrops] : [];

    // Make bosses visually larger and much tankier
    this.r *= 1.6;
    this.maxHp = Math.floor(this.maxHp * (1.8 + round * 0.1));
    this.hp = this.maxHp;

    // Bigger EXP payout for bosses
    const baseBossExp = tpl.exp ?? 30;
    this.expValue = Math.floor(baseBossExp * (1 + round * 0.5));

    this.skillLoadout = Array.isArray(tpl.skills) && tpl.skills.length
      ? tpl.skills.map((s) => ({ ...s }))
      : [
          { key:'Fireball', level:2 },
          { key:'Bash', level:2 }
        ];
    this.skillCooldowns = {};
    this.passives = {};
    this.skillCooldownFactor = tpl.skillCooldownFactor || 1;
    this.applyPassives();
  }

  applyPassives(){
    this.passives = {};
    this.skillLoadout.forEach(({ key, level = 1 }) => {
      if (!key) return;
      if (key === 'Toughness') {
        this.passives.toughness = level;
      } else if (key === 'Haste') {
        this.passives.haste = level;
      } else if (key === 'HPRegen') {
        this.passives.hpRegen = level;
      }
    });

    if (this.passives.toughness){
      const bonusHp = this.passives.toughness * 10;
      this.maxHp += bonusHp;
      this.hp += bonusHp;
    }
    if (this.passives.haste){
      this.attackCooldownMax = Math.max(20, this.attackCooldownMax - this.passives.haste * 3);
    }
  }
}

// ==========================
// DAMAGE RESOLUTION
// ==========================
export function applyDamageToMonster(mon, dmg, atkElement){
  const mElem = mon.element || ELEMENT.NEUTRAL;
  const mod = elementMod(mElem, atkElement);
  let modified = dmg * mod;
  if (atkElement === ELEMENT.FIRE && mon.fireVulnTimer > 0){
    modified *= 1 + (mon.fireVulnBonus || 0);
  }
  const final = Math.max(1, Math.round(modified));
  mon.hp -= final;
  if (mon.hp < 0) mon.hp = 0;
  return final;
}
