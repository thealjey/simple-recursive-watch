var path = require('path'),
    mkdirp = require('mkdirp'),
    compiler = require('webcompiler'),
    NativeProcess = require('webcompiler/build/NativeProcess');

/*eslint-disable one-var*/
var rootDir = path.join(__dirname, '..'),
    libDir = path.join(rootDir, 'lib'),
    buildDir = path.join(rootDir, 'build'),
    flow = compiler.flow,
    packageJS = compiler.packageJS;

/*eslint-enable one-var*/

mkdirp(buildDir,
  compiler.lintJS.bind(null,
    [libDir, __filename],
    flow.run.bind(flow,
      packageJS.bind(null, path.join(libDir, 'DirectoryWatcher.js'), path.join(buildDir, 'DirectoryWatcher.js'),
        packageJS.bind(null, path.join(libDir, 'watch.js'), path.join(buildDir, 'watch.js'),
          function compiled() {
            (new NativeProcess(path.join(rootDir, 'node_modules', '.bin', 'jsdoc'))).run(Function.prototype, [
              buildDir,
              '-d', path.join(rootDir, 'docs'),
              '-P', path.join(rootDir, 'package.json'),
              '-R', path.join(rootDir, 'README.md')
            ]);
          }
        )
      )
    )
  )
);
