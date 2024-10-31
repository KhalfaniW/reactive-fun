import { Observable } from "rxjs";
import _ from "lodash";

import { exhaustAll } from "../exhaustAll.js";

test("testing exhaustAll 1", (done) => {
  getHigherOrderObservable()
    .pipe(exhaustAll())
    .subscribe({
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
    }, 10);
  });

  const obs2 = new Observable((subscriber) => {
    subscriber.next(4);
    subscriber.next(5);
    const timerRef = setTimeout(() => {
      subscriber.next(6);
      subscriber.complete();
    }, 50000);

    // Cleanup logic on unsubscribe
    return () => clearTimeout(timerRef);
  });

  const obs3 = new Observable((subscriber) => {
    subscriber.next(8);
    setTimeout(() => {
      subscriber.next(9);
      subscriber.complete();
    }, 50);
  });

  return [obs1, obs2, obs3];
}

function getHigherOrderObservable() {
  return new Observable((subscriber) => {
    const [obs1, obs2, obs3] = getObservables();

    subscriber.next(obs1);
    setTimeout(() => subscriber.next(obs2), 5);
    setTimeout(() => {
      subscriber.next(obs3);
      subscriber.complete();
    }, 120);
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
    { id: 0, emittedValue: 1 },
    { id: 0, emittedValue: 2 },
    { id: 0, emittedValue: 3 },
    { id: 2, emittedValue: 8 },
    { id: 2, emittedValue: 9 },
  ],
  isCompleted: true,
  isStarted: true,
  isParentComplete: true,
  effectObject: null,
  complete: "[Function]",
  observables: [
    { subscribe: "[Function]", id: 0, observeState: "COMPLETED" },
    { subscribe: "[Function]", id: 1, observeState: "NEW" },
    { subscribe: "[Function]", id: 2, observeState: "COMPLETED" },
  ],
  operatorStates: [
    {
      currentObservableId: null,
      type: "exhaustAll",
      isCompleted: true,
      next: "[Function]",
    },
  ],
};
