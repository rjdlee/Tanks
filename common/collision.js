/**
 * Collision detection
 */

var Vector2 = Vector2;
if (typeof window === 'undefined' && typeof require !== 'undefined') {
  Vector2 = require('../common/vector2');

  module.exports = Collision;
}

function Collision() {}

// Rough collision approximation to check if rectangle is close to the polygon
Collision.prototype.near = function(polygon1, polygon2, radius) {

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
Collision.prototype.detect = function(polygon1, polygon2) {

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
    var axis = getUnitVector(normal(edges[i]));

    // Project both polygons onto the axis
    var p1 = projectPolygon(polygon1, axis);
    var p2 = projectPolygon(polygon2, axis);

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
    x: polygon2.pos.x - polygon1.pos.x,
    y: polygon2.pos.y - polygon1.pos.y,
  };

  // Reverse the direction of the mtv if needed
  if (dotProduct(centerVector, mtv) >= 0) {
    mtv.x *= -1;
    mtv.y *= -1;
  }

  return mtv;
};
