import { mergeAllReducer } from "../mergeAllReducer.js";
import { switchAllReducer } from "../switchAllReducer.js";

import { mainReducer, subscriptionReducer } from "../main.js";

export const runEffectsMiddleWare = (store) => (next) => (action) => {
  const resultAction = next(action);
  const state = store.getState();

  if (state.effectObject) {
    store.dispatch({ type: "CLEAR-EFFECTS" });
    if (Array.isArray(state.effectObject)) {
      state.effectObject.forEach((e) => {
        runEffects({ ...state, effectObject: e }, store.dispatch, store);
      });
    } else {
      runEffects(state, store.dispatch, store);
    }
  }
  return resultAction;
};

function validateIfSubscribable(observable) {
  if (!["NEW", "BUFFERED"].includes(observable.observeState)) {
    throw new Error(
      `obervable ${JSON.stringify(observable)} is not ready to be subscribed`,
    );
  }
}

export function runEffects(state, dispatch_, store) {
  const dispatch = store.dispatch;

  const observable = state.observables.find(
    (obs) => obs.id == state.effectObject?.observableId,
  );

  const operatorState =
    state.operatorStates.find(
      (operator) => operator.id == observable?.operatorId,
    ) || state.operatorStates[0];

  switch (state.effectObject.type) {
    case "COMPLETE_STATE":
      dispatch({ type: "ALL-COMPLETE" });
      state.complete(store);
      break;
    case "EMIT":
      state.effectObject.next(state.effectObject.emittedValue, store);
      break;
    case "COMPLETE-OPERATOR":
      operatorState.complete?.(store);
      dispatch({
        type: "HANDLE-OPERATOR-COMPLETE",
        operatorId: state.effectObject.operatorId,
      });
      break;
    case "HANDLE-EMISSION":
      dispatch({
        type: "HANDLE-EMISSION",
        emittedValue: state.effectObject.value,
        next: state.effectObject.next,
      });
      break;
    case "UNSUBSCRIBE-EFFECT":
      if (observable.unsubscribe) observable.unsubscribe();
      dispatch({
        type: "SUBSCRIPTION-CANCEL-1",
        observableId: observable.id,
      });
      break;
    case "SUBSCRIBE-EFFECT":
      validateIfSubscribable(observable);
      //state needs to update go before actually subscribing because sometiems the observable/subscriber needs to
      //check the currently subscribed entity for calcuations
      dispatch({
        type: "SUBSCRIPTION-START-1",
        observableId: observable.id,
        operatorId: state.effectObject.operatorId,
      });
      const subcribeReturnValue = observable.subscribe(
        state.effectObject.createSubscriber(store),
      );

      if (typeof subcribeReturnValue === "function") {
        dispatch({
          type: "SET-UNSUBSCRIBE",
          observableId: observable.id,
          unsubscribe: subcribeReturnValue,
        });
      }
      break;

    default:
      break;
  }
}
