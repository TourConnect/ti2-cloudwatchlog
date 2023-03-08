const R = require('ramda');
const sizeInKB = require('./kbsize.js');

const limitObjectSize = (obj, maxBytes) => {
  // Get the current size of the object
  const initialSize = JSON.stringify(obj).length;

  // Check if the object is already within the byte limit
  if (initialSize <= maxBytes) {
    return obj;
  }

  let propsBySize = getSize('', obj);

  // Sort the object properties by size
  propsBySize.sort((a, b) => b[1] - a[1]);

  // Remove the largest attributes until the object is within the byte limit
  let trimmedObj = R.clone(obj);
  for (const [key, size] of propsBySize) {
    const pathName = key.split('.');
    const valueEval = JSON.stringify(R.path(pathName, trimmedObj));
    const keyEval = JSON.stringify(key);
    if (sizeInKB(valueEval) > sizeInKB(keyEval)) {
      // remove the value
      trimmedObj = R.modifyPath(pathName, e => '...' , trimmedObj); 
    } else {
      // remove the name
      trimmedObj = R.dissocPath(pathName, trimmedObj); 
    }
    const newSize = sizeInKB(JSON.stringify(trimmedObj));
    if (newSize <= maxBytes) {
      break;
    }
  }
  return trimmedObj;
}

const getSize  = (parent, obj) => {
  let returnValue = [];
  Object.entries(obj).forEach(([attribute, value]) => {
    const descriptor = [parent, attribute].filter(e => e !== '').join('.');
    if (typeof value === 'object') {
      returnValue = returnValue.concat(getSize(descriptor, value));
    } else {
      returnValue.push([descriptor, sizeInKB(JSON.stringify(descriptor + value))])
    }
  });
  return returnValue;
}

module.exports =  { limitObjectSize };
