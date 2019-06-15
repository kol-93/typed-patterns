import { Callback, getPromisifyCustomSymbol, nextTick, unexpected, fail } from '../../util';
import { AsyncProcessor, IChainedProcessor } from './interface';

const custom = getPromisifyCustomSymbol();

/**
 * Creates asynchronous processor based on chain-of-responsibility
 * @param processors Chain of single-responsible processors
 */
export function buildAsyncProcessor<Context, Result extends any[], Exception extends Error>(
  processors: Iterable<AsyncProcessor<Context, Result, Exception>>
): IChainedProcessor<Context, Result, Exception> {
  function chained(context: Context, callback?: Callback<Result, Exception>, next?: () => void) {
    var iterator: Iterator<AsyncProcessor<Context, Result, Exception>> | null = processors[Symbol.iterator]();
    var i = 0;
    var called = false;
    const cb: Callback<Result, Exception> = (error, ...result) => {
      iterator = null;
      if (typeof callback === 'function') {
        try {
          if (!called) {
            callback(error, ...result);
            called = true;
          }
        } catch (e) {
          console.warn('Unexpected during chain', e);
        }
      } else {
        console.warn('Skipped result from chain', arguments);
      }
    };
    function tryNext() {
      if (iterator) {
        const it = iterator.next();
        i += 1;
        if (!it.done) {
          nextTick(() => {
            try {
              it.value.call(null, context, cb, tryNext);
            } catch (e) {
              fail(cb, e);
            }
          });
        } else {
          if (typeof next === 'function') {
            try {
              next();
            } catch (e) {
              console.warn('Unexpected during chain.next', e);
            }
          } else {
            unexpected(undefined, callback, next);
          }
        }
      }
    }
    tryNext();
  }

  if (typeof custom === 'symbol') {
    Object.defineProperty(chained, custom, {
      value: (context: Context): Promise<Result> => {
        return new Promise((resolve, reject) => {
          chained(context, (error, ...result) => {
            if (error) {
              reject(error);
            } else if (result.length === 1) {
              resolve(result[0]);
            } else if (result.length !== 0) {
              resolve(result as Result);
            } else {
              resolve();
            }
          })
        });
      },
      configurable: false,
      writable: false,
      enumerable: false,
    });
  }

  return chained as IChainedProcessor<Context, Result, Exception>;
}
