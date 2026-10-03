var Map = require('../common/map'),
  Wall = require('./wallRef'),
  arenaWalls = require('../common/arena');

function MapRef(width, height) {
  this.ref = {
    width: width,
    height: height,

    walls: [],

    players: new Object(),
    playersRef: new Object()
  };

  this.grid;
  this.tileSize = 50;

  Map.call(this, width, height);

  this.buildArena();
  this.addWallBorders();
}

MapRef.prototype = Object.create(Map.prototype);
MapRef.prototype.constructor = MapRef;

// Override the Map tick function to add grid functionality
MapRef.prototype.tick = function() {
  // Draw the players
  for (var i in this.players) {
    var player = this.players[i];
    // player.tick( this );
    // this.updateGridPos( player, 3 );
  }

  // Draw projectiles and check for collisions
  for (var i in this.projectiles) {
    var projectile = this.projectiles[i];
    projectile.tick(this);
    // this.updateGridPos( projectile, 4 );
  }

  // Clients report blast hits; the server only expires mines and frees their slots.
  var currentTime = Date.now();
  for (var id in this.mines) {
    if (currentTime >= this.mines[id].explodeTime) {
      this.removeMine(id);
    }
  }

  this.ticker++;
};

MapRef.prototype.updateGridPos = function(object, id) {
  var x = Math.floor(object.pos.x / this.tileSize),
    y = Math.floor(object.pos.y / this.tileSize);

  if (!('gridPos' in object))
    object.gridPos = {
      x: x,
      y: y
    };
  // No change in grid position
  else if (object.gridPos.y === y && object.gridPos.x === x)
    return false;

  if (object.gridPos.x < 0 || object.gridPos.x > this.width || object.gridPos.y < 0 || object.gridPos
    .y > this.height)
    return false;

  this.grid[object.gridPos.y][object.gridPos.x] = 0;

  if (x < 0 || x > this.width || y < 0 || y > this.height)
    return false;

  this.grid[y][x] = id;

  object.gridPos.x = x;
  object.gridPos.y = y;
};

MapRef.prototype.placePlayer = function(player) {
  if (!player)
    return false;

  // Enumerate candidates instead of an unbounded random retry loop. A dense
  // generated map must never exhaust a Worker's CPU while spawning a player.
  var candidates = [];
  for (var y = 1; y < this.grid.length - 1; y++) {
    for (var x = 1; x < this.grid[y].length - 1; x++) {
      var clear = true;
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          if (this.grid[y + dy][x + dx] !== 0) clear = false;
        }
      }
      if (clear) candidates.push({x: x, y: y});
    }
  }
  // The generated map keeps its outer grid cells empty. Their center leaves
  // the tank inside the border even when no interior 3x3 patch is available.
  var cell = candidates[Math.floor(Math.random() * candidates.length)];
  var pos = cell ? {x: cell.x * this.tileSize, y: cell.y * this.tileSize} :
    {x: this.tileSize * 1.5, y: this.tileSize * 1.5};
  player.setPos(pos.x, pos.y);
  player.gridPos.x = Math.floor(pos.x / this.tileSize);
  player.gridPos.y = Math.floor(pos.y / this.tileSize);
  player.ref.pos = player.pos;
  player.translateBoundingBox();
  return player.pos;
};

MapRef.prototype.buildArena = function() {
  var columns = Math.floor(this.width / this.tileSize);
  var rows = Math.floor(this.height / this.tileSize);
  this.grid = [];
  for (var y = 0; y < rows; y++) this.grid.push(Array.from({length:columns}, function(_, x) { return y === 0 || y === rows - 1 || x === 0 || x === columns - 1 ? 1 : 0; }));
  arenaWalls(this.width, this.height).forEach(function(item) {
    var wall = new Wall(item.x, item.y, item.width, item.height);
    wall.material = wall.ref.material = item.material;
    this.walls.push(wall);
    this.ref.walls.push(wall.ref);
    // Mark every tile intersecting a solid obstacle; spawn selection checks a
    // clear 3x3 patch so tanks never appear inside the decorative geometry.
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < columns; x++) {
        if (Math.abs(x * this.tileSize - item.x) <= (item.width + this.tileSize) / 2 &&
            Math.abs(y * this.tileSize - item.y) <= (item.height + this.tileSize) / 2) this.grid[y][x] = 1;
      }
    }
  }, this);
};

module.exports = function(width, height) {
  return new MapRef(width, height);
};
