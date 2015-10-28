(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _utilVector = require('util/vector');

var _utilVector2 = _interopRequireDefault(_utilVector);

var Collision = (function () {
	function Collision() {
		_classCallCheck(this, Collision);

		this.edge;
		this.overlap;
	}

	// Determine if there is a collision with rectangle

	_createClass(Collision, [{
		key: 'is_colliding',
		value: function is_colliding(rectangle_a, rectangle_b) {
			if (!is_near(rectangle_a, rectangle_b)) return false;

			if (rectangle_b.angle === 0) return is_colliding_with_unrotated(rectangle_a, rectangle_b);

			if (rectangle_a.angle === 0) return is_colliding_with_unrotated(rectangle_b, rectangle_a);

			return is_colliding_with_rotated(rectangle_a, rectangle_b);
		}

		// Rough collision approximation to check if rectangle is close to the polygon
	}, {
		key: 'is_near',
		value: function is_near(rectangle_a, rectangle_b, radius) {
			// If no radius, use the combinaed radii plus a bit more
			if (!radius) radius = rectangle_a.radius + rectangle_b.radius;

			var distance = Util.sqrt_approximation(rectangle_b.pos.x - rectangle_a.pos.x, rectangle_b.pos.y - rectangle_a.pos.y);
			if (distance <= radius) return true;
		}

		// Check for a collision between rotated or unrotated rectangle_a and unrotated rectangle_b
	}, {
		key: 'is_colliding_with_unrotated',
		value: function is_colliding_with_unrotated(rectangle_a, rectangle_b) {
			var bounding_box_a = rectangle_a.boundingBox,
			    bounding_box_b = rectangle_b.boundingBox;

			// Iterate through the bounds of this
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = bounding_box_a.length[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					vertex = _step.value;

					// Calculate the overlaps of the x and y position of the wall and bound
					overlaps = [vertex.y - bounding_box_b[0].y, vertex.x - bounding_box_b[1].x, vertex.y - bounding_box_b[2].y, vertex.x - bounding_box_b[3].x];

					// If the bound is contained within the wall
					if (overlaps[0] <= 0 && overlaps[1] >= 0 && overlaps[2] >= 0 && overlaps[3] <= 0) {
						var edges = rectangle.edges,
						    edge = 0,
						    overlap = -overlaps[0];

						// Find the side of least overlap
						for (var i = 1; i < 4; i++) {
							if (Math.abs(overlaps[i]) < Math.abs(overlap)) {
								edge = i;
								overlap = -overlaps[i];
							}
						}

						this.overlap = overlap;
						this.edge = {
							x: Math.sign(edges[edge].x),
							y: Math.sign(edges[edge].y)
						};

						return true;
					}
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator['return']) {
						_iterator['return']();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}
		}

		// Check for a collision between two rotated rectangles
	}, {
		key: 'is_colliding_with_rotated',
		value: function is_colliding_with_rotated(rectangle_a, rectangle_b) {
			if (is_separating_axis(rectangle_a, rectangle_b, true)) return true;

			if (is_separating_axis(rectangle_a, rectangle_b, false)) return true;
		}

		// Determine if rectangle_a's axes separate rectangle_a from rectangle_b
	}, {
		key: 'is_separating_axis',
		value: function is_separating_axis(rectangle_a, rectangle_b, isAMoving) {
			// https://stackoverflow.com/questions/115426/algorithm-to-detect-intersection-of-two-rectangles?rq=1
			// http://imgur.com/bNwrzsv

			var edges = rectangle_a.edges,
			    leastOverlap = Infinity,
			    leastOverlapEdge = 0,
			    separatingAxis = false,
			    oppositeSides,
			    normal,
			    currentPoint,
			    nextPoint,
			    shapeVector,
			    shape1DotProduct,
			    shape1DotProductSign;

			for (var i = 0; i < edges.length; i++) {
				oppositeSides = true;

				normal = {
					x: -edges[i].y,
					y: edges[i].x
				};

				currentPoint = rectangle_a.boundingBox[i];
				nextPoint = i < 2 ? rectangle_a.boundingBox[i + 2] : rectangle_a.boundingBox[i - 2];

				shapeVector = {
					x: nextPoint.x - currentPoint.x,
					y: nextPoint.y - currentPoint.y
				};
				shape1DotProduct = shapeVector.x * normal.x + shapeVector.y * normal.y;
				shape1DotProductSign = shape1DotProduct >= 0;

				var min = Infinity,
				    max = -Infinity;
				for (var j = 0; j < 4; j++) {
					nextPoint = rectangle_b.boundingBox[j];

					shapeVector = {
						x: nextPoint.x - currentPoint.x,
						y: nextPoint.y - currentPoint.y
					};

					var shape2DotProduct = shapeVector.x * normal.x + shapeVector.y * normal.y,
					    shape2DotProductSign = shape2DotProduct >= 0;

					if (shape2DotProductSign === shape1DotProductSign) oppositeSides = false;

					if (shape2DotProduct < min) min = shape2DotProduct;else if (shape2DotProduct > max) max = shape2DotProduct;
				}

				if (oppositeSides) {
					separatingAxis = true;

					if (isAMoving) break;
				}

				var overlap;
				if (min < shape1DotProduct) overlap = max - shape1DotProduct;else overlap = max - min;

				if (overlap < leastOverlap) {
					leastOverlap = overlap;
					leastOverlapEdge = i;
				}
			}

			this.edge = leastOverlapEdge;
			this.overlap = leastOverlap;

			return true;
		}
	}]);

	return Collision;
})();

exports['default'] = Collision;
module.exports = exports['default'];

},{"util/vector":14}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _utilVector = require('util/vector');

var _utilVector2 = _interopRequireDefault(_utilVector);

var BoundingBox = (function () {
	function BoundingBox() {
		var vertices = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
		var angle = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
		var transform_origin_x = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
		var transform_origin_y = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];

		_classCallCheck(this, BoundingBox);

		this.vertices = vertices;
		this.edges = Array(vertices.length);
		this.bounds = Array(2);

		this.rotate(angle, transform_origin_x, transform_origin_y);
	}

	// Rotate bounding box around origin

	_createClass(BoundingBox, [{
		key: 'rotate',
		value: function rotate() {
			var dAngle = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
			var transform_origin_x = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
			var transform_origin_y = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

			var cos = Math.cos(dAngle),
			    sin = Math.sin(dAngle),
			    rotation_matrix_2d = [[cos, -sin], [sin, cos]],
			    pos_array = Array(2);

			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = this.vertices[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var vertex = _step.value;

					pos_array[0] = vertex.x - transform_origin_x;
					pos_array[1] = vertex.y - transform_origin_y;

					var new_pos = this.multiply_matrices(rotation_matrix_2d, pos_array);

					vertex.x = new_pos[0][0] + transform_origin_x;
					vertex.y = new_pos[0][1] + transform_origin_y;
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator['return']) {
						_iterator['return']();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			this.update_edges();
			this.update_bounds();
		}

		// Translate bounding box
	}, {
		key: 'translate',
		value: function translate() {
			var dX = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
			var dY = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = this.vertices[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var vertex = _step2.value;

					vertex.x += dX;
					vertex.y += dY;
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2['return']) {
						_iterator2['return']();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}

			this.update_edges();
			this.update_bounds();
		}

		// Creates a vector for each edge of the shape
	}, {
		key: 'update_edges',
		value: function update_edges() {
			var num_vertices = this.vertices.length;
			for (var i = 0; i < num_vertices; i++) {
				var vertex = this.vertices[i],
				    next_vertex = i === num_vertices - 1 ? this.vertices[0] : this.vertices[i + 1];

				this.edges[i] = next_vertex.subtract(vertex);
			}
		}

		// Finds the minimum and maximum x and y coordinates of the shape
	}, {
		key: 'update_bounds',
		value: function update_bounds() {
			// Include the index of the edge boundaries
			var lowerBound = {
				x: this.vertices[0].x,
				y: this.vertices[0].y,
				x_index: 0,
				y_index: 0
			},
			    upperBound = {
				x: this.vertices[0].x,
				y: this.vertices[0].y,
				x_index: 0,
				y_index: 0
			};

			for (var i = 1; i < 4; i++) {
				var currentBound = this.vertices[i];

				if (currentBound.x < lowerBound.x) {
					lowerBound.x_index = i;
					lowerBound.x = currentBound.x;
				} else if (currentBound.x > upperBound.x) {
					upperBound.x_index = i;
					upperBound.x = currentBound.boundX;
				}

				if (currentBound.y < lowerBound.y) {
					lowerBound.y_index = i;
					lowerBound.y = currentBound.y;
				} else if (currentBound.y > upperBound.y) {
					upperBound.y_index = i;
					upperBound.y = currentBound.y;
				}
			}

			this.bounds[0] = lowerBound;
			this.bounds[1] = upperBound;
		}

		// Used for matrix rotation
	}, {
		key: 'multiply_matrices',
		value: function multiply_matrices() {
			var matrix_a = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
			var matrix_b = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

			if (matrix_a.length === 0 || matrix_b.length === 0) return [];

			// Number of rows in matrix_a
			var height = matrix_a.length;

			// Number of columns in matrix_b
			var width = matrix_b[0].length;

			// Create an empty matrix to store the result
			var matrix = Array(height);

			// Iterate through each row of matrix_a
			for (var a_y = 0; a_y < height; a_y++) {
				var a_row = matrix_a[a_y];
				matrix[a_y] = Array(width);

				// Iterate through each column of matrix_b
				for (var b_x = 0; b_x < width; b_x++) {
					var cell = 0;

					// Iterate through the bigger of the width of matrix_a or height of matrix_b
					for (var i = 0; i < Math.max(a_row.length, matrix_b.length); i++) {
						cell += a_row[i] * matrix_b[i][b_x];
					}

					matrix[a_y].push(cell);
				}
			}

			return matrix;
		}
	}]);

	return BoundingBox;
})();

exports['default'] = BoundingBox;
module.exports = exports['default'];

},{"util/vector":14}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _entityEntity = require('entity/entity');

var _entityEntity2 = _interopRequireDefault(_entityEntity);

var MAX_BOUNCES = 1;

var Bullet = (function (_Entity) {
	_inherits(Bullet, _Entity);

	function Bullet(x, y, angle) {
		var speed = arguments.length <= 3 || arguments[3] === undefined ? -3 : arguments[3];
		var p_id = arguments.length <= 4 || arguments[4] === undefined ? '' : arguments[4];

		_classCallCheck(this, Bullet);

		_get(Object.getPrototypeOf(Bullet.prototype), 'constructor', this).call(this, x, y, 5, 2.5, angle);

		this.p_id = p_id;
		this.num_bounces = 0;

		this.set_speed(speed);
	}

	_createClass(Bullet, [{
		key: 'bounce',
		value: function bounce(edge) {
			this.num_bounces++;

			if (this.num_bounces >= MAX_BOUNCES) return true;

			if (edge.x === 0) {
				if (this.angle < 0) this.turn_to(-Math.PI - this.angle);else this.turn_to(Math.PI - this.angle);
			} else {
				this.turn_to(-this.angle);
			}
		}
	}, {
		key: 'reset',
		value: function reset() {
			this.p_id = '';
			this.num_bounces = 0;
		}
	}]);

	return Bullet;
})(_entityEntity2['default']);

exports['default'] = Bullet;
module.exports = exports['default'];

},{"entity/entity":4}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _utilUtil = require('util/util');

var _utilUtil2 = _interopRequireDefault(_utilUtil);

var _utilVector = require('util/vector');

var _utilVector2 = _interopRequireDefault(_utilVector);

var _entityBounding_box = require('entity/bounding_box');

var _entityBounding_box2 = _interopRequireDefault(_entityBounding_box);

var Entity = (function () {
	function Entity() {
		var x = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
		var y = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
		var width = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
		var height = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];
		var angle = arguments.length <= 4 || arguments[4] === undefined ? 0 : arguments[4];
		var transform_origin_x = arguments.length <= 5 || arguments[5] === undefined ? 0.5 : arguments[5];
		var transform_origin_y = arguments.length <= 6 || arguments[6] === undefined ? 0.5 : arguments[6];

		_classCallCheck(this, Entity);

		this.id = _utilUtil2['default'].generate_id();

		this.pos = new _utilVector2['default'](x, y);
		this.nextPos = new _utilVector2['default']();
		this.lastPos = new _utilVector2['default']();
		this.velocity = new _utilVector2['default']();

		this.width = width;
		this.height = height;
		this.radius = Math.hypot(this.halfWidth, this.halfHeight);

		// Clockwise from 3 O'clock
		this.angle = angle;
		this.next_angle = 0;
		this.angle_cos = Math.cos(angle);
		this.angle_sin = Math.sin(angle);
		this.angular_velocity = 0;

		this.transform_origin = new _utilVector2['default'](transform_origin_x, transform_origin_y);
		this.bounding_box = this.create_rectangular_bounding_box();
	}

	// Create a rectangular bounding box

	_createClass(Entity, [{
		key: 'create_rectangular_bounding_box',
		value: function create_rectangular_bounding_box() {
			var half_width = this.width / 2,
			    half_height = this.height / 2,
			    vertices = [new _utilVector2['default'](this.pos.x - half_width, this.pos.y + half_height), new _utilVector2['default'](this.pos.x - half_width, this.pos.y - half_height), new _utilVector2['default'](this.pos.x + half_width, this.pos.y - half_height), new _utilVector2['default'](this.pos.x + half_width, this.pos.y + half_height)],
			    transform_origin_x = this.width * this.transform_origin.x + this.pos.x,
			    transform_origin_y = this.height * this.transform_origin.y + this.pos.y;

			return new _entityBounding_box2['default'](vertices, this.angle, transform_origin_x, transform_origin_y);
		}
	}, {
		key: 'move',
		value: function move() {
			var dX = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
			var dY = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

			this.moveTo(this.pos.x + dX, this.pos.y + dY);
		}
	}, {
		key: 'move_to',
		value: function move_to() {
			var x = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
			var y = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

			var dX = x - this.pos.x,
			    dY = y - this.pos.y;

			this.pos.set(x, y);
			this.bounding_box.translate(dX, dY);
		}
	}, {
		key: 'turn',
		value: function turn() {
			var dAngle = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

			this.turnTo(this.angle + dAngle);
		}
	}, {
		key: 'turn_to',
		value: function turn_to() {
			var angle = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

			var dAngle = this.angle - angle,
			    transform_origin_x = this.width * this.transform_origin.x + this.pos.x,
			    transform_origin_y = this.height * this.transform_origin.y + this.pos.y;

			this.angle = angle;
			this.angle_cos = Math.cos(angle);
			this.angle_sin = Math.sin(angle);

			if (Math.abs(this.angle) >= 6.283185) return this.turn_to(this.angle % 6.283185);

			// Change direction of velocity
			if (this.velocity.length > 0) this.setVelocity(this.speed);

			this.bounding_box.rotate(dAngle, transform_origin_x, transform_origin_y);
		}
	}, {
		key: 'set_speed',
		value: function set_speed() {
			var speed = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

			this.speed = speed;
			this.velocity.set(speed * this.angle_cos, speed * this.angle_sin);
		}
	}, {
		key: 'set_turn_speed',
		value: function set_turn_speed() {
			var speed = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

			this.angular_velocity = speed;
		}
	}]);

	return Entity;
})();

exports['default'] = Entity;
module.exports = exports['default'];

},{"entity/bounding_box":2,"util/util":13,"util/vector":14}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _entityEntity = require('entity/entity');

var _entityEntity2 = _interopRequireDefault(_entityEntity);

var DEFAULT_SIZE = 5;
var COUNTDOWN_TICKS = 10;

var Explosion = (function (_Entity) {
	_inherits(Explosion, _Entity);

	function Explosion(x, y) {
		var radius = arguments.length <= 2 || arguments[2] === undefined ? DEFAULT_SIZE : arguments[2];

		_classCallCheck(this, Explosion);

		_get(Object.getPrototypeOf(Explosion.prototype), 'constructor', this).call(this, x, y);

		this.radius = radius;
		this.time_left = COUNTDOWN_TICKS;
	}

	_createClass(Explosion, [{
		key: 'count_down',
		value: function count_down(num_ticks) {
			if (this.time_left <= 1) return true;

			this.time_left -= num_ticks;
		}
	}, {
		key: 'reset',
		value: function reset() {
			this.time_left = COUNTDOWN_TICKS;
		}
	}]);

	return Explosion;
})(_entityEntity2['default']);

exports['default'] = Explosion;
module.exports = exports['default'];

},{"entity/entity":4}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _entityEntity = require('entity/entity');

var _entityEntity2 = _interopRequireDefault(_entityEntity);

var COUNTDOWN_TICKS = 60 * 10;

var Mine = (function (_Entity) {
	_inherits(Mine, _Entity);

	function Mine(x, y) {
		var p_id = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];
		var time_left = arguments.length <= 3 || arguments[3] === undefined ? COUNTDOWN_TICKS : arguments[3];

		_classCallCheck(this, Mine);

		_get(Object.getPrototypeOf(Mine.prototype), 'constructor', this).call(this, x, y);

		this.p_id = p_id;
		this.time_left = COUNTDOWN_TICKS;
	}

	_createClass(Mine, [{
		key: 'count_down',
		value: function count_down(num_ticks) {
			if (this.time_left <= 1) return true;

			this.time_left -= num_ticks;
		}
	}, {
		key: 'reset',
		value: function reset() {
			this.time_left = COUNTDOWN_TICKS;
		}
	}]);

	return Mine;
})(_entityEntity2['default']);

exports['default'] = Mine;
module.exports = exports['default'];

},{"entity/entity":4}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x5, _x6, _x7) { var _again = true; _function: while (_again) { var object = _x5, property = _x6, receiver = _x7; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x5 = parent; _x6 = property; _x7 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _utilVector = require('util/vector');

var _utilVector2 = _interopRequireDefault(_utilVector);

var _entityEntity = require('entity/entity');

var _entityEntity2 = _interopRequireDefault(_entityEntity);

var _entityBullet = require('entity/bullet');

var _entityBullet2 = _interopRequireDefault(_entityBullet);

var Tank = (function (_Entity) {
	_inherits(Tank, _Entity);

	function Tank() {
		var id = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
		var x = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
		var y = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
		var angle = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];

		_classCallCheck(this, Tank);

		_get(Object.getPrototypeOf(Tank.prototype), 'constructor', this).call(this, x, y, 50, 25, angle);

		this.id = id;
		this.name = 'Tanky';
		this.score = 0;
		this.last_bullet_tick = 0;
		this.mines = [];
		this.bullets = [];
		this.barrel = new _entityEntity2['default'](x, y, 50, 5, 0, 0, 0.5);
	}

	_createClass(Tank, [{
		key: 'move',
		value: function move(x, y) {
			_get(Object.getPrototypeOf(Tank.prototype), 'move', this).call(this, x, y);
			this.barrel.move(x, y);
		}
	}, {
		key: 'move_to',
		value: function move_to(x, y) {
			_get(Object.getPrototypeOf(Tank.prototype), 'move_to', this).call(this, x, y);
			this.barrel.move_to(x, y);
		}
	}, {
		key: 'turn_barrel',
		value: function turn_barrel(x, y, camera_offset_x, camera_offset_y) {
			this.turn_to(Math.atan2(this.barrel.pos.y - y - camera_offset_y, this.barrel.pos.x - x - camera_offset_x));
		}
	}, {
		key: 'turn_barrel_to',
		value: function turn_barrel_to(angle) {
			this.barrel.turn_to(angle);
		}
	}, {
		key: 'translateAlongWall',
		value: function translateAlongWall(edge) {
			// Move by the velocity projected onto the unit vector
			var dotProduct = this.velocity.x * edge.x + this.velocity.y * edge.y;
			this.movePos(dotProduct * edge.x, dotProduct * edge.y);
		}
	}, {
		key: 'translateAlongPlayer',
		value: function translateAlongPlayer(edgeUnitVector) {
			var dotProduct = this.velocity.x * edgeUnitVector.x + this.velocity.y * edgeUnitVector.y;
			this.movePos(dotProduct * edgeUnitVector.x, dotProduct * edgeUnitVector.y);
		}
	}, {
		key: 'rotateAlongWall',
		value: function rotateAlongWall(edge, overlap) {
			var displacementVector = {
				x: overlap * edge.y,
				y: overlap * edge.x
			};

			if (edge.x < 0) displacementVector.y = -displacementVector.y;

			if (edge.y < 0) displacementVector.x = -displacementVector.x;

			this.movePos(displacementVector.x, displacementVector.y);
		}

		// Cancel velocity in the direction of the other player's colliding edge
	}, {
		key: 'rotateAlongPlayer',
		value: function rotateAlongPlayer(edgeUnitVector) {
			var tangentialVelocity = this.radius * this.rotation.speed;
			this.movePos(tangentialVelocity * edgeUnitVector.x, tangentialVelocity * edgeUnitVector.y);
		}

		// Fire a projectile from the end of barrel and return the reference
	}, {
		key: 'shoot',
		value: function shoot() {
			this.barrel.rotateBoundingBox();

			// Set the projectile starting position to the middle of the barrel tip
			var projectilePos = new _utilVector2['default'](this.barrel.boundingBox[2].x, this.barrel.boundingBox[2].y);
			// projectilePos.add( -this.barrel.boundingBox[ 2 ].x, -this.barrel.boundingBox[ 2 ].y );
			// projectilePos.divide( 2 );
			// projectilePos.add( this.barrel.boundingBox[ 3 ].x, this.barrel.boundingBox[ 3 ].y );

			var projectile = new Projectile(this.id, projectilePos.x, projectilePos.y, this.barrel.angle);
			this.projectiles.push(projectile);

			return projectile;
		}

		// Returns true if there is a collision between this tank and a tank from players
	}, {
		key: 'isPlayerCollision',
		value: function isPlayerCollision(player) {
			// Don't check this tank with itself
			if (player.id === this.id) {
				return;
			}

			// Return if a collision is found
			var edgeUnitVector = this.isRotatedRectangleCollision(player);
			if (edgeUnitVector) {
				return edgeUnitVector;
			}
		}
	}, {
		key: 'reset',
		value: function reset() {
			this.name = 'Tanky';
			this.score = 0;
			this.lastShotTick = 0;
			this.bullets.length = 0;
			this.mines.length = 0;
		}
	}]);

	return Tank;
})(_entityEntity2['default']);

exports['default'] = Tank;
module.exports = exports['default'];

},{"entity/bullet":3,"entity/entity":4,"util/vector":14}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _entityEntity = require('entity/entity');

var _entityEntity2 = _interopRequireDefault(_entityEntity);

var Wall = (function (_Entity) {
  _inherits(Wall, _Entity);

  function Wall() {
    _classCallCheck(this, Wall);

    _get(Object.getPrototypeOf(Wall.prototype), 'constructor', this).apply(this, arguments);
  }

  return Wall;
})(_entityEntity2['default']);

exports['default'] = Wall;
module.exports = exports['default'];

},{"entity/entity":4}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Event = (function () {
	function Event() {
		_classCallCheck(this, Event);

		this.subscribers = [];
	}

	_createClass(Event, [{
		key: "dispatch",
		value: function dispatch() {
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = this.subscribers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					func = _step.value;

					func();
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator["return"]) {
						_iterator["return"]();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}
		}
	}, {
		key: "listen",
		value: function listen(func) {
			this.subscribers.push(func);
		}
	}]);

	return Event;
})();

exports["default"] = Event;
module.exports = exports["default"];

},{}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _game_map = require('./game_map');

var _game_map2 = _interopRequireDefault(_game_map);

var _entityExplosion = require('entity/explosion');

var _entityExplosion2 = _interopRequireDefault(_entityExplosion);

var _collisionCollision = require('collision/collision');

var _collisionCollision2 = _interopRequireDefault(_collisionCollision);

var _utilObject_pool = require('util/object_pool');

var _utilObject_pool2 = _interopRequireDefault(_utilObject_pool);

var _eventEvent = require('event/event');

var _eventEvent2 = _interopRequireDefault(_eventEvent);

require.cache = {};

console.log(_eventEvent2['default']);
console.log(JSON.stringify(_eventEvent2['default'].prototype));

var Game = (function () {
	function Game() {
		_classCallCheck(this, Game);

		this.game_map = new _game_map2['default']();

		this.collision_pool = new _utilObject_pool2['default'](3, _collisionCollision2['default']);
		this.explosion_pool = new _utilObject_pool2['default'](10, _entityExplosion2['default']);
		console.log("BYEHI");
		console.log(JSON.stringify(_eventEvent2['default']));
		// Event.listen( 'play', function ()
		// {
		// 	console.log( 'test' );
		// } );
	}

	_createClass(Game, [{
		key: 'update',
		value: function update(dt) {
			this.update_tanks(dt);
			this.update_bullets(dt);
			this.update_mines(dt);
			this.update_explosions(dt);
		}
	}, {
		key: 'update_tanks',
		value: function update_tanks(dt) {
			var collision = collision_pool.get();

			for (var _ref3 in game_map.tanks) {
				var _ref2 = _slicedToArray(_ref3, 2);

				var id = _ref2[0];
				var tank = _ref2[1];

				if (tank.rotation.speed !== 0) {
					tank.turn(tank.rotation.speed * dt);

					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = map.walls[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var _step$value = _slicedToArray(_step.value, 2);

							var _id = _step$value[0];
							var wall = _step$value[1];

							if (collision.is_colliding(tank, wall)) player.rotateAlongWall(collision.edge, collision.overlap);
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator['return']) {
								_iterator['return']();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}

					var _iteratorNormalCompletion2 = true;
					var _didIteratorError2 = false;
					var _iteratorError2 = undefined;

					try {
						for (var _iterator2 = map.tanks[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
							var _step2$value = _slicedToArray(_step2.value, 2);

							var _id2 = _step2$value[0];
							var collision_tank = _step2$value[1];

							if (collision.is_colliding(tank, collision_tank)) player.rotateAlongPlayer(collision.edge.unit_vector());
						}
					} catch (err) {
						_didIteratorError2 = true;
						_iteratorError2 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion2 && _iterator2['return']) {
								_iterator2['return']();
							}
						} finally {
							if (_didIteratorError2) {
								throw _iteratorError2;
							}
						}
					}
				}

				if (player.velocity.length !== 0) {
					var velocity = player.velocity.clone();

					var _iteratorNormalCompletion3 = true;
					var _didIteratorError3 = false;
					var _iteratorError3 = undefined;

					try {
						for (var _iterator3 = map.walls[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
							var _step3$value = _slicedToArray(_step3.value, 2);

							var _id3 = _step3$value[0];
							var wall = _step3$value[1];

							if (collision.is_colliding(tank, wall)) velocity.project(collision.edge.unit_vector());
						}
					} catch (err) {
						_didIteratorError3 = true;
						_iteratorError3 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion3 && _iterator3['return']) {
								_iterator3['return']();
							}
						} finally {
							if (_didIteratorError3) {
								throw _iteratorError3;
							}
						}
					}

					var _iteratorNormalCompletion4 = true;
					var _didIteratorError4 = false;
					var _iteratorError4 = undefined;

					try {
						for (var _iterator4 = map.tanks[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
							var _step4$value = _slicedToArray(_step4.value, 2);

							var _id4 = _step4$value[0];
							var collision_tank = _step4$value[1];

							if (collision.is_colliding(tank, collision_tank)) velocity.project(collision.edge.unit_vector());
						}
					} catch (err) {
						_didIteratorError4 = true;
						_iteratorError4 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion4 && _iterator4['return']) {
								_iterator4['return']();
							}
						} finally {
							if (_didIteratorError4) {
								throw _iteratorError4;
							}
						}
					}

					player.move(velocity.x * dt, velocity.y * dt);

					if (id === controller.id) controller.camera.moveTo(player.pos.x, player.pos.y, this.width, this.height);
				}

				// Ease towards the next position from the server
				if (player.next_pos.length() > 0) {
					var dX = player.next_pos.x,
					    dY = player.next_pos.y;

					if (Math.abs(player.next_pos.x) > 1) dX /= 10;

					if (Math.abs(player.next_pos.y) > 1) dY /= 10;

					player.next_pos.add(-dX, -dY);

					player.move(dX, dY);
				}

				if (Math.abs(player.rotation.nextRad) > 0) {
					var dAngle = player.rotation.nextRad;

					if (Math.abs(player.rotation.nextRad) > 1) dAngle /= 2;

					player.rotation.next_angle -= dAngle;

					player.turn(dAngle);
				}
			}

			collision_pool.release(collision);
		}
	}, {
		key: 'update_bullets',
		value: function update_bullets(dt) {
			var collision = collision_pool.get();

			var _iteratorNormalCompletion5 = true;
			var _didIteratorError5 = false;
			var _iteratorError5 = undefined;

			try {
				for (var _iterator5 = map.bullets[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
					var _step5$value = _slicedToArray(_step5.value, 2);

					var id = _step5$value[0];
					var bullet = _step5$value[1];

					var velocity_x = bullet.velocity.x,
					    velocity_y = bullet.velocity.y;

					// Cancel bullets
					var _iteratorNormalCompletion6 = true;
					var _didIteratorError6 = false;
					var _iteratorError6 = undefined;

					try {
						for (var _iterator6 = map.bullets[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
							var _step6$value = _slicedToArray(_step6.value, 2);

							var _id5 = _step6$value[0];
							var collision_bullet = _step6$value[1];

							collision = bullet.isRectangleCollision(collision_bullet);

							if (collision) {
								map.remove_bullet(bullet);
								map.remove_bullet(collision_bullet);
							}
						}

						// Explode mines
					} catch (err) {
						_didIteratorError6 = true;
						_iteratorError6 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion6 && _iterator6['return']) {
								_iterator6['return']();
							}
						} finally {
							if (_didIteratorError6) {
								throw _iteratorError6;
							}
						}
					}

					var _iteratorNormalCompletion7 = true;
					var _didIteratorError7 = false;
					var _iteratorError7 = undefined;

					try {
						for (var _iterator7 = map.mines[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
							var _step7$value = _slicedToArray(_step7.value, 2);

							var _id6 = _step7$value[0];
							var mine = _step7$value[1];

							collision = bullet.isRectangleCollision(mine);

							if (collision) {
								map.remove_bullet(bullet);
								map.remove_mine(mine);
							}
						}

						// Bounce off walls
					} catch (err) {
						_didIteratorError7 = true;
						_iteratorError7 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion7 && _iterator7['return']) {
								_iterator7['return']();
							}
						} finally {
							if (_didIteratorError7) {
								throw _iteratorError7;
							}
						}
					}

					var _iteratorNormalCompletion8 = true;
					var _didIteratorError8 = false;
					var _iteratorError8 = undefined;

					try {
						for (var _iterator8 = map.walls[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
							var _step8$value = _slicedToArray(_step8.value, 2);

							var _id7 = _step8$value[0];
							var wall = _step8$value[1];

							collision = bullet.isRectangleCollision(wall);

							if (collision) {
								bullet.bounce(collision.edge);

								velocity_x = bullet.velocity.x;
								velocity_y = bullet.velocity.y;
							}
						}
					} catch (err) {
						_didIteratorError8 = true;
						_iteratorError8 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion8 && _iterator8['return']) {
								_iterator8['return']();
							}
						} finally {
							if (_didIteratorError8) {
								throw _iteratorError8;
							}
						}
					}

					bullet.move(velocity_x * dt, velocity_y * dt);
				}
			} catch (err) {
				_didIteratorError5 = true;
				_iteratorError5 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion5 && _iterator5['return']) {
						_iterator5['return']();
					}
				} finally {
					if (_didIteratorError5) {
						throw _iteratorError5;
					}
				}
			}

			collision_pool.release(collision);
		}
	}, {
		key: 'update_mines',
		value: function update_mines(dt) {
			var _iteratorNormalCompletion9 = true;
			var _didIteratorError9 = false;
			var _iteratorError9 = undefined;

			try {
				for (var _iterator9 = map.mines[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
					var _step9$value = _slicedToArray(_step9.value, 2);

					var id = _step9$value[0];
					var mine = _step9$value[1];

					if (mine.count_down(dt)) {
						map.remove_mine(mine);
					}
				}
			} catch (err) {
				_didIteratorError9 = true;
				_iteratorError9 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion9 && _iterator9['return']) {
						_iterator9['return']();
					}
				} finally {
					if (_didIteratorError9) {
						throw _iteratorError9;
					}
				}
			}
		}
	}, {
		key: 'update_explosions',
		value: function update_explosions(dt) {
			var _iteratorNormalCompletion10 = true;
			var _didIteratorError10 = false;
			var _iteratorError10 = undefined;

			try {
				for (var _iterator10 = map.explosions[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
					var _step10$value = _slicedToArray(_step10.value, 2);

					var id = _step10$value[0];
					var explosion = _step10$value[1];

					if (explosion.count_down(dt)) {
						map.remove_explosion(explosion);
					}
				}
			} catch (err) {
				_didIteratorError10 = true;
				_iteratorError10 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion10 && _iterator10['return']) {
						_iterator10['return']();
					}
				} finally {
					if (_didIteratorError10) {
						throw _iteratorError10;
					}
				}
			}
		}
	}]);

	return Game;
})();

exports['default'] = Game;
module.exports = exports['default'];

},{"./game_map":11,"collision/collision":1,"entity/explosion":5,"event/event":9,"util/object_pool":12}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _utilVector = require('util/vector');

var _utilVector2 = _interopRequireDefault(_utilVector);

var _entityTank = require('entity/tank');

var _entityTank2 = _interopRequireDefault(_entityTank);

var _entityBullet = require('entity/bullet');

var _entityBullet2 = _interopRequireDefault(_entityBullet);

var _entityMine = require('entity/mine');

var _entityMine2 = _interopRequireDefault(_entityMine);

var _entityWall = require('entity/wall');

var _entityWall2 = _interopRequireDefault(_entityWall);

var _entityExplosion = require('entity/explosion');

var _entityExplosion2 = _interopRequireDefault(_entityExplosion);

var _utilObject_pool = require('util/object_pool');

var _utilObject_pool2 = _interopRequireDefault(_utilObject_pool);

var GameMap = (function () {
	function GameMap(width, height) {
		_classCallCheck(this, GameMap);

		this.tick = 0;

		this.width = width;
		this.height = height;

		this.tank_pool = new _utilObject_pool2['default'](10, _entityTank2['default']);
		this.bullet_pool = new _utilObject_pool2['default'](20, _entityBullet2['default']);
		this.mine_pool = new _utilObject_pool2['default'](10, _entityMine2['default']);
		this.wall_pool = new _utilObject_pool2['default'](50, _entityWall2['default']);
		this.explosion_pool = new _utilObject_pool2['default'](10, _entityExplosion2['default']);

		this.tanks = new Map();
		this.bullets = new Map();
		this.mines = new Map();
		this.walls = new Map();
		this.explosions = new Map();
	}

	_createClass(GameMap, [{
		key: 'add_tank',
		value: function add_tank(id, x, y, angle) {
			if (this.tanks.has(id)) return;

			var tank = this.tank_pool.get();
			tank.move_to(x, y);
			tank.turn_to(angle);

			this.tanks.set(tank.id, tank);

			return tank;
		}
	}, {
		key: 'add_bullet',
		value: function add_bullet(x, y, angle, p_id) {
			var bullet = this.bullet_pool.get();
			bullet.p_id = p_id;
			bullet.move_to(x, y);

			this.bullets.set(projectile.id, projectile);

			return projectile;
		}
	}, {
		key: 'add_mine',
		value: function add_mine(x, y, p_id) {
			var mine = this.mine_pool.get();
			mine.p_id = p_id;
			mine.move_to(x, y);

			this.mines.set(mine.id, mine);

			return mine;
		}
	}, {
		key: 'add_wall',
		value: function add_wall(x, y, width, height) {
			var wall = this.wall_pool.get();
			wall.move_to(x, y);

			this.walls.set(wall.id, wall);

			return wall;
		}
	}, {
		key: 'add_explosion',
		value: function add_explosion(x, y, radius) {
			var explosion = this.explosion_pool.get();
			explosion.radius = radius;
			explosion.move_to(x, y);

			this.explosions.set(explosion.id, explosion);

			return explosion;
		}
	}, {
		key: 'remove_tank',
		value: function remove_tank(id) {
			var tank = this.tanks.get(id);

			tank_pool.release(tank);
			this.tanks['delete'](id);
		}
	}, {
		key: 'remove_bullet',
		value: function remove_bullet(id) {
			var bullet = this.bullets.get(id);

			bullet_pool.release(bullet);
			this.projectiles['delete'](id);
		}
	}, {
		key: 'remove_mine',
		value: function remove_mine(id) {
			var mine = this.mines.get(id);

			mine_pool.release(mine);
			this.mines['delete'](id);
		}
	}, {
		key: 'remove_wall',
		value: function remove_wall(id) {
			var wall = this.mines.get(id);

			wall_pool.release(wall);
			this.walls['delete'](id);
		}
	}, {
		key: 'remove_explosion',
		value: function remove_explosion(id) {
			var explosion = this.explosions.get(id);

			explosion_pool.release(explosion);
			this.explosions['delete'](explosion);
		}
	}]);

	return GameMap;
})();

exports['default'] = GameMap;
module.exports = exports['default'];

},{"entity/bullet":3,"entity/explosion":5,"entity/mine":6,"entity/tank":7,"entity/wall":8,"util/object_pool":12,"util/vector":14}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var ObjectPool = (function () {
	function ObjectPool() {
		var size = arguments.length <= 0 || arguments[0] === undefined ? 100 : arguments[0];
		var obj = arguments.length <= 1 || arguments[1] === undefined ? Object : arguments[1];

		_classCallCheck(this, ObjectPool);

		this.obj = obj;
		this.pool = Array(size);

		for (var i = 0; i < size; i++) {
			this.pool[i] = new obj();
		}
	}

	// Add a new object to the pool

	_createClass(ObjectPool, [{
		key: 'spawn',
		value: function spawn() {
			this.pool.push(new this.obj());
		}

		// Take an object from the pool
	}, {
		key: 'get',
		value: function get() {
			if (this.pool.length === 0) this.spawn();

			return this.pool.pop();
		}

		// Put object back in pool and reset it if the object's reset() is defined
	}, {
		key: 'release',
		value: function release(obj) {
			if (typeof obj !== typeof this.obj) return;

			if (typeof obj.reset === 'function') obj.reset();

			this.pool.push(obj);
		}
	}]);

	return ObjectPool;
})();

exports['default'] = ObjectPool;
module.exports = exports['default'];

},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Util = (function () {
	function Util() {
		_classCallCheck(this, Util);
	}

	_createClass(Util, null, [{
		key: 'timestamp',
		value: function timestamp() {
			if (typeof window !== 'undefined' && typeof window.performance !== 'undefined' && typeof window.performance.now !== 'undefined') return window.performance.now();

			return new Date().getTime();
		}
	}, {
		key: 'generate_id',
		value: function generate_id() {
			return Math.random();
		}

		// Efficient approximation for the square root of a and b
	}, {
		key: 'sqrt_approximation',
		value: function sqrt_approximation(a, b) {
			return 4142 * Math.abs(a) / 10000 + Math.abs(b);
		}
	}]);

	return Util;
})();

exports['default'] = Util;

Math.sign = Math.sign || function (x) {
	x = +x; // convert to a number
	if (x === 0 || isNaN(x)) {
		return x;
	}
	return x > 0 ? 1 : -1;
};

Math.round = function (num) {
	return 0.5 + num << 0;
};
module.exports = exports['default'];

},{}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _utilUtil = require('util/util');

var _utilUtil2 = _interopRequireDefault(_utilUtil);

var Vector = (function () {
	function Vector() {
		var x = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
		var y = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

		_classCallCheck(this, Vector);

		this.x = x;
		this.y = y;
		this.length = Math.hypot(this.x, this.y);
	}

	// Set the arguments to its corresponding axis of this vector

	_createClass(Vector, [{
		key: 'set',
		value: function set() {
			var x = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
			var y = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

			this.x = x;
			this.y = y;
			this.length = Math.hypot(this.x, this.y);

			return this;
		}
	}, {
		key: 'add',

		// Add the arguments to its corresponding axis of this vector
		value: function add() {
			var x = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
			var y = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

			this.x += x;
			this.y += y;
			this.length = Math.hypot(this.x, this.y);

			return this;
		}
	}, {
		key: 'divide',

		// Divide each axis of this vector by the divisor
		value: function divide(divisor) {
			this.x /= divisor;
			this.y /= divisor;
			this.length = Math.hypot(this.x, this.y);

			return this;
		}
	}, {
		key: 'multiply',

		// Multiply each axis of this vector by the multiple
		value: function multiply(multiple) {
			this.x *= multiple;
			this.y *= multiple;
			this.length = Math.hypot(this.x, this.y);

			return this;
		}
	}, {
		key: 'project',

		// Project this vector onto the vector argument
		value: function project(vector) {
			var dotProduct = this.dotProduct(vector);

			this.x = dotProduct * vector.x;
			this.y = dotProduct * vector.y;
			this.length = Math.hypot(this.x, this.y);

			return this;
		}
	}, {
		key: 'isZero',

		// Returns if this vector is zero
		value: function isZero() {

			return this.x === 0 && this.y === 0;
		}
	}, {
		key: 'unitVector',

		/* Functions below return the result rather than modify contents of this vector */

		// Return the unit vector of this vector
		value: function unitVector() {
			var length = this.length(),
			    x = this.x ? Math.sign(this.x) * Math.pow(this.x, 2) / length : 0,
			    y = this.y ? Math.sign(this.y) * Math.pow(this.y, 2) / length : 0;

			return new Vector(x, y);
		}
	}, {
		key: 'diff',

		// Return a vector containing the difference of each axis
		value: function diff(vector) {

			return new Vector(this.x - vector.x, this.y - vector.y);
		}
	}, {
		key: 'subtract',

		// Return a vector containing the difference of each axis
		value: function subtract(vector) {

			return new Vector(this.x - vector.x, this.y - vector.y);
		}
	}, {
		key: 'dotProduct',

		// Return the dot product of the two vectors
		value: function dotProduct(vector) {

			return this.x * vector.x + this.y * vector.y;
		}
	}, {
		key: 'getLength',

		// Returns the length of the vector ( note this is the length ^ 2 )
		value: function getLength() {

			return Math.pow(this.x, 2) + Math.pow(this.y, 2);
		}
	}, {
		key: 'clone',

		// Return a copy of this vector
		value: function clone() {

			return new Vector(this.x, this.y);
		}
	}, {
		key: 'toObject',

		// Returns an object containing each non-zero axis
		value: function toObject() {
			var vectorObject = {
				x: this.x,
				y: this.y
			};

			return vectorObject;
		}
	}, {
		key: 'toString',
		value: function toString() {
			return 'x: ' + this.x + ' y: ' + this.y;
		}
	}]);

	return Vector;
})();

exports['default'] = Vector;
module.exports = exports['default'];

},{"util/util":13}],15:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _gameGame = require('game/game');

var _gameGame2 = _interopRequireDefault(_gameGame);

var _utilUtil = require('util/util');

var _utilUtil2 = _interopRequireDefault(_utilUtil);

var game = new _gameGame2['default'](),

// Track player events
stateQueue = new Map();

module.exports = function (io) {
	init();

	var now,
	    dt,
	    last = _utilUtil2['default'].timestamp();

	function init() {
		setInterval(frame, 1000 / 60);
	}

	function frame() {
		now = _utilUtil2['default'].timestamp();
		dt = (now - last) / 1000; // In seconds

		update(dt);
		render();

		last = now;
	}

	function update(dt) {
		game.update(dt);
	}

	function render() {
		if (game.map.tick % 60 === 0) {
			if (!game.map.isReplayingSnapshot) game.map.saveSnapshot();

			var stateChange = game.map.diffSnapshot(game.map.snapshots.head, game.map.snapshots.head.prev);

			if (Object.keys(stateChange).length > 0) io.sockets.emit('e', stateChange);
		}
	}

	io.on('connection', function (socket) {
		playerConnectHandler.bind(socket)();

		socket.on('disconnect', playerDisconnectHandler.bind(socket));
		socket.on('e', playerEventHandler.bind(socket));
	});

	function playerConnectHandler() {
		// map.saveSnapshot();

		var id = this.id,
		    player = map.spawn(id),
		    playerLog = id in stateQueue ? stateQueue[id] : new Object();

		var snapshot = map.snapshots.head.getData();
		snapshot.id = id;
		snapshot.boundX = map.width;
		snapshot.boundY = map.height;
		snapshot.leaderboard = map.score.leaderboard;
		snapshot.grid = map.grid;

		// Get the client up to date with its id, pos, and the other players
		this.emit('init', snapshot);
		this.on('init', (function (data) {
			map.players[id].name = data;
		}).bind(id));

		playerLog.pos = player.pos;
		stateQueue[id] = playerLog;

		console.log(id + ' connected.');
	}

	function playerDisconnectHandler() {
		var id = this.id;

		// If the player was on the leaderboard, remove them from it
		if (map.score.remove(id)) playerLog.leaderboard = scoreboard.getLeaderboard();

		// Remove the player from the map
		map.removePlayer(id);

		console.log(id + ' disconnected.');
	}

	function playerEventHandler(e) {
		var id = this.id,
		    playerLog = id in stateQueue ? stateQueue[id] : new Object(),
		    player = map.players[id];

		if (!player) return;

		if (!e.t) return;

		map.loadSnapshot(e.t);

		// Forwards and backwards velocity
		if ('v' in e) {
			if (e.v > 0) {
				player.setVelocity(1.5);
			} else if (e.v === 0) {
				player.setVelocity(0);
			} else if (e.v < 0) {
				player.setVelocity(-1.5);
			}
		}

		// Left and right rotational speed
		if ('r' in e) {
			if (e.r > 0) {
				player.rotation.speed = 0.05;
			} else if (e.r === 0) {
				player.rotation.speed = 0;
			} else if (e.r < 0) {
				player.rotation.speed = -0.05;
			}
		}

		// Mouse movement
		if ('m' in e) {
			player.barrel.setAngle(e.m);
			playerLog.heading = e.m;
		}

		if ('s' in e) {
			var projectile = player.shoot();
			if (projectile) {
				map.projectiles[projectile.id] = projectile;
			}
		}

		map.replaySnapshot();

		stateQueue[id] = playerLog;
	}
};

// Record change events
function pushStateEvent(id, key, data) {
	var playerState = {};
	if (id in stateQueue) playerState = stateQueue[id];

	if (key in playerState) playerState[key].push(data);else playerState[key] = [data];

	stateQueue[id] = playerState;
	stateChange = true;
}
},{"game/game":10,"util/util":13}]},{},[15])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvUmljaGllL0RvY3VtZW50cy9Xb3JrL1RhbmtzL3NyYy9ub2RlX21vZHVsZXMvY29sbGlzaW9uL2NvbGxpc2lvbi5qcyIsIi9Vc2Vycy9SaWNoaWUvRG9jdW1lbnRzL1dvcmsvVGFua3Mvc3JjL25vZGVfbW9kdWxlcy9lbnRpdHkvYm91bmRpbmdfYm94LmpzIiwiL1VzZXJzL1JpY2hpZS9Eb2N1bWVudHMvV29yay9UYW5rcy9zcmMvbm9kZV9tb2R1bGVzL2VudGl0eS9idWxsZXQuanMiLCIvVXNlcnMvUmljaGllL0RvY3VtZW50cy9Xb3JrL1RhbmtzL3NyYy9ub2RlX21vZHVsZXMvZW50aXR5L2VudGl0eS5qcyIsIi9Vc2Vycy9SaWNoaWUvRG9jdW1lbnRzL1dvcmsvVGFua3Mvc3JjL25vZGVfbW9kdWxlcy9lbnRpdHkvZXhwbG9zaW9uLmpzIiwiL1VzZXJzL1JpY2hpZS9Eb2N1bWVudHMvV29yay9UYW5rcy9zcmMvbm9kZV9tb2R1bGVzL2VudGl0eS9taW5lLmpzIiwiL1VzZXJzL1JpY2hpZS9Eb2N1bWVudHMvV29yay9UYW5rcy9zcmMvbm9kZV9tb2R1bGVzL2VudGl0eS90YW5rLmpzIiwiL1VzZXJzL1JpY2hpZS9Eb2N1bWVudHMvV29yay9UYW5rcy9zcmMvbm9kZV9tb2R1bGVzL2VudGl0eS93YWxsLmpzIiwiL1VzZXJzL1JpY2hpZS9Eb2N1bWVudHMvV29yay9UYW5rcy9zcmMvbm9kZV9tb2R1bGVzL2V2ZW50L2V2ZW50LmpzIiwiL1VzZXJzL1JpY2hpZS9Eb2N1bWVudHMvV29yay9UYW5rcy9zcmMvbm9kZV9tb2R1bGVzL2dhbWUvZ2FtZS5qcyIsIi9Vc2Vycy9SaWNoaWUvRG9jdW1lbnRzL1dvcmsvVGFua3Mvc3JjL25vZGVfbW9kdWxlcy9nYW1lL2dhbWVfbWFwLmpzIiwiL1VzZXJzL1JpY2hpZS9Eb2N1bWVudHMvV29yay9UYW5rcy9zcmMvbm9kZV9tb2R1bGVzL3V0aWwvb2JqZWN0X3Bvb2wuanMiLCIvVXNlcnMvUmljaGllL0RvY3VtZW50cy9Xb3JrL1RhbmtzL3NyYy9ub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwiL1VzZXJzL1JpY2hpZS9Eb2N1bWVudHMvV29yay9UYW5rcy9zcmMvbm9kZV9tb2R1bGVzL3V0aWwvdmVjdG9yLmpzIiwic3JjL3NlcnZlci9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7OzBCQ0FtQixhQUFhOzs7O0lBRVgsU0FBUztBQUVsQixVQUZTLFNBQVMsR0FHN0I7d0JBSG9CLFNBQVM7O0FBSTVCLE1BQUksQ0FBQyxJQUFJLENBQUM7QUFDVixNQUFJLENBQUMsT0FBTyxDQUFDO0VBQ2I7Ozs7Y0FObUIsU0FBUzs7U0FTakIsc0JBQUUsV0FBVyxFQUFFLFdBQVcsRUFDdEM7QUFDQyxPQUFLLENBQUMsT0FBTyxDQUFFLFdBQVcsRUFBRSxXQUFXLENBQUUsRUFDeEMsT0FBTyxLQUFLLENBQUM7O0FBRWQsT0FBSyxXQUFXLENBQUMsS0FBSyxLQUFLLENBQUMsRUFDM0IsT0FBTywyQkFBMkIsQ0FBRSxXQUFXLEVBQUUsV0FBVyxDQUFFLENBQUM7O0FBRWhFLE9BQUssV0FBVyxDQUFDLEtBQUssS0FBSyxDQUFDLEVBQzNCLE9BQU8sMkJBQTJCLENBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBRSxDQUFDOztBQUVoRSxVQUFPLHlCQUF5QixDQUFFLFdBQVcsRUFBRSxXQUFXLENBQUUsQ0FBQztHQUM3RDs7Ozs7U0FHTSxpQkFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFDekM7O0FBRUMsT0FBSyxDQUFDLE1BQU0sRUFDWCxNQUFNLEdBQUcsV0FBVyxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDOztBQUVsRCxPQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsV0FBVyxD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Q0FBQztHQUN4Qzs7O1FBbkltQixNQUFNOzs7cUJBQU4sTUFBTTs7OztBQ0YzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IFZlY3RvciBmcm9tICd1dGlsL3ZlY3Rvcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbGxpc2lvblxue1xuXHRjb25zdHJ1Y3RvcigpXG5cdHtcblx0XHR0aGlzLmVkZ2U7XG5cdFx0dGhpcy5vdmVybGFwO1xuXHR9XG5cblx0Ly8gRGV0ZXJtaW5lIGlmIHRoZXJlIGlzIGEgY29sbGlzaW9uIHdpdGggcmVjdGFuZ2xlXG5cdGlzX2NvbGxpZGluZyggcmVjdGFuZ2xlX2EsIHJlY3RhbmdsZV9iIClcblx0e1xuXHRcdGlmICggIWlzX25lYXIoIHJlY3RhbmdsZV9hLCByZWN0YW5nbGVfYiApIClcblx0XHRcdHJldHVybiBmYWxzZTtcblxuXHRcdGlmICggcmVjdGFuZ2xlX2IuYW5nbGUgPT09IDAgKVxuXHRcdFx0cmV0dXJuIGlzX2NvbGxpZGluZ193aXRoX3Vucm90YXRlZCggcmVjdGFuZ2xlX2EsIHJlY3RhbmdsZV9iICk7XG5cblx0XHRpZiAoIHJlY3RhbmdsZV9hLmFuZ2xlID09PSAwIClcblx0XHRcdHJldHVybiBpc19jb2xsaWRpbmdfd2l0aF91bnJvdGF0ZWQoIHJlY3RhbmdsZV9iLCByZWN0YW5nbGVfYSApO1xuXG5cdFx0cmV0dXJuIGlzX2NvbGxpZGluZ193aXRoX3JvdGF0ZWQoIHJlY3RhbmdsZV9hLCByZWN0YW5nbGVfYiApO1xuXHR9XG5cblx0Ly8gUm91Z2ggY29sbGlzaW9uIGFwcHJveGltYXRpb24gdG8gY2hlY2sgaWYgcmVjdGFuZ2xlIGlzIGNsb3NlIHRvIHRoZSBwb2x5Z29uXG5cdGlzX25lYXIoIHJlY3RhbmdsZV9hLCByZWN0YW5nbGVfYiwgcmFkaXVzIClcblx0e1xuXHRcdC8vIElmIG5vIHJhZGl1cywgdXNlIHRoZSBjb21iaW5hZWQgcmFkaWkgcGx1cyBhIGJpdCBtb3JlXG5cdFx0aWYgKCAhcmFkaXVzIClcblx0XHRcdHJhZGl1cyA9IHJlY3RhbmdsZV9hLnJhZGl1cyArIHJlY3RhbmdsZV9iLnJhZGl1cztcblxuXHRcdGxldCBkaXN0YW5jZSA9IFV0aWwuc3FydF9hcHByb3hpbWF0aW9uKCByZWN0YW5nbGVfYi5wb3MueCAtIHJlY3RhbmdsZV9hLnBvcy54LCByZWN0YW5nbGVfYi5wb3MueSAtIHJlY3RhbmdsZV9hLnBvcy55IClcblx0XHRpZiAoIGRpc3RhbmNlIDw9IHJhZGl1cyApXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdC8vIENoZWNrIGZvciBhIGNvbGxpc2lvbiBiZXR3ZWVuIHJvdGF0ZWQgb3IgdW5yb3RhdGVkIHJlY3RhbmdsZV9hIGFuZCB1bnJvdGF0ZWQgcmVjdGFuZ2xlX2Jcblx0aXNfY29sbGlkaW5nX3dpdGhfdW5yb3RhdGVkKCByZWN0YW5nbGVfYSwgcmVjdGFuZ2xlX2IgKVxuXHR7XG5cdFx0bGV0IGJvdW5kaW5nX2JveF9hID0gcmVjdGFuZ2xlX2EuYm91bmRpbmdCb3gsXG5cdFx0XHRib3VuZGluZ19ib3hfYiA9IHJlY3RhbmdsZV9iLmJvdW5kaW5nQm94O1xuXG5cdFx0Ly8gSXRlcmF0ZSB0aHJvdWdoIHRoZSBib3VuZHMgb2YgdGhpc1xuXHRcdGZvciAoIHZlcnRleCBvZiBib3VuZGluZ19ib3hfYS5sZW5ndGggKVxuXHRcdHtcblx0XHRcdC8vIENhbGN1bGF0ZSB0aGUgb3ZlcmxhcHMgb2YgdGhlIHggYW5kIHkgcG9zaXRpb24gb2YgdGhlIHdhbGwgYW5kIGJvdW5kXG5cdFx0XHRvdmVybGFwcyA9IFtcblx0XHRcdFx0dmVydGV4LnkgLSBib3VuZGluZ19ib3hfYlsgMCBdLnksXG5cdFx0XHRcdHZlcnRleC54IC0gYm91bmRpbmdfYm94X2JbIDEgXS54LFxuXHRcdFx0XHR2ZXJ0ZXgueSAtIGJvdW5kaW5nX2JveF9iWyAyIF0ueSxcblx0XHRcdFx0dmVydGV4LnggLSBib3VuZGluZ19ib3hfYlsgMyBdLnhcblx0XHRcdF07XG5cblx0XHRcdC8vIElmIHRoZSBib3VuZCBpcyBjb250YWluZWQgd2l0aGluIHRoZSB3YWxsXG5cdFx0XHRpZiAoIG92ZXJsYXBzWyAwIF0gPD0gMCAmJiBvdmVybGFwc1sgMSBdID49IDAgJiYgb3ZlcmxhcHNbIDIgXSA+PSAwICYmIG92ZXJsYXBzWyAzIF0gPD0gMCApXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBlZGdlcyA9IHJlY3RhbmdsZS5lZGdlcyxcblx0XHRcdFx0XHRlZGdlID0gMCxcblx0XHRcdFx0XHRvdmVybGFwID0gLW92ZXJsYXBzWyAwIF07XG5cblx0XHRcdFx0Ly8gRmluZCB0aGUgc2lkZSBvZiBsZWFzdCBvdmVybGFwXG5cdFx0XHRcdGZvciAoIGxldCBpID0gMTsgaSA8IDQ7IGkrKyApXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoIE1hdGguYWJzKCBvdmVybGFwc1sgaSBdICkgPCBNYXRoLmFicyggb3ZlcmxhcCApIClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRlZGdlID0gaTtcblx0XHRcdFx0XHRcdG92ZXJsYXAgPSAtb3ZlcmxhcHNbIGkgXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLm92ZXJsYXAgPSBvdmVybGFwO1xuXHRcdFx0XHR0aGlzLmVkZ2UgPSB7XG5cdFx0XHRcdFx0eDogTWF0aC5zaWduKCBlZGdlc1sgZWRnZSBdLnggKSxcblx0XHRcdFx0XHR5OiBNYXRoLnNpZ24oIGVkZ2VzWyBlZGdlIF0ueSApXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8gQ2hlY2sgZm9yIGEgY29sbGlzaW9uIGJldHdlZW4gdHdvIHJvdGF0ZWQgcmVjdGFuZ2xlc1xuXHRpc19jb2xsaWRpbmdfd2l0aF9yb3RhdGVkKCByZWN0YW5nbGVfYSwgcmVjdGFuZ2xlX2IgKVxuXHR7XG5cdFx0aWYgKCBpc19zZXBhcmF0aW5nX2F4aXMoIHJlY3RhbmdsZV9hLCByZWN0YW5nbGVfYiwgdHJ1ZSApIClcblx0XHRcdHJldHVybiB0cnVlO1xuXG5cdFx0aWYgKCBpc19zZXBhcmF0aW5nX2F4aXMoIHJlY3RhbmdsZV9hLCByZWN0YW5nbGVfYiwgZmFsc2UgKSApXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdC8vIERldGVybWluZSBpZiByZWN0YW5nbGVfYSdzIGF4ZXMgc2VwYXJhdGUgcmVjdGFuZ2xlX2EgZnJvbSByZWN0YW5nbGVfYlxuXHRpc19zZXBhcmF0aW5nX2F4aXMoIHJlY3RhbmdsZV9hLCByZWN0YW5nbGVfYiwgaXNBTW92aW5nIClcblx0e1xuXHRcdC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzExNTQyNi9hbGdvcml0aG0tdG8tZGV0ZWN0LWludGVyc2VjdGlvbi1vZi10d28tcmVjdGFuZ2xlcz9ycT0xXG5cdFx0Ly8gaHR0cDovL2ltZ3VyLmNvbS9iTndyenN2XG5cblx0XHR2YXIgZWRnZXMgPSByZWN0YW5nbGVfYS5lZGdlcyxcblx0XHRcdGxlYXN0T3ZlcmxhcCA9IEluZmluaXR5LFxuXHRcdFx0bGVhc3RPdmVybGFwRWRnZSA9IDAsXG5cblx0XHRcdHNlcGFyYXRpbmdBeGlzID0gZmFsc2UsXG5cdFx0XHRvcHBvc2l0ZVNpZGVzLFxuXHRcdFx0bm9ybWFsLFxuXG5cdFx0XHRjdXJyZW50UG9pbnQsXG5cdFx0XHRuZXh0UG9pbnQsXG5cblx0XHRcdHNoYXBlVmVjdG9yLFxuXHRcdFx0c2hhcGUxRG90UHJvZHVjdCxcblx0XHRcdHNoYXBlMURvdFByb2R1Y3RTaWduO1xuXG5cdFx0Zm9yICggdmFyIGkgPSAwOyBpIDwgZWRnZXMubGVuZ3RoOyBpKysgKVxuXHRcdHtcblx0XHRcdG9wcG9zaXRlU2lkZXMgPSB0cnVlO1xuXG5cdFx0XHRub3JtYWwgPSB7XG5cdFx0XHRcdHg6IC1lZGdlc1sgaSBdLnksXG5cdFx0XHRcdHk6IGVkZ2VzWyBpIF0ueFxuXHRcdFx0fTtcblxuXHRcdFx0Y3VycmVudFBvaW50ID0gcmVjdGFuZ2xlX2EuYm91bmRpbmdCb3hbIGkgXTtcblx0XHRcdG5leHRQb2ludCA9IGkgPCAyID8gcmVjdGFuZ2xlX2EuYm91bmRpbmdCb3hbIGkgKyAyIF0gOiByZWN0YW5nbGVfYS5ib3VuZGluZ0JveFsgaSAtIDIgXTtcblxuXHRcdFx0c2hhcGVWZWN0b3IgPSB7XG5cdFx0XHRcdHg6IG5leHRQb2ludC54IC0gY3VycmVudFBvaW50LngsXG5cdFx0XHRcdHk6IG5leHRQb2ludC55IC0gY3VycmVudFBvaW50Lnlcblx0XHRcdH07XG5cdFx0XHRzaGFwZTFEb3RQcm9kdWN0ID0gc2hhcGVWZWN0b3IueCAqIG5vcm1hbC54ICsgc2hhcGVWZWN0b3IueSAqIG5vcm1hbC55O1xuXHRcdFx0c2hhcGUxRG90UHJvZHVjdFNpZ24gPSBzaGFwZTFEb3RQcm9kdWN0ID49IDA7XG5cblx0XHRcdHZhciBtaW4gPSBJbmZpbml0eSxcblx0XHRcdFx0bWF4ID0gLUluZmluaXR5O1xuXHRcdFx0Zm9yICggdmFyIGogPSAwOyBqIDwgNDsgaisrIClcblx0XHRcdHtcblx0XHRcdFx0bmV4dFBvaW50ID0gcmVjdGFuZ2xlX2IuYm91bmRpbmdCb3hbIGogXTtcblxuXHRcdFx0XHRzaGFwZVZlY3RvciA9IHtcblx0XHRcdFx0XHR4OiBuZXh0UG9pbnQueCAtIGN1cnJlbnRQb2ludC54LFxuXHRcdFx0XHRcdHk6IG5leHRQb2ludC55IC0gY3VycmVudFBvaW50LnksXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dmFyIHNoYXBlMkRvdFByb2R1Y3QgPSBzaGFwZVZlY3Rvci54ICogbm9ybWFsLnggKyBzaGFwZVZlY3Rvci55ICogbm9ybWFsLnksXG5cdFx0XHRcdFx0c2hhcGUyRG90UHJvZHVjdFNpZ24gPSBzaGFwZTJEb3RQcm9kdWN0ID49IDA7XG5cblx0XHRcdFx0aWYgKCBzaGFwZTJEb3RQcm9kdWN0U2lnbiA9PT0gc2hhcGUxRG90UHJvZHVjdFNpZ24gKVxuXHRcdFx0XHRcdG9wcG9zaXRlU2lkZXMgPSBmYWxzZTtcblxuXHRcdFx0XHRpZiAoIHNoYXBlMkRvdFByb2R1Y3QgPCBtaW4gKVxuXHRcdFx0XHRcdG1pbiA9IHNoYXBlMkRvdFByb2R1Y3Q7XG5cdFx0XHRcdGVsc2UgaWYgKCBzaGFwZTJEb3RQcm9kdWN0ID4gbWF4IClcblx0XHRcdFx0XHRtYXggPSBzaGFwZTJEb3RQcm9kdWN0O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIG9wcG9zaXRlU2lkZXMgKVxuXHRcdFx0e1xuXHRcdFx0XHRzZXBhcmF0aW5nQXhpcyA9IHRydWU7XG5cblx0XHRcdFx0aWYgKCBpc0FNb3ZpbmcgKVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgb3ZlcmxhcDtcblx0XHRcdGlmICggbWluIDwgc2hhcGUxRG90UHJvZHVjdCApXG5cdFx0XHRcdG92ZXJsYXAgPSBtYXggLSBzaGFwZTFEb3RQcm9kdWN0O1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRvdmVybGFwID0gbWF4IC0gbWluO1xuXG5cdFx0XHRpZiAoIG92ZXJsYXAgPCBsZWFzdE92ZXJsYXAgKVxuXHRcdFx0e1xuXHRcdFx0XHRsZWFzdE92ZXJsYXAgPSBvdmVybGFwO1xuXHRcdFx0XHRsZWFzdE92ZXJsYXBFZGdlID0gaTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLmVkZ2UgPSBsZWFzdE92ZXJsYXBFZGdlO1xuXHRcdHRoaXMub3ZlcmxhcCA9IGxlYXN0T3ZlcmxhcDtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59IiwiaW1wb3J0IFZlY3RvciBmcm9tICd1dGlsL3ZlY3Rvcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJvdW5kaW5nQm94XG57XG5cdGNvbnN0cnVjdG9yKCB2ZXJ0aWNlcyA9IFtdLCBhbmdsZSA9IDAsIHRyYW5zZm9ybV9vcmlnaW5feCA9IDAsIHRyYW5zZm9ybV9vcmlnaW5feSA9IDAgKVxuXHR7XG5cdFx0dGhpcy52ZXJ0aWNlcyA9IHZlcnRpY2VzO1xuXHRcdHRoaXMuZWRnZXMgPSBBcnJheSggdmVydGljZXMubGVuZ3RoICk7XG5cdFx0dGhpcy5ib3VuZHMgPSBBcnJheSggMiApO1xuXG5cdFx0dGhpcy5yb3RhdGUoIGFuZ2xlLCB0cmFuc2Zvcm1fb3JpZ2luX3gsIHRyYW5zZm9ybV9vcmlnaW5feSApO1xuXHR9XG5cblx0Ly8gUm90YXRlIGJvdW5kaW5nIGJveCBhcm91bmQgb3JpZ2luXG5cdHJvdGF0ZSggZEFuZ2xlID0gMCwgdHJhbnNmb3JtX29yaWdpbl94ID0gMCwgdHJhbnNmb3JtX29yaWdpbl95ID0gMCApXG5cdHtcblx0XHRsZXQgY29zID0gTWF0aC5jb3MoIGRBbmdsZSApLFxuXHRcdFx0c2luID0gTWF0aC5zaW4oIGRBbmdsZSApLFxuXHRcdFx0cm90YXRpb25fbWF0cml4XzJkID0gW1xuXHRcdFx0XHRbIGNvcywgLXNpbiBdLFxuXHRcdFx0XHRbIHNpbiwgY29zIF1cblx0XHRcdF0sXG5cdFx0XHRwb3NfYXJyYXkgPSBBcnJheSggMiApO1xuXG5cdFx0Zm9yICggbGV0IHZlcnRleCBvZiB0aGlzLnZlcnRpY2VzIClcblx0XHR7XG5cdFx0XHRwb3NfYXJyYXlbIDAgXSA9IHZlcnRleC54IC0gdHJhbnNmb3JtX29yaWdpbl94O1xuXHRcdFx0cG9zX2FycmF5WyAxIF0gPSB2ZXJ0ZXgueSAtIHRyYW5zZm9ybV9vcmlnaW5feTtcblxuXHRcdFx0bGV0IG5ld19wb3MgPSB0aGlzLm11bHRpcGx5X21hdHJpY2VzKCByb3RhdGlvbl9tYXRyaXhfMmQsIHBvc19hcnJheSApO1xuXG5cdFx0XHR2ZXJ0ZXgueCA9IG5ld19wb3NbIDAgXVsgMCBdICsgdHJhbnNmb3JtX29yaWdpbl94O1xuXHRcdFx0dmVydGV4LnkgPSBuZXdfcG9zWyAwIF1bIDEgXSArIHRyYW5zZm9ybV9vcmlnaW5feTtcblx0XHR9XG5cblx0XHR0aGlzLnVwZGF0ZV9lZGdlcygpO1xuXHRcdHRoaXMudXBkYXRlX2JvdW5kcygpO1xuXHR9XG5cblx0Ly8gVHJhbnNsYXRlIGJvdW5kaW5nIGJveFxuXHR0cmFuc2xhdGUoIGRYID0gMCwgZFkgPSAwIClcblx0e1xuXHRcdGZvciAoIGxldCB2ZXJ0ZXggb2YgdGhpcy52ZXJ0aWNlcyApXG5cdFx0e1xuXHRcdFx0dmVydGV4LnggKz0gZFg7XG5cdFx0XHR2ZXJ0ZXgueSArPSBkWTtcblx0XHR9XG5cblx0XHR0aGlzLnVwZGF0ZV9lZGdlcygpO1xuXHRcdHRoaXMudXBkYXRlX2JvdW5kcygpO1xuXHR9XG5cblx0Ly8gQ3JlYXRlcyBhIHZlY3RvciBmb3IgZWFjaCBlZGdlIG9mIHRoZSBzaGFwZVxuXHR1cGRhdGVfZWRnZXMoKVxuXHR7XG5cdFx0bGV0IG51bV92ZXJ0aWNlcyA9IHRoaXMudmVydGljZXMubGVuZ3RoO1xuXHRcdGZvciAoIGxldCBpID0gMDsgaSA8IG51bV92ZXJ0aWNlczsgaSsrIClcblx0XHR7XG5cdFx0XHRsZXQgdmVydGV4ID0gdGhpcy52ZXJ0aWNlc1sgaSBdLFxuXHRcdFx0XHRuZXh0X3ZlcnRleCA9ICggaSA9PT0gbnVtX3ZlcnRpY2VzIC0gMSApID8gdGhpcy52ZXJ0aWNlc1sgMCBdIDogdGhpcy52ZXJ0aWNlc1sgaSArIDEgXTtcblxuXHRcdFx0dGhpcy5lZGdlc1sgaSBdID0gbmV4dF92ZXJ0ZXguc3VidHJhY3QoIHZlcnRleCApO1xuXHRcdH1cblx0fVxuXG5cdC8vIEZpbmRzIHRoZSBtaW5pbXVtIGFuZCBtYXhpbXVtIHggYW5kIHkgY29vcmRpbmF0ZXMgb2YgdGhlIHNoYXBlXG5cdHVwZGF0ZV9ib3VuZHMoKVxuXHR7XG5cdFx0Ly8gSW5jbHVkZSB0aGUgaW5kZXggb2YgdGhlIGVkZ2UgYm91bmRhcmllc1xuXHRcdHZhciBsb3dlckJvdW5kID0ge1xuXHRcdFx0XHR4OiB0aGlzLnZlcnRpY2VzWyAwIF0ueCxcblx0XHRcdFx0eTogdGhpcy52ZXJ0aWNlc1sgMCBdLnksXG5cdFx0XHRcdHhfaW5kZXg6IDAsXG5cdFx0XHRcdHlfaW5kZXg6IDBcblx0XHRcdH0sXG5cdFx0XHR1cHBlckJvdW5kID0ge1xuXHRcdFx0XHR4OiB0aGlzLnZlcnRpY2VzWyAwIF0ueCxcblx0XHRcdFx0eTogdGhpcy52ZXJ0aWNlc1sgMCBdLnksXG5cdFx0XHRcdHhfaW5kZXg6IDAsXG5cdFx0XHRcdHlfaW5kZXg6IDBcblx0XHRcdH07XG5cblx0XHRmb3IgKCB2YXIgaSA9IDE7IGkgPCA0OyBpKysgKVxuXHRcdHtcblx0XHRcdHZhciBjdXJyZW50Qm91bmQgPSB0aGlzLnZlcnRpY2VzWyBpIF07XG5cblx0XHRcdGlmICggY3VycmVudEJvdW5kLnggPCBsb3dlckJvdW5kLnggKVxuXHRcdFx0e1xuXHRcdFx0XHRsb3dlckJvdW5kLnhfaW5kZXggPSBpO1xuXHRcdFx0XHRsb3dlckJvdW5kLnggPSBjdXJyZW50Qm91bmQueDtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKCBjdXJyZW50Qm91bmQueCA+IHVwcGVyQm91bmQueCApXG5cdFx0XHR7XG5cdFx0XHRcdHVwcGVyQm91bmQueF9pbmRleCA9IGk7XG5cdFx0XHRcdHVwcGVyQm91bmQueCA9IGN1cnJlbnRCb3VuZC5ib3VuZFhcblx0XHRcdH1cblxuXHRcdFx0aWYgKCBjdXJyZW50Qm91bmQueSA8IGxvd2VyQm91bmQueSApXG5cdFx0XHR7XG5cdFx0XHRcdGxvd2VyQm91bmQueV9pbmRleCA9IGk7XG5cdFx0XHRcdGxvd2VyQm91bmQueSA9IGN1cnJlbnRCb3VuZC55O1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoIGN1cnJlbnRCb3VuZC55ID4gdXBwZXJCb3VuZC55IClcblx0XHRcdHtcblx0XHRcdFx0dXBwZXJCb3VuZC55X2luZGV4ID0gaTtcblx0XHRcdFx0dXBwZXJCb3VuZC55ID0gY3VycmVudEJvdW5kLnk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5ib3VuZHNbIDAgXSA9IGxvd2VyQm91bmQ7XG5cdFx0dGhpcy5ib3VuZHNbIDEgXSA9IHVwcGVyQm91bmQ7XG5cdH1cblxuXHQvLyBVc2VkIGZvciBtYXRyaXggcm90YXRpb25cblx0bXVsdGlwbHlfbWF0cmljZXMoIG1hdHJpeF9hID0gW10sIG1hdHJpeF9iID0gW10gKVxuXHR7XG5cdFx0aWYgKCBtYXRyaXhfYS5sZW5ndGggPT09IDAgfHwgbWF0cml4X2IubGVuZ3RoID09PSAwIClcblx0XHRcdHJldHVybiBbXTtcblxuXHRcdC8vIE51bWJlciBvZiByb3dzIGluIG1hdHJpeF9hXG5cdFx0bGV0IGhlaWdodCA9IG1hdHJpeF9hLmxlbmd0aDtcblxuXHRcdC8vIE51bWJlciBvZiBjb2x1bW5zIGluIG1hdHJpeF9iXG5cdFx0bGV0IHdpZHRoID0gbWF0cml4X2JbIDAgXS5sZW5ndGg7XG5cblx0XHQvLyBDcmVhdGUgYW4gZW1wdHkgbWF0cml4IHRvIHN0b3JlIHRoZSByZXN1bHRcblx0XHRsZXQgbWF0cml4ID0gQXJyYXkoIGhlaWdodCApO1xuXG5cdFx0Ly8gSXRlcmF0ZSB0aHJvdWdoIGVhY2ggcm93IG9mIG1hdHJpeF9hXG5cdFx0Zm9yICggbGV0IGFfeSA9IDA7IGFfeSA8IGhlaWdodDsgYV95KysgKVxuXHRcdHtcblx0XHRcdGxldCBhX3JvdyA9IG1hdHJpeF9hWyBhX3kgXTtcblx0XHRcdG1hdHJpeFsgYV95IF0gPSBBcnJheSggd2lkdGggKTtcblxuXHRcdFx0Ly8gSXRlcmF0ZSB0aHJvdWdoIGVhY2ggY29sdW1uIG9mIG1hdHJpeF9iXG5cdFx0XHRmb3IgKCBsZXQgYl94ID0gMDsgYl94IDwgd2lkdGg7IGJfeCsrIClcblx0XHRcdHtcblx0XHRcdFx0bGV0IGNlbGwgPSAwO1xuXG5cdFx0XHRcdC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgYmlnZ2VyIG9mIHRoZSB3aWR0aCBvZiBtYXRyaXhfYSBvciBoZWlnaHQgb2YgbWF0cml4X2Jcblx0XHRcdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgTWF0aC5tYXgoIGFfcm93Lmxlbmd0aCwgbWF0cml4X2IubGVuZ3RoICk7IGkrKyApXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjZWxsICs9IGFfcm93WyBpIF0gKiBtYXRyaXhfYlsgaSBdWyBiX3ggXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdG1hdHJpeFsgYV95IF0ucHVzaCggY2VsbCApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBtYXRyaXg7XG5cdH1cbn0iLCJpbXBvcnQgRW50aXR5IGZyb20gJ2VudGl0eS9lbnRpdHknO1xuXG5jb25zdCBNQVhfQk9VTkNFUyA9IDE7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJ1bGxldCBleHRlbmRzIEVudGl0eVxue1xuXHRjb25zdHJ1Y3RvciggeCwgeSwgYW5nbGUsIHNwZWVkID0gLTMsIHBfaWQgPSAnJyApXG5cdHtcblx0XHRzdXBlciggeCwgeSwgNSwgMi41LCBhbmdsZSApO1xuXG5cdFx0dGhpcy5wX2lkID0gcF9pZDtcblx0XHR0aGlzLm51bV9ib3VuY2VzID0gMDtcblxuXHRcdHRoaXMuc2V0X3NwZWVkKCBzcGVlZCApO1xuXHR9XG5cblx0Ym91bmNlKCBlZGdlIClcblx0e1xuXHRcdHRoaXMubnVtX2JvdW5jZXMrKztcblxuXHRcdGlmICggdGhpcy5udW1fYm91bmNlcyA+PSBNQVhfQk9VTkNFUyApXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblxuXHRcdGlmICggZWRnZS54ID09PSAwIClcblx0XHR7XG5cdFx0XHRpZiAoIHRoaXMuYW5nbGUgPCAwIClcblx0XHRcdFx0dGhpcy50dXJuX3RvKCAtTWF0aC5QSSAtIHRoaXMuYW5nbGUgKTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0dGhpcy50dXJuX3RvKCBNYXRoLlBJIC0gdGhpcy5hbmdsZSApO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0dGhpcy50dXJuX3RvKCAtdGhpcy5hbmdsZSApO1xuXHRcdH1cblx0fVxuXG5cdHJlc2V0KClcblx0e1xuXHRcdHRoaXMucF9pZCA9ICcnO1xuXHRcdHRoaXMubnVtX2JvdW5jZXMgPSAwO1xuXHR9XG59IiwiaW1wb3J0IFV0aWwgZnJvbSAndXRpbC91dGlsJztcbmltcG9ydCBWZWN0b3IgZnJvbSAndXRpbC92ZWN0b3InO1xuaW1wb3J0IEJvdW5kaW5nQm94IGZyb20gJ2VudGl0eS9ib3VuZGluZ19ib3gnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFbnRpdHlcbntcblx0Y29uc3RydWN0b3IoIHggPSAwLCB5ID0gMCwgd2lkdGggPSAwLCBoZWlnaHQgPSAwLCBhbmdsZSA9IDAsIHRyYW5zZm9ybV9vcmlnaW5feCA9IDAuNSwgdHJhbnNmb3JtX29yaWdpbl95ID0gMC41IClcblx0e1xuXHRcdHRoaXMuaWQgPSBVdGlsLmdlbmVyYXRlX2lkKCk7XG5cblx0XHR0aGlzLnBvcyA9IG5ldyBWZWN0b3IoIHgsIHkgKTtcblx0XHR0aGlzLm5leHRQb3MgPSBuZXcgVmVjdG9yKCk7XG5cdFx0dGhpcy5sYXN0UG9zID0gbmV3IFZlY3RvcigpO1xuXHRcdHRoaXMudmVsb2NpdHkgPSBuZXcgVmVjdG9yKCk7XG5cblx0XHR0aGlzLndpZHRoID0gd2lkdGg7XG5cdFx0dGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cdFx0dGhpcy5yYWRpdXMgPSBNYXRoLmh5cG90KCB0aGlzLmhhbGZXaWR0aCwgdGhpcy5oYWxmSGVpZ2h0ICk7XG5cblx0XHQvLyBDbG9ja3dpc2UgZnJvbSAzIE8nY2xvY2tcblx0XHR0aGlzLmFuZ2xlID0gYW5nbGU7XG5cdFx0dGhpcy5uZXh0X2FuZ2xlID0gMDtcblx0XHR0aGlzLmFuZ2xlX2NvcyA9IE1hdGguY29zKCBhbmdsZSApO1xuXHRcdHRoaXMuYW5nbGVfc2luID0gTWF0aC5zaW4oIGFuZ2xlICk7XG5cdFx0dGhpcy5hbmd1bGFyX3ZlbG9jaXR5ID0gMDtcblxuXHRcdHRoaXMudHJhbnNmb3JtX29yaWdpbiA9IG5ldyBWZWN0b3IoIHRyYW5zZm9ybV9vcmlnaW5feCwgdHJhbnNmb3JtX29yaWdpbl95ICk7XG5cdFx0dGhpcy5ib3VuZGluZ19ib3ggPSB0aGlzLmNyZWF0ZV9yZWN0YW5ndWxhcl9ib3VuZGluZ19ib3goKTtcblx0fVxuXG5cdC8vIENyZWF0ZSBhIHJlY3Rhbmd1bGFyIGJvdW5kaW5nIGJveFxuXHRjcmVhdGVfcmVjdGFuZ3VsYXJfYm91bmRpbmdfYm94KClcblx0e1xuXHRcdGxldCBoYWxmX3dpZHRoID0gdGhpcy53aWR0aCAvIDIsXG5cdFx0XHRoYWxmX2hlaWdodCA9IHRoaXMuaGVpZ2h0IC8gMixcblx0XHRcdHZlcnRpY2VzID0gW1xuXHRcdFx0XHRuZXcgVmVjdG9yKCB0aGlzLnBvcy54IC0gaGFsZl93aWR0aCwgdGhpcy5wb3MueSArIGhhbGZfaGVpZ2h0ICksXG5cdFx0XHRcdG5ldyBWZWN0b3IoIHRoaXMucG9zLnggLSBoYWxmX3dpZHRoLCB0aGlzLnBvcy55IC0gaGFsZl9oZWlnaHQgKSxcblx0XHRcdFx0bmV3IFZlY3RvciggdGhpcy5wb3MueCArIGhhbGZfd2lkdGgsIHRoaXMucG9zLnkgLSBoYWxmX2hlaWdodCApLFxuXHRcdFx0XHRuZXcgVmVjdG9yKCB0aGlzLnBvcy54ICsgaGFsZl93aWR0aCwgdGhpcy5wb3MueSArIGhhbGZfaGVpZ2h0IClcblx0XHRcdF0sXG5cdFx0XHR0cmFuc2Zvcm1fb3JpZ2luX3ggPSB0aGlzLndpZHRoICogdGhpcy50cmFuc2Zvcm1fb3JpZ2luLnggKyB0aGlzLnBvcy54LFxuXHRcdFx0dHJhbnNmb3JtX29yaWdpbl95ID0gdGhpcy5oZWlnaHQgKiB0aGlzLnRyYW5zZm9ybV9vcmlnaW4ueSArIHRoaXMucG9zLnk7XG5cblx0XHRyZXR1cm4gbmV3IEJvdW5kaW5nQm94KCB2ZXJ0aWNlcywgdGhpcy5hbmdsZSwgdHJhbnNmb3JtX29yaWdpbl94LCB0cmFuc2Zvcm1fb3JpZ2luX3kgKTtcblx0fVxuXG5cdG1vdmUoIGRYID0gMCwgZFkgPSAwIClcblx0e1xuXG5cdFx0dGhpcy5tb3ZlVG8oIHRoaXMucG9zLnggKyBkWCwgdGhpcy5wb3MueSArIGRZICk7XG5cdH1cblxuXHRtb3ZlX3RvKCB4ID0gMCwgeSA9IDAgKVxuXHR7XG5cdFx0bGV0IGRYID0geCAtIHRoaXMucG9zLngsXG5cdFx0XHRkWSA9IHkgLSB0aGlzLnBvcy55O1xuXG5cdFx0dGhpcy5wb3Muc2V0KCB4LCB5ICk7XG5cdFx0dGhpcy5ib3VuZGluZ19ib3gudHJhbnNsYXRlKCBkWCwgZFkgKTtcblx0fVxuXG5cdHR1cm4oIGRBbmdsZSA9IDAgKVxuXHR7XG5cblx0XHR0aGlzLnR1cm5UbyggdGhpcy5hbmdsZSArIGRBbmdsZSApO1xuXHR9XG5cblx0dHVybl90byggYW5nbGUgPSAwIClcblx0e1xuXHRcdGxldCBkQW5nbGUgPSB0aGlzLmFuZ2xlIC0gYW5nbGUsXG5cdFx0XHR0cmFuc2Zvcm1fb3JpZ2luX3ggPSB0aGlzLndpZHRoICogdGhpcy50cmFuc2Zvcm1fb3JpZ2luLnggKyB0aGlzLnBvcy54LFxuXHRcdFx0dHJhbnNmb3JtX29yaWdpbl95ID0gdGhpcy5oZWlnaHQgKiB0aGlzLnRyYW5zZm9ybV9vcmlnaW4ueSArIHRoaXMucG9zLnk7XG5cblx0XHR0aGlzLmFuZ2xlID0gYW5nbGU7XG5cdFx0dGhpcy5hbmdsZV9jb3MgPSBNYXRoLmNvcyggYW5nbGUgKTtcblx0XHR0aGlzLmFuZ2xlX3NpbiA9IE1hdGguc2luKCBhbmdsZSApO1xuXG5cdFx0aWYgKCBNYXRoLmFicyggdGhpcy5hbmdsZSApID49IDYuMjgzMTg1IClcblx0XHRcdHJldHVybiB0aGlzLnR1cm5fdG8oIHRoaXMuYW5nbGUgJSA2LjI4MzE4NSApO1xuXG5cdFx0Ly8gQ2hhbmdlIGRpcmVjdGlvbiBvZiB2ZWxvY2l0eVxuXHRcdGlmICggdGhpcy52ZWxvY2l0eS5sZW5ndGggPiAwIClcblx0XHRcdHRoaXMuc2V0VmVsb2NpdHkoIHRoaXMuc3BlZWQgKTtcblxuXHRcdHRoaXMuYm91bmRpbmdfYm94LnJvdGF0ZSggZEFuZ2xlLCB0cmFuc2Zvcm1fb3JpZ2luX3gsIHRyYW5zZm9ybV9vcmlnaW5feSApO1xuXHR9XG5cblx0c2V0X3NwZWVkKCBzcGVlZCA9IDAgKVxuXHR7XG5cdFx0dGhpcy5zcGVlZCA9IHNwZWVkO1xuXHRcdHRoaXMudmVsb2NpdHkuc2V0KCBzcGVlZCAqIHRoaXMuYW5nbGVfY29zLCBzcGVlZCAqIHRoaXMuYW5nbGVfc2luICk7XG5cdH1cblxuXHRzZXRfdHVybl9zcGVlZCggc3BlZWQgPSAwIClcblx0e1xuXG5cdFx0dGhpcy5hbmd1bGFyX3ZlbG9jaXR5ID0gc3BlZWQ7XG5cdH1cbn0iLCJpbXBvcnQgRW50aXR5IGZyb20gJ2VudGl0eS9lbnRpdHknO1xuXG5jb25zdCBERUZBVUxUX1NJWkUgPSA1O1xuY29uc3QgQ09VTlRET1dOX1RJQ0tTID0gMTA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEV4cGxvc2lvbiBleHRlbmRzIEVudGl0eVxue1xuXHRjb25zdHJ1Y3RvciggeCwgeSwgcmFkaXVzID0gREVGQVVMVF9TSVpFIClcblx0e1xuXHRcdHN1cGVyKCB4LCB5ICk7XG5cblx0XHR0aGlzLnJhZGl1cyA9IHJhZGl1cztcblx0XHR0aGlzLnRpbWVfbGVmdCA9IENPVU5URE9XTl9USUNLUztcblx0fVxuXG5cdGNvdW50X2Rvd24oIG51bV90aWNrcyApXG5cdHtcblx0XHRpZiAoIHRoaXMudGltZV9sZWZ0IDw9IDEgKVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cblx0XHR0aGlzLnRpbWVfbGVmdCAtPSBudW1fdGlja3M7XG5cdH1cblxuXHRyZXNldCgpXG5cdHtcblx0XHR0aGlzLnRpbWVfbGVmdCA9IENPVU5URE9XTl9USUNLUztcblx0fVxufSIsImltcG9ydCBFbnRpdHkgZnJvbSAnZW50aXR5L2VudGl0eSc7XG5cbmNvbnN0IENPVU5URE9XTl9USUNLUyA9IDYwICogMTA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1pbmUgZXh0ZW5kcyBFbnRpdHlcbntcblx0Y29uc3RydWN0b3IoIHgsIHksIHBfaWQgPSAnJywgdGltZV9sZWZ0ID0gQ09VTlRET1dOX1RJQ0tTIClcblx0e1xuXHRcdHN1cGVyKCB4LCB5ICk7XG5cblx0XHR0aGlzLnBfaWQgPSBwX2lkO1xuXHRcdHRoaXMudGltZV9sZWZ0ID0gQ09VTlRET1dOX1RJQ0tTO1xuXHR9XG5cblx0Y291bnRfZG93biggbnVtX3RpY2tzIClcblx0e1xuXHRcdGlmICggdGhpcy50aW1lX2xlZnQgPD0gMSApXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblxuXHRcdHRoaXMudGltZV9sZWZ0IC09IG51bV90aWNrcztcblx0fVxuXG5cdHJlc2V0KClcblx0e1xuXHRcdHRoaXMudGltZV9sZWZ0ID0gQ09VTlRET1dOX1RJQ0tTO1xuXHR9XG59IiwiaW1wb3J0IFZlY3RvciBmcm9tICd1dGlsL3ZlY3Rvcic7XG5pbXBvcnQgRW50aXR5IGZyb20gJ2VudGl0eS9lbnRpdHknO1xuaW1wb3J0IEJ1bGxldCBmcm9tICdlbnRpdHkvYnVsbGV0JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGFuayBleHRlbmRzIEVudGl0eVxue1xuXHRjb25zdHJ1Y3RvciggaWQgPSAnJywgeCA9IDAsIHkgPSAwLCBhbmdsZSA9IDAgKVxuXHR7XG5cdFx0c3VwZXIoIHgsIHksIDUwLCAyNSwgYW5nbGUgKTtcblxuXHRcdHRoaXMuaWQgPSBpZDtcblx0XHR0aGlzLm5hbWUgPSAnVGFua3knO1xuXHRcdHRoaXMuc2NvcmUgPSAwO1xuXHRcdHRoaXMubGFzdF9idWxsZXRfdGljayA9IDA7XG5cdFx0dGhpcy5taW5lcyA9IFtdO1xuXHRcdHRoaXMuYnVsbGV0cyA9IFtdO1xuXHRcdHRoaXMuYmFycmVsID0gbmV3IEVudGl0eSggeCwgeSwgNTAsIDUsIDAsIDAsIDAuNSApO1xuXHR9XG5cblx0bW92ZSggeCwgeSApXG5cdHtcblx0XHRzdXBlci5tb3ZlKCB4LCB5ICk7XG5cdFx0dGhpcy5iYXJyZWwubW92ZSggeCwgeSApO1xuXHR9XG5cblx0bW92ZV90byggeCwgeSApXG5cdHtcblx0XHRzdXBlci5tb3ZlX3RvKCB4LCB5ICk7XG5cdFx0dGhpcy5iYXJyZWwubW92ZV90byggeCwgeSApO1xuXHR9XG5cblx0dHVybl9iYXJyZWwoIHgsIHksIGNhbWVyYV9vZmZzZXRfeCwgY2FtZXJhX29mZnNldF95IClcblx0e1xuXHRcdHRoaXMudHVybl90byggTWF0aC5hdGFuMiggdGhpcy5iYXJyZWwucG9zLnkgLSB5IC0gY2FtZXJhX29mZnNldF95LCB0aGlzLmJhcnJlbC5wb3MueCAtIHggLSBjYW1lcmFfb2Zmc2V0X3ggKSApO1xuXHR9XG5cblx0dHVybl9iYXJyZWxfdG8oIGFuZ2xlIClcblx0e1xuXHRcdHRoaXMuYmFycmVsLnR1cm5fdG8oIGFuZ2xlICk7XG5cdH1cblxuXHR0cmFuc2xhdGVBbG9uZ1dhbGwoIGVkZ2UgKVxuXHR7XG5cdFx0Ly8gTW92ZSBieSB0aGUgdmVsb2NpdHkgcHJvamVjdGVkIG9udG8gdGhlIHVuaXQgdmVjdG9yIFxuXHRcdHZhciBkb3RQcm9kdWN0ID0gdGhpcy52ZWxvY2l0eS54ICogZWRnZS54ICsgdGhpcy52ZWxvY2l0eS55ICogZWRnZS55O1xuXHRcdHRoaXMubW92ZVBvcyggZG90UHJvZHVjdCAqIGVkZ2UueCwgZG90UHJvZHVjdCAqIGVkZ2UueSApO1xuXHR9XG5cblx0dHJhbnNsYXRlQWxvbmdQbGF5ZXIoIGVkZ2VVbml0VmVjdG9yIClcblx0e1xuXHRcdHZhciBkb3RQcm9kdWN0ID0gdGhpcy52ZWxvY2l0eS54ICogZWRnZVVuaXRWZWN0b3IueCArIHRoaXMudmVsb2NpdHkueSAqIGVkZ2VVbml0VmVjdG9yLnk7XG5cdFx0dGhpcy5tb3ZlUG9zKCBkb3RQcm9kdWN0ICogZWRnZVVuaXRWZWN0b3IueCwgZG90UHJvZHVjdCAqIGVkZ2VVbml0VmVjdG9yLnkgKTtcblx0fVxuXG5cdHJvdGF0ZUFsb25nV2FsbCggZWRnZSwgb3ZlcmxhcCApXG5cdHtcblx0XHR2YXIgZGlzcGxhY2VtZW50VmVjdG9yID0ge1xuXHRcdFx0eDogb3ZlcmxhcCAqIGVkZ2UueSxcblx0XHRcdHk6IG92ZXJsYXAgKiBlZGdlLnhcblx0XHR9O1xuXG5cdFx0aWYgKCBlZGdlLnggPCAwIClcblx0XHRcdGRpc3BsYWNlbWVudFZlY3Rvci55ID0gLWRpc3BsYWNlbWVudFZlY3Rvci55O1xuXG5cdFx0aWYgKCBlZGdlLnkgPCAwIClcblx0XHRcdGRpc3BsYWNlbWVudFZlY3Rvci54ID0gLWRpc3BsYWNlbWVudFZlY3Rvci54O1xuXG5cdFx0dGhpcy5tb3ZlUG9zKCBkaXNwbGFjZW1lbnRWZWN0b3IueCwgZGlzcGxhY2VtZW50VmVjdG9yLnkgKTtcblx0fVxuXG5cdC8vIENhbmNlbCB2ZWxvY2l0eSBpbiB0aGUgZGlyZWN0aW9uIG9mIHRoZSBvdGhlciBwbGF5ZXIncyBjb2xsaWRpbmcgZWRnZVxuXHRyb3RhdGVBbG9uZ1BsYXllciggZWRnZVVuaXRWZWN0b3IgKVxuXHR7XG5cdFx0dmFyIHRhbmdlbnRpYWxWZWxvY2l0eSA9IHRoaXMucmFkaXVzICogdGhpcy5yb3RhdGlvbi5zcGVlZDtcblx0XHR0aGlzLm1vdmVQb3MoIHRhbmdlbnRpYWxWZWxvY2l0eSAqIGVkZ2VVbml0VmVjdG9yLngsIHRhbmdlbnRpYWxWZWxvY2l0eSAqIGVkZ2VVbml0VmVjdG9yLnkgKTtcblx0fVxuXG5cdC8vIEZpcmUgYSBwcm9qZWN0aWxlIGZyb20gdGhlIGVuZCBvZiBiYXJyZWwgYW5kIHJldHVybiB0aGUgcmVmZXJlbmNlXG5cdHNob290KClcblx0e1xuXHRcdHRoaXMuYmFycmVsLnJvdGF0ZUJvdW5kaW5nQm94KCk7XG5cblx0XHQvLyBTZXQgdGhlIHByb2plY3RpbGUgc3RhcnRpbmcgcG9zaXRpb24gdG8gdGhlIG1pZGRsZSBvZiB0aGUgYmFycmVsIHRpcFxuXHRcdHZhciBwcm9qZWN0aWxlUG9zID0gbmV3IFZlY3RvciggdGhpcy5iYXJyZWwuYm91bmRpbmdCb3hbIDIgXS54LCB0aGlzLmJhcnJlbC5ib3VuZGluZ0JveFsgMiBdLnkgKTtcblx0XHQvLyBwcm9qZWN0aWxlUG9zLmFkZCggLXRoaXMuYmFycmVsLmJvdW5kaW5nQm94WyAyIF0ueCwgLXRoaXMuYmFycmVsLmJvdW5kaW5nQm94WyAyIF0ueSApO1xuXHRcdC8vIHByb2plY3RpbGVQb3MuZGl2aWRlKCAyICk7XG5cdFx0Ly8gcHJvamVjdGlsZVBvcy5hZGQoIHRoaXMuYmFycmVsLmJvdW5kaW5nQm94WyAzIF0ueCwgdGhpcy5iYXJyZWwuYm91bmRpbmdCb3hbIDMgXS55ICk7XG5cblx0XHR2YXIgcHJvamVjdGlsZSA9IG5ldyBQcm9qZWN0aWxlKCB0aGlzLmlkLCBwcm9qZWN0aWxlUG9zLngsIHByb2plY3RpbGVQb3MueSwgdGhpcy5iYXJyZWwuYW5nbGUgKTtcblx0XHR0aGlzLnByb2plY3RpbGVzLnB1c2goIHByb2plY3RpbGUgKTtcblxuXHRcdHJldHVybiBwcm9qZWN0aWxlO1xuXHR9XG5cblx0Ly8gUmV0dXJucyB0cnVlIGlmIHRoZXJlIGlzIGEgY29sbGlzaW9uIGJldHdlZW4gdGhpcyB0YW5rIGFuZCBhIHRhbmsgZnJvbSBwbGF5ZXJzXG5cdGlzUGxheWVyQ29sbGlzaW9uKCBwbGF5ZXIgKVxuXHR7XG5cdFx0Ly8gRG9uJ3QgY2hlY2sgdGhpcyB0YW5rIHdpdGggaXRzZWxmXG5cdFx0aWYgKCBwbGF5ZXIuaWQgPT09IHRoaXMuaWQgKVxuXHRcdHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBSZXR1cm4gaWYgYSBjb2xsaXNpb24gaXMgZm91bmRcblx0XHR2YXIgZWRnZVVuaXRWZWN0b3IgPSB0aGlzLmlzUm90YXRlZFJlY3RhbmdsZUNvbGxpc2lvbiggcGxheWVyICk7XG5cdFx0aWYgKCBlZGdlVW5pdFZlY3RvciApXG5cdFx0e1xuXHRcdFx0cmV0dXJuIGVkZ2VVbml0VmVjdG9yO1xuXHRcdH1cblx0fVxuXG5cdHJlc2V0KClcblx0e1xuXHRcdHRoaXMubmFtZSA9ICdUYW5reSc7XG5cdFx0dGhpcy5zY29yZSA9IDA7XG5cdFx0dGhpcy5sYXN0U2hvdFRpY2sgPSAwO1xuXHRcdHRoaXMuYnVsbGV0cy5sZW5ndGggPSAwO1xuXHRcdHRoaXMubWluZXMubGVuZ3RoID0gMDtcblx0fVxufSIsImltcG9ydCBFbnRpdHkgZnJvbSAnZW50aXR5L2VudGl0eSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdhbGwgZXh0ZW5kcyBFbnRpdHlcbnt9IiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgRXZlbnRcbntcblx0Y29uc3RydWN0b3IoKVxuXHR7XG5cdFx0dGhpcy5zdWJzY3JpYmVycyA9IFtdO1xuXHR9XG5cblx0ZGlzcGF0Y2goKVxuXHR7XG5cdFx0Zm9yICggZnVuYyBvZiB0aGlzLnN1YnNjcmliZXJzIClcblx0XHR7XG5cdFx0XHRmdW5jKCk7XG5cdFx0fVxuXHR9XG5cblx0bGlzdGVuKCBmdW5jIClcblx0e1xuXHRcdHRoaXMuc3Vic2NyaWJlcnMucHVzaCggZnVuYyApO1xuXHR9XG59IiwiaW1wb3J0IEdhbWVNYXAgZnJvbSAnLi9nYW1lX21hcCc7XG5pbXBvcnQgRXhwbG9zaW9uIGZyb20gJ2VudGl0eS9leHBsb3Npb24nO1xuaW1wb3J0IENvbGxpc2lvbiBmcm9tICdjb2xsaXNpb24vY29sbGlzaW9uJztcbmltcG9ydCBPYmplY3RQb29sIGZyb20gJ3V0aWwvb2JqZWN0X3Bvb2wnO1xuaW1wb3J0IEV2ZW50IGZyb20gJ2V2ZW50L2V2ZW50JztcblxucmVxdWlyZS5jYWNoZSA9IHt9O1xuXG5jb25zb2xlLmxvZyggRXZlbnQgKTtcbmNvbnNvbGUubG9nKCBKU09OLnN0cmluZ2lmeSggRXZlbnQucHJvdG90eXBlICkgKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2FtZVxue1xuXHRjb25zdHJ1Y3RvcigpXG5cdHtcblx0XHR0aGlzLmdhbWVfbWFwID0gbmV3IEdhbWVNYXAoKTtcblxuXHRcdHRoaXMuY29sbGlzaW9uX3Bvb2wgPSBuZXcgT2JqZWN0UG9vbCggMywgQ29sbGlzaW9uICk7XG5cdFx0dGhpcy5leHBsb3Npb25fcG9vbCA9IG5ldyBPYmplY3RQb29sKCAxMCwgRXhwbG9zaW9uICk7XG5cdFx0Y29uc29sZS5sb2coIFwiQllFSElcIiApO1xuXHRcdGNvbnNvbGUubG9nKCBKU09OLnN0cmluZ2lmeSggRXZlbnQgKSApXG5cdFx0XHQvLyBFdmVudC5saXN0ZW4oICdwbGF5JywgZnVuY3Rpb24gKClcblx0XHRcdC8vIHtcblx0XHRcdC8vIFx0Y29uc29sZS5sb2coICd0ZXN0JyApO1xuXHRcdFx0Ly8gfSApO1xuXHR9XG5cblx0dXBkYXRlKCBkdCApXG5cdHtcblx0XHR0aGlzLnVwZGF0ZV90YW5rcyggZHQgKTtcblx0XHR0aGlzLnVwZGF0ZV9idWxsZXRzKCBkdCApO1xuXHRcdHRoaXMudXBkYXRlX21pbmVzKCBkdCApO1xuXHRcdHRoaXMudXBkYXRlX2V4cGxvc2lvbnMoIGR0ICk7XG5cdH1cblxuXHR1cGRhdGVfdGFua3MoIGR0IClcblx0e1xuXHRcdGxldCBjb2xsaXNpb24gPSBjb2xsaXNpb25fcG9vbC5nZXQoKTtcblxuXHRcdGZvciAoIGxldCBbIGlkLCB0YW5rIF0gaW4gZ2FtZV9tYXAudGFua3MgKVxuXHRcdHtcblx0XHRcdGlmICggdGFuay5yb3RhdGlvbi5zcGVlZCAhPT0gMCApXG5cdFx0XHR7XG5cdFx0XHRcdHRhbmsudHVybiggdGFuay5yb3RhdGlvbi5zcGVlZCAqIGR0ICk7XG5cblx0XHRcdFx0Zm9yICggbGV0IFsgaWQsIHdhbGwgXSBvZiBtYXAud2FsbHMgKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKCBjb2xsaXNpb24uaXNfY29sbGlkaW5nKCB0YW5rLCB3YWxsICkgKVxuXHRcdFx0XHRcdFx0cGxheWVyLnJvdGF0ZUFsb25nV2FsbCggY29sbGlzaW9uLmVkZ2UsIGNvbGxpc2lvbi5vdmVybGFwICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmb3IgKCBsZXQgWyBpZCwgY29sbGlzaW9uX3RhbmsgXSBvZiBtYXAudGFua3MgKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKCBjb2xsaXNpb24uaXNfY29sbGlkaW5nKCB0YW5rLCBjb2xsaXNpb25fdGFuayApIClcblx0XHRcdFx0XHRcdHBsYXllci5yb3RhdGVBbG9uZ1BsYXllciggY29sbGlzaW9uLmVkZ2UudW5pdF92ZWN0b3IoKSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICggcGxheWVyLnZlbG9jaXR5Lmxlbmd0aCAhPT0gMCApXG5cdFx0XHR7XG5cdFx0XHRcdGxldCB2ZWxvY2l0eSA9IHBsYXllci52ZWxvY2l0eS5jbG9uZSgpO1xuXG5cdFx0XHRcdGZvciAoIGxldCBbIGlkLCB3YWxsIF0gb2YgbWFwLndhbGxzIClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmICggY29sbGlzaW9uLmlzX2NvbGxpZGluZyggdGFuaywgd2FsbCApIClcblx0XHRcdFx0XHRcdHZlbG9jaXR5LnByb2plY3QoIGNvbGxpc2lvbi5lZGdlLnVuaXRfdmVjdG9yKCkgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvciAoIGxldCBbIGlkLCBjb2xsaXNpb25fdGFuayBdIG9mIG1hcC50YW5rcyApXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoIGNvbGxpc2lvbi5pc19jb2xsaWRpbmcoIHRhbmssIGNvbGxpc2lvbl90YW5rICkgKVxuXHRcdFx0XHRcdFx0dmVsb2NpdHkucHJvamVjdCggY29sbGlzaW9uLmVkZ2UudW5pdF92ZWN0b3IoKSApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cGxheWVyLm1vdmUoIHZlbG9jaXR5LnggKiBkdCwgdmVsb2NpdHkueSAqIGR0ICk7XG5cblx0XHRcdFx0aWYgKCBpZCA9PT0gY29udHJvbGxlci5pZCApXG5cdFx0XHRcdFx0Y29udHJvbGxlci5jYW1lcmEubW92ZVRvKCBwbGF5ZXIucG9zLngsIHBsYXllci5wb3MueSwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQgKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gRWFzZSB0b3dhcmRzIHRoZSBuZXh0IHBvc2l0aW9uIGZyb20gdGhlIHNlcnZlclxuXHRcdFx0aWYgKCBwbGF5ZXIubmV4dF9wb3MubGVuZ3RoKCkgPiAwIClcblx0XHRcdHtcblx0XHRcdFx0dmFyIGRYID0gcGxheWVyLm5leHRfcG9zLngsXG5cdFx0XHRcdFx0ZFkgPSBwbGF5ZXIubmV4dF9wb3MueTtcblxuXHRcdFx0XHRpZiAoIE1hdGguYWJzKCBwbGF5ZXIubmV4dF9wb3MueCApID4gMSApXG5cdFx0XHRcdFx0ZFggLz0gMTA7XG5cblx0XHRcdFx0aWYgKCBNYXRoLmFicyggcGxheWVyLm5leHRfcG9zLnkgKSA+IDEgKVxuXHRcdFx0XHRcdGRZIC89IDEwO1xuXG5cdFx0XHRcdHBsYXllci5uZXh0X3Bvcy5hZGQoIC1kWCwgLWRZICk7XG5cblx0XHRcdFx0cGxheWVyLm1vdmUoIGRYLCBkWSApO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIE1hdGguYWJzKCBwbGF5ZXIucm90YXRpb24ubmV4dFJhZCApID4gMCApXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBkQW5nbGUgPSBwbGF5ZXIucm90YXRpb24ubmV4dFJhZDtcblxuXHRcdFx0XHRpZiAoIE1hdGguYWJzKCBwbGF5ZXIucm90YXRpb24ubmV4dFJhZCApID4gMSApXG5cdFx0XHRcdFx0ZEFuZ2xlIC89IDI7XG5cblx0XHRcdFx0cGxheWVyLnJvdGF0aW9uLm5leHRfYW5nbGUgLT0gZEFuZ2xlO1xuXG5cdFx0XHRcdHBsYXllci50dXJuKCBkQW5nbGUgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb2xsaXNpb25fcG9vbC5yZWxlYXNlKCBjb2xsaXNpb24gKTtcblx0fVxuXG5cdHVwZGF0ZV9idWxsZXRzKCBkdCApXG5cdHtcblx0XHRsZXQgY29sbGlzaW9uID0gY29sbGlzaW9uX3Bvb2wuZ2V0KCk7XG5cblx0XHRmb3IgKCBsZXQgWyBpZCwgYnVsbGV0IF0gb2YgbWFwLmJ1bGxldHMgKVxuXHRcdHtcblx0XHRcdGxldCB2ZWxvY2l0eV94ID0gYnVsbGV0LnZlbG9jaXR5LngsXG5cdFx0XHRcdHZlbG9jaXR5X3kgPSBidWxsZXQudmVsb2NpdHkueTtcblxuXHRcdFx0Ly8gQ2FuY2VsIGJ1bGxldHNcblx0XHRcdGZvciAoIGxldCBbIGlkLCBjb2xsaXNpb25fYnVsbGV0IF0gb2YgbWFwLmJ1bGxldHMgKVxuXHRcdFx0e1xuXHRcdFx0XHRjb2xsaXNpb24gPSBidWxsZXQuaXNSZWN0YW5nbGVDb2xsaXNpb24oIGNvbGxpc2lvbl9idWxsZXQgKTtcblxuXHRcdFx0XHRpZiAoIGNvbGxpc2lvbiApXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRtYXAucmVtb3ZlX2J1bGxldCggYnVsbGV0ICk7XG5cdFx0XHRcdFx0bWFwLnJlbW92ZV9idWxsZXQoIGNvbGxpc2lvbl9idWxsZXQgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBFeHBsb2RlIG1pbmVzXG5cdFx0XHRmb3IgKCBsZXQgWyBpZCwgbWluZSBdIG9mIG1hcC5taW5lcyApXG5cdFx0XHR7XG5cdFx0XHRcdGNvbGxpc2lvbiA9IGJ1bGxldC5pc1JlY3RhbmdsZUNvbGxpc2lvbiggbWluZSApO1xuXG5cdFx0XHRcdGlmICggY29sbGlzaW9uIClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG1hcC5yZW1vdmVfYnVsbGV0KCBidWxsZXQgKTtcblx0XHRcdFx0XHRtYXAucmVtb3ZlX21pbmUoIG1pbmUgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBCb3VuY2Ugb2ZmIHdhbGxzXG5cdFx0XHRmb3IgKCBsZXQgWyBpZCwgd2FsbCBdIG9mIG1hcC53YWxscyApXG5cdFx0XHR7XG5cdFx0XHRcdGNvbGxpc2lvbiA9IGJ1bGxldC5pc1JlY3RhbmdsZUNvbGxpc2lvbiggd2FsbCApO1xuXG5cdFx0XHRcdGlmICggY29sbGlzaW9uIClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJ1bGxldC5ib3VuY2UoIGNvbGxpc2lvbi5lZGdlICk7XG5cblx0XHRcdFx0XHR2ZWxvY2l0eV94ID0gYnVsbGV0LnZlbG9jaXR5Lng7XG5cdFx0XHRcdFx0dmVsb2NpdHlfeSA9IGJ1bGxldC52ZWxvY2l0eS55O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGJ1bGxldC5tb3ZlKCB2ZWxvY2l0eV94ICogZHQsIHZlbG9jaXR5X3kgKiBkdCApO1xuXHRcdH1cblxuXHRcdGNvbGxpc2lvbl9wb29sLnJlbGVhc2UoIGNvbGxpc2lvbiApO1xuXHR9XG5cblx0dXBkYXRlX21pbmVzKCBkdCApXG5cdHtcblx0XHRmb3IgKCB2YXIgWyBpZCwgbWluZSBdIG9mIG1hcC5taW5lcyApXG5cdFx0e1xuXHRcdFx0aWYgKCBtaW5lLmNvdW50X2Rvd24oIGR0ICkgKVxuXHRcdFx0e1xuXHRcdFx0XHRtYXAucmVtb3ZlX21pbmUoIG1pbmUgKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR1cGRhdGVfZXhwbG9zaW9ucyggZHQgKVxuXHR7XG5cdFx0Zm9yICggdmFyIFsgaWQsIGV4cGxvc2lvbiBdIG9mIG1hcC5leHBsb3Npb25zIClcblx0XHR7XG5cdFx0XHRpZiAoIGV4cGxvc2lvbi5jb3VudF9kb3duKCBkdCApIClcblx0XHRcdHtcblx0XHRcdFx0bWFwLnJlbW92ZV9leHBsb3Npb24oIGV4cGxvc2lvbiApO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufSIsImltcG9ydCBWZWN0b3IgZnJvbSAndXRpbC92ZWN0b3InO1xuaW1wb3J0IFRhbmsgZnJvbSAnZW50aXR5L3RhbmsnO1xuaW1wb3J0IEJ1bGxldCBmcm9tICdlbnRpdHkvYnVsbGV0JztcbmltcG9ydCBNaW5lIGZyb20gJ2VudGl0eS9taW5lJztcbmltcG9ydCBXYWxsIGZyb20gJ2VudGl0eS93YWxsJztcbmltcG9ydCBFeHBsb3Npb24gZnJvbSAnZW50aXR5L2V4cGxvc2lvbic7XG5pbXBvcnQgT2JqZWN0UG9vbCBmcm9tICd1dGlsL29iamVjdF9wb29sJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2FtZU1hcFxue1xuXHRjb25zdHJ1Y3Rvciggd2lkdGgsIGhlaWdodCApXG5cdHtcblx0XHR0aGlzLnRpY2sgPSAwO1xuXG5cdFx0dGhpcy53aWR0aCA9IHdpZHRoO1xuXHRcdHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG5cdFx0dGhpcy50YW5rX3Bvb2wgPSBuZXcgT2JqZWN0UG9vbCggMTAsIFRhbmsgKTtcblx0XHR0aGlzLmJ1bGxldF9wb29sID0gbmV3IE9iamVjdFBvb2woIDIwLCBCdWxsZXQgKTtcblx0XHR0aGlzLm1pbmVfcG9vbCA9IG5ldyBPYmplY3RQb29sKCAxMCwgTWluZSApO1xuXHRcdHRoaXMud2FsbF9wb29sID0gbmV3IE9iamVjdFBvb2woIDUwLCBXYWxsICk7XG5cdFx0dGhpcy5leHBsb3Npb25fcG9vbCA9IG5ldyBPYmplY3RQb29sKCAxMCwgRXhwbG9zaW9uICk7XG5cblx0XHR0aGlzLnRhbmtzID0gbmV3IE1hcCgpO1xuXHRcdHRoaXMuYnVsbGV0cyA9IG5ldyBNYXAoKTtcblx0XHR0aGlzLm1pbmVzID0gbmV3IE1hcCgpO1xuXHRcdHRoaXMud2FsbHMgPSBuZXcgTWFwKCk7XG5cdFx0dGhpcy5leHBsb3Npb25zID0gbmV3IE1hcCgpO1xuXHR9XG5cblx0YWRkX3RhbmsoIGlkLCB4LCB5LCBhbmdsZSApXG5cdHtcblx0XHRpZiAoIHRoaXMudGFua3MuaGFzKCBpZCApIClcblx0XHRcdHJldHVybjtcblxuXHRcdGxldCB0YW5rID0gdGhpcy50YW5rX3Bvb2wuZ2V0KCk7XG5cdFx0dGFuay5tb3ZlX3RvKCB4LCB5ICk7XG5cdFx0dGFuay50dXJuX3RvKCBhbmdsZSApO1xuXG5cdFx0dGhpcy50YW5rcy5zZXQoIHRhbmsuaWQsIHRhbmsgKTtcblxuXHRcdHJldHVybiB0YW5rO1xuXHR9XG5cblx0YWRkX2J1bGxldCggeCwgeSwgYW5nbGUsIHBfaWQgKVxuXHR7XG5cdFx0bGV0IGJ1bGxldCA9IHRoaXMuYnVsbGV0X3Bvb2wuZ2V0KCk7XG5cdFx0YnVsbGV0LnBfaWQgPSBwX2lkO1xuXHRcdGJ1bGxldC5tb3ZlX3RvKCB4LCB5ICk7XG5cblx0XHR0aGlzLmJ1bGxldHMuc2V0KCBwcm9qZWN0aWxlLmlkLCBwcm9qZWN0aWxlICk7XG5cblx0XHRyZXR1cm4gcHJvamVjdGlsZTtcblx0fVxuXG5cdGFkZF9taW5lKCB4LCB5LCBwX2lkIClcblx0e1xuXHRcdGxldCBtaW5lID0gdGhpcy5taW5lX3Bvb2wuZ2V0KCk7XG5cdFx0bWluZS5wX2lkID0gcF9pZDtcblx0XHRtaW5lLm1vdmVfdG8oIHgsIHkgKTtcblxuXHRcdHRoaXMubWluZXMuc2V0KCBtaW5lLmlkLCBtaW5lICk7XG5cblx0XHRyZXR1cm4gbWluZTtcblx0fVxuXG5cdGFkZF93YWxsKCB4LCB5LCB3aWR0aCwgaGVpZ2h0IClcblx0e1xuXHRcdGxldCB3YWxsID0gdGhpcy53YWxsX3Bvb2wuZ2V0KCk7XG5cdFx0d2FsbC5tb3ZlX3RvKCB4LCB5ICk7XG5cblx0XHR0aGlzLndhbGxzLnNldCggd2FsbC5pZCwgd2FsbCApO1xuXG5cdFx0cmV0dXJuIHdhbGw7XG5cdH1cblxuXHRhZGRfZXhwbG9zaW9uKCB4LCB5LCByYWRpdXMgKVxuXHR7XG5cdFx0bGV0IGV4cGxvc2lvbiA9IHRoaXMuZXhwbG9zaW9uX3Bvb2wuZ2V0KCk7XG5cdFx0ZXhwbG9zaW9uLnJhZGl1cyA9IHJhZGl1cztcblx0XHRleHBsb3Npb24ubW92ZV90byggeCwgeSApO1xuXG5cdFx0dGhpcy5leHBsb3Npb25zLnNldCggZXhwbG9zaW9uLmlkLCBleHBsb3Npb24gKTtcblxuXHRcdHJldHVybiBleHBsb3Npb247XG5cdH1cblxuXHRyZW1vdmVfdGFuayggaWQgKVxuXHR7XG5cdFx0bGV0IHRhbmsgPSB0aGlzLnRhbmtzLmdldCggaWQgKTtcblxuXHRcdHRhbmtfcG9vbC5yZWxlYXNlKCB0YW5rICk7XG5cdFx0dGhpcy50YW5rcy5kZWxldGUoIGlkICk7XG5cdH07XG5cblx0cmVtb3ZlX2J1bGxldCggaWQgKVxuXHR7XG5cdFx0bGV0IGJ1bGxldCA9IHRoaXMuYnVsbGV0cy5nZXQoIGlkICk7XG5cblx0XHRidWxsZXRfcG9vbC5yZWxlYXNlKCBidWxsZXQgKTtcblx0XHR0aGlzLnByb2plY3RpbGVzLmRlbGV0ZSggaWQgKTtcblx0fVxuXG5cdHJlbW92ZV9taW5lKCBpZCApXG5cdHtcblx0XHRsZXQgbWluZSA9IHRoaXMubWluZXMuZ2V0KCBpZCApO1xuXG5cdFx0bWluZV9wb29sLnJlbGVhc2UoIG1pbmUgKTtcblx0XHR0aGlzLm1pbmVzLmRlbGV0ZSggaWQgKTtcblx0fVxuXG5cdHJlbW92ZV93YWxsKCBpZCApXG5cdHtcblx0XHRsZXQgd2FsbCA9IHRoaXMubWluZXMuZ2V0KCBpZCApO1xuXG5cdFx0d2FsbF9wb29sLnJlbGVhc2UoIHdhbGwgKTtcblx0XHR0aGlzLndhbGxzLmRlbGV0ZSggaWQgKTtcblx0fVxuXG5cdHJlbW92ZV9leHBsb3Npb24oIGlkIClcblx0e1xuXHRcdGxldCBleHBsb3Npb24gPSB0aGlzLmV4cGxvc2lvbnMuZ2V0KCBpZCApO1xuXG5cdFx0ZXhwbG9zaW9uX3Bvb2wucmVsZWFzZSggZXhwbG9zaW9uICk7XG5cdFx0dGhpcy5leHBsb3Npb25zLmRlbGV0ZSggZXhwbG9zaW9uICk7XG5cdH1cblxufSIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIE9iamVjdFBvb2xcbntcblx0Y29uc3RydWN0b3IoIHNpemUgPSAxMDAsIG9iaiA9IE9iamVjdCApXG5cdHtcblx0XHR0aGlzLm9iaiA9IG9iajtcblx0XHR0aGlzLnBvb2wgPSBBcnJheSggc2l6ZSApO1xuXG5cdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrIClcblx0XHRcdHRoaXMucG9vbFsgaSBdID0gbmV3IG9iaigpO1xuXHR9XG5cblx0Ly8gQWRkIGEgbmV3IG9iamVjdCB0byB0aGUgcG9vbFxuXHRzcGF3bigpXG5cdHtcblx0XHR0aGlzLnBvb2wucHVzaCggbmV3IHRoaXMub2JqKCkgKTtcblx0fVxuXG5cdC8vIFRha2UgYW4gb2JqZWN0IGZyb20gdGhlIHBvb2xcblx0Z2V0KClcblx0e1xuXHRcdGlmICggdGhpcy5wb29sLmxlbmd0aCA9PT0gMCApXG5cdFx0XHR0aGlzLnNwYXduKCk7XG5cblx0XHRyZXR1cm4gdGhpcy5wb29sLnBvcCgpO1xuXHR9XG5cblx0Ly8gUHV0IG9iamVjdCBiYWNrIGluIHBvb2wgYW5kIHJlc2V0IGl0IGlmIHRoZSBvYmplY3QncyByZXNldCgpIGlzIGRlZmluZWRcblx0cmVsZWFzZSggb2JqIClcblx0e1xuXHRcdGlmICggdHlwZW9mIG9iaiAhPT0gdHlwZW9mIHRoaXMub2JqIClcblx0XHRcdHJldHVybjtcblxuXHRcdGlmICggdHlwZW9mIG9iai5yZXNldCA9PT0gJ2Z1bmN0aW9uJyApXG5cdFx0XHRvYmoucmVzZXQoKTtcblxuXHRcdHRoaXMucG9vbC5wdXNoKCBvYmogKTtcblx0fVxufSIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIFV0aWxcbntcblx0c3RhdGljIHRpbWVzdGFtcCgpXG5cdHtcblx0XHRpZiAoIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmXG5cdFx0XHR0eXBlb2Ygd2luZG93LnBlcmZvcm1hbmNlICE9PSAndW5kZWZpbmVkJyAmJlxuXHRcdFx0dHlwZW9mIHdpbmRvdy5wZXJmb3JtYW5jZS5ub3cgIT09ICd1bmRlZmluZWQnIClcblx0XHRcdHJldHVybiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG5cblx0XHRyZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdH1cblxuXHRzdGF0aWMgZ2VuZXJhdGVfaWQoKVxuXHR7XG5cdFx0cmV0dXJuIE1hdGgucmFuZG9tKCk7XG5cdH1cblxuXHQvLyBFZmZpY2llbnQgYXBwcm94aW1hdGlvbiBmb3IgdGhlIHNxdWFyZSByb290IG9mIGEgYW5kIGJcblx0c3RhdGljIHNxcnRfYXBwcm94aW1hdGlvbiggYSwgYiApXG5cdHtcblx0XHRyZXR1cm4gNDE0MiAqIE1hdGguYWJzKCBhICkgLyAxMDAwMCArIE1hdGguYWJzKCBiICk7XG5cdH1cbn1cblxuTWF0aC5zaWduID0gTWF0aC5zaWduIHx8IGZ1bmN0aW9uICggeCApXG57XG5cdHggPSAreDsgLy8gY29udmVydCB0byBhIG51bWJlclxuXHRpZiAoIHggPT09IDAgfHwgaXNOYU4oIHggKSApXG5cdHtcblx0XHRyZXR1cm4geDtcblx0fVxuXHRyZXR1cm4geCA+IDAgPyAxIDogLTE7XG59XG5cbk1hdGgucm91bmQgPSBmdW5jdGlvbiAoIG51bSApXG57XG5cdHJldHVybiAoIDAuNSArIG51bSApIDw8IDA7XG59OyIsImltcG9ydCBVdGlsIGZyb20gJ3V0aWwvdXRpbCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZlY3Rvclxue1xuXHRjb25zdHJ1Y3RvciggeCA9IDAsIHkgPSAwIClcblx0e1xuXHRcdHRoaXMueCA9IHg7XG5cdFx0dGhpcy55ID0geTtcblx0XHR0aGlzLmxlbmd0aCA9IE1hdGguaHlwb3QoIHRoaXMueCwgdGhpcy55ICk7XG5cdH1cblxuXHQvLyBTZXQgdGhlIGFyZ3VtZW50cyB0byBpdHMgY29ycmVzcG9uZGluZyBheGlzIG9mIHRoaXMgdmVjdG9yXG5cdHNldCggeCA9IDAsIHkgPSAwIClcblx0e1xuXHRcdHRoaXMueCA9IHg7XG5cdFx0dGhpcy55ID0geTtcblx0XHR0aGlzLmxlbmd0aCA9IE1hdGguaHlwb3QoIHRoaXMueCwgdGhpcy55ICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvLyBBZGQgdGhlIGFyZ3VtZW50cyB0byBpdHMgY29ycmVzcG9uZGluZyBheGlzIG9mIHRoaXMgdmVjdG9yXG5cdGFkZCggeCA9IDAsIHkgPSAwIClcblx0e1xuXHRcdHRoaXMueCArPSB4O1xuXHRcdHRoaXMueSArPSB5O1xuXHRcdHRoaXMubGVuZ3RoID0gTWF0aC5oeXBvdCggdGhpcy54LCB0aGlzLnkgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8vIERpdmlkZSBlYWNoIGF4aXMgb2YgdGhpcyB2ZWN0b3IgYnkgdGhlIGRpdmlzb3Jcblx0ZGl2aWRlKCBkaXZpc29yIClcblx0e1xuXHRcdHRoaXMueCAvPSBkaXZpc29yO1xuXHRcdHRoaXMueSAvPSBkaXZpc29yO1xuXHRcdHRoaXMubGVuZ3RoID0gTWF0aC5oeXBvdCggdGhpcy54LCB0aGlzLnkgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8vIE11bHRpcGx5IGVhY2ggYXhpcyBvZiB0aGlzIHZlY3RvciBieSB0aGUgbXVsdGlwbGVcblx0bXVsdGlwbHkoIG11bHRpcGxlIClcblx0e1xuXHRcdHRoaXMueCAqPSBtdWx0aXBsZTtcblx0XHR0aGlzLnkgKj0gbXVsdGlwbGU7XG5cdFx0dGhpcy5sZW5ndGggPSBNYXRoLmh5cG90KCB0aGlzLngsIHRoaXMueSApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0Ly8gUHJvamVjdCB0aGlzIHZlY3RvciBvbnRvIHRoZSB2ZWN0b3IgYXJndW1lbnRcblx0cHJvamVjdCggdmVjdG9yIClcblx0e1xuXHRcdHZhciBkb3RQcm9kdWN0ID0gdGhpcy5kb3RQcm9kdWN0KCB2ZWN0b3IgKTtcblxuXHRcdHRoaXMueCA9IGRvdFByb2R1Y3QgKiB2ZWN0b3IueDtcblx0XHR0aGlzLnkgPSBkb3RQcm9kdWN0ICogdmVjdG9yLnk7XG5cdFx0dGhpcy5sZW5ndGggPSBNYXRoLmh5cG90KCB0aGlzLngsIHRoaXMueSApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0Ly8gUmV0dXJucyBpZiB0aGlzIHZlY3RvciBpcyB6ZXJvXG5cdGlzWmVybygpXG5cdHtcblxuXHRcdHJldHVybiB0aGlzLnggPT09IDAgJiYgdGhpcy55ID09PSAwO1xuXHR9O1xuXG5cblx0LyogRnVuY3Rpb25zIGJlbG93IHJldHVybiB0aGUgcmVzdWx0IHJhdGhlciB0aGFuIG1vZGlmeSBjb250ZW50cyBvZiB0aGlzIHZlY3RvciAqL1xuXG5cblx0Ly8gUmV0dXJuIHRoZSB1bml0IHZlY3RvciBvZiB0aGlzIHZlY3RvclxuXHR1bml0VmVjdG9yKClcblx0e1xuXHRcdHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCgpLFxuXHRcdFx0eCA9IHRoaXMueCA/IE1hdGguc2lnbiggdGhpcy54ICkgKiBNYXRoLnBvdyggdGhpcy54LCAyICkgLyBsZW5ndGggOiAwLFxuXHRcdFx0eSA9IHRoaXMueSA/IE1hdGguc2lnbiggdGhpcy55ICkgKiBNYXRoLnBvdyggdGhpcy55LCAyICkgLyBsZW5ndGggOiAwO1xuXG5cdFx0cmV0dXJuIG5ldyBWZWN0b3IoIHgsIHkgKTtcblx0fTtcblxuXHQvLyBSZXR1cm4gYSB2ZWN0b3IgY29udGFpbmluZyB0aGUgZGlmZmVyZW5jZSBvZiBlYWNoIGF4aXNcblx0ZGlmZiggdmVjdG9yIClcblx0e1xuXG5cdFx0cmV0dXJuIG5ldyBWZWN0b3IoIHRoaXMueCAtIHZlY3Rvci54LCB0aGlzLnkgLSB2ZWN0b3IueSApO1xuXHR9O1xuXG5cdC8vIFJldHVybiBhIHZlY3RvciBjb250YWluaW5nIHRoZSBkaWZmZXJlbmNlIG9mIGVhY2ggYXhpc1xuXHRzdWJ0cmFjdCggdmVjdG9yIClcblx0e1xuXG5cdFx0cmV0dXJuIG5ldyBWZWN0b3IoIHRoaXMueCAtIHZlY3Rvci54LCB0aGlzLnkgLSB2ZWN0b3IueSApO1xuXHR9O1xuXG5cdC8vIFJldHVybiB0aGUgZG90IHByb2R1Y3Qgb2YgdGhlIHR3byB2ZWN0b3JzXG5cdGRvdFByb2R1Y3QoIHZlY3RvciApXG5cdHtcblxuXHRcdHJldHVybiB0aGlzLnggKiB2ZWN0b3IueCArIHRoaXMueSAqIHZlY3Rvci55O1xuXHR9O1xuXG5cdC8vIFJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgdmVjdG9yICggbm90ZSB0aGlzIGlzIHRoZSBsZW5ndGggXiAyIClcblx0Z2V0TGVuZ3RoKClcblx0e1xuXG5cdFx0cmV0dXJuIE1hdGgucG93KCB0aGlzLngsIDIgKSArIE1hdGgucG93KCB0aGlzLnksIDIgKTtcblx0fTtcblxuXHQvLyBSZXR1cm4gYSBjb3B5IG9mIHRoaXMgdmVjdG9yXG5cdGNsb25lKClcblx0e1xuXG5cdFx0cmV0dXJuIG5ldyBWZWN0b3IoIHRoaXMueCwgdGhpcy55ICk7XG5cdH07XG5cblx0Ly8gUmV0dXJucyBhbiBvYmplY3QgY29udGFpbmluZyBlYWNoIG5vbi16ZXJvIGF4aXNcblx0dG9PYmplY3QoKVxuXHR7XG5cdFx0dmFyIHZlY3Rvck9iamVjdCA9IHtcblx0XHRcdHg6IHRoaXMueCxcblx0XHRcdHk6IHRoaXMueVxuXHRcdH07XG5cblx0XHRyZXR1cm4gdmVjdG9yT2JqZWN0O1xuXHR9O1xuXG5cdHRvU3RyaW5nKClcblx0e1xuXHRcdHJldHVybiAneDogJyArIHRoaXMueCArICcgeTogJyArIHRoaXMueTtcblx0fTtcblxufSIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2dhbWVHYW1lID0gcmVxdWlyZSgnZ2FtZS9nYW1lJyk7XG5cbnZhciBfZ2FtZUdhbWUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZ2FtZUdhbWUpO1xuXG52YXIgX3V0aWxVdGlsID0gcmVxdWlyZSgndXRpbC91dGlsJyk7XG5cbnZhciBfdXRpbFV0aWwyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbFV0aWwpO1xuXG52YXIgZ2FtZSA9IG5ldyBfZ2FtZUdhbWUyWydkZWZhdWx0J10oKSxcblxuLy8gVHJhY2sgcGxheWVyIGV2ZW50c1xuc3RhdGVRdWV1ZSA9IG5ldyBNYXAoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaW8pIHtcblx0aW5pdCgpO1xuXG5cdHZhciBub3csXG5cdCAgICBkdCxcblx0ICAgIGxhc3QgPSBfdXRpbFV0aWwyWydkZWZhdWx0J10udGltZXN0YW1wKCk7XG5cblx0ZnVuY3Rpb24gaW5pdCgpIHtcblx0XHRzZXRJbnRlcnZhbChmcmFtZSwgMTAwMCAvIDYwKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGZyYW1lKCkge1xuXHRcdG5vdyA9IF91dGlsVXRpbDJbJ2RlZmF1bHQnXS50aW1lc3RhbXAoKTtcblx0XHRkdCA9IChub3cgLSBsYXN0KSAvIDEwMDA7IC8vIEluIHNlY29uZHNcblxuXHRcdHVwZGF0ZShkdCk7XG5cdFx0cmVuZGVyKCk7XG5cblx0XHRsYXN0ID0gbm93O1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlKGR0KSB7XG5cdFx0Z2FtZS51cGRhdGUoZHQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdGlmIChnYW1lLm1hcC50aWNrICUgNjAgPT09IDApIHtcblx0XHRcdGlmICghZ2FtZS5tYXAuaXNSZXBsYXlpbmdTbmFwc2hvdCkgZ2FtZS5tYXAuc2F2ZVNuYXBzaG90KCk7XG5cblx0XHRcdHZhciBzdGF0ZUNoYW5nZSA9IGdhbWUubWFwLmRpZmZTbmFwc2hvdChnYW1lLm1hcC5zbmFwc2hvdHMuaGVhZCwgZ2FtZS5tYXAuc25hcHNob3RzLmhlYWQucHJldik7XG5cblx0XHRcdGlmIChPYmplY3Qua2V5cyhzdGF0ZUNoYW5nZSkubGVuZ3RoID4gMCkgaW8uc29ja2V0cy5lbWl0KCdlJywgc3RhdGVDaGFuZ2UpO1xuXHRcdH1cblx0fVxuXG5cdGlvLm9uKCdjb25uZWN0aW9uJywgZnVuY3Rpb24gKHNvY2tldCkge1xuXHRcdHBsYXllckNvbm5lY3RIYW5kbGVyLmJpbmQoc29ja2V0KSgpO1xuXG5cdFx0c29ja2V0Lm9uKCdkaXNjb25uZWN0JywgcGxheWVyRGlzY29ubmVjdEhhbmRsZXIuYmluZChzb2NrZXQpKTtcblx0XHRzb2NrZXQub24oJ2UnLCBwbGF5ZXJFdmVudEhhbmRsZXIuYmluZChzb2NrZXQpKTtcblx0fSk7XG5cblx0ZnVuY3Rpb24gcGxheWVyQ29ubmVjdEhhbmRsZXIoKSB7XG5cdFx0Ly8gbWFwLnNhdmVTbmFwc2hvdCgpO1xuXG5cdFx0dmFyIGlkID0gdGhpcy5pZCxcblx0XHQgICAgcGxheWVyID0gbWFwLnNwYXduKGlkKSxcblx0XHQgICAgcGxheWVyTG9nID0gaWQgaW4gc3RhdGVRdWV1ZSA/IHN0YXRlUXVldWVbaWRdIDogbmV3IE9iamVjdCgpO1xuXG5cdFx0dmFyIHNuYXBzaG90ID0gbWFwLnNuYXBzaG90cy5oZWFkLmdldERhdGEoKTtcblx0XHRzbmFwc2hvdC5pZCA9IGlkO1xuXHRcdHNuYXBzaG90LmJvdW5kWCA9IG1hcC53aWR0aDtcblx0XHRzbmFwc2hvdC5ib3VuZFkgPSBtYXAuaGVpZ2h0O1xuXHRcdHNuYXBzaG90LmxlYWRlcmJvYXJkID0gbWFwLnNjb3JlLmxlYWRlcmJvYXJkO1xuXHRcdHNuYXBzaG90LmdyaWQgPSBtYXAuZ3JpZDtcblxuXHRcdC8vIEdldCB0aGUgY2xpZW50IHVwIHRvIGRhdGUgd2l0aCBpdHMgaWQsIHBvcywgYW5kIHRoZSBvdGhlciBwbGF5ZXJzXG5cdFx0dGhpcy5lbWl0KCdpbml0Jywgc25hcHNob3QpO1xuXHRcdHRoaXMub24oJ2luaXQnLCAoZnVuY3Rpb24gKGRhdGEpIHtcblx0XHRcdG1hcC5wbGF5ZXJzW2lkXS5uYW1lID0gZGF0YTtcblx0XHR9KS5iaW5kKGlkKSk7XG5cblx0XHRwbGF5ZXJMb2cucG9zID0gcGxheWVyLnBvcztcblx0XHRzdGF0ZVF1ZXVlW2lkXSA9IHBsYXllckxvZztcblxuXHRcdGNvbnNvbGUubG9nKGlkICsgJyBjb25uZWN0ZWQuJyk7XG5cdH1cblxuXHRmdW5jdGlvbiBwbGF5ZXJEaXNjb25uZWN0SGFuZGxlcigpIHtcblx0XHR2YXIgaWQgPSB0aGlzLmlkO1xuXG5cdFx0Ly8gSWYgdGhlIHBsYXllciB3YXMgb24gdGhlIGxlYWRlcmJvYXJkLCByZW1vdmUgdGhlbSBmcm9tIGl0XG5cdFx0aWYgKG1hcC5zY29yZS5yZW1vdmUoaWQpKSBwbGF5ZXJMb2cubGVhZGVyYm9hcmQgPSBzY29yZWJvYXJkLmdldExlYWRlcmJvYXJkKCk7XG5cblx0XHQvLyBSZW1vdmUgdGhlIHBsYXllciBmcm9tIHRoZSBtYXBcblx0XHRtYXAucmVtb3ZlUGxheWVyKGlkKTtcblxuXHRcdGNvbnNvbGUubG9nKGlkICsgJyBkaXNjb25uZWN0ZWQuJyk7XG5cdH1cblxuXHRmdW5jdGlvbiBwbGF5ZXJFdmVudEhhbmRsZXIoZSkge1xuXHRcdHZhciBpZCA9IHRoaXMuaWQsXG5cdFx0ICAgIHBsYXllckxvZyA9IGlkIGluIHN0YXRlUXVldWUgPyBzdGF0ZVF1ZXVlW2lkXSA6IG5ldyBPYmplY3QoKSxcblx0XHQgICAgcGxheWVyID0gbWFwLnBsYXllcnNbaWRdO1xuXG5cdFx0aWYgKCFwbGF5ZXIpIHJldHVybjtcblxuXHRcdGlmICghZS50KSByZXR1cm47XG5cblx0XHRtYXAubG9hZFNuYXBzaG90KGUudCk7XG5cblx0XHQvLyBGb3J3YXJkcyBhbmQgYmFja3dhcmRzIHZlbG9jaXR5XG5cdFx0aWYgKCd2JyBpbiBlKSB7XG5cdFx0XHRpZiAoZS52ID4gMCkge1xuXHRcdFx0XHRwbGF5ZXIuc2V0VmVsb2NpdHkoMS41KTtcblx0XHRcdH0gZWxzZSBpZiAoZS52ID09PSAwKSB7XG5cdFx0XHRcdHBsYXllci5zZXRWZWxvY2l0eSgwKTtcblx0XHRcdH0gZWxzZSBpZiAoZS52IDwgMCkge1xuXHRcdFx0XHRwbGF5ZXIuc2V0VmVsb2NpdHkoLTEuNSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gTGVmdCBhbmQgcmlnaHQgcm90YXRpb25hbCBzcGVlZFxuXHRcdGlmICgncicgaW4gZSkge1xuXHRcdFx0aWYgKGUuciA+IDApIHtcblx0XHRcdFx0cGxheWVyLnJvdGF0aW9uLnNwZWVkID0gMC4wNTtcblx0XHRcdH0gZWxzZSBpZiAoZS5yID09PSAwKSB7XG5cdFx0XHRcdHBsYXllci5yb3RhdGlvbi5zcGVlZCA9IDA7XG5cdFx0XHR9IGVsc2UgaWYgKGUuciA8IDApIHtcblx0XHRcdFx0cGxheWVyLnJvdGF0aW9uLnNwZWVkID0gLTAuMDU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gTW91c2UgbW92ZW1lbnRcblx0XHRpZiAoJ20nIGluIGUpIHtcblx0XHRcdHBsYXllci5iYXJyZWwuc2V0QW5nbGUoZS5tKTtcblx0XHRcdHBsYXllckxvZy5oZWFkaW5nID0gZS5tO1xuXHRcdH1cblxuXHRcdGlmICgncycgaW4gZSkge1xuXHRcdFx0dmFyIHByb2plY3RpbGUgPSBwbGF5ZXIuc2hvb3QoKTtcblx0XHRcdGlmIChwcm9qZWN0aWxlKSB7XG5cdFx0XHRcdG1hcC5wcm9qZWN0aWxlc1twcm9qZWN0aWxlLmlkXSA9IHByb2plY3RpbGU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bWFwLnJlcGxheVNuYXBzaG90KCk7XG5cblx0XHRzdGF0ZVF1ZXVlW2lkXSA9IHBsYXllckxvZztcblx0fVxufTtcblxuLy8gUmVjb3JkIGNoYW5nZSBldmVudHNcbmZ1bmN0aW9uIHB1c2hTdGF0ZUV2ZW50KGlkLCBrZXksIGRhdGEpIHtcblx0dmFyIHBsYXllclN0YXRlID0ge307XG5cdGlmIChpZCBpbiBzdGF0ZVF1ZXVlKSBwbGF5ZXJTdGF0ZSA9IHN0YXRlUXVldWVbaWRdO1xuXG5cdGlmIChrZXkgaW4gcGxheWVyU3RhdGUpIHBsYXllclN0YXRlW2tleV0ucHVzaChkYXRhKTtlbHNlIHBsYXllclN0YXRlW2tleV0gPSBbZGF0YV07XG5cblx0c3RhdGVRdWV1ZVtpZF0gPSBwbGF5ZXJTdGF0ZTtcblx0c3RhdGVDaGFuZ2UgPSB0cnVlO1xufSJdfQ==
