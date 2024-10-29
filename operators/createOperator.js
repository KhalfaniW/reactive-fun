import { Observable, isObservable } from "rxjs";

export function createOperator({
  type,
  getState,
  dispatch,
  newNext,
  initOperatorAction,
} = {}) {
  return (observable) => {
    const newObservable = new Observable((originalSubscriber) => {
      const originalNext = (...params) => originalSubscriber.next(...params);
      const originalComplete = (...params) =>
        originalSubscriber.complete(...params);

      if (!getState()?.isStarted) {
        dispatch({
          type: "INIT",
          complete: originalComplete,
          observables: [],
        });
      }
      const isOperatorStateNotInitizlized = !getState().operatorStates[0];

      const newComplete = () => {
        const operatorName = getState().operatorStates[0].type;
        dispatch({
          type: "PARENT-COMPLETE",
        });
      };

      if (isOperatorStateNotInitizlized) {
        dispatch({ ...initOperatorAction, next: originalNext });
      }
      observable.subscribe({
        next: newNext,
        complete: newComplete,
      });
    });

    return newObservable;
  };
}

export function prepareObservable({ emission, id }) {
  if (!isObservable(emission)) {
    throw new Error(`non observable ,${emission} sent to exhaustAll `);
  }
  const preparedExhaustObservable = {
    subscribe: (...params) => emission.subscribe(...params),
    observeState: "NEW",
    id,
  };
  return preparedExhaustObservable;
}
