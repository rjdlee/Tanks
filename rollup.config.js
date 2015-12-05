import babel from 'rollup-plugin-babel';

export default
{
	entry: 'src/server/main.js',
	dest: 'build/client/client.js',
	plugins: [ babel() ],
	sourcemap: 'inline',
	format: 'umd'
};