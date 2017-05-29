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
		jsp : [
			src + '/**/*.html',
			'!'+src + '/style_guide.html',
			'!'+src + '/url.html'
		]
	},
	css : {
		all : src+'/resources/css/*.scss',
		lib : src+'/resources/css/lib/normalize.css',
		common : src+'/resources/css/common.scss',
		main   : src+'/resources/css/main.scss',
		sub    : [
					src+'/resources/css/*.scss',
					'!'+src+'/resources/css/common.scss',
					'!'+src+'/resources/css/main.scss'
		]
	},
	img : {
		all : [
			src+'/resources/images/*/*'
		],
		sprite : src+'/resources/images/sprite/*'
	},
	js : src+'/resources/js/*.js',
	jsLib : src+'/resources/js/lib/*.js'
};

/* ### 플러그인 */
var plugins = require('gulp-load-plugins')(), // 설치한 플러그인들을 plugins를 통해 실행합니다.
	sourcemaps = require('gulp-sourcemaps'), // plugins로 사용안되는플러그인은 따로 추가
	jslint = require('gulp-jslint-simple'),
	FileCache = require("gulp-file-cache"),
	fileCache = new FileCache();

/* ### Server */
gulp.task('server', ['html', 'css', 'img', 'js'], function () {
	gulp
		.src(dist + '/') // ROOT설정
		.pipe(plugins.webserver({
			host:'${serverHost}', // HOST
			port:'${serverPort}', // PORT
			livereload:true // 자동새로고침 사용
		}));

	// 파일의 변화를 감지하여 브라우저를 새로고침해줍니다.
	gulp.watch(dir.html.all, ['html']).on('change', plugins.livereload.changed);
	gulp.watch(dir.css.all, ['css']).on('change', plugins.livereload.changed);
	gulp.watch(dir.img.all, ['img']).on('change', plugins.livereload.changed);
	gulp.watch(dir.js, ['js']).on('change', plugins.livereload.changed);
});

/* ### HTML */
gulp.task('html', ['html_sub'], function () {
	return gulp
		.src(dir.html.main) // HTML경로
        .pipe(plugins.fileInclude({ // Include사용
			prefix: '@@',
		}))
		.pipe(plugins.htmlReplace({
			'css_normalize':'./resources/css/lib/normalize.min.css',
			'css_common':'./resources/css/common.min.css',
			'css_main':'./resources/css/main.min.css',
			'js_jquery':'./resources/js/lib/jquery.min.js',
			'js_html5shiv':'./resources/js/lib/html5shiv.min.js',
			'js_function':'./resources/js/function.min.js',
			'js_project':'./resources/js/project.min.js'
	    }))
		.pipe(gulp.dest(dist + '/')); // 이곳에 저장합니다.
}).task('html_sub', ['jsp'], function () {
	return gulp
		.src(dir.html.sub)
        .pipe(plugins.fileInclude({
			prefix: '@@',
		}))
		.pipe(plugins.htmlReplace({
			'css_normalize':'../resources/css/lib/normalize.min.css',
			'css_common':'../resources/css/common.min.css',
			'css_sub':'../resources/css/sub.min.css',
			'js_jquery':'../resources/js/lib/jquery.min.js',
			'js_html5shiv':'../resources/js/lib/html5shiv.min.js',
			'js_function':'../resources/js/function.min.js',
			'js_project':'../resources/js/project.min.js'
	    }))
		.pipe(gulp.dest(dist + '/'));
}).task('jsp', function () {
	return gulp
		.src(dir.html.jsp)
		.pipe(plugins.htmlReplace({
			'css_normalize':'/resources/css/lib/normalize.min.css',
			'css_common':'/resources/css/common.min.css',
			'css_sub':'/resources/css/sub.min.css',
			'js_jquery':'/resources/js/lib/jquery.min.js',
			'js_html5shiv':'/resources/js/lib/html5shiv.min.js',
			'js_function':'/resources/js/function.min.js',
			'js_project':'/resources/js/project.min.js'
	    }))
		.pipe(plugins.replace(/\.html/g, '.jsp'))
		.pipe(plugins.replace(/@@include((.*\/include\/config.*))/g, '<%@ include file="/include/config.jsp" %>'))
		.pipe(plugins.replace(/@@include((.*\/include\/header.*))/g, '<%@ include file="/include/header.jsp" %>'))
		.pipe(plugins.replace(/@@include((.*\/include\/footer.*))/g, '<%@ include file="/include/footer.jsp" %>'))
		.pipe(plugins.rename({ // .jsp로 번경
			extname: ".jsp"
		}))
		.pipe(gulp.dest(dev + '/'));
});

/* ### CSS */
gulp.task('css',['cssCommon', 'cssSub'], function () {
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
		.pipe(gulp.dest(dev+'/resources/css'));
});

/* ### IMAGES */
gulp.task('img', ['imgMin'], function () {
	return gulp
		.src(dir.img.sprite) // IMAGES 경로
		.pipe(plugins.spritesmith({ // sprite생성
			imgName: 'icon.png',
			cssName: 'icon.css'
		}))
		.pipe(gulp.dest(dist+'/resources/images/sprite'))
		.pipe(gulp.dest(dev+'/resources/images/sprite'));
}).task('imgMin', function(){
    return gulp
		.src(dir.img.all)
		.pipe(plugins.imagemin([
				plugins.imagemin.gifsicle({interlaced: true}),
				plugins.imagemin.jpegtran({progressive: true}),
				plugins.imagemin.optipng({optimizationLevel: 5}),
				plugins.imagemin.svgo({plugins: [{removeViewBox: true}]})
			])) // IMAGE를 optimize합니다.
        .pipe(gulp.dest(dist+'/resources/images')) // 이곳에 저장합니다.
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
    	.pipe(gulp.dest(dist+'/resources/js')) // 이곳에 저장합니다.
		.pipe(gulp.dest(dev+'/resources/js'));
}).task('jsLib',function(){
	return gulp
	.src(dir.jsLib)
	.pipe(gulp.dest(dist+'/resources/js/lib'))
	.pipe(gulp.dest(dev+'/resources/js/lib'));
}).task('jsLint', function () { // JS 에러 체크
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
gulp.task('commit', ['gitPush'], function(){
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
