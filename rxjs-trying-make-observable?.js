
const observableState = {
  innerSubscription: null,
  isCompleted: false,
  subscribers: [],
};

function subscribe(observableState, subscribionHandler) {
  return {
    ...observableState,
    subscribers: observableState.subscribers.concat(subscribionHandler),
  };
}
function next(observableState, emmsion) {
  const newObservableState = { ...observableState };
  // newObservableState.isCompleted = true;
  observableState.subscribers.forEach((subscriptionHandler) => {
    subscriptionHandler(emmsion);
  });
  return newObservableState;
}
function complete(observableState) {
  const newObservableState = { ...observableState };
  newObservableState.isCompleted = true;
  newObservableState.onComplete();
  return observableState;
}

next({
  innerSubscription: null,
  isCompleted: false,
  subscribers: [
    (emission) => {
      console.log("me subscribed", emission);
    },
  ],
},45);
