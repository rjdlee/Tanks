/*

Core geometry class with collision detection and a bounding box with matrix transformations

*/

function Rectangle(config) {
  // Position relative to canvas context
  this.pos = config && config.pos ? config.pos : {
    x: 0,
    y: 0
  };
  this.lastPos = {
    x: 0,
    y: 0
  };

  // Speed is scalar, velocity is vector
  this.speed = 0;
  this.velocity = {
    x: 0,
    y: 0
  };

  // Total width and height
  this.width = config && config.width ? config.width : 0;
  this.height = config && config.height ? config.height : 0;

  // Used for optimizing bounding box calculations
  this.halfWidth = this.width / 2;
  this.halfHeight = this.height / 2;

  // Calculate a circle bounding box for preliminary collision detection
  this.radius = Math.sqrt(Math.pow(this.halfWidth, 2) + Math.pow(this.halfHeight, 2));

  this.boundingBox = [];
  this.edges = [];

  // The point for the rectangle to rotate around, if not an argument, set it to the center
  // Values are 0 to 1 where 0 is the top left
  var angleOrigin = config && config.transform && config.transform.origin ? config.transform.origin :
    {
      x: 0.5,
      y: 0.5,
    };

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
  this.lastPos.x = this.pos.x;
  this.lastPos.y = this.pos.y;

  this.pos.x = x;
  this.pos.y = y;

  this.translateBoundingBox();
};

// Moves the rectangle's position by x and y and updates its bounding box
Rectangle.prototype.movePos = function(x, y) {
  this.lastPos.x = this.pos.x;
  this.lastPos.y = this.pos.y;

  this.pos.x += x;
  this.pos.y += y;

  this.translateBoundingBox();
};

// Sets the rectangle's speed and velocity
Rectangle.prototype.setVelocity = function(speed) {
  this.speed = speed;
  this.velocity.x = speed * this.angle.cos;
  this.velocity.y = speed * this.angle.sin;
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
  this.boundingBox[0] = {
    x: offsetWidth * cos - offsetHeight * sin + this.pos.x,
    y: offsetWidth * sin + offsetHeight * cos + this.pos.y
  };
  this.boundingBox[1] = {
    x: offsetWidthMinus * cos - offsetHeight * sin + this.pos.x,
    y: offsetWidthMinus * sin + offsetHeight * cos + this.pos.y
  };
  this.boundingBox[2] = {
    x: offsetWidthMinus * cos - offsetHeightMinus * sin + this.pos.x,
    y: offsetWidthMinus * sin + offsetHeightMinus * cos + this.pos.y
  };
  this.boundingBox[3] = {
    x: offsetWidth * cos - offsetHeightMinus * sin + this.pos.x,
    y: offsetWidth * sin + offsetHeightMinus * cos + this.pos.y
  };

  this.updateEdges();
  this.updateBounds();
};

Rectangle.prototype.translateBoundingBox = function() {
  var deltaX = this.pos.x - this.lastPos.x,
    deltaY = this.pos.y - this.lastPos.y;

  for (var i = 0; i < this.boundingBox.length - 2; i++) {
    this.boundingBox[i].x += deltaX;
    this.boundingBox[i].y += deltaY;
  }

  this.updateEdges();
};

// Apply rotation and translation offsets to the bounding box
// 0: Bottom Right, 1: Bottom Left, 2: Top Left, 3: Top Right
Rectangle.prototype.updateEdges = function() {
  // Determine the edges of the shape
  this.edges[0] = {
    x: this.boundingBox[1].x - this.boundingBox[0].x,
    y: this.boundingBox[1].y - this.boundingBox[0].y
  };
  this.edges[1] = {
    x: this.boundingBox[2].x - this.boundingBox[1].x,
    y: this.boundingBox[2].y - this.boundingBox[1].y
  };
  this.edges[2] = {
    x: this.boundingBox[3].x - this.boundingBox[2].x,
    y: this.boundingBox[3].y - this.boundingBox[2].y
  };
  this.edges[3] = {
    x: this.boundingBox[0].x - this.boundingBox[3].x,
    y: this.boundingBox[0].y - this.boundingBox[3].y
  };
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
      upperBound.x = currentBound.boundX
    }

    if (currentBound.y < lowerBound.y) {
      lowerBound.yi = i;
      lowerBound.y = currentBound.y;
    } else if (currentBound.y > upperBound.y) {
      upperBound.yi = i;
      upperBound.y = currentBound.y;
    }
  }

  this.boundingBox[4] = lowerBound;
  this.boundingBox[5] = upperBound;
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

// Rough collision approximation to check if rectangle is close to the polygon
Rectangle.prototype.isRadiusCollision = function(polygon, radius) {

  // If no radius, use the combinaed radii plus a bit more
  if (!radius) {
    radius = this.radius + polygon.radius + 20;
  }

  var hypot = Math.pow(polygon.pos.x - this.pos.x, 2) + Math.pow(polygon.pos.y - this.pos.y, 2);
  if (hypot <= Math.pow(radius, 2)) {
    return true;
  }

  return false;
};

/**
 * Find a collision between two polygons
 *
 * @returns {Vector2} - 2D minimum translation vector to resolve collision
 */
Rectangle.prototype.isRotatedRectangleCollision = function(polygon) {

  if (!this.isRadiusCollision(polygon)) {
    return;
  }

  // Axis with the smallest amount of overlap is the minimum translation vector
  var overlap = Infinity;
  var smallest;

  // Parallel edges of a rectangle are redundant so no need to check them
  var edges1 = this.edges.length === 4 ? this.edges.slice(0, 2) : this.edges;
  var edges2 = polygon.edges.length === 4 ? polygon.edges.slice(0, 2) : polygon.edges;
  var edges = edges1.concat(edges2);

  for (var i = 0; i < edges.length; i++) {

    // Normalized normal of the edge
    var axis = getUnitVector(normal(edges[i]));

    // Project both polygons onto the axis
    var p1 = projectPolygon(this, axis);
    var p2 = projectPolygon(polygon, axis);

    // Check if projections overlap
    if (!overlapProjections(p1, p2)) {

      // Guaranteed to not overlap if projections don't overlap
      return;

    } else {

      // Amount of overlap between p1 and p2
      var o = getOverlapProjections(p1, p2);

      // Check for minimum
      if (o < overlap) {
        // Then set this one as the smallest
        overlap = o;
        smallest = axis;
      }

    }

  }

  // No collision
  if (typeof smallest === 'undefined') {
    return;
  }

  // Minimum translation vector
  var mtv = getUnitVector(smallest);
  mtv.x *= overlap;
  mtv.y *= overlap;

  // Distance between centers of both polygons  
  var centerVector = {
    x: polygon.pos.x - this.pos.x,
    y: polygon.pos.y - this.pos.y,
  };

  // Reverse the direction of the mtv if needed
  if (dotProduct(centerVector, mtv) >= 0) {
    mtv.x *= -1;
    mtv.y *= -1;
  }

  return mtv;
};

function projectPolygon(polygon, vector) {
  var vertices = polygon.boundingBox;

  var max = dotProduct(vector, vertices[0]);
  var min = max;

  for (var i = 1; i < vertices.length - 2; i++) {
    var dp = dotProduct(vector, vertices[i]);

    if (dp < min) {
      min = dp;
    } else if (dp > max) {
      max = dp;
    }
  }

  return [min, max];
}

function overlapProjections(projection1, projection2) {
  var min1 = projection1[0];
  var max1 = projection1[1];
  var min2 = projection2[0];
  var max2 = projection2[1];

  return !(min1 > max2 || min2 > max1);
}

function getOverlapProjections(projection1, projection2) {
  var min1 = projection1[0];
  var max1 = projection1[1];
  var min2 = projection2[0];
  var max2 = projection2[1];

  return Math.min(max1, max2) - Math.max(min1, min2);
}

function normal(vector) {
  return {
    x: -vector.y,
    y: vector.x,
  };
}

function dotProduct(vectorA, vectorB) {
  return vectorA.x * vectorB.x + vectorA.y * vectorB.y;
}

function getUnitVector(vector) {
  var length = vector.x * vector.x + vector.y * vector.y;
  return {
    x: vector.x * vector.x / length,
    y: vector.y * vector.y / length,
  };
}

// Efficient approximation for the square root of a and b
function sqrtApprox(a, b) {
  // https://stackoverflow.com/questions/3506404/fast-hypotenuse-algorithm-for-embedded-processor
  return 4142 * Math.abs(a) / 10000 + Math.abs(b);
}
