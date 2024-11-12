import { createStore, applyMiddleware } from "redux";
import { stateReducer } from "./store.js";
import {
  asyncDispatchMiddleware,
  createSaveHistoryMiddleware,
  addDispatchContext,
} from "./middleware.js";
import { runEffects } from "./effects.js";
import _ from "lodash";

// Extend Observable to init

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
    (internalState, action) => {
      if (action?.id !== undefined) {
        const operartorState = internalState?.[action.id];
        if (operartorState && operartorState.isCompleted) {
          return internalState;
        }

        return {
          ...internalState,
          [action.id]: stateReducer(operartorState, action),
        };
      }
      return internalState;
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
  debug.getFullStateReadable = () => {
    const internalState = baseReduxStore.getState();
    const numericKeys = Object.keys(internalState).map(Number);
    const sortedKeys = _.sortBy(numericKeys);
    return sortedKeys.map((key) => internalState[key]);
  };

  return {
    ...baseReduxStore,
    debug: debug,
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
