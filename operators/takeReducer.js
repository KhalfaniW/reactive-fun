export function takeReducer(state, action) {
  const thisOperator = state.operatorStates && state.operatorStates[0];

  switch (action.type) {
    case "INIT(take)":
      return {
        ...state,
        operatorStates: state.operatorStates.concat({
          type: "take",
          id: action.operatorId,
          count: 0,
          max: Math.round(action.max),
          next: action.next,
        }),
        effectObject:
          action.max <= 0
            ? {
                type: "COMPLETE-OPERATOR",
                operatorId: action.operatorId,
              }
            : state.effectObject,
      };
    case "PARENT-COMPLETE":
      if (thisOperator.type === "take") {
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
    case "HANDLE-EMISSION(take)":
      const newCount = thisOperator.count + 1;
      if (newCount > action.max) {
      }
      let newEffectObject = [
        {
          type: "HANDLE-EMISSION",
          value: action.value,
          next: state.operatorStates[0].next,
        },
      ];
      if (newCount == thisOperator.max) {
        newEffectObject.push({
          type: "COMPLETE-OPERATOR",
          operatorId: action.operatorId,
        });
      }

      return {
        ...state,
        operatorStates: state.operatorStates.map((operator) =>
          operator.id === action.operatorId
            ? {
                ...operator,
                count: newCount,
              }
            : operator,
        ),
        effectObject: newEffectObject,
      };

    default:
      return state;
  }
}
