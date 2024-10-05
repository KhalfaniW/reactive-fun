import { pipe, flow, filterBase, delay } from "./functions.js";

console.log("++++ start ++++++");
let run = (flowFunction, afterAll) => {
  [1, 2, 3].forEach((element) => {
    flowFunction(element);
  });
};

let continuations = [];
run(
  pipe(
    [
      (state, next) => {
        //tap
        console.log(state);
        next(state);
        // next({ ...state, bount: state.bount || " " + "a" });
      },
      (state, next) => {
        // Update state in next function, if needed
        const observable = ({ stateHandler, continuations, i }) => {
          const afterAllPiping = (curState) => {
            stateHandler(curState);

            if (i < continuations.length - 1) {
              continuations[i + 1]({ stateHandler, continuations, i: i + 1 });
            }
          };

          pipe([delay(1000)], afterAllPiping)(state);
        };
        next();
      },
    ],
    //end
    (newState, other) => {
      console.log(other);
      continuations = continuations.concat(newState);
    },
  ),
);
console.log("n", continuations);

continuations.push(({ stateHandler, continuations, i }) => {
  console.log("Current state:", 9); // Log current state
  const curStateHandler = stateHandler;

  const afterAllPiping = (curState) => {
    console.log(curState);
    curStateHandler(curState); // Invoke the state handler with the current state

    // Continue to the next continuation if there is one
    if (i < continuations.length - 1) {
      continuations[i + 1]({ stateHandler, continuations, i: i + 1 });
    }
  };

  // Apply pipe function with delay and afterAllPiping callback
  pipe([delay(1000)], afterAllPiping)(9);
});
//conObservables .forEach((c) => c());
// conObservables[0]
continuations[0]({
  stateHandler: (state) => {
    console.log("later2", state);
  },
  continuations,
  i: 0,
});

const conObservables = continuations.map((continuation) => {
  return () =>
    continuation((state) => {
      console.log("later", state);
      return;
      pipe(
        [
          delay(1000),
          filterBase((x) => x !== 2),
          (state, next) => {
            console.log("next", state);
            next(state);
          },
        ],
        //end
        (newState, other) => {
          console.log(newState);
        },
      )(state);
      // console.log('state',state)
      return;
    });
});
