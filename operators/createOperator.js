import { Observable, isObservable } from "rxjs";
import { makeStoreWithExtra } from "./redux/store.js";

export function createOperator({ type, newNext, initOperatorAction } = {}) {
  return (observable) => {
    const newObservable = new Observable((originalSubscriber) => {
      const storeWithExtra = makeStoreWithExtra();
      const getState = storeWithExtra.getState;
      const dispatch = storeWithExtra.dispatch;
      originalSubscriber.store = storeWithExtra;

      const originalNext = (...params) => {
        originalSubscriber.next(...params);
      };
      const originalComplete = () => {
        //TODO replace tests with custom tap opertor
        const originalFinalCompleteFunctionReference =
          originalSubscriber.destination.partialObserver.complete;
        //getting the state onComplete is helpful for testing
        originalSubscriber.destination.partialObserver.complete = () => {
          originalFinalCompleteFunctionReference({ getState, dispatch });
        };

        originalSubscriber.complete();
      };

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
      const subscriber = observable.subscribe({
        next: newNext({ dispatch, getState }),
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
