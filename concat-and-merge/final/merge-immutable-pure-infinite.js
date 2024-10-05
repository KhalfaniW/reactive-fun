import { nanoid } from "nanoid";

const interval =
  (n) =>
  ({ next, complete }) => {
    var i = 0;
    let interval = setInterval(() => {
      i++;
      next(`${i}_i`);
      if (i > 10) {
        complete();
        clearInterval(interval);
      } else {
      }
    }, n);
  };

function createEffectfulObservable() {
  ({ next, complete }) => {
    next(1);
    next(2);
    setTimeout(() => {
      next(3);
      complete();
    }, 1000);
  };
}

const [obs1, obs2, obs3] = getObservables();
export const allObservables = [obs1, obs2, obs3, interval(100)];

console.log("Merge example:");

/*

  observeState: "NEW" | "RUNNING" | "COMPLETED"

 */

const mergeReducer = (stateInput = { emittedValues: [] }, action) => {
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
};

let state = undefined;
let allStates = [];
function dispatch(action) {
  const oldState = { ...state };
  if (allStates.length == 0) {
    allStates[0] = oldState;
  }

  state = mergeReducer(state, action);
  allStates.push(state);

  if (state.effectObject) {
    if (state.effectObject.type === "ERROR") {
      console.error(action);
      throw new Error(state.effectObject.message);
      return;
    }
    if (state.effectObject.type === "COMPLETE") {
      dispatch({ type: "ALL-COMPLETE" });
      state.subscriber.complete();
      debugger;
      return;
    }
    if (state.effectObject.type === "SUB-MERGE-END") {
      state.observables.forEach((observable) => {
        if (observable.observeState === "NEW") {
          dispatch({ type: "SUB-START-1", id: observable.id });

          observable.subscribe({
            next: (value) => {
              dispatch({
                type: "NEXTED",
                id: observable.id,
                emmitedValue: value,
              });
              state.subscriber.next(value);
            },
            complete: () => {
              dispatch({ type: "SUB-COMPLETE-1", id: observable.id });
            },
          });
        }
      });
      // }
      return;
    }
  }
}

function merge(observables, subscribeFns) {
  dispatch({
    type: "INIT",
    subscriber: subscribeFns,
    observables: observables.map((subscribe, i) => {
      return {
        subscribe: subscribe,
        id: nanoid(),
        observeState: "NEW",
      };
    }),
  });

  dispatch({
    type: "SUB-MERGE",
  });

  // console.log({ newState });
}

merge(allObservables, {
  next: (value) => console.log(":", value),
  complete: () => console.log("Merge completed"),
});
function getObservables() {
  const obs1 = ({ next, complete }) => {
    next(1);
    next(2);
    setTimeout(() => {
      next(3);
      complete();
    }, 1000);
  };
  const obs2 = (subscriber) => {
    subscriber.next(4);
    subscriber.next(5);

    setTimeout(() => {
      subscriber.next(6);
      subscriber.complete();
    }, 500);
  };
  const obs3 = (subscriber) => {
    subscriber.next(9);

    setTimeout(() => {
      subscriber.complete();
    }, 500);
  };

  return [obs1, obs2, obs3,];
}
