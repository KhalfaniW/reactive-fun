import { combineReducers, createStore, applyMiddleware } from "redux";

import {
  asyncDispatchMiddleware,
  runEffects,
  stateReducer,
  createSaveHistoryMiddleware,
  addDispatchContext,
} from "./middleware";

export function makeStoreWithExtra() {
  let allActions_ = [];
  let allStates_ = [];

  const baseReduxStore = createStore(
    stateReducer,
    applyMiddleware(
      addDispatchContext,
      createSaveHistoryMiddleware(allStates_, allActions_),
      runEffects,
      asyncDispatchMiddleware,
    ),
  );

  return {
    ...baseReduxStore,
    debug: {
      allStates: allStates_,
      allActions: allActions_,
    },
  };
}
