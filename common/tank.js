/*

The main body of a tank with collision handling
Extends: Rectangle

*/

var Collision = Collision || require('../common/collision');
var Projectile = Projectile || require('../common/projectile');
var Rectangle = Rectangle || require('../common/rectangle');
var TankBarrel = TankBarrel || require('../common/tankBarrel');
var Vector2 = Vector2 || require('../common/vector2');
module.exports = Tank;

function Tank(x, y, angle) {
  // Extend the Rectangle class
  Rectangle.call(this, {
    pos: new Vector2(x, y),
    width: 50,
    height: 25,
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

// Translate by current velocity; uses speed and velocity for translation
Tank.prototype.translate = function(boundX, boundY, walls, players) {

    const offsetMagnitude = this.offset.magnitude() / 10;
    const offsetAngle = Math.atan2(this.offset.y, this.offset.x) || 0;
    const offsetX = offsetMagnitude * Math.cos(offsetAngle);
    const offsetY = offsetMagnitude * Math.sin(offsetAngle);

  // No speed means no move
  if (this.speed || Math.abs(offsetX) > 0.5 || Math.abs(offsetY) > 0.5) {
    this.offset.x -= offsetX;
    this.offset.y -= offsetY;

    const deltaX = this.velocity.x + offsetX;
    const deltaY = this.velocity.y + offsetY;
    this.movePos(deltaX, deltaY);
  }

  if (this.angle.speed) {
    // Reset angle when it goes over 2π, otherwise increment it by speed
    if (Math.abs(this.angle) >= 6.283185) {
      this.setAngle(0);
    } else {
      this.setAngle(this.angle.rad + this.angle.speed);
    }
  }

  if (!this.speed && !this.angle.speed) {
    return false;
  }

  // Check for collisions with walls
  for (var id in walls) {
    var wall = walls[id];

    var mtv = this.isRotatedRectangleCollision(wall);
    if (mtv) {
      this.movePos(mtv.x, mtv.y);
      collision = true;
    }
  }

  // Check for collisions with other tanks and cancel velocity in the direction of the tank
  unitVector = this.isTankCollision(players);
  if (unitVector) {
    this.movePos(unitVector.x, unitVector.y);
    collision = true;
  }

  return true;
};

// Convenience method for rotate; uses angle.speed for rotation
Tank.prototype.rotate = function(boundX, boundY, walls, players) {
  // Don't perform any transforms if there is no radial velocity
  // if (!this.angle.speed)
  //   return false;

  // // Reset angle when it goes over 2π, otherwise increment it by speed
  // if (Math.abs(this.angle) >= 6.283185)
  //   this.setAngle(0);
  // else
  //   this.setAngle(this.angle.rad + this.angle.speed);

  // // Rotate off of walls
  // for (var id in walls) {
  //   var wall = walls[id];

  //   var mtv = this.isRotatedRectangleCollision(wall);
  //   if (mtv) {
  //     this.movePos(mtv.x, mtv.y);
  //   }
  // }

  // // Check for collisions with other tanks and cancel velocity in the direction of the tank
  // var unitVector = this.isTankCollision(players);
  // if (unitVector) {
  //   // Shift the position by the tangential velocity projected onto the unit vector
  //   var tangentialVelocity = this.radius * this.angle.speed;
  //   this.movePos(tangentialVelocity * unitVector.x, tangentialVelocity * unitVector.y);

  //   return true;
  // }

  return;
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
