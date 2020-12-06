const gulp = require('gulp');
const through = require('through2');
const test = require('ava');
const alias = require('./index');

// TODO
test('functional test .css', async (t) => {
  gulp.src('./test-files/app.css')
    .pipe(alias({
      path: {
        '@libs': './libs',
        '@utils': './utils',
      }
    }))
    .pipe(through.obj(function (file, _, cb) {
      console.log(file.isStream());
    }));

  t.is('', '');
});
