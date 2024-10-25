import { mergeAllReducer } from "../mergeAllReducer.js";
import { switchAllReducer } from "../switchAllReducer.js";
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
}

export const runEffectsMiddleWare = (store) => (next) => (action) => {
  const resultAction = next(action);
  const resultState = store.getState();

  if (resultState.effectObject) {
    const effectRunners = [
      runMainEffects,
      runMergeAllEffects,
      runExhaustEffects,
      runSwitchEffects,
    ];

    for (const runEffects of effectRunners) {
      runAllEffects(resultState, store.dispatch, store, runEffects);
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

export function runMergeAllEffects(state, dispatch) {
  switch (state.effectObject.type) {
    case "SUBSCRIBE-EFFECT(mergeAll)":
      const observable = state.observables.find(
        (obs) => obs.id == state.effectObject.observableId,
      );

      const operatorState = state.operatorStates.find(
        (operator) => operator.id == observable.operatorId,
      );

      validateIfSubscribable(observable);

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

function runExhaustEffects(state, dispatch, store) {
  const observable = state.observables.find(
    (obs) => obs.id == state.effectObject?.observableId,
  );

  const operatorState = state.operatorStates.find(
    (operator) => operator.id == observable?.operatorId,
  );

  switch (state.effectObject.type) {
    case "UNSUBSCRIBE-EFFECT(exhaustAll)":
      if (observable.unsubscribe) observable.unsubscribe();

      dispatch({
        type: "SUBSCRIPTION-CANCEL-1",
        observableId: observable.id,
      });
      break;

    case "SUBSCRIBE-EFFECT(exhaustAll)":
      validateIfSubscribable(observable);

      dispatch({
        type: "SUBSCRIPTION-START-1",
        observableId: observable.id,
        operatorId: state.effectObject.operatorId,
      });

      const subcribeReturnValue = observable.subscribe({
        next: (value) => {
          const operatorState = store
            .getState()
            .operatorStates.find(
              (operator) => operator.id == observable?.operatorId,
            );

          if (operatorState.currentObservableId === observable.id) {
            dispatch({
              type: "HANDLE-EMISSION",
              observableId: observable.id,
              emittedValue: value,
            });

            operatorState.next(value, observable);
          }
        },
        complete: () => {
          dispatch({
            type: "HANDLE-OBSERVABLE-COMPLETE(exhaustAll)",
            observableId: observable.id,
            operatorId: state.effectObject.operatorId,
          });
        },
      });

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
export function runAllEffects(state, dispatch, store, runEffects) {
  if (Array.isArray(state.effectObject)) {
    state.effectObject.forEach((e) => {
      runEffects({ ...state, effectObject: e }, dispatch, store);
    });
  } else {
    runEffects(state, dispatch, store);
  }
}
function runSwitchEffects(state, dispatch, store) {
  const observable = state.observables.find(
    (obs) => obs.id == state.effectObject?.observableId,
  );

  const operatorState = state.operatorStates.find(
    (operator) => operator.id == observable?.operatorId,
  );

  switch (state.effectObject.type) {
    case "UNSUBSCRIBE-EFFECT(switchAll)":
      if (observable.unsubscribe) observable.unsubscribe();

      dispatch({
        type: "SUBSCRIPTION-CANCEL-1",
        observableId: observable.id,
      });
      break;

    case "SUBSCRIBE-EFFECT(switchAll)":
      if (!["NEW", "BUFFERED"].includes(observable.observeState)) {
        throw new Error(
          `obervable ${JSON.stringify(
            observable,
          )} is not ready to be subscribed`,
        );
      }

      dispatch({
        type: "SUBSCRIPTION-START-1",
        observableId: observable.id,
        operatorId: state.effectObject.operatorId,
      });

      const subcribeReturnValue = observable.subscribe({
        next: (value) => {
          const operatorState = store
            .getState()
            .operatorStates.find(
              (operator) => operator.id == observable?.operatorId,
            );

          if (operatorState.currentObservableId === observable.id) {
            dispatch({
              type: "HANDLE-EMISSION",
              observableId: observable.id,
              emittedValue: value,
            });

            operatorState.next(value, observable);
          }
        },
        complete: () => {
          dispatch({
            type: "HANDLE-OBSERVABLE-COMPLETE(switchAll)",
            observableId: observable.id,
            operatorId: state.effectObject.operatorId,
          });
        },
      });

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
