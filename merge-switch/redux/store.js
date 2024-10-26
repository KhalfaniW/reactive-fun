import { combineReducers, createStore, applyMiddleware } from "redux";

import {
  asyncDispatchMiddleware,
  stateReducer,
  createSaveHistoryMiddleware,
  addDispatchContext,
} from "./middleware";
import { runEffectsMiddleWare } from "./effects";

export function makeStoreWithExtra() {
  let allActions_ = [];
  let allStates_ = [];

  const baseReduxStore = createStore(
    stateReducer,
    applyMiddleware(
      addDispatchContext,
      createSaveHistoryMiddleware(allStates_, allActions_),
      runEffectsMiddleWare,
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
