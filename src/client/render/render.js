import Camera from './camera';
import * as config from '../config';
import UI from '../ui/ui';
import Vector from '../../common/util/vector';

var wallTexture0 = new Image(),
	wallTexture1 = new Image(),
	floorTexture = new Image();

wallTexture0.src = 'assets/wall_1.gif';
wallTexture1.src = 'assets/wall_2.gif';
floorTexture.src = 'assets/floor_2.jpg';

class RenderClass
{
	constructor()
	{
		let windowWidth = window.innerWidth;
		let windowHeight = window.innerHeight;

		this.rendersPerTick = config.RENDERRATE / config.TICKRATE;
		this.renderCounter = 0;

		this.renderedWalls = false;
		this.camera = new Camera( 0, 0, windowWidth, windowHeight );
	}

	draw( gameMap )
	{
		if ( this.renderCounter === this.rendersPerTick )
		{
			for ( var [ id, tank ] of gameMap.tanks )
			{
				tank.interpVelocity.set( tank.pos.x - tank.prevPos.x, tank.pos.y - tank.prevPos.y );
				tank.interpVelocity.divide( this.rendersPerTick + 1 );

				tank.interpAngularVelocity = tank.angle - tank.prevAngle;
				tank.interpAngularVelocity /= ( this.rendersPerTick + 1 );

				tank.moveTo( tank.prevPos.x, tank.prevPos.y );
				tank.turnTo( tank.prevAngle, tank.prevAngle );
			}
			this.renderCounter = 0;
		}
		else
		{
			this.renderCounter++;
		}

		for ( var [ id, tank ] of gameMap.tanks )
		{
			let renderOffsetX = tank.interpVelocity.x * ( this.renderCounter );
			let renderOffsetY = tank.interpVelocity.y * ( this.renderCounter );
			let angleOffset = tank.interpAngularVelocity * ( this.renderCounter );

			tank.move( renderOffsetX, renderOffsetY );
			tank.turn( angleOffset );
		}

		let player = gameMap.controller.player;
		this.camera.moveTo( Math.round( player.pos.x ), Math.round( player.pos.y ), gameMap.width, gameMap.height );

		if ( !this.renderedWalls )
		{
			this.renderedWalls = true;
			// UI.resizeCanvases( gameMap.width, gameMap.height );
			// this.drawBackground( gameMap );
			// this.drawWalls( gameMap );
		}
		this.drawWalls( gameMap );
		this.drawTanks( gameMap.tanks );
		// this.drawBullets( gameMap.bullets );
		// this.drawMines( gameMap.mines );
		// this.drawExplosions( gameMap.explosions );
		// this.moveWalls();
	}

	drawTanks( tanks )
	{
		let tankContext = UI.contexts.get( 'tanks' );

		tankContext.clearRect( 0, 0, window.innerWidth, window.innerHeight );
		tankContext.beginPath();
		tankContext.fillStyle = '#666666';

		// Draw the tanks
		for ( var [ id, tank ] of tanks )
		{
			// console.log( tank.pos.x + renderOffsetX, tank.pos.y + renderOffsetY, tank.interpVelocity, this.renderCounter, this.rendersPerTick );
			this.drawPolygon( tank.boundingBox.vertices, tankContext );
		}

		tankContext.fill();
		tankContext.save();
		tankContext.beginPath();
		tankContext.fillStyle = '#333';

		for ( var [ id, tank ] of tanks )
		{
			this.drawPolygon( tank.barrel.boundingBox.vertices, tankContext );
		}

		tankContext.fill();
		tankContext.restore();
	}

	drawBullets( bullets )
	{
		let tankContext = UI.contexts.get( 'tanks' );

		tankContext.save();
		tankContext.beginPath();
		tankContext.fillStyle = '#666';

		for ( var [ id, bullet ] of bullets )
		{
			this.drawPolygon( bullet.boundingBox.vertices, tankContext );
		}

		tankContext.fill();
	}


	drawWalls( gameMap )
	{
		let walls = gameMap.walls;
		let wallContext = UI.contexts.get( 'walls' );

		// wallContext.save();
		wallContext.clearRect( 0, 0, window.innerWidth, window.innerHeight );
		wallContext.beginPath();
		wallContext.fillStyle = '#999';

		for ( var [ id, wall ] of walls )
		{
			this.drawPolygon( wall.boundingBox.vertices, wallContext, true );
		}

		wallContext.fill();
	}

	drawMines( mines )
	{
		let tankContext = UI.contexts.get( 'tanks' );

		tankContext.save();
		tankContext.beginPath();
		tankContext.strokeStyle = '#FF0000';

		for ( let [ id, mine ] of mines )
			this.drawCircle( mine.pos.x, mine.pos.y, mine.radius );

		tankContext.stroke();
		tankContext.restore();
	}

	drawExplosions( explosions )
	{
		let tankContext = UI.contexts.get( 'tanks' );

		tankContext.save();
		tankContext.beginPath();
		tankContext.fillStyle = '#FF0000';

		for ( let [ id, explosion ] of explosions )
			this.drawCircle( explosion.pos.x, explosion.pos.y, explosion.radius );

		tankContext.fill();
		tankContext.restore();
	}

	drawBackground( gameMap )
	{
		let wallContext = UI.contexts.get( 'walls' );
		for ( var y = 0; y < gameMap.height; y += 400 )
		{
			for ( var x = 0; x < gameMap.width; x += 602 )
			{
				wallContext.drawImage( floorTexture, x, y );
			}
		}
	}

	drawTexturedWalls( gameMap )
	{
		let walls = gameMap.walls;
		let wallContext = UI.contexts.get( 'walls' );

		for ( let [ id, wall ] of walls )
		{
			let pos = wall.boundingBox.vertices[ 2 ];

			if ( wall.width > wall.height )
			{
				for ( var i = 0; i < wall.width; i += 50 )
				{
					wallContext.drawImage( wallTexture0, Math.floor( pos.x + i ), Math.floor( pos.y ) );
				}
			}
			else
			{
				for ( var i = 0; i < wall.height; i += 50 )
				{
					if ( i + 50 < wall.height )
					{
						wallContext.drawImage( wallTexture1, Math.floor( pos.x ), Math.floor( pos.y + i ) );
						continue;
					}
					wallContext.drawImage( wallTexture0, Math.floor( pos.x ), Math.floor( pos.y + i ) );
				}
			}
		}

		wallContext.fill();
	}

	moveWalls( walls )
	{
		let wallCanvas = UI.canvases.get( 'walls' );

		wallCanvas.style.left = -this.camera.pos.x + 'px';
		wallCanvas.style.top = -this.camera.pos.y + 'px';
	}

	drawPolygon( boundingBox, context, cameraOffset = true )
	{
		let adjustedBoundingBox = [];

		for ( let i = 0; i < 4; i++ )
		{
			let adjustedX = boundingBox[ i ].x;
			let adjustedY = boundingBox[ i ].y;

			if ( cameraOffset )
			{
				adjustedX -= this.camera.pos.x;
				adjustedY -= this.camera.pos.y;
			}

			adjustedX = Math.round( adjustedX );
			adjustedY = Math.round( adjustedY );

			let adjustedVector = new Vector( adjustedX, adjustedY );
			adjustedBoundingBox.push( adjustedVector );
		}

		context.moveTo( adjustedBoundingBox[ 0 ].x, adjustedBoundingBox[ 0 ].y );
		for ( let vector of adjustedBoundingBox )
		{
			context.lineTo( vector.x, vector.y );
		}
		context.lineTo( adjustedBoundingBox[ 0 ].x, adjustedBoundingBox[ 0 ].y )
	}

	drawCircle( x, y, radius, context )
	{
		context.arc( x - this.camera.pos.x, y - this.camera.pos.y, radius, 0, 6.283185, false );
	}
}

let Render = new RenderClass();
export default Render;