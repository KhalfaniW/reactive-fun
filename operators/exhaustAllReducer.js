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
export function exhaustAllReducer(
  state = {
    operatorStates: [],
    observables: [],
    next: () => {},
  },
  action,
) {
  const thisOperator = state.operatorStates && state.operatorStates[0];

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
    }) => {
      return {
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
            type: `HANDLE-OBSERVABLE-COMPLETE(${operatorType})`,
            observableId: observable.id,
            operatorId: observable?.operatorId,
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
      const noCurrentSubscription = thisOperator.currentObservableId === null;
      const newObservables = state.observables.concat({
        ...action.newObservable,
        operatorId: action.operatorId,
      });
      const newEffect = noCurrentSubscription
        ? [
            {
              type: "SUBSCRIBE-EFFECT",
              observableId: action.newObservable.id,
              operatorId: action.operatorId,

              createSubscriber: createSubscriberLink({
                observableId: action.newObservable.id,
                operatorId: action.operatorId,
                operatorType,
                makeSubscriber,
              }),
            },
          ]
        : state.effectObject;

      return {
        ...state,
        observables: newObservables,
        effectObject: newEffect,
      };
    },

    handleComplete: ({ operatorType, action }) => {
      const updatedState = exhaustAllReducer(state, {
        ...action,
        type: `OBSERVABLE-COMPLETE(${operatorType})`,
      });

      if (state.isSourceComplete) {
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
    operatorType: "exhaustAll",
  });
}
