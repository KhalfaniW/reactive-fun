### What

Recreatee rxJS toosl using funcitona programmignto get funciotnal beneftis

- time travel debugging
- serliziable inspectable state
- easier testing

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
    - change state to not be optimistic
       only change state after effect
