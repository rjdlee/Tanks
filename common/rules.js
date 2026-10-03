// Classic tank rules, expressed in 60 Hz simulation steps.
// Values are deliberately separate from artwork and network delivery.
var ClassicRules = {
  lives: 3, shellLimit: 5, mineLimit: 2, shellSpeed: 3,
  shellCooldown: 5, mineCooldown: 6, moveSpeed: 1.8,
  turnSpeed: .1, mineFuse: 600, mineArm: 90, mineTrigger: 30,
  blastRadius: 85, blastDuration: 18, shotStun: 5,
  pvpTarget: 10, pvpDuration: 10800, respawnDelay: 180,
  types: {
    brown: {color:'#98601a', speed:0, shells:1, cooldown:300, shotSpeed:3, bounces:1, mines:0, aim:.012, dodge:0},
    gray: {color:'#8d939a', speed:1.2, shells:1, cooldown:180, shotSpeed:3, bounces:1, mines:0, aim:.018, dodge:70, stun:10},
    teal: {color:'#188a8b', speed:1, shells:1, cooldown:180, shotSpeed:6, bounces:0, mines:0, aim:.05, dodge:70, stun:20, turn:.2},
    yellow: {color:'#e7bb32', speed:1.8, shells:1, cooldown:180, shotSpeed:3, bounces:1, mines:4, aim:.025, dodge:70, stun:10},
    pink: {color:'#ed679b', speed:1.2, shells:3, cooldown:30, shotSpeed:3, bounces:1, mines:0, aim:.035, dodge:90},
    green: {color:'#68ac44', speed:0, shells:2, cooldown:60, shotSpeed:6, bounces:2, mines:0, aim:.035, dodge:0, bank:true},
    purple: {color:'#9b65bc', speed:1.8, shells:5, cooldown:30, shotSpeed:3, bounces:1, mines:2, aim:.045, dodge:120},
    white: {color:'#e7e8e3', speed:1.2, shells:5, cooldown:30, shotSpeed:3, bounces:1, mines:2, aim:.045, dodge:100, invisible:true},
    black: {color:'#3b4148', speed:2.4, shells:3, cooldown:60, shotSpeed:6, bounces:0, mines:2, aim:.065, dodge:170, lead:true, stun:10, turn:.06}
  }
};
if (typeof module !== 'undefined') module.exports = ClassicRules;
