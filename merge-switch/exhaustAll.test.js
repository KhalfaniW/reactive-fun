import { nanoid } from "nanoid";
import _ from "lodash";
import { dispatch, getState } from "./main.js";
import { exhaustAll } from "./exhaustAll.js";
import fs from "fs";
const exhaustAllSubscriberId = nanoid().slice(0, 5);
const getStateTesting = () => cleanFunctions(getState());

test("testing exhaustAll 1", () => {
  return new Promise((resolve, reject) => {
    var i = 0;

    connectObservableToState(higherOrderObservable, {
      makeOperatorId: (name) => `testId_${name}`,
      makeObservableId: () => `obs_${i++}`,
    })({
      next: (value) => {},

      complete: () => {
        debugger;
        expect(_.omit(getStateTesting())).toMatchObject(
          expected_exhaustAll_EndState_,
        );

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
      finalNext(emission);
    };
    if (!mainState?.isStarted) {
      dispatch({
        type: "INIT",
        complete: finalComplete,
        observables: [],
      });
    }
    const exhaustAllSubscriberId = makeOperatorId("exhaustAll");
    observable({
      next: (value) => {
        // connect to pipe here
        exhaustAll({
          id: exhaustAllSubscriberId,
          concurrentLimit: 1,
          generateObservableId: makeObservableId,
        })(value, (emission, originObservable) => {
          //simulate end of pipe emission
          finalNextWithDebugging(emission, originObservable);
        });
      },
      complete: () => {
        dispatch({
          type: "PARENT-COMPLETE",
        });
      },
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
      }, 10);
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
    }, 50000);
  };
  const obs3 = (subscriber) => {
    subscriber.next(8);

    setTimeout(() => {
      subscriber.next(9);
      subscriber.complete();
    }, 501);
  };

  return [obs1, obs2, obs3];
}
function higherOrderObservable({ next, complete }) {
  const [obs1, obs2, obs3] = getObservables();
  next(obs1);
  setTimeout(() => {
    next(obs2);
  }, 5);
  setTimeout(() => {
    next(obs3);
    complete();
  }, 120);
}

function cleanFunctions(programState) {
  return _.cloneDeepWith(programState, (value) => {
    if (_.isFunction(value)) {
      return "[Function]";
    }
  });
}
const expected_exhaustAll_EndState_ = {
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
  isParentComplete: true,
  effectObject: null,
  complete: "[Function]",
  observables: [
    //by the time the last test ends not observables all have compelted
    {
      subscribe: "[Function]",
      id: "obs_0",
      observeState: "COMPLETED",
      operatorId: "ExhaustAll_Operator_testId_exhaustAll",
    },
    {
      subscribe: "[Function]",
      id: "obs_1",
      observeState: "NEW",
      operatorId: "ExhaustAll_Operator_testId_exhaustAll",
    },
    {
      subscribe: "[Function]",
      id: "obs_2",
      observeState: "COMPLETED",
      operatorId: "ExhaustAll_Operator_testId_exhaustAll",
    },
  ],
  operatorStates: [
    {
      currentObservableId: null,
      type: "exhaustAll",
      id: "ExhaustAll_Operator_testId_exhaustAll",
      isCompleted: true,
      next: "[Function]",
    },
  ],
};
