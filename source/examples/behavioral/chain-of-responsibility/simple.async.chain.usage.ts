import { buildAsyncProcessor, AsyncProcessor, success, unexpected, Next } from '../../../index';

const numericProcessor: AsyncProcessor<any, [any]> = (context, callback, next) => {
  if (typeof context !== 'number') {
    unexpected(undefined, callback, next);
  } else {
    success(callback, context * context);
  }
};

const stringProcessor: AsyncProcessor<any, [any]> = (context, callback, next) => {
  if (typeof context !== 'string') {
    unexpected(undefined, callback, next);
  } else {
    success(callback, context + context);
  }
};

const booleanProcessor: AsyncProcessor<any, [any]> = (context, callback, next) => {
  if (typeof context !== 'boolean') {
    unexpected(undefined, callback, next);
  } else {
    success(callback, !context);
  }
};

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
