"use strict";
// Small deterministic string hash (FNV-1a). Used so demo ETAs and demo drivers stay stable between refreshes.
module.exports = function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
