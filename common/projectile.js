/*

Describes tank bullets with constant velocity
Extends: Rectangle

*/

var Rectangle = Rectangle || require('../common/rectangle');
var Vector2 = Vector2 || require('../common/vector2');
module.exports = Projectile;

function Projectile(pid, x, y, angle, speed) {
  // Extend the Rectangle class
  Rectangle.call(this, {
    pos: new Vector2(x, y),
    width: 5,
    height: 2.5,
    transform: {
      angle: angle
    }
  });

  this.id = Math.random().toString();

  // Player who shot this projectile's id
  this.pid = pid || '';

  this.speed = speed || -3;
  this.velocity = new Vector2(Math.cos(angle), Math.sin(angle));
  this.velocity.multiply(this.speed);

  this.bounceCount = 0;
}

Projectile.prototype = Object.create(Rectangle.prototype);
Projectile.prototype.constructor = Projectile;

/** 
 * Bounce off an unrotated rectangle or map boundary
 * 
 * @param {Vector2} mtv - Minimum translation vector from collision detection
 * @returns {Boolean} - Whether the projectile bounced or "died"
 */
Projectile.prototype.bounce = function(mtv) {

  // Move backwards to undo collision
  this.movePos(-this.velocity.x, -this.velocity.y);

  // Allow projectile to bounce just once
  if (this.bounceCount > 0) {
    return false;
  }

  this.bounceCount++;

  // Reflect the projectile off the colliding edge
  if (mtv.y !== 0) {
    this.setAngle(-this.angle.rad);
  } else {
    if (this.angle.rad < 0) {
      this.setAngle(-Math.PI - this.angle.rad);
    } else {
      this.setAngle(Math.PI - this.angle.rad);
    }
  }

  return true;
};

// Move along velocity and check for map boundary, wall, and player collisions. 
Projectile.prototype.translate = function(map) {
  // Move with either the same velocity or a reversed velocity from colliding
  this.movePos(this.velocity.x, this.velocity.y);

  var mtv;

  // Check for a collision with map boundaries or walls
  for (var id in map.walls) {
    var wall = map.walls[id];

    mtv = this.isRotatedRectangleCollision(wall);
    if (typeof mtv !== 'undefined') {
      if (!this.bounce(mtv)) {
        map.removeProjectile(this.id);
        return;
      }
    }
  }

  for (var id in map.projectiles) {

    // Don't collide with itself
    if (id === this.id) {
      break;
    }

    var projectile = map.projectiles[id];

    mtv = this.isRotatedRectangleCollision(projectile);
    if (typeof mtv !== 'undefined') {
      map.removeProjectile(this.id);
      map.removeProjectile(id);
      return;
    }
  }

  // Bullet collide with tanks
  for (var id in map.players) {
    const player = map.players[id];
    var collision = this.isRotatedRectangleCollision(player);
    if(!collision) {
      continue;
    }

    map.removeProjectile(this.id);

    // The user object has a key attribute, but the player does not.
    // Only send the event if the user is hit
    if ('key' in player) {
      connect.pushStateEvent('hit', this.pid);
    }
  }
};

// Translate and draw bounding box
Projectile.prototype.tick = function(map) {
  var collision = this.translate(map);
  if (collision) {
    map.removeProjectile(this.id);

    if (collision in map.players) {
      // The user object has a key attribute, but the player does not.
      // Only send the event if the user is hit
      if ('key' in map.players[collision])
        connect.pushStateEvent('hit', this.pid);
    }
  }
};

// Translate and draw bounding box
Projectile.prototype.draw = function(context, camera) {
  this.drawBoundingBox(context, camera.pos.x, camera.pos.y);
};
