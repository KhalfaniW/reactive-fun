import { combineReducers, createStore, applyMiddleware } from "redux";
import { produce } from "immer";

// Define a more complete initial state based on usage in the reducer
const initialState = {
  emittedValues: [],
  isCompleted: false,
  isStarted: false,
};

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
export function mainReducer(state = initialState, action) {
  // Use produce, passing the current state and a function that receives a mutable 'draft'
  return produce(state, (draft) => {
    // Inside this function, you can directly modify the 'draft' object
    switch (action.type) {
      case "INIT":
        draft.isStarted = true;
        draft.operatorStates = [];
        draft.complete = action.complete;
        draft.observables = action.observables;
        break;

      case "CLEAR-EFFECTS":
        draft.effectObject = null;
        break;

      case "HANDLE-EMISSION":
        // Use push for arrays - more idiomatic Immer style
        draft.emittedValues.push({
          id: action.observableId,
          emittedValue: action.emittedValue,
        });
        draft.effectObject = {
          type: "EMIT",
          next: action.next,
          emittedValue: action.emittedValue,
        };
        break;

      case "ADD-OPERATOR-LABEL":
        if (draft.operatorStates && draft.operatorStates.length > 0) {
          draft.operatorStates[0].label = action.label;
        } else {
          console.warn(
            "ADD-OPERATOR-LABEL: operatorStates array is empty or missing.",
          );
        }
        break;

      case "HANDLE-OPERATOR-COMPLETE":
        const operatorIndex = draft.operatorStates.findIndex(
          (opState) => opState.id === action.operatorId,
        );

        if (operatorIndex !== -1) {
          const operatorState = draft.operatorStates[operatorIndex];
          operatorState.isCompleted = true;
          // Handle extra state based on type
          if (operatorState.type === "switchAll") {
            operatorState.currentObservableId = null;
          }
        } else {
          // Optional: Handle case where operatorId is not found
          console.warn(
            `Operator with id ${action.operatorId} not found for completion.`,
          );
        }
        draft.effectObject = {
          type: "COMPLETE_STATE",
        };
        break;

      case "SOURCE-COMPLETE":
        draft.isSourceComplete = true;
        break;

      case "ALL-COMPLETE":
        draft.isCompleted = true;
        break;
      default:
        break;
    }


  });
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
