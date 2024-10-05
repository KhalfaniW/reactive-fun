import { pipe, flow, filter, map, delay } from "../functions.js";

const observable1 = ({ next, complete }) => {
  setTimeout(() => {
    next(3);
    next(4);
    //   complete();
  }, 500);
};

const observable2 = ({ next, complete }) => {
  setTimeout(() => {
    next(1);
    next(2);
    // complete();
  }, 1000);
};

let continuations = [];

const obsOfObs = ({ next, complete }) => {
  next(observable1);
  next(observable2);
  complete();
};

// Using mergeAll (concurrent)
const merged = obsOfObs.pipe(mergeAll());

const pipedFuncton = pipe(
  [
    map((state, next) => observableSimple({ next, complete })),
    (state, next) => {
      console.log("state", state);
      next(state);
    },
  ],
  (newState) => {},
);

observableSimple({
  next: pipedFuncton,
  complete: () => {
    console.log("completed");
  },
});

function mergeReducer(stateInput = { emittedValues: [] }, action) {
  const state = { ...stateInput, effectObject: null };
  // console.log(action);
  const draftState = { ...state };
  switch (action.type) {
    case "INIT":
      return {
        ...state,
        subscriber: action.subscriber,
        observables: action.observables,
      };

    case "NEXTED":
      return {
        ...state,
        emittedValues: state.emittedValues.concat({
          id: action.id,
          emittedValue: action.emittedValue,
        }),
      };
    case "SUB-MERGE":
      return {
        ...state,

        effectObject: {
          type: "SUB-MERGE-END",
        },
      };

      break;
    case "SUB-START-1":
      draftState.observables = draftState.observables.map((observable) =>
        observable.id === action.id
          ? { ...observable, observeState: "RUNNING" }
          : observable,
      );
      break;
    case "SUB-COMPLETE-1":
      draftState.observables = draftState.observables.map((observable) =>
        observable.id === action.id
          ? { ...observable, observeState: "COMPLETED" }
          : observable,
      );
      const runningObservables = draftState.observables.filter(
        (observable) => observable.observeState === "COMPLETED",
      );
      if (runningObservables.length === draftState.observables.length) {
        draftState.effectObject = {
          type: "COMPLETE",
        };
      }
      break;
    case "ALL-COMPLETE":
      draftState.completed = true;
      break;
    default:
      draftState.effectObject = {
        type: "ERROR",
        action,
        message: `Unknown action type: ${action.type}`,
      };
  }
  return draftState;
}
