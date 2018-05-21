import "babel-polyfill";
Array.prototype.getIndexBy = function (name, value) {
  for (var i = 0; i < this.length; i++) {
    if (this[i][name] == value) {
      return i;
    }
  }
  return -1;
};
Array.prototype.getItemBy = function (name, value) {
  let index = -1;
  for (var i = 0; i < this.length; i++) {
    if (this[i][name] == value) {
      index = i;
      break;
    }
  }
  if (index !== -1) return this[index];
  else return null;
};