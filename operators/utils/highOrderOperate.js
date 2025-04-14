import { produce } from "immer";

///TODO do not use entire stte
export function highOrderOperate({
  state,
  initState,
  action,
  thisOperator,
  operatorType,
  onEmmision,
  onComplete,
  makeSubscriber,
  handleComplete,
  handleNewObservable,
  getCompleteCondition,
}) {

  return produce(state, (draft) => {
    switch (action.type) {
      case `INIT(${operatorType})`:
        draft.operatorStates = [
          {
            type: operatorType,
            id: action.operatorId,
            isCompleted: false,
            currentObservableId: null,
            next: action.next,
            ...initState,
          },
        ];
        break;
      case `HANDLE-NEW-OBSERVABLE(${operatorType})`:
        return handleNewObservable({
          state: draft,
          operatorType,
          createSubscriberLink,
          makeSubscriber,
        });

        break;
      case `OBSERVABLE-COMPLETE(${operatorType})`:
        for (let operator of draft.operatorStates) {
          if (operator.id === thisOperator.id) {
            operator.currentObservableId = null;
          }
        }
        for (let observable of draft.observables) {
          if (observable.id === action.observableId) {
            observable.observeState = "COMPLETED";
          }
        }
        break;
      case `OBSERVABLE-UNSUBSCRIBE(${operatorType})`:
        for (let observable of draft.observables) {
          if (observable.id === action.observableId) {
            observable.observeState = "UNSUBSCRIBED";
          }
        }
        break;

      case `HANDLE-OBSERVABLE-COMPLETE(${operatorType})`:
        return handleComplete({ operatorType, action,state:draft,createSubscriberLink,makeSubscriber });
        break;

      case "PARENT-COMPLETE":
        if (thisOperator.type !== operatorType) {
          return;
        }
        if (getCompleteCondition(state)) {
          draft.effectObject = {
            type: "COMPLETE-OPERATOR",
            operatorId: action.operatorId,
          };
        }
        break;
    }
  });
}

function createSubscriberLink({
  observableId,
  operatorId,
  operatorType,
  makeSubscriber,
}) {
  // this takes a store { getState,dispatch} because it is called here:
  // rxjs-fun/operators/createOperator.js
  // next: newNext(currentOperatorStore),
  return ({ getState, dispatch }) => {
    // TODO remove depdency on entire state
    const state = getState();
    const observable = state.observables.find((obs) => obs.id == observableId);
    const operatorState = state.operatorStates.find(
      (operator) => operator.id == observable.operatorId,
    );

    const subscriber = makeSubscriber({
      getState,
      dispatch,
      state,
      observable,
      operatorState,
      operatorType,
      observableId,
      operatorId,
    });

    return subscriber;
  };
}
