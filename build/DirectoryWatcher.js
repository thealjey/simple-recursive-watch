'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var _bind = Function.prototype.bind;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _fs = require('fs');

var _path = require('path');

var _events = require('events');

/**
 * `fs.watch` wrapper class (extends EventEmitter) with the reliable recursive watching capabilities
 *
 * @class
 * @param {string}    dir     - a full system path to a directory
 * @param {RegExp}    type    - a regular expression to match files
 * @param {...string} exclude - files/directories to exclude (not full paths, just file/directory names)
 * @fires DirectoryWatcher#change
 * @example
 * import {DirectoryWatcher} from 'simple-recursive-watch';
 * import {join} from 'path';
 *
 * let libDir = join(__dirname, 'lib'),
 *     watcher = new DirectoryWatcher(libDir, /\.js$/, 'ignoreMe.js');
 */

var DirectoryWatcher = (function (_EventEmitter) {
  _inherits(DirectoryWatcher, _EventEmitter);

  function DirectoryWatcher(dir, type) {
    _classCallCheck(this, DirectoryWatcher);

    _get(Object.getPrototypeOf(DirectoryWatcher.prototype), 'constructor', this).call(this);

    /**
     * a full system path to a directory
     *
     * @memberof DirectoryWatcher
     * @protected
     * @instance
     * @type {string}
     */
    this.dir = dir;

    /**
     * a regular expression to match files
     *
     * @memberof DirectoryWatcher
     * @protected
     * @instance
     * @type {RegExp}
     */
    this.type = type;

    /**
     * files/directories to exclude
     *
     * @memberof DirectoryWatcher
     * @protected
     * @instance
     * @type {Array<string>}
     */

    for (var _len = arguments.length, exclude = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      exclude[_key - 2] = arguments[_key];
    }

    this.exclude = exclude;

    /**
     * a collection of known files in this directory
     *
     * @memberof DirectoryWatcher
     * @private
     * @instance
     * @type {Array<string>}
     */
    this.files = [];

    /**
     * A collection of child watchers
     *
     * @memberof DirectoryWatcher
     * @private
     * @instance
     * @type {Array<DirectoryWatcher>}
     */
    this.children = [];
  }

  /**
   * Searches for a child watcher with a specific directory name.
   *
   * @memberof DirectoryWatcher
   * @private
   * @instance
   * @method indexOf
   * @param  {string} dir - a directory name to search for
   * @return {number} an index of a child watcher assigned to a directory, or -1 if not found
   */

  _createClass(DirectoryWatcher, [{
    key: 'indexOf',
    value: function indexOf(dir) {
      var i = this.children.length;

      while (i--) {
        if (dir === this.children[i].dir) {
          return i;
        }
      }
      return -1;
    }

    /**
     * Handles the "rename" system event for a file
     *
     * @memberof DirectoryWatcher
     * @private
     * @instance
     * @method handleEvent
     * @param {string} file     - a base name of a file/directory that triggered the event
     * @param {string} location - a full system path to "file"
     */
  }, {
    key: 'handleEvent',
    value: function handleEvent(file, location) {
      var _this = this;

      (0, _fs.stat)(location, function (e, stats) {
        var i = undefined;

        if (e) {
          i = _this.files.indexOf(file);
          if (-1 !== i) {
            _this.files.splice(i, 1);
            _this.emit('change');
            return;
          }
          i = _this.indexOf(location);
          if (-1 !== i) {
            _this.children[i].stop();
            _this.children.splice(i, 1);
            _this.emit('change');
          }
          return;
        }
        if (stats.isDirectory()) {
          i = _this.indexOf(location);
          if (-1 === i) {
            _this.children.push(_this.createChild(location));
            return;
          }
          _this.children[i].stop();
          _this.children.splice(i, 1);
        } else {
          if (!_this.type.test(file)) {
            return;
          }
          i = _this.files.indexOf(file);
          if (-1 === i) {
            _this.files.push(file);
          } else {
            _this.files.splice(i, 1);
          }
        }
        _this.emit('change');
      });
    }

    /**
     * Creates, starts and returns a new child DirectoryWatcher
     *
     * @memberof DirectoryWatcher
     * @private
     * @instance
     * @method createChild
     * @param  {string} location - a full system path to a child directory
     * @return {DirectoryWatcher}  a newly created child DirectoryWatcher
     */
  }, {
    key: 'createChild',
    value: function createChild(location) {
      var child = new (_bind.apply(DirectoryWatcher, [null].concat([location, this.type], _toConsumableArray(this.exclude))))();

      child.start();
      child.on('change', this.emit.bind(this, 'change'));
      return child;
    }

    /**
     * Scans the directory for the sub-directories and creates a list of child DirectoryWatcher instances
     *
     * @memberof DirectoryWatcher
     * @private
     * @instance
     * @method createChildren
     */
  }, {
    key: 'createChildren',
    value: function createChildren() {
      var _this2 = this;

      (0, _fs.readdir)(this.dir, function (e, contents) {
        if (e) {
          return console.error(e);
        }
        _this2.children = contents.filter(function (file) {
          if (-1 !== _this2.exclude.indexOf(file)) {
            return false;
          }
          if ((0, _fs.statSync)((0, _path.join)(_this2.dir, file)).isDirectory()) {
            return true;
          }
          if (_this2.type.test(file)) {
            _this2.files.push(file);
          }
          return false;
        }).map(function (file) {
          return _this2.createChild((0, _path.join)(_this2.dir, file));
        });
        _this2.createTask();
      });
    }

    /**
     * Creates the `fs.watch` task
     *
     * @memberof DirectoryWatcher
     * @private
     * @instance
     * @method createTask
     */
  }, {
    key: 'createTask',
    value: function createTask() {
      var _this3 = this;

      /**
       * a native FSWatcher instance
       *
       * @memberof DirectoryWatcher
       * @private
       * @instance
       * @type {FSWatcher}
       */
      this.task = (0, _fs.watch)(this.dir, function (event, file) {
        if (-1 !== _this3.exclude.indexOf(file)) {
          return;
        }
        if ('rename' === event) {
          _this3.handleEvent(file, (0, _path.join)(_this3.dir, file));
        } else if (_this3.type.test(file)) {
          _this3.emit('change');
        }
      });
    }

    /**
     * Starts the watcher
     *
     * @memberof DirectoryWatcher
     * @instance
     * @method start
     * @example
     * watcher.on('change', function () {
     *   // some JavaScript file, not named "ignoreMe.js", was changed in the "lib" directory
     * });
     * watcher.start();
     */
  }, {
    key: 'start',
    value: function start() {
      if (this.task) {
        console.error('already started');
      } else {
        this.createChildren();
      }
    }

    /**
     * Stops the watcher
     *
     * @memberof DirectoryWatcher
     * @instance
     * @method stop
     * @example
     * watcher.stop();
     */
  }, {
    key: 'stop',
    value: function stop() {
      if (this.task) {
        this.task.close();
        this.children.forEach(function (child) {
          child.stop();
        });
        this.children = [];
      } else {
        console.error('not running');
      }
    }

    /**
     * A convenience shortcut method for starting a watcher
     *
     * @memberof DirectoryWatcher
     * @static
     * @method watch
     * @param {string}    dir       - a full system path to a directory
     * @param {string}    extension - a file extension to watch for
     * @param {Function}  callback  - a callback function to execute whenever a file system change occurs
     * @param {...string} exclude   - files/directories to exclude (not full paths, just file/directory names)
     * @return {DirectoryWatcher} a watcher instance
     * @example
     * let watcher = DirectoryWatcher.watch(libDir, 'js', function () {
     *   // some JavaScript file, not named "ignoreMe.js", was changed in the "lib" directory
     * }, 'ignoreMe.js');
     */
  }], [{
    key: 'watch',
    value: function watch(dir, extension, callback) {
      for (var _len2 = arguments.length, exclude = Array(_len2 > 3 ? _len2 - 3 : 0), _key2 = 3; _key2 < _len2; _key2++) {
        exclude[_key2 - 3] = arguments[_key2];
      }

      var watcher = new (_bind.apply(DirectoryWatcher, [null].concat([dir, new RegExp('\\.' + extension + '$')], exclude)))();

      watcher.start();
      watcher.on('change', callback);
      return watcher;
    }
  }]);

  return DirectoryWatcher;
})(_events.EventEmitter);

exports['default'] = DirectoryWatcher;
module.exports = exports['default'];