import { TypedFunction, Unexpected } from '../../util';

/**
 * Creates synchronous processor based on chain-of-responsibility
 * @param processors Chain of single-responsible processors
 */
export function buildSyncProcessor<Context, Result>(
  processors: Iterable<TypedFunction<[Context], Result>>
): TypedFunction<[Context], Result> {
  return function(context) {
    for (const operator of processors) {
      try {
        return operator(context);
      } catch (e) {
        if (e instanceof Unexpected) {
          continue;
        } else {
          throw e;
        }
      }
    }
    throw new Unexpected('Unexpected context');
  };
}
