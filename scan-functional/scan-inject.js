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

let scan = (accumulateFunction, start) => {
  return (state, next, { updateState, getState }) => {
    console.log(state);
    const scanAccumulator = accumulateFunction(
      getState().scanAccumulator || start,
      state,
    );
    updateState((globalState) => ({ ...globalState, scanAccumulator }));
    next(state);
  };
};
run({
  next: effectFlow(
    (state, next, { updateState, getState }) => {
      updateState((globalState) => ({
        ...globalState,
        callCount: globalState.callCount + 1,
      }));
      console.log(getState());
      next(state);
    },
    [
      scan((acc, newValue) => acc + newValue, 0),

      (state, next, { updateState, getState }) => {
        // updateState((globalState) => ({
        //     ...globalState,
        //     callCount: globalState.callCount + 1,
        // }));
        console.log(getState());
        next(state);
      },
    ],
    //end
    (newState, other) => {
      // console.log(newState, other.getState);
    },
  ),
});

function effectFlow(updateStateEffect, steps, finalnext) {
  // separate updateStateEffect as a parameter because it is different and important
  return flow([updateStateEffect].concat(steps), finalnext).run;
}
function flow(steps, finalnext) {
  let globalState = { callCount: 0 };

  let updateState = (changeState) => {
    globalState = changeState({ ...globalState });
  };

  let getState = () => globalState;
  const all = steps.reverse().reduce((accumulator, step, index, allSteps) => {
    return accumulator.concat({
      lambda: (result, extra) => {
        const nextFunction =
          index === 0 ? finalnext : accumulator.at(-1).lambda;

        step(
          result,
          (r) => {
            nextFunction(r, {
              resultList: extra?.resultList?.concat(r) || [r],
            });
          },
          { updateState, getState },
        );
      },
    });
  }, []);

  //
  return { all, run: (v) => all.at(-1).lambda(v) };
}
