const fs=require('fs');
const vm=require('vm');
const Battle=require('../common/battle');
const Player=require('../common/player');
const Vector2=require('../common/vector2');

function setup(){
  const server=new Battle({mode:'pvp'});server.players={};server.walls=[];server.addHuman('a','A');server.addHuman('b','B');server.phase='active';
  function Camera(){this.pos=new Vector2();}
  const client=new Battle({mode:'pvp',authority:false});client.players={};client.revision=-1;
  const context={map:client,user:null,Battle,Player,Vector2,Camera,ClassicRules:require('../common/rules'),Rectangle:require('../common/rectangle'),Wall:require('../common/wall'),
    window:{innerWidth:1280,innerHeight:800},width:1280,height:800,performance:{now:()=>1000},Date,document:{},Art:{action:()=>{}},
    clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),difference:(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b))};
  vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('./play.js'),'utf8'),context);
  const app=context.gameplay;app.id='a';app.mode='pvp';app.effects=()=>{};app.hud=()=>{};
  const receive=(ack,sequence)=>app.receive({sequence,acks:{a:ack,b:0},state:server.snapshot()});receive(0,1);
  return {server,context,app,receive};
}
it('replays delayed input without duplicate ammo or restarting a predicted shell',()=>{
  const {server,context,app,receive}=setup(),commands=[];
  for(let seq=1;seq<=12;seq++){
    const input={seq,x:1,y:0,heading:Math.PI,shoot:seq===2||seq===8,mine:seq===1||seq===7};
    app.predict(input,false);app.pending.push(input);commands.push(input);
  }
  const x=context.user.pos.x,shot=context.map.projectiles['a:1:8:shoot'];shot.movePos(30,0);const position=shot.pos.x;
  commands.slice(0,3).forEach(input=>{const p=server.players.a;server.moveHuman(p,input);if(input.shoot)server.fire(p,'a:1:'+input.seq+':shoot');if(input.mine)server.drop(p,'a:1:'+input.seq+':mine');});
  receive(3,2);expect(context.user.pos.x).toBeCloseTo(x,6);expect(context.user.projectiles.length).toBe(2);expect(context.user.mines.length).toBe(2);
  expect(new Set(context.user.projectiles.map(s=>s.id)).size).toBe(2);expect(context.map.projectiles[shot.id]).toBe(shot);expect(shot.pos.x).toBe(position);
});
it('drops rejected actions and old-life predictions when a tank respawns',()=>{
  const {server,context,app,receive}=setup();const input={seq:1,x:1,y:0,heading:Math.PI,shoot:true,mine:true};app.predict(input,false);app.pending.push(input);app.unsent.push(input);
  receive(1,2);expect(context.user.projectiles.length).toBe(0);expect(context.user.mines.length).toBe(0);
  input.seq=2;app.predict(input,false);app.pending.push(input);app.unsent.push(input);server.configure(server.players.a);server.players.a.setPos(700,600);
  receive(1,3);expect(app.pending.length).toBe(0);expect(app.unsent.length).toBe(0);expect(Object.keys(context.map.projectiles).length).toBe(0);expect(Object.keys(context.map.mines).length).toBe(0);expect(context.user.pos).toMatchObject({x:700,y:600});
});
it('keeps old-life authoritative shells visible without charging the new life ammo slots',()=>{
  const {server,context,receive}=setup(),p=server.players.a;server.fire(p,'old-shot');server.drop(p,'old-mine');server.configure(p);
  receive(0,2);expect(Object.keys(context.map.projectiles)).toContain('old-shot');expect(Object.keys(context.map.mines)).toContain('old-mine');expect(context.user.projectiles.length).toBe(0);expect(context.user.mines.length).toBe(0);
});
