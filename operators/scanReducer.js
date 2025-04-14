import { operate } from "./utils/operate";
export function scanReducer(state, action) {
  const thisOperator = state.operatorStates && state.operatorStates[0];

  const handleEmission = ({ state, thisOperator, action }) => {
    const newValue = thisOperator.accumulator(thisOperator.value, action.value);

    return {
      operatorDelta: { value: newValue },
      emission: newValue,
    };
  };
  return operate({
    initState: {
      id: action.operatorId,
      value: action.initialValue,
      accumulator: action.accumulator,
    },
    state,
    action,
    thisOperator,
    operatorType: "scan",
    onEmmision: handleEmission,
  });
}
