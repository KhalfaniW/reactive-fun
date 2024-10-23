import { nanoid } from "nanoid";
import _ from "lodash";
import { dispatch, getState } from "./main.js";
import { scan } from "./scan.js";

const getStateTesting = () => cleanFunctions(getState());

test("testing scan", () => {
  return new Promise((resolve, reject) => {
    var i = 0;
    const obs2 = (subscriber) => {
      subscriber.next(1);
      subscriber.next(2);

      setTimeout(() => {
        subscriber.next(3);
        subscriber.complete();
      }, 500);
    };

    connectObservableToState(obs2)({
      next: (value) => {},
      complete: () => {
        expect(getStateTesting()).toMatchObject(expected_EndState_);

        resolve();
      },
    });
  });
});

function connectObservableToState(observable) {
  return (
    { next: finalNext = () => {}, complete: finalComplete = () => {} },
    mainState = getState(),
  ) => {
    const finalNextWithState = (emission, originObservable) => {
      finalNext(emission);
      dispatch({
        type: "HANDLE-EMISSION",
        observableId: null,
        emittedValue: emission,
      });
    };
    if (!mainState?.isStarted) {
      dispatch({
        type: "INIT",
        complete: finalComplete,
        observables: [],
      });
    }

    observable({
      next: (value) => {
        scan((accumulator, value) => accumulator + value, 0, { id: "scan_1" })(
          value,
          finalNextWithState,
        );
      },
      complete: finalComplete,
    });
  };
}

function cleanFunctions(programState) {
  return _.cloneDeepWith(programState, (value) => {
    if (_.isFunction(value)) {
      return "[Function]";
    }
  });
}
const expected_EndState_ = {
  emittedValues: [
    { id: null, emittedValue: 1 },
    { id: null, emittedValue: 3 },
    { id: null, emittedValue: 6 },
  ],
  isCompleted: false,
  isStarted: true,
  effectObject: null,
  operatorStates: [{ type: "scan", id: "scan_1", value: 6 }],
  complete: "[Function]",
  observables: [],
};
