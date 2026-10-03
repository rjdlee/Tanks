/*

A user input controlled player which uses keyboard and mouse events
Extends: Player

*/

function User(id, x, y, angle) {
  // Extend the Rectangle class
  Player.call(this, id, x, y, angle);

  this.camera;
  this.key = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  this.networkVelocity = {x: 0, y: 0};
  this.lastHeading = this.barrel.angle.rad;
  this.checkListeners();
}

User.prototype = Object.create(Player.prototype);
User.prototype.constructor = User;

User.prototype.addCamera = function(width, height) {
  this.camera = new Camera(this.pos.x, this.pos.y, width, height);
};

// Override player relative draw since we can't draw relative to ourself
User.prototype.tick = function(map) {
  var oldX = this.pos.x, oldY = this.pos.y;
  this.translate(map.width, map.height, map.walls, map.players);
  this.networkVelocity = {x: this.pos.x - oldX, y: this.pos.y - oldY};
  this.camera.translate(this.pos.x, this.pos.y, map.width, map.height);
  if (this.pos.x !== this.lastSentX || this.pos.y !== this.lastSentY ||
      this.angle.rad !== this.lastSentAngle || this.speed !== this.lastSentSpeed ||
      this.networkVelocity.x !== this.lastSentVelocityX || this.networkVelocity.y !== this.lastSentVelocityY) {
    connect.pushStateEvent('pos', this.pos);
    this.lastSentX = this.pos.x;
    this.lastSentY = this.pos.y;
    this.lastSentAngle = this.angle.rad;
    this.lastSentSpeed = this.speed;
    this.lastSentVelocityX = this.networkVelocity.x;
    this.lastSentVelocityY = this.networkVelocity.y;
  }
};

// Assign listeners for mousemove, mousedown, keydown, and keyup
User.prototype.checkListeners = function() {
  this.listeners = {
    mousemove: mouseMoveListener.bind(this), mousedown: leftClickListener.bind(this),
    contextmenu: rightClickListener.bind(this), keydown: keyDownListener.bind(this),
    keyup: keyUpListener.bind(this)
  };
  for (var type in this.listeners) document.addEventListener(type, this.listeners[type], false);
  this.blurListener = function() {
    this.key = {up: false, down: false, left: false, right: false};
    this.setVelocity(0);
    this.angle.speed = 0;
    this.networkVelocity = {x: 0, y: 0};
    connect.pushStateEvent('pos', this.pos);
    connect.sendStateQueue();
  }.bind(this);
  window.addEventListener('blur', this.blurListener);
};

User.prototype.dispose = function() {
  for (var type in this.listeners) document.removeEventListener(type, this.listeners[type], false);
  window.removeEventListener('blur', this.blurListener);
};

function mouseMoveListener(e) {
  var camera = this.camera;
  this.barrel.setPosAngle((e.clientX - (camera.offsetX || 0)) / (camera.scale || 1),
    (e.clientY - (camera.offsetY || 0)) / (camera.scale || 1), camera);

  // Only send the event if the change in angle is greater than 0.01
  if (Math.abs(this.barrel.angle.rad - this.lastHeading) > 0.01) {
    connect.pushStateEvent('mousemove', this.barrel.angle.rad);
  }

  this.lastHeading = this.barrel.angle.rad;
}

function leftClickListener(e) {
  if (inputBlocked(e) || (e.button !== undefined && e.button !== 0 && e.button !== 2)) return;

  // Determine if right click occurred
  // http://www.quirksmode.org/js/events_properties.html
  var rightclick;
  if (e.which) {
    rightclick = (e.which == 3);
  } else if (e.button) {
    rightclick = (e.button == 2);
  }

  if (rightclick) {
    connect.predictAction('mine');
  } else {
    connect.predictAction('shoot');
  }
}

function rightClickListener(e) {
  if (inputBlocked(e)) return;
  e.preventDefault();
  return false;
}

// If up is pressed before down, move forward. When up is released, move backwards if down is still pressed.
function keyDownListener(e) {
  if (inputBlocked(e)) return;
  if ([32, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 && e.preventDefault) e.preventDefault();
  if (e.keyCode === 32 && !e.repeat) connect.predictAction('mine');
  // Forward
  if (e.keyCode === 38 || e.keyCode === 87) {
    if (!this.key.down)
      this.setVelocity(1.5);

    this.key.up = true;
  }

  // Backward
  if (e.keyCode === 40 || e.keyCode === 83) {
    if (!this.key.up)
      this.setVelocity(-1.5);

    this.key.down = true;
  }

  // Left
  if (e.keyCode === 37 || e.keyCode === 65) {
    if (!this.key.right)
      this.angle.speed = -0.05;

    this.key.left = true;
  }

  // Right
  if (e.keyCode === 39 || e.keyCode === 68) {
    if (!this.key.left)
      this.angle.speed = 0.05;

    this.key.right = true;
  }
}

function inputBlocked(e) {
  if (e.target && e.target.closest && e.target.closest('button, input, dialog, #menu')) return true;
  var dialog = document.getElementById('help-dialog');
  return !!(dialog && dialog.open);
}

function keyUpListener(e) {
  // Forward
  if (e.keyCode === 38 || e.keyCode === 87) {
    this.key.up = false;

    if (this.key.down)
      this.setVelocity(-1.5);
    else
      this.setVelocity(0);
  }

  // Backward
  if (e.keyCode === 40 || e.keyCode === 83) {
    this.key.down = false;

    if (this.key.up)
      this.setVelocity(1.5);
    else
      this.setVelocity(0);
  }

  // Left
  if (e.keyCode === 37 || e.keyCode === 65) {
    this.key.left = false;

    if (this.key.right)
      this.angle.speed = 0.05;
    else
      this.angle.speed = 0;
  }

  // Right
  if (e.keyCode === 39 || e.keyCode === 68) {
    this.key.right = false;

    if (this.key.left)
      this.angle.speed = -0.05;
    else
      this.angle.speed = 0;
  }
}
