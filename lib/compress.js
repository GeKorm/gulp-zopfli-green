const zopfli = require('@gfx/zopfli');
const through2 = require('through2');

const formats = ['gzip', 'deflate', 'zlib'];

module.exports = ({ format, zopfliOptions }, callback) => {
  if (!formats.includes(format)) {
    callback('incorrect format : ' + format, null, false);
    return;
  }

  return through2.obj((file, encoding, cb) => {
    zopfli[format](file, zopfliOptions, cb);
  });
};
