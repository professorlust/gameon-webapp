'use strict';

// configuration hash is factored out for testing
var gruntConfig = {

  // Automatically inject Bower components into the app
  wiredep: {
    app: {
      src: ['public/index.html'],
      ignorePath:  /\.\.\//
    },
  },

  // Make sure code styles are up to par and there are no obvious mistakes
  jshint: {
    options: {
      jshintrc: '.jshintrc',
    },
    all: {
      src: [
        'Gruntfile.js',
        'karma.*.js',
        'public/scripts/{,*/}*.js'
      ]
    },
    test: {
      options: {
        jshintrc: 'test/.jshintrc'
      },
      src: ['test/spec/{,*/}*.js']
    }
  },

  // angular-aware html linting
  htmlangular: {
    options: {
      reportpath: null,
      reportCheckstylePath: null,
      tmplext: 'html',
      angular: true,
      customattrs: ['scroll-glue', 'marked'],
      customtags: ['profile-core']
    },
    files: {
      src: ['public/templates/*.html']
    }
  },

  // Empties folders to start fresh
  clean: {
    dist: {
      files: [{
        dot: true,
        src: [
          '.tmp',
          'build',
        ]
      }]
    },
    server: ['.tmp']
  },

  karma: {
    unit: {
      configFile: 'karma.conf.js',
      port: 9999,
      singleRun: true,
      browsers: ['PhantomJS'],
      logLevel: 'INFO'
    }
  }
};

module.exports = function (grunt) {
  gruntConfig.pkg = grunt.file.readJSON('package.json');

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-html-angular-validate');
  grunt.loadNpmTasks('grunt-wiredep');
  grunt.loadNpmTasks('grunt-karma');

  grunt.initConfig(gruntConfig);

  grunt.registerTask('build', ['clean','wiredep',
                               'jshint', 'htmlangular']);
  grunt.registerTask('default', ['build']);
  grunt.registerTask('test', ['jshint', 'htmlangular', 'karma']);

  return gruntConfig;
};