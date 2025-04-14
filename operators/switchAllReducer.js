import { highOrderOperate } from "./utils/highOrderOperate";

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
  const thisOperator = state.operatorStates?.[0];

  return highOrderOperate({
    initState: {
      isCompleted: false,
      currentObservableId: null,
    },
    makeSubscriber: ({
      getState,
      dispatch,
      state,
      observable,
      operatorState,
      operatorType,
      observableId,
      operatorId,
    }) => {
      return {
        next: (value) => {
          // this should be decoupled from observable and stateless
          const observable = getState().observables.find(
            //TODO try using param
            (obs) => obs.id == observableId,
          );

          const operatorState = getState().operatorStates.find(
            (operator) => operator.id == observable?.operatorId,
          );

          if (operatorState.currentObservableId === observable.id) {
            dispatch({
              type: "HANDLE-EMISSION",
              observableId: observable.id,
              emittedValue: value,
              next: operatorState.next,
            });
          }
        },
        complete: () => {
          dispatch({
            type: "HANDLE-OBSERVABLE-COMPLETE(switchAll)",
            observableId: observableId,
            operatorId: operatorId,
          });
        },
      };
    },
    handleNewObservable: ({
      state,
      operatorType,
      createSubscriberLink,
      makeSubscriber,
    }) => {
      const currentOperator = state.operatorStates.find(
        (op) => op.id === action.operatorId,
      );

      const newObservable = {
        ...action.newObservable,
        operatorId: action.operatorId,
      };

      let effectObject;
      if (currentOperator.currentObservableId) {
        effectObject = [
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
              makeSubscriber,
            }),
          },
        ];
      } else {
        effectObject = [
          {
            type: "SUBSCRIBE-EFFECT",
            observableId: action.newObservable.id,
            operatorId: action.operatorId,
            createSubscriber: createSubscriberLink({
              observableId: action.newObservable.id,
              operatorId: action.operatorId,
              makeSubscriber,
            }),
          },
        ];
      }

      return {
        ...state,
        observables: [...state.observables, newObservable],
        effectObject,
      };
    },

    handleComplete: ({ operatorType, action }) => {
      const updatedState = switchAllReducer(state, {
        ...action,
        type: `OBSERVABLE-COMPLETE(${operatorType})`,
      });

      if (updatedState.isParentComplete) {
        return {
          ...updatedState,
          effectObject: {
            type: "COMPLETE-OPERATOR",
            operatorId: action.operatorId,
          },
        };
      }
      return updatedState;
    },
    getCompleteCondition: (state) => {
      const thisOperator = state.operatorStates?.[0];
      return thisOperator.currentObservableId === null;
    },
    state,
    action,
    thisOperator,
    operatorType: "switchAll",
  });
}
