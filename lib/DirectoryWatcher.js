/* @flow */

import fs from 'fs';

/**
 * A simple `fs.watch` wrapper class
 */
export class DirectoryWatcher {

  dir: string;

  children: Array<DirectoryWatcher>;

  task: any;

  /**
   * Instantiates and starts the watcher
   *
   * @param  {string}   dir
   * @param  {RegExp}   type
   * @param  {string[]} exclude
   * @param  {Function} callback
   */
  constructor(dir: string, type: RegExp, exclude: Array<string>, callback: Function) {
    var files = [];
    this.dir = dir;
    fs.readdir(dir, (e, contents) => {
      if (e) {
        return callback(e);
      }
      this.children = contents.filter(function (file) {
        if (-1 !== exclude.indexOf(file)) {
          return false;
        }
        if (fs.statSync(`${dir}/${file}`).isDirectory()) {
          return true;
        }
        if (type.test(file)) {
          files.push(file);
        }
        return false;
      }).map(file => new DirectoryWatcher(`${dir}/${file}`, type, exclude, callback));
      this.task = fs.watch(dir, (event, file) => {
        if (-1 !== exclude.indexOf(file)) {
          return;
        }
        var path = `${dir}/${file}`, i;
        if ('rename' === event) {
          fs.stat(path, (statErr, stats) => {
            if (statErr) {
              i = files.indexOf(file);
              if (-1 !== i) {
                files.splice(i, 1);
                callback(null, this);
                return;
              }
              i = this.indexOf(file);
              if (-1 !== i) {
                this.children[i].stop();
                this.children.splice(i, 1);
                callback(null, this);
              }
              return;
            }
            if (stats.isDirectory()) {
              i = this.indexOf(file);
              if (-1 === i) {
                this.children.push(new DirectoryWatcher(path, type, exclude, callback));
                return;
              }
              this.children[i].stop();
              this.children.splice(i, 1);
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
            callback(null, this);
          });
        } else if (type.test(file)) {
          callback(null, this);
        }
      });
    });
  }

  /**
   * Returns an index of a child watcher assigned to a directory, or -1 if not found
   *
   * @param  {string} dir
   * @return {number}
   */
  indexOf(dir: string): number {
    var i = this.children.length;
    while (i--) {
      if (dir === this.children[i].dir) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Stops the watcher
   */
  stop() {
    this.task.close();
    this.children.forEach(function (child) { child.stop(); });
    this.children = [];
  }

}
