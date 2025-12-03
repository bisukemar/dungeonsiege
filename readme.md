
Latest Updates
- Added Transcendence system: persistent levels (max 99) with titles, skill point upgrades, and XP gained from monster kills.
- New Transcendence menu on the title screen with Skills/Others tabs, upgradeable transcendent skills, and persistent save data.
- Revised Transcendence skill lineup (all max level 10) with clear Current/Next effect labels and functional bonuses (stats, gold gain, shop discount, chest reroll cost, pickup radius).
- Updated Transcendence EXP curve with fixed per-level bands (1500–6000 XP) up to Lv 99.
- Added a mobile-only Reset button under Character in the HUD to quickly return to the title screen.
- Fixed the arrow shot visual to use the correct sprite (arrow01.png).
- Initial setup modal now requires starting stat/skill allocation (with admin bypass), and mobile top-bar uses a gear menu.
- Inventory tab shows a badge for newly gained items; HP now rescales when max HP changes from gear.

2 December 2025 Update
- Added skill tiers (I/II/III) with per-tab sorting and tier labels on element tags.
- Added new skills: Lightning Bolt (Tier I), Chain Lightning (Tier II, requires Lightning Bolt Lv2), and Arrow Storm (Tier III AoE rain); Arrow Shower moved to Tier II.
- Arrow Storm now shows falling arrow visuals using arrow02.png and multi-hit impacts.
- Added Piercing Strike (Tier II arc, old Bash behavior) and clarified Bash as single-target.
- Magnum Break is now Tier III.
- Arrow Shower now requires Arrow Shot Lv1 (unlock Lv6); Arrow Storm requires Arrow Shower Lv3 (unlock Lv7).
- Refreshed Arrow Shower icon (cache-busted ArrowShower.gif).


Consolidated Updates
- Added obstacle sprites, spawns, and collision
- Added back to title button on game over screen
- Added an off-screen boss direction pointer: when the boss is active but not visible, an on-screen arrow appears toward its location
- Removed Agility-based movement speed bonus; movement speed now uses only the base value plus gear modifiers
- Bug Fix: Hid the HUD when returning to title by clearing its text and setting
- Bug Fix: Raised the boss HP bar further down to avoid overlapping the HUD and Character button, especially on mobile
- Added four new derived stats and wired them up in the character stats panel:
    * Cooldown Reduction (shows net frame change from cooldown/attack speed gear).
    * HP Regen per second (from HP Regen skill plus a small gear HP contribution).
    * Bonus HP from items/skills (with total HP context).
    * Current Skill Range (Dex-influenced average projectile range).
- Adjusted item bonuses
- Added new set of items
- Added item rarity color effect on item in inventory and shop list
- Stat bonus will now indicated properly in the character info, item and skill bonus will be displayed in parenthesis beside the base stats
- Added new Skills (Quagmire, Double Attack, and Arrow Shower)
- Added local leaderboard system allowing to save previous runs
- You may know hide locked skills through a skill toggle option below the skill panel
- Added a female gender sprite, can be modified through option panel
- Added arrow sprite projectile
- Item Rarity system added
- Added a monster drop mechanics. Now boss monsters will now drop Rare, Legendary, and Unique items.
- Added item filter option in the inventory and shop panel
- Added a gold change animation when buying or selling items.
- Added sprites for each item
- Added icons for each skills and adjusted the skill panel display to reflect more information
