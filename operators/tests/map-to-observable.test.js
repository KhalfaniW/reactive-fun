import { cleanState } from "./utils/index.js";
import { Observable, of } from "rxjs";
import _ from "lodash";
import { map } from "../map.js";
import { makeStoreWithExtra } from "../redux/store.js";

test("map to one obs", (done) => {
  const obs1 = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.complete();
  });

  of(1)
    .pipe(map((element, i) => obs1))
    .subscribe({
      complete: ({ getState }) => {
        try {
          expect(cleanState(getState())).toMatchObject(expected_EndState_());
          done();
        } catch (error) {
          done(error);
        }
      },
    });
  function expected_EndState_() {
    return {
      emittedValues: [
        {
          emittedValue: {
            subscribe: "[Function]",
            id: undefined,
          },
        },
      ],
      isCompleted: true,
      isStarted: true,
      isSourceComplete: true,
      effectObject: null,
      operatorStates: [{ type: "map", mapIndex: 0 }],
      complete: "[Function]",
      observables: [],
    };
  }
});
test("testing map to multiple", (done) => {
  const obs1 = new Observable((subscriber) => {
    subscriber.next(1);
    subscriber.complete();
  });
  const obs2 = new Observable((subscriber) => {
    subscriber.next(2);
    subscriber.complete();
  });

  const obs3 = new Observable((subscriber) => {
    subscriber.next();
    subscriber.next(10);
    setTimeout(() => {
      subscriber.next(15);
      subscriber.complete();
    }, 500);
  });

  of(1, 2)
    .pipe(map((element, i) => [obs1, obs2, obs3][i]))
    .subscribe({
      complete: ({ getState }) => {
        try {
          expect(cleanState(getState())).toMatchObject(expected_EndState_());
          done();
        } catch (error) {
          done(error);
        }
      },
    });

  function expected_EndState_() {
    return {
      emittedValues: [
        {
          emittedValue: {
            subscribe: "[Function]",
            id: undefined,
          },
        },
        {
          emittedValue: {
            subscribe: "[Function]",
            id: undefined,
          },
        },
      ],
      isCompleted: true,
      isStarted: true,
      isSourceComplete: true,
      effectObject: null,
      operatorStates: [{ type: "map", mapIndex: 1 }],
      complete: "[Function]",
      observables: [],
    };
  }
});
