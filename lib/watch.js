/* @flow */

import fs from 'fs';
import {DirectoryWatcher} from './DirectoryWatcher';
import debounce from 'lodash/function/debounce';

export default function (dir: string, type: RegExp, callback: Function, ...exclude: Array<string>) {
  fs.realpath(dir, function (e, directory) {
    if (e) {
      return console.error(e);
    }
    /*eslint-disable no-new*/
    new DirectoryWatcher(directory, new RegExp('\.' + type + '$'), exclude, debounce(callback, 150));
    /*eslint-enable no-new*/
  });
}
