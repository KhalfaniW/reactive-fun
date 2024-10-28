import { nanoid } from "nanoid";
import _ from "lodash";
import { dispatch, getState } from "./main.js";
import { switchAll } from "./switchAll.js";
import fs from "fs";
const switchAllSubscriberId = nanoid().slice(0, 5);
const getStateTesting = () => cleanFunctions(getState());

test("testing switchAll 1", () => {
  return new Promise((resolve, reject) => {
    var i = 0;

    connectObservableToState(higherOrderObservable, {
      makeOperatorId: (name) => `testId_${name}`,
      makeObservableId: () => `obs_${i++}`,
    })({
      next: (value) => {},

      complete: () => {
        resolve();
        expect(_.omit(getStateTesting())).toMatchObject(
          expected_concatAll_EndState_,
        );
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
    const switchAllSubscriberId = makeOperatorId("switchAll");
    observable({
      next: (value) => {
        // connect to pipe here
        switchAll({
          id: switchAllSubscriberId,
          concurrentLimit: 1,
          generateObservableId: makeObservableId,
        })(value, (emission, originObservable) => {
          //simulate end of pipe emission
          finalNextWithDebugging(emission, originObservable);
        });
      },
      complete: () => {}, // ignore
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
const expected_concatAll_EndState_ = {
  emittedValues: [
    {
      id: "obs_0",
      emittedValue: 1,
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
    //by the time the last test ends not observables all have compelted
    {
      subscribe: "[Function]",
      id: "obs_0",
      observeState: "UNSUBSCRIBED",
      operatorId: "SwitchAll_Operator_testId_switchAll",
    },
    {
      subscribe: "[Function]",
      id: "obs_1",
      observeState: "UNSUBSCRIBED",
      operatorId: "SwitchAll_Operator_testId_switchAll",
    },
    {
      subscribe: "[Function]",
      id: "obs_2",
      observeState: "COMPLETED",
      operatorId: "SwitchAll_Operator_testId_switchAll",
    },
  ],
  operatorStates: [
    {
      currentObservableId: null,
      type: "switchAll",
      id: "SwitchAll_Operator_testId_switchAll",
      isCompleted: true,
      next: "[Function]",
    },
  ],
};
