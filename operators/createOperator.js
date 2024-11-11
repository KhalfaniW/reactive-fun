import { Observable, isObservable } from "rxjs";
import { combineReducers, createStore, applyMiddleware } from "redux";

import { makeStoreWithExtra, stateReducer } from "./redux/store.js";
import {
  asyncDispatchMiddleware,
  createSaveHistoryMiddleware,
  addDispatchContext,
} from "./redux/middleware.js";
import { runEffectsMiddleWare, runEffects } from "./redux/effects.js";
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
function selectOperatorStore(allOperatorsStore, selector) {
  return {
    getState: () => allOperatorsStore.getState()[selector],
    dispatch: (action) =>
      allOperatorsStore.dispatch({ ...action, id: selector }),
    debug: allOperatorsStore.debug,
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

  let debug = {
    allStates: allStates_,
    allActions: allActions_,
    events,
  };
  const baseReduxStore = createStore(
    (state, action) => {
      if (action?.id !== undefined) {
        const operartorState = state?.[action.id];
        if (operartorState && operartorState.isCompleted) {
          return state;
        }

        return {
          ...state,
          [action.id]: stateReducer(operartorState, action),
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

        const operatorStore = {
          ...selectOperatorStore(store, action.id),
          debug: {
            ...debug,
            allStates: allStates_,
            allActions: allActions_,
            events,
          },
        };
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
                id: action.id,
                time: Date.now() - startTime,
              });
            });
          } else {
            runEffects(operatorState, operatorStore.dispatch, operatorStore);
            events.push({
              event: operatorState.effectObject,
              id: action.id,
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
  debug.getFullStateInternal = () => baseReduxStore.getState();
  debug.getFullStateReadable = () =>
    _.mapKeys(baseReduxStore.getState(), (value, key, collection) => {
      //TODO refactor to not need hack
      return `${Object.keys(collection).length + Number(key) - 1}`;
    });

  return {
    ...baseReduxStore,
    debug: debug,
  };
}
