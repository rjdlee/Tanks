import ObjectPool from './objectPool.js'
var expect = require( 'chai' ).expect;

describe( 'ObjectPool', function ()
{
	let objectPool;

	beforeEach( 'Create a new object pool with size 2 and the Array object', function ()
	{
		objectPool = new ObjectPool( 2, Array );
	} );

	describe( '#ObjectPool()', function ()
	{
		describe( 'When called without arguments', function ()
		{
			it( 'Should create a pool with default settings', function ()
			{
				objectPool = new ObjectPool();

				expect( objectPool.obj ).to.be.a( 'function' );
				expect( objectPool.pool.length ).to.be.equal( 100 );
			} );
		} );

		describe( 'When called with size 2 and the Array object', function ()
		{
			it( 'Should create a pool with the arguments', function ()
			{
				expect( objectPool.obj ).to.be.a( 'function' );
				expect( objectPool.pool.length ).to.be.equal( 2 );
				expect( objectPool.pool[ 0 ] ).to.be.an( 'array' );
			} );
		} );
	} );

	describe( '#spawn()', function ()
	{
		describe( 'When called', function ()
		{
			it( 'Should add a new element to the pool', function ()
			{
				objectPool.spawn();

				expect( objectPool.pool.length ).to.be.equal( 3 );
			} );
		} );
	} );

	describe( '#get()', function ()
	{
		describe( 'When called', function ()
		{
			it( 'Should pop and return an element from the pool', function ()
			{
				let obj = objectPool.get();

				expect( objectPool.pool.length ).to.be.equal( 1 );
				expect( obj ).to.be.an( 'array' );
			} );
		} );

		describe( 'When called with an empty pool', function ()
		{
			it( 'Should pop and return an element from the pool', function ()
			{
				let obj;
				for ( var i = 0; i <= objectPool.pool.length; i++ )
				{
					obj = objectPool.get();
				}

				expect( objectPool.pool.length ).to.be.equal( 0 );
				expect( obj ).to.be.an( 'array' );
			} );
		} );
	} );

	describe( '#release()', function ()
	{
		describe( 'When called with an Array instance', function ()
		{
			it( 'Should return the element to the pool', function ()
			{
				let obj = new Array();
				objectPool.release( obj );

				expect( objectPool.pool.length ).to.be.equal( 3 );
			} );
		} );

		describe( 'When called with an Integer Instance', function ()
		{
			it( 'Should not do anything', function ()
			{
				let obj = 0;
				objectPool.release( obj );

				expect( objectPool.pool.length ).to.be.equal( 2 );
			} );
		} );

		describe( 'When called with an Array with a reset function', function ()
		{
			it( 'Should return the element to the pool after calling its reset function', function ( done )
			{
				let obj = new Array();
				obj.reset = function ()
				{
					// Test will timeout if reset function is not called
					done();
				};
				objectPool.release( obj );

				expect( objectPool.pool.length ).to.be.equal( 3 );
			} );
		} );
	} );
} );