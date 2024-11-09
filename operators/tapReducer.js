export function tapReducer(state, action) {
  const thisOperator = state.operatorStates && state.operatorStates[0];

  switch (action.type) {
    case "INIT(tap)":
      return {
        ...state,
        operatorStates: [
          {
            type: "tap",
            next: action.next,
            complete: action.complete,
          },
        ],
      };
    case "PARENT-COMPLETE":
      if (thisOperator.type === "tap") {
        return {
          ...state,
          effectObject: {
            type: "COMPLETE-OPERATOR",
            operatorId: action.operatorId,
          },
        };
      }
      return state;

    case "HANDLE-EMISSION(tap)":
      return {
        ...state,
        effectObject: {
          type: "HANDLE-EMISSION",
          value: action.value,
          next: state.operatorStates[0].next,
        },
      };

    default:
      return state;
  }
}
