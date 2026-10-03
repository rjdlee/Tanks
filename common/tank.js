/*

The main body of a tank with collision handling
Extends: Rectangle

*/

var Collision = Collision;
var Vector2 = Vector2;
var Rectangle = Rectangle;
var TankBarrel = TankBarrel;
var Projectile = Projectile;
var Mine = Mine;
if (typeof require !== 'undefined') {
    Collision = require('./collision');
    Rectangle = require('./rectangle');
    TankBarrel = require('./tankBarrel');
    Vector2 = require('../common/vector2');
    Projectile = require('./projectile');
    Mine = require('./mine');

    module.exports = Tank;
}

function Tank(x, y, angle) {
  // Extend the Rectangle class
  Rectangle.call(this, {
    pos: new Vector2(x, y),
    // Match the 60 x 38 toy hull drawn by the frontend (not its shadow/cannon).
    width: 60,
    height: 38,
    transform: {
      angle: angle || 0
    }
  });

  this.barrel = new TankBarrel(x, y);
  this.projectiles = [];
  this.mines = [];
}

Tank.prototype = Object.create(Rectangle.prototype);
Tank.prototype.constructor = Tank;

// Sets the tank body and barrel position
Tank.prototype.setPos = function(x, y) {
  Rectangle.prototype.setPos.call(this, x, y);
  this.barrel.setPos(x, y);
};

// Moves the tank body and barrel position
Tank.prototype.movePos = function(x, y) {
  Rectangle.prototype.movePos.call(this, x, y);
  this.barrel.movePos(x, y);
};

// Remote tanks render behind their latest network positions. Use their latest
// collision body so interpolation/extrapolation cannot shove the local tank.
function tankObstacles(tank, walls, players) {
  var obstacles = (walls || []).map(function(wall) { return {body: wall, peer: false}; });
  Object.keys(players || {}).sort().forEach(function(id) {
    var player = players[id];
    if (player === tank || (tank.id !== undefined && player.id === tank.id)) return;
    obstacles.push({body: player.collisionBody || player, peer: true});
  });
  return obstacles;
}

// Move to the first contact, then spend the remaining movement along its
// tangent. No contact is allowed to add movement or eject an overlapping peer.
Tank.prototype.moveWithCollisions = function(dx, dy, walls, players) {
  var remaining = new Vector2(dx, dy), startX = this.pos.x, startY = this.pos.y;
  var obstacles = tankObstacles(this, walls, players);
  for (var iteration = 0; iteration < 4 && remaining.magnitude() > 1e-12; iteration++) {
    var hit = null;
    for (var i = 0; i < obstacles.length; i++) {
      var obstacle = obstacles[i], contact = Collision.sweep(this, obstacle.body, remaining);
      if (!contact) continue;
      if (contact.overlap && obstacle.peer) {
        // A delayed peer can arrive already overlapping. Stop approaching it,
        // but allow escape; never apply its full penetration as a position jump.
        var away = obstacle.body.pos.to(this.pos);
        if (away.magnitude() < 1e-10) continue;
        contact.normal = away.unitVector();
      }
      if (remaining.dot(contact.normal) >= -1e-10) continue;
      if (!hit || contact.time < hit.time) hit = contact;
    }
    if (!hit) { this.movePos(remaining.x, remaining.y); break; }
    var length = Math.sqrt(remaining.magnitude());
    var travel = Math.max(0, hit.time - .001 / length);
    this.movePos(remaining.x * travel, remaining.y * travel);
    remaining.multiply(1 - travel);
    var inward = remaining.dot(hit.normal);
    remaining.subtract(hit.normal.x * inward, hit.normal.y * inward);
  }
  return new Vector2(this.pos.x - startX, this.pos.y - startY);
};

// Rotation is limited at contact instead of translating the center to fit.
Tank.prototype.rotate = function(boundX, boundY, walls, players) {
  if (!this.angle.speed) return false;
  var angle = this.angle.rad, delta = this.angle.speed;
  var obstacles = tankObstacles(this, walls, players);
  var depths = obstacles.map(function(obstacle) {
    var overlap = Collision.detect(this, obstacle.body);
    return overlap ? Math.sqrt(overlap.magnitude()) : 0;
  }, this);
  function blocked(fraction) {
    this.setAngle(angle + delta * fraction);
    for (var i = 0; i < obstacles.length; i++) {
      var overlap = Collision.detect(this, obstacles[i].body);
      if (overlap && Math.sqrt(overlap.magnitude()) > depths[i] + 1e-7) return true;
    }
    return false;
  }
  var fraction = 1;
  if (blocked.call(this, 1)) {
    var low = 0, high = 1;
    for (var iteration = 0; iteration < 10; iteration++) {
      var middle = (low + high) / 2;
      if (blocked.call(this, middle)) high = middle;
      else low = middle;
    }
    fraction = low;
  }
  var next = angle + delta * fraction;
  if (Math.abs(next) >= Math.PI * 2) next = Math.atan2(Math.sin(next), Math.cos(next));
  this.setAngle(next);
  return fraction > 0;
};

Tank.prototype.translate = function(boundX, boundY, walls, players) {
  this.rotate(boundX, boundY, walls, players);
  // Legacy correction offsets are linear and bounded; squared lengths could
  // turn a modest correction into a huge jump before collision resolution.
  var length = Math.sqrt(this.offset.magnitude());
  var correction = length > .01 ? this.offset.unitVector().multiply(Math.min(length / 10, 1.5)) : new Vector2();
  this.offset.subtract(correction.x, correction.y);
  if (!this.speed && correction.magnitude() === 0) return false;
  this.moveWithCollisions(this.velocity.x + correction.x, this.velocity.y + correction.y, walls, players);
  return true;
};

// Fire a projectile from the end of barrel and return the reference
Tank.prototype.shoot = function(projectiles) {

  // Ensure barrel's bounding box is up to date
  this.barrel.rotateBoundingBox();

  var angle = this.barrel.angle.rad;
  var x = this.barrel.edges[0].x * 1.1 + this.pos.x;
  var y = this.barrel.edges[0].y * 1.1 + this.pos.y;
  var projectile = new Projectile(this.id, x, y, this.barrel.angle.rad);

  projectiles[projectile.id] = projectile;
  this.projectiles.push(projectile);

  return projectile;
};

// Fire a projectile from the end of barrel and return the reference
Tank.prototype.drop = function(mines) {

  if (this.mines.length >= 2) {
    return;
  }

  var mine = new Mine(this.id, this.pos.x, this.pos.y);

  mines[mine.id] = mine;
  this.mines.push(mine);

  return mine;
};

// Returns true if there is a collision between this tank and a tank from players
Tank.prototype.isTankCollision = function(players) {
  for (var id in players) {
    // Don't check this tank with itself
    if (players[id].id === this.id) {
      continue;
    }

    // Return if a collision is found
    var unitVector = this.isRotatedRectangleCollision(players[id]);
    if (unitVector) {
      return unitVector;
    }
  }

  return false;
};
