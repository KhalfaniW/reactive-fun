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
  const thisOperator = state.operatorStates?.[0];
  const activeCountForOperator = state.observables?.filter(
    (observable) => observable.observeState === "RUNNING",
  ).length;
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
          type: "SUBSCRIBE-EFFECT",
          observableId: action.newObservable.id,
          operatorId: action.operatorId,
          createSubscriber: createMergeSubscriberLink({
            observableId: action.newObservable.id,
            operatorId: action.operatorId,
          }),
        },
      };
    case "PARENT-COMPLETE":
      if (thisOperator.type !== "mergeAll") {
        return state;
      }
      const nextBufferedObservable = state.observables.find(
        (observable) =>
          observable.operatorId === action.operatorId &&
          observable.observeState === "BUFFERED",
      );

      if (!nextBufferedObservable && activeCountForOperator === 0) {
        return {
          ...state,
          effectObject: {
            type: "COMPLETE-OPERATOR",
            operatorId: action.operatorId,
          },
        };
      }
      return state;
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

function createMergeSubscriberLink({ observableId, operatorId }) {
  // needs to be linked to the store
  return (store) => {
    const state = store.getState();
    const observable = state.observables.find((obs) => obs.id == observableId);
    const operatorState = state.operatorStates[0];
    return {
      next: (value) => {
        store.dispatch({
          type: "HANDLE-EMISSION",
          observableId: observable.id,
          emittedValue: value,
          next: operatorState.next,
        });
      },
      complete: () => {
        store.dispatch({
          type: "HANDLE-OBSERVABLE-COMPLETE(mergeAll)",
          observableId: observable.id,
          operatorId: operatorId,
        });
      },
    };
  };
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
        type: "SUBSCRIBE-EFFECT",
        observableId: nextBufferedObservable.id,
        operatorId: action.operatorId,
        createSubscriber: createMergeSubscriberLink({
          observableId: nextBufferedObservable.id,
          operatorId: action.operatorId,
        }),
      },
    };
  }

  const activeCount = updatedState.observables.filter(
    (observable) =>
      observable.operatorId === action.operatorId &&
      observable.observeState === "RUNNING",
  ).length;

  const isEverythingFinished =
    !nextBufferedObservable &&
    activeCount === 0 &&
    updatedState.isParentComplete;

  if (isEverythingFinished) {
    return {
      ...updatedState,
      effectObject: {
        type: "COMPLETE-OPERATOR",
        operatorId: action.operatorId,
      },
      observables: updatedState.observables,
    };
  }

  return {
    ...updatedState,
    observables: updatedState.observables,
  };
}
