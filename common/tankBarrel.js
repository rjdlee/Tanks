function TankBarrel(x, y) {
  // Extend the Rectangle class
  Rectangle.call(this, {
    pos: new Vector2(x, y),
    width: 50,
    height: 5,
    transform: {
      origin: new Vector2(0, 0.5)
    }
  });
}

TankBarrel.prototype = Object.create(Rectangle.prototype);
TankBarrel.prototype.constructor = TankBarrel;

TankBarrel.prototype.setAngle = function(angle) {
  Rectangle.prototype.setAngle.call(this, angle);
};

// Rotates to point at the (x, y) arguments
TankBarrel.prototype.setPosAngle = function(x, y, camera) {
  this.setAngle(Math.atan2(this.pos.y - y - camera.pos.y, this.pos.x - x - camera.pos.x));
};
