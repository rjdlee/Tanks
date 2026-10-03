var width = window.innerWidth,
  height = window.innerHeight,
  mainCanvas = document.getElementById('main-canvas'),
  terrainCanvas = document.getElementById('terrain-canvas');

mainCanvas.width = terrainCanvas.width = width;
mainCanvas.height = terrainCanvas.height = height;

var context = mainCanvas.getContext('2d'),
  terrainContext = terrainCanvas.getContext('2d'),

  map,

  name,
  user,
  connect;

terrainContext.fillStyle = '#F1F1F1';

function resizeCanvases() {
  width = window.innerWidth; height = window.innerHeight;
  var ratio = Math.min(window.devicePixelRatio || 1, 2);
  mainCanvas.width = terrainCanvas.width = Math.round(width * ratio);
  mainCanvas.height = terrainCanvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  terrainContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (user && map) {
    user.camera.resize(width, height);
    user.camera.translate(user.pos.x, user.pos.y, map.width, map.height);
    draw();
  }
}
if (typeof Art !== 'undefined') {
  resizeCanvases();
  window.addEventListener('resize', resizeCanvases);
}

function init() {
  if (typeof gameplay !== 'undefined') gameplay.start(document.querySelector('input[name="mode"]:checked').value,document.getElementById('menu-room').value.trim().toLowerCase());
  else if (!connect) connect = new Connect();
}

var animationId = null, lastFrame = null, accumulator = 0;
var tickDuration = 1000 / 60;

function startAnimation() {
  stopAnimation();
  animationId = requestAnimFrame(animate);
}

function stopAnimation() {
  if (animationId !== null) window.cancelAnimationFrame(animationId);
  animationId = null;
  lastFrame = null;
  accumulator = 0;
}

function animate(now) {
  if (!map || !user) return;
  if (lastFrame !== null) accumulator += Math.min(100, now - lastFrame);
  lastFrame = now;
  while (accumulator + 0.001 >= tickDuration) {
    if (typeof gameplay !== 'undefined') gameplay.tick();
    else map.tick();
    accumulator -= tickDuration;
  }
  if (typeof gameplay !== 'undefined') { gameplay.renderPeers(now);gameplay.hud(); }
  else renderRemotePlayers(now);
  draw();
  if (typeof gameplay !== 'undefined') gameplay.send();
  else connect.sendStateQueue();
  animationId = requestAnimFrame(animate);
}

// Main drawing function to display tanks
function draw() {
  if (!map || !user)
    return false;

  if (typeof Art !== 'undefined') {
    Art.draw(context, terrainContext, map, user, width, height);
    return;
  }

  context.clearRect(0, 0, width, height);
  context.beginPath();

  terrainContext.clearRect(0, 0, width, height);
  terrainContext.beginPath();

  map.draw(context, terrainContext, user.camera);

  terrainContext.fill();
  context.stroke();
}
