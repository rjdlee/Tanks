(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*

Note the mapping for sending keydown and keyup is as follows:

		keydown		keyup
Up 		0			4	
Down 	1			5
Left 	2			6
Right	3			7

*/

'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Connect_Class = (function () {
	function Connect_Class() {
		_classCallCheck(this, Connect_Class);

		this.stateQueue = {};

		this.socket = io('http://localhost:3000');

		this.socket.on('connect', (function () {
			this.socket.emit('init', name);

			this.socket.on('init', this.connectHandler);
			this.socket.on('disconnect', this.disconnectHandler);
			this.socket.on('e', this.eventHandler);
		}).bind(this));

		// Attempt different servers if failed to connect to this one
		this.socket.on('connect_error', (function () {
			if (this.socket.io.uri === 'http://localhost:3000') this.socket.io.uri = 'http://tankti.me:3000';else this.socket.io.uri = 'http://localhost:3000';
		}).bind(this));

		this.setListeners();
	}

	// Add an event to the queue to be sent to the server

	_createClass(Connect_Class, [{
		key: 'pushStateEvent',
		value: function pushStateEvent(key, data) {
			this.stateQueue[key] = data;
		}

		// Send the queue of events to the server
	}, {
		key: 'sendStateQueue',
		value: function sendStateQueue() {
			if (Object.keys(this.stateQueue).length === 0) return false;

			this.stateQueue.t = Date.now();
			this.socket.emit('e', this.stateQueue);

			this.stateQueue = {};
		}
	}, {
		key: 'setListeners',
		value: function setListeners() {
			window.onbeforeunload = function () {
				if (this.socket) this.socket.close();
			};
		}
	}, {
		key: 'connectHandler',
		value: function connectHandler(data) {
			// Create a map
			map = new Map(data.boundX, data.boundY);
			renderer = new Renderer(data.boundX, data.boundY);

			// Create new players
			for (var id in data.players) {
				var player = data.players[id];

				// Create a new player
				if (player.id !== data.id) {
					map.players[player.id] = new Player(player.id, player.pos.x, player.pos.y, player.angle);
					continue;
				}
			}

			// Create a new controller
			map.players[data.id] = controller = new Controller(this.socket.id);
			controller.addCamera(window.innerWidth, window.innerHeight);

			// An error has occurred
			if (!controller) return;

			// Create map walls
			for (var id in data.walls) {
				var wall = data.walls[id];
				map.walls.push(new Wall(wall.pos.x, wall.pos.y, wall.width, wall.height));
			}

			map.grid = data.grid;
			renderer.renderWalls(map.grid, controller.camera);

			for (var id in data.projectiles) {
				var projectile = data.projectiles[id];
				map.projectiles[projectile.id] = new Projectile(projectile.pid, projectile.pos.x, projectile.pos.y, projectile.angle, projectile.speed);
			}

			drawLeaderboard(data.id, data.leaderboard);
			play();
		}
	}, {
		key: 'disconnectHandler',
		value: function disconnectHandler() {
			if (animationClock) window.cancelAnimationFrame(animationClock);

			animationClock = undefined;
			controller = undefined;
			map = undefined;
		}
	}, {
		key: 'eventHandler',
		value: function eventHandler(data) {
			if (!map) return;

			if (!controller) return;

			for (var id in data.players) {
				var player = data.players[id];

				if (player === 'remove') {
					map.removePlayer(id);
					continue;
				}

				if ('add' in player) {
					var playerData = player.add,
					    player;

					if (id === this.socket.id) {
						controller.setPos(playerData.pos.x, playerData.pos.y);
						controller.camera.moveTo(playerData.pos.x, playerData.pos.y, map.width, map.height);

						continue;
					}

					map.players[id] = player = new Player(id, playerData.pos.x, playerData.pos.y, playerData.angle);
					player.setVelocity(playerData.speed);
					player.barrel.setAngle(playerData.heading);

					continue;
				}

				if ('pos' in player) {
					var pos = new Vector(player.pos.x, player.pos.y),
					    mapPlayer = map.players[id];

					mapPlayer.nextPos = pos.diff(mapPlayer.pos);
					// map.players[ id ].setPos( player.pos.x, player.pos.y );
				}

				if ('angle' in player) {
					map.players[id].setAngle(player.angle);
					// map.players[ id ].angle.nextRad = map.players[ id ].angle.rad - player.angle;
				}

				if ('facing' in player) map.players[id].barrel.setAngle(player.facing);

				if ('speed' in player) map.players[id].setVelocity(player.speed);
			}
			// if ( data.projectiles )
			// console.log( data.projectiles );
			for (var id in data.projectiles) {
				var projectile = data.projectiles[id];

				if (projectile === 'remove') {
					map.removeProjectile(id);

					continue;
				}

				if ('add' in projectile) {
					var projectileData = projectile.add;
					map.projectiles[id] = new Projectile(projectileData.pid, projectileData.pos.x, projectileData.pos.y, projectileData.angle, projectileData.speed);
				}
			}
		}
	}]);

	return Connect_Class;
})();

exports['default'] = Connect_Class;

var Connect = new Connect_Class();
exports['default'] = Connect;
module.exports = exports['default'];
},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _eventEvent = require('event/event');

var _eventEvent2 = _interopRequireDefault(_eventEvent);

var DOM_Class = (function () {
	function DOM_Class() {
		_classCallCheck(this, DOM_Class);

		this.id('menu-play').addEventListener('click', (function () {
			this.render_game_ui();
			this.hide_menu_ui();

			_eventEvent2['default'].dispatch('play', name);
		}).bind(this));
	}

	_createClass(DOM_Class, [{
		key: 'id',
		value: function id(_id) {
			return document.getElementById(_id);
		}
	}, {
		key: 'get_by_class',
		value: function get_by_class(name) {
			return Array.prototype.slice.call(document.getElementsByClassName(name));
		}
	}, {
		key: 'render_game_ui',
		value: function render_game_ui() {
			this.id('leaderboard').style.visibility = '';
			this.id('score').style.visibility = '';
		}
	}, {
		key: 'hide_game_ui',
		value: function hide_game_ui() {
			this.id('leaderboard').style.visibility = 'hidden';
			this.id('score').style.visibility = 'hidden';
			this.id('score').innerHTML = 'Score: 0';
		}
	}, {
		key: 'render_menu_ui',
		value: function render_menu_ui() {
			this.id('menu').style.visibility = '';
		}
	}, {
		key: 'hide_menu_ui',
		value: function hide_menu_ui() {
			this.id('menu').style.visibility = 'hidden';
		}
	}, {
		key: 'update_score',
		value: function update_score() {
			var score = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

			this.id('score').innerHTML = 'Score: ' + score;
		}
	}, {
		key: 'update_leaderboard',
		value: function update_leaderboard(controllerID, leaderboard) {
			var leaderboardHTML = '<h3>Leaderboard</h3>';

			if (leaderboard) {
				for (var i = 0; i < leaderboard.length; i++) {
					var name = leaderboard[i].name;
					if (name.length > 10) name = name.substr(0, 10) + '...';

					if (leaderboard[i].id === controllerID) leaderboardHTML += '<li><b>' + name + '</li>';else leaderboardHTML += '<li>' + name + '</li>';
				}
			}

			this.id('leaderboard').innerHTML = leaderboardHTML;
		}
	}]);

	return DOM_Class;
})();

var DOM = new DOM_Class();
exports['default'] = DOM;
module.exports = exports['default'];
},{"event/event":12}],3:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilUtil = require('util/util');

var _utilUtil2 = _interopRequireDefault(_utilUtil);

var _gameGame = require('game/game');

var _gameGame2 = _interopRequireDefault(_gameGame);

var _dom = require('./dom');

var _dom2 = _interopRequireDefault(_dom);

var _connect = require('./connect');

var _connect2 = _interopRequireDefault(_connect);

var renderer, map, name, controller, animationClock;

function play() {
	requestAnimFrame(frame);
}

var now,
    dt,
    last = _utilUtil2['default'].timestamp();

function frame() {
	now = _utilUtil2['default'].timestamp();
	dt = (now - last) / 1000; // In seconds

	if (map) {
		update(dt);
		render(dt);
	}

	last = now;
	requestAnimFrame(frame);
}

function update(dt) {
	game.update(dt);

	// Send event data to the server
	connect.sendStateQueue();
}

function render(dt) {
	renderer.draw(map.tanks, map.bullets, map.mines, map.explosions, map.walls, controller.camera);
}
},{"./connect":1,"./dom":2,"game/game":13,"util/util":16}],4:[function(require,module,exports){
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

},{"util/vector":17}],5:[function(require,module,exports){
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

},{"util/vector":17}],6:[function(require,module,exports){
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

},{"entity/entity":7}],7:[function(require,module,exports){
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

},{"entity/bounding_box":5,"util/util":16,"util/vector":17}],8:[function(require,module,exports){
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

},{"entity/entity":7}],9:[function(require,module,exports){
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

},{"entity/entity":7}],10:[function(require,module,exports){
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

},{"entity/bullet":6,"entity/entity":7,"util/vector":17}],11:[function(require,module,exports){
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

},{"entity/entity":7}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{"./game_map":14,"collision/collision":4,"entity/explosion":8,"event/event":12,"util/object_pool":15}],14:[function(require,module,exports){
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

},{"entity/bullet":6,"entity/explosion":8,"entity/mine":9,"entity/tank":10,"entity/wall":11,"util/object_pool":15,"util/vector":17}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
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

},{"util/util":16}]},{},[3])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2xpZW50L2Nvbm5lY3QuanMiLCJzcmMvY2xpZW50L2RvbS5qcyIsInNyYy9jbGllbnQvbWFpbi5qcyIsIi9Vc2Vycy9SaWNoaWUvRG9jdW1lbnRzL1dvcmsvVGFua3Mvc3JjL25vZGVfbW9kdWxlcy9jb2xsaXNpb24vY29sbGlzaW9uLmpzIiwiL1VzZXJzL1JpY2hpZS9Eb2N1bWVudHMvV29yay9UYW5rcy9zcmMvbm9kZV9tb2R1bGVzL2VudGl0eS9ib3VuZGluZ19ib3guanMiLCIvVXNlcnMvUmljaGllL0RvY3VtZW50cy9Xb3JrL1RhbmtzL3NyYy9ub2RlX21vZHVsZXMvZW50aXR5L2J1bGxldC5qcyIsIi9Vc2Vycy9SaWNoaWUvRG9jdW1lbnRzL1dvcmsvVGFua3Mvc3JjL25vZGVfbW9kdWxlcy9lbnRpdHkvZW50aXR5LmpzIiwiL1VzZXJzL1JpY2hpZS9Eb2N1bWVudHMvV29yay9UYW5rcy9zcmMvbm9kZV9tb2R1bGVzL2VudGl0eS9leHBsb3Npb24uanMiLCIvVXNlcnMvUmljaGllL0RvY3VtZW50cy9Xb3JrL1RhbmtzL3NyYy9ub2RlX21vZHVsZXMvZW50aXR5L21pbmUuanMiLCIvVXNlcnMvUmljaGllL0RvY3VtZW50cy9Xb3JrL1RhbmtzL3NyYy9ub2RlX21vZHVsZXMvZW50aXR5L3RhbmsuanMiLCIvVXNlcnMvUmljaGllL0RvY3VtZW50cy9Xb3JrL1RhbmtzL3NyYy9ub2RlX21vZHVsZXMvZW50aXR5L3dhbGwuanMiLCIvVXNlcnMvUmljaGllL0RvY3VtZW50cy9Xb3JrL1RhbmtzL3NyYy9ub2RlX21vZHVsZXMvZXZlbnQvZXZlbnQuanMiLCIvVXNlcnMvUmljaGllL0RvY3VtZW50cy9Xb3JrL1RhbmtzL3NyYy9ub2RlX21vZHVsZXMvZ2FtZS9nYW1lLmpzIiwiL1VzZXJzL1JpY2hpZS9Eb2N1bWVudHMvV29yay9UYW5rcy9zcmMvbm9kZV9tb2R1bGVzL2dhbWUvZ2FtZV9tYXAuanMiLCIvVXNlcnMvUmljaGllL0RvY3VtZW50cy9Xb3JrL1RhbmtzL3NyYy9ub2RlX21vZHVsZXMvdXRpbC9vYmplY3RfcG9vbC5qcyIsIi9Vc2Vycy9SaWNoaWUvRG9jdW1lbnRzL1dvcmsvVGFua3Mvc3JjL25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCIvVXNlcnMvUmljaGllL0RvY3VtZW50cy9Xb3JrL1RhbmtzL3NyYy9ub2RlX21vZHVsZXMvdXRpbC92ZWN0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7OzswQkNwRG1CLGFBQWE7Ozs7SUFFWCxTQUFTO0FBRWxCLFVBRlMsU0FBUyxHQUc3Qjt3QkFIb0IsU0FBUzs7QUFJNUIsTUFBSSxDQUFDLElBQUksQ0FBQztBQUNWLE1BQUksQ0FBQyxPQUFPLENBQUM7RUFDYjs7OztjQU5tQixTQUFTOztTQVNqQixzQkFBRSxXQUFXLEVBQUUsV0FBVyxFQUN0QztBQUNDLE9BQUssQ0FBQyxPQUFPLENBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBRSxFQUN4QyxPQUFPLEtBQUssQ0FBQzs7QUFFZCxPQUFLLFdBQVcsQ0FBQyxLQUFLLEtBQUssQ0FBQyxFQUMzQixPQUFPLDJCQUEyQixDQUFFLFdBQVcsRUFBRSxXQUFXLENBQUUsQ0FBQzs7QUFFaEUsT0FBSyxXQUFXLENBQUMsS0FBSyxLQUFLLENBQUMsRUFDM0IsT0FBTywyQkFBMkIsQ0FBRSxXQUFXLEVBQUUsV0FBVyxDQUFFLENBQUM7O0FBRWhFLFVBQU8seUJBQXlCLENBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBRSxDQUFDO0dBQzdEOzs7OztTQUdNLGlCQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUN6Qzs7QUFFQyxPQUFLLENBQUMsTUFBTSxFQUNYLE1BQU0sR0FBRyxXQUFXLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUM7O0FBRWxELE9BQUksUUFBUSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBRSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBRSxDQUFBO0FBQ3RILE9BQUssUUFBUSxJQUFJLE1BQU0sRUFDdEIsT0FBTyxJQUFJLENBQUM7R0FDYjs7Ozs7U0FHMEIscUNBQUUsV0FBVyxFQUFFLFdBQVcsRUFDckQ7QUFDQyxPQUFJLGNBQWMsR0FBRyxXQUFXLENBQUMsV0FBVztPQUMzQyxjQUFjLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQzs7Ozs7Ozs7QUFHMUMseUJBQWdCLGNBQWMsQ0FBQyxNQUFNLDhIQUNyQztBQURNLFdBQU07OztBQUdYLGFBQVEsR0FBRyxDQUNWLE1BQU0sQ0FBQyxDQUFDLEdBQUcsY0FBYyxDQUFFLENBQUMsQ0FBRSxDQUFDLENBQUMsRUFDaEMsTUFBTSxDQUFDLENBQUMsR0FBRyxjQUFjLENBQUUsQ0FBQyxDQUFFLENBQUMsQ0FBQyxFQUNoQyxNQUFNLENBQUMsQ0FBQyxHQUFHLGNBQWMsQ0FBRSxDQUFDLENBQUUsQ0FBQyxDQUFDLEVBQ2hDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsY0FBYyxDQUFFLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FDaEMsQ0FBQzs7O0FBR0YsU0FBSyxRQUFRLENBQUUsQ0FBQyxDQUFFLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBRSxDQUFDLENBQUUsSUFBSSxDQUFDLElBQUksUUFBUSxDQUFFLENBQUMsQ0FBRSxJQUFJLENBQUMsSUFBSSxRQUFRLENBQUUsQ0FBQyxDQUFFLElBQUksQ0FBQyxFQUN6RjtBQUNDLFVBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLO1VBQzFCLElBQUksR0FBRyxDQUFDO1VBQ1IsT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDOzs7QUFHMUIsV0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFDM0I7QUFDQyxXQUFLLElBQUksQ0FBQyxHQUFHLENBQUUsUUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxPQUFPLENBQUUsRUFDcEQ7QUFDQyxZQUFJLEdBQUcsQ0FBQyxDQUFDO0FBQ1QsZUFBTyxHQUFHLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDO1FBQ3pCO09BQ0Q7O0FBRUQsVUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFDdkIsVUFBSSxDQUFDLElBQUksR0FBRztBQUNYLFFBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFFLEtBQUssQ0FBRSxJQUFJLENBQUUsQ0FBQyxDQUFDLENBQUU7QUFDL0IsUUFBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUUsS0FBSyxDQUFFLElBQUksQ0FBRSxDQUFDLENBQUMsQ0FBRTtPQUMvQixDQUFDOztBQUVGLGFBQU8sSUFBSSxDQUFDO01BQ1o7S0FDRDs7Ozs7Ozs7Ozs7Ozs7O0dBQ0Q7Ozs7O1NBR3dCLG1DQUFFLFdBQVcsRUFBRSxXQUFXLEVBQ25EO0FBQ0MsT0FBSyxrQkFBa0IsQ0FBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBRSxFQUN4RCxPQUFPLElBQUksQ0FBQzs7QUFFYixPQUFLLGtCQUFrQixDQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFFLEVBQ3pELE9BQU8sSUFBSSxDQUFDO0dBQ2I7Ozs7O1NBR2lCLDRCQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUN2RDs7OztBQUlDLE9BQUksS0FBSyxHQUFHLFdBQVcsQ0FBQyxLQUFLO09BQzVCLFlBQVksR0FBRyxRQUFRO09BQ3ZCLGdCQUFnQixHQUFHLENBQUM7T0FFcEIsY0FBYyxHQUFHLEtBQUs7T0FDdEIsYUFBYTtPQUNiLE1BQU07T0FFTixZQUFZO09BQ1osU0FBUztPQUVULFdBQVc7T0FDWCxnQkFBZ0I7T0FDaEIsb0JBQW9CLENBQUM7O0FBRXRCLFFBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUN0QztBQUNDLGlCQUFhLEdBQUcsSUFBSSxDQUFDOztBQUVyQixVQUFNLEdBQUc7QUFDUixNQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUUsQ0FBQyxDQUFFLENBQUMsQ0FBQztBQUNoQixNQUFDLEVBQUUsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFDLENBQUM7S0FDZixDQUFDOztBQUVGLGdCQUFZLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsQ0FBQztBQUM1QyxhQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxXQUFXLENBQUMsV0FBVyxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUUsR0FBRyxXQUFXLENBQUMsV0FBVyxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUUsQ0FBQzs7QUFFeEYsZUFBVyxHQUFHO0FBQ2IsTUFBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDLENBQUM7QUFDL0IsTUFBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDLENBQUM7S0FDL0IsQ0FBQztBQUNGLG9CQUFnQixHQUFHLFdBQVcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDdkUsd0JBQW9CLEdBQUcsZ0JBQWdCLElBQUksQ0FBQyxDQUFDOztBQUU3QyxRQUFJLEdBQUcsR0FBRyxRQUFRO1FBQ2pCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQztBQUNqQixTQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUMzQjtBQUNDLGNBQVMsR0FBRyxXQUFXLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxDQUFDOztBQUV6QyxnQkFBVyxHQUFHO0FBQ2IsT0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDLENBQUM7QUFDL0IsT0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDLENBQUM7TUFDL0IsQ0FBQzs7QUFFRixTQUFJLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1NBQ3pFLG9CQUFvQixHQUFHLGdCQUFnQixJQUFJLENBQUMsQ0FBQzs7QUFFOUMsU0FBSyxvQkFBb0IsS0FBSyxvQkFBb0IsRUFDakQsYUFBYSxHQUFHLEtBQUssQ0FBQzs7QUFFdkIsU0FBSyxnQkFBZ0IsR0FBRyxHQUFHLEVBQzFCLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxLQUNuQixJQUFLLGdCQUFnQixHQUFHLEdBQUcsRUFDL0IsR0FBRyxHQUFHLGdCQUFnQixDQUFDO0tBQ3hCOztBQUVELFFBQUssYUFBYSxFQUNsQjtBQUNDLG1CQUFjLEdBQUcsSUFBSSxDQUFDOztBQUV0QixTQUFLLFNBQVMsRUFDYixNQUFNO0tBQ1A7O0FBRUQsUUFBSSxPQUFPLENBQUM7QUFDWixRQUFLLEdBQUcsR0FBRyxnQkFBZ0IsRUFDMUIsT0FBTyxHQUFHLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxLQUVqQyxPQUFPLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQzs7QUFFckIsUUFBSyxPQUFPLEdBQUcsWUFBWSxFQUMzQjtBQUNDLGlCQUFZLEdBQUcsT0FBTyxDQUFDO0FBQ3ZCLHFCQUFnQixHQUFHLENBQUMsQ0FBQztLQUNyQjtJQUNEOztBQUVELE9BQUksQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUM7QUFDN0IsT0FBSSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUM7O0FBRTVCLFVBQU8sSUFBSSxDQUFDO0dBQ1o7OztRQWxMbUIsU0FBUzs7O3FCQUFULFNBQVM7Ozs7Ozs7Ozs7Ozs7Ozs7MEJDRlgsYUFBYTs7OztJQUVYLFdBQVc7QUFFcEIsVUFGUyxXQUFXLEdBRy9CO01BRGEsUUFBUSx5REFBRyxFQUFFO01BQUUsS0FBSyx5REFBRyxDQUFDO01BQUUsa0JBQWtCLHlEQUFHLENBQUM7TUFBRSxrQkFBa0IseURBQUcsQ0FBQzs7d0JBRmpFLFdBQVc7O0FBSTlCLE1BQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQ3pCLE1BQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUUsQ0FBQztBQUN0QyxNQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBRSxDQUFDLENBQUUsQ0FBQzs7QUFFekIsTUFBSSxDQUFDLE1BQU0sQ0FBRSxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLENBQUUsQ0FBQztFQUM3RDs7OztjQVRtQixXQUFXOztTQVl6QixrQkFDTjtPQURRLE1BQU0seURBQUcsQ0FBQztPQUFFLGtCQUFrQix5REFBRyxDQUFDO09BQUUsa0JBQWtCLHlEQUFHLENBQUM7O0FBRWpFLE9BQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsTUFBTSxDQUFFO09BQzNCLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLE1BQU0sQ0FBRTtPQUN4QixrQkFBa0IsR0FBRyxDQUNwQixDQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBRSxFQUNiLENBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBRSxDQUNaO09BQ0QsU0FBUyxHQUFHLEtBQUssQ0FBRSxDQUFDLENBQUUsQ0FBQzs7Ozs7OztBQUV4Qix5QkFBb0IsSUFBSSxDQUFDLFFBQVEsOEhBQ2pDO1NBRFUsTUFBTTs7QUFFZixjQUFTLENBQUUsQ0FBQyxDQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxrQkFBa0IsQ0FBQztBQUMvQyxjQUFTLENBQUUsQ0FBQyxDQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxrQkFBa0IsQ0FBQzs7QUFFL0MsU0FBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFFLGtCQUFrQixFQUFFLFNBQVMsQ0FBRSxDQUFDOztBQUV0RSxXQUFNLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDLENBQUUsR0FBRyxrQkFBa0IsQ0FBQztBQUNsRCxXQUFNLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBRSxDQUFDLENBQUUsR0FBRyxrQkFBa0IsQ0FBQztLQUNsRDs7Ozs7Ozs7Ozs7Ozs7OztBQUVELE9BQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNwQixPQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7R0FDckI7Ozs7O1NBR1EscUJBQ1Q7T0FEVyxFQUFFLHlEQUFHLENBQUM7T0FBRSxFQUFFLHlEQUFHLENBQUM7Ozs7OztBQUV4QiwwQkFBb0IsSUFBSSxDQUFDLFFBQVEsbUlBQ2pDO1NBRFUsTUFBTTs7QUFFZixXQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNmLFdBQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ2Y7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFRCxPQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDcEIsT0FBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0dBQ3JCOzs7OztTQUdXLHdCQUNaO0FBQ0MsT0FBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7QUFDeEMsUUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksRUFBRSxDQUFDLEVBQUUsRUFDdEM7QUFDQyxRQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBRTtRQUM5QixXQUFXLEdBQUcsQUFBRSxDQUFDLEtBQUssWUFBWSxHQUFHLENBQUMsR0FBSyxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBRSxDQUFDOztBQUV4RixRQUFJLENBQUMsS0FBSyxDQUFFLENBQUMsQ0FBRSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUUsTUFBTSxDQUFFLENBQUM7SUFDakQ7R0FDRDs7Ozs7U0FHWSx5QkFDYjs7QUFFQyxPQUFJLFVBQVUsR0FBRztBQUNmLEtBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDLENBQUM7QUFDdkIsS0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUMsQ0FBQztBQUN2QixXQUFPLEVBQUUsQ0FBQztBQUNWLFdBQU8sRUFBRSxDQUFDO0lBQ1Y7T0FDRCxVQUFVLEdBQUc7QUFDWixLQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBRSxDQUFDLENBQUUsQ0FBQyxDQUFDO0FBQ3ZCLEtBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDLENBQUM7QUFDdkIsV0FBTyxFQUFFLENBQUM7QUFDVixXQUFPLEVBQUUsQ0FBQztJQUNWLENBQUM7O0FBRUgsUUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFDM0I7QUFDQyxRQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDOztBQUV0QyxRQUFLLFlBQVksQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsRUFDbEM7QUFDQyxlQUFVLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztBQUN2QixlQUFVLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUM7S0FDOUIsTUFDSSxJQUFLLFlBQVksQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsRUFDdkM7QUFDQyxlQUFVLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztBQUN2QixlQUFVLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUE7S0FDbEM7O0FBRUQsUUFBSyxZQUFZLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLEVBQ2xDO0FBQ0MsZUFBVSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7QUFDdkIsZUFBVSxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDO0tBQzlCLE1BQ0ksSUFBSyxZQUFZLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLEVBQ3ZDO0FBQ0MsZUFBVSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7QUFDdkIsZUFBVSxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDO0tBQzlCO0lBQ0Q7O0FBRUQsT0FBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxVQUFVLENBQUM7QUFDOUIsT0FBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDLENBQUUsR0FBRyxVQUFVLENBQUM7R0FDOUI7Ozs7O1NBR2dCLDZCQUNqQjtPQURtQixRQUFRLHlEQUFHLEVBQUU7T0FBRSxRQUFRLHlEQUFHLEVBQUU7O0FBRTlDLE9BQUssUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQ2xELE9BQU8sRUFBRSxDQUFDOzs7QUFHWCxPQUFJLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDOzs7QUFHN0IsT0FBSSxLQUFLLEdBQUcsUUFBUSxDQUFFLENBQUMsQ0FBRSxDQUFDLE1BQU0sQ0FBQzs7O0FBR2pDLE9BQUksTUFBTSxHQUFHLEtBQUssQ0FBRSxNQUFNLENBQUUsQ0FBQzs7O0FBRzdCLFFBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQ3RDO0FBQ0MsUUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFFLEdBQUcsQ0FBRSxDQUFDO0FBQzVCLFVBQU0sQ0FBRSxHQUFHLENBQUUsR0FBRyxLQUFLLENBQUUsS0FBSyxDQUFFLENBQUM7OztBQUcvQixTQUFNLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUNyQztBQUNDLFNBQUksSUFBSSxHQUFHLENBQUMsQ0FBQzs7O0FBR2IsVUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQ25FO0FBQ0MsVUFBSSxJQUFJLEtBQUssQ0FBRSxDQUFDLENBQUUsR0FBRyxRQUFRLENBQUUsQ0FBQyxDQUFFLENBQUUsR0FBRyxDQUFFLENBQUM7TUFDMUM7O0FBRUQsV0FBTSxDQUFFLEdBQUcsQ0FBRSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUUsQ0FBQztLQUMzQjtJQUNEOztBQUVELFVBQU8sTUFBTSxDQUFDO0dBQ2Q7OztRQXBKbUIsV0FBVzs7O3FCQUFYLFdBQVc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzRCQ0ZiLGVBQWU7Ozs7QUFFbEMsSUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDOztJQUVELE1BQU07V0FBTixNQUFNOztBQUVmLFVBRlMsTUFBTSxDQUViLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUN4QjtNQUQwQixLQUFLLHlEQUFHLENBQUMsQ0FBQztNQUFFLElBQUkseURBQUcsRUFBRTs7d0JBRjNCLE1BQU07O0FBSXpCLDZCQUptQixNQUFNLDZDQUlsQixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFHOztBQUU3QixNQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUNqQixNQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQzs7QUFFckIsTUFBSSxDQUFDLFNBQVMsQ0FBRSxLQUFLLENBQUUsQ0FBQztFQUN4Qjs7Y0FWbUIsTUFBTTs7U0FZcEIsZ0JBQUUsSUFBSSxFQUNaO0FBQ0MsT0FBSSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUVuQixPQUFLLElBQUksQ0FBQyxXQUFXLElBQUksV0FBVyxFQUNuQyxPQUFPLElBQUksQ0FBQzs7QUFFYixPQUFLLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUNqQjtBQUNDLFFBQUssSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQ2xCLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQyxLQUV0QyxJQUFJLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDO0lBQ3RDLE1BRUQ7QUFDQyxRQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDO0lBQzVCO0dBQ0Q7OztTQUVJLGlCQUNMO0FBQ0MsT0FBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7QUFDZixPQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQztHQUNyQjs7O1FBcENtQixNQUFNOzs7cUJBQU4sTUFBTTs7Ozs7Ozs7Ozs7Ozs7Ozt3QkNKVixXQUFXOzs7OzBCQUNULGFBQWE7Ozs7a0NBQ1IscUJBQXFCOzs7O0lBRXhCLE1BQU07QUFFZixVQUZTLE1BQU0sR0FHMUI7TUFEYSxDQUFDLHlEQUFHLENBQUM7TUFBRSxDQUFDLHlEQUFHLENBQUM7TUFBRSxLQUFLLHlEQUFHLENBQUM7TUFBRSxNQUFNLHlEQUFHLENBQUM7TUFBRSxLQUFLLHlEQUFHLENBQUM7TUFBRSxrQkFBa0IseURBQUcsR0FBRztNQUFFLGtCQUFrQix5REFBRyxHQUFHOzt3QkFGM0YsTUFBTTs7QUFJekIsTUFBSSxDQUFDLEVBQUUsR0FBRyxzQkFBSyxXQUFXLEVBQUUsQ0FBQzs7QUFFN0IsTUFBSSxDQUFDLEdBQUcsR0FBRyw0QkFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7QUFDOUIsTUFBSSxDQUFDLE9BQU8sR0FBRyw2QkFBWSxDQUFDO0FBQzVCLE1BQUksQ0FBQyxPQUFPLEdBQUcsNkJBQVksQ0FBQztBQUM1QixNQUFJLENBQUMsUUFBUSxHQUFHLDZCQUFZLENBQUM7O0FBRTdCLE1BQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ25CLE1BQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ3JCLE1BQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUUsQ0FBQzs7O0FBRzVELE1BQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ25CLE1BQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO0FBQ3BCLE1BQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxLQUFLLENBQUUsQ0FBQztBQUNuQyxNQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsS0FBSyxDQUFFLENBQUM7QUFDbkMsTUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQzs7QUFFMUIsTUFBSSxDQUFDLGdCQUFnQixHQUFHLDRCQUFZLGtCQUFrQixFQUFFLGtCQUFrQixDQUFFLENBQUM7QUFDN0UsTUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsK0JBQStCLEVBQUUsQ0FBQztFQUMzRDs7OztjQXhCbUIsTUFBTTs7U0EyQkssMkNBQy9CO0FBQ0MsT0FBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDO09BQzlCLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUM7T0FDN0IsUUFBUSxHQUFHLENBQ1YsNEJBQVksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBRSxFQUMvRCw0QkFBWSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFFLEVBQy9ELDRCQUFZLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUUsRUFDL0QsNEJBQVksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsVUFBVSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBRSxDQUMvRDtPQUNELGtCQUFrQixHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7T0FDdEUsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDOztBQUV6RSxVQUFPLG9DQUFpQixRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsQ0FBRSxDQUFDO0dBQ3ZGOzs7U0FFRyxnQkFDSjtPQURNLEVBQUUseURBQUcsQ0FBQztPQUFFLEVBQUUseURBQUcsQ0FBQzs7QUFHbkIsT0FBSSxDQUFDLE1BQU0sQ0FBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFFLENBQUM7R0FDaEQ7OztTQUVNLG1CQUNQO09BRFMsQ0FBQyx5REFBRyxDQUFDO09BQUUsQ0FBQyx5REFBRyxDQUFDOztBQUVwQixPQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO09BQ3RCLEVBQUUsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7O0FBRXJCLE9BQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNyQixPQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBRSxFQUFFLEVBQUUsRUFBRSxDQUFFLENBQUM7R0FDdEM7OztTQUVHLGdCQUNKO09BRE0sTUFBTSx5REFBRyxDQUFDOztBQUdmLE9BQUksQ0FBQyxNQUFNLENBQUUsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUUsQ0FBQztHQUNuQzs7O1NBRU0sbUJBQ1A7T0FEUyxLQUFLLHlEQUFHLENBQUM7O0FBRWpCLE9BQUksTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSztPQUM5QixrQkFBa0IsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO09BQ3RFLGtCQUFrQixHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzs7QUFFekUsT0FBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7QUFDbkIsT0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFFLEtBQUssQ0FBRSxDQUFDO0FBQ25DLE9BQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxLQUFLLENBQUUsQ0FBQzs7QUFFbkMsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsSUFBSSxRQUFRLEVBQ3RDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBRSxDQUFDOzs7QUFHOUMsT0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQzVCLElBQUksQ0FBQyxXQUFXLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDOztBQUVoQyxPQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBRSxNQUFNLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLENBQUUsQ0FBQztHQUMzRTs7O1NBRVEscUJBQ1Q7T0FEVyxLQUFLLHlEQUFHLENBQUM7O0FBRW5CLE9BQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ25CLE9BQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFFLENBQUM7R0FDcEU7OztTQUVhLDBCQUNkO09BRGdCLEtBQUsseURBQUcsQ0FBQzs7QUFHeEIsT0FBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztHQUM5Qjs7O1FBOUZtQixNQUFNOzs7cUJBQU4sTUFBTTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NEJDSlIsZUFBZTs7OztBQUVsQyxJQUFNLFlBQVksR0FBRyxDQUFDLENBQUM7QUFDdkIsSUFBTSxlQUFlLEdBQUcsRUFBRSxDQUFDOztJQUVOLFNBQVM7V0FBVCxTQUFTOztBQUVsQixVQUZTLFNBQVMsQ0FFaEIsQ0FBQyxFQUFFLENBQUMsRUFDakI7TUFEbUIsTUFBTSx5REFBRyxZQUFZOzt3QkFGcEIsU0FBUzs7QUFJNUIsNkJBSm1CLFNBQVMsNkNBSXJCLENBQUMsRUFBRSxDQUFDLEVBQUc7O0FBRWQsTUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDckIsTUFBSSxDQUFDLFNBQVMsR0FBRyxlQUFlLENBQUM7RUFDakM7O2NBUm1CLFNBQVM7O1NBVW5CLG9CQUFFLFNBQVMsRUFDckI7QUFDQyxPQUFLLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxFQUN2QixPQUFPLElBQUksQ0FBQzs7QUFFYixPQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQztHQUM1Qjs7O1NBRUksaUJBQ0w7QUFDQyxPQUFJLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQztHQUNqQzs7O1FBckJtQixTQUFTOzs7cUJBQVQsU0FBUzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NEJDTFgsZUFBZTs7OztBQUVsQyxJQUFNLGVBQWUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDOztJQUVYLElBQUk7V0FBSixJQUFJOztBQUViLFVBRlMsSUFBSSxDQUVYLENBQUMsRUFBRSxDQUFDLEVBQ2pCO01BRG1CLElBQUkseURBQUcsRUFBRTtNQUFFLFNBQVMseURBQUcsZUFBZTs7d0JBRnJDLElBQUk7O0FBSXZCLDZCQUptQixJQUFJLDZDQUloQixDQUFDLEVBQUUsQ0FBQyxFQUFHOztBQUVkLE1BQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLE1BQUksQ0FBQyxTQUFTLEdBQUcsZUFBZSxDQUFDO0VBQ2pDOztjQVJtQixJQUFJOztTQVVkLG9CQUFFLFNBQVMsRUFDckI7QUFDQyxPQUFLLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxFQUN2QixPQUFPLElBQUksQ0FBQzs7QUFFYixPQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQztHQUM1Qjs7O1NBRUksaUJBQ0w7QUFDQyxPQUFJLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQztHQUNqQzs7O1FBckJtQixJQUFJOzs7cUJBQUosSUFBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7MEJDSk4sYUFBYTs7Ozs0QkFDYixlQUFlOzs7OzRCQUNmLGVBQWU7Ozs7SUFFYixJQUFJO1dBQUosSUFBSTs7QUFFYixVQUZTLElBQUksR0FHeEI7TUFEYSxFQUFFLHlEQUFHLEVBQUU7TUFBRSxDQUFDLHlEQUFHLENBQUM7TUFBRSxDQUFDLHlEQUFHLENBQUM7TUFBRSxLQUFLLHlEQUFHLENBQUM7O3dCQUZ6QixJQUFJOztBQUl2Qiw2QkFKbUIsSUFBSSw2Q0FJaEIsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRzs7QUFFN0IsTUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7QUFDYixNQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUNwQixNQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNmLE1BQUksQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7QUFDMUIsTUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDaEIsTUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDbEIsTUFBSSxDQUFDLE1BQU0sR0FBRyw4QkFBWSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUUsQ0FBQztFQUNuRDs7Y0FibUIsSUFBSTs7U0FlcEIsY0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUNWO0FBQ0MsOEJBakJtQixJQUFJLHNDQWlCWCxDQUFDLEVBQUUsQ0FBQyxFQUFHO0FBQ25CLE9BQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztHQUN6Qjs7O1NBRU0saUJBQUUsQ0FBQyxFQUFFLENBQUMsRUFDYjtBQUNDLDhCQXZCbUIsSUFBSSx5Q0F1QlIsQ0FBQyxFQUFFLENBQUMsRUFBRztBQUN0QixPQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7R0FDNUI7OztTQUVVLHFCQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFDbkQ7QUFDQyxPQUFJLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxlQUFlLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxlQUFlLENBQUUsQ0FBRSxDQUFDO0dBQy9HOzs7U0FFYSx3QkFBRSxLQUFLLEVBQ3JCO0FBQ0MsT0FBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUUsS0FBSyxDQUFFLENBQUM7R0FDN0I7OztTQUVpQiw0QkFBRSxJQUFJLEVBQ3hCOztBQUVDLE9BQUksVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNyRSxPQUFJLENBQUMsT0FBTyxDQUFFLFVBQVUsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLFVBQVUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFFLENBQUM7R0FDekQ7OztTQUVtQiw4QkFBRSxjQUFjLEVBQ3BDO0FBQ0MsT0FBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsY0FBYyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDO0FBQ3pGLE9BQUksQ0FBQyxPQUFPLENBQUUsVUFBVSxHQUFHLGNBQWMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUUsQ0FBQztHQUM3RTs7O1NBRWMseUJBQUUsSUFBSSxFQUFFLE9BQU8sRUFDOUI7QUFDQyxPQUFJLGtCQUFrQixHQUFHO0FBQ3hCLEtBQUMsRUFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDbkIsS0FBQyxFQUFFLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQztJQUNuQixDQUFDOztBQUVGLE9BQUssSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQ2Qsa0JBQWtCLENBQUMsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDOztBQUU5QyxPQUFLLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUNkLGtCQUFrQixDQUFDLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQzs7QUFFOUMsT0FBSSxDQUFDLE9BQU8sQ0FBRSxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFFLENBQUM7R0FDM0Q7Ozs7O1NBR2dCLDJCQUFFLGNBQWMsRUFDakM7QUFDQyxPQUFJLGtCQUFrQixHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFDM0QsT0FBSSxDQUFDLE9BQU8sQ0FBRSxrQkFBa0IsR0FBRyxjQUFjLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUUsQ0FBQztHQUM3Rjs7Ozs7U0FHSSxpQkFDTDtBQUNDLE9BQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQzs7O0FBR2hDLE9BQUksYUFBYSxHQUFHLDRCQUFZLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFFLENBQUMsQ0FBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBRSxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUUsQ0FBQzs7Ozs7QUFLakcsT0FBSSxVQUFVLEdBQUcsSUFBSSxVQUFVLENBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUUsQ0FBQztBQUNoRyxPQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBRSxVQUFVLENBQUUsQ0FBQzs7QUFFcEMsVUFBTyxVQUFVLENBQUM7R0FDbEI7Ozs7O1NBR2dCLDJCQUFFLE1BQU0sRUFDekI7O0FBRUMsT0FBSyxNQUFNLENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQyxFQUFFLEVBQzFCO0FBQ0MsV0FBTztJQUNQOzs7QUFHRCxPQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUUsTUFBTSxDQUFFLENBQUM7QUFDaEUsT0FBSyxjQUFjLEVBQ25CO0FBQ0MsV0FBTyxjQUFjLENBQUM7SUFDdEI7R0FDRDs7O1NBRUksaUJBQ0w7QUFDQyxPQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUNwQixPQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNmLE9BQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO0FBQ3RCLE9BQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUN4QixPQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7R0FDdEI7OztRQWxIbUIsSUFBSTs7O3FCQUFKLElBQUk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs0QkNKTixlQUFlOzs7O0lBRWIsSUFBSTtZQUFKLElBQUk7O1dBQUosSUFBSTswQkFBSixJQUFJOzsrQkFBSixJQUFJOzs7U0FBSixJQUFJOzs7cUJBQUosSUFBSTs7Ozs7Ozs7Ozs7Ozs7SUNGSixLQUFLO0FBRWQsVUFGUyxLQUFLLEdBR3pCO3dCQUhvQixLQUFLOztBQUl4QixNQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztFQUN0Qjs7Y0FMbUIsS0FBSzs7U0FPakIsb0JBQ1I7Ozs7OztBQUNDLHlCQUFjLElBQUksQ0FBQyxXQUFXLDhIQUM5QjtBQURNLFNBQUk7O0FBRVQsU0FBSSxFQUFFLENBQUM7S0FDUDs7Ozs7Ozs7Ozs7Ozs7O0dBQ0Q7OztTQUVLLGdCQUFFLElBQUksRUFDWjtBQUNDLE9BQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBRSxDQUFDO0dBQzlCOzs7UUFsQm1CLEtBQUs7OztxQkFBTCxLQUFLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JDQU4sWUFBWTs7OzsrQkFDVixrQkFBa0I7Ozs7a0NBQ2xCLHFCQUFxQjs7OzsrQkFDcEIsa0JBQWtCOzs7OzBCQUN2QixhQUFhOzs7O0FBRS9CLE9BQU8sQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDOztBQUVuQixPQUFPLENBQUMsR0FBRyx5QkFBUyxDQUFDO0FBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBRSx3QkFBTSxTQUFTLENBQUUsQ0FBRSxDQUFDOztJQUU1QixJQUFJO0FBRWIsVUFGUyxJQUFJLEdBR3hCO3dCQUhvQixJQUFJOztBQUl2QixNQUFJLENBQUMsUUFBUSxHQUFHLDJCQUFhLENBQUM7O0FBRTlCLE1BQUksQ0FBQyxjQUFjLEdBQUcsaUNBQWdCLENBQUMsa0NBQWEsQ0FBQztBQUNyRCxNQUFJLENBQUMsY0FBYyxHQUFHLGlDQUFnQixFQUFFLCtCQUFhLENBQUM7QUFDdEQsU0FBTyxDQUFDLEdBQUcsQ0FBRSxPQUFPLENBQUUsQ0FBQztBQUN2QixTQUFPLENBQUMsR0FBRyxDQUFFLElBQUksQ0FBQyxTQUFTLHlCQUFTLENBQUUsQ0FBQTs7Ozs7RUFLdEM7O2NBZG1CLElBQUk7O1NBZ0JsQixnQkFBRSxFQUFFLEVBQ1Y7QUFDQyxPQUFJLENBQUMsWUFBWSxDQUFFLEVBQUUsQ0FBRSxDQUFDO0FBQ3hCLE9BQUksQ0FBQyxjQUFjLENBQUUsRUFBRSxDQUFFLENBQUM7QUFDMUIsT0FBSSxDQUFDLFlBQVksQ0FBRSxFQUFFLENBQUUsQ0FBQztBQUN4QixPQUFJLENBQUMsaUJBQWlCLENBQUUsRUFBRSxDQUFFLENBQUM7R0FDN0I7OztTQUVXLHNCQUFFLEVBQUUsRUFDaEI7QUFDQyxPQUFJLFNBQVMsR0FBRyxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRXJDLHFCQUEwQixRQUFRLENBQUMsS0FBSyxFQUN4Qzs7O1FBRFksRUFBRTtRQUFFLElBQUk7O0FBRW5CLFFBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEtBQUssQ0FBQyxFQUM5QjtBQUNDLFNBQUksQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFFLENBQUM7Ozs7Ozs7QUFFdEMsMkJBQTBCLEdBQUcsQ0FBQyxLQUFLLDhIQUNuQzs7O1dBRFksR0FBRTtXQUFFLElBQUk7O0FBRW5CLFdBQUssU0FBUyxDQUFDLFlBQVksQ0FBRSxJQUFJLEVBQUUsSUFBSSxDQUFFLEVBQ3hDLE1BQU0sQ0FBQyxlQUFlLENBQUUsU0FBUyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFFLENBQUM7T0FDN0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVELDRCQUFvQyxHQUFHLENBQUMsS0FBSyxtSUFDN0M7OztXQURZLElBQUU7V0FBRSxjQUFjOztBQUU3QixXQUFLLFNBQVMsQ0FBQyxZQUFZLENBQUUsSUFBSSxFQUFFLGNBQWMsQ0FBRSxFQUNsRCxNQUFNLENBQUMsaUJBQWlCLENBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBRSxDQUFDO09BQzFEOzs7Ozs7Ozs7Ozs7Ozs7S0FDRDs7QUFFRCxRQUFLLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFDakM7QUFDQyxTQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDOzs7Ozs7O0FBRXZDLDRCQUEwQixHQUFHLENBQUMsS0FBSyxtSUFDbkM7OztXQURZLElBQUU7V0FBRSxJQUFJOztBQUVuQixXQUFLLFNBQVMsQ0FBQyxZQUFZLENBQUUsSUFBSSxFQUFFLElBQUksQ0FBRSxFQUN4QyxRQUFRLENBQUMsT0FBTyxDQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUUsQ0FBQztPQUNsRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUQsNEJBQW9DLEdBQUcsQ0FBQyxLQUFLLG1JQUM3Qzs7O1dBRFksSUFBRTtXQUFFLGNBQWM7O0FBRTdCLFdBQUssU0FBUyxDQUFDLFlBQVksQ0FBRSxJQUFJLEVBQUUsY0FBYyxDQUFFLEVBQ2xELFFBQVEsQ0FBQyxPQUFPLENBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBRSxDQUFDO09BQ2xEOzs7Ozs7Ozs7Ozs7Ozs7O0FBRUQsV0FBTSxDQUFDLElBQUksQ0FBRSxRQUFRLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBRSxDQUFDOztBQUVoRCxTQUFLLEVBQUUsS0FBSyxVQUFVLENBQUMsRUFBRSxFQUN4QixVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQztLQUNqRjs7O0FBR0QsUUFBSyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsRUFDakM7QUFDQyxTQUFJLEVBQUUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDekIsRUFBRSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDOztBQUV4QixTQUFLLElBQUksQ0FBQyxHQUFHLENBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUUsR0FBRyxDQUFDLEVBQ3JDLEVBQUUsSUFBSSxFQUFFLENBQUM7O0FBRVYsU0FBSyxJQUFJLENBQUMsR0FBRyxDQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFFLEdBQUcsQ0FBQyxFQUNyQyxFQUFFLElBQUksRUFBRSxDQUFDOztBQUVWLFdBQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFFLENBQUM7O0FBRWhDLFdBQU0sQ0FBQyxJQUFJLENBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBRSxDQUFDO0tBQ3RCOztBQUVELFFBQUssSUFBSSxDQUFDLEdBQUcsQ0FBRSxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBRSxHQUFHLENBQUMsRUFDNUM7QUFDQyxTQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQzs7QUFFckMsU0FBSyxJQUFJLENBQUMsR0FBRyxDQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFFLEdBQUcsQ0FBQyxFQUMzQyxNQUFNLElBQUksQ0FBQyxDQUFDOztBQUViLFdBQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxJQUFJLE1BQU0sQ0FBQzs7QUFFckMsV0FBTSxDQUFDLElBQUksQ0FBRSxNQUFNLENBQUUsQ0FBQztLQUN0QjtJQUNEOztBQUVELGlCQUFjLENBQUMsT0FBTyxDQUFFLFNBQVMsQ0FBRSxDQUFDO0dBQ3BDOzs7U0FFYSx3QkFBRSxFQUFFLEVBQ2xCO0FBQ0MsT0FBSSxTQUFTLEdBQUcsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDOzs7Ozs7O0FBRXJDLDBCQUE0QixHQUFHLENBQUMsT0FBTyxtSUFDdkM7OztTQURZLEVBQUU7U0FBRSxNQUFNOztBQUVyQixTQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDakMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDOzs7Ozs7OztBQUdoQyw0QkFBc0MsR0FBRyxDQUFDLE9BQU8sbUlBQ2pEOzs7V0FEWSxJQUFFO1dBQUUsZ0JBQWdCOztBQUUvQixnQkFBUyxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFDOztBQUU1RCxXQUFLLFNBQVMsRUFDZDtBQUNDLFdBQUcsQ0FBQyxhQUFhLENBQUUsTUFBTSxDQUFFLENBQUM7QUFDNUIsV0FBRyxDQUFDLGFBQWEsQ0FBRSxnQkFBZ0IsQ0FBRSxDQUFDO1FBQ3RDO09BQ0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0QsNEJBQTBCLEdBQUcsQ0FBQyxLQUFLLG1JQUNuQzs7O1dBRFksSUFBRTtXQUFFLElBQUk7O0FBRW5CLGdCQUFTLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixDQUFFLElBQUksQ0FBRSxDQUFDOztBQUVoRCxXQUFLLFNBQVMsRUFDZDtBQUNDLFdBQUcsQ0FBQyxhQUFhLENBQUUsTUFBTSxDQUFFLENBQUM7QUFDNUIsV0FBRyxDQUFDLFdBQVcsQ0FBRSxJQUFJLENBQUUsQ0FBQztRQUN4QjtPQUNEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdELDRCQUEwQixHQUFHLENBQUMsS0FBSyxtSUFDbkM7OztXQURZLElBQUU7V0FBRSxJQUFJOztBQUVuQixnQkFBUyxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBRSxJQUFJLENBQUUsQ0FBQzs7QUFFaEQsV0FBSyxTQUFTLEVBQ2Q7QUFDQyxjQUFNLENBQUMsTUFBTSxDQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUUsQ0FBQzs7QUFFaEMsa0JBQVUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUMvQixrQkFBVSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQy9CO09BQ0Q7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFRCxXQUFNLENBQUMsSUFBSSxDQUFFLFVBQVUsR0FBRyxFQUFFLEVBQUUsVUFBVSxHQUFHLEVBQUUsQ0FBRSxDQUFDO0tBQ2hEOzs7Ozs7Ozs7Ozs7Ozs7O0FBRUQsaUJBQWMsQ0FBQyxPQUFPLENBQUUsU0FBUyxDQUFFLENBQUM7R0FDcEM7OztTQUVXLHNCQUFFLEVBQUUsRUFDaEI7Ozs7OztBQUNDLDBCQUEwQixHQUFHLENBQUMsS0FBSyxtSUFDbkM7OztTQURZLEVBQUU7U0FBRSxJQUFJOztBQUVuQixTQUFLLElBQUksQ0FBQyxVQUFVLENBQUUsRUFBRSxDQUFFLEVBQzFCO0FBQ0MsU0FBRyxDQUFDLFdBQVcsQ0FBRSxJQUFJLENBQUUsQ0FBQztNQUN4QjtLQUNEOzs7Ozs7Ozs7Ozs7Ozs7R0FDRDs7O1NBRWdCLDJCQUFFLEVBQUUsRUFDckI7Ozs7OztBQUNDLDJCQUErQixHQUFHLENBQUMsVUFBVSx3SUFDN0M7OztTQURZLEVBQUU7U0FBRSxTQUFTOztBQUV4QixTQUFLLFNBQVMsQ0FBQyxVQUFVLENBQUUsRUFBRSxDQUFFLEVBQy9CO0FBQ0MsU0FBRyxDQUFDLGdCQUFnQixDQUFFLFNBQVMsQ0FBRSxDQUFDO01BQ2xDO0tBQ0Q7Ozs7Ozs7Ozs7Ozs7OztHQUNEOzs7UUEvS21CLElBQUk7OztxQkFBSixJQUFJOzs7Ozs7Ozs7Ozs7Ozs7OzBCQ1hOLGFBQWE7Ozs7MEJBQ2YsYUFBYTs7Ozs0QkFDWCxlQUFlOzs7OzBCQUNqQixhQUFhOzs7OzBCQUNiLGFBQWE7Ozs7K0JBQ1Isa0JBQWtCOzs7OytCQUNqQixrQkFBa0I7Ozs7SUFFcEIsT0FBTztBQUVoQixVQUZTLE9BQU8sQ0FFZCxLQUFLLEVBQUUsTUFBTSxFQUMxQjt3QkFIb0IsT0FBTzs7QUFJMUIsTUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7O0FBRWQsTUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7QUFDbkIsTUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7O0FBRXJCLE1BQUksQ0FBQyxTQUFTLEdBQUcsaUNBQWdCLEVBQUUsMEJBQVEsQ0FBQztBQUM1QyxNQUFJLENBQUMsV0FBVyxHQUFHLGlDQUFnQixFQUFFLDRCQUFVLENBQUM7QUFDaEQsTUFBSSxDQUFDLFNBQVMsR0FBRyxpQ0FBZ0IsRUFBRSwwQkFBUSxDQUFDO0FBQzVDLE1BQUksQ0FBQyxTQUFTLEdBQUcsaUNBQWdCLEVBQUUsMEJBQVEsQ0FBQztBQUM1QyxNQUFJLENBQUMsY0FBYyxHQUFHLGlDQUFnQixFQUFFLCtCQUFhLENBQUM7O0FBRXRELE1BQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUN2QixNQUFJLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7QUFDekIsTUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ3ZCLE1BQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUN2QixNQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7RUFDNUI7O2NBcEJtQixPQUFPOztTQXNCbkIsa0JBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUN6QjtBQUNDLE9BQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUUsRUFBRSxDQUFFLEVBQ3hCLE9BQU87O0FBRVIsT0FBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNoQyxPQUFJLENBQUMsT0FBTyxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztBQUNyQixPQUFJLENBQUMsT0FBTyxDQUFFLEtBQUssQ0FBRSxDQUFDOztBQUV0QixPQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBRSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBRSxDQUFDOztBQUVoQyxVQUFPLElBQUksQ0FBQztHQUNaOzs7U0FFUyxvQkFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQzdCO0FBQ0MsT0FBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNwQyxTQUFNLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUNuQixTQUFNLENBQUMsT0FBTyxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQzs7QUFFdkIsT0FBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUUsVUFBVSxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUUsQ0FBQzs7QUFFOUMsVUFBTyxVQUFVLENBQUM7R0FDbEI7OztTQUVPLGtCQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUNwQjtBQUNDLE9BQUksSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDaEMsT0FBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDakIsT0FBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUM7O0FBRXJCLE9BQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFFLENBQUM7O0FBRWhDLFVBQU8sSUFBSSxDQUFDO0dBQ1o7OztTQUVPLGtCQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFDN0I7QUFDQyxPQUFJLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ2hDLE9BQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUVyQixPQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBRSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBRSxDQUFDOztBQUVoQyxVQUFPLElBQUksQ0FBQztHQUNaOzs7U0FFWSx1QkFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFDM0I7QUFDQyxPQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzFDLFlBQVMsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQzFCLFlBQVMsQ0FBQyxPQUFPLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFDOztBQUUxQixPQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBRSxTQUFTLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBRSxDQUFDOztBQUUvQyxVQUFPLFNBQVMsQ0FBQztHQUNqQjs7O1NBRVUscUJBQUUsRUFBRSxFQUNmO0FBQ0MsT0FBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUUsRUFBRSxDQUFFLENBQUM7O0FBRWhDLFlBQVMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFFLENBQUM7QUFDMUIsT0FBSSxDQUFDLEtBQUssVUFBTyxDQUFFLEVBQUUsQ0FBRSxDQUFDO0dBQ3hCOzs7U0FFWSx1QkFBRSxFQUFFLEVBQ2pCO0FBQ0MsT0FBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUUsRUFBRSxDQUFFLENBQUM7O0FBRXBDLGNBQVcsQ0FBQyxPQUFPLENBQUUsTUFBTSxDQUFFLENBQUM7QUFDOUIsT0FBSSxDQUFDLFdBQVcsVUFBTyxDQUFFLEVBQUUsQ0FBRSxDQUFDO0dBQzlCOzs7U0FFVSxxQkFBRSxFQUFFLEVBQ2Y7QUFDQyxPQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBRSxFQUFFLENBQUUsQ0FBQzs7QUFFaEMsWUFBUyxDQUFDLE9BQU8sQ0FBRSxJQUFJLENBQUUsQ0FBQztBQUMxQixPQUFJLENBQUMsS0FBSyxVQUFPLENBQUUsRUFBRSxDQUFFLENBQUM7R0FDeEI7OztTQUVVLHFCQUFFLEVBQUUsRUFDZjtBQUNDLE9BQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFFLEVBQUUsQ0FBRSxDQUFDOztBQUVoQyxZQUFTLENBQUMsT0FBTyxDQUFFLElBQUksQ0FBRSxDQUFDO0FBQzFCLE9BQUksQ0FBQyxLQUFLLFVBQU8sQ0FBRSxFQUFFLENBQUUsQ0FBQztHQUN4Qjs7O1NBRWUsMEJBQUUsRUFBRSxFQUNwQjtBQUNDLE9BQUksU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFFLEVBQUUsQ0FBRSxDQUFDOztBQUUxQyxpQkFBYyxDQUFDLE9BQU8sQ0FBRSxTQUFTLENBQUUsQ0FBQztBQUNwQyxPQUFJLENBQUMsVUFBVSxVQUFPLENBQUUsU0FBUyxDQUFFLENBQUM7R0FDcEM7OztRQXJIbUIsT0FBTzs7O3FCQUFQLE9BQU87Ozs7Ozs7Ozs7Ozs7O0lDUlAsVUFBVTtBQUVuQixVQUZTLFVBQVUsR0FHOUI7TUFEYSxJQUFJLHlEQUFHLEdBQUc7TUFBRSxHQUFHLHlEQUFHLE1BQU07O3dCQUZqQixVQUFVOztBQUk3QixNQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUNmLE1BQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFFLElBQUksQ0FBRSxDQUFDOztBQUUxQixPQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRTtBQUM3QixPQUFJLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7R0FBQTtFQUM1Qjs7OztjQVRtQixVQUFVOztTQVl6QixpQkFDTDtBQUNDLE9BQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFFLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFFLENBQUM7R0FDakM7Ozs7O1NBR0UsZUFDSDtBQUNDLE9BQUssSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUMxQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7O0FBRWQsVUFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0dBQ3ZCOzs7OztTQUdNLGlCQUFFLEdBQUcsRUFDWjtBQUNDLE9BQUssT0FBTyxHQUFHLEtBQUssT0FBTyxJQUFJLENBQUMsR0FBRyxFQUNsQyxPQUFPOztBQUVSLE9BQUssT0FBTyxHQUFHLENBQUMsS0FBSyxLQUFLLFVBQVUsRUFDbkMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDOztBQUViLE9BQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFFLEdBQUcsQ0FBRSxDQUFDO0dBQ3RCOzs7UUFwQ21CLFVBQVU7OztxQkFBVixVQUFVOzs7Ozs7Ozs7Ozs7OztJQ0FWLElBQUk7VUFBSixJQUFJO3dCQUFKLElBQUk7OztjQUFKLElBQUk7O1NBRVIscUJBQ2hCO0FBQ0MsT0FBSyxPQUFPLE1BQU0sS0FBSyxXQUFXLElBQ2pDLE9BQU8sTUFBTSxDQUFDLFdBQVcsS0FBSyxXQUFXLElBQ3pDLE9BQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEtBQUssV0FBVyxFQUM3QyxPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRWpDLFVBQU8sSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztHQUM1Qjs7O1NBRWlCLHVCQUNsQjtBQUNDLFVBQU8sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0dBQ3JCOzs7OztTQUd3Qiw0QkFBRSxDQUFDLEVBQUUsQ0FBQyxFQUMvQjtBQUNDLFVBQU8sSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsQ0FBQyxDQUFFLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsQ0FBQyxDQUFFLENBQUM7R0FDcEQ7OztRQXJCbUIsSUFBSTs7O3FCQUFKLElBQUk7O0FBd0J6QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksVUFBVyxDQUFDLEVBQ3JDO0FBQ0MsRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ1AsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBRSxDQUFDLENBQUUsRUFDMUI7QUFDQyxTQUFPLENBQUMsQ0FBQztFQUNUO0FBQ0QsUUFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztDQUN0QixDQUFBOztBQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsVUFBVyxHQUFHLEVBQzNCO0FBQ0MsUUFBTyxBQUFFLEdBQUcsR0FBRyxHQUFHLElBQU0sQ0FBQyxDQUFDO0NBQzFCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7d0JDckNlLFdBQVc7Ozs7SUFFUCxNQUFNO0FBRWYsVUFGUyxNQUFNLEdBRzFCO01BRGEsQ0FBQyx5REFBRyxDQUFDO01BQUUsQ0FBQyx5REFBRyxDQUFDOzt3QkFGTCxNQUFNOztBQUl6QixNQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNYLE1BQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ1gsTUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBRSxDQUFDO0VBQzNDOzs7O2NBUG1CLE1BQU07O1NBVXZCLGVBQ0g7T0FESyxDQUFDLHlEQUFHLENBQUM7T0FBRSxDQUFDLHlEQUFHLENBQUM7O0FBRWhCLE9BQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ1gsT0FBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDWCxPQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFFLENBQUM7O0FBRTNDLFVBQU8sSUFBSSxDQUFDO0dBQ1o7Ozs7O1NBR0UsZUFDSDtPQURLLENBQUMseURBQUcsQ0FBQztPQUFFLENBQUMseURBQUcsQ0FBQzs7QUFFaEIsT0FBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDWixPQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNaLE9BQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUUsQ0FBQzs7QUFFM0MsVUFBTyxJQUFJLENBQUM7R0FDWjs7Ozs7U0FHSyxnQkFBRSxPQUFPLEVBQ2Y7QUFDQyxPQUFJLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQztBQUNsQixPQUFJLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQztBQUNsQixPQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFFLENBQUM7O0FBRTNDLFVBQU8sSUFBSSxDQUFDO0dBQ1o7Ozs7O1NBR08sa0JBQUUsUUFBUSxFQUNsQjtBQUNDLE9BQUksQ0FBQyxDQUFDLElBQUksUUFBUSxDQUFDO0FBQ25CLE9BQUksQ0FBQyxDQUFDLElBQUksUUFBUSxDQUFDO0FBQ25CLE9BQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUUsQ0FBQzs7QUFFM0MsVUFBTyxJQUFJLENBQUM7R0FDWjs7Ozs7U0FHTSxpQkFBRSxNQUFNLEVBQ2Y7QUFDQyxPQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFFLE1BQU0sQ0FBRSxDQUFDOztBQUUzQyxPQUFJLENBQUMsQ0FBQyxHQUFHLFVBQVUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQy9CLE9BQUksQ0FBQyxDQUFDLEdBQUcsVUFBVSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDL0IsT0FBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBRSxDQUFDOztBQUUzQyxVQUFPLElBQUksQ0FBQztHQUNaOzs7OztTQUdLLGtCQUNOOztBQUVDLFVBQU8sSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDcEM7Ozs7Ozs7U0FPUyxzQkFDVjtBQUNDLE9BQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUU7T0FDekIsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBRSxHQUFHLE1BQU0sR0FBRyxDQUFDO09BQ3JFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFDLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUUsR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDOztBQUV2RSxVQUFPLElBQUksTUFBTSxDQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztHQUMxQjs7Ozs7U0FHRyxjQUFFLE1BQU0sRUFDWjs7QUFFQyxVQUFPLElBQUksTUFBTSxDQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUUsQ0FBQztHQUMxRDs7Ozs7U0FHTyxrQkFBRSxNQUFNLEVBQ2hCOztBQUVDLFVBQU8sSUFBSSxNQUFNLENBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBRSxDQUFDO0dBQzFEOzs7OztTQUdTLG9CQUFFLE1BQU0sRUFDbEI7O0FBRUMsVUFBTyxJQUFJLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO0dBQzdDOzs7OztTQUdRLHFCQUNUOztBQUVDLFVBQU8sSUFBSSxDQUFDLEdBQUcsQ0FBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztHQUNyRDs7Ozs7U0FHSSxpQkFDTDs7QUFFQyxVQUFPLElBQUksTUFBTSxDQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBRSxDQUFDO0dBQ3BDOzs7OztTQUdPLG9CQUNSO0FBQ0MsT0FBSSxZQUFZLEdBQUc7QUFDbEIsS0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ1QsS0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ1QsQ0FBQzs7QUFFRixVQUFPLFlBQVksQ0FBQztHQUNwQjs7O1NBRU8sb0JBQ1I7QUFDQyxVQUFPLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0dBQ3hDOzs7UUFuSW1CLE1BQU07OztxQkFBTixNQUFNIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qXG5cbk5vdGUgdGhlIG1hcHBpbmcgZm9yIHNlbmRpbmcga2V5ZG93biBhbmQga2V5dXAgaXMgYXMgZm9sbG93czpcblxuXHRcdGtleWRvd25cdFx0a2V5dXBcblVwIFx0XHQwXHRcdFx0NFx0XG5Eb3duIFx0MVx0XHRcdDVcbkxlZnQgXHQyXHRcdFx0NlxuUmlnaHRcdDNcdFx0XHQ3XG5cbiovXG5cbid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuXHR2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG52YXIgQ29ubmVjdF9DbGFzcyA9IChmdW5jdGlvbiAoKSB7XG5cdGZ1bmN0aW9uIENvbm5lY3RfQ2xhc3MoKSB7XG5cdFx0X2NsYXNzQ2FsbENoZWNrKHRoaXMsIENvbm5lY3RfQ2xhc3MpO1xuXG5cdFx0dGhpcy5zdGF0ZVF1ZXVlID0ge307XG5cblx0XHR0aGlzLnNvY2tldCA9IGlvKCdodHRwOi8vbG9jYWxob3N0OjMwMDAnKTtcblxuXHRcdHRoaXMuc29ja2V0Lm9uKCdjb25uZWN0JywgKGZ1bmN0aW9uICgpIHtcblx0XHRcdHRoaXMuc29ja2V0LmVtaXQoJ2luaXQnLCBuYW1lKTtcblxuXHRcdFx0dGhpcy5zb2NrZXQub24oJ2luaXQnLCB0aGlzLmNvbm5lY3RIYW5kbGVyKTtcblx0XHRcdHRoaXMuc29ja2V0Lm9uKCdkaXNjb25uZWN0JywgdGhpcy5kaXNjb25uZWN0SGFuZGxlcik7XG5cdFx0XHR0aGlzLnNvY2tldC5vbignZScsIHRoaXMuZXZlbnRIYW5kbGVyKTtcblx0XHR9KS5iaW5kKHRoaXMpKTtcblxuXHRcdC8vIEF0dGVtcHQgZGlmZmVyZW50IHNlcnZlcnMgaWYgZmFpbGVkIHRvIGNvbm5lY3QgdG8gdGhpcyBvbmVcblx0XHR0aGlzLnNvY2tldC5vbignY29ubmVjdF9lcnJvcicsIChmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAodGhpcy5zb2NrZXQuaW8udXJpID09PSAnaHR0cDovL2xvY2FsaG9zdDozMDAwJykgdGhpcy5zb2NrZXQuaW8udXJpID0gJ2h0dHA6Ly90YW5rdGkubWU6MzAwMCc7ZWxzZSB0aGlzLnNvY2tldC5pby51cmkgPSAnaHR0cDovL2xvY2FsaG9zdDozMDAwJztcblx0XHR9KS5iaW5kKHRoaXMpKTtcblxuXHRcdHRoaXMuc2V0TGlzdGVuZXJzKCk7XG5cdH1cblxuXHQvLyBBZGQgYW4gZXZlbnQgdG8gdGhlIHF1ZXVlIHRvIGJlIHNlbnQgdG8gdGhlIHNlcnZlclxuXG5cdF9jcmVhdGVDbGFzcyhDb25uZWN0X0NsYXNzLCBbe1xuXHRcdGtleTogJ3B1c2hTdGF0ZUV2ZW50Jyxcblx0XHR2YWx1ZTogZnVuY3Rpb24gcHVzaFN0YXRlRXZlbnQoa2V5LCBkYXRhKSB7XG5cdFx0XHR0aGlzLnN0YXRlUXVldWVba2V5XSA9IGRhdGE7XG5cdFx0fVxuXG5cdFx0Ly8gU2VuZCB0aGUgcXVldWUgb2YgZXZlbnRzIHRvIHRoZSBzZXJ2ZXJcblx0fSwge1xuXHRcdGtleTogJ3NlbmRTdGF0ZVF1ZXVlJyxcblx0XHR2YWx1ZTogZnVuY3Rpb24gc2VuZFN0YXRlUXVldWUoKSB7XG5cdFx0XHRpZiAoT2JqZWN0LmtleXModGhpcy5zdGF0ZVF1ZXVlKS5sZW5ndGggPT09IDApIHJldHVybiBmYWxzZTtcblxuXHRcdFx0dGhpcy5zdGF0ZVF1ZXVlLnQgPSBEYXRlLm5vdygpO1xuXHRcdFx0dGhpcy5zb2NrZXQuZW1pdCgnZScsIHRoaXMuc3RhdGVRdWV1ZSk7XG5cblx0XHRcdHRoaXMuc3RhdGVRdWV1ZSA9IHt9O1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogJ3NldExpc3RlbmVycycsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHNldExpc3RlbmVycygpIHtcblx0XHRcdHdpbmRvdy5vbmJlZm9yZXVubG9hZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0aWYgKHRoaXMuc29ja2V0KSB0aGlzLnNvY2tldC5jbG9zZSgpO1xuXHRcdFx0fTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6ICdjb25uZWN0SGFuZGxlcicsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGNvbm5lY3RIYW5kbGVyKGRhdGEpIHtcblx0XHRcdC8vIENyZWF0ZSBhIG1hcFxuXHRcdFx0bWFwID0gbmV3IE1hcChkYXRhLmJvdW5kWCwgZGF0YS5ib3VuZFkpO1xuXHRcdFx0cmVuZGVyZXIgPSBuZXcgUmVuZGVyZXIoZGF0YS5ib3VuZFgsIGRhdGEuYm91bmRZKTtcblxuXHRcdFx0Ly8gQ3JlYXRlIG5ldyBwbGF5ZXJzXG5cdFx0XHRmb3IgKHZhciBpZCBpbiBkYXRhLnBsYXllcnMpIHtcblx0XHRcdFx0dmFyIHBsYXllciA9IGRhdGEucGxheWVyc1tpZF07XG5cblx0XHRcdFx0Ly8gQ3JlYXRlIGEgbmV3IHBsYXllclxuXHRcdFx0XHRpZiAocGxheWVyLmlkICE9PSBkYXRhLmlkKSB7XG5cdFx0XHRcdFx0bWFwLnBsYXllcnNbcGxheWVyLmlkXSA9IG5ldyBQbGF5ZXIocGxheWVyLmlkLCBwbGF5ZXIucG9zLngsIHBsYXllci5wb3MueSwgcGxheWVyLmFuZ2xlKTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBDcmVhdGUgYSBuZXcgY29udHJvbGxlclxuXHRcdFx0bWFwLnBsYXllcnNbZGF0YS5pZF0gPSBjb250cm9sbGVyID0gbmV3IENvbnRyb2xsZXIodGhpcy5zb2NrZXQuaWQpO1xuXHRcdFx0Y29udHJvbGxlci5hZGRDYW1lcmEod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG5cblx0XHRcdC8vIEFuIGVycm9yIGhhcyBvY2N1cnJlZFxuXHRcdFx0aWYgKCFjb250cm9sbGVyKSByZXR1cm47XG5cblx0XHRcdC8vIENyZWF0ZSBtYXAgd2FsbHNcblx0XHRcdGZvciAodmFyIGlkIGluIGRhdGEud2FsbHMpIHtcblx0XHRcdFx0dmFyIHdhbGwgPSBkYXRhLndhbGxzW2lkXTtcblx0XHRcdFx0bWFwLndhbGxzLnB1c2gobmV3IFdhbGwod2FsbC5wb3MueCwgd2FsbC5wb3MueSwgd2FsbC53aWR0aCwgd2FsbC5oZWlnaHQpKTtcblx0XHRcdH1cblxuXHRcdFx0bWFwLmdyaWQgPSBkYXRhLmdyaWQ7XG5cdFx0XHRyZW5kZXJlci5yZW5kZXJXYWxscyhtYXAuZ3JpZCwgY29udHJvbGxlci5jYW1lcmEpO1xuXG5cdFx0XHRmb3IgKHZhciBpZCBpbiBkYXRhLnByb2plY3RpbGVzKSB7XG5cdFx0XHRcdHZhciBwcm9qZWN0aWxlID0gZGF0YS5wcm9qZWN0aWxlc1tpZF07XG5cdFx0XHRcdG1hcC5wcm9qZWN0aWxlc1twcm9qZWN0aWxlLmlkXSA9IG5ldyBQcm9qZWN0aWxlKHByb2plY3RpbGUucGlkLCBwcm9qZWN0aWxlLnBvcy54LCBwcm9qZWN0aWxlLnBvcy55LCBwcm9qZWN0aWxlLmFuZ2xlLCBwcm9qZWN0aWxlLnNwZWVkKTtcblx0XHRcdH1cblxuXHRcdFx0ZHJhd0xlYWRlcmJvYXJkKGRhdGEuaWQsIGRhdGEubGVhZGVyYm9hcmQpO1xuXHRcdFx0cGxheSgpO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogJ2Rpc2Nvbm5lY3RIYW5kbGVyJyxcblx0XHR2YWx1ZTogZnVuY3Rpb24gZGlzY29ubmVjdEhhbmRsZXIoKSB7XG5cdFx0XHRpZiAoYW5pbWF0aW9uQ2xvY2spIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShhbmltYXRpb25DbG9jayk7XG5cblx0XHRcdGFuaW1hdGlvbkNsb2NrID0gdW5kZWZpbmVkO1xuXHRcdFx0Y29udHJvbGxlciA9IHVuZGVmaW5lZDtcblx0XHRcdG1hcCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6ICdldmVudEhhbmRsZXInLFxuXHRcdHZhbHVlOiBmdW5jdGlvbiBldmVudEhhbmRsZXIoZGF0YSkge1xuXHRcdFx0aWYgKCFtYXApIHJldHVybjtcblxuXHRcdFx0aWYgKCFjb250cm9sbGVyKSByZXR1cm47XG5cblx0XHRcdGZvciAodmFyIGlkIGluIGRhdGEucGxheWVycykge1xuXHRcdFx0XHR2YXIgcGxheWVyID0gZGF0YS5wbGF5ZXJzW2lkXTtcblxuXHRcdFx0XHRpZiAocGxheWVyID09PSAncmVtb3ZlJykge1xuXHRcdFx0XHRcdG1hcC5yZW1vdmVQbGF5ZXIoaWQpO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCdhZGQnIGluIHBsYXllcikge1xuXHRcdFx0XHRcdHZhciBwbGF5ZXJEYXRhID0gcGxheWVyLmFkZCxcblx0XHRcdFx0XHQgICAgcGxheWVyO1xuXG5cdFx0XHRcdFx0aWYgKGlkID09PSB0aGlzLnNvY2tldC5pZCkge1xuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5zZXRQb3MocGxheWVyRGF0YS5wb3MueCwgcGxheWVyRGF0YS5wb3MueSk7XG5cdFx0XHRcdFx0XHRjb250cm9sbGVyLmNhbWVyYS5tb3ZlVG8ocGxheWVyRGF0YS5wb3MueCwgcGxheWVyRGF0YS5wb3MueSwgbWFwLndpZHRoLCBtYXAuaGVpZ2h0KTtcblxuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bWFwLnBsYXllcnNbaWRdID0gcGxheWVyID0gbmV3IFBsYXllcihpZCwgcGxheWVyRGF0YS5wb3MueCwgcGxheWVyRGF0YS5wb3MueSwgcGxheWVyRGF0YS5hbmdsZSk7XG5cdFx0XHRcdFx0cGxheWVyLnNldFZlbG9jaXR5KHBsYXllckRhdGEuc3BlZWQpO1xuXHRcdFx0XHRcdHBsYXllci5iYXJyZWwuc2V0QW5nbGUocGxheWVyRGF0YS5oZWFkaW5nKTtcblxuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCdwb3MnIGluIHBsYXllcikge1xuXHRcdFx0XHRcdHZhciBwb3MgPSBuZXcgVmVjdG9yKHBsYXllci5wb3MueCwgcGxheWVyLnBvcy55KSxcblx0XHRcdFx0XHQgICAgbWFwUGxheWVyID0gbWFwLnBsYXllcnNbaWRdO1xuXG5cdFx0XHRcdFx0bWFwUGxheWVyLm5leHRQb3MgPSBwb3MuZGlmZihtYXBQbGF5ZXIucG9zKTtcblx0XHRcdFx0XHQvLyBtYXAucGxheWVyc1sgaWQgXS5zZXRQb3MoIHBsYXllci5wb3MueCwgcGxheWVyLnBvcy55ICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJ2FuZ2xlJyBpbiBwbGF5ZXIpIHtcblx0XHRcdFx0XHRtYXAucGxheWVyc1tpZF0uc2V0QW5nbGUocGxheWVyLmFuZ2xlKTtcblx0XHRcdFx0XHQvLyBtYXAucGxheWVyc1sgaWQgXS5hbmdsZS5uZXh0UmFkID0gbWFwLnBsYXllcnNbIGlkIF0uYW5nbGUucmFkIC0gcGxheWVyLmFuZ2xlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCdmYWNpbmcnIGluIHBsYXllcikgbWFwLnBsYXllcnNbaWRdLmJhcnJlbC5zZXRBbmdsZShwbGF5ZXIuZmFjaW5nKTtcblxuXHRcdFx0XHRpZiAoJ3NwZWVkJyBpbiBwbGF5ZXIpIG1hcC5wbGF5ZXJzW2lkXS5zZXRWZWxvY2l0eShwbGF5ZXIuc3BlZWQpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gaWYgKCBkYXRhLnByb2plY3RpbGVzIClcblx0XHRcdC8vIGNvbnNvbGUubG9nKCBkYXRhLnByb2plY3RpbGVzICk7XG5cdFx0XHRmb3IgKHZhciBpZCBpbiBkYXRhLnByb2plY3RpbGVzKSB7XG5cdFx0XHRcdHZhciBwcm9qZWN0aWxlID0gZGF0YS5wcm9qZWN0aWxlc1tpZF07XG5cblx0XHRcdFx0aWYgKHByb2plY3RpbGUgPT09ICdyZW1vdmUnKSB7XG5cdFx0XHRcdFx0bWFwLnJlbW92ZVByb2plY3RpbGUoaWQpO1xuXG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJ2FkZCcgaW4gcHJvamVjdGlsZSkge1xuXHRcdFx0XHRcdHZhciBwcm9qZWN0aWxlRGF0YSA9IHByb2plY3RpbGUuYWRkO1xuXHRcdFx0XHRcdG1hcC5wcm9qZWN0aWxlc1tpZF0gPSBuZXcgUHJvamVjdGlsZShwcm9qZWN0aWxlRGF0YS5waWQsIHByb2plY3RpbGVEYXRhLnBvcy54LCBwcm9qZWN0aWxlRGF0YS5wb3MueSwgcHJvamVjdGlsZURhdGEuYW5nbGUsIHByb2plY3RpbGVEYXRhLnNwZWVkKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fV0pO1xuXG5cdHJldHVybiBDb25uZWN0X0NsYXNzO1xufSkoKTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gQ29ubmVjdF9DbGFzcztcblxudmFyIENvbm5lY3QgPSBuZXcgQ29ubmVjdF9DbGFzcygpO1xuZXhwb3J0c1snZGVmYXVsdCddID0gQ29ubmVjdDtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuXHR2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbnZhciBfZXZlbnRFdmVudCA9IHJlcXVpcmUoJ2V2ZW50L2V2ZW50Jyk7XG5cbnZhciBfZXZlbnRFdmVudDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9ldmVudEV2ZW50KTtcblxudmFyIERPTV9DbGFzcyA9IChmdW5jdGlvbiAoKSB7XG5cdGZ1bmN0aW9uIERPTV9DbGFzcygpIHtcblx0XHRfY2xhc3NDYWxsQ2hlY2sodGhpcywgRE9NX0NsYXNzKTtcblxuXHRcdHRoaXMuaWQoJ21lbnUtcGxheScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGZ1bmN0aW9uICgpIHtcblx0XHRcdHRoaXMucmVuZGVyX2dhbWVfdWkoKTtcblx0XHRcdHRoaXMuaGlkZV9tZW51X3VpKCk7XG5cblx0XHRcdF9ldmVudEV2ZW50MlsnZGVmYXVsdCddLmRpc3BhdGNoKCdwbGF5JywgbmFtZSk7XG5cdFx0fSkuYmluZCh0aGlzKSk7XG5cdH1cblxuXHRfY3JlYXRlQ2xhc3MoRE9NX0NsYXNzLCBbe1xuXHRcdGtleTogJ2lkJyxcblx0XHR2YWx1ZTogZnVuY3Rpb24gaWQoX2lkKSB7XG5cdFx0XHRyZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoX2lkKTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6ICdnZXRfYnlfY2xhc3MnLFxuXHRcdHZhbHVlOiBmdW5jdGlvbiBnZXRfYnlfY2xhc3MobmFtZSkge1xuXHRcdFx0cmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUobmFtZSkpO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogJ3JlbmRlcl9nYW1lX3VpJyxcblx0XHR2YWx1ZTogZnVuY3Rpb24gcmVuZGVyX2dhbWVfdWkoKSB7XG5cdFx0XHR0aGlzLmlkKCdsZWFkZXJib2FyZCcpLnN0eWxlLnZpc2liaWxpdHkgPSAnJztcblx0XHRcdHRoaXMuaWQoJ3Njb3JlJykuc3R5bGUudmlzaWJpbGl0eSA9ICcnO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogJ2hpZGVfZ2FtZV91aScsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGhpZGVfZ2FtZV91aSgpIHtcblx0XHRcdHRoaXMuaWQoJ2xlYWRlcmJvYXJkJykuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuXHRcdFx0dGhpcy5pZCgnc2NvcmUnKS5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG5cdFx0XHR0aGlzLmlkKCdzY29yZScpLmlubmVySFRNTCA9ICdTY29yZTogMCc7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiAncmVuZGVyX21lbnVfdWknLFxuXHRcdHZhbHVlOiBmdW5jdGlvbiByZW5kZXJfbWVudV91aSgpIHtcblx0XHRcdHRoaXMuaWQoJ21lbnUnKS5zdHlsZS52aXNpYmlsaXR5ID0gJyc7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiAnaGlkZV9tZW51X3VpJyxcblx0XHR2YWx1ZTogZnVuY3Rpb24gaGlkZV9tZW51X3VpKCkge1xuXHRcdFx0dGhpcy5pZCgnbWVudScpLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6ICd1cGRhdGVfc2NvcmUnLFxuXHRcdHZhbHVlOiBmdW5jdGlvbiB1cGRhdGVfc2NvcmUoKSB7XG5cdFx0XHR2YXIgc2NvcmUgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAwIDogYXJndW1lbnRzWzBdO1xuXG5cdFx0XHR0aGlzLmlkKCdzY29yZScpLmlubmVySFRNTCA9ICdTY29yZTogJyArIHNjb3JlO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogJ3VwZGF0ZV9sZWFkZXJib2FyZCcsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZV9sZWFkZXJib2FyZChjb250cm9sbGVySUQsIGxlYWRlcmJvYXJkKSB7XG5cdFx0XHR2YXIgbGVhZGVyYm9hcmRIVE1MID0gJzxoMz5MZWFkZXJib2FyZDwvaDM+JztcblxuXHRcdFx0aWYgKGxlYWRlcmJvYXJkKSB7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGVhZGVyYm9hcmQubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHR2YXIgbmFtZSA9IGxlYWRlcmJvYXJkW2ldLm5hbWU7XG5cdFx0XHRcdFx0aWYgKG5hbWUubGVuZ3RoID4gMTApIG5hbWUgPSBuYW1lLnN1YnN0cigwLCAxMCkgKyAnLi4uJztcblxuXHRcdFx0XHRcdGlmIChsZWFkZXJib2FyZFtpXS5pZCA9PT0gY29udHJvbGxlcklEKSBsZWFkZXJib2FyZEhUTUwgKz0gJzxsaT48Yj4nICsgbmFtZSArICc8L2xpPic7ZWxzZSBsZWFkZXJib2FyZEhUTUwgKz0gJzxsaT4nICsgbmFtZSArICc8L2xpPic7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dGhpcy5pZCgnbGVhZGVyYm9hcmQnKS5pbm5lckhUTUwgPSBsZWFkZXJib2FyZEhUTUw7XG5cdFx0fVxuXHR9XSk7XG5cblx0cmV0dXJuIERPTV9DbGFzcztcbn0pKCk7XG5cbnZhciBET00gPSBuZXcgRE9NX0NsYXNzKCk7XG5leHBvcnRzWydkZWZhdWx0J10gPSBET007XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF91dGlsVXRpbCA9IHJlcXVpcmUoJ3V0aWwvdXRpbCcpO1xuXG52YXIgX3V0aWxVdGlsMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxVdGlsKTtcblxudmFyIF9nYW1lR2FtZSA9IHJlcXVpcmUoJ2dhbWUvZ2FtZScpO1xuXG52YXIgX2dhbWVHYW1lMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2dhbWVHYW1lKTtcblxudmFyIF9kb20gPSByZXF1aXJlKCcuL2RvbScpO1xuXG52YXIgX2RvbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9kb20pO1xuXG52YXIgX2Nvbm5lY3QgPSByZXF1aXJlKCcuL2Nvbm5lY3QnKTtcblxudmFyIF9jb25uZWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2Nvbm5lY3QpO1xuXG52YXIgcmVuZGVyZXIsIG1hcCwgbmFtZSwgY29udHJvbGxlciwgYW5pbWF0aW9uQ2xvY2s7XG5cbmZ1bmN0aW9uIHBsYXkoKSB7XG5cdHJlcXVlc3RBbmltRnJhbWUoZnJhbWUpO1xufVxuXG52YXIgbm93LFxuICAgIGR0LFxuICAgIGxhc3QgPSBfdXRpbFV0aWwyWydkZWZhdWx0J10udGltZXN0YW1wKCk7XG5cbmZ1bmN0aW9uIGZyYW1lKCkge1xuXHRub3cgPSBfdXRpbFV0aWwyWydkZWZhdWx0J10udGltZXN0YW1wKCk7XG5cdGR0ID0gKG5vdyAtIGxhc3QpIC8gMTAwMDsgLy8gSW4gc2Vjb25kc1xuXG5cdGlmIChtYXApIHtcblx0XHR1cGRhdGUoZHQpO1xuXHRcdHJlbmRlcihkdCk7XG5cdH1cblxuXHRsYXN0ID0gbm93O1xuXHRyZXF1ZXN0QW5pbUZyYW1lKGZyYW1lKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlKGR0KSB7XG5cdGdhbWUudXBkYXRlKGR0KTtcblxuXHQvLyBTZW5kIGV2ZW50IGRhdGEgdG8gdGhlIHNlcnZlclxuXHRjb25uZWN0LnNlbmRTdGF0ZVF1ZXVlKCk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlcihkdCkge1xuXHRyZW5kZXJlci5kcmF3KG1hcC50YW5rcywgbWFwLmJ1bGxldHMsIG1hcC5taW5lcywgbWFwLmV4cGxvc2lvbnMsIG1hcC53YWxscywgY29udHJvbGxlci5jYW1lcmEpO1xufSIsImltcG9ydCBWZWN0b3IgZnJvbSAndXRpbC92ZWN0b3InO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb2xsaXNpb25cbntcblx0Y29uc3RydWN0b3IoKVxuXHR7XG5cdFx0dGhpcy5lZGdlO1xuXHRcdHRoaXMub3ZlcmxhcDtcblx0fVxuXG5cdC8vIERldGVybWluZSBpZiB0aGVyZSBpcyBhIGNvbGxpc2lvbiB3aXRoIHJlY3RhbmdsZVxuXHRpc19jb2xsaWRpbmcoIHJlY3RhbmdsZV9hLCByZWN0YW5nbGVfYiApXG5cdHtcblx0XHRpZiAoICFpc19uZWFyKCByZWN0YW5nbGVfYSwgcmVjdGFuZ2xlX2IgKSApXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cblx0XHRpZiAoIHJlY3RhbmdsZV9iLmFuZ2xlID09PSAwIClcblx0XHRcdHJldHVybiBpc19jb2xsaWRpbmdfd2l0aF91bnJvdGF0ZWQoIHJlY3RhbmdsZV9hLCByZWN0YW5nbGVfYiApO1xuXG5cdFx0aWYgKCByZWN0YW5nbGVfYS5hbmdsZSA9PT0gMCApXG5cdFx0XHRyZXR1cm4gaXNfY29sbGlkaW5nX3dpdGhfdW5yb3RhdGVkKCByZWN0YW5nbGVfYiwgcmVjdGFuZ2xlX2EgKTtcblxuXHRcdHJldHVybiBpc19jb2xsaWRpbmdfd2l0aF9yb3RhdGVkKCByZWN0YW5nbGVfYSwgcmVjdGFuZ2xlX2IgKTtcblx0fVxuXG5cdC8vIFJvdWdoIGNvbGxpc2lvbiBhcHByb3hpbWF0aW9uIHRvIGNoZWNrIGlmIHJlY3RhbmdsZSBpcyBjbG9zZSB0byB0aGUgcG9seWdvblxuXHRpc19uZWFyKCByZWN0YW5nbGVfYSwgcmVjdGFuZ2xlX2IsIHJhZGl1cyApXG5cdHtcblx0XHQvLyBJZiBubyByYWRpdXMsIHVzZSB0aGUgY29tYmluYWVkIHJhZGlpIHBsdXMgYSBiaXQgbW9yZVxuXHRcdGlmICggIXJhZGl1cyApXG5cdFx0XHRyYWRpdXMgPSByZWN0YW5nbGVfYS5yYWRpdXMgKyByZWN0YW5nbGVfYi5yYWRpdXM7XG5cblx0XHRsZXQgZGlzdGFuY2UgPSBVdGlsLnNxcnRfYXBwcm94aW1hdGlvbiggcmVjdGFuZ2xlX2IucG9zLnggLSByZWN0YW5nbGVfYS5wb3MueCwgcmVjdGFuZ2xlX2IucG9zLnkgLSByZWN0YW5nbGVfYS5wb3MueSApXG5cdFx0aWYgKCBkaXN0YW5jZSA8PSByYWRpdXMgKVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHQvLyBDaGVjayBmb3IgYSBjb2xsaXNpb24gYmV0d2VlbiByb3RhdGVkIG9yIHVucm90YXRlZCByZWN0YW5nbGVfYSBhbmQgdW5yb3RhdGVkIHJlY3RhbmdsZV9iXG5cdGlzX2NvbGxpZGluZ193aXRoX3Vucm90YXRlZCggcmVjdGFuZ2xlX2EsIHJlY3RhbmdsZV9iIClcblx0e1xuXHRcdGxldCBib3VuZGluZ19ib3hfYSA9IHJlY3RhbmdsZV9hLmJvdW5kaW5nQm94LFxuXHRcdFx0Ym91bmRpbmdfYm94X2IgPSByZWN0YW5nbGVfYi5ib3VuZGluZ0JveDtcblxuXHRcdC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgYm91bmRzIG9mIHRoaXNcblx0XHRmb3IgKCB2ZXJ0ZXggb2YgYm91bmRpbmdfYm94X2EubGVuZ3RoIClcblx0XHR7XG5cdFx0XHQvLyBDYWxjdWxhdGUgdGhlIG92ZXJsYXBzIG9mIHRoZSB4IGFuZCB5IHBvc2l0aW9uIG9mIHRoZSB3YWxsIGFuZCBib3VuZFxuXHRcdFx0b3ZlcmxhcHMgPSBbXG5cdFx0XHRcdHZlcnRleC55IC0gYm91bmRpbmdfYm94X2JbIDAgXS55LFxuXHRcdFx0XHR2ZXJ0ZXgueCAtIGJvdW5kaW5nX2JveF9iWyAxIF0ueCxcblx0XHRcdFx0dmVydGV4LnkgLSBib3VuZGluZ19ib3hfYlsgMiBdLnksXG5cdFx0XHRcdHZlcnRleC54IC0gYm91bmRpbmdfYm94X2JbIDMgXS54XG5cdFx0XHRdO1xuXG5cdFx0XHQvLyBJZiB0aGUgYm91bmQgaXMgY29udGFpbmVkIHdpdGhpbiB0aGUgd2FsbFxuXHRcdFx0aWYgKCBvdmVybGFwc1sgMCBdIDw9IDAgJiYgb3ZlcmxhcHNbIDEgXSA+PSAwICYmIG92ZXJsYXBzWyAyIF0gPj0gMCAmJiBvdmVybGFwc1sgMyBdIDw9IDAgKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgZWRnZXMgPSByZWN0YW5nbGUuZWRnZXMsXG5cdFx0XHRcdFx0ZWRnZSA9IDAsXG5cdFx0XHRcdFx0b3ZlcmxhcCA9IC1vdmVybGFwc1sgMCBdO1xuXG5cdFx0XHRcdC8vIEZpbmQgdGhlIHNpZGUgb2YgbGVhc3Qgb3ZlcmxhcFxuXHRcdFx0XHRmb3IgKCBsZXQgaSA9IDE7IGkgPCA0OyBpKysgKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKCBNYXRoLmFicyggb3ZlcmxhcHNbIGkgXSApIDwgTWF0aC5hYnMoIG92ZXJsYXAgKSApXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZWRnZSA9IGk7XG5cdFx0XHRcdFx0XHRvdmVybGFwID0gLW92ZXJsYXBzWyBpIF07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy5vdmVybGFwID0gb3ZlcmxhcDtcblx0XHRcdFx0dGhpcy5lZGdlID0ge1xuXHRcdFx0XHRcdHg6IE1hdGguc2lnbiggZWRnZXNbIGVkZ2UgXS54ICksXG5cdFx0XHRcdFx0eTogTWF0aC5zaWduKCBlZGdlc1sgZWRnZSBdLnkgKVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8vIENoZWNrIGZvciBhIGNvbGxpc2lvbiBiZXR3ZWVuIHR3byByb3RhdGVkIHJlY3RhbmdsZXNcblx0aXNfY29sbGlkaW5nX3dpdGhfcm90YXRlZCggcmVjdGFuZ2xlX2EsIHJlY3RhbmdsZV9iIClcblx0e1xuXHRcdGlmICggaXNfc2VwYXJhdGluZ19heGlzKCByZWN0YW5nbGVfYSwgcmVjdGFuZ2xlX2IsIHRydWUgKSApXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblxuXHRcdGlmICggaXNfc2VwYXJhdGluZ19heGlzKCByZWN0YW5nbGVfYSwgcmVjdGFuZ2xlX2IsIGZhbHNlICkgKVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHQvLyBEZXRlcm1pbmUgaWYgcmVjdGFuZ2xlX2EncyBheGVzIHNlcGFyYXRlIHJlY3RhbmdsZV9hIGZyb20gcmVjdGFuZ2xlX2Jcblx0aXNfc2VwYXJhdGluZ19heGlzKCByZWN0YW5nbGVfYSwgcmVjdGFuZ2xlX2IsIGlzQU1vdmluZyApXG5cdHtcblx0XHQvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMTU0MjYvYWxnb3JpdGhtLXRvLWRldGVjdC1pbnRlcnNlY3Rpb24tb2YtdHdvLXJlY3RhbmdsZXM/cnE9MVxuXHRcdC8vIGh0dHA6Ly9pbWd1ci5jb20vYk53cnpzdlxuXG5cdFx0dmFyIGVkZ2VzID0gcmVjdGFuZ2xlX2EuZWRnZXMsXG5cdFx0XHRsZWFzdE92ZXJsYXAgPSBJbmZpbml0eSxcblx0XHRcdGxlYXN0T3ZlcmxhcEVkZ2UgPSAwLFxuXG5cdFx0XHRzZXBhcmF0aW5nQXhpcyA9IGZhbHNlLFxuXHRcdFx0b3Bwb3NpdGVTaWRlcyxcblx0XHRcdG5vcm1hbCxcblxuXHRcdFx0Y3VycmVudFBvaW50LFxuXHRcdFx0bmV4dFBvaW50LFxuXG5cdFx0XHRzaGFwZVZlY3Rvcixcblx0XHRcdHNoYXBlMURvdFByb2R1Y3QsXG5cdFx0XHRzaGFwZTFEb3RQcm9kdWN0U2lnbjtcblxuXHRcdGZvciAoIHZhciBpID0gMDsgaSA8IGVkZ2VzLmxlbmd0aDsgaSsrIClcblx0XHR7XG5cdFx0XHRvcHBvc2l0ZVNpZGVzID0gdHJ1ZTtcblxuXHRcdFx0bm9ybWFsID0ge1xuXHRcdFx0XHR4OiAtZWRnZXNbIGkgXS55LFxuXHRcdFx0XHR5OiBlZGdlc1sgaSBdLnhcblx0XHRcdH07XG5cblx0XHRcdGN1cnJlbnRQb2ludCA9IHJlY3RhbmdsZV9hLmJvdW5kaW5nQm94WyBpIF07XG5cdFx0XHRuZXh0UG9pbnQgPSBpIDwgMiA/IHJlY3RhbmdsZV9hLmJvdW5kaW5nQm94WyBpICsgMiBdIDogcmVjdGFuZ2xlX2EuYm91bmRpbmdCb3hbIGkgLSAyIF07XG5cblx0XHRcdHNoYXBlVmVjdG9yID0ge1xuXHRcdFx0XHR4OiBuZXh0UG9pbnQueCAtIGN1cnJlbnRQb2ludC54LFxuXHRcdFx0XHR5OiBuZXh0UG9pbnQueSAtIGN1cnJlbnRQb2ludC55XG5cdFx0XHR9O1xuXHRcdFx0c2hhcGUxRG90UHJvZHVjdCA9IHNoYXBlVmVjdG9yLnggKiBub3JtYWwueCArIHNoYXBlVmVjdG9yLnkgKiBub3JtYWwueTtcblx0XHRcdHNoYXBlMURvdFByb2R1Y3RTaWduID0gc2hhcGUxRG90UHJvZHVjdCA+PSAwO1xuXG5cdFx0XHR2YXIgbWluID0gSW5maW5pdHksXG5cdFx0XHRcdG1heCA9IC1JbmZpbml0eTtcblx0XHRcdGZvciAoIHZhciBqID0gMDsgaiA8IDQ7IGorKyApXG5cdFx0XHR7XG5cdFx0XHRcdG5leHRQb2ludCA9IHJlY3RhbmdsZV9iLmJvdW5kaW5nQm94WyBqIF07XG5cblx0XHRcdFx0c2hhcGVWZWN0b3IgPSB7XG5cdFx0XHRcdFx0eDogbmV4dFBvaW50LnggLSBjdXJyZW50UG9pbnQueCxcblx0XHRcdFx0XHR5OiBuZXh0UG9pbnQueSAtIGN1cnJlbnRQb2ludC55LFxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHZhciBzaGFwZTJEb3RQcm9kdWN0ID0gc2hhcGVWZWN0b3IueCAqIG5vcm1hbC54ICsgc2hhcGVWZWN0b3IueSAqIG5vcm1hbC55LFxuXHRcdFx0XHRcdHNoYXBlMkRvdFByb2R1Y3RTaWduID0gc2hhcGUyRG90UHJvZHVjdCA+PSAwO1xuXG5cdFx0XHRcdGlmICggc2hhcGUyRG90UHJvZHVjdFNpZ24gPT09IHNoYXBlMURvdFByb2R1Y3RTaWduIClcblx0XHRcdFx0XHRvcHBvc2l0ZVNpZGVzID0gZmFsc2U7XG5cblx0XHRcdFx0aWYgKCBzaGFwZTJEb3RQcm9kdWN0IDwgbWluIClcblx0XHRcdFx0XHRtaW4gPSBzaGFwZTJEb3RQcm9kdWN0O1xuXHRcdFx0XHRlbHNlIGlmICggc2hhcGUyRG90UHJvZHVjdCA+IG1heCApXG5cdFx0XHRcdFx0bWF4ID0gc2hhcGUyRG90UHJvZHVjdDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCBvcHBvc2l0ZVNpZGVzIClcblx0XHRcdHtcblx0XHRcdFx0c2VwYXJhdGluZ0F4aXMgPSB0cnVlO1xuXG5cdFx0XHRcdGlmICggaXNBTW92aW5nIClcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblxuXHRcdFx0dmFyIG92ZXJsYXA7XG5cdFx0XHRpZiAoIG1pbiA8IHNoYXBlMURvdFByb2R1Y3QgKVxuXHRcdFx0XHRvdmVybGFwID0gbWF4IC0gc2hhcGUxRG90UHJvZHVjdDtcblx0XHRcdGVsc2Vcblx0XHRcdFx0b3ZlcmxhcCA9IG1heCAtIG1pbjtcblxuXHRcdFx0aWYgKCBvdmVybGFwIDwgbGVhc3RPdmVybGFwIClcblx0XHRcdHtcblx0XHRcdFx0bGVhc3RPdmVybGFwID0gb3ZlcmxhcDtcblx0XHRcdFx0bGVhc3RPdmVybGFwRWRnZSA9IGk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5lZGdlID0gbGVhc3RPdmVybGFwRWRnZTtcblx0XHR0aGlzLm92ZXJsYXAgPSBsZWFzdE92ZXJsYXA7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSIsImltcG9ydCBWZWN0b3IgZnJvbSAndXRpbC92ZWN0b3InO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCb3VuZGluZ0JveFxue1xuXHRjb25zdHJ1Y3RvciggdmVydGljZXMgPSBbXSwgYW5nbGUgPSAwLCB0cmFuc2Zvcm1fb3JpZ2luX3ggPSAwLCB0cmFuc2Zvcm1fb3JpZ2luX3kgPSAwIClcblx0e1xuXHRcdHRoaXMudmVydGljZXMgPSB2ZXJ0aWNlcztcblx0XHR0aGlzLmVkZ2VzID0gQXJyYXkoIHZlcnRpY2VzLmxlbmd0aCApO1xuXHRcdHRoaXMuYm91bmRzID0gQXJyYXkoIDIgKTtcblxuXHRcdHRoaXMucm90YXRlKCBhbmdsZSwgdHJhbnNmb3JtX29yaWdpbl94LCB0cmFuc2Zvcm1fb3JpZ2luX3kgKTtcblx0fVxuXG5cdC8vIFJvdGF0ZSBib3VuZGluZyBib3ggYXJvdW5kIG9yaWdpblxuXHRyb3RhdGUoIGRBbmdsZSA9IDAsIHRyYW5zZm9ybV9vcmlnaW5feCA9IDAsIHRyYW5zZm9ybV9vcmlnaW5feSA9IDAgKVxuXHR7XG5cdFx0bGV0IGNvcyA9IE1hdGguY29zKCBkQW5nbGUgKSxcblx0XHRcdHNpbiA9IE1hdGguc2luKCBkQW5nbGUgKSxcblx0XHRcdHJvdGF0aW9uX21hdHJpeF8yZCA9IFtcblx0XHRcdFx0WyBjb3MsIC1zaW4gXSxcblx0XHRcdFx0WyBzaW4sIGNvcyBdXG5cdFx0XHRdLFxuXHRcdFx0cG9zX2FycmF5ID0gQXJyYXkoIDIgKTtcblxuXHRcdGZvciAoIGxldCB2ZXJ0ZXggb2YgdGhpcy52ZXJ0aWNlcyApXG5cdFx0e1xuXHRcdFx0cG9zX2FycmF5WyAwIF0gPSB2ZXJ0ZXgueCAtIHRyYW5zZm9ybV9vcmlnaW5feDtcblx0XHRcdHBvc19hcnJheVsgMSBdID0gdmVydGV4LnkgLSB0cmFuc2Zvcm1fb3JpZ2luX3k7XG5cblx0XHRcdGxldCBuZXdfcG9zID0gdGhpcy5tdWx0aXBseV9tYXRyaWNlcyggcm90YXRpb25fbWF0cml4XzJkLCBwb3NfYXJyYXkgKTtcblxuXHRcdFx0dmVydGV4LnggPSBuZXdfcG9zWyAwIF1bIDAgXSArIHRyYW5zZm9ybV9vcmlnaW5feDtcblx0XHRcdHZlcnRleC55ID0gbmV3X3Bvc1sgMCBdWyAxIF0gKyB0cmFuc2Zvcm1fb3JpZ2luX3k7XG5cdFx0fVxuXG5cdFx0dGhpcy51cGRhdGVfZWRnZXMoKTtcblx0XHR0aGlzLnVwZGF0ZV9ib3VuZHMoKTtcblx0fVxuXG5cdC8vIFRyYW5zbGF0ZSBib3VuZGluZyBib3hcblx0dHJhbnNsYXRlKCBkWCA9IDAsIGRZID0gMCApXG5cdHtcblx0XHRmb3IgKCBsZXQgdmVydGV4IG9mIHRoaXMudmVydGljZXMgKVxuXHRcdHtcblx0XHRcdHZlcnRleC54ICs9IGRYO1xuXHRcdFx0dmVydGV4LnkgKz0gZFk7XG5cdFx0fVxuXG5cdFx0dGhpcy51cGRhdGVfZWRnZXMoKTtcblx0XHR0aGlzLnVwZGF0ZV9ib3VuZHMoKTtcblx0fVxuXG5cdC8vIENyZWF0ZXMgYSB2ZWN0b3IgZm9yIGVhY2ggZWRnZSBvZiB0aGUgc2hhcGVcblx0dXBkYXRlX2VkZ2VzKClcblx0e1xuXHRcdGxldCBudW1fdmVydGljZXMgPSB0aGlzLnZlcnRpY2VzLmxlbmd0aDtcblx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCBudW1fdmVydGljZXM7IGkrKyApXG5cdFx0e1xuXHRcdFx0bGV0IHZlcnRleCA9IHRoaXMudmVydGljZXNbIGkgXSxcblx0XHRcdFx0bmV4dF92ZXJ0ZXggPSAoIGkgPT09IG51bV92ZXJ0aWNlcyAtIDEgKSA/IHRoaXMudmVydGljZXNbIDAgXSA6IHRoaXMudmVydGljZXNbIGkgKyAxIF07XG5cblx0XHRcdHRoaXMuZWRnZXNbIGkgXSA9IG5leHRfdmVydGV4LnN1YnRyYWN0KCB2ZXJ0ZXggKTtcblx0XHR9XG5cdH1cblxuXHQvLyBGaW5kcyB0aGUgbWluaW11bSBhbmQgbWF4aW11bSB4IGFuZCB5IGNvb3JkaW5hdGVzIG9mIHRoZSBzaGFwZVxuXHR1cGRhdGVfYm91bmRzKClcblx0e1xuXHRcdC8vIEluY2x1ZGUgdGhlIGluZGV4IG9mIHRoZSBlZGdlIGJvdW5kYXJpZXNcblx0XHR2YXIgbG93ZXJCb3VuZCA9IHtcblx0XHRcdFx0eDogdGhpcy52ZXJ0aWNlc1sgMCBdLngsXG5cdFx0XHRcdHk6IHRoaXMudmVydGljZXNbIDAgXS55LFxuXHRcdFx0XHR4X2luZGV4OiAwLFxuXHRcdFx0XHR5X2luZGV4OiAwXG5cdFx0XHR9LFxuXHRcdFx0dXBwZXJCb3VuZCA9IHtcblx0XHRcdFx0eDogdGhpcy52ZXJ0aWNlc1sgMCBdLngsXG5cdFx0XHRcdHk6IHRoaXMudmVydGljZXNbIDAgXS55LFxuXHRcdFx0XHR4X2luZGV4OiAwLFxuXHRcdFx0XHR5X2luZGV4OiAwXG5cdFx0XHR9O1xuXG5cdFx0Zm9yICggdmFyIGkgPSAxOyBpIDwgNDsgaSsrIClcblx0XHR7XG5cdFx0XHR2YXIgY3VycmVudEJvdW5kID0gdGhpcy52ZXJ0aWNlc1sgaSBdO1xuXG5cdFx0XHRpZiAoIGN1cnJlbnRCb3VuZC54IDwgbG93ZXJCb3VuZC54IClcblx0XHRcdHtcblx0XHRcdFx0bG93ZXJCb3VuZC54X2luZGV4ID0gaTtcblx0XHRcdFx0bG93ZXJCb3VuZC54ID0gY3VycmVudEJvdW5kLng7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmICggY3VycmVudEJvdW5kLnggPiB1cHBlckJvdW5kLnggKVxuXHRcdFx0e1xuXHRcdFx0XHR1cHBlckJvdW5kLnhfaW5kZXggPSBpO1xuXHRcdFx0XHR1cHBlckJvdW5kLnggPSBjdXJyZW50Qm91bmQuYm91bmRYXG5cdFx0XHR9XG5cblx0XHRcdGlmICggY3VycmVudEJvdW5kLnkgPCBsb3dlckJvdW5kLnkgKVxuXHRcdFx0e1xuXHRcdFx0XHRsb3dlckJvdW5kLnlfaW5kZXggPSBpO1xuXHRcdFx0XHRsb3dlckJvdW5kLnkgPSBjdXJyZW50Qm91bmQueTtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKCBjdXJyZW50Qm91bmQueSA+IHVwcGVyQm91bmQueSApXG5cdFx0XHR7XG5cdFx0XHRcdHVwcGVyQm91bmQueV9pbmRleCA9IGk7XG5cdFx0XHRcdHVwcGVyQm91bmQueSA9IGN1cnJlbnRCb3VuZC55O1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuYm91bmRzWyAwIF0gPSBsb3dlckJvdW5kO1xuXHRcdHRoaXMuYm91bmRzWyAxIF0gPSB1cHBlckJvdW5kO1xuXHR9XG5cblx0Ly8gVXNlZCBmb3IgbWF0cml4IHJvdGF0aW9uXG5cdG11bHRpcGx5X21hdHJpY2VzKCBtYXRyaXhfYSA9IFtdLCBtYXRyaXhfYiA9IFtdIClcblx0e1xuXHRcdGlmICggbWF0cml4X2EubGVuZ3RoID09PSAwIHx8IG1hdHJpeF9iLmxlbmd0aCA9PT0gMCApXG5cdFx0XHRyZXR1cm4gW107XG5cblx0XHQvLyBOdW1iZXIgb2Ygcm93cyBpbiBtYXRyaXhfYVxuXHRcdGxldCBoZWlnaHQgPSBtYXRyaXhfYS5sZW5ndGg7XG5cblx0XHQvLyBOdW1iZXIgb2YgY29sdW1ucyBpbiBtYXRyaXhfYlxuXHRcdGxldCB3aWR0aCA9IG1hdHJpeF9iWyAwIF0ubGVuZ3RoO1xuXG5cdFx0Ly8gQ3JlYXRlIGFuIGVtcHR5IG1hdHJpeCB0byBzdG9yZSB0aGUgcmVzdWx0XG5cdFx0bGV0IG1hdHJpeCA9IEFycmF5KCBoZWlnaHQgKTtcblxuXHRcdC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHJvdyBvZiBtYXRyaXhfYVxuXHRcdGZvciAoIGxldCBhX3kgPSAwOyBhX3kgPCBoZWlnaHQ7IGFfeSsrIClcblx0XHR7XG5cdFx0XHRsZXQgYV9yb3cgPSBtYXRyaXhfYVsgYV95IF07XG5cdFx0XHRtYXRyaXhbIGFfeSBdID0gQXJyYXkoIHdpZHRoICk7XG5cblx0XHRcdC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIGNvbHVtbiBvZiBtYXRyaXhfYlxuXHRcdFx0Zm9yICggbGV0IGJfeCA9IDA7IGJfeCA8IHdpZHRoOyBiX3grKyApXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBjZWxsID0gMDtcblxuXHRcdFx0XHQvLyBJdGVyYXRlIHRocm91Z2ggdGhlIGJpZ2dlciBvZiB0aGUgd2lkdGggb2YgbWF0cml4X2Egb3IgaGVpZ2h0IG9mIG1hdHJpeF9iXG5cdFx0XHRcdGZvciAoIGxldCBpID0gMDsgaSA8IE1hdGgubWF4KCBhX3Jvdy5sZW5ndGgsIG1hdHJpeF9iLmxlbmd0aCApOyBpKysgKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y2VsbCArPSBhX3Jvd1sgaSBdICogbWF0cml4X2JbIGkgXVsgYl94IF07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRtYXRyaXhbIGFfeSBdLnB1c2goIGNlbGwgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gbWF0cml4O1xuXHR9XG59IiwiaW1wb3J0IEVudGl0eSBmcm9tICdlbnRpdHkvZW50aXR5JztcblxuY29uc3QgTUFYX0JPVU5DRVMgPSAxO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCdWxsZXQgZXh0ZW5kcyBFbnRpdHlcbntcblx0Y29uc3RydWN0b3IoIHgsIHksIGFuZ2xlLCBzcGVlZCA9IC0zLCBwX2lkID0gJycgKVxuXHR7XG5cdFx0c3VwZXIoIHgsIHksIDUsIDIuNSwgYW5nbGUgKTtcblxuXHRcdHRoaXMucF9pZCA9IHBfaWQ7XG5cdFx0dGhpcy5udW1fYm91bmNlcyA9IDA7XG5cblx0XHR0aGlzLnNldF9zcGVlZCggc3BlZWQgKTtcblx0fVxuXG5cdGJvdW5jZSggZWRnZSApXG5cdHtcblx0XHR0aGlzLm51bV9ib3VuY2VzKys7XG5cblx0XHRpZiAoIHRoaXMubnVtX2JvdW5jZXMgPj0gTUFYX0JPVU5DRVMgKVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cblx0XHRpZiAoIGVkZ2UueCA9PT0gMCApXG5cdFx0e1xuXHRcdFx0aWYgKCB0aGlzLmFuZ2xlIDwgMCApXG5cdFx0XHRcdHRoaXMudHVybl90byggLU1hdGguUEkgLSB0aGlzLmFuZ2xlICk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHRoaXMudHVybl90byggTWF0aC5QSSAtIHRoaXMuYW5nbGUgKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdHRoaXMudHVybl90byggLXRoaXMuYW5nbGUgKTtcblx0XHR9XG5cdH1cblxuXHRyZXNldCgpXG5cdHtcblx0XHR0aGlzLnBfaWQgPSAnJztcblx0XHR0aGlzLm51bV9ib3VuY2VzID0gMDtcblx0fVxufSIsImltcG9ydCBVdGlsIGZyb20gJ3V0aWwvdXRpbCc7XG5pbXBvcnQgVmVjdG9yIGZyb20gJ3V0aWwvdmVjdG9yJztcbmltcG9ydCBCb3VuZGluZ0JveCBmcm9tICdlbnRpdHkvYm91bmRpbmdfYm94JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRW50aXR5XG57XG5cdGNvbnN0cnVjdG9yKCB4ID0gMCwgeSA9IDAsIHdpZHRoID0gMCwgaGVpZ2h0ID0gMCwgYW5nbGUgPSAwLCB0cmFuc2Zvcm1fb3JpZ2luX3ggPSAwLjUsIHRyYW5zZm9ybV9vcmlnaW5feSA9IDAuNSApXG5cdHtcblx0XHR0aGlzLmlkID0gVXRpbC5nZW5lcmF0ZV9pZCgpO1xuXG5cdFx0dGhpcy5wb3MgPSBuZXcgVmVjdG9yKCB4LCB5ICk7XG5cdFx0dGhpcy5uZXh0UG9zID0gbmV3IFZlY3RvcigpO1xuXHRcdHRoaXMubGFzdFBvcyA9IG5ldyBWZWN0b3IoKTtcblx0XHR0aGlzLnZlbG9jaXR5ID0gbmV3IFZlY3RvcigpO1xuXG5cdFx0dGhpcy53aWR0aCA9IHdpZHRoO1xuXHRcdHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXHRcdHRoaXMucmFkaXVzID0gTWF0aC5oeXBvdCggdGhpcy5oYWxmV2lkdGgsIHRoaXMuaGFsZkhlaWdodCApO1xuXG5cdFx0Ly8gQ2xvY2t3aXNlIGZyb20gMyBPJ2Nsb2NrXG5cdFx0dGhpcy5hbmdsZSA9IGFuZ2xlO1xuXHRcdHRoaXMubmV4dF9hbmdsZSA9IDA7XG5cdFx0dGhpcy5hbmdsZV9jb3MgPSBNYXRoLmNvcyggYW5nbGUgKTtcblx0XHR0aGlzLmFuZ2xlX3NpbiA9IE1hdGguc2luKCBhbmdsZSApO1xuXHRcdHRoaXMuYW5ndWxhcl92ZWxvY2l0eSA9IDA7XG5cblx0XHR0aGlzLnRyYW5zZm9ybV9vcmlnaW4gPSBuZXcgVmVjdG9yKCB0cmFuc2Zvcm1fb3JpZ2luX3gsIHRyYW5zZm9ybV9vcmlnaW5feSApO1xuXHRcdHRoaXMuYm91bmRpbmdfYm94ID0gdGhpcy5jcmVhdGVfcmVjdGFuZ3VsYXJfYm91bmRpbmdfYm94KCk7XG5cdH1cblxuXHQvLyBDcmVhdGUgYSByZWN0YW5ndWxhciBib3VuZGluZyBib3hcblx0Y3JlYXRlX3JlY3Rhbmd1bGFyX2JvdW5kaW5nX2JveCgpXG5cdHtcblx0XHRsZXQgaGFsZl93aWR0aCA9IHRoaXMud2lkdGggLyAyLFxuXHRcdFx0aGFsZl9oZWlnaHQgPSB0aGlzLmhlaWdodCAvIDIsXG5cdFx0XHR2ZXJ0aWNlcyA9IFtcblx0XHRcdFx0bmV3IFZlY3RvciggdGhpcy5wb3MueCAtIGhhbGZfd2lkdGgsIHRoaXMucG9zLnkgKyBoYWxmX2hlaWdodCApLFxuXHRcdFx0XHRuZXcgVmVjdG9yKCB0aGlzLnBvcy54IC0gaGFsZl93aWR0aCwgdGhpcy5wb3MueSAtIGhhbGZfaGVpZ2h0ICksXG5cdFx0XHRcdG5ldyBWZWN0b3IoIHRoaXMucG9zLnggKyBoYWxmX3dpZHRoLCB0aGlzLnBvcy55IC0gaGFsZl9oZWlnaHQgKSxcblx0XHRcdFx0bmV3IFZlY3RvciggdGhpcy5wb3MueCArIGhhbGZfd2lkdGgsIHRoaXMucG9zLnkgKyBoYWxmX2hlaWdodCApXG5cdFx0XHRdLFxuXHRcdFx0dHJhbnNmb3JtX29yaWdpbl94ID0gdGhpcy53aWR0aCAqIHRoaXMudHJhbnNmb3JtX29yaWdpbi54ICsgdGhpcy5wb3MueCxcblx0XHRcdHRyYW5zZm9ybV9vcmlnaW5feSA9IHRoaXMuaGVpZ2h0ICogdGhpcy50cmFuc2Zvcm1fb3JpZ2luLnkgKyB0aGlzLnBvcy55O1xuXG5cdFx0cmV0dXJuIG5ldyBCb3VuZGluZ0JveCggdmVydGljZXMsIHRoaXMuYW5nbGUsIHRyYW5zZm9ybV9vcmlnaW5feCwgdHJhbnNmb3JtX29yaWdpbl95ICk7XG5cdH1cblxuXHRtb3ZlKCBkWCA9IDAsIGRZID0gMCApXG5cdHtcblxuXHRcdHRoaXMubW92ZVRvKCB0aGlzLnBvcy54ICsgZFgsIHRoaXMucG9zLnkgKyBkWSApO1xuXHR9XG5cblx0bW92ZV90byggeCA9IDAsIHkgPSAwIClcblx0e1xuXHRcdGxldCBkWCA9IHggLSB0aGlzLnBvcy54LFxuXHRcdFx0ZFkgPSB5IC0gdGhpcy5wb3MueTtcblxuXHRcdHRoaXMucG9zLnNldCggeCwgeSApO1xuXHRcdHRoaXMuYm91bmRpbmdfYm94LnRyYW5zbGF0ZSggZFgsIGRZICk7XG5cdH1cblxuXHR0dXJuKCBkQW5nbGUgPSAwIClcblx0e1xuXG5cdFx0dGhpcy50dXJuVG8oIHRoaXMuYW5nbGUgKyBkQW5nbGUgKTtcblx0fVxuXG5cdHR1cm5fdG8oIGFuZ2xlID0gMCApXG5cdHtcblx0XHRsZXQgZEFuZ2xlID0gdGhpcy5hbmdsZSAtIGFuZ2xlLFxuXHRcdFx0dHJhbnNmb3JtX29yaWdpbl94ID0gdGhpcy53aWR0aCAqIHRoaXMudHJhbnNmb3JtX29yaWdpbi54ICsgdGhpcy5wb3MueCxcblx0XHRcdHRyYW5zZm9ybV9vcmlnaW5feSA9IHRoaXMuaGVpZ2h0ICogdGhpcy50cmFuc2Zvcm1fb3JpZ2luLnkgKyB0aGlzLnBvcy55O1xuXG5cdFx0dGhpcy5hbmdsZSA9IGFuZ2xlO1xuXHRcdHRoaXMuYW5nbGVfY29zID0gTWF0aC5jb3MoIGFuZ2xlICk7XG5cdFx0dGhpcy5hbmdsZV9zaW4gPSBNYXRoLnNpbiggYW5nbGUgKTtcblxuXHRcdGlmICggTWF0aC5hYnMoIHRoaXMuYW5nbGUgKSA+PSA2LjI4MzE4NSApXG5cdFx0XHRyZXR1cm4gdGhpcy50dXJuX3RvKCB0aGlzLmFuZ2xlICUgNi4yODMxODUgKTtcblxuXHRcdC8vIENoYW5nZSBkaXJlY3Rpb24gb2YgdmVsb2NpdHlcblx0XHRpZiAoIHRoaXMudmVsb2NpdHkubGVuZ3RoID4gMCApXG5cdFx0XHR0aGlzLnNldFZlbG9jaXR5KCB0aGlzLnNwZWVkICk7XG5cblx0XHR0aGlzLmJvdW5kaW5nX2JveC5yb3RhdGUoIGRBbmdsZSwgdHJhbnNmb3JtX29yaWdpbl94LCB0cmFuc2Zvcm1fb3JpZ2luX3kgKTtcblx0fVxuXG5cdHNldF9zcGVlZCggc3BlZWQgPSAwIClcblx0e1xuXHRcdHRoaXMuc3BlZWQgPSBzcGVlZDtcblx0XHR0aGlzLnZlbG9jaXR5LnNldCggc3BlZWQgKiB0aGlzLmFuZ2xlX2Nvcywgc3BlZWQgKiB0aGlzLmFuZ2xlX3NpbiApO1xuXHR9XG5cblx0c2V0X3R1cm5fc3BlZWQoIHNwZWVkID0gMCApXG5cdHtcblxuXHRcdHRoaXMuYW5ndWxhcl92ZWxvY2l0eSA9IHNwZWVkO1xuXHR9XG59IiwiaW1wb3J0IEVudGl0eSBmcm9tICdlbnRpdHkvZW50aXR5JztcblxuY29uc3QgREVGQVVMVF9TSVpFID0gNTtcbmNvbnN0IENPVU5URE9XTl9USUNLUyA9IDEwO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFeHBsb3Npb24gZXh0ZW5kcyBFbnRpdHlcbntcblx0Y29uc3RydWN0b3IoIHgsIHksIHJhZGl1cyA9IERFRkFVTFRfU0laRSApXG5cdHtcblx0XHRzdXBlciggeCwgeSApO1xuXG5cdFx0dGhpcy5yYWRpdXMgPSByYWRpdXM7XG5cdFx0dGhpcy50aW1lX2xlZnQgPSBDT1VOVERPV05fVElDS1M7XG5cdH1cblxuXHRjb3VudF9kb3duKCBudW1fdGlja3MgKVxuXHR7XG5cdFx0aWYgKCB0aGlzLnRpbWVfbGVmdCA8PSAxIClcblx0XHRcdHJldHVybiB0cnVlO1xuXG5cdFx0dGhpcy50aW1lX2xlZnQgLT0gbnVtX3RpY2tzO1xuXHR9XG5cblx0cmVzZXQoKVxuXHR7XG5cdFx0dGhpcy50aW1lX2xlZnQgPSBDT1VOVERPV05fVElDS1M7XG5cdH1cbn0iLCJpbXBvcnQgRW50aXR5IGZyb20gJ2VudGl0eS9lbnRpdHknO1xuXG5jb25zdCBDT1VOVERPV05fVElDS1MgPSA2MCAqIDEwO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNaW5lIGV4dGVuZHMgRW50aXR5XG57XG5cdGNvbnN0cnVjdG9yKCB4LCB5LCBwX2lkID0gJycsIHRpbWVfbGVmdCA9IENPVU5URE9XTl9USUNLUyApXG5cdHtcblx0XHRzdXBlciggeCwgeSApO1xuXG5cdFx0dGhpcy5wX2lkID0gcF9pZDtcblx0XHR0aGlzLnRpbWVfbGVmdCA9IENPVU5URE9XTl9USUNLUztcblx0fVxuXG5cdGNvdW50X2Rvd24oIG51bV90aWNrcyApXG5cdHtcblx0XHRpZiAoIHRoaXMudGltZV9sZWZ0IDw9IDEgKVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cblx0XHR0aGlzLnRpbWVfbGVmdCAtPSBudW1fdGlja3M7XG5cdH1cblxuXHRyZXNldCgpXG5cdHtcblx0XHR0aGlzLnRpbWVfbGVmdCA9IENPVU5URE9XTl9USUNLUztcblx0fVxufSIsImltcG9ydCBWZWN0b3IgZnJvbSAndXRpbC92ZWN0b3InO1xuaW1wb3J0IEVudGl0eSBmcm9tICdlbnRpdHkvZW50aXR5JztcbmltcG9ydCBCdWxsZXQgZnJvbSAnZW50aXR5L2J1bGxldCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRhbmsgZXh0ZW5kcyBFbnRpdHlcbntcblx0Y29uc3RydWN0b3IoIGlkID0gJycsIHggPSAwLCB5ID0gMCwgYW5nbGUgPSAwIClcblx0e1xuXHRcdHN1cGVyKCB4LCB5LCA1MCwgMjUsIGFuZ2xlICk7XG5cblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy5uYW1lID0gJ1Rhbmt5Jztcblx0XHR0aGlzLnNjb3JlID0gMDtcblx0XHR0aGlzLmxhc3RfYnVsbGV0X3RpY2sgPSAwO1xuXHRcdHRoaXMubWluZXMgPSBbXTtcblx0XHR0aGlzLmJ1bGxldHMgPSBbXTtcblx0XHR0aGlzLmJhcnJlbCA9IG5ldyBFbnRpdHkoIHgsIHksIDUwLCA1LCAwLCAwLCAwLjUgKTtcblx0fVxuXG5cdG1vdmUoIHgsIHkgKVxuXHR7XG5cdFx0c3VwZXIubW92ZSggeCwgeSApO1xuXHRcdHRoaXMuYmFycmVsLm1vdmUoIHgsIHkgKTtcblx0fVxuXG5cdG1vdmVfdG8oIHgsIHkgKVxuXHR7XG5cdFx0c3VwZXIubW92ZV90byggeCwgeSApO1xuXHRcdHRoaXMuYmFycmVsLm1vdmVfdG8oIHgsIHkgKTtcblx0fVxuXG5cdHR1cm5fYmFycmVsKCB4LCB5LCBjYW1lcmFfb2Zmc2V0X3gsIGNhbWVyYV9vZmZzZXRfeSApXG5cdHtcblx0XHR0aGlzLnR1cm5fdG8oIE1hdGguYXRhbjIoIHRoaXMuYmFycmVsLnBvcy55IC0geSAtIGNhbWVyYV9vZmZzZXRfeSwgdGhpcy5iYXJyZWwucG9zLnggLSB4IC0gY2FtZXJhX29mZnNldF94ICkgKTtcblx0fVxuXG5cdHR1cm5fYmFycmVsX3RvKCBhbmdsZSApXG5cdHtcblx0XHR0aGlzLmJhcnJlbC50dXJuX3RvKCBhbmdsZSApO1xuXHR9XG5cblx0dHJhbnNsYXRlQWxvbmdXYWxsKCBlZGdlIClcblx0e1xuXHRcdC8vIE1vdmUgYnkgdGhlIHZlbG9jaXR5IHByb2plY3RlZCBvbnRvIHRoZSB1bml0IHZlY3RvciBcblx0XHR2YXIgZG90UHJvZHVjdCA9IHRoaXMudmVsb2NpdHkueCAqIGVkZ2UueCArIHRoaXMudmVsb2NpdHkueSAqIGVkZ2UueTtcblx0XHR0aGlzLm1vdmVQb3MoIGRvdFByb2R1Y3QgKiBlZGdlLngsIGRvdFByb2R1Y3QgKiBlZGdlLnkgKTtcblx0fVxuXG5cdHRyYW5zbGF0ZUFsb25nUGxheWVyKCBlZGdlVW5pdFZlY3RvciApXG5cdHtcblx0XHR2YXIgZG90UHJvZHVjdCA9IHRoaXMudmVsb2NpdHkueCAqIGVkZ2VVbml0VmVjdG9yLnggKyB0aGlzLnZlbG9jaXR5LnkgKiBlZGdlVW5pdFZlY3Rvci55O1xuXHRcdHRoaXMubW92ZVBvcyggZG90UHJvZHVjdCAqIGVkZ2VVbml0VmVjdG9yLngsIGRvdFByb2R1Y3QgKiBlZGdlVW5pdFZlY3Rvci55ICk7XG5cdH1cblxuXHRyb3RhdGVBbG9uZ1dhbGwoIGVkZ2UsIG92ZXJsYXAgKVxuXHR7XG5cdFx0dmFyIGRpc3BsYWNlbWVudFZlY3RvciA9IHtcblx0XHRcdHg6IG92ZXJsYXAgKiBlZGdlLnksXG5cdFx0XHR5OiBvdmVybGFwICogZWRnZS54XG5cdFx0fTtcblxuXHRcdGlmICggZWRnZS54IDwgMCApXG5cdFx0XHRkaXNwbGFjZW1lbnRWZWN0b3IueSA9IC1kaXNwbGFjZW1lbnRWZWN0b3IueTtcblxuXHRcdGlmICggZWRnZS55IDwgMCApXG5cdFx0XHRkaXNwbGFjZW1lbnRWZWN0b3IueCA9IC1kaXNwbGFjZW1lbnRWZWN0b3IueDtcblxuXHRcdHRoaXMubW92ZVBvcyggZGlzcGxhY2VtZW50VmVjdG9yLngsIGRpc3BsYWNlbWVudFZlY3Rvci55ICk7XG5cdH1cblxuXHQvLyBDYW5jZWwgdmVsb2NpdHkgaW4gdGhlIGRpcmVjdGlvbiBvZiB0aGUgb3RoZXIgcGxheWVyJ3MgY29sbGlkaW5nIGVkZ2Vcblx0cm90YXRlQWxvbmdQbGF5ZXIoIGVkZ2VVbml0VmVjdG9yIClcblx0e1xuXHRcdHZhciB0YW5nZW50aWFsVmVsb2NpdHkgPSB0aGlzLnJhZGl1cyAqIHRoaXMucm90YXRpb24uc3BlZWQ7XG5cdFx0dGhpcy5tb3ZlUG9zKCB0YW5nZW50aWFsVmVsb2NpdHkgKiBlZGdlVW5pdFZlY3Rvci54LCB0YW5nZW50aWFsVmVsb2NpdHkgKiBlZGdlVW5pdFZlY3Rvci55ICk7XG5cdH1cblxuXHQvLyBGaXJlIGEgcHJvamVjdGlsZSBmcm9tIHRoZSBlbmQgb2YgYmFycmVsIGFuZCByZXR1cm4gdGhlIHJlZmVyZW5jZVxuXHRzaG9vdCgpXG5cdHtcblx0XHR0aGlzLmJhcnJlbC5yb3RhdGVCb3VuZGluZ0JveCgpO1xuXG5cdFx0Ly8gU2V0IHRoZSBwcm9qZWN0aWxlIHN0YXJ0aW5nIHBvc2l0aW9uIHRvIHRoZSBtaWRkbGUgb2YgdGhlIGJhcnJlbCB0aXBcblx0XHR2YXIgcHJvamVjdGlsZVBvcyA9IG5ldyBWZWN0b3IoIHRoaXMuYmFycmVsLmJvdW5kaW5nQm94WyAyIF0ueCwgdGhpcy5iYXJyZWwuYm91bmRpbmdCb3hbIDIgXS55ICk7XG5cdFx0Ly8gcHJvamVjdGlsZVBvcy5hZGQoIC10aGlzLmJhcnJlbC5ib3VuZGluZ0JveFsgMiBdLngsIC10aGlzLmJhcnJlbC5ib3VuZGluZ0JveFsgMiBdLnkgKTtcblx0XHQvLyBwcm9qZWN0aWxlUG9zLmRpdmlkZSggMiApO1xuXHRcdC8vIHByb2plY3RpbGVQb3MuYWRkKCB0aGlzLmJhcnJlbC5ib3VuZGluZ0JveFsgMyBdLngsIHRoaXMuYmFycmVsLmJvdW5kaW5nQm94WyAzIF0ueSApO1xuXG5cdFx0dmFyIHByb2plY3RpbGUgPSBuZXcgUHJvamVjdGlsZSggdGhpcy5pZCwgcHJvamVjdGlsZVBvcy54LCBwcm9qZWN0aWxlUG9zLnksIHRoaXMuYmFycmVsLmFuZ2xlICk7XG5cdFx0dGhpcy5wcm9qZWN0aWxlcy5wdXNoKCBwcm9qZWN0aWxlICk7XG5cblx0XHRyZXR1cm4gcHJvamVjdGlsZTtcblx0fVxuXG5cdC8vIFJldHVybnMgdHJ1ZSBpZiB0aGVyZSBpcyBhIGNvbGxpc2lvbiBiZXR3ZWVuIHRoaXMgdGFuayBhbmQgYSB0YW5rIGZyb20gcGxheWVyc1xuXHRpc1BsYXllckNvbGxpc2lvbiggcGxheWVyIClcblx0e1xuXHRcdC8vIERvbid0IGNoZWNrIHRoaXMgdGFuayB3aXRoIGl0c2VsZlxuXHRcdGlmICggcGxheWVyLmlkID09PSB0aGlzLmlkIClcblx0XHR7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gUmV0dXJuIGlmIGEgY29sbGlzaW9uIGlzIGZvdW5kXG5cdFx0dmFyIGVkZ2VVbml0VmVjdG9yID0gdGhpcy5pc1JvdGF0ZWRSZWN0YW5nbGVDb2xsaXNpb24oIHBsYXllciApO1xuXHRcdGlmICggZWRnZVVuaXRWZWN0b3IgKVxuXHRcdHtcblx0XHRcdHJldHVybiBlZGdlVW5pdFZlY3Rvcjtcblx0XHR9XG5cdH1cblxuXHRyZXNldCgpXG5cdHtcblx0XHR0aGlzLm5hbWUgPSAnVGFua3knO1xuXHRcdHRoaXMuc2NvcmUgPSAwO1xuXHRcdHRoaXMubGFzdFNob3RUaWNrID0gMDtcblx0XHR0aGlzLmJ1bGxldHMubGVuZ3RoID0gMDtcblx0XHR0aGlzLm1pbmVzLmxlbmd0aCA9IDA7XG5cdH1cbn0iLCJpbXBvcnQgRW50aXR5IGZyb20gJ2VudGl0eS9lbnRpdHknO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBXYWxsIGV4dGVuZHMgRW50aXR5XG57fSIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIEV2ZW50XG57XG5cdGNvbnN0cnVjdG9yKClcblx0e1xuXHRcdHRoaXMuc3Vic2NyaWJlcnMgPSBbXTtcblx0fVxuXG5cdGRpc3BhdGNoKClcblx0e1xuXHRcdGZvciAoIGZ1bmMgb2YgdGhpcy5zdWJzY3JpYmVycyApXG5cdFx0e1xuXHRcdFx0ZnVuYygpO1xuXHRcdH1cblx0fVxuXG5cdGxpc3RlbiggZnVuYyApXG5cdHtcblx0XHR0aGlzLnN1YnNjcmliZXJzLnB1c2goIGZ1bmMgKTtcblx0fVxufSIsImltcG9ydCBHYW1lTWFwIGZyb20gJy4vZ2FtZV9tYXAnO1xuaW1wb3J0IEV4cGxvc2lvbiBmcm9tICdlbnRpdHkvZXhwbG9zaW9uJztcbmltcG9ydCBDb2xsaXNpb24gZnJvbSAnY29sbGlzaW9uL2NvbGxpc2lvbic7XG5pbXBvcnQgT2JqZWN0UG9vbCBmcm9tICd1dGlsL29iamVjdF9wb29sJztcbmltcG9ydCBFdmVudCBmcm9tICdldmVudC9ldmVudCc7XG5cbnJlcXVpcmUuY2FjaGUgPSB7fTtcblxuY29uc29sZS5sb2coIEV2ZW50ICk7XG5jb25zb2xlLmxvZyggSlNPTi5zdHJpbmdpZnkoIEV2ZW50LnByb3RvdHlwZSApICk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdhbWVcbntcblx0Y29uc3RydWN0b3IoKVxuXHR7XG5cdFx0dGhpcy5nYW1lX21hcCA9IG5ldyBHYW1lTWFwKCk7XG5cblx0XHR0aGlzLmNvbGxpc2lvbl9wb29sID0gbmV3IE9iamVjdFBvb2woIDMsIENvbGxpc2lvbiApO1xuXHRcdHRoaXMuZXhwbG9zaW9uX3Bvb2wgPSBuZXcgT2JqZWN0UG9vbCggMTAsIEV4cGxvc2lvbiApO1xuXHRcdGNvbnNvbGUubG9nKCBcIkJZRUhJXCIgKTtcblx0XHRjb25zb2xlLmxvZyggSlNPTi5zdHJpbmdpZnkoIEV2ZW50ICkgKVxuXHRcdFx0Ly8gRXZlbnQubGlzdGVuKCAncGxheScsIGZ1bmN0aW9uICgpXG5cdFx0XHQvLyB7XG5cdFx0XHQvLyBcdGNvbnNvbGUubG9nKCAndGVzdCcgKTtcblx0XHRcdC8vIH0gKTtcblx0fVxuXG5cdHVwZGF0ZSggZHQgKVxuXHR7XG5cdFx0dGhpcy51cGRhdGVfdGFua3MoIGR0ICk7XG5cdFx0dGhpcy51cGRhdGVfYnVsbGV0cyggZHQgKTtcblx0XHR0aGlzLnVwZGF0ZV9taW5lcyggZHQgKTtcblx0XHR0aGlzLnVwZGF0ZV9leHBsb3Npb25zKCBkdCApO1xuXHR9XG5cblx0dXBkYXRlX3RhbmtzKCBkdCApXG5cdHtcblx0XHRsZXQgY29sbGlzaW9uID0gY29sbGlzaW9uX3Bvb2wuZ2V0KCk7XG5cblx0XHRmb3IgKCBsZXQgWyBpZCwgdGFuayBdIGluIGdhbWVfbWFwLnRhbmtzIClcblx0XHR7XG5cdFx0XHRpZiAoIHRhbmsucm90YXRpb24uc3BlZWQgIT09IDAgKVxuXHRcdFx0e1xuXHRcdFx0XHR0YW5rLnR1cm4oIHRhbmsucm90YXRpb24uc3BlZWQgKiBkdCApO1xuXG5cdFx0XHRcdGZvciAoIGxldCBbIGlkLCB3YWxsIF0gb2YgbWFwLndhbGxzIClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmICggY29sbGlzaW9uLmlzX2NvbGxpZGluZyggdGFuaywgd2FsbCApIClcblx0XHRcdFx0XHRcdHBsYXllci5yb3RhdGVBbG9uZ1dhbGwoIGNvbGxpc2lvbi5lZGdlLCBjb2xsaXNpb24ub3ZlcmxhcCApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Zm9yICggbGV0IFsgaWQsIGNvbGxpc2lvbl90YW5rIF0gb2YgbWFwLnRhbmtzIClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmICggY29sbGlzaW9uLmlzX2NvbGxpZGluZyggdGFuaywgY29sbGlzaW9uX3RhbmsgKSApXG5cdFx0XHRcdFx0XHRwbGF5ZXIucm90YXRlQWxvbmdQbGF5ZXIoIGNvbGxpc2lvbi5lZGdlLnVuaXRfdmVjdG9yKCkgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIHBsYXllci52ZWxvY2l0eS5sZW5ndGggIT09IDAgKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgdmVsb2NpdHkgPSBwbGF5ZXIudmVsb2NpdHkuY2xvbmUoKTtcblxuXHRcdFx0XHRmb3IgKCBsZXQgWyBpZCwgd2FsbCBdIG9mIG1hcC53YWxscyApXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoIGNvbGxpc2lvbi5pc19jb2xsaWRpbmcoIHRhbmssIHdhbGwgKSApXG5cdFx0XHRcdFx0XHR2ZWxvY2l0eS5wcm9qZWN0KCBjb2xsaXNpb24uZWRnZS51bml0X3ZlY3RvcigpICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmb3IgKCBsZXQgWyBpZCwgY29sbGlzaW9uX3RhbmsgXSBvZiBtYXAudGFua3MgKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKCBjb2xsaXNpb24uaXNfY29sbGlkaW5nKCB0YW5rLCBjb2xsaXNpb25fdGFuayApIClcblx0XHRcdFx0XHRcdHZlbG9jaXR5LnByb2plY3QoIGNvbGxpc2lvbi5lZGdlLnVuaXRfdmVjdG9yKCkgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHBsYXllci5tb3ZlKCB2ZWxvY2l0eS54ICogZHQsIHZlbG9jaXR5LnkgKiBkdCApO1xuXG5cdFx0XHRcdGlmICggaWQgPT09IGNvbnRyb2xsZXIuaWQgKVxuXHRcdFx0XHRcdGNvbnRyb2xsZXIuY2FtZXJhLm1vdmVUbyggcGxheWVyLnBvcy54LCBwbGF5ZXIucG9zLnksIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0ICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEVhc2UgdG93YXJkcyB0aGUgbmV4dCBwb3NpdGlvbiBmcm9tIHRoZSBzZXJ2ZXJcblx0XHRcdGlmICggcGxheWVyLm5leHRfcG9zLmxlbmd0aCgpID4gMCApXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBkWCA9IHBsYXllci5uZXh0X3Bvcy54LFxuXHRcdFx0XHRcdGRZID0gcGxheWVyLm5leHRfcG9zLnk7XG5cblx0XHRcdFx0aWYgKCBNYXRoLmFicyggcGxheWVyLm5leHRfcG9zLnggKSA+IDEgKVxuXHRcdFx0XHRcdGRYIC89IDEwO1xuXG5cdFx0XHRcdGlmICggTWF0aC5hYnMoIHBsYXllci5uZXh0X3Bvcy55ICkgPiAxIClcblx0XHRcdFx0XHRkWSAvPSAxMDtcblxuXHRcdFx0XHRwbGF5ZXIubmV4dF9wb3MuYWRkKCAtZFgsIC1kWSApO1xuXG5cdFx0XHRcdHBsYXllci5tb3ZlKCBkWCwgZFkgKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCBNYXRoLmFicyggcGxheWVyLnJvdGF0aW9uLm5leHRSYWQgKSA+IDAgKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgZEFuZ2xlID0gcGxheWVyLnJvdGF0aW9uLm5leHRSYWQ7XG5cblx0XHRcdFx0aWYgKCBNYXRoLmFicyggcGxheWVyLnJvdGF0aW9uLm5leHRSYWQgKSA+IDEgKVxuXHRcdFx0XHRcdGRBbmdsZSAvPSAyO1xuXG5cdFx0XHRcdHBsYXllci5yb3RhdGlvbi5uZXh0X2FuZ2xlIC09IGRBbmdsZTtcblxuXHRcdFx0XHRwbGF5ZXIudHVybiggZEFuZ2xlICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29sbGlzaW9uX3Bvb2wucmVsZWFzZSggY29sbGlzaW9uICk7XG5cdH1cblxuXHR1cGRhdGVfYnVsbGV0cyggZHQgKVxuXHR7XG5cdFx0bGV0IGNvbGxpc2lvbiA9IGNvbGxpc2lvbl9wb29sLmdldCgpO1xuXG5cdFx0Zm9yICggbGV0IFsgaWQsIGJ1bGxldCBdIG9mIG1hcC5idWxsZXRzIClcblx0XHR7XG5cdFx0XHRsZXQgdmVsb2NpdHlfeCA9IGJ1bGxldC52ZWxvY2l0eS54LFxuXHRcdFx0XHR2ZWxvY2l0eV95ID0gYnVsbGV0LnZlbG9jaXR5Lnk7XG5cblx0XHRcdC8vIENhbmNlbCBidWxsZXRzXG5cdFx0XHRmb3IgKCBsZXQgWyBpZCwgY29sbGlzaW9uX2J1bGxldCBdIG9mIG1hcC5idWxsZXRzIClcblx0XHRcdHtcblx0XHRcdFx0Y29sbGlzaW9uID0gYnVsbGV0LmlzUmVjdGFuZ2xlQ29sbGlzaW9uKCBjb2xsaXNpb25fYnVsbGV0ICk7XG5cblx0XHRcdFx0aWYgKCBjb2xsaXNpb24gKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bWFwLnJlbW92ZV9idWxsZXQoIGJ1bGxldCApO1xuXHRcdFx0XHRcdG1hcC5yZW1vdmVfYnVsbGV0KCBjb2xsaXNpb25fYnVsbGV0ICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gRXhwbG9kZSBtaW5lc1xuXHRcdFx0Zm9yICggbGV0IFsgaWQsIG1pbmUgXSBvZiBtYXAubWluZXMgKVxuXHRcdFx0e1xuXHRcdFx0XHRjb2xsaXNpb24gPSBidWxsZXQuaXNSZWN0YW5nbGVDb2xsaXNpb24oIG1pbmUgKTtcblxuXHRcdFx0XHRpZiAoIGNvbGxpc2lvbiApXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRtYXAucmVtb3ZlX2J1bGxldCggYnVsbGV0ICk7XG5cdFx0XHRcdFx0bWFwLnJlbW92ZV9taW5lKCBtaW5lICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gQm91bmNlIG9mZiB3YWxsc1xuXHRcdFx0Zm9yICggbGV0IFsgaWQsIHdhbGwgXSBvZiBtYXAud2FsbHMgKVxuXHRcdFx0e1xuXHRcdFx0XHRjb2xsaXNpb24gPSBidWxsZXQuaXNSZWN0YW5nbGVDb2xsaXNpb24oIHdhbGwgKTtcblxuXHRcdFx0XHRpZiAoIGNvbGxpc2lvbiApXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRidWxsZXQuYm91bmNlKCBjb2xsaXNpb24uZWRnZSApO1xuXG5cdFx0XHRcdFx0dmVsb2NpdHlfeCA9IGJ1bGxldC52ZWxvY2l0eS54O1xuXHRcdFx0XHRcdHZlbG9jaXR5X3kgPSBidWxsZXQudmVsb2NpdHkueTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRidWxsZXQubW92ZSggdmVsb2NpdHlfeCAqIGR0LCB2ZWxvY2l0eV95ICogZHQgKTtcblx0XHR9XG5cblx0XHRjb2xsaXNpb25fcG9vbC5yZWxlYXNlKCBjb2xsaXNpb24gKTtcblx0fVxuXG5cdHVwZGF0ZV9taW5lcyggZHQgKVxuXHR7XG5cdFx0Zm9yICggdmFyIFsgaWQsIG1pbmUgXSBvZiBtYXAubWluZXMgKVxuXHRcdHtcblx0XHRcdGlmICggbWluZS5jb3VudF9kb3duKCBkdCApIClcblx0XHRcdHtcblx0XHRcdFx0bWFwLnJlbW92ZV9taW5lKCBtaW5lICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0dXBkYXRlX2V4cGxvc2lvbnMoIGR0IClcblx0e1xuXHRcdGZvciAoIHZhciBbIGlkLCBleHBsb3Npb24gXSBvZiBtYXAuZXhwbG9zaW9ucyApXG5cdFx0e1xuXHRcdFx0aWYgKCBleHBsb3Npb24uY291bnRfZG93biggZHQgKSApXG5cdFx0XHR7XG5cdFx0XHRcdG1hcC5yZW1vdmVfZXhwbG9zaW9uKCBleHBsb3Npb24gKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn0iLCJpbXBvcnQgVmVjdG9yIGZyb20gJ3V0aWwvdmVjdG9yJztcbmltcG9ydCBUYW5rIGZyb20gJ2VudGl0eS90YW5rJztcbmltcG9ydCBCdWxsZXQgZnJvbSAnZW50aXR5L2J1bGxldCc7XG5pbXBvcnQgTWluZSBmcm9tICdlbnRpdHkvbWluZSc7XG5pbXBvcnQgV2FsbCBmcm9tICdlbnRpdHkvd2FsbCc7XG5pbXBvcnQgRXhwbG9zaW9uIGZyb20gJ2VudGl0eS9leHBsb3Npb24nO1xuaW1wb3J0IE9iamVjdFBvb2wgZnJvbSAndXRpbC9vYmplY3RfcG9vbCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdhbWVNYXBcbntcblx0Y29uc3RydWN0b3IoIHdpZHRoLCBoZWlnaHQgKVxuXHR7XG5cdFx0dGhpcy50aWNrID0gMDtcblxuXHRcdHRoaXMud2lkdGggPSB3aWR0aDtcblx0XHR0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuXHRcdHRoaXMudGFua19wb29sID0gbmV3IE9iamVjdFBvb2woIDEwLCBUYW5rICk7XG5cdFx0dGhpcy5idWxsZXRfcG9vbCA9IG5ldyBPYmplY3RQb29sKCAyMCwgQnVsbGV0ICk7XG5cdFx0dGhpcy5taW5lX3Bvb2wgPSBuZXcgT2JqZWN0UG9vbCggMTAsIE1pbmUgKTtcblx0XHR0aGlzLndhbGxfcG9vbCA9IG5ldyBPYmplY3RQb29sKCA1MCwgV2FsbCApO1xuXHRcdHRoaXMuZXhwbG9zaW9uX3Bvb2wgPSBuZXcgT2JqZWN0UG9vbCggMTAsIEV4cGxvc2lvbiApO1xuXG5cdFx0dGhpcy50YW5rcyA9IG5ldyBNYXAoKTtcblx0XHR0aGlzLmJ1bGxldHMgPSBuZXcgTWFwKCk7XG5cdFx0dGhpcy5taW5lcyA9IG5ldyBNYXAoKTtcblx0XHR0aGlzLndhbGxzID0gbmV3IE1hcCgpO1xuXHRcdHRoaXMuZXhwbG9zaW9ucyA9IG5ldyBNYXAoKTtcblx0fVxuXG5cdGFkZF90YW5rKCBpZCwgeCwgeSwgYW5nbGUgKVxuXHR7XG5cdFx0aWYgKCB0aGlzLnRhbmtzLmhhcyggaWQgKSApXG5cdFx0XHRyZXR1cm47XG5cblx0XHRsZXQgdGFuayA9IHRoaXMudGFua19wb29sLmdldCgpO1xuXHRcdHRhbmsubW92ZV90byggeCwgeSApO1xuXHRcdHRhbmsudHVybl90byggYW5nbGUgKTtcblxuXHRcdHRoaXMudGFua3Muc2V0KCB0YW5rLmlkLCB0YW5rICk7XG5cblx0XHRyZXR1cm4gdGFuaztcblx0fVxuXG5cdGFkZF9idWxsZXQoIHgsIHksIGFuZ2xlLCBwX2lkIClcblx0e1xuXHRcdGxldCBidWxsZXQgPSB0aGlzLmJ1bGxldF9wb29sLmdldCgpO1xuXHRcdGJ1bGxldC5wX2lkID0gcF9pZDtcblx0XHRidWxsZXQubW92ZV90byggeCwgeSApO1xuXG5cdFx0dGhpcy5idWxsZXRzLnNldCggcHJvamVjdGlsZS5pZCwgcHJvamVjdGlsZSApO1xuXG5cdFx0cmV0dXJuIHByb2plY3RpbGU7XG5cdH1cblxuXHRhZGRfbWluZSggeCwgeSwgcF9pZCApXG5cdHtcblx0XHRsZXQgbWluZSA9IHRoaXMubWluZV9wb29sLmdldCgpO1xuXHRcdG1pbmUucF9pZCA9IHBfaWQ7XG5cdFx0bWluZS5tb3ZlX3RvKCB4LCB5ICk7XG5cblx0XHR0aGlzLm1pbmVzLnNldCggbWluZS5pZCwgbWluZSApO1xuXG5cdFx0cmV0dXJuIG1pbmU7XG5cdH1cblxuXHRhZGRfd2FsbCggeCwgeSwgd2lkdGgsIGhlaWdodCApXG5cdHtcblx0XHRsZXQgd2FsbCA9IHRoaXMud2FsbF9wb29sLmdldCgpO1xuXHRcdHdhbGwubW92ZV90byggeCwgeSApO1xuXG5cdFx0dGhpcy53YWxscy5zZXQoIHdhbGwuaWQsIHdhbGwgKTtcblxuXHRcdHJldHVybiB3YWxsO1xuXHR9XG5cblx0YWRkX2V4cGxvc2lvbiggeCwgeSwgcmFkaXVzIClcblx0e1xuXHRcdGxldCBleHBsb3Npb24gPSB0aGlzLmV4cGxvc2lvbl9wb29sLmdldCgpO1xuXHRcdGV4cGxvc2lvbi5yYWRpdXMgPSByYWRpdXM7XG5cdFx0ZXhwbG9zaW9uLm1vdmVfdG8oIHgsIHkgKTtcblxuXHRcdHRoaXMuZXhwbG9zaW9ucy5zZXQoIGV4cGxvc2lvbi5pZCwgZXhwbG9zaW9uICk7XG5cblx0XHRyZXR1cm4gZXhwbG9zaW9uO1xuXHR9XG5cblx0cmVtb3ZlX3RhbmsoIGlkIClcblx0e1xuXHRcdGxldCB0YW5rID0gdGhpcy50YW5rcy5nZXQoIGlkICk7XG5cblx0XHR0YW5rX3Bvb2wucmVsZWFzZSggdGFuayApO1xuXHRcdHRoaXMudGFua3MuZGVsZXRlKCBpZCApO1xuXHR9O1xuXG5cdHJlbW92ZV9idWxsZXQoIGlkIClcblx0e1xuXHRcdGxldCBidWxsZXQgPSB0aGlzLmJ1bGxldHMuZ2V0KCBpZCApO1xuXG5cdFx0YnVsbGV0X3Bvb2wucmVsZWFzZSggYnVsbGV0ICk7XG5cdFx0dGhpcy5wcm9qZWN0aWxlcy5kZWxldGUoIGlkICk7XG5cdH1cblxuXHRyZW1vdmVfbWluZSggaWQgKVxuXHR7XG5cdFx0bGV0IG1pbmUgPSB0aGlzLm1pbmVzLmdldCggaWQgKTtcblxuXHRcdG1pbmVfcG9vbC5yZWxlYXNlKCBtaW5lICk7XG5cdFx0dGhpcy5taW5lcy5kZWxldGUoIGlkICk7XG5cdH1cblxuXHRyZW1vdmVfd2FsbCggaWQgKVxuXHR7XG5cdFx0bGV0IHdhbGwgPSB0aGlzLm1pbmVzLmdldCggaWQgKTtcblxuXHRcdHdhbGxfcG9vbC5yZWxlYXNlKCB3YWxsICk7XG5cdFx0dGhpcy53YWxscy5kZWxldGUoIGlkICk7XG5cdH1cblxuXHRyZW1vdmVfZXhwbG9zaW9uKCBpZCApXG5cdHtcblx0XHRsZXQgZXhwbG9zaW9uID0gdGhpcy5leHBsb3Npb25zLmdldCggaWQgKTtcblxuXHRcdGV4cGxvc2lvbl9wb29sLnJlbGVhc2UoIGV4cGxvc2lvbiApO1xuXHRcdHRoaXMuZXhwbG9zaW9ucy5kZWxldGUoIGV4cGxvc2lvbiApO1xuXHR9XG5cbn0iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBPYmplY3RQb29sXG57XG5cdGNvbnN0cnVjdG9yKCBzaXplID0gMTAwLCBvYmogPSBPYmplY3QgKVxuXHR7XG5cdFx0dGhpcy5vYmogPSBvYmo7XG5cdFx0dGhpcy5wb29sID0gQXJyYXkoIHNpemUgKTtcblxuXHRcdGZvciAoIGxldCBpID0gMDsgaSA8IHNpemU7IGkrKyApXG5cdFx0XHR0aGlzLnBvb2xbIGkgXSA9IG5ldyBvYmooKTtcblx0fVxuXG5cdC8vIEFkZCBhIG5ldyBvYmplY3QgdG8gdGhlIHBvb2xcblx0c3Bhd24oKVxuXHR7XG5cdFx0dGhpcy5wb29sLnB1c2goIG5ldyB0aGlzLm9iaigpICk7XG5cdH1cblxuXHQvLyBUYWtlIGFuIG9iamVjdCBmcm9tIHRoZSBwb29sXG5cdGdldCgpXG5cdHtcblx0XHRpZiAoIHRoaXMucG9vbC5sZW5ndGggPT09IDAgKVxuXHRcdFx0dGhpcy5zcGF3bigpO1xuXG5cdFx0cmV0dXJuIHRoaXMucG9vbC5wb3AoKTtcblx0fVxuXG5cdC8vIFB1dCBvYmplY3QgYmFjayBpbiBwb29sIGFuZCByZXNldCBpdCBpZiB0aGUgb2JqZWN0J3MgcmVzZXQoKSBpcyBkZWZpbmVkXG5cdHJlbGVhc2UoIG9iaiApXG5cdHtcblx0XHRpZiAoIHR5cGVvZiBvYmogIT09IHR5cGVvZiB0aGlzLm9iaiApXG5cdFx0XHRyZXR1cm47XG5cblx0XHRpZiAoIHR5cGVvZiBvYmoucmVzZXQgPT09ICdmdW5jdGlvbicgKVxuXHRcdFx0b2JqLnJlc2V0KCk7XG5cblx0XHR0aGlzLnBvb2wucHVzaCggb2JqICk7XG5cdH1cbn0iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBVdGlsXG57XG5cdHN0YXRpYyB0aW1lc3RhbXAoKVxuXHR7XG5cdFx0aWYgKCB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJlxuXHRcdFx0dHlwZW9mIHdpbmRvdy5wZXJmb3JtYW5jZSAhPT0gJ3VuZGVmaW5lZCcgJiZcblx0XHRcdHR5cGVvZiB3aW5kb3cucGVyZm9ybWFuY2Uubm93ICE9PSAndW5kZWZpbmVkJyApXG5cdFx0XHRyZXR1cm4gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuXG5cdFx0cmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHR9XG5cblx0c3RhdGljIGdlbmVyYXRlX2lkKClcblx0e1xuXHRcdHJldHVybiBNYXRoLnJhbmRvbSgpO1xuXHR9XG5cblx0Ly8gRWZmaWNpZW50IGFwcHJveGltYXRpb24gZm9yIHRoZSBzcXVhcmUgcm9vdCBvZiBhIGFuZCBiXG5cdHN0YXRpYyBzcXJ0X2FwcHJveGltYXRpb24oIGEsIGIgKVxuXHR7XG5cdFx0cmV0dXJuIDQxNDIgKiBNYXRoLmFicyggYSApIC8gMTAwMDAgKyBNYXRoLmFicyggYiApO1xuXHR9XG59XG5cbk1hdGguc2lnbiA9IE1hdGguc2lnbiB8fCBmdW5jdGlvbiAoIHggKVxue1xuXHR4ID0gK3g7IC8vIGNvbnZlcnQgdG8gYSBudW1iZXJcblx0aWYgKCB4ID09PSAwIHx8IGlzTmFOKCB4ICkgKVxuXHR7XG5cdFx0cmV0dXJuIHg7XG5cdH1cblx0cmV0dXJuIHggPiAwID8gMSA6IC0xO1xufVxuXG5NYXRoLnJvdW5kID0gZnVuY3Rpb24gKCBudW0gKVxue1xuXHRyZXR1cm4gKCAwLjUgKyBudW0gKSA8PCAwO1xufTsiLCJpbXBvcnQgVXRpbCBmcm9tICd1dGlsL3V0aWwnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWZWN0b3Jcbntcblx0Y29uc3RydWN0b3IoIHggPSAwLCB5ID0gMCApXG5cdHtcblx0XHR0aGlzLnggPSB4O1xuXHRcdHRoaXMueSA9IHk7XG5cdFx0dGhpcy5sZW5ndGggPSBNYXRoLmh5cG90KCB0aGlzLngsIHRoaXMueSApO1xuXHR9XG5cblx0Ly8gU2V0IHRoZSBhcmd1bWVudHMgdG8gaXRzIGNvcnJlc3BvbmRpbmcgYXhpcyBvZiB0aGlzIHZlY3RvclxuXHRzZXQoIHggPSAwLCB5ID0gMCApXG5cdHtcblx0XHR0aGlzLnggPSB4O1xuXHRcdHRoaXMueSA9IHk7XG5cdFx0dGhpcy5sZW5ndGggPSBNYXRoLmh5cG90KCB0aGlzLngsIHRoaXMueSApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0Ly8gQWRkIHRoZSBhcmd1bWVudHMgdG8gaXRzIGNvcnJlc3BvbmRpbmcgYXhpcyBvZiB0aGlzIHZlY3RvclxuXHRhZGQoIHggPSAwLCB5ID0gMCApXG5cdHtcblx0XHR0aGlzLnggKz0geDtcblx0XHR0aGlzLnkgKz0geTtcblx0XHR0aGlzLmxlbmd0aCA9IE1hdGguaHlwb3QoIHRoaXMueCwgdGhpcy55ICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvLyBEaXZpZGUgZWFjaCBheGlzIG9mIHRoaXMgdmVjdG9yIGJ5IHRoZSBkaXZpc29yXG5cdGRpdmlkZSggZGl2aXNvciApXG5cdHtcblx0XHR0aGlzLnggLz0gZGl2aXNvcjtcblx0XHR0aGlzLnkgLz0gZGl2aXNvcjtcblx0XHR0aGlzLmxlbmd0aCA9IE1hdGguaHlwb3QoIHRoaXMueCwgdGhpcy55ICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvLyBNdWx0aXBseSBlYWNoIGF4aXMgb2YgdGhpcyB2ZWN0b3IgYnkgdGhlIG11bHRpcGxlXG5cdG11bHRpcGx5KCBtdWx0aXBsZSApXG5cdHtcblx0XHR0aGlzLnggKj0gbXVsdGlwbGU7XG5cdFx0dGhpcy55ICo9IG11bHRpcGxlO1xuXHRcdHRoaXMubGVuZ3RoID0gTWF0aC5oeXBvdCggdGhpcy54LCB0aGlzLnkgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8vIFByb2plY3QgdGhpcyB2ZWN0b3Igb250byB0aGUgdmVjdG9yIGFyZ3VtZW50XG5cdHByb2plY3QoIHZlY3RvciApXG5cdHtcblx0XHR2YXIgZG90UHJvZHVjdCA9IHRoaXMuZG90UHJvZHVjdCggdmVjdG9yICk7XG5cblx0XHR0aGlzLnggPSBkb3RQcm9kdWN0ICogdmVjdG9yLng7XG5cdFx0dGhpcy55ID0gZG90UHJvZHVjdCAqIHZlY3Rvci55O1xuXHRcdHRoaXMubGVuZ3RoID0gTWF0aC5oeXBvdCggdGhpcy54LCB0aGlzLnkgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8vIFJldHVybnMgaWYgdGhpcyB2ZWN0b3IgaXMgemVyb1xuXHRpc1plcm8oKVxuXHR7XG5cblx0XHRyZXR1cm4gdGhpcy54ID09PSAwICYmIHRoaXMueSA9PT0gMDtcblx0fTtcblxuXG5cdC8qIEZ1bmN0aW9ucyBiZWxvdyByZXR1cm4gdGhlIHJlc3VsdCByYXRoZXIgdGhhbiBtb2RpZnkgY29udGVudHMgb2YgdGhpcyB2ZWN0b3IgKi9cblxuXG5cdC8vIFJldHVybiB0aGUgdW5pdCB2ZWN0b3Igb2YgdGhpcyB2ZWN0b3Jcblx0dW5pdFZlY3RvcigpXG5cdHtcblx0XHR2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGgoKSxcblx0XHRcdHggPSB0aGlzLnggPyBNYXRoLnNpZ24oIHRoaXMueCApICogTWF0aC5wb3coIHRoaXMueCwgMiApIC8gbGVuZ3RoIDogMCxcblx0XHRcdHkgPSB0aGlzLnkgPyBNYXRoLnNpZ24oIHRoaXMueSApICogTWF0aC5wb3coIHRoaXMueSwgMiApIC8gbGVuZ3RoIDogMDtcblxuXHRcdHJldHVybiBuZXcgVmVjdG9yKCB4LCB5ICk7XG5cdH07XG5cblx0Ly8gUmV0dXJuIGEgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIGRpZmZlcmVuY2Ugb2YgZWFjaCBheGlzXG5cdGRpZmYoIHZlY3RvciApXG5cdHtcblxuXHRcdHJldHVybiBuZXcgVmVjdG9yKCB0aGlzLnggLSB2ZWN0b3IueCwgdGhpcy55IC0gdmVjdG9yLnkgKTtcblx0fTtcblxuXHQvLyBSZXR1cm4gYSB2ZWN0b3IgY29udGFpbmluZyB0aGUgZGlmZmVyZW5jZSBvZiBlYWNoIGF4aXNcblx0c3VidHJhY3QoIHZlY3RvciApXG5cdHtcblxuXHRcdHJldHVybiBuZXcgVmVjdG9yKCB0aGlzLnggLSB2ZWN0b3IueCwgdGhpcy55IC0gdmVjdG9yLnkgKTtcblx0fTtcblxuXHQvLyBSZXR1cm4gdGhlIGRvdCBwcm9kdWN0IG9mIHRoZSB0d28gdmVjdG9yc1xuXHRkb3RQcm9kdWN0KCB2ZWN0b3IgKVxuXHR7XG5cblx0XHRyZXR1cm4gdGhpcy54ICogdmVjdG9yLnggKyB0aGlzLnkgKiB2ZWN0b3IueTtcblx0fTtcblxuXHQvLyBSZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIHZlY3RvciAoIG5vdGUgdGhpcyBpcyB0aGUgbGVuZ3RoIF4gMiApXG5cdGdldExlbmd0aCgpXG5cdHtcblxuXHRcdHJldHVybiBNYXRoLnBvdyggdGhpcy54LCAyICkgKyBNYXRoLnBvdyggdGhpcy55LCAyICk7XG5cdH07XG5cblx0Ly8gUmV0dXJuIGEgY29weSBvZiB0aGlzIHZlY3RvclxuXHRjbG9uZSgpXG5cdHtcblxuXHRcdHJldHVybiBuZXcgVmVjdG9yKCB0aGlzLngsIHRoaXMueSApO1xuXHR9O1xuXG5cdC8vIFJldHVybnMgYW4gb2JqZWN0IGNvbnRhaW5pbmcgZWFjaCBub24temVybyBheGlzXG5cdHRvT2JqZWN0KClcblx0e1xuXHRcdHZhciB2ZWN0b3JPYmplY3QgPSB7XG5cdFx0XHR4OiB0aGlzLngsXG5cdFx0XHR5OiB0aGlzLnlcblx0XHR9O1xuXG5cdFx0cmV0dXJuIHZlY3Rvck9iamVjdDtcblx0fTtcblxuXHR0b1N0cmluZygpXG5cdHtcblx0XHRyZXR1cm4gJ3g6ICcgKyB0aGlzLnggKyAnIHk6ICcgKyB0aGlzLnk7XG5cdH07XG5cbn0iXX0=
