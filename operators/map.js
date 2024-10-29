import { createOperator, prepareObservable } from "./createOperator.js";

export function map(accumulator, { id, getState, dispatch } = {}) {
  return createOperator({
    newNext: (emission) => {
      dispatch({
        type: "HANDLE-EMISSION(map)",
        operatorId: id,
        value: emission,
      });
    },
    initOperatorAction: {
      type: "INIT(map)",
      operatorId: id,
      mapFn: accumulator,
    },
    getState,
    dispatch,
  });
}
