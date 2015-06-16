/* @flow */
/** @module watch */

import fs from 'fs';
import {DirectoryWatcher} from './DirectoryWatcher';
import debounce from 'lodash/function/debounce';

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
export default function (dir: string, type: string, callback: Function, ...exclude: Array<string>) {
  fs.realpath(dir, function getDirectoryRealPath(e, directory) {
    if (e) {
      return console.error(e);
    }

    /*eslint-disable no-new*/
    new DirectoryWatcher(directory, new RegExp('\.' + type + '$'), exclude, debounce(callback, 150));

    /*eslint-enable no-new*/
  });
}
