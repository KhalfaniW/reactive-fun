import { operate } from "./utils/operate";

export function repeatReducer(state, action) {
  const thisOperator = state.operatorStates && state.operatorStates[0];

  const handleEmission = ({ state, thisOperator, action }) => {
    return {
      emission: action.value,
    };
  };

  const newObservables = state.observables?.concat({
    ...action.newObservable,
    operatorId: action.operatorId,
  });

  if (action.type === "SOURCE_COMPLETE" && thisOperator?.count > 1) {
    return {
      state,
      operatorStates: {
        ...state.operatorStates,
        count: thisOperator.count - 1,
      },
      effectObject: [
        {
          type: "RESUBSCRIBE",
          createSubscriber: ({ getState, dispatch }) => {
            return {
              next: (value) => {
                thisOperator.sourceNext(value);
              },
              complete: () => {
                dispatch({
                  type: "SOURCE-COMPLETE",
              //    observable: thisOperator.sourceObservable,
                });
              },
            };
          },
        },
      ],
    };
  }
  //  return state
  return operate({
    onInit: ({state, action}) => {
      return {
        count: action.count, 
        sourceNext: action.sourceNext,
       sourceObservable: action.sourceObservable,
      };
    },

    initState: {},
    state,
    action,
    thisOperator,
    operatorType: "repeat",
    onEmmision: handleEmission,
  });
}
