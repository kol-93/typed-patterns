import * as dbg from 'debug';
import { Callback, getPromisifyCustomSymbol, nextTick, unexpected, fail, TypedFunction } from '../../util';
import { AsyncProcessor, IChainedProcessor } from './interface';

const debug = dbg.debug('typed-patterns/behavioral/build.async.processor');
const custom = getPromisifyCustomSymbol();

/**
 * Creates asynchronous processor based on chain-of-responsibility
 * @param processors Chain of single-responsible processors
 */
export function buildAsyncProcessor<Context, Result extends any[], Exception extends Error>(
  processors: Iterable<AsyncProcessor<Context, Result, Exception>>
): IChainedProcessor<Context, Result, Exception> {
  function chained(context: Context, callback?: Callback<Result, Exception>, next?: () => void) {
    let iterator: Iterator<AsyncProcessor<Context, Result, Exception>> | null = processors[Symbol.iterator]();
    let activeProcessor = 0;
    function cbi(callbackProcessor?: number): Callback<Result, Exception> {
      return function _callback() {
        if (callbackProcessor !== undefined && activeProcessor !== callbackProcessor) {
          debug(new Error('Late callback detected. Suppressing'));
          return;
        } else if (iterator === null) {
          debug(new Error('Duplicate callback detected. Suppressing'));
          return;
        } else {
          iterator = null;
          if (typeof callback === 'function') {
            try {
              (callback as Function).apply(null, arguments);
            } catch (e) {
              debug('Unexpected during chain', e);
            }
          } else {
            debug('Skipped result from chain', arguments);
          }
        }
      };
    }
    function nexti(callbackProcessor?: number): TypedFunction<[], void> {
      return function _next() {
        if (callbackProcessor !== undefined && activeProcessor !== callbackProcessor) {
          debug(new Error('Duplicate next call detected. Suppressing'));
          return;
        } else if (iterator === null) {
          debug(new Error('Next call detected after callback. Suppressing'));
          return;
        } else {
          const it = iterator.next();
          activeProcessor += 1;
          if (!it.done) {
            nextTick(() => {
              try {
                it.value.call(null, context, cbi(activeProcessor), nexti(activeProcessor));
              } catch (e) {
                fail(cbi(activeProcessor), e);
              }
            });
          } else {
            unexpected(undefined, cbi(activeProcessor), next);
          }
        }
      };
    }

    nexti()();
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
          });
        });
      },
      configurable: false,
      writable: false,
      enumerable: false
    });
  }

  return chained as IChainedProcessor<Context, Result, Exception>;
}
