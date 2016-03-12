var autoprefixer = require( 'gulp-autoprefixer' );
var babel = require( 'gulp-babel' );
var cache = require( 'gulp-cache' );
var changed = require( 'gulp-changed' );
var gulp = require( 'gulp' );
var rollup = require( "rollup" );
var rollup_babel = require( 'rollup-plugin-babel' );
var server = require( 'gulp-develop-server' );
var multi_entry = require( 'rollup-plugin-multi-entry' );
var mocha = require( 'gulp-mocha' );

var paths = {
	src: 'src/',
	client: 'src/client/',
	common: 'src/common/',
	server: 'src/server/',
	assets: 'src/client/view/',
	node_modules: 'node_modules',
	build_client: 'build/client',
	build_client_styles: 'build/client/styles',
	build_client_assets: 'build/client/assets',
	build_server: 'build'
};

var files = {
	client: paths.build_client + '/client.js',
	server: paths.build_server + '/server_src.js'
};

gulp.task( 'watch', [ 'build', 'server_start' ], function ()
{
	gulp.watch( [ 'src/**/*.test.js' ], [ 'test' ] );
	gulp.watch( [ paths.common + '**/*.js' ], [ 'test', 'client_js', 'server_restart' ] );
	gulp.watch( [ paths.client + '**/*.js' ], [ 'test', 'client_js' ] );
	gulp.watch( [ paths.server + '**/*.js' ], [ 'test', 'server_restart' ] );
	gulp.watch( [ paths.assets + '**/*' ], [ 'client_assets' ] );
} );

gulp.task( 'build', [ 'test', 'client_js', 'client_assets', 'server_js' ] );

gulp.task( 'test', [ 'build_test' ], function ()
{
	return gulp.src( 'build/test/test.js',
		{
			read: false
		} )
		.pipe( mocha(
		{
			reporter: 'min'
		} ) );
} );

gulp.task( 'build_test', function ()
{
	return rollup.rollup(
	{
		entry: [ 'src/**/*.test.js' ],
		plugins: [ multi_entry.default(), rollup_babel() ]
	} ).then( function ( bundle )
	{
		bundle.write(
		{
			moduleName: 'Test',
			format: 'umd',
			sourceMap: 'inline',
			useStrict: 'true',
			dest: 'build/test/test.js'
		} );
	} );
} );

gulp.task( 'client_js', function ()
{
	// Move node modules so client can import them with <script> tags
	gulp.src( [ paths.node_modules + '/socket.io-client/socket.io.js',
			paths.node_modules + '/javascript-state-machine/state-machine.js'
		] )
		.pipe( changed( paths.build_client ) )
		.pipe( gulp.dest( paths.build_client ) );

	return rollup.rollup(
	{
		entry: 'src/client/main.js',
		external: [ 'javascript-state-machine' ],
		plugins: [ rollup_babel() ]
	} ).then( function ( bundle )
	{
		bundle.write(
		{
			format: 'umd',
			sourceMap: 'inline',
			useStrict: 'true',
			dest: paths.build_client + '/client.js',
			globals:
			{
				'javascript-state-machine': 'StateMachine'
			}
		} );
	} );
} );

gulp.task( 'client_assets', function ()
{
	// Client HTML files
	gulp.src( paths.html + '**/*.html' )
		.pipe( changed( paths.build_client ) )
		.pipe( gulp.dest( paths.build_client ) );

	// Client CSS files
	gulp.src( paths.css + '**/*.css' )
		.pipe( changed( paths.build_client_styles ) )
		.pipe( autoprefixer(
		{
			browsers: [ 'last 2 versions' ]
		} ) )
		.pipe( gulp.dest( paths.build_client_styles ) );

	// Client image files
	gulp.src( paths.assets + '**/*' )
		.pipe( changed( paths.build_client_assets ) )
		.pipe( cache( gulp.dest( paths.build_client_assets ) ) );

	// Client favicon
	return gulp.src( paths.assets + 'favicon.ico' )
		.pipe( changed( paths.build_client ) )
		.pipe( gulp.dest( paths.build_client ) );
} );

gulp.task( 'server_js', function ()
{
	return rollup.rollup(
	{
		entry: 'src/server/server.js',
		external: [ 'express', 'socket.io', 'javascript-state-machine' ],
		plugins: [ rollup_babel() ]
	} ).then( function ( bundle )
	{
		bundle.write(
		{
			moduleName: 'ServerConnect',
			format: 'umd',
			sourceMap: 'inline',
			useStrict: 'true',
			dest: paths.build_server + '/server.js',
			globals:
			{
				'express': 'express',
				'socket.io': 'socket.io',
				'javascript-state-machine': 'StateMachine'
			}
		} );
	} );
} );

gulp.task( 'server_start', [ 'server_js' ], function ()
{
	server.kill();
	server.listen(
	{
		path: paths.build_server + '/server.js'
	} );
} );

gulp.task( 'server_restart', [ 'server_js' ], function ()
{
	server.kill();
	setTimeout( function ()
	{
		// server.restart();
		server.listen(
		{
			path: paths.build_server + '/server.js'
		} );
	}, 2000 );
} );