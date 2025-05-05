import { createOperator, prepareObservable } from "./createOperator.js";

export function reduce(accumulator, firstValue = null) {
  return createOperator({
    newNext:
      ({ dispatch, getState }) =>
      (emission) => {
        dispatch({
          type: "HANDLE-EMISSION(reduce)",
          value: emission,
        });
      },
    initOperatorAction: {
      type: "INIT(reduce)",
      initialValue: firstValue,
      accumulator,
    },
  });
}
