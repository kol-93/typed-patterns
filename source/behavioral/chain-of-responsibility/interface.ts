import { Callback, TypedFunction } from '../../util';

/**
 * Next processor selection function
 */
export type Next = TypedFunction<[], void>;

/**
 * Asynchronous processor for building chain-of-responsibility pattern
 */
export type AsyncProcessor<Context, Result extends any[] = any[], Exception extends Error = Error> = (
  context: Context,
  callback?: Callback<Result, Exception>,
  next?: Next
) => void;

/**
 * Chain of responsibility processor
 */
export interface IChainedProcessor<Context, Result extends any[] = any[], Exception extends Error = Error> {
  (context: Context, callback?: Callback<Result, Exception>, next?: () => void): void;
  __promisify__: (
    context: Context
  ) => Result extends [] ? Promise<void> : Result extends [any] ? Promise<Result[0]> : Promise<Result>;
}
