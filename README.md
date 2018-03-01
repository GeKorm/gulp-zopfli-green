gulp-zopfli-green
===========

This is a fork of gulp-zopfli that aims to keep all dependencies updated.

a [Zopfli](http://en.wikipedia.org/wiki/Zopfli) plugin for [gulp](https://github.com/wearefractal/gulp),
based on [node-zopfli](https://npmjs.org/package/node-zopfli).


[![NPM version][npm-image]][npm-url]
[![Linux Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![Dependency Status][dep-image]][dep-url]
[![devDependency Status][devDep-image]][devDep-url]

## Install

```
npm install --save-dev gulp-zopfli
```

##Options

### format `String`

Choose an output format, you can choose between `gzip`, `zlib` or `deflate`. Defaults to gzip.

```javascript
 zopfli({ format: 'zlib' })
 ```


### append `Boolean`

Appends `.gz`, `.zz` or `.deflate` file extension if true depending on the format chosen. Defaults to true.

```javascript
 zopfli({ append: true })
 ```

### threshold `String|Number|Boolean`

Minimum size required to compress a file. Defaults to false.

```javascript
zopfli({ threshold: '1kb' })
```

```javascript
zopfli({ threshold: 1024 })
```

```javascript
zopfli({ threshold: true })
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
var gulp = require("gulp");
var zopfli = require("gulp-zopfli");

gulp.task("compress", function() {
	gulp.src("./dev/scripts/*.js")
	.pipe(zopfli())
	.pipe(gulp.dest("./public/scripts"));
});

gulp.task("default", function() {
  gulp.run("compress");
});
```

Credit
======

This plugin is based on [gulp-gzip](https://github.com/jstuckey/gulp-gzip).


[npm-image]: https://img.shields.io/npm/v/gulp-zopfli.svg
[npm-url]: https://www.npmjs.com/package/gulp-zopfli
[travis-image]: https://img.shields.io/travis/pierreinglebert/gulp-zopfli/master.svg?label=Linux%20build
[travis-url]: https://travis-ci.org/pierreinglebert/gulp-zopfli
[coveralls-image]: https://img.shields.io/coveralls/pierreinglebert/gulp-zopfli.svg
[coveralls-url]: https://coveralls.io/r/pierreinglebert/gulp-zopfli?branch=master
[dep-image]: https://img.shields.io/david/pierreinglebert/gulp-zopfli.svg
[dep-url]: https://david-dm.org/pierreinglebert/gulp-zopfli
[devDep-image]: https://img.shields.io/david/dev/pierreinglebert/gulp-zopfli.svg
[devDep-url]: https://david-dm.org/pierreinglebert/gulp-zopfli#info=devDependencies
