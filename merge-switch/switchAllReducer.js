import { mainReducer, getState } from "./main.js";

/**
 * @param {{ list: any[], selector: (element: any) => boolean, stateChange: object }} params
 * @param {any[]} params.list
 * @param {(element: any) => boolean} params.selector
 * @param {object} params.stateChange
 * @returns {any[]}
 */
const updateMatchingElements = ({ list, selector, stateChange }) => {
  return list.map((element) =>
    selector(element) ? { ...element, ...stateChange } : element,
  );
};

/**
 * @typedef {Object} StateObject
 * @property {boolean} hasCompleted - Indicates whether the process has been completed.
 * @property {Observable<any>[]} buffer - An array of Observables that hold various data items.
 * @property {number} active - An index representing the currently active item in the buffer.
 */

/**
 * A function that processes the state.
 *
 * @param {StateObject} state - The state object containing completion status, buffer, and active index.
 * @param {Object} action
 */

export function switchAllReducer(
  state = {
    operatorStates: [],
    observables: [],
    next: () => {},
  },
  action,
) {
  const updateActionObservable = (stateChange) => {
    return updateMatchingElements({
      list: state.observables,
      selector: (observable) => observable.id === action.observableId,
      stateChange: stateChange,
    });
  };
  const thisOperator = state.operatorStates?.find(
    (operator) => operator.id === action.operatorId,
  );

  switch (action.type) {
    case "INIT(switchAll)":
      return {
        ...state,
        operatorStates: (state.operatorStates || []).concat({
          type: "switchAll",
          id: action.operatorId,
          isCompleted: false,
          next: action.next,
          currentObservableId: null,
        }),
      };
    case "HANDLE-NEW-OBSERVABLE(switchAll)":
      const currentOperator = state.operatorStates.find(
        (op) => op.id === action.operatorId,
      );
      if (currentOperator.currentObservableId) {
        return {
          ...state,
          observables: state.observables.concat({
            ...action.newObservable,
            operatorId: action.operatorId,
          }),

          effectObject: [
            {
              type: "UNSUBSCRIBE-EFFECT(switchAll)",
              observableId: currentOperator.currentObservableId,
              operatorId: action.operatorId,
            },
            {
              type: "SUBSCRIBE-EFFECT(switchAll)",
              observableId: action.newObservable.id,
              operatorId: action.operatorId,
            },
          ],
        };
      }
      return {
        ...state,
        observables: state.observables.concat({
          ...action.newObservable,
          operatorId: action.operatorId,
        }),

        effectObject: [
          {
            type: "SUBSCRIBE-EFFECT(switchAll)",
            observableId: action.newObservable.id,
            operatorId: action.operatorId,
          },
        ],
      };

    case "OBSERVABLE-UNSUBSCRIBE(switchAll)":
      return {
        ...state,
        observables: state.observables.map((observable) =>
          observable.id === action.observableId
            ? {
                ...observable,
                observeState: "UNSUBSCRIBED",
              }
            : observable,
        ),
      };
    case "OBSERVABLE-COMPLETE(switchAll)":
      return {
        ...state,
        observables: state.observables.map((observable) =>
          observable.id === action.observableId
            ? {
                ...observable,
                observeState: "COMPLETED",
              }
            : observable,
        ),
      };
    case "HANDLE-OBSERVABLE-COMPLETE(switchAll)":
      const updatedState = switchAllReducer(state, {
        type: "OBSERVABLE-COMPLETE(switchAll)",
        observableId: action.observableId,
      });
      const thisOperator = state.operatorStates.find(
        (operator) => operator.id == action.operatorId,
      );
      const isEverythingFinished =
        thisOperator.currentObservableId === action.observableId;

      if (isEverythingFinished) {
        return mainReducer(updatedState, {
          type: "HANDLE-OPERATOR-COMPLETE",
          operatorId: action.operatorId,
        });
      }

      return updatedState;

    default:
      return state;
  }
}
function handleObservableCompleteRM(updatedState, action) {
  const runningObservableCount = updatedState.observables.filter(
    (observable) =>
      observable.operatorId === action.operatorId &&
      observable.observeState === "RUNNING",
  ).length;
  const nextBufferedObservable = updatedState.observables.find(
    (observable) =>
      observable.operatorId === action.operatorId &&
      observable.observeState === "BUFFERED",
  );
  const operatorConcurrentLimit = updatedState.operatorStates.find(
    (op) => op.id === action.operatorId,
  ).concurrentLimit;

  if (
    nextBufferedObservable &&
    operatorConcurrentLimit > runningObservableCount
  ) {
    return {
      ...updatedState,
      effectObject: {
        type: "SUBSCRIBE-EFFECT(switchAll)",
        observableId: nextBufferedObservable.id,
        operatorId: action.operatorId,
      },
    };
  }

  const activeCount = updatedState.observables.filter(
    (observable) =>
      observable.operatorId === action.operatorId &&
      observable.observeState === "RUNNING",
  ).length;

  const isEverythingFinished = !nextBufferedObservable && activeCount === 0;

  if (isEverythingFinished) {
    return mainReducer(updatedState, {
      type: "HANDLE-OPERATOR-COMPLETE",
      operatorId: action.operatorId,
    });
  }

  return {
    ...updatedState,
    observables: updatedState.observables,
  };
}

export function runSwitchAllEffects(state, dispatch) {
  if (Array.isArray(state.effectObject)) {
    state.effectObject.forEach((e) => {
      runEffects({ ...state, effectObject: e }, dispatch);
    });
  } else {
    runEffects(state, dispatch);
  }
}
function runEffects(_state, dispatch) {
  const state = { ..._state };

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
          const operatorState = getState().operatorStates.find(
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
