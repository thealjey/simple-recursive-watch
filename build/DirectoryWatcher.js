'use strict';

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

exports.__esModule = true;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var DirectoryWatcher = (function () {
  function DirectoryWatcher(dir, type, exclude, callback) {
    var _this = this;

    _classCallCheck(this, DirectoryWatcher);

    var files = [];

    this.dir = dir;
    _fs2['default'].readdir(dir, function (e, contents) {
      if (e) {
        return console.error(e);
      }

      _this.children = contents.filter(function loopContents(file) {
        if (-1 !== exclude.indexOf(file)) {
          return false;
        }
        if (_fs2['default'].statSync('' + dir + '/' + file).isDirectory()) {
          return true;
        }
        if (type.test(file)) {
          files.push(file);
        }
        return false;
      }).map(function (file) {
        return new DirectoryWatcher('' + dir + '/' + file, type, exclude, callback);
      });

      _this.task = _fs2['default'].watch(dir, function (event, file) {
        var path = '' + dir + '/' + file,
            i;

        if (-1 !== exclude.indexOf(file)) {
          return;
        }
        if ('rename' === event) {
          _fs2['default'].stat(path, function (statErr, stats) {
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

  DirectoryWatcher.prototype.indexOf = function indexOf(dir) {
    var i = this.children.length;

    while (i--) {
      if (dir === this.children[i].dir) {
        return i;
      }
    }
    return -1;
  };

  DirectoryWatcher.prototype.stop = function stop() {
    this.task.close();
    this.children.forEach(function loopChildren(child) {
      child.stop();
    });
    this.children = [];
  };

  return DirectoryWatcher;
})();

exports.DirectoryWatcher = DirectoryWatcher;