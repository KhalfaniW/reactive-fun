import { createOperator, prepareObservable } from "./createOperator.js";

export function repeat(count) {
  return createOperator({
    newNext:
      ({ dispatch }) =>
      (emission) => {
        dispatch({
          type: "HANDLE-EMISSION(repeat)",
          value: emission,
        });
      },
    initOperatorAction: {
      type: "INIT(repeat)",
      count,
      complete: ({ dispatch, getState, debug }) => {
        complete({ dispatch, getState, debug });
      },
    },
  });
}
