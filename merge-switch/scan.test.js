import { nanoid } from "nanoid";
import _ from "lodash";
import { dispatch, getState } from "./main.js";
import { scan } from "./scan.js";

const getStateTesting = () => cleanFunctions(getState());

test("testing scan", () => {
  return new Promise((resolve, reject) => {
    var i = 0;
    const obs2 = ({ next, complete }) => {
      next(1);
      next(2);

      setTimeout(() => {
        next(3);
        complete();
      }, 500);
    };
    scan((sum, i) => sum + i, 0, { id: "scan_1", getState, dispatch })(obs2)({
      next: (value) => {},
      complete: () => {
        resolve();
        expect(getStateTesting()).toMatchObject(expected_EndState_);
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
    { emittedValue: 1 },
    { emittedValue: 3 },
    { emittedValue: 6 },
  ],
  isCompleted: false,
  isStarted: true,
  effectObject: null,
  operatorStates: [{ type: "scan", id: "scan_1", value: 6 }],
  complete: "[Function]",
  observables: [],
};
