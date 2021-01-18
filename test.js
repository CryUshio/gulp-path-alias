const path = require('path');
const fs = require('fs');
const readline = require('readline');
const gulp = require('gulp');
const test = require('ava');
const { dest } = require('gulp');
const alias = require('./lib');

const fileValidator = async (filepath, expectedFilepath, t) => {
  const fileArray = [];
  const expectFileArray = [];

  const readFileLine = (f, arrayBuffer) => {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: fs.createReadStream(f),
      });
      rl.on('line', (line) => {
        arrayBuffer.push(line);
      });
      rl.on('close', resolve);
    })
  }
  
  await Promise.all([
    readFileLine(filepath, fileArray),
    readFileLine(expectedFilepath, expectFileArray),
  ]);

  for(let i = 0; i < expectFileArray.length; i++) {
    const expectLine = expectFileArray[i];
    const fileLine = fileArray[i];

    if (expectLine !== fileLine) {
      t.fail(`Validate failed at line ${i + 1}:\n${fileLine}\n\nExpected:\n${expectLine}`);
    }
  }
  t.pass();
}

const BASE_PATH = path.join(__dirname, './test-files');
const paths = {
  '@libs': path.join(BASE_PATH, 'libs'),
  '@libs$': path.join(BASE_PATH, 'libs/index'),
  '@utils': path.join(BASE_PATH, '../utils'),
  '@utils-lib': path.join(BASE_PATH, '../utils/lib'),
  '@path/to': '@path/to/some/where'
}


test('functional test .css', (t) => {
  const filepath = path.join(BASE_PATH, 'app.css');
  const distFilepath = path.join(BASE_PATH, 'dist/app.css');
  const expectFilepath = path.join(BASE_PATH, 'expected/app.css');

  return new Promise((resolve) => {
    gulp.src(filepath)
      .pipe(alias({ paths }))
      .pipe(dest(path.join(BASE_PATH, 'dist')))
      .on('end', async () => {
        await fileValidator(distFilepath, expectFilepath, t);
        resolve();
      });
  });
});

test('functional test .js', (t) => {
  const filepath = path.join(BASE_PATH, 'app.js');
  const distFilepath = path.join(BASE_PATH, 'dist/app.js');
  const expectFilepath = path.join(BASE_PATH, 'expected/app.js');

  return new Promise((resolve) => {
    gulp.src(filepath)
      .pipe(alias({ paths }))
      .pipe(dest(path.join(BASE_PATH, 'dist')))
      .on('end', async () => {
        await fileValidator(distFilepath, expectFilepath, t);
        resolve();
      });
  });
});

test('functional test .wxml', (t) => {
  const filepath = path.join(BASE_PATH, 'app.wxml');
  const distFilepath = path.join(BASE_PATH, 'dist/app.wxml');
  const expectFilepath = path.join(BASE_PATH, 'expected/app.wxml');

  return new Promise((resolve) => {
    gulp.src(filepath)
      .pipe(alias({ paths }))
      .pipe(dest(path.join(BASE_PATH, 'dist')))
      .on('end', async () => {
        await fileValidator(distFilepath, expectFilepath, t);
        resolve();
      });
  });
});
