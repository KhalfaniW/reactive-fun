import { createOperator, prepareObservable } from "./createOperator.js";

export function mergeAll({ concurrentLimit }, { id, getState, dispatch } = {}) {
  return createOperator({
    newNext: (emission) => {
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
    getState,
    dispatch,
  });
}
