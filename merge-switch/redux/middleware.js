import { combineReducers, createStore, applyMiddleware } from "redux";
import { mergeAllReducer, runMergeAllEffects } from "../mergeAllReducer.js";
import { switchAllReducer, runSwitchAllEffects } from "../switchAllReducer.js";
import {
  exhaustAllReducer,
  runExhaustAllEffects,
} from "../exhaustAllReducer.js";
import { scanReducer } from "../scanReducer.js";
import { mainReducer, subscriptionReducer, runMainEffects } from "../main.js";

export const asyncDispatchMiddleware = (store) => (next) => (action) => {
  let syncActivityFinished = false;
  let actionQueue = [];

  function flushQueue() {
    actionQueue.forEach((a) => store.dispatch(a));
    actionQueue = [];
  }

  function asyncDispatch(asyncAction) {
    actionQueue = actionQueue.concat([asyncAction]);

    if (syncActivityFinished) {
      flushQueue();
    }
  }

  const actionWithAsyncDispatch = Object.assign({}, action, { asyncDispatch });

  const res = next(actionWithAsyncDispatch);

  syncActivityFinished = true;
  flushQueue();

  return res;
};

export const runEffects = (store) => (next) => (action) => {
  const resultAction = next(action);
  const resultState = store.getState();

  if (resultState.effectObject) {
    runMainEffects(resultState, store.dispatch);
    runMergeAllEffects(resultState, store.dispatch);
    runSwitchAllEffects(resultState, store.dispatch);
    runExhaustAllEffects(resultState, store.dispatch);
  }
  return resultAction;
};

export const stateReducer = (initialState, action) =>
  [
    mainReducer, // Make sure these reducers are defined
    subscriptionReducer,
    mergeAllReducer,
    scanReducer,
    switchAllReducer,
    exhaustAllReducer,
  ].reduce(
    (currentState, reducer) => reducer(currentState, action),
    initialState,
  );

export const createSaveHistoryMiddleware =
  (allStates_, allActions_) => (store) => (next) => (action) => {
    const resultAction = next(action);
    allActions_.push(action);
    allStates_.push(store.getState());
    return resultAction;
  };

export const addDispatchContext = (store) => (next) => (action) => {
  let stackTraceOrigin = null;
  try {
    throw new Error("error to log globalDispatch origin trace");
  } catch (dispatchOriginError) {
    stackTraceOrigin = () => dispatchOriginError.stack.split("\n").slice(2);
  }
  const newAction = { ...action, stackTraceOrigin };
  return next(newAction);
};
