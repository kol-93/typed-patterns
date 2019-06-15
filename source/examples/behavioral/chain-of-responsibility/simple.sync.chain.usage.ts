import { buildSyncProcessor, TypedFunction, Unexpected } from '../../../index';

const numericProcessor: TypedFunction<[any], any> = context => {
  if (typeof context !== 'number') {
    throw new Unexpected('');
  } else {
    return context * context;
  }
};

const stringProcessor: TypedFunction<[any], any> = context => {
  if (typeof context !== 'string') {
    throw new Unexpected('');
  } else {
    return context + context;
  }
};

const booleanProcessor: TypedFunction<[any], any> = context => {
  if (typeof context !== 'boolean') {
    throw new Unexpected('');
  } else {
    return !context;
  }
};

const processor = buildSyncProcessor([numericProcessor, stringProcessor, booleanProcessor]);

const callWith = (value: any) => {
  try {
    const result = processor(value);
    console.log('Processing of %j succeeded: %j', value, result);
  } catch (error) {
    console.log('Processing of %j failed: %s', value, error);
  }
};

callWith(10);
// You will see:
// Processing of 10 succeeded: 100

callWith('10');
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
