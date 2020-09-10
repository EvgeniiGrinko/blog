const gulp = require("gulp");
const plumber = require("gulp-plumber");
const nodemon = require('gulp-nodemon')
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const cssnano = require("gulp-cssnano");
const concat = require("gulp-concat");
const uglify = require("gulp-uglifyjs");



// CSS task
function css(done) {
  gulp
    .src("dev/scss/**/*.scss")
    .pipe(plumber())
    .pipe(sass())
    .pipe(
      autoprefixer(["last 15 versions", "> 1%", "ie 8", "ie 7"], {
        cascade: true
      })
    )
    .pipe(cssnano())
    .pipe(gulp.dest("public/stylesheets")),
    done()
};
function scripts (done){
  gulp.src(
    ['dev/js/comment.js',
    'dev/js/_auth.js',
    'dev/js/post.js']
  )
  .pipe(concat('scripts.js'))
  //.pipe(uglify())
  .pipe(gulp.dest('public/javascripts')),
  done()
};

// Watch files
function watchFiles(done) {
  gulp.watch("./dev/scss/**/*.scss", css),
  gulp.watch("./dev/js/**/*.js", scripts),

  done()
};
function nodeMon(done){
  nodemon({script: 'app.js'}),
  done()
};
gulp.task("css", css);
gulp.task("watchFiles", watchFiles);
gulp.task('nodeMon', nodeMon);
gulp.task('scripts', scripts);
gulp.task(
  "default",
  gulp.series(gulp.parallel("css","nodeMon", "scripts"), "watchFiles")
);