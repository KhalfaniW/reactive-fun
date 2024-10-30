import { createOperator, prepareObservable } from "./createOperator.js";

export function switchAll() {
  return createOperator({
    newNext:
      ({ dispatch, getState }) =>
      (emission) => {
        dispatch({
          type: "HANDLE-NEW-OBSERVABLE(switchAll)",
          newObservable: prepareObservable({
            emission,
            id: `obs_${getState().observables.length}`,
          }),
        });
      },
    initOperatorAction: {
      type: "INIT(switchAll)",
    },
  });
}
