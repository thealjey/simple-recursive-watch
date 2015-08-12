/* @flow */

import {DirectoryWatcher as TestDirectoryWatcher} from '../lib';

import DirectoryWatcher from '../lib/DirectoryWatcher';

describe('index', function () {

  it('re-exports DirectoryWatcher', function () {
    expect(TestDirectoryWatcher).toBe(DirectoryWatcher);
  });

});
