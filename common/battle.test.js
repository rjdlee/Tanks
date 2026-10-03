const Battle=require('./battle');
const Rules=require('./rules');
const Collision=require('./collision');
const Wall=require('./wall');
const Player=require('./player');

function arena(mode='solo') {
  const b=new Battle({mode});b.players={};b.walls=[];b.addWallBorders();
  b.addHuman('a','A',0);if(mode!=='solo')b.addHuman('b','B',1);
  if(mode==='solo'){const npc=b.configure(new Player('npc0',1175,175),'brown');npc.lastShotTick=100000;b.players.npc0=npc;}
  b.phase='active';b.players.a.setPos(200,425);b.players.a.barrel.setAngle(Math.PI);
  return b;
}
function steps(b,n){for(let i=0;i<n;i++)b.tick();}
function shells(b,n){for(let i=0;i<n;i++)Object.keys(b.projectiles).forEach(id=>{if(b.projectiles[id])b.stepShot(b.projectiles[id]);});}

it('spawns every campaign roster and both partners clear of terrain and one another',()=>{
  for(let number=1;number<=100;number++) {
    const b=new Battle({mode:'coop'});b.loadMission(number);b.addHuman('a','A',0);b.addHuman('b','B',1);
    const players=Object.values(b.players);
    players.forEach(p=>{b.walls.forEach(w=>expect(Collision.detect(p,w)).toBeUndefined());players.forEach(other=>{if(other!==p)expect(Collision.detect(p,other)).toBeUndefined();});});
    expect(players.filter(p=>p.npc).length).toBeGreaterThan(0);expect(players.filter(p=>p.npc).length).toBeLessThanOrEqual(8);
  }
});
it('limits human ammunition and returns slots when objects are removed',()=>{
  const b=arena(),p=b.players.a;
  for(let i=0;i<6;i++){p.controlTick+=5;b.fire(p);}
  expect(p.projectiles.length).toBe(5);b.removeProjectile(p.projectiles[0].id);p.controlTick+=5;expect(b.fire(p)).toBeTruthy();
  for(let i=0;i<3;i++){p.controlTick+=6;b.drop(p);}
  expect(p.mines.length).toBe(2);b.removeMine(p.mines[0].id);p.controlTick+=6;expect(b.drop(p)).toBeTruthy();
});
it('standard shells ricochet once and rockets use their own bounce limit',()=>{
  const b=arena(),p=b.players.a,shot=b.fire(p);shells(b,360);expect(shot.bounceCount).toBe(1);expect(b.projectiles[shot.id]).toBe(shot);
  shells(b,400);expect(b.projectiles[shot.id]).toBeUndefined();
  const rockets=arena();rockets.players.a.spec=Rules.types.teal;const rocket=rockets.fire(rockets.players.a);expect(rocket.maxBounces).toBe(0);shells(rockets,400);expect(rockets.projectiles[rocket.id]).toBeUndefined();
});
it('cancels shells even when the second shell follows the first in object order',()=>{
  const b=arena('pvp'),a=b.players.a,c=b.players.b;c.setPos(900,425);c.barrel.setAngle(0);
  b.fire(a,'first');b.fire(c,'second');shells(b,150);expect(Object.keys(b.projectiles)).toEqual([]);expect(a.alive&&c.alive).toBe(true);
});
it('lets shells cross pits while stopping tank movement at their edge',()=>{
  const b=arena('pvp'),a=b.players.a,c=b.players.b;c.setPos(600,425);
  const pit=new Wall(350,425,50,200);pit.material='pit';b.walls.push(pit);b.fire(a);shells(b,130);expect(c.alive).toBe(false);
  for(let i=0;i<150;i++)b.moveHuman(a,{x:1,y:0,heading:Math.PI});expect(a.pos.x).toBeLessThanOrEqual(295);expect(Collision.detect(a,pit)).toBeUndefined();
});
it('detects fast shells against thin walls without tunnelling',()=>{
  const b=arena(),p=b.players.a;b.walls.push(new Wall(350,425,2,150));const shot=b.fire(p);shot.setVelocity(-200);b.stepShot(shot);
  expect(shot.bounceCount).toBe(1);expect(shot.velocity.x).toBeLessThan(0);expect(shot.pos.x).toBeLessThan(350);
});
it('allows a ricochet to destroy its owner without awarding a self-kill',()=>{
  const b=arena(),p=b.players.a;p.setPos(125,425);b.walls.push(new Wall(190,425,10,100));b.fire(p);shells(b,30);
  expect(p.alive).toBe(false);expect(p.score).toBe(0);
});
it('uses a ten-second fuse and triggers armed mines near tanks sooner',()=>{
  const b=arena(),p=b.players.a,m=b.drop(p);p.setPos(500,500);
  expect(m.detonate-m.born).toBe(600);steps(b,599);expect(m.exploded).toBe(false);steps(b,1);expect(m.exploded).toBe(true);
  const other=arena(),o=other.drop(other.players.a);steps(other,119);expect(o.exploded).toBe(false);steps(other,1);expect(o.exploded).toBe(true);expect(other.players.a.alive).toBe(false);
});
it('chains mines, clears nearby shells, and destroys only cork terrain',()=>{
  const b=arena(),p=b.players.a,first=b.drop(p);p.controlTick+=6;p.setPos(260,425);const second=b.drop(p);
  const cork=new Wall(300,425,50,50);cork.material='crate';const wood=new Wall(200,475,50,50);wood.material='cream';b.walls.push(cork,wood);
  p.barrel.setAngle(Math.PI);const shot=b.fire(p);b.explodeMine(first);
  expect(second.exploded).toBe(true);expect(b.walls).not.toContain(cork);expect(b.walls).toContain(wood);expect(b.projectiles[shot.id]).toBeUndefined();expect(b.revision).toBeGreaterThan(1);
});
it('keeps a co-op mission alive until both players are destroyed',()=>{
  const b=new Battle({mode:'coop'});b.addHuman('a','A');b.addHuman('b','B');b.phase='active';b.kill(b.players.a,'npc0');b.tick();
  expect(b.phase).toBe('active');expect(b.lives).toBe(3);b.kill(b.players.b,'npc0');b.tick();expect(b.phase).toBe('failed');expect(b.lives).toBe(2);
});
it('retains defeated enemies on retry and revives both humans for the next mission',()=>{
  const b=new Battle({mode:'coop'});b.loadMission(3);b.addHuman('a','A');b.addHuman('b','B');b.phase='active';
  b.kill(b.players.npc0,'a');b.kill(b.players.a,'npc1');b.kill(b.players.b,'npc1');b.tick();b.begin('a');b.begin('b');expect(b.players.npc0).toBeUndefined();
  b.phase='active';Object.values(b.players).filter(p=>p.npc).forEach(p=>b.kill(p,'a'));b.kill(b.players.b,'a');b.tick();expect(b.phase).toBe('clear');
  b.begin('a');b.begin('b');expect(b.mission).toBe(4);expect(b.players.a.alive&&b.players.b.alive).toBe(true);
});
it('awards an extra campaign life every five clears and completes at mission 100',()=>{
  const b=new Battle();b.loadMission(5);b.addHuman('a','A');b.phase='active';Object.values(b.players).filter(p=>p.npc).forEach(p=>b.kill(p,'a'));b.tick();expect(b.lives).toBe(4);
  b.loadMission(100);b.phase='clear';b.begin('a');expect(b.phase).toBe('complete');
});
it('requires both online partners to ready and isolates them from campaign advancement',()=>{
  const b=new Battle({mode:'coop'});b.addHuman('a','A');b.begin('a');expect(b.phase).toBe('briefing');b.addHuman('b','B');b.begin('b');expect(b.phase).toBe('countdown');steps(b,120);expect(b.phase).toBe('active');
});
it('respawns PvP tanks with protection, preserves scores, and ends at ten kills',()=>{
  const b=arena('pvp');b.kill(b.players.b,'a');expect(b.players.a.score).toBe(1);steps(b,180);expect(b.players.b.alive).toBe(true);b.kill(b.players.b,'a');expect(b.players.b.alive).toBe(true);
  b.players.a.score=10;b.tick();expect(b.phase).toBe('over');expect(b.winner).toBe('A');
});
it('ends PvP on the clock and handles tied scores',()=>{
  const b=arena('pvp');b.elapsed=Rules.pvpDuration-1;b.tick();expect(b.phase).toBe('over');expect(b.winner).toBe('Draw');
});
it('has nine distinct enemy roles with stationary snipers, mine layers, and invisibility',()=>{
  expect(Object.keys(Rules.types).length).toBe(9);expect(Rules.types.brown.speed).toBe(0);expect(Rules.types.green.bounces).toBe(2);expect(Rules.types.green.speed).toBe(0);
  expect(Rules.types.yellow.mines).toBe(4);expect(Rules.types.white.invisible).toBe(true);expect(Rules.types.black.speed).toBeGreaterThan(Rules.moveSpeed);expect(Rules.types.teal.shotSpeed).toBe(6);
});
it('routes mobile enemies around terrain while brown snipers remain stationary',()=>{
  const b=new Battle();b.addHuman('a','A');b.phase='active';b.fire=()=>null;const brown=b.players.npc0,start={x:brown.pos.x,y:brown.pos.y};steps(b,180);expect(brown.pos).toMatchObject(start);
  b.loadMission(2);b.phase='active';const gray=b.players.npc0,position={x:gray.pos.x,y:gray.pos.y};steps(b,300);expect(Math.hypot(gray.pos.x-position.x,gray.pos.y-position.y)).toBeGreaterThan(100);
  b.walls.forEach(w=>expect(Collision.detect(gray,w)).toBeUndefined());
});
it('keeps friendly fire active in co-op and prevents clients from deciding kills',()=>{
  const b=arena('coop');b.players.b.setPos(600,425);b.fire(b.players.a);shells(b,130);expect(b.players.b.alive).toBe(false);expect(b.players.a.score).toBe(0);
  const client=arena('pvp');client.authority=false;client.kill(client.players.b,'a');expect(client.players.b.alive).toBe(true);expect(client.players.a.score).toBe(0);
});
it('lets mine-layer AI escape the mine it just dropped',()=>{
  const b=arena(),npc=b.players.npc0;npc.type='yellow';npc.spec=Rules.types.yellow;npc.setPos(600,425);npc.nextMine=0;b.fire=()=>null;
  steps(b,1);const mine=npc.mines[0];expect(mine).toBeTruthy();steps(b,130);
  expect(npc.alive).toBe(true);expect(Math.hypot(npc.pos.x-mine.pos.x,npc.pos.y-mine.pos.y)).toBeGreaterThan(85);
});
it('triggers a mine immediately when a shell strikes it',()=>{
  const b=arena(),p=b.players.a;p.setPos(300,425);const mine=b.drop(p);p.setPos(200,425);const shot=b.fire(p);shells(b,20);
  expect(mine.exploded).toBe(true);expect(b.projectiles[shot.id]).toBeUndefined();
});
