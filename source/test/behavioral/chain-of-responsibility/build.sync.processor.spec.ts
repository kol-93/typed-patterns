import { buildSyncProcessor } from '../../../behavioral/chain-of-responsibility';
import { Unexpected } from '../../../util';

describe('buildSyncProcessor', () => {
  it('should return function', () => {
    expect(typeof buildSyncProcessor([])).toBe('function');
  });

  it('should throw Unexpected if context is not accepted by any processor', () => {
    expect(buildSyncProcessor([])).toThrow(Unexpected);
  });

  it('should pass errors from processors', () => {
    const e = new Error();
    expect(buildSyncProcessor([
      () => { throw e; } ,
    ])).toThrow(e);
  });

  it('should pass result from processors', () => {
    const result = { x: 42 };
    expect(buildSyncProcessor([
      () => result
    ])({})).toBe(result);
  });

  it('should break chain after first successful result', () => {
    const f1 = jest.fn();
    const f2 = jest.fn();
    buildSyncProcessor([f1, f2])({});
    expect(f1).toBeCalled();
    expect(f2).not.toBeCalled();
  });

  it('should break chain after first negative result', () => {
    const f1 = jest.fn(() => {
      throw new Error();
    });
    const f2 = jest.fn();
    expect(buildSyncProcessor([f1, f2])).toThrow();
    expect(f1).toBeCalled();
    expect(f2).not.toBeCalled();
  });
});
