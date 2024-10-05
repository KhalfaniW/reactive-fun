import { produce, current } from "immer";
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
    case "LIFT-STATE":
      // mov
      const lift = state.observables.map((observable) =>
        observable.id === action.id
          ? { ...observable, observeState: "UNSUBSCRIBED" }
          : observable,
      );
      return {
        ...state,
        observables: newlyUnsubbedObservables,
        effectObject: {
          type: "UNSUBSCRIBE-TO-OBSERVABLE-EFFECT",
          id: action.id,
        },
      };
    case "UNSUBSCRIBE-TO-OBSERVABLE":
      const newlyUnsubbedObservables = state.observables.map((observable) =>
        observable.id === action.id
          ? { ...observable, observeState: "UNSUBSCRIBED" }
          : observable,
      );
      return {
        ...state,
        observables: newlyUnsubbedObservables,
        effectObject: {
          type: "UNSUBSCRIBE-TO-OBSERVABLE-EFFECT",
          id: action.id,
        },
      };
    case "UNSUBSCRIBE-TO-OBSERVABLE-GROUP":
      const newlyUnsubbedObservableGroup = state.observables.map(
        (observable) =>
          action.idGroup.includes(observable.id)
            ? { ...observable, observeState: "UNSUBSCRIBED" }
            : observable,
      );
      return {
        ...state,
        observables: newlyUnsubbedObservableGroup,
        effectObject: {
          type: "UNSUBSCRIBE-TO-OBSERVABLE-GROUP-EFFECT",
          idGroup: action.idGroup,
        },
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
          type: "SUB-MERGE-EFFECT",
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

let state = undefined;
let allStates = [];
function dispatch(action) {
  const oldState = { ...state };
  if (allStates.length == 0) {
    allStates[0] = oldState;
  }

  state = mergeReducer(state, action);
  allStates.push(state);

  const unsubscribeById = (id) => {
    const nextObservable = state.observables.find(
      (observable) => observable.id === id,
    );
    nextObservable.unsubscribe();
  };
  if (state.effectObject) {
    if (state.effectObject.type === " UNSUBSCRIBE-TO-OBSERVABLE-EFFECT") {
      unsubscribeById(state.effectObject.id);
    }
    if (state.effectObject.type === " UNSUBSCRIBE-TO-OBSERVABLE-GROUP-EFFECT") {
      state.effectObject.ids.forEach(unsubscribeById);
    }

    if (state.effectObject.type === "SUB-MERGE-EFFECT") {
      // refactor to use subscribe effect.  have a list of ids to subscirbe and recursvely subsccribe
      state.observables.forEach((observable) => {
        if (observable.observeState === "NEW") {
          dispatch({ type: "SUB-START-1", id: observable.id });

          // TODO refactor to have an effect for each subcribe so it is reusbale?
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
  }
}

export function merge(..._observables) {
  const observables = Array.isArray(_observables[0])
    ? _observables[0]
    : _observables;
  return {
    composedSubscribe: ({ next, complete }) => {
      dispatch({
        type: "INIT",
        subscriber: { next, complete },
        observables: observables.map((observable, i) => {
          const subscribe =
            observable.type === "COMPOSABLE-MERGE"
              ? observable.composedSubscribe
              : observable;
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
    },
    type: "COMPOSABLE-MERGE",
  };

  // console.log({ newState });
}
// debugger;
const initialComposable = merge(obs1);

// const finalComposable = merge([initialComposable])(
// merge([obs1,obs2])

initialComposable.composedSubscribe({
  next: (value) => console.log(":", value),
  complete: () => console.log("Merge completed"),
});

// merge(merge([obs1])).composedSubscribe({
//   next: (value) => console.log(":", value),
//   complete: () => console.log("Merge completed"),
// });
function getObservables() {
  function* stateSimulator(i) {
    yield i++;
    yield i++;
    yield i++;
    return;
  }
  const stateGenerator1 = stateSimulator(1);
  const obs1 = ({
    next,
    complete,
      simlatedRun = (next,complete) => {
      //simulate the effects that would be sent
      next(1);
      next(2);
      setTimeout(() => {
        next(3);
        complete();
      }, 1000);
    },
  }) => {
      simlatedRun(next,complete)
    const unsubscribe = () => {};
    return unsubscribe;
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

  return [obs1, obs2, obs3];
}
