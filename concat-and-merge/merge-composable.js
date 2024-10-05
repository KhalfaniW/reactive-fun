import { produce, current } from "immer";
import { nanoid } from "nanoid";
import { stateSetup, mergeReducer } from "./merge-import.js";

const { dispatch, state, allStates } = stateSetup();

const [obs1, obs2, obs3] = getObservables();
export const allObservables = [obs1, obs2, obs3];

console.log("Merge example:");

/*

  observeState: "NEW" | "RUNNING" | "COMPLETED"

 */

function isACompsable(unkonwnParam) {
  return typeof unkonwnParam !== "function";
}
const prepareObservable = (observable) => {
  const subscribe = observable;
  return {
    subscribe: subscribe,
    id: nanoid(),
    observeState: "NEW",
  };
};

// return type composable which takes next;fnf,complete:fn, composeParams: object
export function merge(...params) {
  const composables = params.filter(isACompsable);
  const observables = params.filter((fn) => !isACompsable(fn));

  // const newComposeObservables = params.reduce((newObservables, param) => {
  //   if (isACompsable(param)) {
  //     return newObservables.concat(
  //       composables
  //         .map((composable) => {
  //           return {
  //             ...prepareObservable(composable.composeParams.observables),
  //           };
  //         })
  //         .flat(),
  //     );
  //   }
  //   const observable = param;
  //     return newObservables.concat(prepareObservable(observable));
  // }, []);

  // console.log(newComposeObservables);

  return [{ action: "MERGE", entities: params }];
}

function run({ next, complete, composeParams }) {
  // TODO decompose the params to construct

  /*
      The purupose of composing this like this is to be able to compse merges and contats
      merge(obs4,concat(obs3, merge(obs1,obs2)))
  [
      {
          "action": "MERGE",
          "entities": [
              [
                  {
                      "action": "MERGE",
                      "entities": [
                          observeFn
                      ]
                  }
              ],
              observeFn
          ]
      }
  // ]
  */
  dispatch({
    type: "INIT",
    subscriber: { next, complete },
    observables: composeParams.observables.map(prepareObservable),
  });

  dispatch({
    type: "SUB-MERGE",
  });
}
const initialComposable = merge(obs1);

const test = 0.1;
if (test == 0) {
  console.log(JSON.stringify(initialComposable, null, 2));
} else if (test == 0.1) {
  console.log(JSON.stringify(merge(initialComposable, obs1), null, 2));
} else if (test == 1) {
  run({
    next: (value) => console.log(":", value),
    complete: () => console.log("Merge completed"),
    composeParams: initialComposable.composeParams,
  });
} else if (test == 2) {
  const mergeRanTwice = merge(initialComposable);
  run({
    next: (value) => console.log(":_", value),
    complete: () => console.log("Merge done"),
    composeParams: mergeRanTwice.composeParams,
  });
} else if (test == 2) {
  merge(
    initialComposable,
    obs2,
  )({
    next: (value) => console.log(":_", value),
    complete: () => console.log("Merge done"),
  });
}

// merge(
//   initialComposable({
//     next: (value) => console.log(":", value),
//     complete: () => console.log("Merge completed"),
//   }),
// )({
//   next: (value) => console.log(":_", value),
//   complete: () => console.log("Merge completed"),
// });

// merge(merge([obs1])).composedSubscribe({
//   next: (value) => console.log(":", value),
//   complete: () => console.log("Merge completed"),
// });
function getObservables() {
  // function* stateSimulator(i) {
  //   yield i++;
  //   yield i++;
  //   yield i++;
  //   return;
  // }

  const obs1 = ({
    next,
    complete,
    simlatedRun = (next, complete) => {
      //simulate the effects that would be sent
      next(1);
      setTimeout(() => {
        next(2);
      }, 1);

      setTimeout(() => {
        next(3);
        complete();
      }, 1000);
    },
  }) => {
    simlatedRun(next, complete);
    const unsubscribe = () => {};
    return unsubscribe;
  };
  const obs2 = (subscriber) => {
    subscriber.next(4);
    subscriber.next(5);

    setTimeout(() => {
      subscriber.next(6);
      subscriber.complete();
    }, 500);
  };
  const obs3 = (subscriber) => {
    subscriber.next(9);

    setTimeout(() => {
      subscriber.complete();
    }, 500);
  };

  return [obs1, obs2, obs3];
}
