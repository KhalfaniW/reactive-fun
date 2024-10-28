export function scan(
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
        dispatch({
          type: "HANDLE-EMISSION(scan)",
          operatorId: id,
          value: emission,
        });

        const thisOperator = getState().operatorStates.find(
          (operator) => operator.id === id,
        );

      };
      if (isOperatorStateNotInitizlized) {
        dispatch({
          type: "INIT(scan)",
          operatorId: id,
          initialValue: firstValue,
          accumulator,
          next: originalNext,
        });
      }
      //subscribe to indner
      observable({
        next: newNext,
        complete: originalComplete,
      });
    };

    return newObservable;
  };
}
