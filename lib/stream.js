'use strict';

var zopfli   = require('node-zopfli-es');
var through2 = require('through2');
var toArray  = require('stream-to-array');

module.exports = function(contents, options, callback) {
  if (!['gzip', 'deflate', 'zlib'].includes(options.format)) return callback("incorrect format : " + options.format, null, false);

  var compressStream = new zopfli(options.format, options.zopfliOptions);

  // Check if the threshold option is set
  if (options.threshold) {
    // Check if the stream contents is less than the threshold
    toArray(contents, function (err, chunks) {
      if (err) {
        callback(err, null, false);
        return;
      }

      // Join chunks array into a single buffer
      var buffer = Buffer.concat(chunks);

      // Create a stream to return to the callback
      var contentStream = through2();
      contentStream.end(buffer);

      // Check if the stream content length is less than the threshold
      if (buffer.length < options.threshold) {
        // File does not meet the minimum size requirement for compression
        callback(null, contentStream, false);
      } else {
        // File meets the minimum size requirement for compression
        callback(null, contentStream.pipe(compressStream), true);
      }
    });
  } else {
    // Compress the file contents
    callback(null, contents.pipe(compressStream), true);
  }
};
