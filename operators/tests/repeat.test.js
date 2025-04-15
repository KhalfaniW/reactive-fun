import { cleanState } from "./utils/index.js";
import { Observable } from "rxjs";
import _ from "lodash";
import { repeat } from "../repeat.js";
import { makeStoreWithExtra } from "../redux/store.js";

test("repeat once", (done) => {
  // This is basically map i=>i
  const obs = new Observable((subscriber) => {
    subscriber.next(5);
    subscriber.next(10);
    setTimeout(() => {
      subscriber.next(15);
      subscriber.complete();
    }, 50);
  });

  obs.pipe(repeat(1)).subscribe({
    complete: ({ getState }) => {
      try {
        expect(cleanState(getState())).toMatchObject(expected_EndState_);
        done();
      } catch (error) {
        done(error);
      }
    },
  });
  const expected_EndState_ = {
    emittedValues: [
      { emittedValue: 5 },
      { emittedValue: 10 },
      { emittedValue: 15 },
    ],
    isCompleted: true,
    isStarted: true,
    isSourceComplete: true,
    effectObject: null,
    operatorStates: [{ type: "repeat", count: 0 }],
    complete: "[Function]",
    observables: [],
  };
});

test("repeat twice", (done) => {
  const obs = new Observable((subscriber) => {
    subscriber.next(5);
    subscriber.next(10);
    setTimeout(() => {
      subscriber.next(15);
      subscriber.complete();
    }, 50);
  });

  obs.pipe(repeat(2)).subscribe({
    complete: ({ getState }) => {
      try {
        expect(cleanState(getState())).toMatchObject(expected_EndState_);
        done();
      } catch (error) {
        done(error);
      }
    },
  });
  const expected_EndState_ = {
    emittedValues: [
      { emittedValue: 5 },
      { emittedValue: 10 },
      { emittedValue: 15 },
      { emittedValue: 5 },
      { emittedValue: 10 },
      { emittedValue: 15 },
    ],
    isCompleted: true,
    isStarted: true,
    isSourceComplete: true,
    effectObject: null,
    operatorStates: [{ type: "repeat", count: 0 }],
    complete: "[Function]",
    observables: [],
  };
});
