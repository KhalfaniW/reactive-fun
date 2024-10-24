import { mergeAllReducer } from "../mergeAllReducer.js";
import { switchAllReducer, runSwitchAllEffects } from "../switchAllReducer.js";
import {
  exhaustAllReducer,
  runExhaustAllEffects,
} from "../exhaustAllReducer.js";
import { scanReducer } from "../scanReducer.js";
import { mainReducer, subscriptionReducer } from "../main.js";

export function runMainEffects(state, dispatch) {
  if (state.effectObject?.type == "COMPLETE_STATE") {
    dispatch({ type: "ALL-COMPLETE" });
    state.complete();
    return;
  }
  if (state.effectObject?.type == "COMPLETE-OPERATOR") {
    dispatch({
      type: "HANDLE-OPERATOR-COMPLETE",
      operatorId: state.effectObject.operatorId,
    });
    state.complete();
    return;
  }
  return state;
}
export const runEffectsMiddleWare = (store) => (next) => (action) => {
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
export function runMergeAllEffects(state, dispatch) {
  //TODO add array effect handling
  if (Array.isArray(state.effectObject)) return;
  if (!state.effectObject) console.log(state);
  switch (state.effectObject.type) {
    case "SUBSCRIBE-EFFECT(mergeAll)":
      const observable = state.observables.find(
        (obs) => obs.id == state.effectObject.observableId,
      );

      const operatorState = state.operatorStates.find(
        (operator) => operator.id == observable.operatorId,
      );
      if (!["NEW", "BUFFERED"].includes(observable.observeState)) {
        throw new Error(
          `obervable ${JSON.stringify(
            observable,
          )} is not ready to be subscribed`,
        );
      }

      observable.subscribe({
        next: (value) => {
          operatorState.next(value, observable);
        },
        complete: () => {
          dispatch({
            type: "HANDLE-OBSERVABLE-COMPLETE(mergeAll)",
            observableId: observable.id,
            operatorId: state.effectObject.operatorId,
          });
        },
      });
      dispatch({
        type: "SUBSCRIPTION-START-1",
        observableId: observable.id,
        operatorId: state.effectObject.operatorId,
      });
      break;

    default:
      break;
  }
}
