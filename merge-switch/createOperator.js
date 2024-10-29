export function createOperator({
  type,
  getState,
  dispatch,
  newNext,
  initOperatorAction,
} = {}) {
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
      const isOperatorStateNotInitizlized = !getState().operatorStates[0];

      const newComplete = () => {
        const operatorName = getState().operatorStates[0].type;
        dispatch({
          type: 'PARENT-COMPLETE',
        });
      };

      if (isOperatorStateNotInitizlized) {
        dispatch({ ...initOperatorAction, next: originalNext });
      }
      observable({
        next: newNext,
        complete: newComplete,
      });
    };

    return newObservable;
  };
}

export function prepareObservable({ emission, id }) {
  const isNotAnObservable = typeof emission !== "function";
  if (isNotAnObservable) {
    throw new Error(`non observable ,${emission} sent to exhaustAll `);
  }
  const preparedExhaustObservable = {
    subscribe: emission,
    observeState: "NEW",
    id,
  };
  return preparedExhaustObservable;
}
