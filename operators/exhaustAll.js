import { createOperator, prepareObservable } from "./createOperator.js";

export function exhaustAll({ id, getState, dispatch } = {}) {
  return createOperator({
    newNext: (emission) => {
      dispatch({
        type: "HANDLE-NEW-OBSERVABLE(exhaustAll)",
        newObservable: prepareObservable({
          emission,
          id: getState().observables.length,
        }),
      });
    },
    initOperatorAction: {
      type: "INIT(exhaustAll)",
    },
    getState,
    dispatch,
  });
}
