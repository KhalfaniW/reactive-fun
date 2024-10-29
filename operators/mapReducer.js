export function mapReducer(state, action) {
  const thisOperator = state.operatorStates && state.operatorStates[0];

  switch (action.type) {
    case "INIT(map)":
      return {
        ...state,
        operatorStates: [
          {
            type: "map",
            id: action.operatorId,
            mapIndex: -1,
            mapFn: action.mapFn,
            next: action.next,
          },
        ],
      };
    case "PARENT-COMPLETE":
      if (thisOperator.type === "map") {
        return {
          ...state,
          effectObject: {
            type: "COMPLETE-OPERATOR",
            operatorId: action.operatorId,
          },
        };
      }
      return state;

    case "HANDLE-EMISSION(map)":
      const currentIndex = state.operatorStates[0].mapIndex + 1;
      const newValue = thisOperator.mapFn(action.value, currentIndex);
      return {
        ...state,
        operatorStates: state.operatorStates.map((operator) =>
          operator.id === action.operatorId
            ? {
                ...operator,
                mapIndex: currentIndex,
              }
            : operator,
        ),
        effectObject: {
          type: "HANDLE-EMISSION",
          value: newValue,
          next: state.operatorStates[0].next,
        },
      };

    default:
      return state;
  }
}
