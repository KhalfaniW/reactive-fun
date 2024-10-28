import { mainReducer, getState } from "./main.js";

export function scanReducer(state, action) {
  const thisOperator = state.operatorStates?.find(
    (operator) => operator.id === action.operatorId,
  );

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
    case "HANDLE-EMISSION(scan)":
      const newValue = thisOperator.accumulator(
        thisOperator.value,
        action.value,
      );
      // console.log(thisOperator)
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
        },
      };

    default:
      return state;
  }
}
