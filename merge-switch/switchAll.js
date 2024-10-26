import { nanoid } from "nanoid";
import { getState, dispatch } from "./main.js";

// make state read only all state reads explicit

// TODO refactor to have observables and state be more like observable struct with state in the statemachine
// maybe make subcription details serialiable
/**
   
   observeState: "NEW" | "RUNNING" | "COMPLETED" | "BUFFERED" | "UNSUBSCRIBED"
   operatorId: "SwitchAllOperator_{nanoID}" | null
*/

const prepareNewObservable = (observable, id) => {
  //for when an observable is first seen
  const subscribe = observable;
  return {
    subscribe: subscribe,
    id,
    observeState: "NEW",
  };
};

export function switchAll({ id, generateObservableId = () => nanoid() } = {}) {
  // TODO remove effectful dependeces like nanoid
  const operatorId = `SwitchAll_Operator_${id}`;

  /**
   * @typedef {(emission: any, next: (emission: any, next: function) => void) => void} continuation
   */
  return (emission, next) => {
    const isOperatorStateNotInitizlized = !getState().operatorStates.some(
      (operator) => operator.id === operatorId,
    );

    if (isOperatorStateNotInitizlized) {
      //TODO move?

      dispatch({
        type: "INIT(switchAll)",
        operatorId,
        next,
        observables: [],
      });
    }
    const isAnObservable = typeof emission === "function";
    if (isAnObservable) {
      const preparedSwitchObservable = prepareNewObservable(
        emission,
        generateObservableId(),
      );

      dispatch({
        type: "HANDLE-NEW-OBSERVABLE(switchAll)",
        operatorId,
        newObservable: preparedSwitchObservable,
      });
    } else {
      //TODO i am not sure if observable outputs should be here
      // but it should not run `next` on observables
      next(emission, next);
    }
  };
}
