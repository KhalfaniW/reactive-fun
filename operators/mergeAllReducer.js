import { highOrderOperate } from "./utils/highOrderOperate";

export function mergeAllReducer(
  state = {
    operatorStates: [],
    observables: [],
    next: () => {},
  },
  action,
) {
  const thisOperator = state.operatorStates?.[0];

  const activeCountForOperator = state.observables?.filter(
    (observable) => observable.observeState === "RUNNING",
  ).length;

  return highOrderOperate({
    initState: {
      concurrentLimit: action.concurrentLimit,
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
          dispatch({
            type: "HANDLE-EMISSION",
            observableId: observable.id,
            emittedValue: value,
            next: operatorState.next,
          });
        },
        complete: () => {
          dispatch({
            type: "HANDLE-OBSERVABLE-COMPLETE(mergeAll)",
            observableId: observable.id,
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
      const activeCountForOperator = state.observables?.filter(
        (observable) => observable.observeState === "RUNNING",
      ).length;

      const newObservable = {
        ...action.newObservable,
        operatorId: action.operatorId,
        observeState:
          activeCountForOperator === thisOperator.concurrentLimit
            ? "BUFFERED"
            : "NEW",
      };

      const newState = {
        ...state,
        observables: [...state.observables, newObservable],
      };

      if (activeCountForOperator !== thisOperator.concurrentLimit) {
        return {
          ...newState,
          effectObject: {
            type: "SUBSCRIBE-EFFECT",
            observableId: action.newObservable.id,
            operatorId: action.operatorId,
            createSubscriber: createSubscriberLink({
              observableId: action.newObservable.id,
              operatorId: action.operatorId,
              makeSubscriber,
            }),
          },
        };
      }

      return newState;
    },
    getCompleteCondition: (state) => {
      const nextBufferedObservable = state.observables.find(
        (observable) =>
          observable.operatorId === action.operatorId &&
          observable.observeState === "BUFFERED",
      );
      return !nextBufferedObservable && activeCountForOperator === 0;
    },
    handleComplete: ({
      operatorType,
      action,
      state,
      createSubscriberLink,
      makeSubscriber,
    }) => {
      const newObservables = state.observables.map((observable) =>
        observable.id === action.observableId
          ? { ...observable, observeState: "COMPLETED" }
          : observable,
      );

      const runningCount = newObservables.filter(
        (observable) =>
          observable.operatorId === action.operatorId &&
          observable.observeState === "RUNNING",
      ).length;

      const nextBuffered = newObservables.find(
        (observable) =>
          observable.operatorId === action.operatorId &&
          observable.observeState === "BUFFERED",
      );

      const operatorLimit = state.operatorStates.find(
        (op) => op.id === action.operatorId,
      ).concurrentLimit;

      const newState = {
        ...state,
        observables: newObservables,
      };

      if (nextBuffered && operatorLimit > runningCount) {
        return {
          ...newState,
          effectObject: {
            type: "SUBSCRIBE-EFFECT",
            observableId: nextBuffered.id,
            operatorId: action.operatorId,
            createSubscriber: createSubscriberLink({
              observableId: nextBuffered.id,
              operatorId: action.operatorId,
              makeSubscriber,
            }),
          },
        };
      }

      const isEverythingFinished =
        !nextBuffered && runningCount === 0 && state.isParentComplete;

      if (isEverythingFinished) {
        return {
          ...newState,
          effectObject: {
            type: "COMPLETE-OPERATOR",
            operatorId: action.operatorId,
          },
        };
      }

      return newState;
    },

    state,
    action,
    thisOperator,
    operatorType: "mergeAll",
  });
}
