/* @flow */

import fs from 'fs';
import DirectoryWatcher from '../lib/DirectoryWatcher';
import {EventEmitter} from 'events';

describe('DirectoryWatcher', function () {
  let watcher, spy;

  beforeEach(function () {
    spy = jasmine.createSpy('spy');
    spyOn(console, 'error');
    watcher = new DirectoryWatcher('/path/to/a/directory', /\.js$/, 'ignoreMe.js', 'ignoreMeToo');
    watcher.on('change', spy);
  });

  it('extends EventEmitter', function () {
    expect(watcher instanceof EventEmitter).toBeTruthy();
  });

  it('configures itself', function () {
    if (!watcher) {
      return;
    }
    expect(watcher.dir).toBe('/path/to/a/directory');
    expect(watcher.type).toEqual(/\.js$/);
    expect(watcher.exclude).toEqual(['ignoreMe.js', 'ignoreMeToo']);
    expect(watcher.files).toEqual([]);
    expect(watcher.children).toEqual([]);
  });

  describe('stop not started', function () {

    beforeEach(function () {
      if (!watcher) {
        return;
      }
      watcher.stop();
    });

    it('does not throw', function () {
      if (!watcher) {
        return;
      }
      expect(watcher.stop.bind(watcher)).not.toThrow();
    });

    it('prints the error on screen', function () {
      expect(console.error).toHaveBeenCalledWith('not running');
    });

  });

  describe('stop started', function () {
    let child1, child2;

    beforeEach(function () {
      if (!watcher) {
        return;
      }
      child1 = new DirectoryWatcher('/path/to/the/first/directory', /\.js$/, 'ignoreMe.js', 'ignoreMeToo');
      child2 = new DirectoryWatcher('/path/to/the/second/directory', /\.js$/);
      spyOn(child1, 'stop');
      spyOn(child2, 'stop');
      watcher.task = {close: jasmine.createSpy('close')};
      watcher.children = [child1, child2];
      watcher.stop();
    });

    it('closes the task', function () {
      if (!watcher) {
        return;
      }
      expect(watcher.task.close).toHaveBeenCalled();
    });

    it('loops through children', function () {
      if (!watcher || !child1 || !child2) {
        return;
      }
      expect(child1.stop).toHaveBeenCalled();
      expect(child2.stop).toHaveBeenCalled();
      expect(watcher.children).toEqual([]);
    });

    it('does not print any errors', function () {
      expect(console.error).not.toHaveBeenCalled();
    });

  });

  describe('start not started', function () {

    beforeEach(function () {
      if (!watcher) {
        return;
      }
      spyOn(watcher, 'createChildren');
      watcher.start();
    });

    it('does not print any errors', function () {
      expect(console.error).not.toHaveBeenCalled();
    });

    it('calls createChildren', function () {
      if (!watcher) {
        return;
      }
      expect(watcher.createChildren).toHaveBeenCalled();
    });

  });

  describe('start already started', function () {

    beforeEach(function () {
      if (!watcher) {
        return;
      }
      watcher.task = true;
      watcher.start();
    });

    it('prints the error on screen', function () {
      expect(console.error).toHaveBeenCalledWith('already started');
    });

  });

  describe('createChildren', function () {

    beforeEach(function () {
      spyOn(watcher, 'createChild').and.callFake(function (file) {
        return `DirectoryWatcher for: ${file}`;
      });
      spyOn(watcher, 'createChildren').and.callThrough();
    });

    describe('readdir error', function () {
      const contents = [];

      beforeEach(function () {
        if (!watcher) {
          return;
        }
        spyOn(fs, 'readdir').and.callFake(function (dir, callback) {
          callback('something bad happened', contents);
        });
        spyOn(contents, 'filter');
        watcher.createChildren();
      });

      it('calls fs.readdir', function () {
        expect(fs.readdir).toHaveBeenCalledWith('/path/to/a/directory', jasmine.any(Function));
      });

      it('prints the error on screen', function () {
        expect(console.error).toHaveBeenCalledWith('something bad happened');
      });

      it('does not call contents.filter', function () {
        expect(contents.filter).not.toHaveBeenCalled();
      });

    });

    describe('readdir success', function () {
      const contents = ['app.js', 'app.css', 'childRir1', 'childRir2', 'ignoreMe.js', 'script.js', 'ignoreMeToo'];

      beforeEach(function () {
        if (!watcher) {
          return;
        }
        spyOn(fs, 'readdir').and.callFake(function (dir, callback) {
          callback(null, contents);
        });
        spyOn(fs, 'statSync').and.callFake(function (file) {
          return {
            isDirectory() {
              return '/path/to/a/directory/childRir1' === file || '/path/to/a/directory/childRir2' === file ||
                '/path/to/a/directory/ignoreMeToo' === file;
            }
          };
        });
        spyOn(watcher, 'createTask');
        watcher.createChildren();
      });

      it('creates children', function () {
        if (!watcher) {
          return;
        }
        expect(watcher.createChild).toHaveBeenCalledWith('/path/to/a/directory/childRir1');
        expect(watcher.createChild).toHaveBeenCalledWith('/path/to/a/directory/childRir2');
        expect(watcher.children).toEqual(['DirectoryWatcher for: /path/to/a/directory/childRir1',
                                         'DirectoryWatcher for: /path/to/a/directory/childRir2']);
      });

      it('calls createTask', function () {
        if (!watcher) {
          return;
        }
        expect(watcher.createTask).toHaveBeenCalled();
      });

    });

  });

  describe('createChild', function () {
    let child;

    beforeEach(function () {
      if (!watcher) {
        return;
      }
      spyOn(fs, 'readdir');
      spyOn(DirectoryWatcher.prototype, 'start');
      child = watcher.createChild('/path/to/a/directory/childRir');
    });

    it('creates a new DirectoryWatcher', function () {
      expect(child).toEqual(jasmine.any(DirectoryWatcher));
    });

    it('configures', function () {
      if (!child) {
        return;
      }
      expect(child.dir).toBe('/path/to/a/directory/childRir');
      expect(child.type).toEqual(/\.js$/);
      expect(child.exclude).toEqual(['ignoreMe.js', 'ignoreMeToo']);
      expect(child.files).toEqual([]);
      expect(child.children).toEqual([]);
    });

    it('calls start', function () {
      expect(DirectoryWatcher.prototype.start).toHaveBeenCalled();
    });

    it('it bubbles up the change event', function () {
      if (!child) {
        return;
      }
      child.emit('change');
      expect(spy).toHaveBeenCalled();
    });

  });

  describe('createTask', function () {

    beforeEach(function () {
      spyOn(watcher, 'handleEvent');
    });

    describe('exclude', function () {

      beforeEach(function () {
        if (!watcher) {
          return;
        }
        spyOn(fs, 'watch').and.callFake(function (file, callback) {
          callback('change', 'ignoreMeToo');
          return 'native watcher instance';
        });
        watcher.createTask();
      });

      it('assigns the task', function () {
        if (!watcher) {
          return;
        }
        expect(watcher.task).toBe('native watcher instance');
      });

      it('calls fs.watch', function () {
        expect(fs.watch).toHaveBeenCalledWith('/path/to/a/directory', jasmine.any(Function));
      });

      it('does not trigger a change event', function () {
        expect(spy).not.toHaveBeenCalled();
      });

      it('does not call handleEvent', function () {
        if (!watcher) {
          return;
        }
        expect(watcher.handleEvent).not.toHaveBeenCalled();
      });

    });

    describe('target file', function () {

      beforeEach(function () {
        if (!watcher) {
          return;
        }
        spyOn(fs, 'watch').and.callFake(function (file, callback) {
          callback('change', 'script.js');
        });
        watcher.createTask();
      });

      it('triggers a change event', function () {
        expect(spy).toHaveBeenCalled();
      });

      it('does not call handleEvent', function () {
        if (!watcher) {
          return;
        }
        expect(watcher.handleEvent).not.toHaveBeenCalled();
      });

    });

    describe('other changes', function () {

      beforeEach(function () {
        if (!watcher) {
          return;
        }
        spyOn(fs, 'watch').and.callFake(function (file, callback) {
          callback('rename', 'script.js');
        });
        watcher.createTask();
      });

      it('calls handleEvent', function () {
        if (!watcher) {
          return;
        }
        expect(watcher.handleEvent).toHaveBeenCalled();
      });

    });

    describe('change in an unsupported file', function () {

      beforeEach(function () {
        if (!watcher) {
          return;
        }
        spyOn(fs, 'watch').and.callFake(function (file, callback) {
          callback('change', 'style.css');
        });
        watcher.createTask();
      });

      it('does not trigger a change event', function () {
        expect(spy).not.toHaveBeenCalled();
      });

      it('does not call handleEvent', function () {
        if (!watcher) {
          return;
        }
        expect(watcher.handleEvent).not.toHaveBeenCalled();
      });

    });

  });

  describe('handleEvent', function () {

    beforeEach(function () {
      if (!watcher) {
        return;
      }
      spyOn(watcher.files, 'indexOf').and.callThrough();
      spyOn(watcher, 'indexOf').and.callThrough();
    });

    describe('fs.stat error', function () {
      let stats;

      beforeEach(function () {
        stats = {isDirectory: jasmine.createSpy('isDirectory')};
        spyOn(fs, 'stat').and.callFake(function (file, callback) {
          callback('something bad happened', stats);
        });
      });

      describe('known file', function () {

        beforeEach(function () {
          if (!watcher) {
            return;
          }
          watcher.files = ['script.js'];
          watcher.handleEvent('script.js', '/path/to/a/directory/script.js');
        });

        it('calls fs.stat', function () {
          expect(fs.stat).toHaveBeenCalledWith('/path/to/a/directory/script.js', jasmine.any(Function));
        });

        it('forgets the file', function () {
          if (!watcher) {
            return;
          }
          expect(watcher.files).toEqual([]);
        });

        it('triggers a change event', function () {
          expect(spy).toHaveBeenCalled();
        });

        it('does not search through the child watchers', function () {
          if (!watcher) {
            return;
          }
          expect(watcher.indexOf).not.toHaveBeenCalled();
        });

        it('does not call stats.isDirectory', function () {
          if (!stats) {
            return;
          }
          expect(stats.isDirectory).not.toHaveBeenCalled();
        });

      });

      describe('known directory', function () {
        let child;

        beforeEach(function () {
          if (!watcher) {
            return;
          }
          child = new DirectoryWatcher('/path/to/a/directory/someDir', /\.js$/, 'ignoreMe.js', 'ignoreMeToo');
          spyOn(child, 'stop').and.callThrough();
          watcher.children = [child];
          watcher.handleEvent('someDir', '/path/to/a/directory/someDir');
        });

        it('searches through the child watchers', function () {
          if (!watcher) {
            return;
          }
          expect(watcher.indexOf).toHaveBeenCalledWith('/path/to/a/directory/someDir');
        });

        it('calls child.stop', function () {
          if (!child) {
            return;
          }
          expect(child.stop).toHaveBeenCalled();
        });

        it('forgets the directory', function () {
          if (!watcher) {
            return;
          }
          expect(watcher.children).toEqual([]);
        });

        it('triggers a change event', function () {
          expect(spy).toHaveBeenCalled();
        });

        it('does not call stats.isDirectory', function () {
          if (!stats) {
            return;
          }
          expect(stats.isDirectory).not.toHaveBeenCalled();
        });

      });

      describe('other errors', function () {

        beforeEach(function () {
          if (!watcher) {
            return;
          }
          watcher.handleEvent('someDir', '/path/to/a/directory/someDir');
        });

        it('does not trigger a change event', function () {
          expect(spy).not.toHaveBeenCalled();
        });

        it('does not call stats.isDirectory', function () {
          if (!stats) {
            return;
          }
          expect(stats.isDirectory).not.toHaveBeenCalled();
        });

      });

    });

    describe('fs.stat success', function () {

      beforeEach(function () {
        if (!watcher) {
          return;
        }
        spyOn(watcher.type, 'test').and.callThrough();
      });

      describe('is directory', function () {
        let stats;

        beforeEach(function () {
          stats = {isDirectory: jasmine.createSpy('isDirectory').and.returnValue(true)};
          spyOn(fs, 'stat').and.callFake(function (file, callback) {
            callback(null, stats);
          });
        });

        describe('unknown directory', function () {

          beforeEach(function () {
            if (!watcher) {
              return;
            }
            spyOn(watcher, 'createChild').and.returnValue('new child instance');
            watcher.handleEvent('someDir', '/path/to/a/directory/someDir');
          });

          it('calls stats.isDirectory', function () {
            if (!stats) {
              return;
            }
            expect(stats.isDirectory).toHaveBeenCalled();
          });

          it('searches through the child watchers', function () {
            if (!watcher) {
              return;
            }
            expect(watcher.indexOf).toHaveBeenCalledWith('/path/to/a/directory/someDir');
          });

          it('creates a child', function () {
            if (!watcher) {
              return;
            }
            expect(watcher.createChild).toHaveBeenCalledWith('/path/to/a/directory/someDir');
            expect(watcher.children).toEqual(['new child instance']);
          });

          it('does not trigger a change event', function () {
            expect(spy).not.toHaveBeenCalled();
          });

        });

        describe('known directory', function () {
          let child;

          beforeEach(function () {
            if (!watcher) {
              return;
            }
            child = new DirectoryWatcher('/path/to/a/directory/someDir', /\.js$/, 'ignoreMe.js', 'ignoreMeToo');
            spyOn(child, 'stop').and.callThrough();
            watcher.children = [child];
            watcher.handleEvent('someDir', '/path/to/a/directory/someDir');
          });

          it('calls child.stop', function () {
            if (!child) {
              return;
            }
            expect(child.stop).toHaveBeenCalled();
          });

          it('forgets the directory', function () {
            if (!watcher) {
              return;
            }
            expect(watcher.children).toEqual([]);
          });

          it('does not test the type', function () {
            if (!watcher) {
              return;
            }
            expect(watcher.type.test).not.toHaveBeenCalled();
          });

          it('triggers a change event', function () {
            expect(spy).toHaveBeenCalled();
          });

        });

      });

      describe('is not a directory', function () {
        let stats;

        beforeEach(function () {
          stats = {isDirectory: jasmine.createSpy('isDirectory').and.returnValue(false)};
          spyOn(fs, 'stat').and.callFake(function (file, callback) {
            callback(null, stats);
          });
        });

        describe('wrong type', function () {

          beforeEach(function () {
            if (!watcher) {
              return;
            }
            watcher.handleEvent('style.css', '/path/to/a/directory/style.css');
          });

          it('tests the type', function () {
            if (!watcher) {
              return;
            }
            expect(watcher.type.test).toHaveBeenCalledWith('style.css');
          });

          it('does not check the known files', function () {
            if (!watcher) {
              return;
            }
            expect(watcher.files.indexOf).not.toHaveBeenCalled();
          });

        });

        describe('correct type unknown file', function () {

          beforeEach(function () {
            if (!watcher) {
              return;
            }
            watcher.handleEvent('script.js', '/path/to/a/directory/script.js');
          });

          it('checks known files', function () {
            if (!watcher) {
              return;
            }
            expect(watcher.files.indexOf).toHaveBeenCalled();
          });

          it('remembers the file', function () {
            if (!watcher) {
              return;
            }
            expect(watcher.files.length).toBe(1);
          });

        });

        describe('correct type known file', function () {

          beforeEach(function () {
            if (!watcher) {
              return;
            }
            watcher.files = ['app.js'];
            watcher.handleEvent('app.js', '/path/to/a/directory/app.js');
          });

          it('forgets the file', function () {
            if (!watcher) {
              return;
            }
            expect(watcher.files.length).toBe(0);
          });

        });

      });

    });

  });

  describe('indexOf', function () {

    beforeEach(function () {
      if (!watcher) {
        return;
      }
      watcher.children = [new DirectoryWatcher('/path/to/a/directory/someDir', /\.js$/, 'ignoreMe.js', 'ignoreMeToo')];
    });

    it('finds a child', function () {
      if (!watcher) {
        return;
      }
      expect(watcher.indexOf('/path/to/a/directory/someDir')).toBe(0);
    });

    it('returns -1 if nothing is found', function () {
      if (!watcher) {
        return;
      }
      expect(watcher.indexOf('anything')).toBe(-1);
    });

  });

  describe('watch', function () {
    let child;

    beforeEach(function () {
      if (!spy) {
        return;
      }
      spyOn(DirectoryWatcher.prototype, 'start');
      child = DirectoryWatcher.watch('/path/to/a/directory', 'js', spy, 'ignoreMe.js', 'ignoreMeToo');
    });

    it('creates a new DirectoryWatcher', function () {
      expect(child).toEqual(jasmine.any(DirectoryWatcher));
    });

    it('configures', function () {
      if (!child) {
        return;
      }
      expect(child.dir).toBe('/path/to/a/directory');
      expect(child.type).toEqual(/\.js$/);
      expect(child.exclude).toEqual(['ignoreMe.js', 'ignoreMeToo']);
      expect(child.files).toEqual([]);
      expect(child.children).toEqual([]);
    });

    it('calls start', function () {
      expect(DirectoryWatcher.prototype.start).toHaveBeenCalled();
    });

    it('it bubbles up the change event', function () {
      if (!child) {
        return;
      }
      child.emit('change');
      expect(spy).toHaveBeenCalled();
    });

  });

});
