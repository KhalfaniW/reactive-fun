import { combineReducers, createStore, applyMiddleware } from "redux";
import { mergeAllReducer } from "../mergeAllReducer.js";
import { switchAllReducer } from "../switchAllReducer.js";
import { exhaustAllReducer } from "../exhaustAllReducer.js";
import { scanReducer } from "../scanReducer.js";

import { mapReducer } from "../mapReducer.js";
import { mainReducer, subscriptionReducer } from "../main.js";

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

export const stateReducer = (initialState, action) =>
  [
    mainReducer, // Make sure these reducers are defined
    subscriptionReducer,
    mergeAllReducer,
    scanReducer,
    switchAllReducer,
      mapReducer,
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
