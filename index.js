var fs = require('fs'),
  EventEmitter = require('events').EventEmitter,
  _ = require('lodash');

var DirectoryWatcher = (function (parent) {
  function DirectoryWatcher(dir, type, exclude) {
    parent.call(this);
    var emitChange = _.debounce(this.emit.bind(this, 'change'), 40), files = this.files = [];
    this.type = type;
    this.exclude = exclude;
    this.dir = dir;
    fs.readdir(dir, (function (e, contents) {
      if (e) return;
      this.children = contents.filter(function (file) {
        if (exclude !== file && fs.statSync(dir + '/' + file).isDirectory()) return true;
        if (type.test(file)) files.push(file);
        return false;
      }).map(function (file) {
        var child = new DirectoryWatcher(dir + '/' + file, type, exclude);
        child.on('change', emitChange);
        return child;
      });
      this.task = fs.watch(dir, (function (event, file) {
        var path = dir + '/' + file, i;
        if ('rename' === event) {
          fs.stat(path, (function (e, stats) {
            if (e) {
              i = files.indexOf(file);
              if (-1 !== i) {
                files.splice(i, 1);
                emitChange();
                return;
              }
              i = this.indexOf(file);
              if (-1 !== i) {
                this.children[i].stop();
                this.children.splice(i, 1);
                emitChange();
              }
              return;
            }
            if (stats.isDirectory()) {
              if (exclude === file) return;
              i = this.indexOf(file);
              if (-1 === i) {
                var child = new DirectoryWatcher(path, type, exclude);
                child.on('change', emitChange);
                this.children.push(child);
                fs.readdir(path, function (e, contents) {
                  if (!e && contents.length) emitChange();
                });
                return;
              } else {
                this.children[i].stop();
                this.children.splice(i, 1);
              }
            } else {
              if (!type.test(file)) return;
              i = files.indexOf(file);
              if (-1 === i) files.push(file);
              else files.splice(i, 1);
            }
            emitChange();
          }).bind(this));
        } else {
          emitChange();
        }
      }).bind(this));
    }).bind(this));
  }
  DirectoryWatcher.prototype = Object.create(parent.prototype);
  DirectoryWatcher.prototype.constructor = DirectoryWatcher;
  DirectoryWatcher.prototype.indexOf = function (dir) {
    var i = this.children.length;
    while (i--) {
      if (dir === this.children[i].dir) return i;
    }
    return -1;
  };
  DirectoryWatcher.prototype.stop = function () {
    this.children.forEach(function (child) { child.stop() });
    this.children = [];
    this.task.close();
  };
  return DirectoryWatcher;
}(EventEmitter));

module.exports = function (dir, type, callback, exclude) {
  fs.realpath(dir, function (e, dir) {
    e || (new DirectoryWatcher(dir, new RegExp('\.' + type + '$'), exclude)).on('change', callback);
  });
};