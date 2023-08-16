import gulp from "gulp";
import sass from "gulp-dart-sass";
import concat from "gulp-concat";

const GLOBS = {
	CSS: "styles/**/*.{scss,css}",
	SVG: "svg/**/*.svg"
};

//sass
gulp.task("sass", function (cb) {
	gulp.src(GLOBS.CSS)
		.pipe(sass({ outputStyle: "compressed" }))
		.pipe(concat("buggroup.css"))
		.pipe(gulp.dest("dist/"));
	cb();
});

gulp.task("svg", function (cb) {
	gulp.src([GLOBS.SVG]).pipe(gulp.dest("dist/svg/"));
	cb();
});

const defaultTask = gulp.series("sass", "svg");

gulp.task("watch", function (cb) {
	gulp.watch([GLOBS.CSS, GLOBS.SVG], defaultTask);
});

gulp.task("default", defaultTask);
