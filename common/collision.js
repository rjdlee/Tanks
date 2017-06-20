/**
 * Collision detection
 */

// Export a singleton
var Collision = new CollisionBase();

var Vector2 = Vector2;
if (typeof require !== 'undefined') {
  Vector2 = require('../common/vector2');

  module.exports = Collision;
}

function CollisionBase() {}

// Rough collision approximation to check if rectangle is close to the polygon
CollisionBase.prototype.near = function(polygon1, polygon2, radius) {

  // If no radius, use the combinaed radii plus a bit more
  if (!radius) {
    radius = polygon1.radius + polygon2.radius;
  }

  var hypot = Math.pow(polygon2.pos.x - polygon1.pos.x, 2) +
    Math.pow(polygon2.pos.y - polygon1.pos.y, 2);
  if (hypot <= Math.pow(radius, 2)) {
    return true;
  }

  return false;
};

/**
 * Find a collision between two polygons
 * http://www.dyn4j.org/2010/01/sat/#sat-axes
 *
 * @returns {Vector2} - 2D minimum translation vector to resolve collision
 */
CollisionBase.prototype.detect = function(polygon1, polygon2) {

  if (!this.near(polygon1, polygon2)) {
    return;
  }

  // Axis with the smallest amount of overlap is the minimum translation vector
  var overlap = Infinity;
  var smallest;

  // Parallel edges of a rectangle are redundant so no need to check them
  var edges1 = polygon1.edges.length === 4 ? polygon1.edges.slice(0, 2) : polygon1.edges;
  var edges2 = polygon2.edges.length === 4 ? polygon2.edges.slice(0, 2) : polygon2.edges;
  var edges = edges1.concat(edges2);

  for (var i = 0; i < edges.length; i++) {

    // Normalized normal of the edge
    var axis = edges[i].rightNormal().unitVector();

    // Project both polygons onto the axis
    var p1 = projectPolygon(polygon1, axis);
    var p2 = projectPolygon(polygon2, axis);

    // Check if projections overlap
    if (!overlapProjections(p1, p2)) {

      // Guaranteed to not overlap if projections don't overlap
      return;

    }

      // Amount of overlap between p1 and p2
      var o = getOverlapProjections(p1, p2);

      // Check for minimum
      if (o < overlap) {
        // Then set this one as the smallest
        overlap = o;
        smallest = axis;
      }
  }

  // No collision
  if (typeof smallest === 'undefined') {
    return;
  }

  // Minimum translation vector
  var mtv = smallest.unitVector();
  mtv.x *= overlap;
  mtv.y *= overlap;

  // Distance between centers of both polygons  
  var centerVector = new Vector2(polygon2.pos.x - polygon1.pos.x, polygon2.pos.y - polygon1.pos.y);

  // Reverse the direction of the mtv if needed
  if (centerVector.dot(mtv) >= 0) {
    mtv.x *= -1;
    mtv.y *= -1;
  }

  return mtv;
};

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

function projectPolygon(polygon, vector) {
    var vertices = polygon.boundingBox;

    var max = vector.dot(vertices[0]);
    var min = max;

    for (var i = 1; i < vertices.length; i++) {
        var dp = vector.dot(vertices[i]);
        if (dp < min) {
            min = dp;
        } else if (dp > max) {
            max = dp;
        }
    }

    return [min, max];
}
