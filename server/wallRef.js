var Wall = require('../common/wall.js');

function WallRef(x, y, width, height) {
  this.ref = {
    pos: {
      x: x,
      y: y
    },

    width: width,
    height: height
  };

  // Extend the Rectangle class
  Wall.call(this, x, y, width, height);
}

WallRef.prototype = Object.create(Wall.prototype);
WallRef.prototype.constructor = WallRef;

module.exports = function(x, y, width, height) {
  return new WallRef(x, y, width, height);
};
