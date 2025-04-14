import { produce } from "immer";

export function operate({
  state,
  initState,
  action,
  thisOperator,
  operatorType,
  onEmmision,
  onComplete,
}) {
  return produce(state, (draft) => {
    switch (action.type) {
      case `INIT(${operatorType})`:
        draft.operatorStates = [
          {
            type: operatorType,
            id: action.operatorId,
            next: action.next,
            ...initState,
          },
        ];
        break;

      case "PARENT-COMPLETE":
        if (thisOperator.type === operatorType) {
          draft.effectObject = {
            type: "COMPLETE-OPERATOR",
            operatorId: action.operatorId,
          };
        }
        break;

      case `HANDLE-EMISSION(${operatorType})`:
        const delta = onEmmision({
          thisOperator,
          draft,
          state,
          action,
          emit: (newValue) => {},
        });

        if (delta.operatorDelta) {
          //TODO there should be a better way than looping through all operators
          draft.operatorStates = draft.operatorStates.map((operator) => {
            if (operator.id === action.operatorId) {
              return { ...operator, ...delta.operatorDelta };
            }
            return operator;
          });
        }
        const shouldEmit = delta.hasOwnProperty("emission");

        if (shouldEmit) {
          draft.effectObject = {
            type: "HANDLE-EMISSION",
            value: delta.emission,
            next: state.operatorStates[0].next,
          };
        }
        break;
    }
  });
}
