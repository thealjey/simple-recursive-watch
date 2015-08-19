/* @flow */

import {stat, statSync, readdir, watch} from 'fs';
import {join} from 'path';
import {EventEmitter} from 'events';

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
 * var libDir = join(__dirname, 'lib'),
 *     watcher = new DirectoryWatcher(libDir, /\.js$/, 'ignoreMe.js');
 */
export default class DirectoryWatcher extends EventEmitter {

  dir: string;

  type: RegExp;

  exclude: Array<string>;

  files: Array<string>;

  children: Array<DirectoryWatcher>;

  task: any;

  constructor(dir: string, type: RegExp, ...exclude: Array<string>) {
    super();

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
   * Handles the "rename" system event for a file
   *
   * @memberof DirectoryWatcher
   * @private
   * @instance
   * @method handleEvent
   * @param {string} file     - a base name of a file/directory that triggered the event
   * @param {string} location - a full system path to "file"
   */
  handleEvent(file: string, location: string) {
    stat(location, (e, stats) => {
      var i;

      if (e) {
        i = this.files.indexOf(file);
        if (-1 !== i) {
          this.files.splice(i, 1);
          this.emit('change');
          return;
        }
        i = this.indexOf(location);
        if (-1 !== i) {
          this.children[i].stop();
          this.children.splice(i, 1);
          this.emit('change');
        }
        return;
      }
      if (stats.isDirectory()) {
        i = this.indexOf(location);
        if (-1 === i) {
          this.children.push(this.createChild(location));
          return;
        }
        this.children[i].stop();
        this.children.splice(i, 1);
      } else {
        if (!this.type.test(file)) {
          return;
        }
        i = this.files.indexOf(file);
        if (-1 === i) {
          this.files.push(file);
        } else {
          this.files.splice(i, 1);
        }
      }
      this.emit('change');
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
  createChild(location: string): DirectoryWatcher {
    var child = new DirectoryWatcher(location, this.type, ...this.exclude);

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
  createChildren() {
    readdir(this.dir, (e, contents) => {
      if (e) {
        return console.error(e);
      }
      this.children = contents.filter(file => {
        if (-1 !== this.exclude.indexOf(file)) {
          return false;
        }
        if (statSync(join(this.dir, file)).isDirectory()) {
          return true;
        }
        if (this.type.test(file)) {
          this.files.push(file);
        }
        return false;
      }).map(file => this.createChild(join(this.dir, file)));
      this.createTask();
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
  createTask() {

    /**
     * a native FSWatcher instance
     *
     * @memberof DirectoryWatcher
     * @private
     * @instance
     * @type {FSWatcher}
     */
    this.task = watch(this.dir, (event, file) => {
      if (-1 !== this.exclude.indexOf(file)) {
        return;
      }
      if ('rename' === event) {
        this.handleEvent(file, join(this.dir, file));
      } else if (this.type.test(file)) {
        this.emit('change');
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
  start() {
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
  stop() {
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
   * var watcher = DirectoryWatcher.watch(libDir, 'js', function () {
   *   // some JavaScript file, not named "ignoreMe.js", was changed in the "lib" directory
   * }, 'ignoreMe.js');
   */
  static watch(dir: string, extension: string, callback: Function, ...exclude: Array<string>): DirectoryWatcher {
    var watcher = new DirectoryWatcher(dir, new RegExp(`\\.${extension}$`), ...exclude);

    watcher.start();
    watcher.on('change', callback);
    return watcher;
  }

}
