import { operate } from "./utils/operate";

export function mapReducer(state, action) {
  const thisOperator = state.operatorStates && state.operatorStates[0];

  const handleEmission = ({ state, thisOperator, action }) => {
    const emissionIndex =
      state.operatorStates[0].mapIndex === undefined
        ? 0
        : state.operatorStates[0].mapIndex + 1;
    const newValue = thisOperator.mapFn(action.value, emissionIndex);
    return {
      operatorDelta: { mapIndex: emissionIndex },
      emission: newValue,
    };
  };
  return operate({
    initState: {
      mapIndex: undefined,
      mapFn: action.mapFn,
    },
    state,
    action,
    thisOperator,
    operatorType: "map",
    onEmmision: handleEmission,
  });
}
