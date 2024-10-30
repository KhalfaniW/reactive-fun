import { createOperator, prepareObservable } from "./createOperator.js";

export function map(mapFn) {
  return createOperator({
    newNext:
      ({ dispatch }) =>
      (emission) => {
        dispatch({
          type: "HANDLE-EMISSION(map)",
          value: emission,
        });
      },
    initOperatorAction: {
      type: "INIT(map)",
      mapFn: mapFn,
    },
  });
}
