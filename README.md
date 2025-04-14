### What

Recreate RxJS tools using functional programming to get functional benefits

Priorities:

    1. debugging
    2. testing

#### Goals:

- time travel debugging

- [x] serializable inspectable state
- easier testing
  - create tests easily printing out state and comparing it in future tests
  - ability to inject into the middle of execution with mocks/spies and run test assertions in middle of program
    For example, you can check if 2 observables are completed and inspect the state a 3rd observable

Maybe

- automatic marble testing creation?

## Why

    The RxJS library is not functional programming at its core.

    RxJS uses a composition of observables and operators to

    The definition of an observable is a stateful, side effect creating object.


    Many operators are side effect creating at their core like delay(), and debounceTime are only side effects

    Many other operators like scan() and take have state hidden in closures

## How

- single source of truth; 1 mutating state

- this adds a state variable to observables when using an operator,
- it passes state down when you compose it with another operator

### Observables

    Observables by definition create side effects. Things like interval() and fromEvent() cannot be pure because of what they intend to do.

    Utilities like merge, concat and mergeAll should not create observables because that creates more imperceptible state because of more observables

## do

    - ~~change state to not be optimistic~~
       ~~only change state after effect~~
