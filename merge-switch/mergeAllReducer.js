import { mainReducer } from "./main.js";

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

export function mergeAllReducer(
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

  switch (action.type) {
    case "INIT(mergeAll)":
      return {
        ...state,
        operatorStates: (state.operatorStates || []).concat({
          type: "mergeAll",
          id: action.operatorId,
          isCompleted: false,
          next: action.next,
          concurrentLimit: action.concurrentLimit,
        }),
      };

    case "HANDLE-NEW-OBSERVABLE(mergeAll)":
      const activeCountForOperator = state.observables.filter(
        (observable) =>
          observable.operatorId === action.operatorId &&
          observable.observeState === "RUNNING",
      ).length;

      const thisOperator = state.operatorStates.find(
        (operator) => operator.id === action.operatorId,
      );

      if (activeCountForOperator === thisOperator.concurrentLimit) {
        return {
          ...state,
          observables: state.observables.concat({
            ...action.newObservable,
            observeState: "BUFFERED",
            operatorId: action.operatorId,
          }),
        };
      }

      return {
        ...state,
        observables: state.observables.concat({
          ...action.newObservable,
          operatorId: action.operatorId,
        }),
        effectObject: {
          type: "SUBSCRIBE-EFFECT(mergeAll)",
          observableId: action.newObservable.id,
          operatorId: action.operatorId,
        },
      };

    case "HANDLE-OBSERVABLE-COMPLETE(mergeAll)":
      const updatedState = {
        ...state,
        observables: updateMatchingElements({
          list: state.observables,
          selector: (observable) => observable.id === action.observableId,
          stateChange: {
            observeState: "COMPLETED",
          },
        }),
      };

      return handleObservableCompleteMerge(updatedState, action);

    default:
      return state;
  }
}
function handleObservableCompleteMerge(updatedState, action) {
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
        type: "SUBSCRIBE-EFFECT(mergeAll)",
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
