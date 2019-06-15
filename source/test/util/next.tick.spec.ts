import * as util from '../../util';

describe('util.nextTick', () => {
  it('should provide arguments to a function', done => {
    const args = [42, '42', { x: 42 }, true];
    function fn() {
      expect(Array.prototype.slice.call(arguments)).toStrictEqual(args);
      done();
    }
    util.nextTick(fn as any, ...args);
  });

  it('should fail if operator is not a function', done => {
    try {
      (util.nextTick as Function)(10);
      done(new Error('Does not fail'));
    } catch (e) {
      done();
    }
  });

  it('should call function after all synchronous operations', done => {
    const fn = jest.fn();
    util.nextTick(fn);
    util.nextTick(() => {
      expect(fn).toBeCalled();
      done();
    });
    expect(fn).not.toBeCalled();
  });

  it('should call function before any immediate', done => {
    if (typeof global.setImmediate === 'function') {
      const fn = jest.fn();
      util.nextTick(fn);
      (global.setImmediate as Function)(() => {
        expect(fn).toBeCalled();
        done();
      });
      expect(fn).not.toBeCalled();
    } else {
      done();
    }
  });

  it('should call function before any timeouts', done => {
    const fn = jest.fn();
    util.nextTick(fn);
    setTimeout(() => {
      expect(fn).toBeCalled();
      done();
    }, 1);
    expect(fn).not.toBeCalled();
  });
});
