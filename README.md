---
---
---

# DEPRECATION WARNING

This project has been deprecated and will no longer receive updates.

Please consider using [Watchman](https://facebook.github.io/watchman/) and the
[watch](http://thealjey.github.io/webcompiler/global.html#watch) function from
[webcompiler](https://github.com/thealjey/webcompiler) instead.

---
---
---

# simple-recursive-watch
*A simple cross platform recursive directory watcher for NodeJS, based on __fs.watch__, but not relying on its
__recursive__ option.*

[![Build Status](https://travis-ci.org/thealjey/simple-recursive-watch.svg?branch=master)](https://travis-ci.org/thealjey/simple-recursive-watch)
[![Coverage Status](https://coveralls.io/repos/thealjey/simple-recursive-watch/badge.svg?branch=master&service=github)](https://coveralls.io/github/thealjey/simple-recursive-watch?branch=master)
[![Code Climate](https://codeclimate.com/github/thealjey/simple-recursive-watch/badges/gpa.svg)](https://codeclimate.com/github/thealjey/simple-recursive-watch)
[![Dependency Status](https://david-dm.org/thealjey/simple-recursive-watch.svg)](https://david-dm.org/thealjey/simple-recursive-watch)
[![devDependency Status](https://david-dm.org/thealjey/simple-recursive-watch/dev-status.svg)](https://david-dm.org/thealjey/simple-recursive-watch#info=devDependencies)
[![peerDependency Status](https://david-dm.org/thealjey/simple-recursive-watch/peer-status.svg)](https://david-dm.org/thealjey/simple-recursive-watch#info=peerDependencies)
[![npm version](https://badge.fury.io/js/simple-recursive-watch.svg)](http://badge.fury.io/js/simple-recursive-watch)
[![Slack channel](https://img.shields.io/badge/slack-watcher-blue.svg)](https://webcompiler.slack.com/messages/watcher)

I just got tired of **gulp.watch** and **gulp-watch**.
Because they rely on a hopelessly broken *gaze* library, which besides being too resource intensive for my liking, also
crashes all the time.

Errors happen all the time, we cannot completely prevent them from happening. A good application is the one that handles
those errors gracefully instead of dying all the time, producing a long and unreadable error stack that prevents you
from seeing what really matters.

Fortunately, NodeJS contains a very handy utility called **fs.watch**, which is much more performant and less resource
intensive, because it uses native operating system events to do it's job.

Unfortunately, though it cannot be reliably used to spy on a whole tree of folders recursively. Which is what this
library is for.
### Installation

```
npm i simple-recursive-watch --save
```

### API Documentation

To get better acquainted with the available tools feel free to skim through the auto-generated
[API Docs](https://rawgit.com/thealjey/simple-recursive-watch/master/docs/index.html).

### Exposes 1 class

`DirectoryWatcher` - recursively watches for file changes in a directory

```
interface DirectoryWatcher {
  constructor(dir: string, type: RegExp, ...exclude: Array<string>);
  start();
  stop();
  static watch(dir: string, extension: string, callback: Function, ...exclude: Array<string>): DirectoryWatcher;
}
```

### Arguments

1. `dir` - a full system path to a directory
2. `type` - a regular expression to match files
3. `exclude` - files/directories to exclude (not full paths, just file/directory names)
4. `extension` - a file extension to watch for
5. `callback` - a callback function to execute whenever a file system change occurs

### Example usage

```javascript
import {DirectoryWatcher} from 'simple-recursive-watch';
import {join} from 'path';

var libDir = join(__dirname, 'lib');

DirectoryWatcher.watch(libDir, 'js', function () {
  // some JavaScript file, not named "ignoreMe.js" and not residing
  // in a "__tests__" directory, was changed in the "lib" directory
}, '__tests__', 'ignoreMe.js');
```

### Explanation

The provided callback is invoked, immediately and only once, when somewhere in the __src__ directory a **".js"** file is
created, edited, renamed, moved around or deleted, excluding those residing in a **"\_\_tests\_\_"** directory or having
a name **"ignoreMe.js"**.

You can specify any number of file or directory names to ignore.