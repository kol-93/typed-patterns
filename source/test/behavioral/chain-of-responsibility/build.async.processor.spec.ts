import { Callback, guardPromiseProcessor, success, Unexpected } from '../../../util';
import * as util from '../../../util';
import { buildAsyncProcessor, Next } from '../../../behavioral/chain-of-responsibility';

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

  it('should pass synchronous error to callback except ', done => {
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
    const proc1 = jest.fn((context: {}, callback?: Callback<[number]>, next?: Next) => {
      success(callback, 1);
      if (typeof next === 'function') {
        next();
      }
    });
    const proc2 = jest.fn((context: {}, callback?: Callback<[number]>, next?: Next) => {
      success(callback, 2);
    });
    buildAsyncProcessor([proc1, proc2])({}, fn);

    setTimeout(() => {
      expect(proc1).toBeCalled();
      expect(proc2).not.toBeCalled();
      expect(fn).toBeCalledWith(null, 1);
      done();
    }, 1);
  });

  it('should suppress callbacks from processors that called next', done => {
    const p1 = jest.fn((context: {}, cb?: Callback<[number], Error>, next?: () => void) => {
      if (typeof next === 'function') {
        next();
      }
      util.success(cb, 1);
    });

    const p2 = jest.fn((context: {}, cb?: Callback<[number], Error>, next?: () => void) => {
      util.success(cb, 2);
    });

    const callback = jest.fn();

    buildAsyncProcessor([p1, p2])({}, callback);
    setTimeout(() => {
      expect(p1).toBeCalled();
      expect(p2).toBeCalled();
      expect(callback).toBeCalledTimes(1);
      expect(callback).toBeCalledWith(null, 2);
      done();
    }, 1);
  });

  it('should suppress next calls after callback', done => {
    const p1 = jest.fn((context: {}, cb?: Callback<[number], Error>, n?: () => void) => {
      util.success(cb, 1);
      if (typeof n === 'function') {
        n();
      }
    });

    const callback = jest.fn();
    const next = jest.fn();

    buildAsyncProcessor([p1])({}, callback, next);
    setTimeout(() => {
      expect(p1).toBeCalled();
      expect(callback).toBeCalledTimes(1);
      expect(callback).toBeCalledWith(null, 1);
      expect(next).not.toBeCalled();
      done();
    }, 1);
  });

  it('should suppress repeatable next calls', done => {
    const p1 = jest.fn((context: {}, cb?: Callback<[number], Error>, n?: () => void) => {
      if (typeof n === 'function') {
        n();
        n();
      }
    });
    const p2 = jest.fn((context: {}, cb?: Callback<[number], Error>, n?: () => void) => {
      util.success(cb, 2);
    });
    const p3 = jest.fn((context: {}, cb?: Callback<[number], Error>, n?: () => void) => {
      util.success(cb, 3);
    });

    const callback = jest.fn();
    const next = jest.fn();

    buildAsyncProcessor([p1, p2, p3])({}, callback, next);
    setTimeout(() => {
      expect(p1).toBeCalled();
      expect(p2).toBeCalled();
      expect(p3).not.toBeCalled();
      expect(callback).toBeCalledTimes(1);
      expect(callback).toBeCalledWith(null, 2);
      expect(next).not.toBeCalled();
      done();
    }, 10);
  });

  it('should simulate next() if processor raised Unexpected exception', done => {
    const p1 = jest.fn((context: {}, cb?: Callback<[number], Error>, n?: () => void) => {
      util.fail(cb, new Unexpected(''));
    });
    const p2 = jest.fn((context: {}, cb?: Callback<[number], Error>, n?: () => void) => {
      util.fail(cb, new Unexpected(''));
    });
    const p3 = jest.fn((context: {}, cb?: Callback<[number], Error>, n?: () => void) => {
      util.success(cb, 3);
    });
    const callback = jest.fn();
    const next = jest.fn();

    buildAsyncProcessor([p1, p2, p3])({}, callback, next);
    setTimeout(() => {
      expect(p1).toBeCalled();
      expect(p2).toBeCalled();
      expect(p3).toBeCalled();
      expect(callback).toBeCalledTimes(1);
      expect(callback).toBeCalledWith(null, 3);
      expect(next).not.toBeCalled();
      done();
    }, 10);
  });

  test('should pass Unexpected to callback if any processor can process context', (done) => {
    const proc = jest.fn(async (context: { value: number }) => undefined);

    const p1 = jest.fn(guardPromiseProcessor(
      (context: { value: any }): context is {value: number} => typeof context.value === 'number',
      proc,
    ));

    const callback = (error: any) => {
      expect(proc).not.toBeCalled();
      expect(error).toBeInstanceOf(util.Unexpected);
      done();
    };
    buildAsyncProcessor([p1, p1, p1, p1, p1, p1, p1, p1])({ value: '' }, callback);
  });
});
