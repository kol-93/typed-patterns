export type TypedMethod<This, Args extends any[], Result> = (this: This, ...args: Args) => Result;

export type TypedFunction<Args extends any[], Result> = (...args: Args) => Result;
