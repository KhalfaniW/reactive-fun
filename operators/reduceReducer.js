import { operate } from "./utils/operate";

export function reduceReducer(state, action) {
  const thisOperator = state.operatorStates?.[0];

  const handleEmission = ({ state, thisOperator, action }) => {
    const newValue = thisOperator.accumulator(thisOperator.value, action.value);

    return {
      operatorDelta: { value: newValue },
    };
  };

  if (thisOperator && thisOperator?.type !== "reduce") {
    return state;
  }

  if (action.type === "SOURCE-COMPLETE") {
    return {
      ...state,
      effectObject: [
        {
          type: "HANDLE-EMISSION",
          value: thisOperator.value,
          next: thisOperator.next,
        },
        {
          type: "COMPLETE-OPERATOR",
          operatorId: action.operatorId,
        },
      ],
    };
  }

  return operate({
    initState: {
      id: action.operatorId,
      value: action.initialValue,
      accumulator: action.accumulator,
    },
    state,
    action,
    thisOperator,
    operatorType: "reduce",
    onEmmision: handleEmission,
  });
}
