/*

Mines placed by tanks
Extends: Rectangle

*/

var Vector2 = Vector2 || require('../common/vector2');
var Rectangle = Rectangle || require('../common/rectangle');
var Collision = Collision || require('../common/collision');

module.exports = Mine;

var COUNTDOWN_TIME = 2000; // ms
var EXPLODE_TIME = 1000; // ms

function Mine(pid, x, y) {
  // Extend the Rectangle class
  Rectangle.call(this, {
    pos: new Vector2(x, y),
    width: 2,
    height: 2,
  });

  this.id = Math.random().toString();

  // Owner
  this.pid = pid || '';

  // Time until explosion
  this.countdownTime = Date.now() + COUNTDOWN_TIME;
  this.explodeTime = this.countdownTime + EXPLODE_TIME;
}

Mine.prototype = Object.create(Rectangle.prototype);
Mine.prototype.constructor = Mine;

Mine.prototype.explode = function(map) {
  for (var id in map.players) {
    var player = map.players[id];

    if (Collision.near(this, player, 25 + player.radius)) {
      // The user object has a key attribute, but the player does not.
      // Only send the event if the user is hit
      if ('key' in player) {
        connect.pushStateEvent('hit', this.pid);
      }
    }
  }
}

// Translate and draw bounding box
Mine.prototype.tick = function(map) {
  var currentTime = Date.now();

  if (currentTime >= this.countdownTime) {
    this.explode(map);
  }

  if (currentTime >= this.explodeTime) {
    map.removeMine(this.id);
  }
};

// Translate and draw bounding box
Mine.prototype.draw = function(context, camera) {
  var pos = camera.pos.to(this.pos);
  var currentTime = Date.now();

  if (currentTime >= this.countdownTime) {
    context.moveTo(pos.x + 25, pos.y);
    context.arc(pos.x, pos.y, 25, 0, 2 * Math.PI, false);
  } else {
    context.moveTo(pos.x + 2, pos.y);
    context.arc(pos.x, pos.y, 2, 0, 2 * Math.PI, false);
  }
};
