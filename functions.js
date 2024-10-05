export function pipe(steps, finalnext) {
  return flow(steps, finalnext).run;
}
export function flow(steps, finalnext) {
  const all = steps.reverse().reduce((accumulator, step, index, allSteps) => {
    return accumulator.concat({
      lambda: (result) => {
        const nextFunction =
          index === 0 ? finalnext : accumulator.at(-1).lambda;

        step(result, (r) => {
          nextFunction(r);
        });
      },
    });
  }, []);

  //
  return {
    run: (v) => all.at(-1).lambda(v),
  };
}

export function delay(MS) {
  return (state, next) => {
    setTimeout(() => {
      next(state);
    }, MS);
  };
}
// DO? Add explicit conclusion for debugging?
// only implement if tried

export function filter(condition) {
  //  console.log("old", state);
  return (state, next) => {
    if (condition(state)) {
      next(state);
    }
    //wait forever
    return;
  };
}

export function map(fun) {
  //  console.log("old", state);
  return (state, next) => {
    next(fun(state));
  };
}
