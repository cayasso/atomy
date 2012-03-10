/*global config:true, task:true*/
config.init({
	pkg: '<json:package.json>',
	meta: {
		banner: '/*!\n'+
			' * <%= pkg.name %> - v<%= pkg.version %> - ' +
			' <%= template.today("m/d/yyyy") %>\n *\n' +
			' <%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
			' * Copyright (c) <%= template.today("yyyy") %> <%= pkg.author %>\n' +
			' * Dual licensed under the <%= _.pluck(pkg.licenses, "type").join(" and ") %> licenses.\n' +
			' * Credits: <%= _.pluck(pkg.contributors, "name").join(", ") %>\n' +
			' */'
	},
	concat: {
		'dist/atomy.js': ['<banner>', '<file_strip_banner:lib/atomy.js>']
	},
	min: {
		'dist/atomy.min.js': ['<banner>', 'dist/atomy.js']
	},
	lint: {
		files: ['grunt.js', 'lib/**/*.js']
	},
	watch: {
		files: '<config:lint.files>',
		tasks: 'lint test'
	},
	jshint: {
		options: {
			curly: true,
			eqeqeq: true,
			immed: true,
			latedef: true,
			newcap: true,
			noarg: true,
			sub: true,
			undef: true,
			boss: true,
			eqnull: true,
			expr: true
		}
	}
});

// Dev - default
task.registerTask('default', 'concat min');

// Release
task.registerTask('release', 'lint concat min');