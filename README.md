# gulp-path-alias ![build](https://img.shields.io/badge/build-passing-green)
`gulp` 路径别名

## Install
```
$ npm install --save-dev gulp-path-alias
```

## Usage
配置 `gulp task`
```js
const gulp = require('gulp');
const alias = require('gulp-path-alias');

exports.default = () => (
	gulp.src('src/*.js')
		.pipe(alias({
      paths: {
        '@libs': path.resolve(__dirname, '../src/libs'),
        '@pages': path.resolve(__dirname, '../src/pages'),
      }
    }))
		.pipe(gulp.dest('dist'))
);
```
在 `js` 使用：（支持 `js`、`ts`、`wxs`）
```js
import foo from '@libs/foo';

require('@libs/foo');
```
在 `html` 使用：（支持 `html`、`wxml`）
```html
<img src="@assets/img/bg.png">
```
在 `css`：（支持 `css`、`less` 等）
```css
@import "@assets/css/var.less";

.bg {
  background-image: url(@assets/img/bg.png);
}
```

## API
### alias(options)
#### options
Type: `object`

##### cwd
Type: `string`  
Default: `process.cwd()`

##### paths
Type: `object`  
Default: `{}`

Path alias map.
