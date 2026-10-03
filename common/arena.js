// Toy-box arena. All decorative crates and pits have matching solid geometry.
// Coordinates use the same 1960 x 1080 arena on every server and client.
function arenaWalls(width, height) {
  var layouts = [
    [200,180,150,50], [300,340,50,200], [650,240,150,50],
    [920,160,200,50], [950,410,250,50], [1260,300,50,250],
    [1470,170,150,50], [1660,360,50,150], [1780,540,150,50],
    [210,650,50,200], [470,730,150,50], [760,580,150,50],
    [1030,650,50,200], [1180,800,250,50], [1450,600,50,150],
    [1700,840,150,50], [660,940,250,50], [350,940,50,100],
    [425,275,100,100,'pit'], [1520,380,100,100,'pit'],
    [530,830,100,100,'pit'], [1660,680,100,100,'pit'],
    [375,180,50,50,'crate'], [1070,160,50,50,'crate'],
    [1520,170,50,50,'crate'], [950,650,50,50,'crate'],
    [1355,800,50,50,'crate'], [575,730,50,50,'crate'],
    [1825,840,50,50,'crate']
  ];
  return layouts.map(function(item) { return {x:item[0]*width/1960,y:item[1]*height/1080,
    width:item[2]*width/1960,height:item[3]*height/1080,material:item[4] || 'cream'}; });
}
if (typeof module !== 'undefined') module.exports = arenaWalls;
