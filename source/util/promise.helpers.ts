import { AsyncProcessor } from '../behavioral/chain-of-responsibility';
import { fail, success } from './async.helpers';
import { TypedFunction } from './typed.function';
import { Unexpected } from './unexpected';

export function guardPromiseProcessor<BaseContext, SpecificContext extends BaseContext, Result>(
    guard: (context: BaseContext) => context is SpecificContext,
    processor: TypedFunction<[SpecificContext], Promise<Result>>
): AsyncProcessor<BaseContext, [Result], Error> {
    if (typeof guard !== "function") {
        throw new TypeError("Function expected as guard");
    }
    if (typeof processor !== "function") {
        throw new TypeError("Function expected as guard");
    }
    return (context, callback, next) => {
        if (!guard(context)) {
            if (typeof next === 'function') {
                next();
            } else {
                fail(callback, new Unexpected('Invalid context type'));
            }
        } else {
            processor(context).then(
                (result) => success(callback, result),
                (error) => fail(callback, error),
            );
        }
    };
}
