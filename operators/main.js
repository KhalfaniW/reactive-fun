import { combineReducers, createStore, applyMiddleware } from "redux";

// TODO refactor to have observables and state be more like observable struct with state in the statemachine
// maybe make subcription details serialiable
/**
   observeState: "NEW" | "RUNNING" | "COMPLETED" | "BUFFERED" | "UNSUBSCRIBED"
   operatorId: "MergeAllOperator_{nanoID}" | null
*/
/*
expected derived state =
mergeSubsriberState: {
isCompleted: false,
bufferedObervableIds: [],
runningObservables: [],
activeCount: 0,
concurrentLimit: Infinity,
},
 */

export function mainReducer(
  state = { emittedValues: [], isCompleted: false, isStarted: false },
  action,
) {
  //TODO make clearing effect object a swtich case so it can collect multiple effects

  switch (action.type) {
    case "INIT":
      return {
        ...state,
        isStarted: true,
        operatorStates: [],
        //final subcriber
        complete: action.complete,
        observables: action.observables,
      };
    case "CLEAR-EFFECTS":
      return {
        ...state,
        effectObject: null,
      };
    case "HANDLE-EMISSION":
      return {
        ...state,
        emittedValues: state.emittedValues.concat({
          id: action.observableId,
          emittedValue: action.emittedValue,
        }),
        effectObject: {
          type: "EMIT",
          next: action.next,
          emittedValue: action.emittedValue,
        },
      };

    case "HANDLE-OPERATOR-COMPLETE":
      const operatorStatesWithThisCompleted = state.operatorStates.map(
        (operatorState) => {
          const extraState =
            operatorState.type == "switchAll"
              ? { currentObservableId: null }
              : {};
          return operatorState.id === action.operatorId
            ? {
                ...operatorState,
                isCompleted: true,
                ...extraState,
              }
            : operatorState;
        },
      );

      const updatedState = {
        ...state,
        operatorStates: operatorStatesWithThisCompleted,
      };

      return {
        ...updatedState,
        effectObject: {
          type: "COMPLETE_STATE",
        },
      };

    case "PARENT-COMPLETE":
      return {
        ...state,
        isParentComplete: true,
      };

    case "ALL-COMPLETE":
      return { ...state, isCompleted: true };
      break;
  }
  return state;
}

export function subscriptionReducer(state, action) {
  const draftState = { ...state };
  //TODO seperate merge and switch Subscriptions cancel
  const isMERGE = JSON.stringify(state).includes("merge");
  switch (action.type) {
    case "SET-UNSUBSCRIBE":
      return {
        ...state,

        effectObject: {
          type: "SUB-SWITCH-EFFECT",
        },
      };

    case "SUB-SWITCH":
      return {
        ...state,

        effectObject: {
          type: "SUB-SWITCH-EFFECT",
        },
      };
    case "SUBSCRIPTION-CANCEL-1":
      return {
        ...state,
        operatorStates: state.operatorStates.map((operator) =>
          operator.currentObservableId === action.observableId
            ? { ...operator, currentObservableId: null }
            : operator,
        ),
        observables: state.observables.map((observable) =>
          observable.id === action.observableId
            ? {
                ...observable,
                observeState: "UNSUBSCRIBED",
              }
            : observable,
        ),
      };
      break;

    case "SUBSCRIPTION-START-1":
      //TODO remove this check
      if (isMERGE)
        return {
          ...state,
          observables: state.observables.map((observable) =>
            observable.id === action.observableId
              ? {
                  ...observable,
                  observeState: "RUNNING",
                  operatorId: action.operatorId,
                }
              : observable,
          ),
        };
      else {
        //is Switch
        const observable = state.observables.find(
          (observable) => observable.id === action.observableId,
        );

        if (observable.observeState === "UNSUBSCRIBED") {
          throw new Error(
            "Should not be subscribng if already subsdcribed " +
              `${observable.observeState}`,
          );
        }

        return {
          ...state,
          operatorStates: state.operatorStates.map((operator) => {
            //TODO make generalized
            if (
              operator.type === "switchAll" ||
              operator.type === "exhaustAll"
            ) {
              return { ...operator, currentObservableId: action.observableId };
            }
            return operator;
          }),
          observables: state.observables.map((observable) =>
            observable.id === action.observableId
              ? {
                  ...observable,
                  observeState: "RUNNING",
                  operatorId: action.operatorId,
                }
              : observable,
          ),
        };
      }
      break;
    case "SUBSCRIPTION-COMPLETE-1":
      if (isMERGE) {
        const completedObservables = draftState.observables.filter(
          (observable) => observable.observeState === "COMPLETED",
        );

        return {
          ...state,
          observables: state.observables.map((observable) =>
            observable.id === action.observableId
              ? { ...observable, observeState: "COMPLETED" }
              : observable,
          ),
          effectObject:
            completedObservables.length == state.observables.length
              ? {
                  type: "COMPLETE_STATE",
                }
              : null,
        };
      } else {
        const completedObservables = draftState.observables.filter(
          (observable) => observable.observeState === "COMPLETED",
        );

        return {
          ...state,
          observables: state.observables.map((observable) =>
            observable.id === action.observableId
              ? { ...observable, observeState: "COMPLETED" }
              : observable,
          ),
          effectObject:
            completedObservables.length == state.observables.length
              ? {
                  type: "COMPLETE_STATE",
                }
              : null,
        };
      }
  }
  return state;
}
