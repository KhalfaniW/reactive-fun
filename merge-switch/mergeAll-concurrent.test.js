import { nanoid } from "nanoid";
import _ from "lodash";
import { dispatch, getState } from "./main-store.js";
import { mergeAll } from "./mergeAll.js";
import fs from "fs";
const mergeAllSubscriberId = nanoid().slice(0, 5);

const getStateTesting = () => cleanFunctions(getState());

test(" mergeAll concurrency 2", () => {
  return new Promise((resolve, reject) => {
    mergeAll(
      { concurrentLimit: 2 },
      { getState, dispatch },
    )(higherOrderObservable)({
      next: (value) => {},
      complete: () => {
        resolve();
        expect(getStateTesting()).toMatchObject(expected_mergeAll_EndState);
      },
    });
  });
});

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
      }, 100);
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
    }, 50);
  };
  const obs3 = (subscriber) => {
    subscriber.next(8);
    subscriber.next(9);

    setTimeout(() => {
      subscriber.complete();
    }, 20);
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

const expected_mergeAll_EndState = {
  emittedValues: [
    { id: "obs_0", emittedValue: 1 },
    { id: "obs_1", emittedValue: 4 },
    { id: "obs_1", emittedValue: 5 },
    { id: "obs_0", emittedValue: 2 },
    { id: "obs_1", emittedValue: 6 },
    { id: "obs_2", emittedValue: 8 },
    { id: "obs_2", emittedValue: 9 },
    { id: "obs_0", emittedValue: 3 },
  ],
  isCompleted: true,
  isStarted: true,
  effectObject: null,
  observables: [
    { subscribe: "[Function]", id: "obs_0", observeState: "COMPLETED" },
    { subscribe: "[Function]", id: "obs_1", observeState: "COMPLETED" },
    { subscribe: "[Function]", id: "obs_2", observeState: "COMPLETED" },
  ],
  operatorStates: [
    {
      type: "mergeAll",
      isCompleted: true,
      next: "[Function]",
      concurrentLimit: 2 ,
    },
  ],
};
