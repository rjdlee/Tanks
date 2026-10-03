/*

The viewport for the active user, it shifts to center the tank in the screen

*/

function Camera(x, y, width, height) {
  this.pos = new Vector2(x, y);

  this.width = width;
  this.height = height;

  // Used to find boundaries since pos is in center
  this.resize(width, height);
}

Camera.prototype.resize = function(width, height) {
  this.screenWidth = width;
  this.screenHeight = height;
  this.scale = Math.max(.6, Math.min(1.8, Math.min(width / 1100, height / 650)));
  this.width = width / this.scale;
  this.height = height / this.scale;
  this.halfWidth = this.width / 2;
  this.halfHeight = this.height / 2;
};

// Move the camera to the position at x and y and recalculate its bounding box
Camera.prototype.translate = function(x, y, boundX, boundY) {
  this.offsetX = Math.max(0, (this.screenWidth - boundX * this.scale) / 2);
  this.offsetY = Math.max(0, (this.screenHeight - boundY * this.scale) / 2);
  this.pos.x = Math.min(Math.max(x - this.halfWidth, 0), Math.max(0, boundX - this.width));
  this.pos.y = Math.min(Math.max(y - this.halfHeight, 0), Math.max(0, boundY - this.height));
};
