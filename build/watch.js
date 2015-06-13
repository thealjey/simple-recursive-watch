'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

exports.__esModule = true;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _DirectoryWatcher = require('./DirectoryWatcher');

var _lodashFunctionDebounce = require('lodash/function/debounce');

var _lodashFunctionDebounce2 = _interopRequireDefault(_lodashFunctionDebounce);

exports['default'] = function (dir, type, callback) {
  for (var _len = arguments.length, exclude = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
    exclude[_key - 3] = arguments[_key];
  }

  _fs2['default'].realpath(dir, function (e, directory) {
    if (e) {
      return callback(e);
    }
    callback(null, new _DirectoryWatcher.DirectoryWatcher(directory, new RegExp('.' + type + '$'), exclude, (0, _lodashFunctionDebounce2['default'])(callback, 150)));
  });
};

module.exports = exports['default'];