export function mergeReducer(
  stateInput = { emittedValues: [], completed: false },
  action,
) {
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
    case "MERGE-NEW":
      return {
        ...state,
        subscriber: action.newSubscriber,
        observables: state.observables.concat(action.newObservables),
        effectObject: {
          type: "MERGE-NEW-EFFECT",
          ids: action.newObservables.map((el) => el.id),
        },
      };
    case "NEXTED":
      return {
        ...state,
        emittedValues: state.emittedValues.concat({
          id: action.id,
          //TODO fix no value
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
export function stateSetup() {
  let state = undefined;

  let allStates = [];

  function dispatch(action) {
    const oldState = { ...state };
    if (allStates.length == 0) {
      allStates[0] = oldState;
    }

    state = mergeReducer(state, action);
    allStates.push(state);
    //--- effect interpreter
    const subscribeById = (id, { next, complete }) => {
      const nextObservable = state.observables.find(
        (observable) => observable.id === id,
      );
      nextObservable.subscribe({ next, complete });
    };

    const mergeSubscribe = (observable) => {
      if (observable.observeState === "NEW") {
        dispatch({ type: "SUB-START-1", id: observable.id });

        // TODO refactor to have an effect for each subcribe so it is reusbale?
        observable.subscribe({
          next: (value) => {
            debugger;
            dispatch({
              type: "NEXTED",
              id: observable.id,
              emittedValue: value,
            });
            state.subscriber.next(value);
          },
          complete: () => {
            dispatch({ type: "SUB-COMPLETE-1", id: observable.id });
          },
        });
      }
    };

    if (state.effectObject) {
      switch (state.effectObject.type) {
        case "SUBSCRIBE-EFFECT":
          subscribeById(
            state.effectObject.id,
            state.effectObject.newSubscriber,
          );
          break;

        case "SUBSCRIBE-GROUP-EFFECT":
          state.effectObject.ids.forEach((id) =>
            subscribeById(id, state.effectObject.newSubscriber),
          );
          break;
        case "MERGE-NEW-EFFECT":
          state.effectObject.ids.forEach((id) => {
            const nextObservable = state.observables.find(
              (observable) => observable.id === id,
            );
            mergeSubscribe(nextObservable);
          });
          break;

        case "SUB-MERGE-EFFECT":
          // refactor to use subscribe effect.  have a list of ids to subscribe and recursively subscribe
          state.observables.forEach(mergeSubscribe);
          return;

        case "ERROR":
          console.error(action);
          throw new Error(state.effectObject.message);

        case "COMPLETE":
          dispatch({ type: "ALL-COMPLETE" });
          state.subscriber.complete();
          break;

        default:
          console.log("INSIDE2 state.effectObject", state.effectObject);
          break;
      }
    }
  }

  return { state, dispatch, allStates };
}
