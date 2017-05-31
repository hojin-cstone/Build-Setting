var gulp = require('gulp');

/* ### 디렉토리 설정 */
var src = 'public/src', // 작업 디렉토리
	dist = 'public/dist', // 배포 디렉토리
	dev = 'public/dev'; // 개발 디렉토리

var dir = {
	html : {
			all : src + '/**/*.html',
			main : [
					src + '/*.html'
				],
			sub : [
					src + '/*/*.html',
					'!'+src + '/include/*.html'
				],
			dev : [
					src + '/**/*.html',
					'!'+src + '/style_guide.html',
					'!'+src + '/url.html'
				]
		},
	css : {
			all : src+'/resources/css/**/*',
			lib : src+'/resources/css/lib/*.css',
			common : src+'/resources/css/common.scss',
			main   : src+'/resources/css/main.scss',
			sub    : [
					src+'/resources/css/*.scss',
					'!'+src+'/resources/css/common.scss',
					'!'+src+'/resources/css/main.scss',
					'!'+src+'/resources/css/icon.scss'
				],
			dev    : [
					src+'/resources/css/*.scss'
				]
		},
	img : {
			all : [
					src+'/resources/images/*/*',
					'!'+src+'/resources/images/icon/*'
				],
			icon : src+'/resources/images/icon/*'
		},
	js : src+'/resources/js/*.js',
	jsLib : src+'/resources/js/lib/*.js'
};

/* ### 플러그인 */
var plugins = require('gulp-load-plugins')(), // 설치한 플러그인들을 plugins를 통해 실행합니다.
	sourcemaps = require('gulp-sourcemaps'), // plugins로 사용안되는플러그인은 따로 추가
	buffer = require('vinyl-buffer'),
	imagemin = require('gulp-imagemin'),
	jslint = require('gulp-jslint-simple'),
	FileCache = require("gulp-file-cache"),
	fileCache = new FileCache();

/* ### Server */
gulp.task('server', ['html', 'css', 'img', 'js'], function () {
	gulp
		.src(dist + '/') // ROOT설정
		.pipe(plugins.webserver({
				host:'114.52.63.67', // HOST
				port:'1515', // PORT
				livereload:true // 자동새로고침 사용
			}));

	// 파일의 변화를 감지하여 브라우저를 새로고침해줍니다.
	gulp.watch(dir.html.all, ['html']).on('change', plugins.livereload.changed);
	gulp.watch(dir.css.all, ['css']).on('change', plugins.livereload.changed);
	gulp.watch(dir.img.all, ['img']).on('change', plugins.livereload.changed);
	gulp.watch(dir.js, ['js']).on('change', plugins.livereload.changed);
});

/* ### HTML */
gulp.task('html', ['htmlMain', 'htmlSub', 'htmlDev'], function () {
 }).task('htmlMain', function () {
	return gulp
		.src(dir.html.main)
        .pipe(plugins.fileInclude({
				prefix: '@@',
			}))
		.pipe(plugins.htmlReplace({
				'css_normalize':'./resources/css/lib/normalize.min.css',
				'css_common':'./resources/css/common.min.css',
				'css_icon':'./resources/css/icon.min.css',
				'css_main':'./resources/css/main.min.css',
				'js_jquery':'./resources/js/lib/jquery.min.js',
				'js_html5shiv':'./resources/js/lib/html5shiv.min.js',
				'js_function':'./resources/js/function.min.js',
				'js_project':'./resources/js/project.min.js'
		    }))
		.pipe(gulp.dest(dist + '/'));
}).task('htmlSub', function () {
	return gulp
		.src(dir.html.sub)
        .pipe(plugins.fileInclude({
				prefix: '@@',
			}))
		.pipe(plugins.htmlReplace({
				'css_normalize':'../resources/css/lib/normalize.min.css',
				'css_common':'../resources/css/common.min.css',
				'css_icon':'../resources/css/icon.min.css',
				'css_sub':'../resources/css/sub.min.css',
				'js_jquery':'../resources/js/lib/jquery.min.js',
				'js_html5shiv':'../resources/js/lib/html5shiv.min.js',
				'js_function':'../resources/js/function.min.js',
				'js_project':'../resources/js/project.min.js'
		    }))
		.pipe(gulp.dest(dist + '/'));
}).task('htmlDev', function () {
	return gulp
		.src(dir.html.dev)
		.pipe(plugins.htmlReplace({
				'css_normalize':'/resources/css/lib/normalize.min.css',
				'css_common':'/resources/css/common.min.css',
				'css_icon':'/resources/css/icon.min.css',
				'css_main':'./resources/css/main.min.css',
				'css_sub':'/resources/css/sub.min.css',
				'js_jquery':'/resources/js/lib/jquery.min.js',
				'js_html5shiv':'/resources/js/lib/html5shiv.min.js',
				'js_function':'/resources/js/function.min.js',
				'js_project':'/resources/js/project.min.js'
		    }))
		.pipe(plugins.replace(/\.*\//g, '/')) // 모든 상대경로 -> 절대경로 변경
		.pipe(plugins.replace(/\.html/g, '.jsp')) // 링크 확장자를 html -> jsp로 변경
		.pipe(plugins.replace(/@@include((.*\/include\/config.*))/g, '<%@ include file="/include/config.jsp" %>')) // gulp인클루드 -> jsp인클루드로 변경
		.pipe(plugins.replace(/@@include((.*\/include\/header.*))/g, '<%@ include file="/include/header.jsp" %>'))
		.pipe(plugins.replace(/@@include((.*\/include\/footer.*))/g, '<%@ include file="/include/footer.jsp" %>'))
		.pipe(plugins.rename({ // .jsp로 번경
				extname: ".jsp"
			}))
		.pipe(gulp.dest(dev + '/'));
});

/* ### CSS */
gulp.task('css',['cssLib', 'cssCommon', 'cssSub'], function () {
}).task('cssLib', function () {
	return gulp
		.src(dir.css.lib) // CSS 경로
		.pipe(plugins.sass()) // SASS -> CSS 컴파일
		.pipe(sourcemaps.init()) // 소스맵 생성
		.pipe(plugins.rename({
				suffix:'.min'
			}))
        .pipe(plugins.minifyCss()) // css파일을 minify합니다.
		.pipe(sourcemaps.write('./sourcemaps'))  // 소스맵 저장합니다.
		.pipe(gulp.dest(dist+'/resources/css/lib'))
		.pipe(gulp.dest(dev+'/resources/css/lib'));
}).task('cssCommon', function () {
	return gulp
		.src([dir.css.common, dir.css.main])
		.pipe(plugins.sass())
		.pipe(sourcemaps.init())
		.pipe(plugins.autoprefixer({
	            browsers: ['last 4 versions'], // 최신브라우저에서 4버전 아래까지 Prefix
	            cascade: false
	        }))
		.pipe(plugins.rename({
				suffix:'.min'
			}))
        .pipe(plugins.minifyCss())
		.pipe(sourcemaps.write('./sourcemaps'))
		.pipe(gulp.dest(dist+'/resources/css'))
		.pipe(plugins.replace(/\.\./g, '/resources'))
		.pipe(gulp.dest(dev+'/resources/css'));
}).task('cssSub', function () {
	return gulp
		.src(dir.css.sub)
		.pipe(plugins.sass())
		.pipe(sourcemaps.init())
		.pipe(plugins.autoprefixer({
	            browsers: ['last 4 versions'],
	            cascade: false
	        }))
		.pipe(plugins.concat('sub.css')) // css파일을 sub.css라는 파일명으로 Merge합니다.
		.pipe(plugins.rename({
				suffix:'.min'
			}))
        .pipe(plugins.minifyCss())
		.pipe(sourcemaps.write('./sourcemaps'))
		.pipe(gulp.dest(dist+'/resources/css'))
		.pipe(plugins.replace(/\.\./g, '/resources')) // dev에서 절대경로로 변경
		.pipe(gulp.dest(dev+'/resources/css'));
});

/* ### IMAGES */
gulp.task('img', ['imgSprite', 'imgMin'], function () {
}).task('imgSprite', function(){
	var spriteData = gulp.src(dir.img.icon) // IMAGES 경로
		.pipe(plugins.spritesmith({ // Sprite생성
				imgName: 'icon.png',
				cssName: 'icon.min.css',
				padding : 10
			}));
	spriteData.img
		.pipe(buffer())
		.pipe(imagemin([ // IMAGE를 optimize합니다.
				imagemin.gifsicle({interlaced: true}),
				imagemin.jpegtran({progressive: true}),
				imagemin.optipng({optimizationLevel: 5}),
				imagemin.svgo({plugins: [{removeViewBox: true}]})
			]))
		.pipe(gulp.dest(dist+'/resources/images/common'))
		.pipe(gulp.dest(dev+'/resources/images/common'));
	spriteData.css
		.pipe(sourcemaps.init())
		.pipe(plugins.replace(/\icon-/g, '')) // Sprite과정중 생긴 icon Prefix제거
		.pipe(plugins.replace(/url\(/g, 'url(../images/common/')) // css위치 변경으로 인한 url변경
		.pipe(plugins.minifyCss())
		.pipe(sourcemaps.write('./sourcemaps'))
		.pipe(gulp.dest(dist+'/resources/css'))
		.pipe(plugins.replace(/\.\./g, '/resources')) // dev에서 절대경로로 변경
		.pipe(gulp.dest(dev+'/resources/css'));
}).task('imgMin', function(){
    return gulp
		.src(dir.img.all)
		.pipe(imagemin([
				imagemin.gifsicle({interlaced: true}),
				imagemin.jpegtran({progressive: true}),
				imagemin.optipng({optimizationLevel: 5}),
				imagemin.svgo({plugins: [{removeViewBox: true}]})
			]))
        .pipe(gulp.dest(dist+'/resources/images'))
		.pipe(gulp.dest(dev+'/resources/images'));
});

/* ### JS */
gulp.task('js', ['jsLib', 'jsLint'], function () {
	return gulp
		.src(dir.js) // JS경로
		.pipe(sourcemaps.init())
		.pipe(plugins.rename({
				suffix:'.min'
			}))
        .pipe(plugins.uglify()) // src에 있는 JS파일을 minify합니다.
		.pipe(sourcemaps.write('./sourcemaps'))
    	.pipe(gulp.dest(dist+'/resources/js'))
		.pipe(gulp.dest(dev+'/resources/js'));
}).task('jsLib',function(){
	return gulp
	.src(dir.jsLib)
	.pipe(gulp.dest(dist+'/resources/js/lib'))
	.pipe(gulp.dest(dev+'/resources/js/lib'));
}).task('jsLint', function () { // JS 유효성 검사
    return gulp
		.src(dir.js)
		.pipe(jslint.run({
	            // project-wide JSLint options
	            node: true,
	            vars: true
	        }))
        .pipe(jslint.report({
	            // example of using a JSHint reporter
	            reporter: require('jshint-stylish').reporter
	        }));
});

/* ### Git */
gulp.task('git', ['commit', 'gitPush'], function(){
}).task('commit', function(){
	return gulp.src(src+'/**')
		.pipe(plugins.git.add()) // 수정된 파일 추가
		.pipe(plugins.git.commit(undefined, { // 수정된 파일 추가 확정
			args: '-m "${branch}"',
			disableMessageRequirement: true
		}));
}).task('gitPush', function(){
	plugins.git.push('origin', '${branch}', function (err) { // 파일 올리기
		if (err) throw err;
		plugins.git.checkout('master', function (err) { // 브렌치 변경
			if (err) throw err;
			plugins.git.pull('origin', 'master', function (err) { // 파일 받기
				plugins.git.merge('${branch}', function (err) { // 파일 합치기
					if (err) throw err;
					plugins.git.push('origin', 'master', function (err) {  // 파일 올리기
						if (err) throw err;
						plugins.git.checkout('${branch}', function (err) {
							if (err) throw err;
							plugins.git.merge('master', function (err) { // 파일 합치기
								if (err) throw err;
								plugins.git.push('origin', '${branch}', function (err) {  // 파일 올리기
									if (err) throw err;

									/* ### FTP */
									gulp.src(dist+'/**')
										.pipe(fileCache.filter()) // 수정된 파일만 업로드
										.pipe(plugins.sftp({
											host: '${ftpHost}',
											port: '${ftpPort}',
											user: '${ftpUser}',
											pass: '${ftpPass}',
											remotePath: '${ftpRemotePath}'
										}))
										.pipe(fileCache.cache());

									console.log(
										'/*****************************\n\n'+
										'       COMMIT 완료.      \n\n'+
										'*****************************/'
									);
								});
							});
						});
					});
				});
			});
		});
	});
});

/* ### Gulp실행 */
gulp.task('default', ['server'], function(){
	console.log(
		'/**********************\n\n'+
		'      SERVER RUN...    \n\n'+
		'**********************/'
	);
});
