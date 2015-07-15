# simple-recursive-watch
*A simple cross platform recursive directory watcher for NodeJS, based on __fs.watch__, but not relying on its
__recursive__ option.*

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