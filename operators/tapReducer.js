import { operate } from "./utils/operate";

export function tapReducer(state, action) {
  const thisOperator = state.operatorStates && state.operatorStates[0];

  const handleEmission = ({ state, thisOperator, action }) => {
    return {
      emission: action.value,
    };
  };
  return operate({
    initState: { complete: action.complete },
    state,
    action,
    thisOperator,
    operatorType: "tap",
    onEmmision: handleEmission,
  });
}
