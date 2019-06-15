import { Unexpected } from '../../util';
import * as util from '../../util';

const createArgs = () => [42, { x: 42 }, '42', true];

const createNonFunctions = () => [42, { x: 42 }, '42', true];

function shouldFailsOn(f: Function, titleMapping: (value: any) => string, values: any[]) {
  for (const value of values) {
    it(`should fail if argument is ${titleMapping(value)}`, cb => {
      try {
        f(value);
        cb(new Error('Does not fail'));
      } catch (e) {
        cb();
      }
    });
  }
}

describe('util.fail', () => {
  it('should not fail without callback', () => {
    util.fail(undefined, new Error());
  });

  shouldFailsOn(util.fail, value => `typeof callback is ${typeof value}`, createNonFunctions());

  it('should call provided callback', () => {
    const f = jest.fn();
    util.fail(f, new Error());
    expect(f).toBeCalled();
  });

  it('should provide single argument to specified callback', () => {
    const f = jest.fn();
    const error = new Error();
    util.fail(f, error);
    expect(f).toBeCalledWith(error);
  });

  it('should not provide any arguments except first to specified callback', () => {
    const f = jest.fn();
    const error = new Error();
    (util.fail as Function)(f, error, 42);
    expect(f).toBeCalledWith(error);
  });
});

describe('util.success', () => {
  it('should not fail without callback', () => {
    util.success(undefined);
  });

  shouldFailsOn(util.success, value => `typeof callback is ${typeof value}`, createNonFunctions());

  it('should provide null as first argument to specified callback', () => {
    const f = jest.fn();
    util.success(f);
    expect(f).toBeCalledWith(null);
  });

  it('should provide all arguments to a callback after first null', () => {
    const f = jest.fn();
    const args = [42, { x: 42 }, '42', true];
    util.success(f, ...args);
    expect(f).toBeCalledWith(null, ...args);
  });
});

describe('util.join', () => {
  it('should return function', () => {
    const onSuccess = jest.fn();
    const onFail = jest.fn();
    expect(typeof util.join(onSuccess, onFail)).toBe('function');
  });

  it('should provide error as first argument of onFail callback', () => {
    const onSuccess = jest.fn();
    const onFail = jest.fn();
    const error = new Error();
    util.join(onSuccess, onFail)(error);
    expect(onFail).toBeCalledWith(error);
    expect(onSuccess).not.toBeCalled();
  });

  it('should provide results as argument of onSuccess callback', () => {
    const onSuccess = jest.fn();
    const onFail = jest.fn();
    const args = createArgs();
    util.join(onSuccess, onFail)(null, ...args);
    expect(onFail).not.toBeCalled();
    expect(onSuccess).toBeCalledWith(...args);
  });

  shouldFailsOn(
    (value: any) => util.join(value, jest.fn()),
    value => `typeof onSuccess is ${typeof value}`,
    createNonFunctions()
  );

  shouldFailsOn(
    (value: any) => util.join(jest.fn(), value),
    value => `typeof onFail is ${typeof value}`,
    createNonFunctions()
  );
});

describe('util.wrapCallback', () => {
  it('should return function', () => {
    expect(typeof util.wrapCallback(jest.fn())).toBe('function');
  });

  shouldFailsOn(util.wrapCallback, value => `typeof callback is ${typeof value}`, createNonFunctions());

  it('should provide wrapped result to specified callback', () => {
    const fn = jest.fn();
    const args = createArgs();
    util.success(util.wrapCallback(fn), ...args);
    expect(fn).toBeCalledWith(null, args);
  });

  it('should provide error to specified callback', () => {
    const fn = jest.fn();
    const e = new Error();
    util.fail(util.wrapCallback(fn), e);
    expect(fn).toBeCalledWith(e);
  });
});

describe('util.unwrapCallback', () => {
  it('should return function', () => {
    expect(typeof util.unwrapCallback(jest.fn())).toBe('function');
  });

  shouldFailsOn(util.unwrapCallback, value => `typeof callback is ${typeof value}`, createNonFunctions());

  it('should provide unwrapped result to specified callback', () => {
    const fn = jest.fn();
    const args = createArgs();
    util.success(util.unwrapCallback(fn), args);
    expect(fn).toBeCalledWith(null, ...args);
  });

  it('should provide error to specified callback', () => {
    const fn = jest.fn();
    const e = new Error();
    util.fail(util.unwrapCallback(fn), e);
    expect(fn).toBeCalledWith(e);
  });
});

describe('util.wrapWorker', () => {
  it('should return function', () => {
    expect(typeof util.wrapWorker(jest.fn())).toBe('function');
  });

  shouldFailsOn(util.wrapWorker, value => `typeof callback is ${typeof value}`, createNonFunctions());

  it('should provide wrapped result to specified callback', () => {
    const fn = jest.fn();
    const args = createArgs();
    const worker: util.AsyncWorker<typeof args, Error, void> = callback => {
      util.success(callback, ...args);
    };
    const wrapped = util.wrapWorker(worker);
    wrapped(fn);
    expect(fn).toBeCalledWith(null, args);
  });

  it('should provide error to specified callback', () => {
    const fn = jest.fn();
    const e = new Error();
    const worker: util.AsyncWorker<[], Error, void> = callback => {
      util.fail(callback, e);
    };
    const wrapped = util.wrapWorker(worker);
    wrapped(fn);
    expect(fn).toBeCalledWith(e);
  });
});

describe('util.unwrapWorker', () => {
  it('should return function', () => {
    expect(typeof util.unwrapWorker(jest.fn())).toBe('function');
  });

  shouldFailsOn(util.unwrapWorker, value => `typeof callback is ${typeof value}`, createNonFunctions());

  it('should provide wrapped result to specified callback', () => {
    const fn = jest.fn();
    const args = createArgs();
    const worker: util.AsyncWorker<[typeof args], Error, void> = callback => {
      util.success(callback, args);
    };
    const unwrapped = util.unwrapWorker(worker);
    unwrapped(fn);
    expect(fn).toBeCalledWith(null, ...args);
  });

  it('should provide error to specified callback', () => {
    const fn = jest.fn();
    const e = new Error();
    const worker: util.AsyncWorker<[[]], Error, void> = callback => {
      util.fail(callback, e);
    };
    const wrapped = util.unwrapWorker(worker);
    wrapped(fn);
    expect(fn).toBeCalledWith(e);
  });
});

describe('util.collect', () => {
  it('should return function', () => {
    expect(typeof util.collect([])).toBe('function');
  });

  it('should provide result of object-collection of workers as object', () => {
    const fn = jest.fn();
    util.collect({
      x: callback => util.success(callback, 42),
      y: callback => util.success(callback, '42'),
      z: callback => util.success(callback, { x: 42 }),
      w: callback => util.success(callback, true)
    })(fn);
    expect(fn).toBeCalledWith(null, {
      x: 42,
      y: '42',
      z: { x: 42 },
      w: true
    });
  });

  it('should provide error if any of object-collection of workers failed', () => {
    const fn = jest.fn();
    const e = new Error();
    util.collect({
      x: callback => util.success(callback, 42),
      y: callback => util.success(callback, '42'),
      z: callback => util.fail(callback, e),
      w: callback => util.success(callback, true)
    })(fn);
    expect(fn).toBeCalledWith(e);
  });

  it('should provide first consumed error if any of object-collection of workers failed', done => {
    const e1 = new Error();
    const e2 = new Error();
    const fn = function() {
      expect(arguments[0]).toBe(e2);
      done();
    };
    util.collect({
      x: callback => util.success(callback, 42),
      y: callback => util.success(callback, '42'),
      z: callback => setTimeout(() => util.fail(callback, e1), 100),
      w: callback => setTimeout(() => util.fail(callback, e2), 50)
    })(fn);
  });

  it('should provide result of array-collection of workers as array', () => {
    const fn = jest.fn();
    util.collect([
      callback => util.success(callback, 42),
      callback => util.success(callback, '42'),
      callback => util.success(callback, { x: 42 }),
      callback => util.success(callback, true)
    ])(fn);
    expect(fn).toBeCalledWith(null, [42, '42', { x: 42 }, true]);
  });

  it('should provide error if any of array-collection of workers failed', () => {
    const fn = jest.fn();
    const e = new Error();
    util.collect([
      callback => util.success(callback, 42),
      callback => util.success(callback, '42'),
      callback => util.fail(callback, e),
      callback => util.success(callback, true)
    ])(fn);
    expect(fn).toBeCalledWith(e);
  });

  it('should provide first consumed error if any of array-collection of workers failed', done => {
    const e1 = new Error();
    const e2 = new Error();
    const fn = function() {
      expect(arguments[0]).toBe(e2);
      done();
    };
    util.collect([
      callback => util.success(callback, 42),
      callback => util.success(callback, '42'),
      callback => setTimeout(() => util.fail(callback, e1), 100),
      callback => setTimeout(() => util.fail(callback, e2), 50)
    ])(fn);
  });
});

describe('util.guardAsyncProcessor', () => {
  const guard = (x: any): x is number => typeof x === 'number';
  it('should return function', () => {
    expect(typeof util.guardAsyncProcessor(guard, (context, callback, next) => {})).toBe('function');
  });

  shouldFailsOn(
    (value: any) => util.guardAsyncProcessor(guard, value),
    value => `typeof operator must is ${typeof value}`,
    createNonFunctions()
  );

  shouldFailsOn(
    (value: any) => util.guardAsyncProcessor(value, () => undefined),
    value => `typeof guard must is ${typeof value}`,
    createNonFunctions()
  );

  it('should call processor with same context, callback and next if context is accepted by guard', () => {
    const processor = jest.fn();
    const callback = jest.fn();
    const next = jest.fn();
    util.guardAsyncProcessor(guard, processor)(42, callback, next);
    expect(processor).toBeCalledWith(42, callback, next);
  });

  it('should call next if context is not accepted and next provided', () => {
    const processor = jest.fn();
    const callback = jest.fn();
    const next = jest.fn();
    util.guardAsyncProcessor(guard, processor)('42', callback, next);
    expect(processor).not.toBeCalled();
    expect(callback).not.toBeCalled();
    expect(next).toBeCalled();
  });

  it('should call fail callback with Unexpected if context is not accepted and next not provided', done => {
    const processor = jest.fn();
    const callback = function() {
      expect(arguments[0]).toBeInstanceOf(Unexpected);
      done();
    };
    util.guardAsyncProcessor(guard, processor)('42', callback);
    expect(processor).not.toBeCalled();
  });
});
