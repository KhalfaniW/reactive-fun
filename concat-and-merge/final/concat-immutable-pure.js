
import { nanoid } from "nanoid";
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
export const observables = [obs1, obs2, obs3];

console.log("Concat example:");

/*

  observeState: "NEW" | "RUNNING" | "COMPLETED"

 */

const mergeReducer = (stateInput = { emittedValues: [] }, action) => {
  const state = { ...stateInput, effectObject: null };

  switch (action.type) {
    case "INIT":
      return {
        ...state,
        subscriber: action.subscriber,
        observables: action.observables,
      };

    case "SUB-TO-OBSERVABLE":
      const newlyRunningObservables = state.observables.map((observable) =>
        observable.id === action.id
          ? { ...observable, observeState: "RUNNING" }
          : observable,
      );
      return {
        ...state,
        observables: newlyRunningObservables,
        effectObject: {
          type: "SUB-TO-OBSERVABLE",
          id: action.id,
        },
      };
    case "HANDLE-NEXT":
      return {
        ...state,
        emittedValues: state.emittedValues.concat({
          id: action.id,
          emittedValue: action.emittedValue,
        }),
      };
    case "HANDLE-COMPLETE":
      const newlyCompletedObservables = state.observables.map((observable) =>
        observable.id === action.id
          ? { ...observable, observeState: "COMPLETE" }
          : observable,
      );
      const newState = { ...state, observables: newlyCompletedObservables };

      const isAllCompleted = !newState.observables.some(
        (observer) => observer.observeState !== "COMPLETE",
      );

      if (isAllCompleted) {
        return {
          ...newState,
          effectObject: {
            type: "COMPLETE",
          },
        };
      }
      const nextObservable = newState.observables.find(
        (observable) => observable.observeState === "NEW",
      );

      if (nextObservable) {
        return mergeReducer(newState, {
          type: "SUB-TO-OBSERVABLE",
          id: nextObservable.id,
        });
      }

      return {
        ...state,
        effectObject: {
          type: "ERROR",
          action,
          message: `Unknown action type: ${action.type}`,
        },
      };

    case "ALL-COMPLETE":
      return { ...state, completed: true };

    default:
      return {
        ...state,
        effectObject: {
          type: "ERROR",
          action,
          message: `Unknown action type: ${action.type}`,
        },
      };
  }
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
    if (state.effectObject.type === "COMPLETE") {
      state.subscriber.complete();

      dispatch({ type: "ALL-COMPLETE" });
      debugger;
      // debugger;
      return;
    }
    if (state.effectObject.type === "SUB-TO-OBSERVABLE") {
      // console.log(state.effectObject);
      const nextObservable = state.observables.find(
        (observable) => observable.id === state.effectObject.id,
      );

      nextObservable.subscribe({
        next: (value) => {
          dispatch({
            type: "HANDLE-NEXT",
            id: nextObservable.id,
            emittedValue: value,
          });
          state.subscriber.next(value);
        },
        complete: () => {
          dispatch({ type: "HANDLE-COMPLETE", id: nextObservable.id });
        },
      });

      return;
    }
    if (state.effectObject.type === "ERROR") {
      console.error(action);
      throw new Error(state.effectObject.message);
      return;
    }
  }
}

function merge(observables, subscribeFns) {
  const observablesSend = observables.map((subscribe, i) => {
    return {
      subscribe: subscribe,
      id: nanoid(),
      observeState: "NEW",
    };
  });
  dispatch({
    type: "INIT",
    subscriber: subscribeFns,
    observables: observablesSend,
  });
  dispatch({
    type: "SUB-TO-OBSERVABLE",
    id: observablesSend[0].id,
  });

  // console.log({ newState });
}

merge([obs1, obs2, obs3], {
  next: (value) => console.log(":", value),
  complete: () => console.log("Concat completed"),
});
