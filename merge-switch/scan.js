import { getState, dispatch } from "./main.js";

export function scan(accumulator, firstValue = undefined, { id }) {
  return (emission, next) => {
    const isOperatorStateNotInitizlized = !getState().operatorStates.some(
      (operator) => operator.id === id,
    );
    if (isOperatorStateNotInitizlized) {
      dispatch({
        type: "INIT(scan)",
        operatorId: id,
        initialValue: firstValue,
        accumulator,
        next,
      });
    }

    dispatch({
      type: "HANDLE-EMISSION(scan)",
      operatorId: id,
      value: emission,
    });

    const thisOperator = getState().operatorStates.find(
      (operator) => operator.id === id,
    );

    next(thisOperator.value);
  };
}
