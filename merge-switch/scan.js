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

export function scan1(
  accumulator,
  firstValue = undefined,
  { id, getState, dispatch },
) {
  return (observable) => {
    const newObservable = ({
      next: originalNext,
      complete: originalComplete,
    }) => {
      if (!getState()?.isStarted) {
        dispatch({
          type: "INIT",
          complete: originalComplete,
          observables: [],
        });
      }
      const isOperatorStateNotInitizlized = !getState().operatorStates.some(
        (operator) => operator.id === id,
      );

      const newComplete = () => {};
      const newNext = (emission) => {
        const thisOperator = getState().operatorStates.find(
          (operator) => operator.id === id,
        );
      };
      if (isOperatorStateNotInitizlized) {
        dispatch({ next: originalNext });
      }
      //subscribe to innner
      observable({
        next: newNext,
        complete: originalComplete,
      });
    };

    return newObservable;
  };
}
