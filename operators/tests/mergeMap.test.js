import { cleanState } from "./utils/index.js";
import { Observable, of } from "rxjs";
import _ from "lodash";
import { mergeMap } from "../mergeMap.js";
import { map } from "../map.js";
import { mergeAll } from "../mergeAll.js";
import { makeStoreWithExtra } from "../redux/store.js";


test("mergeMapFunction", (done) => {
  of('first', 'second')
    .pipe(
        mergeMap((element, i) => {
            return  new Observable((subscriber) => {
                subscriber.next(1);
                setTimeout(() => {
                    subscriber.next(2);
                    subscriber.complete()
                }, 6);
            });

        }),
    )
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
        { id: "obs_0", emittedValue: 1 },
        { id: "obs_1", emittedValue: 1 },
        { id: "obs_0", emittedValue: 2 },
        { id: "obs_1", emittedValue: 2 },
      ],
      isCompleted: true,
      isStarted: true,
      operatorStates: [
        {
          type: "mergeAll",
          isCompleted: true,
          next: "[Function]",
        },
      ],
      complete: "[Function]",
      observables: [
        {
          subscribe: "[Function]",
          observeState: "COMPLETED",
          id: "obs_0",
        },
        {
          subscribe: "[Function]",
          observeState: "COMPLETED",
          id: "obs_1",
        },
      ],
      effectObject: null,
      isSourceComplete: true,
    };
  }
});

