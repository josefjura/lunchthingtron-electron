'use strict';

var pathUtil = require('path');
var Q = require('q');
var gulp = require('gulp');
var gulpUtil = require('gulp-util');
var inject = require('gulp-inject');
var rollup = require('rollup');
var less = require('gulp-less');
var jetpack = require('fs-jetpack');
var replace = require('gulp-replace');
var tsc = require('gulp-typescript');

var utils = require('./utils');
var generateSpecsImportFile = require('./generate_specs_import');

var projectDir = jetpack;
var srcDir = projectDir.cwd('./app');
var destDir = projectDir.cwd('./build');

var paths = {
    copyFromAppDir: [
        './node_modules/**',
        './vendor/**',
        './**/*.html',
    // './pages/**/*.js',
    // './classes/**/*.js',
    // './services/**/*.js',
        './img/**/*'
    ],
    controllers: './build/pages/**/*-ctrl.js',
    services: './build/services/**/*.js',
    classes: './build/classes/**/*.js'
}

// -------------------------------------
// Tasks
// -------------------------------------

gulp.task('inject', ['clean', 'compile', 'copy'], function () {
    return gulp.src('./build/app.html')
        .pipe(inject(
            gulp.src(paths.controllers,
                { read: false }), { relative: true, name: 'controllers' }))
        .pipe(inject(
            gulp.src(paths.services,
                { read: false }), { relative: true, name: 'services' }))
        .pipe(inject(
            gulp.src(paths.classes,
                { read: false }), { relative: true, name: 'classes' }))
        .pipe(gulp.dest('./build'));
})


gulp.task('clean', function (callback) {
    return destDir.dirAsync('.', { empty: true });
});


var copyTask = function () {
    return projectDir.copyAsync('app', destDir.path(), {
        overwrite: true,
        matching: paths.copyFromAppDir
    });
};
gulp.task('copy', ['clean'], copyTask);
gulp.task('copy-watch', copyTask);


var compileTask = function () {
    return gulp.src(['./app/**/*.ts', '!./**/*.d.ts'])
        .pipe(tsc())
        .pipe(gulp.dest('./build'));
};

gulp.task('compile', ['clean'], compileTask);
gulp.task('compile-watch', compileTask);

var lessTask = function () {
    return gulp.src('app/stylesheets/main.less')
        .pipe(less())
        .pipe(gulp.dest(destDir.path('stylesheets')));
};
gulp.task('less', ['clean'], lessTask);
gulp.task('less-watch', lessTask);


gulp.task('finalize', ['clean'], function () {
    var manifest = srcDir.read('package.json', 'json');
    // Add "dev" or "test" suffix to name, so Electron will write all data
    // like cookies and localStorage in separate places for each environment.
    switch (utils.getEnvName()) {
        case 'development':
            manifest.name += '-dev';
            manifest.productName += ' Dev';
            break;
        case 'test':
            manifest.name += '-test';
            manifest.productName += ' Test';
            break;
    }
    destDir.write('package.json', manifest);

    var configFilePath = projectDir.path('config/env_' + utils.getEnvName() + '.json');
    destDir.copy(configFilePath, 'env_config.json');
});

gulp.task('setKey', ['finalize', 'copy'], function () {

    var apiKey = projectDir.read('config/apiKey.json', 'json');
    if (apiKey == null) { throw new gulpUtil.PluginError('setKey', 'Value for apiKey is not set in ./config/apiKey.json, communication with Zomato will not work properly'); }

    gulp.src(['./build/app.js'])
        .pipe(replace(/##API_KEY##/, apiKey.key))
        .pipe(gulp.dest('./build'));
})

gulp.task('watch', function () {
    gulp.watch('app/**/*.ts', ['compile-watch']);
    gulp.watch(paths.copyFromAppDir, { cwd: 'app' }, ['copy-watch']);
    gulp.watch('app/**/*.less', ['less-watch']);
});


gulp.task('build', ['less', 'copy', 'finalize', 'inject', 'setKey', 'compile']);
