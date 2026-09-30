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

function init() {
  if (!connect) connect = new Connect();
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
    map.tick();
    accumulator -= tickDuration;
  }
  renderRemotePlayers(now);
  draw();
  connect.sendStateQueue();
  animationId = requestAnimFrame(animate);
}

// Main drawing function to display tanks
function draw() {
  if (!map || !user)
    return false;

  context.clearRect(0, 0, width, height);
  context.beginPath();

  terrainContext.clearRect(0, 0, width, height);
  terrainContext.beginPath();

  map.draw(context, terrainContext, user.camera);

  terrainContext.fill();
  context.stroke();
}
