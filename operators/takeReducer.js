import { produce } from "immer";

export function takeReducer(state, action) {
  const thisOperator = state.operatorStates && state.operatorStates[0];

  return produce(state, (draft) => {
    switch (action.type) {
      case "INIT(take)":
        draft.operatorStates = draft.operatorStates.concat({
          type: "take",
          id: action.operatorId,
          count: 0,
          max: Math.round(action.max),
          next: action.next,
        });

        if (action.max <= 0) {
          draft.effectObject = {
            type: "COMPLETE-OPERATOR",
            operatorId: action.operatorId,
          };
        }
        break;

      case "PARENT-COMPLETE":
        if (thisOperator.type === "take") {
          draft.effectObject = {
            type: "COMPLETE-OPERATOR",
            operatorId: action.operatorId,
          };
        }
        break;

      case "HANDLE-EMISSION(take)":
        const newCount = thisOperator.count + 1;
        if (newCount > action.max) {
          return;
        }

        for (let operator of draft.operatorStates) {
          if (operator.id === action.operatorId) {
            operator.count = newCount;
          }
        }

        draft.effectObject = [
          {
            type: "HANDLE-EMISSION",
            value: action.value,
            next: state.operatorStates[0].next,
          },
        ];

        if (newCount === thisOperator.max) {
          draft.effectObject.push({
            type: "COMPLETE-OPERATOR",
            operatorId: action.operatorId,
          });
        }
        break;
    }
  });
}
