import { cleanState } from "./utils/index.js";
import { Observable } from "rxjs";
import _ from "lodash";

import { switchAll } from "../switchAll.js";

test("testing switchAll 1", (done) => {
  getHigherOrderObservable()
    .pipe(switchAll())
    .subscribe({
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
function getHigherOrderObservable() {
  return new Observable((subscriber) => {
    const [obs1, obs2, obs3] = getObservables();
    subscriber.next(obs1);
    subscriber.next(obs2);
    subscriber.next(obs3);
    subscriber.complete();
  });
}
function getObservables() {
  const obs1 = new Observable((subscriber) => {
    subscriber.next(1);
    setTimeout(() => {
      subscriber.next(2);
    }, 1);
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
    }, 5);
  });

  return [obs1, obs2, obs3];
}

const endState = {
  emittedValues: [
    { id: "obs_0", emittedValue: 1 },
    { id: "obs_1", emittedValue: 4 },
    { id: "obs_1", emittedValue: 5 },
    { id: "obs_2", emittedValue: 8 },
    { id: "obs_2", emittedValue: 9 },
  ],
  isCompleted: true,
  observables: [
    { id: "obs_0", observeState: "UNSUBSCRIBED" },
    { id: "obs_1", observeState: "UNSUBSCRIBED" },
    { id: "obs_2", observeState: "COMPLETED" },
  ],
  operatorStates: [{ type: "switchAll", isCompleted: true }],
};
