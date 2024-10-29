import { nanoid } from "nanoid";
import _ from "lodash";
import { dispatch, getState } from "./main-store.js";
import { exhaustAll } from "./exhaustAll.js";
import fs from "fs";
const exhaustAllSubscriberId = nanoid().slice(0, 5);
const getStateTesting = () => cleanFunctions(getState());

test("testing exhaustAll 1", () => {
  return new Promise((resolve, reject) => {
    var i = 0;

    exhaustAll({
      getState,
      dispatch,
    })(higherOrderObservable)({
      next: (value) => {},
      complete: () => {
        resolve();
        expect(_.omit(getStateTesting())).toMatchObject(
          expected_exhaustAll_EndState_,
        );
      },
    });

  });
});

function getObservables() {
  const obs1 = ({
    next,
    complete,
    simlatedRun = (next, complete) => {
      //simulate the effects that would be sent
      next(1);
      setTimeout(() => {
        next(2);
      }, 1);

      setTimeout(() => {
        next(3);
        complete();
      }, 10);
    },
  }) => {
    simlatedRun(next, complete);
    const unsubscribe = () => {};
    return unsubscribe;
  };

  const obs2 = (subscriber) => {
    subscriber.next(4);
    subscriber.next(5);

    const timerRef = setTimeout(() => {
      subscriber.next(6);
      subscriber.complete();
    }, 50000);

  
  };
  const obs3 = (subscriber) => {
    subscriber.next(8);

    setTimeout(() => {
      subscriber.next(9);
      subscriber.complete();
    }, 50);
  };

  return [obs1, obs2, obs3];
}
function higherOrderObservable({ next, complete }) {
  const [obs1, obs2, obs3] = getObservables();
  next(obs1);
  setTimeout(() => {
    next(obs2);
  }, 5);
  setTimeout(() => {
    next(obs3);
    complete();
  }, 120);
}

function cleanFunctions(programState) {
  return _.cloneDeepWith(programState, (value) => {
    if (_.isFunction(value)) {
      return "[Function]";
    }
  });
}
const expected_exhaustAll_EndState_ = {
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
