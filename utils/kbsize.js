const { Blob } = require('buffer');

const sizeInKB = str => {
  const blob = new Blob([str]);
  const sizeInBytes = blob.size;
  const sizeInKilobytes = sizeInBytes / 1024;
  return sizeInKilobytes;
}

module.exports = sizeInKB;
