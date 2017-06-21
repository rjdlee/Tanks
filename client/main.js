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
  connect = new Connect();
}

// Recursive function which will attempt to draw at 60fps
function animate() {
  dranimate();
    setInterval(function() {
        // draw();
        tick();
    }, 1000);
}

function dranimate() {
    requestAnimFrame(dranimate);
    draw();
}

// Main drawing function to display tanks
function draw() {
  if (!map || !user)
    return;

  context.clearRect(0, 0, width, height);
  context.beginPath();

  terrainContext.clearRect(0, 0, width, height);
  terrainContext.beginPath();

    map.draw(context, terrainContext, user.camera);

  terrainContext.fill();
  context.stroke();
}

function tick() {
    if (!map || !user)
        return;

    map.tick();

    // Send event data to the server
    connect.sendStateQueue();
}