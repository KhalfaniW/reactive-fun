import { createOperator, prepareObservable } from "./createOperator.js";

export function scan(
  accumulator,
  firstValue = null,
  { id, getState, dispatch } = {},
) {
  return createOperator({
    newNext: (emission) => {
      dispatch({
        type: "HANDLE-EMISSION(scan)",
        operatorId: id,
        value: emission,
      });
    },
    initOperatorAction: {
      type: "INIT(scan)",
      operatorId: id,
      initialValue: firstValue,
      accumulator,
    },
    getState,
    dispatch,
  });
}


