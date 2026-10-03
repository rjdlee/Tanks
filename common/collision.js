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

    // Touching edges are contact, not penetration. Ignore floating point dust.
    if (p1[1] <= p2[0] + 1e-7 || p2[1] <= p1[0] + 1e-7) {

      // Guaranteed to not overlap if projections don't overlap
      return;

    }

      // A contained interval must travel all the way to a face, not just its
      // own width. Choose the shortest signed separation on this axis.
      var negative = p1[1] - p2[0], positive = p2[1] - p1[0];
      var direction = negative <= positive ? -1 : 1;
      var o = Math.min(negative, positive);

      // Check for minimum
      if (o < overlap) {
        // Then set this one as the smallest
        overlap = o;
        smallest = axis.multiply(direction);
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

  return mtv;
};

// Continuous SAT: find the first contact over the proposed translation. This
// stops at the surface before penetration, including long catch-up movements.
CollisionBase.prototype.sweep = function(polygon1, polygon2, movement) {
  var penetration = this.detect(polygon1, polygon2);
  if (penetration) return {time: 0, normal: penetration.unitVector(), overlap: true};
  var entry = -Infinity, exit = Infinity, normal;
  var edges = polygon1.edges.slice(0, 2).concat(polygon2.edges.slice(0, 2));
  for (var i = 0; i < edges.length; i++) {
    var axis = edges[i].rightNormal().unitVector();
    if (axis.magnitude() === 0) continue;
    var a = projectPolygon(polygon1, axis), b = projectPolygon(polygon2, axis);
    var speed = movement.dot(axis);
    if (Math.abs(speed) < 1e-10) {
      if (a[1] <= b[0] + 1e-7 || b[1] <= a[0] + 1e-7) return;
      continue;
    }
    var first = (b[0] - a[1]) / speed, last = (b[1] - a[0]) / speed;
    var start = Math.min(first, last), end = Math.max(first, last);
    if (start > entry) { entry = start; normal = axis.multiply(speed > 0 ? -1 : 1); }
    exit = Math.min(exit, end);
    if (entry > exit + 1e-7) return;
  }
  if (!normal || entry < -1e-7 || entry > 1 || exit < 0) return;
  return {time: Math.max(0, entry), normal: normal, overlap: false};
};

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
