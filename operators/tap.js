import { createOperator } from "./createOperator.js";

export function tap({ next: nextParamFn = () => {}, complete = () => {} }) {
  return createOperator({
    newNext:
      ({ dispatch, getState, debug }) =>
      (emission) => {
        dispatch({
          type: "HANDLE-EMISSION(tap)",
          value: emission,
        });

        nextParamFn(emission, { dispatch, getState, debug });
      },
    initOperatorAction: {
      type: "INIT(tap)",
      complete: ({ dispatch, getState, debug }) => {
        complete({ dispatch, getState, debug });
      },
    },
  });
}
