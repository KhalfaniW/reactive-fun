import { produce } from "immer";

export function operate({
  state,
  initState,
  action,
  thisOperator,
  operatorType,
  /**
   * Handles emission of values through the operator
   * @callback onEmissionCallback
   * @param {Object} params -
   * @returns {Object} - returns properties to be merged into the operator state
   */
  onEmmision,
  onComplete,
  /**
   * Handles initialization of the operator
   * @callback onInitCallback
   * @param {Object} params - Parameters object
   * @returns {Objectd} - returns properties to be merged into the operator inital state
   */
  onInit = () => ({}),
}) {
  return produce(state, (draft) => {
    switch (action.type) {
      case `INIT(${operatorType})`:
        const operatorStateDelta = onInit({ state, action });
        draft.operatorStates = [
          {
            type: operatorType,
            id: action.operatorId,
            next: action.next,
            ...initState,
            ...operatorStateDelta,
          },
        ];

        break;

      case "SOURCE-COMPLETE":
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
          const operator = draft.operatorStates[0];
          draft.operatorStates = [
            operator.id === action.operatorId
              ? { ...operator, ...delta.operatorDelta }
              : operator,
          ];
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
