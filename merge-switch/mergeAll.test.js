import { nanoid } from "nanoid";
import _ from "lodash";
import { dispatch, getState } from "./main.js";
import { mergeAll } from "./mergeAll.js";
import fs from "fs";
const mergeAllSubscriberId = nanoid().slice(0, 5);

const getStateTesting = () => cleanFunctions(getState());

test("test concatAll using mergeAll concurrency 1", () => {
  return new Promise((resolve, reject) => {
    var i = 0;

    connectObservableToState(higherOrderObservable, {
      makeOperatorId: (name) => `testId_${name}`,
      makeObservableId: () => `obs_${i++}`,
    })({
      next: (value) => {},

      complete: () => {
        expect(getStateTesting()).toMatchObject(expected_EndState);
        resolve();
      },
    });
  });
});

/**
 * @typedef {function} Observable
 * @typedef {Object} Dependencies
 * @property {function(string): string} [makeOperatorId]
 * @property {function(Observable): string} [makeObservableId]
 */
function connectObservableToState(
  observable,

  /**
   * @param {Dependencies} [dependencies={}] -  dependencies for dependency injection of side effects
   */
  depedencies = {},
) {
  const makeOperatorId =
    depedencies.makeOperatorId || ((operatorName) => nanoid().slice(0, 5));
  const makeObservableId = depedencies.makeObservableId || (() => nanoid());
  return (
    { next: finalNext = () => {}, complete: finalComplete = () => {} },
    mainState = getState(),
  ) => {
    const finalNextWithDebugging = (emission, originObservable) => {
      dispatch({
        type: "HANDLE-EMISSION",
        observableId: originObservable.id,
        emittedValue: emission,
      });

      finalNext(emission);
    };
    if (!mainState?.isStarted) {
      dispatch({
        type: "INIT",
        complete: finalComplete,
        observables: [],
      });
    }
    const mergeAllSubscriberId = makeOperatorId("mergeAll");
    observable({
      next: (value) => {
        // connect to pipe here
        mergeAll({
          id: mergeAllSubscriberId,
          concurrentLimit: 1,
          generateObservableId: makeObservableId,
        })(value, (emission, originObservable) => {
          //simulate end of pipe emission
          finalNextWithDebugging(emission, originObservable);
        });
      },
      complete: () => {
        debugger;
      }, // ignore
    });
  };
}

function getObservables() {
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
    subscriber.next(8);
    subscriber.next(9);

    setTimeout(() => {
      subscriber.complete();
    }, 50);
  };

  return [obs1, obs2, obs3];
}
function higherOrderObservable({ next, complete }) {
  const [obs1, obs2, obs3] = getObservables();
  next(obs1);
  next(obs2);
  next(obs3);

  complete();
}

function cleanFunctions(programState) {
  return _.cloneDeepWith(programState, (value) => {
    if (_.isFunction(value)) {
      return "[Function]";
    }
  });
}
const expected_EndState = {
  emittedValues: [
    {
      id: "obs_0",
      emittedValue: 1,
    },
    {
      id: "obs_0",
      emittedValue: 2,
    },
    {
      id: "obs_0",
      emittedValue: 3,
    },
    {
      id: "obs_1",
      emittedValue: 4,
    },
    {
      id: "obs_1",
      emittedValue: 5,
    },
    {
      id: "obs_1",
      emittedValue: 6,
    },
    {
      id: "obs_2",
      emittedValue: 8,
    },
    {
      id: "obs_2",
      emittedValue: 9,
    },
  ],
  isCompleted: true,
  isStarted: true,
  effectObject: null,
  complete: "[Function]",
  observables: [
    {
      subscribe: "[Function]",
      id: "obs_0",
      observeState: "COMPLETED",
      operatorId: "mergeAll_Operator_testId_mergeAll",
    },
    {
      subscribe: "[Function]",
      id: "obs_1",
      observeState: "COMPLETED",
      operatorId: "mergeAll_Operator_testId_mergeAll",
    },
    {
      subscribe: "[Function]",
      id: "obs_2",
      observeState: "COMPLETED",
      operatorId: "mergeAll_Operator_testId_mergeAll",
    },
  ],
  operatorStates: [
    {
      type: "mergeAll",
      id: "mergeAll_Operator_testId_mergeAll",
      isCompleted: true,
      next: "[Function]",
      concurrentLimit: 1,
    },
  ],
};
