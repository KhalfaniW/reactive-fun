import { operate } from "./utils/operate";

export function repeatReducer(state, action) {
  const thisOperator = state.operatorStates && state.operatorStates[0];

  const handleEmission = ({ state, thisOperator, action }) => {
    return {
      emission: action.value,
    };
  };

  const newObservables = state.observables?.concat({
    ...action.newObservable,
    operatorId: action.operatorId,
  });

  if (action.type === "SOURCE-COMPLETE" && thisOperator?.count > 1) {
    return {
      ...state,
      operatorStates: [
        {
          ...state.operatorStates[0],
          count: thisOperator.count - 1,
        },
      ],
      effectObject: [
        {
          type: "RESUBSCRIBE-TO-SOURCE",
          resubscribe: thisOperator.resubscribe,
        },
      ],
    };
  }
  let newState = state;
  if (action.type === "SOURCE-COMPLETE" && thisOperator?.count == 1) {
    newState = {
      ...state,
      operatorStates: [
        {
          ...state.operatorStates[0],
          count: 0,
        },
      ],
    };
  }
  //  return state
  return operate({
    onInit: ({ state, action }) => {
      return {
        count: action.count,
        resubscribe: action.resubscribe,
      };
    },

    initState: {},
    state: newState,
    action,
    thisOperator,
    operatorType: "repeat",
    onEmmision: handleEmission,
  });
}
