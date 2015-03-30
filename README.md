# simple-recursive-watch
A simple cross platform recursive directory watcher for NodeJS, based on **fs.watch**, but not relying on its
**recursive** option.

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

#### Installation 
    npm install simple-recursive-watch --save

#### Example usage
    var watch = require('simple-recursive-watch');
    
    watch('src', 'js', function () {
      console.log('something changed');
    }, '__tests__');

####Explanation
The provided callback is invoked, immediately and only once, when somewhere in the *src* directory a ".js" file is
created, edited, renamed, moved around or deleted, excluding those residing in a "\_\_tests\_\_" directory.