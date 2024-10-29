import { Observable } from "rxjs";
import _ from "lodash";
import { scan } from "./scan.js";
import { makeStoreWithExtra } from "./redux/store.js";

const storeWithExtra = makeStoreWithExtra();
export const getState = storeWithExtra.getState;
export const dispatch = storeWithExtra.dispatch;

const getStateTesting = () => cleanFunctions(getState());

test("testing scan", () => {
  return new Promise((resolve, reject) => {
    var i = 0;
    const obs2 = new Observable((subscriber) => {
      subscriber.next(1);
      subscriber.next(2);

      setTimeout(() => {
        subscriber.next(3);
        subscriber.complete();
      }, 500);
    });
    scan((sum, i) => sum + i, 0, { id: "scan_1", getState, dispatch })(
      obs2,
    ).subscribe({
      next: (value) => {},
      complete: () => {
        resolve();
        expect(getStateTesting()).toMatchObject(expected_EndState_);
      },
    });
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
    { emittedValue: 1 },
    { emittedValue: 3 },
    { emittedValue: 6 },
  ],
  isCompleted: true,
  isStarted: true,
  isParentComplete: true,
  effectObject: null,
  operatorStates: [{ type: "scan", id: "scan_1", value: 6 }],
  complete: "[Function]",
  observables: [],
};