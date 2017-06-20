if (typeof require !== 'undefined') {
  module.exports = Vector2;
}

function Vector2(x, y) {
  if (typeof x === 'undefined') {
    x = 0;
  }

  if (typeof y === 'undefined') {
    y = 0;
  }

  this.x = x;
  this.y = y;
}

/**
 * Magnitude squared
 */
Vector2.prototype.magnitude = function() {
  return this.dot(this);
};

Vector2.prototype.set = function(x, y) {
  this.x = x;
  this.y = y;
  return this;
};

Vector2.prototype.add = function(x, y) {
  this.x += x;
  this.y += y;

  return this;
};

Vector2.prototype.subtract = function(x, y) {
  this.x -= x;
  this.y -= y;

  return this;
};

Vector2.prototype.multiply = function(scalar) {
  this.x *= scalar;
  this.y *= scalar;

  return this;
};

/**
 * Divide
 */
Vector2.prototype.divide = function(scalar) {
  this.x /= scalar;
  this.y /= scalar;

  return this;
};

/**
 * Distance to another vector
 */
Vector2.prototype.to = function(vector) {
  return new Vector2(vector.x - this.x, vector.y - this.y);
};

/**
 * Dot product
 */
Vector2.prototype.dot = function(vector) {
  return this.x * vector.x + this.y * vector.y;
};

/**
 * Cross product
 */
Vector2.prototype.cross = function(vector) {
  return this.x * vector.y - this.y * vector.x;
};

Vector2.prototype.negate = function() {
  return this.multiply(-1);
};

/**
 * Rotate this by theta radians around the point (x, y)
 */
Vector2.prototype.rotate = function(theta, x, y) {

  // Default point of rotation to the origin
  if (typeof x === 'undefined') {
    x = 0;
  }

  if (typeof y === 'undefined') {
    y = 0;
  }

  // Temporarily center vector around the origin
  this.x -= x;
  this.y -= y;

  // Rotate this vector
  var cos = Math.cos(theta);
  var sin = Math.sin(theta);
  this.x = this.x * cos - this.y * sin;
  this.y = this.x * sin + this.y * cos;

  // Re-center vector around (x, y)
  this.x += x;
  this.y += y;

  return this;
};

/**
 * Project this onto another vector
 */
Vector2.prototype.project = function(vector) {
  var dp = this.dot(vector);
  var m = vector.magnitude();

  // Magnitude of projected vector
  m = dp / m;

  return new Vector2(m * vector.x, m * vector.y);
};

/**
 * Get the right-handed normal to this vector
 */
Vector2.prototype.rightNormal = function() {
  return new Vector2(-this.y, this.x);
};

/**
 * Get the left-handed normal to this vector
 */
Vector2.prototype.leftNormal = function() {
  return new Vector2(this.y, -this.x);
};
