### What

Recreatee rxJS toosl using funcitona programmignto get funciotnal beneftis

Priorities:

    1. debugging
    2. testing

#### Goals:

- time travel debugging

- [x] serliziable inspectable state
- easier testing
  - create tests easily printing out state and comparing it in future tests
  - ability to inject into the middle of exection with mocks/spies and run test assertions in middle of program
    For example, you can check if 2 observables are completed and inspect the state a 3rd observable

Maybe

- automatic marble testing creation?

## Why

    The RxJS library is  not functinoal programmign at its core.

    RxJS uses a composoitino observables and operators to

    The defniiton of an obesrable is a stateful, side effect createing object.


    Many operaters are side effect creating at their like  delay(),  and debounceTime are only side effects

    Many other operatiors like scan() and take have state hidden in closures

## How

- single source of truth; 1 mutaing stat

### Observables

    Obervables by definint craete side effects.  Things like interval() and fromEvent() cannot be pure because of whaat they intend to do.

     Utilties like merge, concat and mergeAll should not create obsevables because that crates more imperceptible state because of more obserbles

## do

    - ~~change state to not be optimistic~~
       ~~only change state after effect~~

