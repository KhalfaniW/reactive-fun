import { Observable } from "rxjs";
import _ from "lodash";
import { scan } from "../scan.js";

test("testing scan", (done) => {
  const obs = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.next(2);

    setTimeout(() => {
      subscriber.next(3);
      subscriber.complete();
    }, 500);
  });
  scan(
    (sum, i) => sum + i,
    0,
  )(obs).subscribe({
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

function cleanFunctions(programState) {
  return _.cloneDeepWith(programState, (value) => {
    if (_.isFunction(value)) {
      return "[Function]";
    }
  });
}
const endState = {
  emittedValues: [
    { emittedValue: 1 },
    { emittedValue: 3 },
    { emittedValue: 6 },
  ],
  isCompleted: true,
  isStarted: true,
  isParentComplete: true,
  effectObject: null,
  operatorStates: [{ type: "scan", value: 6 }],
  complete: "[Function]",
  observables: [],
};
