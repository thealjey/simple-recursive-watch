Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/* @flow */

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

/**
 * A simple `fs.watch` wrapper class
 *
 * @class
 * @param {string}        dir      - A full system path to a directory
 * @param {RegExp}        type     - A regular expression to match files
 * @param {Array<string>} exclude  - An array of file and directory names to exclude
 * @param {Function}      callback - A callback function
 */

let DirectoryWatcher = (function () {

  /**
   * Instantiates and starts the watcher
   *
   * @param {string}        dir      - A full system path to a directory
   * @param {RegExp}        type     - A regular expression to match files
   * @param {Array<string>} exclude  - An array of file and directory names to exclude
   * @param {Function}      callback - A callback function
   */

  function DirectoryWatcher(dir, type, exclude, callback) {
    var _this = this;

    _classCallCheck(this, DirectoryWatcher);

    var files = [];

    /**
     * A full system path to a directory
     *
     * @memberof DirectoryWatcher
     * @instance
     * @type {string}
     */
    this.dir = dir;
    _fs2.default.readdir(dir, function (e, contents) {
      if (e) {
        return console.error(e);
      }

      /**
       * A collection of child watchers
       *
       * @memberof DirectoryWatcher
       * @private
       * @instance
       * @type {Array<DirectoryWatcher>}
       */
      _this.children = contents.filter(

      /**
       * Executed for each entry in the directory contents
       *
       * @param  {string} file - A file or directory name
       * @return {boolean} if false the entry will be filtered out
       */
      function loopContents(file) {
        if (-1 !== exclude.indexOf(file)) {
          return false;
        }
        if (_fs2.default.statSync('' + dir + '/' + file).isDirectory()) {
          return true;
        }
        if (type.test(file)) {
          files.push(file);
        }
        return false;
      }).map(function (file) {
        return new DirectoryWatcher('' + dir + '/' + file, type, exclude, callback);
      });

      /**
       * The `fs.FSWatcher` task
       *
       * @memberof DirectoryWatcher
       * @private
       * @instance
       * @type {FSWatcher}
       */
      _this.task = _fs2.default.watch(dir,

      /**
       * Executed whenever a change is detected in the contents of the "dir"
       *
       * @param {string} event - either 'rename' or 'change'
       * @param {string} file  - the name of the file which triggered the event
       */
      function (event, file) {
        var path = '' + dir + '/' + file,
            i;

        if (-1 !== exclude.indexOf(file)) {
          return;
        }
        if ('rename' === event) {
          _fs2.default.stat(path, function (statErr, stats) {
            if (statErr) {
              i = files.indexOf(file);
              if (-1 !== i) {
                files.splice(i, 1);
                callback();
                return;
              }
              i = _this.indexOf(file);
              if (-1 !== i) {
                _this.children[i].stop();
                _this.children.splice(i, 1);
                callback();
              }
              return;
            }
            if (stats.isDirectory()) {
              i = _this.indexOf(file);
              if (-1 === i) {
                _this.children.push(new DirectoryWatcher(path, type, exclude, callback));
                return;
              }
              _this.children[i].stop();
              _this.children.splice(i, 1);
            } else {
              if (!type.test(file)) {
                return;
              }
              i = files.indexOf(file);
              if (-1 === i) {
                files.push(file);
              } else {
                files.splice(i, 1);
              }
            }
            callback();
          });
        } else if (type.test(file)) {
          callback();
        }
      });
    });
  }

  _createClass(DirectoryWatcher, [{
    key: 'indexOf',

    /**
     * Searches for a child watcher with a specific directory name.
     *
     * @memberof DirectoryWatcher
     * @instance
     * @method indexOf
     * @param  {string} dir - A directory name to search for
     * @return {number} an index of a child watcher assigned to a directory, or -1 if not found
     */
    value: function indexOf(dir) {
      var i = this.children.length;

      while (i--) {
        if (dir === this.children[i].dir) {
          return i;
        }
      }
      return -1;
    }
  }, {
    key: 'stop',

    /**
     * Stops the watcher
     *
     * @memberof DirectoryWatcher
     * @instance
     * @method stop
     */
    value: function stop() {
      this.task.close();
      this.children.forEach(function loopChildren(child) {
        child.stop();
      });
      this.children = [];
    }
  }]);

  return DirectoryWatcher;
})();

exports.DirectoryWatcher = DirectoryWatcher;