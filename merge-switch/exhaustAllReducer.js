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

export function exhaustAllReducer(
  state = {
    operatorStates: [],
    observables: [],
    next: () => {},
  },
  action,
) {
  const thisOperator = state.operatorStates && state.operatorStates[0];

  switch (action.type) {
    case "INIT(exhaustAll)":
      return {
        ...state,
        operatorStates: (state.operatorStates || []).concat({
          type: "exhaustAll",
          id: action.operatorId,
          isCompleted: false,
          next: action.next,
          currentObservableId: null,
        }),
      };
    case "HANDLE-NEW-OBSERVABLE(exhaustAll)":
      const noCurrentSubscription = thisOperator.currentObservableId === null;
      if (noCurrentSubscription) {
        return {
          ...state,
          observables: state.observables.concat({
            ...action.newObservable,
            operatorId: action.operatorId,
          }),
          effectObject: [
            {
              type: "SUBSCRIBE-EFFECT",
              observableId: action.newObservable.id,
              operatorId: action.operatorId,
              createSubscriber: createSubscriberLink({
                observableId: action.newObservable.id,
                operatorId: action.operatorId,
              }),
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
      };

    case "OBSERVABLE-COMPLETE(exhaustAll)":
      return {
        ...state,
        operatorStates: state.operatorStates.map((operator) =>
          operator.id == thisOperator.id
            ? {
                ...operator,
                currentObservableId: null,
              }
            : operator,
        ),
        observables: state.observables.map((observable) =>
          observable.id === action.observableId
            ? {
                ...observable,
                observeState: "COMPLETED",
              }
            : observable,
        ),
      };

    case "PARENT-COMPLETE":
      if (thisOperator.currentObservableId === null) {
        return {
          ...state,
          effectObject: {
            type: "COMPLETE-OPERATOR",
            operatorId: action.operatorId,
          },
        };
      }
      return state;

    case "HANDLE-OBSERVABLE-COMPLETE(exhaustAll)":
      const updatedState = exhaustAllReducer(state, {
        ...action,
        type: "OBSERVABLE-COMPLETE(exhaustAll)",
      });

      if (state.isParentComplete) {
        return {
          ...updatedState,
          effectObject: {
            type: "COMPLETE-OPERATOR",
            operatorId: action.operatorId,
          },
        };
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
        type: "SUBSCRIBE-EFFECT",
        observableId: nextBufferedObservable.id,
        operatorId: action.operatorId,
        createSubscriber: createSubscriberLink({
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

  const isEverythingFinished = !nextBufferedObservable && activeCount === 0;

  if (isEverythingFinished) {
    return {
      ...updatedState,
      effectObject: {
        type: "COMPLETE-OPERATOR",
        operatorId: action.operatorId,
      },
    };
  }

  return {
    ...updatedState,
    observables: updatedState.observables,
  };
}

function createSubscriberLink({ observableId, operatorId }) {
  return (store) => {
    const state = store.getState();
    const observable = state.observables.find((obs) => obs.id == observableId);
    const operatorState = state.operatorStates.find(
      (operator) => operator.id == observable.operatorId,
    );
    const dispatch = store.dispatch;
    const subscriber = {
      next: (value) => {
        dispatch({
          type: "HANDLE-EMISSION",
          observableId: observable.id,
          emittedValue: value,
          next: operatorState.next,
        });
      },
      complete: () => {
        dispatch({
          type: "HANDLE-OBSERVABLE-COMPLETE(exhaustAll)",
          observableId: observable.id,
          operatorId: observable?.operatorId,
        });
      },
    };

    return subscriber;
  };
}
