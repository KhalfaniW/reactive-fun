import { createOperator, prepareObservable } from "./createOperator.js";

export function mergeAll({ concurrentLimit } = { concurrentLimit: Infinity }) {
  return createOperator({
    newNext:
      ({ dispatch, getState }) =>
      (emission) => {
        dispatch({
          type: "HANDLE-NEW-OBSERVABLE(mergeAll)",
          newObservable: prepareObservable({
            emission,
            id: `obs_${getState().observables.length}`,
          }),
        });
      },
    initOperatorAction: {
      type: "INIT(mergeAll)",
      concurrentLimit,
    },
  });
}
