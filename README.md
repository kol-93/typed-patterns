# Typed-Patterns

Basic design patterns for TypeScript.

[Documentation](https://kol-93.github.io/typed-patterns)

_This project is under development and may make breaking changes in minor versions until 1.0._

## Installation

```bash
npm install typed-patterns
```

## Patterns

### Behavioral

* Synchronous and asynchronous **chain-of-responsibility**. See examples in `source/examples/behavioral/chain-of-responsibility` 

## Utilities

### Asynchronous helpers

* `success(callback, ...result)` calls specified callback as successful with array of results
* `fail(callback, error)` calls specified callback as failed with specified error
* `join(onSuccess, onError)` builds classical callback function from two success-callback and error-callback
* `wrapCallback(callback)` builds callback function that wraps array of success results into single tuple
* `unwrapCallback(callback)` builds callback function that unwraps single tuple to an array of success results
* `wrapWorker(worker)` builds asynchronous worker function that wraps array of results into single tuple
* `unwrapWorker(worker)` builds asynchronous worker function that unwraps single result to an array of results
* `collect(workersCollection)` builds asynchronous worker that collects results from all passed workers
* `guardAsyncProcessor(guard, processor)` builds asynchronous processor responsible only for type-guarded context

### Promise helpers

* `guardPromiseProcessor(guard, processor)` builds asynchronous processor responsible only for type-guarded context

### Unexpected context exception helpers

* `class Unexpected` Base class of unexpected context exception
* `unexpected(message?, callback?, next?)` Calls next (if specified) or passes Unexpected exception to callback (if specified)
