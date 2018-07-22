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

  // Compress the contents
  var compressStream;
  if(options.format === 'gzip') {
    compressStream = zopfli.createGzip(options.zopfliOptions);
  } else if(options.format === 'deflate') {
    compressStream = zopfli.createDeflate(options.zopfliOptions);
  } else if(options.format === 'zlib') {
    compressStream = zopfli.createZlib(options.zopfliOptions);
  } else {
    callback("incorrect format : " + options.format, null, false);
    return;
  }
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
