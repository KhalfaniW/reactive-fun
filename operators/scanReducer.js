export function scanReducer(state, action) {
  const thisOperator = state.operatorStates && state.operatorStates[0];

  switch (action.type) {
    case "INIT(scan)":
      return {
        ...state,
        operatorStates: state.operatorStates.concat({
          type: "scan",
          id: action.operatorId,
          value: action.initialValue,
          accumulator: action.accumulator,
          next: action.next,
        }),
      };
    case "PARENT-COMPLETE":
      if (thisOperator.type === "scan") {
        return {
          ...state,
          effectObject: {
            type: "COMPLETE-OPERATOR",
            operatorId: action.operatorId,
          },
        };
      } else {
        return state;
      }

    case "HANDLE-EMISSION(scan)":
      const newValue = thisOperator.accumulator(
        thisOperator.value,
        action.value,
      );
      return {
        ...state,
        operatorStates: state.operatorStates.map((operator) =>
          operator.id === action.operatorId
            ? {
                ...operator,
                value: newValue,
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
