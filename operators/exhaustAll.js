import { createOperator, prepareObservable } from "./createOperator.js";

export function exhaustAll() {
  return createOperator({
    newNext:
      ({ dispatch, getState }) =>
      (emission) => {
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
  });
}
