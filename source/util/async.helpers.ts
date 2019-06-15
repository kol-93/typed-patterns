import * as async from 'async';
import { AsyncProcessor } from '../behavioral/chain-of-responsibility';
import { NameSpace } from './name.space';
import { TypedFunction } from './typed.function';
import { unexpected } from './unexpected';

/**
 * Callback function type
 */
export type Callback<Result extends any[] = any[], Exception extends Error = Error> = (
  error?: Exception | null,
  ...result: Result
) => void;

/**
 * Asynchronous worker function type
 */
export type AsyncWorker<
  Result extends any[] = any[],
  Exception extends Error = Error,
  Parameter = void
> = Parameter extends void
  ? (callback?: Callback<Result, Exception>) => void
  : (parameter: Parameter, callback?: Callback<Result, Exception>) => void;

/**
 * Collection of asynchronous workers
 */
export type WorkersCollection<Results, Exception extends Error, Parameter> = {
  [key in keyof Results]: AsyncWorker<[Results[key]], Exception, Parameter>
};

/**
 * Fails specified callback
 * @param [callback] Callback function
 * @param error Exception object
 */
export function fail<Result extends any[], Exception extends Error>(
  callback: Callback<Result, Exception> | undefined,
  error: Exception
) {
  if (typeof callback === 'function') {
    (callback as Callback<any[], Exception>)(error);
  } else if (typeof callback !== 'undefined') {
    throw new TypeError('Function expected');
  }
}

/**
 * Successes specified callback
 * @param [callback] Callback function
 * @param result Array of result items
 */
export function success<Result extends any[], Exception extends Error>(
  callback: Callback<Result, Exception> | undefined,
  ...result: Result
) {
  if (typeof callback === 'function') {
    callback(null, ...result);
  } else if (typeof callback !== 'undefined') {
    throw new TypeError('Function expected');
  }
}

/**
 * Joins onSuccess and onFail callback into classical asynchronous callback function
 * @param onSuccess Callback function that must be called on success result
 * @param onFail Callback function that must be called on error
 */
export function join<Result extends any[], Exception extends Error>(
  onSuccess: TypedFunction<Result, void>,
  onFail: TypedFunction<[Exception], void>
): Callback<Result, Exception> {
  if (typeof onSuccess !== 'function') {
    throw new TypeError('Function expected');
  }
  if (typeof onFail !== 'function') {
    throw new TypeError('Function expected');
  }
  return function(error?: Exception | null, ...result: Result) {
    if (error) {
      onFail(error);
    } else {
      onSuccess.apply(null, result);
    }
  };
}

/**
 * Returns callback that wraps array of success results into single tuple
 * @param callback Callback that accepts array of results as tuple
 */
export function wrapCallback<Result extends any[], Exception extends Error>(
  callback: Callback<[Result], Exception>
): Callback<Result, Exception> {
  if (typeof callback !== 'function') {
    throw new TypeError('Function expected');
  }
  return function(error?: Exception | null, ...result: Result) {
    if (error) {
      fail(callback, error);
    } else {
      success(callback, result);
    }
  };
}

/**
 * Returns callback that unwraps single tuple to an array of success results
 * @param callback Callback that accepts array of success results
 */
export function unwrapCallback<Result extends any[], Exception extends Error>(
  callback: Callback<Result, Exception>
): Callback<[Result], Exception> {
  if (typeof callback !== 'function') {
    throw new TypeError('Function expected');
  }
  return function(error?: Exception | null, ...result: [Result]) {
    if (error) {
      fail(callback, error);
    } else {
      success(callback as Callback<any[], Exception>, ...(result[0] || []));
    }
  };
}

/**
 * Returns asynchronous worker function that wraps array of results into single tuple
 * @param worker Asynchronous worker function that provides array of results to a callback
 */
export function wrapWorker<Result extends any[], Exception extends Error>(
  worker: AsyncWorker<Result, Exception, void>
): AsyncWorker<[Result], Exception, void> {
  if (typeof worker !== 'function') {
    throw new TypeError('Function expected');
  }
  return function(callback) {
    (worker as AsyncWorker<Result, Exception, void>)(callback ? wrapCallback(callback) : undefined);
  } as AsyncWorker<[Result], Exception, void>;
}

/**
 * Returns asynchronous worker function that unwraps single result to an array of results
 * @param worker Asynchronous worker function that provides single result as tuple
 */
export function unwrapWorker<Result extends any[], Exception extends Error>(
  worker: AsyncWorker<[Result], Exception, void>
): AsyncWorker<Result, Exception, void> {
  if (typeof worker !== 'function') {
    throw new TypeError('Function expected');
  }
  return function(callback) {
    (worker as AsyncWorker<[Result], Exception, void>)(callback ? unwrapCallback(callback) : undefined);
  } as AsyncWorker<Result, Exception, void>;
}

/**
 * Collects result provided by collection of asynchronous workers
 * @param collection Collection of asynchronous workers
 * @see WorkersCollection
 */
export function collect<Results extends any[], Exception extends Error>(
  collection: WorkersCollection<Results, Exception, void>
): AsyncWorker<[Results], Exception, void>;
export function collect<Results extends NameSpace, Exception extends Error>(
  collection: WorkersCollection<Results, Exception, void>
): AsyncWorker<[Results], Exception, void>;
export function collect<Results, Exception extends Error>(
  collection: WorkersCollection<Results, Exception, void>
): AsyncWorker<[Results], Exception, void> {
  return function(callback?: Callback<any[], Exception>) {
    if (Array.isArray(collection)) {
      async.parallel(collection, (error, results) => {
        if (error) {
          fail(callback, error as Exception);
        } else {
          success(callback, results);
        }
      });
    } else {
      async.parallel(collection, (error, results) => {
        if (error) {
          fail(callback, error as Exception);
        } else {
          success(callback, results);
        }
      });
    }
  } as AsyncWorker<[Results], Exception, void>;
}

/**
 * Returns asynchronous processor functions that uses type-guard for accepting specific context
 * and delegates work to specified processor
 * @param guard Type-guard function for specific context acceptance
 * @param processor Asynchronous processor function for specific context
 */
export function guardAsyncProcessor<
  BaseContext,
  SpecificContext extends BaseContext,
  Result extends any[] = any[],
  Exception extends Error = Error
>(
  guard: (context: BaseContext) => context is SpecificContext,
  processor: AsyncProcessor<SpecificContext, Result, Exception>
): AsyncProcessor<BaseContext, Result, Error> {
  if (typeof guard !== 'function') {
    throw new TypeError('Function expected as guard');
  }
  if (typeof processor !== 'function') {
    throw new TypeError('Function expected as guard');
  }
  return (context, callback, next) => {
    if (!guard(context)) {
      unexpected(undefined, callback, next);
    } else {
      processor(context, callback, next);
    }
  };
}
