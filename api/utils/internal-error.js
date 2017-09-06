"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = InternalError;
function InternalError(msg, code) {
  var err = new Error(msg);
  err.code = code || 500;
  return err;
}