'use strict';

var zopfli   = require('node-zopfli-es');
var Readable = require('stream').Readable;
var toArray  = require('stream-to-array');

module.exports = function(contents, options, callback) {
  // Check if the threshold option is set
  // If true, check if the buffer length is greater than the threshold
  if (options.threshold && contents.length < options.threshold) {
    // File size is smaller than the threshold
    // Pass it along to the next plugin without compressing
    callback(null, contents, false);
    return;
  }

  // Create a readable stream out of the contents
  var rs = new Readable({ objectMode: true });
  rs._read = function() {
    rs.push(contents);
    rs.push(null);
  };

  if (!['gzip', 'deflate', 'zlib'].includes(options.format)) return callback("incorrect format : " + options.format, null, false);

  var compressStream = new zopfli(options.format, options.zopfliOptions);

  rs.pipe(compressStream);

  // Turn gzip stream back into a buffer
  toArray(compressStream, function (err, chunks) {
    if (err) {
      callback(err, null, false);
      return;
    }

    callback(null, Buffer.concat(chunks), true);
    return;
  });
};
