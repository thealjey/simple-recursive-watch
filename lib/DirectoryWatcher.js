/* @flow */

import fs from 'fs';

/**
 * A simple `fs.watch` wrapper class
 *
 * @class
 * @param {string}        dir      - A full system path to a directory
 * @param {RegExp}        type     - A regular expression to match files
 * @param {Array<string>} exclude  - An array of file and directory names to exclude
 * @param {Function}      callback - A callback function
 */
export class DirectoryWatcher {

  dir: string;

  children: Array<DirectoryWatcher>;

  task: any;

  /**
   * Instantiates and starts the watcher
   *
   * @param {string}        dir      - A full system path to a directory
   * @param {RegExp}        type     - A regular expression to match files
   * @param {Array<string>} exclude  - An array of file and directory names to exclude
   * @param {Function}      callback - A callback function
   */
  constructor(dir: string, type: RegExp, exclude: Array<string>, callback: Function) {
    var files = [];

    /**
     * A full system path to a directory
     *
     * @memberof DirectoryWatcher
     * @instance
     * @type {string}
     */
    this.dir = dir;
    fs.readdir(dir, (e, contents) => {
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
      this.children = contents.filter(

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
          if (fs.statSync(`${dir}/${file}`).isDirectory()) {
            return true;
          }
          if (type.test(file)) {
            files.push(file);
          }
          return false;
        }).map(file => new DirectoryWatcher(`${dir}/${file}`, type, exclude, callback));

      /**
       * The `fs.FSWatcher` task
       *
       * @memberof DirectoryWatcher
       * @private
       * @instance
       * @type {FSWatcher}
       */
      this.task = fs.watch(dir,

        /**
         * Executed whenever a change is detected in the contents of the "dir"
         *
         * @param {string} event - either 'rename' or 'change'
         * @param {string} file  - the name of the file which triggered the event
         */
        (event, file) => {
          var path = `${dir}/${file}`, i;

          if (-1 !== exclude.indexOf(file)) {
            return;
          }
          if ('rename' === event) {
            fs.stat(path, (statErr, stats) => {
              if (statErr) {
                i = files.indexOf(file);
                if (-1 !== i) {
                  files.splice(i, 1);
                  callback();
                  return;
                }
                i = this.indexOf(file);
                if (-1 !== i) {
                  this.children[i].stop();
                  this.children.splice(i, 1);
                  callback();
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
              callback();
            });
          } else if (type.test(file)) {
            callback();
          }
        });
    });
  }

  /**
   * Searches for a child watcher with a specific directory name.
   *
   * @memberof DirectoryWatcher
   * @instance
   * @method indexOf
   * @param  {string} dir - A directory name to search for
   * @return {number} an index of a child watcher assigned to a directory, or -1 if not found
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
   *
   * @memberof DirectoryWatcher
   * @instance
   * @method stop
   */
  stop() {
    this.task.close();
    this.children.forEach(function loopChildren(child) {
      child.stop();
    });
    this.children = [];
  }

}
