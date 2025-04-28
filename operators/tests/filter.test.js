import { cleanState } from "./utils/index.js";
import { Observable } from "rxjs";
import { filter } from "../filter.js";

test("testing filter", (done) => {
  const obs = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.next(4);
    subscriber.next(5);
    setTimeout(() => {
      subscriber.next(6);
      subscriber.complete();
    }, 500);
  });

  // Filter even numbers
  obs.pipe(filter((x) => x % 2 === 0)).subscribe({
    complete: ({ getState }) => {
      try {
        expect(cleanState(getState())).toMatchObject(expected_EndState_);
        done();
      } catch (error) {
        done(error);
      }
    },
  });
}, 1000); // Set timeout to 1000ms for async operations

const expected_EndState_ = {
  emittedValues: [
    { emittedValue: 2 },
    { emittedValue: 4 },
    { emittedValue: 6 },
  ],
  isCompleted: true,
  isStarted: true,
  isSourceComplete: true,
  effectObject: null,
  operatorStates: [{ type: "filter" }],
  complete: "[Function]",
  observables: [],
};
