/* @flow */

var path = require('path'),
    mkdirp = require('mkdirp'),
    webcompiler = require('webcompiler');

var libDir = path.join(__dirname, '..', 'lib'), buildDir = path.join(__dirname, '..', 'build');

mkdirp(buildDir, function () {
  webcompiler.lintJS.bind(null, [libDir, __filename], webcompiler.flow.run.bind(webcompiler.flow, function () {
    webcompiler.packageJS(path.join(libDir, 'DirectoryWatcher.js'), path.join(buildDir, 'DirectoryWatcher.js'));
    webcompiler.packageJS(path.join(libDir, 'watch.js'), path.join(buildDir, 'watch.js'));
  }))();
});
