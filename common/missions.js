// Reconstructed campaign boards, not a dump of Nintendo's original map data.
// Twenty authored boards return with harder rosters through mission 100.
var Missions = (function() {
  var boards = [
    {name:'First shot', walls:[[375,425,50,300]], enemies:['brown'], spawns:[[1175,425]]},
    {name:'Around the bend', walls:[[675,250,650,50],[675,600,650,50]], enemies:['gray']},
    {name:'Three corners', walls:[[325,225,50,200],[675,425,200,50],[975,625,50,200]], enemies:['brown','brown','brown']},
    {name:'Crossfire', walls:[[425,400,50,500],[925,450,50,500],[675,425,250,50,'crate']], enemies:['gray','gray']},
    {name:'Rocket corridor', walls:[[625,275,550,50],[825,625,550,50],[350,450,50,300]], enemies:['teal','teal']},
    {name:'Double trouble', walls:[[625,225,650,50],[725,625,650,50],[675,425,100,100,'pit']], enemies:['gray','gray','teal','teal']},
    {name:'The bunker', walls:[[675,275,500,50],[450,425,50,300],[900,425,50,300],[675,575,500,50,'crate']], enemies:['brown','brown','brown','brown'], start:[675,425]},
    {name:'Ricochet alley', walls:[[375,275,50,350],[675,575,50,350],[975,275,50,350],[1125,525,150,50,'crate']], enemies:['gray','teal','pink','brown']},
    {name:'Split decision', walls:[[675,300,50,350],[675,675,50,150],[350,425,100,100,'pit'],[1000,425,100,100,'pit']], enemies:['pink','gray','teal','teal']},
    {name:'Minefield', walls:[[500,250,300,50,'crate'],[850,600,300,50,'crate'],[675,425,150,150,'pit']], enemies:['yellow','yellow','gray','pink']},
    {name:'Fast lanes', walls:[[450,425,50,450],[900,425,50,450],[675,250,200,50],[675,600,200,50]], enemies:['teal','teal','pink','gray']},
    {name:'Bank shot', walls:[[475,300,350,50],[875,550,350,50],[675,425,50,200,'crate']], enemies:['green','gray','pink','yellow']},
    {name:'Open season', walls:[[375,250,150,150,'pit'],[975,600,150,150,'pit'],[675,425,200,50]], enemies:['pink','pink','yellow','teal']},
    {name:'Purple patrol', walls:[[425,350,350,50],[925,500,350,50],[675,225,50,150],[675,625,50,150]], enemies:['purple','purple','pink','gray']},
    {name:'Demolition', walls:[[675,425,50,650,'crate'],[400,275,200,50,'crate'],[950,575,200,50,'crate']], enemies:['yellow','yellow','purple','green']},
    {name:'Ghost tracks', walls:[[475,300,150,150,'pit'],[875,550,150,150,'pit'],[675,425,50,250]], enemies:['white','white','purple','teal']},
    {name:'Cork fortress', walls:[[675,250,550,50],[425,425,50,350],[925,425,50,350],[675,600,550,50,'crate']], enemies:['green','green','purple','yellow','white']},
    {name:'Black pursuit', walls:[[425,300,250,50],[925,550,250,50],[675,425,100,100,'pit']], enemies:['black','pink','purple','teal']},
    {name:'Last stand', walls:[[325,425,50,300],[1025,425,50,300],[675,225,350,50],[675,625,350,50],[675,425,150,50,'crate']], enemies:['black','white','green','purple','yellow','pink']},
    {name:'The gauntlet', walls:[[450,275,250,50],[900,575,250,50],[450,575,150,50,'crate'],[900,275,150,50,'crate'],[675,425,100,100,'pit']], enemies:['black','black','white','green','purple','pink','yellow','teal']}
  ];
  var preferred = [[1175,175],[1175,675],[1125,425],[675,125],[675,725],[425,125],[425,725],[975,675]];
  var tiers = ['brown','gray','teal','yellow','pink','green','purple','white','black'];
  function get(number) {
    number = Math.max(1,Math.min(100,Math.floor(number)||1));
    var base=boards[(number-1)%20], cycle=Math.floor((number-1)/20);
    var roster=base.enemies.map(function(type, i) { return cycle ? tiers[Math.min(8, tiers.indexOf(type)+cycle+(i%3===0?1:0))] : type; });
    return {number:number, name:base.name, width:1350,height:850,
      walls:base.walls.map(function(w){return {x:w[0],y:w[1],width:w[2],height:w[3],material:w[4]||'cream'};}),
      start:base.start || [175,675], partner:base.start ? [775,425] : [175,575],
      enemies:roster.map(function(type,i){var p=(base.spawns||preferred)[i];return {type:type,x:p[0],y:p[1]};})};
  }
  return {get:get, count:100, boards:boards.length, fidelity:'reconstructed'};
})();
if (typeof module !== 'undefined') module.exports = Missions;
