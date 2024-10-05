const observables = [1, 2, 3, 4].map((element) => {
  return {
    subscribe: (onSubscribe) => {
      // console.log("first emission", element);
      onSubscribe(element);
    },
  };
});
const newObservable2 = {
  subscribe: (next, onComplete) => {},
};

const newObservable1 = {
  subscribe: (observableState) => {
    if (observableState.isCompleted) {
      observables[1].subscribe({
        observable: "secondObservable",
        lastEmmesion: 3,
      });
    }
    observables[0].subscribe(
      onComplete,
      onComplete(() => {
        newObservable2.subscribe((emmsion) => {
          console.log("real emmsion", emmsion);
        });
      }),
    );
  },
};

newObservable1.subscribe((emmsion) => {
  console.log("real emmsion", emmsion);
});

// concatMap(({ next, onComplete }) => {
//   observables[0].next(next);
//   // return new Promise((resolve, reject) => {
//   //     console.log("first emssion", element);
//   //     next(element);
//   //     resolve();
//   // });
// });
function concatMap(observableFun, newObservableFun) {
  //take emissions, make them to observables, wait unitl one completes then start next
  const observables = observableFun({
    next: (emission) => {
      console.log("seccond operation with emission", emission);
      observe1({
        emission,
        next: () => {
          console.log("create observable from emmission", emission);
        },
        onComplete: () => {
          console.log("go to next obserable", emission);
        },
      });
      // const lazyObservable = () =>
      //   observe({
      //     next: () => {
      //       console.log("create observable from emmission", emission);
      //     },
      //     onComplete: () => {
      //       console.log("go to next obserable");
      //     },
      //   });
      // lazyObservable();
      // observableQueue.push(lazyObservable);
    },
    onComplete: () => [],
  });
  // const emit = (emmision) => {
  //   // run emmision
  // };
  // run(flow([(state, next) => next(state)], emit).run);
  // observableQueue.push(emision);
}

function filterBase(condition) {
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
let updateState = (emission) => {
  globalState = emission({ ...globalState, ...emission });
};
let editState = (stateChange) => {
  globalState = { ...globalState, ...stateChange };
};

// observe({
//   next: effectFlow(
//     (state, next) => {
//       updateState((globalState) => ({
//         ...globalState,
//         callCount: globalState.callCount + 1,
//       }));
//       // console.log(globalState);
//       next(state);
//     },
//     [
//       (emission, next) => {
//         next(emission);
//       },
//     ],
//     // [scan((acc, newValue) => acc + newValue, 0)],
//     //end
//     (emission, other) => {
//       console.log(emission, globalState);
//     },
//   ),
//   onComplete: () => console.log("completed"),
// });

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
