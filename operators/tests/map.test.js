import { Observable } from "rxjs";
import _ from "lodash";
import { map } from "../map.js";
import { makeStoreWithExtra } from "../redux/store.js";

test("testing map", (done) => {
  const obs = new Observable((subscriber) => {
    subscriber.next(5);
    subscriber.next(10);
    setTimeout(() => {
      subscriber.next(15);
      subscriber.complete();
    }, 500);
  });

  obs.pipe(map((element, i) => element * 10)).subscribe({
    complete: ({ getState }) => {
      try {
        expect(cleanFunctions(getState())).toMatchObject(expected_EndState_);
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

const expected_EndState_ = {
  emittedValues: [
    { emittedValue: 50 },
    { emittedValue: 100 },
    { emittedValue: 150 },
  ],
  isCompleted: true,
  isStarted: true,
  isParentComplete: true,
  effectObject: null,
  operatorStates: [{ type: "map", mapIndex: 2 }],
  complete: "[Function]",
  observables: [],
};
