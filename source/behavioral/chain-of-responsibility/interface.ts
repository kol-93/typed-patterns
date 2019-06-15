import { Callback } from '../../util';


export type AsyncProcessor<Context, Result extends any[], Exception extends Error> = (
    context: Context,
    callback?: Callback<Result, Exception>,
    next?: () => void
) => void;

export interface IChainedProcessor<Context, Result extends any[], Exception extends Error> {
    (context: Context, callback?: Callback<Result, Exception>, next?: () => void): void;
    __promisify__: (context: Context) => Result extends []
                                         ? Promise<void>
                                         : Result extends [any]
                                           ? Promise<Result[0]>
                                           : Promise<Result>;
}
