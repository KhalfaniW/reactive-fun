import { createOperator, prepareObservable } from "./createOperator.js";

export function switchAll({ id, getState, dispatch } = {}) {
  return createOperator({
    newNext: (emission) => {
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
    getState,
    dispatch,
  });
}
