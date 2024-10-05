let run = (subscriber, then) => {
  [1, 1, 1, 4].forEach((element) => {
    subscriber.next(element, then);
  });
};

function filterBase(condition) {
  //  console.log("old", state);
  return (state, next) => {
    if (condition(state)) {
      next(state);
    }
    //wait forever
    return;
  };
}

let globalState = { callCount: 0 };
let derivedState = {};
let updateState = (newState) => {
  globalState = newState({ ...globalState, ...newState });
};
let editState = (stateChange) => {
  globalState = { ...globalState, ...stateChange };
};
let scan = (accumulateFunction, start) => {
  return (state, next) => {
    console.log(state);
    const scanAccumulator = accumulateFunction(
      globalState.scanAccumulator || start,
      state,
    );
    updateState((globalState) => ({ ...globalState, scanAccumulator }));
    next(state);
  };
};
run({
  next: effectFlow(
    (state, next) => {
      updateState((globalState) => ({
        ...globalState,
        callCount: globalState.callCount + 1,
      }));
      console.log(globalState);
      next(state);
    },
    [scan((acc, newValue) => acc + newValue, 0)],
    //end
    (newState, other) => {
      console.log(newState, globalState);
    },
  ),
});

function effectFlow(updateStateEffect, steps, finalnext) {
  // separate updateStateEffect as a parameter because it is different and important
  return flow([updateStateEffect].concat(steps), finalnext).run;
}
function flow(steps, finalnext) {
  const all = steps.reverse().reduce((accumulator, step, index, allSteps) => {
    return accumulator.concat({
      lambda: (result, extra) => {
        const nextFunction =
          index === 0 ? finalnext : accumulator.at(-1).lambda;

        step(result, (r) => {
          nextFunction(r, {
            resultList: extra?.resultList?.concat(r) || [r],
          });
        });
      },
    });
  }, []);

  //
  return { all, run: (v) => all.at(-1).lambda(v) };
}

const bomb = flow(
  [
    (number, next) => next(number + "a"),

    (number, next) =>
      setTimeout(() => {
        next(number + "b");
      }, 1499),
    (number, next) =>
      setTimeout(() => {
        next(number + "c");
      }, 1499),
    // (number, next) => next(number >> 4),
  ],

  (finalResult, resultList) => console.log(finalResult, resultList),
);
