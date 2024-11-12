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

  const thisOperator = state.operatorStates?.[0];
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
              type: "UNSUBSCRIBE-EFFECT",
              observableId: currentOperator.currentObservableId,
              operatorId: action.operatorId,
            },
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
    case "PARENT-COMPLETE":
      if (thisOperator.type !== "switchAll") {
        return state;
      }
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
    case "OBSERVABLE-COMPLETE(switchAll)":
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

    case "HANDLE-OBSERVABLE-COMPLETE(switchAll)":
      const updatedState = switchAllReducer(state, {
        type: "OBSERVABLE-COMPLETE(switchAll)",
        observableId: action.observableId,
      });

      const isEverythingFinished =
        thisOperator.currentObservableId === action.observableId &&
        state.isParentComplete;

      if (isEverythingFinished) {
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

function createSubscriberLink({ observableId, operatorId }) {
  // needs to be linked to the store
  return (store) => {
    const state = store.getState();
    const observable = state.observables.find((obs) => obs.id == observableId);
    const operatorState = state.operatorStates.find(
      (operator) => operator.id == observable.operatorId,
    );

    const subscriber = {
      next: (value) => {
        const observable = store
          .getState()
          .observables.find((obs) => obs.id == observableId);

        const operatorState = store
          .getState()
          .operatorStates.find(
            (operator) => operator.id == observable?.operatorId,
          );

        if (operatorState.currentObservableId === observable.id) {
          store.dispatch({
            type: "HANDLE-EMISSION",
            observableId: observable.id,
            emittedValue: value,
            next: operatorState.next,
          });
        }
      },
      complete: () => {
        store.dispatch({
          type: "HANDLE-OBSERVABLE-COMPLETE(switchAll)",
          observableId: observableId,
          operatorId: operatorId,
        });
      },
    };
    return subscriber;
  };
}
