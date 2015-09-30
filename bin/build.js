/* @flow */

import {join} from 'path';
import {JS, NativeProcess} from 'webcompiler';

const rootDir = join(__dirname, '..'),
    buildDir = join(rootDir, 'build'),
    libDir = join(rootDir, 'lib'),
    docsDir = join(rootDir, 'docs'),
    specDir = join(rootDir, 'spec'),
    modulesDir = join(rootDir, 'node_modules'),
    readme = join(rootDir, 'README.md'),
    jsdocConfig = join(modulesDir, 'webcompiler', 'config', 'jsdoc.json'),
    js = new JS(),
    jsdoc = new NativeProcess(join(modulesDir, '.bin', 'jsdoc')),
    npm = new NativeProcess('npm');

js.beDir(libDir, buildDir, function () {
  jsdoc.run(function (e) {
    if (e) {
      return console.error(e);
    }
    console.log('\x1b[32mGenerated API documentation!\x1b[0m');
    npm.run(Function.prototype, ['test'], {stdio: 'inherit'});
  }, [buildDir, '-d', docsDir, '-R', readme, '-c', jsdocConfig]);
}, specDir, __filename);
