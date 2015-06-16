Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/* @flow */
/** @module watch */

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _DirectoryWatcher = require('./DirectoryWatcher');

var _lodashFunctionDebounce = require('lodash/function/debounce');

var _lodashFunctionDebounce2 = _interopRequireDefault(_lodashFunctionDebounce);

/**
 * A convenience shortcut method for starting a watcher
 *
 * @memberOf module:watch
 * @param {string}           dir      - A directory name to watch for changes in
 * @param {string}           type     - A file extension to watch for
 * @param {Function}         callback - A callback function to execute whenever a file system change occurs
 * @param {...Array<string>} exclude  - The rest of the arguments, if any, - the file as well as directory names to
 *                                      exclude
 */

exports.default = function (dir, type, callback, ...exclude) {
  _fs2.default.realpath(dir, function getDirectoryRealPath(e, directory) {
    if (e) {
      return console.error(e);
    }

    /*eslint-disable no-new*/
    new _DirectoryWatcher.DirectoryWatcher(directory, new RegExp('.' + type + '$'), exclude, (0, _lodashFunctionDebounce2.default)(callback, 150));

    /*eslint-enable no-new*/
  });
};

module.exports = exports.default;