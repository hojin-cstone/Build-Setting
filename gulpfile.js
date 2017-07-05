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
					'!'+src + '/inCom/*.html'
				],
			dev : [
					src + '/**/*.html',
					'!'+src + '/style_guide.html',
					'!'+src + '/url.html'
				]
		},
	css : {
			all : src+'/pjtCom/css/**/*',
			lib : src+'/pjtCom/css/lib/*',
			common : src+'/pjtCom/css/common.scss',
			main   : src+'/pjtCom/css/main.scss',
			sub    : [
					src+'/pjtCom/css/*.scss',
					'!'+src+'/pjtCom/css/common.scss',
					'!'+src+'/pjtCom/css/main.scss',
					'!'+src+'/pjtCom/css/icon.scss'
				],
			dev    : [
					src+'/pjtCom/css/*.scss'
				]
		},
	img : {
			all : src+'/pjtCom/images/*/*',
			icon : src+'/pjtCom/images/common/icon/*'
		},
	js : src+'/pjtCom/js/*.js',
	jsLib : src+'/pjtCom/js/lib/*.js'
};

/* ### 플러그인 */
var plugins = require('gulp-load-plugins')(), // 설치한 플러그인들을 plugins를 통해 실행합니다.
	sourcemaps = require('gulp-sourcemaps'), // plugins로 사용안되는플러그인은 따로 추가
	buffer = require('vinyl-buffer'),
	imagemin = require('gulp-imagemin'),
	jslint = require('gulp-jslint-simple');

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
gulp.task('html', ['htmlClean'], plugins.shell.task(['gulp htmlBuild']));
gulp.task('htmlClean', function () {
    return gulp.src([dist + '/**/*.html', dev + '/**/*.${developFormat}'])
        .pipe(plugins.clean());
}).task('htmlBuild', ['htmlMain', 'htmlSub', 'htmlDev'], function () {
 }).task('htmlMain', function () {
	return gulp
		.src(dir.html.main)
        .pipe(plugins.fileInclude({
				prefix: '@@',
			}))
		.pipe(plugins.htmlReplace({
				'css_normalize':'./pjtCom/css/lib/normalize.min.css',
				'css_common':'./pjtCom/css/common.min.css',
				'css_icon':'./pjtCom/css/icon.min.css',
				'css_main':'./pjtCom/css/main.min.css',
				'js_jquery':'./pjtCom/js/lib/jquery.min.js',
				'js_html5shiv':'./pjtCom/js/lib/html5shiv.min.js',
				'js_function':'./pjtCom/js/function.min.js',
				'js_project':'./pjtCom/js/project.min.js'
		    }))
		.pipe(gulp.dest(dist + '/'));
}).task('htmlSub', function () {
	return gulp
		.src(dir.html.sub)
        .pipe(plugins.fileInclude({
				prefix: '@@',
			}))
		.pipe(plugins.htmlReplace({
				'css_normalize':'../pjtCom/css/lib/normalize.min.css',
				'css_common':'../pjtCom/css/common.min.css',
				'css_icon':'../pjtCom/css/icon.min.css',
				'css_sub':'../pjtCom/css/sub.min.css',
				'js_jquery':'../pjtCom/js/lib/jquery.min.js',
				'js_html5shiv':'../pjtCom/js/lib/html5shiv.min.js',
				'js_function':'../pjtCom/js/function.min.js',
				'js_project':'../pjtCom/js/project.min.js'
		    }))
		.pipe(gulp.dest(dist + '/'));
}).task('htmlDev', function () {
	return gulp
		.src(dir.html.dev)
		.pipe(plugins.htmlReplace({
				'css_normalize':'/pjtCom/css/lib/normalize.min.css',
				'css_common':'/pjtCom/css/common.min.css',
				'css_icon':'/pjtCom/css/icon.min.css',
				'css_main':'/pjtCom/css/main.min.css',
				'css_sub':'/pjtCom/css/sub.min.css',
				'js_jquery':'/pjtCom/js/lib/jquery.min.js',
				'js_html5shiv':'/pjtCom/js/lib/html5shiv.min.js',
				'js_function':'/pjtCom/js/function.min.js',
				'js_project':'/pjtCom/js/project.min.js'
		    }))
		.pipe(plugins.replace(/\.*\//g, '/')) // 모든 상대경로 -> 절대경로 변경
		.pipe(plugins.replace(/\.html/g, '.${developFormat}')) // 링크 확장자를 html -> ${developFormat}로 변경
		.pipe(plugins.replace(/@@include\(\'\.*\//g, '${includeStart} ${includeTxt} ${includePathStart}')) // gulp인클루드 -> ${developFormat}인클루드로 변경
		.pipe(plugins.replace(/\'\)/g, '${includePathEnd} ${includeEnd}')) // gulp인클루드 -> ${developFormat} 변경
		.pipe(plugins.rename({ // .${developFormat} 번경
				extname: ".${developFormat}"
			}))
		.pipe(gulp.dest(dev + '/'));
});

/* ### CSS */
gulp.task('css',['cssClean', 'cssLib', 'cssCommon', 'cssSub'], function () {
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
		.pipe(gulp.dest(dist+'/pjtCom/css/lib'))
		.pipe(gulp.dest(dev+'/pjtCom/css/lib'));
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
		.pipe(gulp.dest(dist+'/pjtCom/css'))
		.pipe(plugins.replace(/\.\./g, '/pjtCom'))
		.pipe(gulp.dest(dev+'/pjtCom/css'));
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
		.pipe(gulp.dest(dist+'/pjtCom/css'))
		.pipe(plugins.replace(/\.\./g, '/pjtCom')) // dev에서 절대경로로 변경
		.pipe(gulp.dest(dev+'/pjtCom/css'));
}).task('cssClean', function () {
    gulp.src([dist + '/pjtCom/css/*.css', dev + '/pjtCom/css/*.css'])
        .pipe(plugins.clean());
});

/* ### IMAGES */
gulp.task('img', ['imgClean', 'imgSprite', 'imgMin'], function () {
}).task('imgSprite', function () {
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
		.pipe(gulp.dest(dist+'/pjtCom/images/common'))
		.pipe(gulp.dest(dev+'/pjtCom/images/common'));
	spriteData.css
		.pipe(sourcemaps.init())
		.pipe(plugins.replace(/\icon-/g, '')) // Sprite과정중 생긴 icon Prefix제거
		.pipe(plugins.replace(/url\(/g, 'url(../images/common/')) // css위치 변경으로 인한 url변경
		.pipe(plugins.minifyCss())
		.pipe(sourcemaps.write('./sourcemaps'))
		.pipe(gulp.dest(dist+'/pjtCom/css'))
		.pipe(plugins.replace(/\.\./g, '/pjtCom')) // dev에서 절대경로로 변경
		.pipe(gulp.dest(dev+'/pjtCom/css'));
}).task('imgMin', function () {
    return gulp
		.src([dir.img.all, '!'+src+'/pjtCom/images/common/icon'])
		.pipe(imagemin([
				imagemin.gifsicle({interlaced: true}),
				imagemin.jpegtran({progressive: true}),
				imagemin.optipng({optimizationLevel: 5}),
				imagemin.svgo({plugins: [{removeViewBox: true}]})
			]))
        .pipe(gulp.dest(dist+'/pjtCom/images'))
		.pipe(gulp.dest(dev+'/pjtCom/images'));
}).task('imgClean', function () {
    gulp.src([dist + '/pjtCom/images/*/*', dev + '/pjtCom/images/*/*'])
        .pipe(plugins.clean());
});

/* ### JS */
gulp.task('js', ['jsClean', 'jsLib', 'jsLint'], function () {
	return gulp
		.src(dir.js) // JS경로
		.pipe(sourcemaps.init())
		.pipe(plugins.rename({
				suffix:'.min'
			}))
        .pipe(plugins.uglify()) // src에 있는 JS파일을 minify합니다.
		.pipe(sourcemaps.write('./sourcemaps'))
    	.pipe(gulp.dest(dist+'/pjtCom/js'))
		.pipe(gulp.dest(dev+'/pjtCom/js'));
}).task('jsLib',function () {
	return gulp
		.src(dir.jsLib)
		.pipe(gulp.dest(dist+'/pjtCom/js/lib'))
		.pipe(gulp.dest(dev+'/pjtCom/js/lib'));
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
}).task('jsClean', function () {
    gulp.src([dist + '/pjtCom/js/*.js', dev + '/pjtCom/js/*.js'])
        .pipe(plugins.clean());
});

/* ### Git */
gulp.task('git', ['push'], function () {
	return gulp.src(src+'/**')
		.pipe(plugins.git.add()) // 수정된 파일 추가
		.pipe(plugins.git.commit(undefined, { // 수정된 파일 커밋
			args: '-m "${branch}"',
			disableMessageRequirement: true
		}));
})
.task('push', function () {
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
								plugins.git.push('origin', '${branch}',  // 파일 올리기
									plugins.shell.task(['gulp build']) // GULP BUILD
								);

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

/* ### FTP */
gulp.task('ftp', function () {
	gulp.src(dist+'/**')
		.pipe(plugins.sftp({
			host: '${ftpHost}',
			port: '${ftpPort}',
			user: '${ftpUser}',
			pass: '${ftpPass}',
			remotePath: '${ftpRemotePath}',
			callback : function () {
				console.log(
					'/*****************************\n\n'+
					'       FTP UPLOAD 완료.      \n\n'+
					'*****************************/'
				);
				console.log(
					'/*****************************\n\n'+
					'       SERVER RUN...      \n\n'+
					'*****************************/'
				);
			}
		}))
});

/* ### Gulp실행 */
gulp.task('default', ['git']);
var ftpState = ${ftpHost};
if (ftpState === '') {
	gulp.task('build', ['server'], function () {
		console.log(
			'/*****************************\n\n'+
			'       SERVER RUN...      \n\n'+
			'*****************************/'
		);
	});
} else {
	gulp.task('build', ['server'], plugins.shell.task(['gulp ftp']));
}
