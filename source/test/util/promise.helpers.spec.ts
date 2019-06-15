import { Unexpected } from '../../util';
import * as util from '../../util';

const createNonFunctions = () => [42, { x: 42 }, "42", true];

function shouldFailsOn(
  f: Function,
  titleMapping: (value: any) => string,
  values: any[]
) {
  for (const value of values) {
    it(`should fail if argument is ${titleMapping(value)}`, cb => {
      try {
        f(value);
        cb(new Error("Does not fail"));
      } catch (e) {
        cb();
      }
    });
  }
}

describe('util.guardPromiseProcessor', () => {
  const guard = (x: any): x is number => typeof x === "number";

  it('should return function', () => {
    expect(typeof util.guardPromiseProcessor(guard, jest.fn())).toBe('function');
  });

  shouldFailsOn(
    (value: any) => util.guardPromiseProcessor(guard, value),
    (value) => `typeof operator must is ${typeof value}`,
    createNonFunctions(),
  );

  shouldFailsOn(
    (value: any) => util.guardPromiseProcessor(value, jest.fn()),
    (value) => `typeof guard must is ${typeof value}`,
    createNonFunctions(),
  );

  it("should call processor with same context if context is accepted by guard", (done) => {
    const processor = (x: number) => {
      expect(x) .toBe(42);
      done();
      return Promise.resolve();
    };
    const callback = jest.fn();
    const next = jest.fn();
    util.guardPromiseProcessor(guard, processor)(42, callback, next);
  });

  it("should call next if context is not accepted and next provided", () => {
    const processor = jest.fn();
    const callback = jest.fn();
    const next = jest.fn();
    util.guardPromiseProcessor(guard, processor)("42", callback, next);
    expect(processor).not.toBeCalled();
    expect(callback).not.toBeCalled();
    expect(next).toBeCalled();
  });

  it("should call fail callback with Unexpected if context is not accepted and next not provided", (done) => {
    const processor = jest.fn();
    const callback = function () {
      expect(arguments[0]).toBeInstanceOf(Unexpected);
      done();
    };
    util.guardPromiseProcessor(guard, processor)("42", callback);
    expect(processor).not.toBeCalled();
  });

  it('should provide positive result of processor to a callback', (done) => {
    const fn = (x: number) => Promise.resolve(x);
    const cb = function () {
      expect(arguments[0]).toBe(null);
      expect(arguments[1]).toBe(42);
      done();
    };
    util.guardPromiseProcessor(guard, fn)(42, cb);
  });

  it('should provide negative result of processor to a callback', (done) => {
    const e = new Error();
    const fn = (x: number) => Promise.reject(e);
    const cb = function () {
      expect(arguments[0]).toBe(e);
      done();
    };
    util.guardPromiseProcessor(guard, fn)(42, cb);
  });
});
