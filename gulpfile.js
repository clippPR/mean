'use strict';

var
    gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    mocha = require('gulp-mocha'),
    uglify = require('gulp-uglify'),
    minifyCSS = require('gulp-minify-css'),
    concat = require('gulp-concat'),
    nodemon = require('gulp-nodemon'),
    csslint = require('gulp-csslint'),
    gutil = require('gulp-util'),
    karma = require('gulp-karma');

var paths = {
    js: ['*.js', 'server/**/*.js', 'public/**/*.js', 'test/**/*.js', '!test/coverage/**', '!public/system/lib/**', '!public/build/js/dist.min.js'],
    html: ['public/**/views/**', 'server/views/**'],
    css: ['public/**/css/*.css', '!public/system/lib/**', '!public/build/css/dist.min.css']
};

var fs = require('fs');
var data = fs.readFileSync('server/config/assets.json', 'utf8');
var assets = JSON.parse(data);


gulp.task('karma', function() {

    return gulp.src('test/karam/unit/*/*.js')
        .pipe(karma({
            configFile: 'test/karma/karma.conf.js',
            action: 'run'
        }))
        .on('error', gutil.log);
});

gulp.task('karma-w', function() {

    return gulp.src('test/karam/unit/*/*.js')
        .pipe(karma({
            configFile: 'test/karma/karma.conf.js',
            action: 'watch'
        }))
        .on('error', gutil.log);
});

gulp.task('mocha', function() {
    return gulp.src(['server.js', 'test/mocha/*/*.js'])
        .pipe(mocha({
            reporter: 'spec',
            globals: {
                should: require('should')
            }
        }))
        .on('error', gutil.log);
});

gulp.task('mocha-w', function(){
    gulp.watch(['server.js', 'test/mocha/*/*.js'], ['mocha']);
});


gulp.task('lint', function(){
    gulp.src(paths.js)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .on('error', gutil.log);

    gulp.src(paths.css)
        .pipe(csslint('.csslintrc'))
        .pipe(csslint.reporter())
        .on('error', gutil.log);
});

gulp.task('lint-w', function(){
    gulp.watch(paths.js.concat(paths.css), ['lint']);
});

gulp.task('compress', function(){
    var dist, jsAssets, cssAssets, distName, distPath;
    for(var i in assets.js) {
        dist = i;
        jsAssets = assets.js[i];
    }

    dist = dist.split('/');
    distPath = dist.slice(0,dist.length-1).join('/');
    distName = dist.slice(dist.length-1, dist.length).join('/');
    
    gulp.src(jsAssets)
        .pipe(uglify({outSourceMap: false}))
        .pipe(concat(distName))
        .pipe(gulp.dest(distPath))
        .on('error', gutil.log);


    for(var j in assets.css) {
        dist = j;
        cssAssets = assets.css[j];
    }

    dist = dist.split('/');
    distPath = dist.slice(0,dist.length-1).join('/');
    distName = dist.slice(dist.length-1, dist.length).join('/');

    gulp.src(cssAssets)
        .pipe(minifyCSS({keepBreaks:true}))
        .pipe(gulp.dest('./dist/'))
        .on('error', gutil.log);
});

gulp.task('s3', function(){
    console.log('this should push assets to s3');
});

gulp.task('s3-w', function(){
    console.log('this watch assets then should push assets to s3');
});

gulp.task('nodemon', function(){
    nodemon({
        script: 'server.js',
        ext: 'html js',
        ignore: ['public/**', 'node_modules/**', 'test/**'],
        nodeArgs: ['--debug'],
        delayTime: 1,
        env: {
            PORT: require('./server/config/config').port
        },
        cwd: __dirname
    })
    .on('error', gutil.log);
});

gulp.task('env:test', function(){
    process.env.NODE_ENV = 'test';
});

gulp.task('env:develop', function(){
    process.env.NODE_ENV = 'development';
});

gulp.task('test', ['env:test', 'lint', 'mocha', 'karma']);
gulp.task('dev', ['lint', 'nodemon']);
gulp.task('dev-w', ['mocha-w', 'karma-w', 'lint-w', 'nodemon']);
gulp.task('prod', ['test', 'compress', 's3']);

if (process.env.NODE_ENV === 'production') {
    gulp.task('default', ['prod']);
} else {
    gulp.task('default', ['dev']);
}

