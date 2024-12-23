import { cleanState } from "./utils/index.js";
import { Observable } from "rxjs";
import _ from "lodash";

import { mergeAll } from "../mergeAll.js";
import { makeStoreWithExtra } from "../redux/store.js";

const { getState, dispatch } = makeStoreWithExtra();

test("concatAll using mergeAll concurrency 1", (done) => {
  getHigherOrderObservable()
    .pipe(mergeAll({ concurrentLimit: 1 }))
    .subscribe({
      next: (value) => {},
      complete: ({ getState }) => {
        try {
          expect(cleanState(getState())).toMatchObject(endState);
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
    }, 50);
  });

  const obs2 = new Observable((subscriber) => {
    subscriber.next(4);
    subscriber.next(5);
    setTimeout(() => {
      subscriber.next(6);
      subscriber.complete();
    }, 25);
  });

  const obs3 = new Observable((subscriber) => {
    subscriber.next(8);
    subscriber.next(9);
    setTimeout(() => {
      subscriber.complete();
    }, 5);
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

const endState = {
  emittedValues: [
    { id: "obs_0", emittedValue: 1 },
    { id: "obs_0", emittedValue: 2 },
    { id: "obs_0", emittedValue: 3 },
    { id: "obs_1", emittedValue: 4 },
    { id: "obs_1", emittedValue: 5 },
    { id: "obs_1", emittedValue: 6 },
    { id: "obs_2", emittedValue: 8 },
    { id: "obs_2", emittedValue: 9 },
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
      concurrentLimit: 1,
    },
  ],
};
