import { success } from '../../../util';
import * as util from '../../../util';
import { buildAsyncProcessor } from '../../../behavioral/chain-of-responsibility';

describe('buildAsyncProcessor', () => {
  it('should return function', () => {
    expect(typeof buildAsyncProcessor([])).toBe('function');
  });

  it('should work after all synchronous code', done => {
    const _next = jest.fn();
    const _cb = jest.fn();
    buildAsyncProcessor([
      (context, callback, next) => next && next(),
      (context, callback, next) => next && next(),
      (context, callback, next) => next && next(),
      (context, callback, next) => next && next()
    ])({}, _cb, _next);
    expect(_cb).not.toBeCalled();
    expect(_next).not.toBeCalled();
    done();
  });

  it('should work before any timeout', done => {
    const _next = jest.fn();
    const _cb = jest.fn();
    buildAsyncProcessor([
      (context, callback, next) => next && next(),
      (context, callback, next) => next && next(),
      (context, callback, next) => next && next(),
      (context, callback, next) => next && next()
    ])({}, _cb, _next);
    setTimeout(() => {
      expect(_next).toBeCalled();
      expect(_cb).not.toBeCalled();
      done();
    }, 1);
  });

  it('should pass synchronous error to callback', done => {
    const e = new Error();
    buildAsyncProcessor([
      () => {
        throw e;
      }
    ])({}, error => {
      expect(error).toBe(e);
      done();
    });
  });

  it('should not callback more than once', done => {
    const fn = jest.fn();
    buildAsyncProcessor([
      (context, callback, next) => {
        util.success(callback);
        util.success(callback);
        expect(fn).toBeCalledTimes(1);
        done();
      }
    ])({}, fn);
  });

  it('should pass everything to callback', done => {
    const args = [null, 42, '42', { x: 42 }, true];
    const fn = jest.fn();
    buildAsyncProcessor([
      (context, callback, next) => {
        if (typeof callback === 'function') {
          (callback as Function)(...args);
        }
        expect(fn).toBeCalledWith(...args);
        done();
      }
    ])({}, fn);
  });

  it('should break chain after first callback', done => {
    const fn = jest.fn();
    const proc2 = jest.fn();
    buildAsyncProcessor([
      (context, callback, next) => {
        success(callback);
      },
      proc2
    ])({}, fn);

    setTimeout(() => {
      expect(fn).toBeCalled();
      expect(proc2).not.toBeCalled();
      done();
    }, 1);
  });
});
