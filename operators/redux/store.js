import { combineReducers, createStore, applyMiddleware } from "redux";

import {
  asyncDispatchMiddleware,
  stateReducer,
  createSaveHistoryMiddleware,
  addDispatchContext,
} from "./middleware.js";
import { runEffectsMiddleWare } from "./effects.js";

export { stateReducer };
import { Observable, isObservable } from "rxjs";

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
