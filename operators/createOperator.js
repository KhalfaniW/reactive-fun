import { Observable, isObservable } from "rxjs";
import { combineReducers, createStore, applyMiddleware } from "redux";

import { makeStoreWithExtra, stateReducer } from "./redux/store.js";
import {
  asyncDispatchMiddleware,
  createSaveHistoryMiddleware,
  addDispatchContext,
} from "./redux/middleware.js";
import { runEffectsMiddleWare, runEffects } from "./redux/effects.js";

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
      const id =
        mainStore.getState() === undefined
          ? "0"
          : `${Object.keys(mainStore.getState()).length}`;

      const currentOperatorStore =
        operatorComplete === null
          ? selectOperatorStore(mainStore, "operator-id")
          : {
              dispatch: (action) => {
                debugger;
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
        const originalFinalCompleteFunctionReference =
          originalSubscriber.destination.partialObserver.complete;
        if (originalFinalCompleteFunctionReference) {
          originalSubscriber.destination.partialObserver.complete = () => {
            originalFinalCompleteFunctionReference(currentOperatorStore);
          };
        }

        originalSubscriber.complete();
        if (operatorComplete) {
          operatorComplete(mainStore);
        }
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
function selectOperatorStore(allOperatorsStore, selector) {
  return {
    getState: () => allOperatorsStore.getState()[selector],
    dispatch: (action) =>
      allOperatorsStore.dispatch({ ...action, id: selector }),
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
export function makeMainStore() {
  let allActions_ = [];
  let allStates_ = [];
  let events = [];
  let previousID = "sample-id";
  let startTime = null;
  const baseReduxStore = createStore(
    (state, action) => {
      if (action?.id !== undefined) {
        return {
          ...state,
          [action.id]: stateReducer(state?.[action.id], action),
        };
      }
      return state;
    },
    applyMiddleware(
      (store) => (next) => (action) => {
        if (action.id === undefined) {
          /*this assumes actions not dispatched in an ooperator are dispatched
           inside a middleware related to the last operator
           so it uses the previous id of the last middleware*/
          return next({ ...action, id: previousID });
        }
        previousID = action.id;
        return next(action);
      },
      (store) => (next) => (action) => {
        if (action.id === undefined) {
          throw new Error("action does not have id");
        }

        return next({ ...action, id: action.id });
      },
      (store) => (next) => (action) => {
        if (startTime === null) startTime = Date.now();
        const resultAction = next(action);
        const operatorStore = selectOperatorStore(store, action.id);
        const operatorState = operatorStore.getState();
        if (operatorState?.effectObject) {
          operatorStore.dispatch({ type: "CLEAR-EFFECTS" });
          if (Array.isArray(operatorState.effectObject)) {
            operatorState.effectObject.forEach((e) => {
              runEffects(
                { ...operatorState, effectObject: e },
                operatorStore.dispatch,
                operatorStore,
              );
              events.push({
                event: operatorState.effectObject,
                time: Date.now() - startTime,
              });
            });
          } else {
            runEffects(operatorState, operatorStore.dispatch, operatorStore);
            events.push({
              event: operatorState.effectObject,
              time: Date.now() - startTime,
            });
          }
        }
        return resultAction;
      },
      addDispatchContext,
      asyncDispatchMiddleware,
      createSaveHistoryMiddleware(allStates_, allActions_),
    ),
  );

  return {
    ...baseReduxStore,
    debug: {
      allStates: allStates_,
      allActions: allActions_,
      events,
    },
  };
}
