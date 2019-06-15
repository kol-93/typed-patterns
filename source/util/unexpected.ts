import { Callback, fail } from './async.helpers';

export class Unexpected extends Error {
  public constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export function unexpected<Result extends any[], Exception extends Error>(
  message: string = 'Unexpected context',
  callback?: Callback<Result, Exception>,
  next?: () => void
): void {
  if (typeof next === 'function') {
    next();
  } else {
    fail(callback, new Unexpected(message) as Exception);
  }
}
