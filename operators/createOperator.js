import { Observable, isObservable } from "rxjs";
import { makeMainStore } from "./redux/mainStore.js";
import { createStore, applyMiddleware } from "redux";
import { stateReducer } from "./redux/store.js";
import {
  asyncDispatchMiddleware,
  createSaveHistoryMiddleware,
  addDispatchContext,
} from "./redux/middleware.js";
import { runEffects } from "./redux/effects.js";
import _ from "lodash";

// Extend Observable to initialize a new mainStore for each instance
const OriginalObservable = Observable;
Object.defineProperty(Observable.prototype, "mainStore", {
  //this should be replaced by a class that extend Observables
  get() {
    if (this._mainStore === undefined) {
      this._mainStore = makeMainStore();
    }
    return this._mainStore;
  },
  set(value) {
    this._mainStore = value;
  },
});

export function createOperator({
  type,
  newNext,
  initOperatorAction,
  complete,
  operatorComplete = null,
  // id = null,
} = {}) {
  return (observable) => {
    const mainStore = observable.mainStore;
    const newObservable = new Observable((originalSubscriber) => {
      //subscriptions are evaluated reversse order from caller to source
      //use negative ids to signal that it is called last to first
      const id = `${-Object.keys(mainStore.getState() || []).length}`;

      const currentOperatorStore = {
        dispatch: (action) => {
          mainStore.dispatch({ ...action, id });
        },
        getState: () => mainStore.getState()[id],
        debug: mainStore.debug,
      };

      originalSubscriber.store = currentOperatorStore;

      const originalNext = (...params) => {
        originalSubscriber.next(...params);
      };

      const observableComplete = () => {
        //add store to operator complete
        const originalFinalCompleteFunctionReference =
          originalSubscriber.destination.partialObserver.complete;
        if (originalFinalCompleteFunctionReference) {
          originalSubscriber.destination.partialObserver.complete = () => {
            originalFinalCompleteFunctionReference(currentOperatorStore);
          };
        }
        originalSubscriber.complete();
      };

      currentOperatorStore.dispatch({
        type: "INIT",
        complete: () => {
          observableComplete();
          complete?.(currentOperatorStore);
        },
        observables: [],
      });
      currentOperatorStore.dispatch({
        ...initOperatorAction,
        next: originalNext,
      });

      const sourceObservableSubscriber = observable.subscribe({
        //the subscribed observable will emit even if the operator completes
        // such actions are ignored in the state reducer
        next: newNext(currentOperatorStore),
        complete: () => {
          currentOperatorStore.dispatch({
            type: "PARENT-COMPLETE",
          });
        },
      });
    });
    newObservable.mainStore = mainStore;
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
