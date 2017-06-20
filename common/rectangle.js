/*

Core geometry class with collision detection and a bounding box with matrix transformations

*/

var Vector2 = Vector2;
var Collision = Collision;
if (typeof require !== 'undefined') {
  Vector2 = require('../common/vector2');
    Collision = require('./collision');

  module.exports = Rectangle;
}

function Rectangle(config) {
  config = config || {};

  // Position relative to canvas context
  this.pos = config.pos ? new Vector2(config.pos.x, config.pos.y) : new Vector2(0, 0);
  this.lastPos = new Vector2(0, 0);
  this.offset = new Vector2(0, 0);

  // Speed is scalar, velocity is vector
  this.speed = 0;
  this.velocity = new Vector2(0, 0);

  // Total width and height
  this.width = config.width || 0;
  this.height = config.height || 0;

  // Used for optimizing bounding box calculations
  this.halfWidth = this.width / 2;
  this.halfHeight = this.height / 2;

  // Calculate a circle bounding box for preliminary collision detection
  this.radius = Math.sqrt(Math.pow(this.halfWidth, 2) + Math.pow(this.halfHeight, 2));

  this.boundingBox = [];
  this.boundingBoxBounds = [];
  this.edges = [];

  // The point for the rectangle to rotate around, if not an argument, set it to the center
  // Values are 0 to 1 where 0 is the top left
  var angleOrigin = config && config.transform && config.transform.origin ? config.transform.origin :
    new Vector2(0.5, 0.5);

  // Information about the rotation
  this.angle = {

    // The angle is clockwise from the positive x axis (3 o'clock...)
    rad: config && config.transform && config.transform.angle ? config.transform.angle : 0,
    speed: 0,

    // Sin and Cos are precomputed angle values used in bounding box calculations
    sin: 0,
    cos: 1,

    // Point to rotate the rectangle around
    origin: angleOrigin,

    // Pre-computed values to be used in the transformation matrix
    width: this.width * (angleOrigin.x - 0.5),
    height: this.height * (angleOrigin.y - 0.5)
  };

  // Bounding box: [ Top left, Top right, Bottom right, Bottom left ]
  this.setAngle(this.angle.rad);
}

// Sets the rectangle's position to x and y and updates its bounding box
Rectangle.prototype.setPos = function(x, y) {
  this.lastPos.set(this.pos.x, this.pos.y);
  this.pos.set(x, y);

  this.translateBoundingBox();
};

// Moves the rectangle's position by x and y and updates its bounding box
Rectangle.prototype.movePos = function(x, y) {
  this.lastPos.set(this.pos.x, this.pos.y);
  this.pos.add(x, y);

  this.translateBoundingBox();
};

// Sets the rectangle's speed and velocity
Rectangle.prototype.setVelocity = function(speed) {
  this.velocity.set(this.angle.cos, this.angle.sin);
  this.velocity.multiply(speed);

  this.speed = speed;
};

// Sets the rectangle's angle, direction of velocity, and updates its bounding box
Rectangle.prototype.setAngle = function(angle) {
  this.angle.rad = angle;
  this.angle.cos = Math.cos(angle);
  this.angle.sin = Math.sin(angle);

  if (this.speed !== 0) {
    this.setVelocity(this.speed);
  }

  this.rotateBoundingBox();
};

Rectangle.prototype.rotateBoundingBox = function() {
  // Use a rotation transform matrix: cos(θ) -sin(θ) 0
  //                  sin(θ) cos(θ)  0
  //                  0    0     1
  var cos = this.angle.cos,
    sin = this.angle.sin,
    offsetWidth = this.angle.width + this.halfWidth,
    offsetHeight = this.angle.height + this.halfHeight,
    offsetWidthMinus = -this.halfWidth + this.angle.width,
    offsetHeightMinus = -this.halfHeight + this.angle.height;

  // After applying the matrix, translate the shape to its (x,y) position
  this.boundingBox[0] = new Vector2(
    offsetWidth * cos - offsetHeight * sin + this.pos.x,
    offsetWidth * sin + offsetHeight * cos + this.pos.y
  );
  this.boundingBox[1] = new Vector2(
    offsetWidthMinus * cos - offsetHeight * sin + this.pos.x,
    offsetWidthMinus * sin + offsetHeight * cos + this.pos.y
  );
  this.boundingBox[2] = new Vector2(
    offsetWidthMinus * cos - offsetHeightMinus * sin + this.pos.x,
    offsetWidthMinus * sin + offsetHeightMinus * cos + this.pos.y
  );
  this.boundingBox[3] = new Vector2(
    offsetWidth * cos - offsetHeightMinus * sin + this.pos.x,
    offsetWidth * sin + offsetHeightMinus * cos + this.pos.y
  );

  this.updateEdges();
  this.updateBounds();
};

Rectangle.prototype.translateBoundingBox = function() {
  var deltaX = this.pos.x - this.lastPos.x;
  var deltaY = this.pos.y - this.lastPos.y;

  for (var i = 0; i < this.boundingBox.length; i++) {
    this.boundingBox[i].add(deltaX, deltaY);
  }

  this.updateEdges();
  // No need to update bounds since those are passed by reference
};

// Apply rotation and translation offsets to the bounding box
// 0: Bottom Right, 1: Bottom Left, 2: Top Left, 3: Top Right
Rectangle.prototype.updateEdges = function() {
  // Determine the edges of the shape
  this.edges[0] = new Vector2(
    this.boundingBox[1].x - this.boundingBox[0].x,
    this.boundingBox[1].y - this.boundingBox[0].y
    );
  this.edges[1] = new Vector2(
    this.boundingBox[2].x - this.boundingBox[1].x,
    this.boundingBox[2].y - this.boundingBox[1].y
  );
  this.edges[2] = new Vector2(
    this.boundingBox[3].x - this.boundingBox[2].x,
    this.boundingBox[3].y - this.boundingBox[2].y
  );
  this.edges[3] = new Vector2(
    this.boundingBox[0].x - this.boundingBox[3].x,
    this.boundingBox[0].y - this.boundingBox[3].y
  );
}

// Finds the minimum and maximum x and y bounds
Rectangle.prototype.updateBounds = function() {
  // Include the index of the edge boundaries
  var lowerBound = {
      x: this.boundingBox[0].x,
      y: this.boundingBox[0].y,
      xi: 0,
      yi: 0
    },
    upperBound = {
      x: this.boundingBox[0].x,
      y: this.boundingBox[0].y,
      xi: 0,
      yi: 0
    };

  for (var i = 1; i < 4; i++) {
    var currentBound = this.boundingBox[i];

    if (currentBound.x < lowerBound.x) {
      lowerBound.xi = i;
      lowerBound.x = currentBound.x;
    } else if (currentBound.x > upperBound.x) {
      upperBound.xi = i;
      upperBound.x = currentBound.x
    }

    if (currentBound.y < lowerBound.y) {
      lowerBound.yi = i;
      lowerBound.y = currentBound.y;
    } else if (currentBound.y > upperBound.y) {
      upperBound.yi = i;
      upperBound.y = currentBound.y;
    }
  }

  this.boundingBoxBounds[0] = lowerBound;
  this.boundingBoxBounds[1] = upperBound;
};

// Draw the bounding box onto the canvas context
Rectangle.prototype.drawBoundingBox = function(context, offsetX, offsetY) {
  var boundingBox = this.boundingBox;

  if (!offsetX)
    offsetX = 0;

  if (!offsetY)
    offsetY = 0;

  context.moveTo(boundingBox[0].x - offsetX, boundingBox[0].y - offsetY);
  context.lineTo(boundingBox[1].x - offsetX, boundingBox[1].y - offsetY);
  context.lineTo(boundingBox[2].x - offsetX, boundingBox[2].y - offsetY);
  context.lineTo(boundingBox[3].x - offsetX, boundingBox[3].y - offsetY);
  context.lineTo(boundingBox[0].x - offsetX, boundingBox[0].y - offsetY);

  // Use this to display the first point
  // context.arc( this.boundingBox[ 0 ].x, this.boundingBox[ 0 ].y, 2, 0, 6, false );
  // context.moveTo( this.boundingBox[ 0 ].x, this.boundingBox[ 0 ].y );
};

/**
 * Find a collision between two polygons
 *
 * @returns {Vector2} - 2D minimum translation vector to resolve collision
 */
  Rectangle.prototype.isRotatedRectangleCollision = function(polygon) {
      return Collision.detect(this, polygon);
};
