/*

Mines placed by tanks
Extends: Rectangle

*/

var Vector2 = Vector2;
var Rectangle = Rectangle;
var Collision = Collision;
if (typeof window === 'undefined' && typeof require !== 'undefined') {
  Vector2 = require('../common/vector2');
  Rectangle = require('../common/rectangle');
  Collision = require('../common/collision');

  module.exports = Mine;
}

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
  this.countdown = 10;
}

Mine.prototype = Object.create(Rectangle.prototype);
Mine.prototype.constructor = Mine;

// Translate and draw bounding box
Mine.prototype.tick = function(map) {
  if (this.countdown < 1) {
    map.removeMine(this.id);
  }

  this.countdown--;
};

// Translate and draw bounding box
Mine.prototype.draw = function(context, camera) {
  context.moveTo(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y);
  context.arc(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y, 2, 0, 6, false);
};
