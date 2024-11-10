import { createOperator, prepareObservable } from "./createOperator.js";

export function scan(accumulator, firstValue = null) {
  return createOperator({
    newNext:
      ({ dispatch, getState }) =>
      (emission) => {
        dispatch({
          type: "HANDLE-EMISSION(scan)",
          value: emission,
        });
      },
    initOperatorAction: {
      type: "INIT(scan)",
      initialValue: firstValue,
      accumulator,
    },
  });
}
