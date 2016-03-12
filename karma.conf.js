module.exports = function ( config )
{
	config.set(
	{
		frameworks: [ 'mocha' ],
		reporters: [ 'spec' ],
		browsers: [ 'PhantomJS' ],
		files: [
			'build/test/test.js'
		]
	} );
};