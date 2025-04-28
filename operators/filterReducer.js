import { operate } from "./utils/operate.js";

export function filterReducer(state, action) {
  const thisOperator = state.operatorStates && state.operatorStates[0];

  const handleEmission = ({ state, thisOperator, action }) => {
    const shouldEmit = thisOperator.predicate(action.value);
    if (shouldEmit) {
      return {
        emission: action.value,
      };
    }
  };

  return operate({
    initState: {
      predicate: action.predicate,
    },
    state,
    action,
    thisOperator,
    operatorType: "filter",
    onEmmision: handleEmission,
  });
}
