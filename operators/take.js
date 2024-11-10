import { createOperator } from "./createOperator.js";

export function take(maxCount) {
  return createOperator({
    newNext:
      ({ dispatch, getState }) =>
      (emission) => {
        dispatch({
          type: "HANDLE-EMISSION(take)",
          value: emission,
        });
      },
    initOperatorAction: {
      type: "INIT(take)",
      max: maxCount,
    },
  });
}
