var gulp = require( 'gulp' ),
	babel = require( 'gulp-babel' ),
	babelify = require( 'babelify' ),
	server = require( 'gulp-develop-server' ),
	source = require( 'vinyl-source-stream' ),
	changed = require( 'gulp-changed' ),
	sourcemaps = require( 'gulp-sourcemaps' ),
	browserify = require( 'browserify' ),
	autoprefixer = require( 'gulp-autoprefixer' ),
	watchify = require( 'watchify' ),
	cache = require( 'gulp-cache' );

var paths = {
	client: 'src/client/',
	common: 'src/node_modules/',
	server: 'src/server/',
	html: 'src/client/view/',
	css: 'src/client/view/css/',
	assets: 'src/client/view/assets/',
	node_modules: 'node_modules',
	build_client: 'build/client',
	build_server: 'build'
};

var files = {
	client: paths.build_client + '/client.js',
	server: paths.build_server + '/server_src.js'
}

gulp.task( 'watch', [ 'build', 'server:start' ], function ()
{
	var originalKeys = Object.keys( require.cache );
	gulp.watch( [ paths.common + '**/*.js', paths.client + '**/*.js' ], [ 'client:js' ] );
	gulp.watch( [ paths.html + '**/*.html' ], [ 'client:html' ] );
	gulp.watch( [ paths.css + '**/*.css' ], [ 'client:css' ] );
	gulp.watch( [ paths.assets + '**/*' ], [ 'client:assets' ] );
	gulp.watch( [ paths.common + '**/*.js', paths.server + '**/*.js' ], [ 'server:restart' ] );
} );

gulp.task( 'watch_client:js', function ()
{
	var bundle = browserify(
	{
		debug: true,
		entries: './src/client/main.js',
		cache:
		{},
		packageCache:
		{}
	} );

	bundle = watchify( bundle );
	bundle.transform( babelify.configure(
	{
		sourceMaps: true,
		stage: 0
	} ) );
	bundle.on( 'update', function ()
	{
		executeBundle( bundle );
	} );
	executeBundle( bundle );
} );

function executeBundle( bundle )
{
	var start = Date.now();
	bundle
		.bundle()
		.on( "error", function ( err )
		{
			console.log( "Error : " + err.message );
		} )
		.pipe( source( 'client.js' ) )
		.pipe( gulp.dest( paths.build_client ) )
		.on( 'time', function ( time )
		{
			console.log( 'Bundle finished in ' + time + '.' );
		} );
}

gulp.task( 'build', [ 'client:js', 'client:node_modules', 'client:html', 'client:css', 'client:assets', 'server:js' ] );

gulp.task( 'client:js', function ()
{
	browserify(
		{
			debug: true,
			cache:
			{},
			packageCache:
			{}
		} )
		.transform( babelify.configure(
		{
			sourceMaps: true,
			stage: 0
		} ) )
		.require( "./src/client/main.js",
		{
			entry: true
		} )
		.bundle()
		.pipe( source( 'client.js' ) )
		.pipe( gulp.dest( paths.build_client ) );
} );

gulp.task( 'client:node_modules', function ()
{
	return gulp.src( [ paths.node_modules + '/socket.io/node_modules/socket.io-client/socket.io.js' ] )
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
		.pipe( changed( paths.build_client ) )
		.pipe( autoprefixer(
		{
			browsers: [ 'last 2 versions' ]
		} ) )
		.pipe( gulp.dest( paths.build_client ) );
} );

gulp.task( 'client:assets', function ()
{
	gulp.src( paths.assets + '**/*' )
		.pipe( changed( paths.build_client ) )
		.pipe( cache( gulp.dest( paths.build_client ) ) );

	return gulp.src( paths.assets + 'favicon.ico' )
		.pipe( changed( paths.build_server ) )
		.pipe( gulp.dest( paths.build_server ) );
} );

gulp.task( 'server:js', function ()
{
	browserify(
		{
			debug: true
		} )
		.transform( babelify.configure(
		{
			sourceMaps: true,
			stage: 0
		} ) )
		.require( "./src/server/main.js",
		{
			entry: true
		} )
		.bundle()
		.pipe( source( 'server_src.js' ) )
		.pipe( gulp.dest( './build' ) );

	gulp.src( './src/server/server.js' )
		.pipe( gulp.dest( paths.build_server ) );
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