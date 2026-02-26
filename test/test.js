const fs = require('fs');
const gulp = require('gulp');
const zopfli = require('../');
const nid = require('nid');
const rename = require('gulp-rename');
const should = require('should');
const Stream = require('stream');
const tap = require('gulp-tap');
const zlib = require('zlib');

// monkeys are fixing cwd for gulp-mocha
// node lives in one process/scope/directory
process.chdir('./test');

describe('gulp-zopfli', function () {
  describe('plugin level', function () {
    describe('config', function () {
      it('should have default config', function (done) {
        var instance = zopfli();
        instance.options.should.eql({
          format: 'gzip',
          append: true,
          threshold: false,
          zopfliOptions: {}
        });
        done();
      });

      it('should merge options with defaults', function (done) {
        var instance = zopfli({ append: false });
        instance.options.should.eql({
          append: false,
          zopfliOptions: {},
          threshold: false,
          format: 'gzip'
        });
        done();
      });

      it('should set threshold to false while receiving false', function (done) {
        var instance = zopfli({ threshold: false });
        instance.options.threshold.should.be.false;
        done();
      });

      it('should set threshold to 150 while receiving true', function (done) {
        var instance = zopfli({ threshold: true });
        instance.options.threshold.should.eql(150);
        done();
      });

      it('should set threshold to Number while receiving Number', function (done) {
        var instance = zopfli({ threshold: 1024 });
        instance.options.should.have.property('threshold', 1024);
        done();
      });

      it('should set threshold to 150 while receiving Number < 150', function (done) {
        var instance = zopfli({ threshold: -1 });
        instance.options.should.have.property('threshold', 1);
        done();
      });

      it('should set threshold to Number while receiving String (bytes result)', function (done) {
        var instance = zopfli({ threshold: '1kb' });
        instance.options.should.have.property('threshold', 1024);
        done();
      });

      it('should set threshold to 150 while receiving String (bytes fallback)', function (done) {
        var instance = zopfli({ threshold: 'not-a-size' });
        instance.options.should.have.property('threshold', 150);
        done();
      });

      it('should set threshold to 150 while receiving strange things', function (done) {
        var instance = zopfli({ threshold: {} });
        instance.options.should.have.property('threshold', 150);
        done();
      });

      it('should set zopfliOptions', function (done) {
        var instance = zopfli({
          zopfliOptions: {
            verbose: true,
            numiterations: 50
          }
        });
        instance.options.should.have.property('zopfliOptions');
        instance.options.zopfliOptions.should.have.property('verbose', true);
        instance.options.zopfliOptions.should.have.property(
          'numiterations',
          50
        );
        done();
      });
    });
  });

  describe('handler level', function () {
    describe('file extension', function () {
      it('should append .gz to the file extension, by default', function (done) {
        gulp
          .src('files/small.txt')
          .pipe(zopfli())
          .pipe(
            tap(function (file) {
              console.log('result::::::::');
              console.log(file.path);
              file.path.should.endWith('.gz');
              done();
            })
          );
      });

      it('should append .zz to the file extension receiving { format: zlib }', function (done) {
        gulp
          .src('files/small.txt')
          .pipe(zopfli({ format: 'zlib' }))
          .pipe(
            tap(function (file) {
              file.path.should.endWith('.zz');
              done();
            })
          );
      });

      it('should append .deflate to the file extension receiving { format: deflate }', function (done) {
        gulp
          .src('files/small.txt')
          .pipe(zopfli({ format: 'deflate' }))
          .pipe(
            tap(function (file) {
              file.path.should.endWith('.deflate');
              done();
            })
          );
      });

      it('should not append .gz to the file extension receiving { append: false }', function (done) {
        gulp
          .src('files/small.txt')
          .pipe(zopfli({ append: false }))
          .pipe(
            tap(function (file) {
              file.path.should.not.endWith('.gz');
              done();
            })
          );
      });
    });

    it('should pass through files with null contents', function (done) {
      gulp
        .src('files/small.txt', { read: false })
        .pipe(zopfli())
        .pipe(
          tap(function (file) {
            file.isNull().should.be.true();
            file.path.should.endWith('.txt');
            should.not.exist(file.contents);
            done();
          })
        );
    });

    describe('buffer mode', function () {
      it('should create file with .gz extension, by default', function (done) {
        var id = nid();
        var out = gulp.dest('tmp');

        out.on('end', function () {
          fs.readFile('./tmp/' + id + '.txt.gz', function (err, file) {
            should.not.exist(err);
            should.exist(file);
            file.should.not.be.empty;
            done();
          });
        });

        gulp
          .src('files/small.txt')
          .pipe(rename({ basename: id }))
          .pipe(zopfli())
          .pipe(out);
      });

      it('should create file without .gz extension when { append: false }', function (done) {
        var id = nid();
        var out = gulp.dest('tmp');

        out.on('end', function () {
          fs.readFile('./tmp/' + id + '.txt', function (err, file) {
            should.not.exist(err);
            should.exist(file);
            file.should.not.be.empty;
            done();
          });
        });

        gulp
          .src('files/small.txt')
          .pipe(rename({ basename: id }))
          .pipe(zopfli({ append: false }))
          .pipe(out);
      });

      it('should return file contents as a Buffer', function (done) {
        gulp
          .src('files/small.txt')
          .pipe(zopfli())
          .pipe(
            tap(function (file) {
              file.contents.should.be.instanceof(Buffer);
              done();
            })
          );
      });

      it('should return file contents as a Buffer while handling threshold', function (done) {
        gulp
          .src('files/big.txt')
          .pipe(zopfli({ threshold: '1kb' }))
          .pipe(
            tap(function (file) {
              file.contents.should.be.instanceof(Buffer);
              done();
            })
          );
      });

      it('should match original when result being uncompressed', function (done) {
        var id = nid();
        var out = gulp.dest('tmp');

        out.on('end', function () {
          fs.readFile('./tmp/' + id + '.txt.gz', function (err, file) {
            zlib.unzip(file, function (err, buffer) {
              file = buffer.toString('utf-8', 0, buffer.length);

              fs.readFile(
                './files/small.txt',
                { encoding: 'utf-8' },
                function (err, original) {
                  file.should.equal(original);
                  done();
                }
              );
            });
          });
        });

        gulp
          .src('files/small.txt')
          .pipe(rename({ basename: id }))
          .pipe(zopfli())
          .pipe(out);
      });

      it('should handle threshold of 1kb by passing through small.txt (<1kb)', function (done) {
        var id = nid();
        var out = gulp.dest('tmp');

        out.on('end', function () {
          fs.readFile(
            './tmp/' + id + '.txt',
            { encoding: 'utf-8' },
            function (err, file) {
              fs.readFile(
                './files/small.txt',
                { encoding: 'utf-8' },
                function (err, original) {
                  file.should.equal(original);
                  done();
                }
              );
            }
          );
        });

        gulp
          .src('files/small.txt')
          .pipe(rename({ basename: id }))
          .pipe(zopfli({ threshold: '1kb' }))
          .pipe(out);
      });

      it('should handle threshold of 1kb by compressing big.txt (>1kb)', function (done) {
        var id = nid();
        var out = gulp.dest('tmp');

        out.on('end', function () {
          fs.readFile('./tmp/' + id + '.txt.gz', function (err, file) {
            zlib.unzip(file, function (err, buffer) {
              file = buffer.toString('utf-8');

              fs.readFile(
                './files/big.txt',
                { encoding: 'utf-8' },
                function (err, original) {
                  file.should.equal(original);
                  done();
                }
              );
            });
          });
        });

        gulp
          .src('files/big.txt')
          .pipe(rename({ basename: id }))
          .pipe(zopfli({ threshold: '1kb' }))
          .pipe(out);
      });

      it('should throw an error when given an incorrect format', function (done) {
        const srcStream = gulp.src('files/small.txt');

        // Add an empty error handler to catch the backward-propagated streamx error
        srcStream.on('error', function () {});

        srcStream
          .pipe(zopfli({ format: '7z' }))
          .on('error', function (err) {
            // The original plugin error is caught here as normal
            err.should.not.be.null;
            done();
          })
          .pipe(
            tap(function (file) {
              false.should.be.true;
              done();
            })
          );
      });

      it('should return callback error when compressed buffer stream fails', function (done) {
        const bufferPath = require.resolve('../lib/buffer');
        const compressPath = require.resolve('../lib/compress');
        const originalCompress = require(compressPath);

        require.cache[compressPath].exports = function () {
          const fakeCompressStream = new Stream.PassThrough({
            objectMode: true
          });
          process.nextTick(function () {
            fakeCompressStream.emit('error', new Error('boom'));
          });
          return fakeCompressStream;
        };

        delete require.cache[bufferPath];
        const bufferMode = require('../lib/buffer');

        bufferMode(
          Buffer.from('content'),
          {},
          function (err, contents, wasCompressed) {
            require.cache[compressPath].exports = originalCompress;
            delete require.cache[bufferPath];

            should.exist(err);
            should.not.exist(contents);
            wasCompressed.should.be.false();
            done();
          }
        );
      });
    });

    describe('stream mode', function () {
      it('should create file with .gz extension, by default', function (done) {
        var id = nid();
        var out = gulp.dest('tmp');

        out.on('end', function () {
          fs.readFile('./tmp/' + id + '.txt.gz', function (err, file) {
            should.not.exist(err);
            should.exist(file);
            file.should.not.be.empty;
            done();
          });
        });

        gulp
          .src('files/small.txt', { buffer: false })
          .pipe(rename({ basename: id }))
          .pipe(zopfli())
          .pipe(out);
      });

      it('should create file without .gz extension when { append: false }', function (done) {
        var id = nid();
        var out = gulp.dest('tmp');

        out.on('end', function () {
          fs.readFile('./tmp/' + id + '.txt', function (err, file) {
            should.not.exist(err);
            should.exist(file);
            file.should.not.be.empty;
            done();
          });
        });

        gulp
          .src('files/small.txt', { buffer: false })
          .pipe(rename({ basename: id }))
          .pipe(zopfli({ append: false }))
          .pipe(out);
      });

      it('should return file contents as a Stream', function (done) {
        gulp
          .src('files/small.txt', { buffer: false })
          .pipe(zopfli())
          .pipe(
            tap(function (file) {
              file.contents.should.be.instanceof(Stream);
              done();
            })
          );
      });

      it('should return file contents as a Stream while handling threshold', function (done) {
        gulp
          .src('files/small.txt', { buffer: false })
          .pipe(zopfli({ threshold: '1kb' }))
          .pipe(
            tap(function (file) {
              file.contents.should.be.instanceof(Stream);
              done();
            })
          );
      });

      it('should match original when result being uncompressed (gzip)', function (done) {
        var id = nid();
        var out = gulp.dest('tmp');

        out.on('end', function () {
          fs.readFile('./tmp/' + id + '.txt.gz', function (err, file) {
            zlib.unzip(file, function (err, buffer) {
              file = buffer.toString('utf-8', 0, buffer.length);

              fs.readFile(
                './files/small.txt',
                { encoding: 'utf-8' },
                function (err, original) {
                  file.should.equal(original);
                  done();
                }
              );
            });
          });
        });

        gulp
          .src('files/small.txt', { buffer: false })
          .pipe(rename({ basename: id }))
          .pipe(zopfli())
          .pipe(out);
      });

      it('should match original when result being uncompressed (zlib)', function (done) {
        var id = nid();
        var out = gulp.dest('tmp');

        out.on('end', function () {
          fs.readFile('./tmp/' + id + '.txt.zz', function (err, file) {
            zlib.inflate(file, function (err, buffer) {
              file = buffer.toString('utf-8', 0, buffer.length);

              fs.readFile(
                './files/small.txt',
                { encoding: 'utf-8' },
                function (err, original) {
                  file.should.equal(original);
                  done();
                }
              );
            });
          });
        });

        gulp
          .src('files/small.txt', { buffer: false })
          .pipe(rename({ basename: id }))
          .pipe(zopfli({ format: 'zlib' }))
          .pipe(out);
      });

      it('should match original when result being uncompressed (deflate)', function (done) {
        var id = nid();
        var out = gulp.dest('tmp');

        out.on('end', function () {
          fs.readFile('./tmp/' + id + '.txt.deflate', function (err, file) {
            zlib.inflateRaw(file, function (err, buffer) {
              file = buffer.toString('utf-8', 0, buffer.length);

              fs.readFile(
                './files/small.txt',
                { encoding: 'utf-8' },
                function (err, original) {
                  file.should.equal(original);
                  done();
                }
              );
            });
          });
        });

        gulp
          .src('files/small.txt', { buffer: false })
          .pipe(rename({ basename: id }))
          .pipe(zopfli({ format: 'deflate' }))
          .pipe(out);
      });

      it('should handle threshold of 1kb by passing through small.txt (<1kb)', function (done) {
        var id = nid();
        var out = gulp.dest('tmp');

        out.on('end', function () {
          fs.readFile(
            './tmp/' + id + '.txt',
            { encoding: 'utf-8' },
            function (err, file) {
              fs.readFile(
                './files/small.txt',
                { encoding: 'utf-8' },
                function (err, original) {
                  file.should.equal(original);
                  done();
                }
              );
            }
          );
        });

        gulp
          .src('files/small.txt', { buffer: false })
          .pipe(rename({ basename: id }))
          .pipe(zopfli({ threshold: '1kb' }))
          .pipe(out);
      });

      it('should handle threshold of 1kb by compressing big.txt (>1kb)', function (done) {
        var id = nid();
        var out = gulp.dest('tmp');

        out.on('end', function () {
          fs.readFile('./tmp/' + id + '.txt.gz', function (err, file) {
            zlib.unzip(file, function (err, buffer) {
              file = buffer.toString('utf-8');

              fs.readFile(
                './files/big.txt',
                { encoding: 'utf-8' },
                function (err, original) {
                  file.should.equal(original);
                  done();
                }
              );
            });
          });
        });

        gulp
          .src('files/big.txt', { buffer: false })
          .pipe(rename({ basename: id }))
          .pipe(zopfli({ threshold: '1kb' }))
          .pipe(out);
      });

      it('should throw an error when given an incorrect format', function (done) {
        const srcStream = gulp.src('files/small.txt', { buffer: false });

        // Add an empty error handler to catch the backward-propagated streamx error
        srcStream.on('error', function () {});

        srcStream
          .pipe(zopfli({ format: '7z' }))
          .on('error', function (err) {
            // The original plugin error is caught here as normal
            err.should.not.be.null;
            done();
          })
          .pipe(
            tap(function (file) {
              false.should.be.true;
              done();
            })
          );
      });

      it('should return callback error when reading stream contents fails', function (done) {
        const streamMode = require('../lib/stream');
        const brokenStream = new Stream.PassThrough();

        streamMode(
          brokenStream,
          { format: 'gzip', zopfliOptions: {}, threshold: 1 },
          function (err, contents, wasCompressed) {
            should.exist(err);
            should.not.exist(contents);
            wasCompressed.should.be.false();
            done();
          }
        );

        process.nextTick(function () {
          brokenStream.emit('error', new Error('boom'));
        });
      });
    });

    describe('preserve file properties', function () {
      it('should not lose any properties from the Vinyl file', function (done) {
        gulp
          .src('files/small.txt')
          .pipe(
            tap(function (file) {
              file.test = 'test';
            })
          )
          .pipe(zopfli())
          .pipe(
            tap(function (file) {
              file.should.have.property('test', 'test');
              done();
            })
          );
      });
    });

    describe('zopfli options', function () {
      it('should handle compression level in buffer mode', function (done) {
        var id_lowest_compression = nid();
        var id_highest_compression = nid();

        var out_lowest_compression = gulp.dest('tmp');
        var out_highest_compression = gulp.dest('tmp');

        var size_lowest_compression = 0;
        var size_highest_compression = 0;

        out_lowest_compression.on('end', function () {
          fs.stat(
            './tmp/' + id_lowest_compression + '.txt.gz',
            function (err, stats) {
              size_lowest_compression = stats.size;

              if (size_highest_compression > 0) {
                size_highest_compression.should.be.lessThan(
                  size_lowest_compression
                );
                done();
              }
            }
          );
        });

        out_highest_compression.on('end', function () {
          fs.stat(
            './tmp/' + id_highest_compression + '.txt.gz',
            function (err, stats) {
              size_highest_compression = stats.size;

              if (size_lowest_compression > 0) {
                size_highest_compression.should.be.lessThan(
                  size_lowest_compression
                );
                done();
              }
            }
          );
        });

        gulp
          .src('files/big.txt')
          .pipe(rename({ basename: id_lowest_compression }))
          .pipe(zopfli({ zopfliOptions: { numiterations: 1 } }))
          .pipe(out_lowest_compression);

        gulp
          .src('files/big.txt')
          .pipe(rename({ basename: id_highest_compression }))
          .pipe(zopfli({ zopfliOptions: { numiterations: 50 } }))
          .pipe(out_highest_compression);
      });

      it('should handle compression level in stream mode', function (done) {
        var id_lowest_compression = nid();
        var id_highest_compression = nid();

        var out_lowest_compression = gulp.dest('tmp');
        var out_highest_compression = gulp.dest('tmp');

        var size_lowest_compression = 0;
        var size_highest_compression = 0;

        out_lowest_compression.on('end', function () {
          fs.stat(
            './tmp/' + id_lowest_compression + '.txt.gz',
            function (err, stats) {
              size_lowest_compression = stats.size;
              if (size_highest_compression > 0) {
                size_highest_compression.should.be.lessThan(
                  size_lowest_compression
                );
                done();
              }
            }
          );
        });

        out_highest_compression.on('end', function () {
          fs.stat(
            './tmp/' + id_highest_compression + '.txt.gz',
            function (err, stats) {
              size_highest_compression = stats.size;
              if (size_lowest_compression > 0) {
                size_highest_compression.should.be.lessThan(
                  size_lowest_compression
                );
                done();
              }
            }
          );
        });
        gulp
          .src('files/big.txt', { buffer: false })
          .pipe(rename({ basename: id_lowest_compression }))
          .pipe(zopfli({ zopfliOptions: { numiterations: 1 } }))
          .pipe(out_lowest_compression);

        gulp
          .src('files/big.txt', { buffer: false })
          .pipe(rename({ basename: id_highest_compression }))
          .pipe(zopfli({ zopfliOptions: { numiterations: 50 } }))
          .pipe(out_highest_compression);
      });
    });
  });
});
