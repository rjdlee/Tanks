var gulp = require( 'gulp' );
var babel = require( 'gulp-babel' );
// var babelify = require( 'babelify' );
var server = require( 'gulp-develop-server' );
var source = require( 'vinyl-source-stream' );
var changed = require( 'gulp-changed' );
var sourcemaps = require( 'gulp-sourcemaps' );
var browserify = require( 'browserify' );
var autoprefixer = require( 'gulp-autoprefixer' );
var watchify = require( 'watchify' );
var cache = require( 'gulp-cache' );
var rollup = require( "rollup" );
var rollup_babel = require( "rollup-plugin-babel" );

var paths = {
	client: 'src/client/',
	common: 'src/common/',
	server: 'src/server/',
	html: 'src/client/view/',
	css: 'src/client/view/css/',
	assets: 'src/client/view/assets/',
	node_modules: 'node_modules',
	build_client: 'build/client',
	build_client_styles: 'build/client/styles',
	build_client_assets: 'build/client/assets',
	build_server: 'build'
};

var files = {
	client: paths.build_client + '/client.js',
	server: paths.build_server + '/server_src.js'
}

gulp.task( 'watch', [ 'build', 'server:start' ], function ()
{
	gulp.watch( [ paths.common + '**/*.js', paths.client + '**/*.js' ], [ 'client:js' ] );
	gulp.watch( [ paths.common + '**/*.js', paths.server + '**/*.js' ], [ 'server:restart' ] );
	gulp.watch( [ paths.html + '**/*.html' ], [ 'client:html' ] );
	gulp.watch( [ paths.css + '**/*.css' ], [ 'client:css' ] );
	gulp.watch( [ paths.assets + '**/*' ], [ 'client:assets' ] );
} );

gulp.task( 'build', [ 'client:js', 'client:node_modules', 'client:html', 'client:css', 'client:assets', 'server:js' ] );

gulp.task( 'client:js', function ()
{
	return rollup.rollup(
	{
		entry: 'src/client/main.js',
		plugins: [ rollup_babel() ]
	} ).then( function ( bundle )
	{
		bundle.write(
		{
			format: 'umd',
			sourceMap: 'inline',
			useStrict: 'true',
			dest: 'build/client/client.js'
		} );
	} );
} );

gulp.task( 'client:node_modules', function ()
{
	return gulp.src( [ paths.node_modules + '/socket.io/node_modules/socket.io-client/socket.io.js',
			paths.node_modules + '/javascript-state-machine/state-machine.js'
		] )
		.pipe( changed( paths.build_client ) )
		.pipe( gulp.dest( paths.build_client ) );
} );

gulp.task( 'client:html', function ()
{
	return gulp.src( paths.html + '**/*.html' )
		.pipe( changed( paths.build_client ) )
		.pipe( gulp.dest( paths.build_client ) );
} );

gulp.task( 'client:css', function ()
{
	return gulp.src( paths.css + '**/*.css' )
		.pipe( changed( paths.build_client_styles ) )
		.pipe( autoprefixer(
		{
			browsers: [ 'last 2 versions' ]
		} ) )
		.pipe( gulp.dest( paths.build_client_styles ) );
} );

gulp.task( 'client:assets', function ()
{
	gulp.src( paths.assets + '**/*' )
		.pipe( changed( paths.build_client_assets ) )
		.pipe( cache( gulp.dest( paths.build_client_assets ) ) );

	return gulp.src( paths.assets + 'favicon.ico' )
		.pipe( changed( paths.build_client ) )
		.pipe( gulp.dest( paths.build_client ) );
} );

gulp.task( 'server:js', function ()
{
	return rollup.rollup(
	{
		entry: 'src/server/server.js',
		plugins: [ rollup_babel() ]
	} ).then( function ( bundle )
	{
		bundle.write(
		{
			format: 'umd',
			sourceMap: 'inline',
			useStrict: 'true',
			dest: 'build/server.js'
		} );
	} );

	// gulp.src( './src/server/server.js' )
	// .pipe( gulp.dest( paths.build_server ) );
} );

gulp.task( 'server:start', [ 'server:js' ], function ()
{
	server.kill();
	server.listen(
	{
		path: paths.build_server + '/server.js'
	} );
} );

gulp.task( 'server:restart', [ 'server:js' ], function ()
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