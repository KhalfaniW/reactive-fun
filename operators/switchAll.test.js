import { Observable } from "rxjs";
import _ from "lodash";
import { dispatch, getState } from "./main-store.js";
import { switchAll } from "./switchAll.js";

const getStateTesting = () => cleanFunctions(getState());

test("testing switchAll 1", () => {
  return new Promise((resolve, reject) => {
    var i = 0;

    getHigherOrderObservable()
      .pipe(
        switchAll({
          getState,
          dispatch,
        }),
      )
      .subscribe({
        complete: () => {
          resolve();
          expect(getStateTesting()).toMatchObject(expected_switchAll_EndState_);
        },
      });
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

function cleanFunctions(programState) {
  return _.cloneDeepWith(programState, (value) => {
    if (_.isFunction(value)) {
      return "[Function]";
    }
  });
}

const expected_switchAll_EndState_ = {
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
