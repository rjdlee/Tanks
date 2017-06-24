/*

A user who controls a

*/

var Tank = Tank || require('../common/tank');
module.exports = Player;

function Player( id, x, y, angle )
{
	// Extend the Rectangle class
	Tank.call( this, x, y, angle || 0 );

	this.id = id || Math.random();
	this.name = 'Tanky';
	this.score = 0;

	// Last time a projectile was fired
	this.lastShotTick = 0;
}

Player.prototype = Object.create( Tank.prototype );
Player.prototype.constructor = Player;

Player.prototype.tick = function ( map )
{
	// Translate and rotate the tank body with current speed and angular speed
	this.rotate( map.width, map.height, map.walls, map.players );
	this.translate( map.width, map.height, map.walls, map.players );
};

Player.prototype.draw = function ( context, camera )
{
	let offsetX = camera.pos.x;
	let offsetY = camera.pos.y;

    if(this.lastPos.x !== 0 && this.lastPos.y !== 0) {
        // const max_count = 60;
        // if(this.count == null) {
        //     this.count = 0;
        // } else if(this.count > max_count - 2) {
        //     this.count = 0;
        // } else {
        //     this.count += 1;
        // }
        // const positions = interpolatePoints(this.lastPos, this.pos, max_count);
        // const position = positions[this.count];
        // offsetX += -position.x;
        // offsetY += -position.y;
    }

	this.drawBoundingBox( context, offsetX, offsetY );
	this.barrel.drawBoundingBox( context, offsetX, offsetY );
};