import { cleanState } from "./utils/index.js";
import { Observable } from "rxjs";
import _ from "lodash";
import { reduce } from "../reduce.js";

test("reduce", (done) => {
  const obs = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);

    setTimeout(() => {
      subscriber.next(3);
      subscriber.complete();
    }, 500);
  });
  reduce(
    (sum, i) => sum + i,
    0,
  )(obs).subscribe({
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

const endState = {
  emittedValues: [
    { emittedValue: 6 },
  ],
  isCompleted: true,
  isStarted: true,
  isSourceComplete: true,
  effectObject: null,
  operatorStates: [{ type: "reduce", value: 6 }],
  complete: "[Function]",
  observables: [],
};
