'use strict';

const through2 = require('through2');
const PluginError = require('plugin-error');
const bufferMode = require('./lib/buffer');
const streamMode = require('./lib/stream');
const bytes = require('bytes');

const PLUGIN_NAME = 'gulp-zopfli';

/**
 *
 * @param {Object} options
 * @param {String} options.format gzip || deflate || zlib
 * @param {Number} options.thresholdRatio if compression ratio does not reach the threshold,
 * does not compress, default to 0
 * @param {String} options.thresholdBehavior if compression ratio does not reach the threshold,
 * "original" to output original file, or
 * "blank" (default) to output nothing
 * @returns {Stream}
 */
module.exports = function (options = {}) {
  options = {
    format: 'gzip',
    append: true,
    threshold: false,
    zopfliOptions: {},
    ...options
  };
  if (options.threshold) {
    if (typeof options.threshold != 'number') {
      if (typeof options.threshold == 'string') {
        options.threshold = bytes(options.threshold) || 150;
      } else {
        options.threshold = 150;
      }
    }
    options.threshold = Math.max(1, options.threshold);
  }

  let ext = '';
  if (options.append) {
    if (options.format === 'gzip') {
      ext = '.gz';
    } else if (options.format === 'deflate') {
      ext = '.deflate';
    } else if (options.format === 'zlib') {
      ext = '.zz';
    }
  }

  const stream = through2.obj(compress);
  stream.options = options;

  function compress(file, enc, done) {
    /*jshint validthis: true */
    var self = this;

    // Check for empty file
    if (file.isNull()) {
      // Pass along the empty file to the next plugin
      this.push(file);
      done();
      return;
    }

    // Call when finished with compression
    const finished = function (err, contents, wasCompressed) {
      if (err) {
        const error = new PluginError(PLUGIN_NAME, err, { showStack: true });
        self.emit('error', error);
        done();
        return;
      }
      if (options.append && wasCompressed) file.path += ext;
      file.contents = contents;
      self.push(file);
      done();
    };

    // Check if file contents is a buffer or a stream
    if (file.isBuffer()) {
      bufferMode(file.contents, options, finished);
    } else {
      streamMode(file.contents, options, finished);
    }
  }

  return stream;
};
