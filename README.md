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

    npm i simple-recursive-watch --save
### Example usage

    import watch from 'simple-recursive-watch';
    
    watch('lib', 'js', function (e, watcher) {
      if (e) return;
      // you can invoke `watcher.stop()` at any moment to stop the watcher
      console.log('something changed');
    }, '__tests__', 'ignoreMe.js');
### Explanation

The provided callback is invoked, immediately and only once, when somewhere in the __src__ directory a __".js"__ file is
created, edited, renamed, moved around or deleted, excluding those residing in a __"\_\_tests\_\_"__ directory or having
a name __"ignoreMe.js"__.

You can specify any number of file or directory names to ignore.