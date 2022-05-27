const {task, src, dest, series, watch} = require('gulp')
const sourcemaps = require('gulp-sourcemaps')
const uglify = require('gulp-uglify-es').default
const cleanCSS = require('gulp-clean-css')
const concat = require('gulp-concat')
const rename = require('gulp-rename')
const destinedFolder = './public/output'
const jsSourceFolder = './public/js/'
const cssSourceFolder = './public/css/'
const bundledJsFilename = 'all.js'
const bundledCssFilename = 'all.css'
const jsSourceFilePaths = [`${jsSourceFolder}**/*.js`]
const cssSourceFilePaths = [`${cssSourceFolder}**/*.css`]

task('buildJs', () => { // 合併壓縮 js
  return src(jsSourceFilePaths)
    .pipe(sourcemaps.init())
    .pipe(concat(bundledJsFilename, {newLine: ';'}))
    .pipe(dest(destinedFolder))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(dest(destinedFolder))
})

task('buildCss', () => { // 合併壓縮 css
  return src(cssSourceFilePaths)
    .pipe(sourcemaps.init())
    .pipe(concat(bundledCssFilename))
    .pipe(dest(destinedFolder))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(cleanCSS())
    .pipe(sourcemaps.write())
    .pipe(dest(destinedFolder))
})

task('watch', () => { // 監聽 js 檔案
  watch(jsSourceFilePaths, series('buildJs'))
  watch(cssSourceFilePaths, series('buildCss'))
})

task('default', series('buildJs', 'buildCss', 'watch'))