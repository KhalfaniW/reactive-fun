import { createOperator } from "./createOperator.js";
import { filterReducer } from "./filterReducer.js";

export function filter(predicate) {
  return createOperator({
    newNext:
      ({ dispatch }) =>
      (value) => {
        dispatch({
          type: "HANDLE-EMISSION(filter)",
          value,
        });
      },
    initOperatorAction: {
      type: "INIT(filter)",
      predicate,
    },
    reducer: filterReducer,
  });
}
