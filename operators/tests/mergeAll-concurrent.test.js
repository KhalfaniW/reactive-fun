import { Observable } from "rxjs";
import _ from "lodash";

import { mergeAll } from "../mergeAll.js";

const getStateTesting = () => cleanFunctions(getState());

test(" mergeAll concurrency 2", (done) => {
  mergeAll({ concurrentLimit: 2 })(getHigherOrderObservable()).subscribe({
    complete: ({ getState }) => {
      try {
        expect(cleanFunctions(getState())).toMatchObject(endState);
        done();
      } catch (error) {
        done(error);
      }
    },
  });
});

function getObservables() {
  const obs1 = new Observable((subscriber) => {
    subscriber.next(1);
    setTimeout(() => subscriber.next(2), 1);
    setTimeout(() => {
      subscriber.next(3);
      subscriber.complete();
    }, 100);
  });

  const obs2 = new Observable((subscriber) => {
    subscriber.next(4);
    subscriber.next(5);
    setTimeout(() => {
      subscriber.next(6);
      subscriber.complete();
    }, 50);
  });

  const obs3 = new Observable((subscriber) => {
    subscriber.next(8);
    subscriber.next(9);
    setTimeout(() => {
      subscriber.complete();
    }, 20);
  });

  return [obs1, obs2, obs3];
}

function getHigherOrderObservable() {
  return new Observable((subscriber) => {
    const [obs1, obs2, obs3] = getObservables();

    subscriber.next(obs1);
    subscriber.next(obs2);
    subscriber.next(obs3);
    subscriber.complete();
  });
}

function cleanFunctions(programState) {
  return _.cloneDeepWith(programState, (value) => {
    if (_.isFunction(value)) {
      return "[Function]";
    }
  });
}

const endState = {
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
      concurrentLimit: 2,
    },
  ],
};
