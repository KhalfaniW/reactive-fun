import { nanoid } from "nanoid";
import { getState, dispatch } from "./main.js";
// needed for observables to be coordninated with state
// operator id must be a parameter to allow for repeated execution without change.

const prepareNewObservable = (observable, id) => {
  //for when an observable is first seen
  const subscribe = observable;
  return {
    subscribe: subscribe,
    id,
    observeState: "NEW",
  };
};

export function mergeAll({
  id,
  concurrentLimit = Infinity,
  generateObservableId = () => nanoid(),
} = {}) {
  const options = { concurrentLimit };
  const operatorId = `mergeAll_Operator_${id}`;

  /**
   * @typedef {(emission: any, next: (emission: any, next: function) => void) => void} continuation
   */
  return (emission, next) => {
    const isOperatorStateNotInitizlized = !getState().operatorStates.find(
      (operator) => operator.id === operatorId,
    );
    if (isOperatorStateNotInitizlized) {
      dispatch({
        type: "INIT(mergeAll)",
        operatorId,
        concurrentLimit,
        next,
        observables: [],
      });

      // process.exit(1);
    }
    const isAnObservable = typeof emission === "function";
    if (isAnObservable) {
      const preparedMergeObservable = prepareNewObservable(
        emission,
        generateObservableId(),
      );

      dispatch({
        type: "HANDLE-NEW-OBSERVABLE(mergeAll)",
        operatorId,
        newObservable: preparedMergeObservable,
      });
    }
  };
}
