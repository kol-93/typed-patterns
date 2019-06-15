import { buildAsyncProcessor, AsyncProcessor, success, unexpected, Next, guardAsyncProcessor } from '../../../index';

function numberGuard(value: any): value is number {
  return typeof value === 'number';
}

const numericProcessor = guardAsyncProcessor(
  (value: any): value is number => typeof value === 'number',
  (context, callback, next) => success(callback, context * context),
);

const stringProcessor = guardAsyncProcessor(
  (value: any): value is string => typeof value === 'string',
  (context, callback, next) => success(callback, context + context),
);

const booleanProcessor = guardAsyncProcessor(
  (value: any): value is boolean => typeof value === 'boolean',
  (context, callback, next) => success(callback, !context),
);

const processor = buildAsyncProcessor([numericProcessor, stringProcessor, booleanProcessor]);

const callWith = (value: any, next?: Next) => {
  processor(value, (error, result) => {
    if (error) {
      console.log('Processing of %j failed: %s', value, error);
    } else {
      console.log('Processing of %j succeeded: %j', value, result);
    }
  }, next);
};

callWith(10);
// You will see:
// Processing of 10 succeeded: 100

callWith("10");
// You will see:
// Processing of "10" succeeded: "1010"

callWith(true);
// You will see:
// Processing of true succeeded: false

callWith(false);
// You will see:
// Processing of false succeeded: true

callWith({ x: 42 });
// You will see:
// Processing of {"x":42} failed: Unexpected: Unexpected context

callWith({ x: 42 }, () => {
  console.log('Unaccepted by any processor');
});
// You will see:
// Unaccepted by any processor
