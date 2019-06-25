import { AsyncProcessor } from '../behavioral/chain-of-responsibility';
import { fail, success } from './async.helpers';
import { TypedFunction } from './typed.function';
import { unexpected, Unexpected } from './unexpected';

export function guardPromiseProcessor<BaseContext, SpecificContext extends BaseContext, Result>(
  guard: (context: BaseContext) => context is SpecificContext,
  processor: TypedFunction<[SpecificContext], Promise<Result>>
): AsyncProcessor<BaseContext, [Result], Error> {
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
      processor(context).then(result => success(callback, result), error => fail(callback, error));
    }
  };
}
