# gulp-zopfli-green

This is a fork of gulp-zopfli that aims to keep all dependencies updated.

A [Zopfli](http://en.wikipedia.org/wiki/Zopfli) plugin for [gulp](https://github.com/wearefractal/gulp),
based on [node-zopfli](https://npmjs.org/package/node-zopfli).

[![NPM version][npm-image]][npm-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![License][license-image]][license-url]

## Install

- Yarn: `yarn add -D gulp-zopfli-green`
- Npm: `npm i -D gulp-zopfli-green`

## Options

### format `String`

Choose an output format, you can choose between `gzip`, `zlib` or `deflate`. Defaults to gzip.

```javascript
zopfli({ format: 'zlib' });
```

### append `Boolean`

Appends `.gz`, `.zz` or `.deflate` file extension if true depending on the format chosen. Defaults to true.

```javascript
zopfli({ append: true });
```

### threshold `String|Number|Boolean`

Minimum size required to compress a file. Defaults to false.

```javascript
zopfli({ threshold: '1kb' });
```

```javascript
zopfli({ threshold: 1024 }); // Values below 1 default to 1
```

```javascript
zopfli({ threshold: true }); // Currently sets it to 150
```

### zopfliOptions `Object`

Options object to pass through to node-zopfli. See [node-zopfli documentation](https://github.com/pierreinglebert/node-zopfli#options) for more information.

```javascript
{
    verbose: false,
    verbose_more: false,
    numiterations: 15,
    blocksplitting: true,
    blocksplittinglast: false,
    blocksplittingmax: 15
};
```

## Examples

```javascript
const gulp = require('gulp');
const zopfli = require('gulp-zopfli-green');

gulp.task('compress', function () {
  gulp
    .src('./dev/scripts/*.js')
    .pipe(zopfli())
    .pipe(gulp.dest('./public/scripts'));
});

gulp.task('default', function () {
  gulp.run('compress');
});
```

# Credit

This plugin is based on [gulp-gzip](https://github.com/jstuckey/gulp-gzip).

[npm-image]: https://img.shields.io/npm/v/gulp-zopfli-green?style=flat-square&logo=npm
[npm-url]: https://www.npmjs.com/package/gulp-zopfli-green
[coveralls-image]: https://img.shields.io/badge/coverage-100%25-green?style=flat-square&logo=mocha&logoColor=fff
[coveralls-url]: https://github.com/GeKorm/gulp-zopfli-green/actions/workflows/code-quality.yml
[license-image]: https://img.shields.io/npm/l/better-auth-harmony?style=flat-square&cacheSeconds=1
[license-url]: https://github.com/GeKorm/gulp-zopfli-green/blob/master/LICENSE
