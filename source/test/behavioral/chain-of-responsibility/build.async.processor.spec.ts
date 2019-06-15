import { success } from "../../../util";
import * as util from "../../../util";
import { buildAsyncProcessor } from "../../../behavioral/chain-of-responsibility";

describe("buildAsyncProcessor", () => {
  it("should return function", () => {
    expect(typeof buildAsyncProcessor([])).toBe("function");
  });

  it('should work after all synchronous code', (done) => {
    const next = jest.fn();
    const cb = jest.fn();
    buildAsyncProcessor([
      (context, callback, next) => next && next(),
      (context, callback, next) => next && next(),
      (context, callback, next) => next && next(),
      (context, callback, next) => next && next(),
    ])({}, cb, next);
    expect(cb).not.toBeCalled();
    expect(next).not.toBeCalled();
    done();
  });

  it('should work before any timeout', (done) => {
    const next = jest.fn();
    const cb = jest.fn();
    buildAsyncProcessor([
      (context, callback, next) => next && next(),
      (context, callback, next) => next && next(),
      (context, callback, next) => next && next(),
      (context, callback, next) => next && next(),
    ])({}, cb, next);
    setTimeout(() => {
      expect(next).toBeCalled();
      expect(cb).not.toBeCalled();
      done();
    }, 1);
  });

  it("should pass synchronous error to callback", done => {
    const e = new Error();
    buildAsyncProcessor([
      (context, callback, next) => {
        throw e;
      }
    ])({}, (error, result) => {
      expect(error).toBe(e);
      done();
    });
  });

  it("should not callback more than once", done => {
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

  it("should pass everything to callback", done => {
    const args = [null, 42, "42", { x: 42 }, true];
    const fn = jest.fn();
    buildAsyncProcessor([
      (context, callback, next) => {
        if (typeof callback === "function") {
          (callback as Function)(...args);
        }
        expect(fn).toBeCalledWith(...args);
        done();
      }
    ])({}, fn);
  });

  it("should break chain after first callback", done => {
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
