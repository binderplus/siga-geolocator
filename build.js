var NodeWebkitBuilder = require('node-webkit-builder');

// Read package.json
var package = require('./package.json')

// Find out which modules to include
var modules = []
if (!!package.dependencies) {
	modules = Object.keys(package.dependencies)
			.filter(function(m) { return m != 'nodewebkit' })
			.map(function(m) { return 'node_modules/'+m+'/**/*' })
}

// Build package
var nw = new NodeWebkitBuilder({
	files: [ 'package.json', 'app/**/*' ].concat(modules),
	version: '0.8.5',
	cacheDir: 'node_modules/node-webkit-builder/cache',
	plattforms: [ 'win' ]
})

nw.on('log', console.log)

nw.build(function(err) {
	if (!!err) return console.log(err)
	console.log('FINISHED')
})