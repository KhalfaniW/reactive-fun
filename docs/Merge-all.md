Merge aims to combine multiple observables (obs1, obs2, etc.) into a single observable.

It does this by susbcribing to all of them, emitting events as they occur, and complaining when they have all completed

Because there is only one state merging a composableObservable reqrie special handling
When it mreges with a

original state

```js
const exampleMerged = merge(obserable1, obserable2);
```

exampleMerged subcibed => sample state

```js
state = {
  emittedValues: [
    { id: 'some-id-1', emittedValue: 1 },
    { id: 'some-id-2', emittedValue: 4 },
    { id: 'some-id-1', emittedValue: 2 }
  ],
  observables: [
    { subscribe: /* obs1 function */, id: 'some-id-1', observeState: 'RUNNING' },//on next() -> run state.subscriber
    { subscribe: /* obs2 function */, id: 'some-id-2', observeState: 'RUNNING' }
  ],
  effectObject: null,
  //exampleMerged.subscriber
  subscriber: { next: /* from exampleMerged */, complete: /* from exampleMerged */ }
}
```

```js
const mergeRanTwice = merge(exampleMerged);
```

```js
state = {
  emittedValues: [
    { id: 'some-id-1', emittedValue: 1 },
    { id: 'some-id-2', emittedValue: 4 },
    { id: 'some-id-1', emittedValue: 2 }
  ],
  observables: [
    { subscribe: /* obs1 function */, id: 'some-id-1', observeState: 'RUNNING' },//on next() -> run state.subscriber
    { subscribe: /* obs2 function */, id: 'some-id-2', observeState: 'RUNNING' }
  ],
  effectObject: null,
  //mergeRanTwice.subscriber
  subscriber: { next: /* function */, complete: /* function */ }
}
```

```js
const mergeRunningObesrvableWithNew = merge(exampleMerged, newObservable);
```

```js
state = {
  emittedValues: [
    { id: 'some-id-1', emittedValue: 1 },
    { id: 'some-id-2', emittedValue: 4 },
    { id: 'some-id-1', emittedValue: 2 }
  ],
  observables: [
    { subscribe: /* obs1 function */, id: 'some-id-1', observeState: 'RUNNING' },
    { subscribe: /* obs2 function */, id: 'some-id-2', observeState: 'RUNNING' }
    { subscribe: /* obs3 function */, id: 'some-id-3', observeState: 'RUNNING' }
  ],
  effectObject: null,
  //mergeRunningObesrvableWithNew.subscriber
  subscriber: { next: /* function */, complete: /* function */ }
}
```
