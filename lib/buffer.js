'use strict';

const through2 = require('through2');
const zopfli = require('@gfx/zopfli');
const Readable = require('stream').Readable;
const toArray = require('stream-to-array');
const compress = require('./compress');

module.exports = function (contents, options, callback) {
  // Check if the threshold option is set
  // If true, check if the buffer length is greater than the threshold
  if (options.threshold && contents.length < options.threshold) {
    // File size is smaller than the threshold
    // Pass it along to the next plugin without compressing
    callback(null, contents, false);
    return;
  }

  // Create a readable stream out of the contents
  const rs = new Readable({ objectMode: true });
  rs._read = function () {
    rs.push(contents);
    rs.push(null);
  };

  // Compress the contents
  const compressStream = compress(options, callback);
  if (!compressStream) return;
  rs.pipe(compressStream);

  // Turn gzip stream back into a buffer
  toArray(compressStream, function (err, chunks) {
    if (err) {
      callback(err, null, false);
      return;
    }

    callback(null, Buffer.concat(chunks), true);
  });
};
