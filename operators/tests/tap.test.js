import { cleanState } from "./utils/index.js";
import { Observable } from "rxjs";
import _ from "lodash";
import { tap } from "../tap.js";

test("testing tap", (done) => {
  const obs = new Observable((subscriber) => {
    subscriber.next(10);
    setTimeout(() => {
      subscriber.complete();
    }, 6);
  });

  obs
    .pipe(
      tap({
        next: (emmison, { getState }) => {
          expect(cleanState(getState())).toMatchObject({
            emittedValues: [{ emittedValue: 10 }],
            isCompleted: false,
            isStarted: true,
            effectObject: null,
            operatorStates: [{ type: "tap", next: "[Function]" }],
            complete: "[Function]",
            observables: [],
          });
        },

        complete: (completeStore) => {
          try {
            expect(cleanState(completeStore.getState())).toMatchObject(
              expected_EndState_,
            );
            done();
          } catch (error) {
            done(error);
          }
        },
      }),
    )
    .subscribe();
});

const expected_EndState_ = {
  emittedValues: [{ emittedValue: 10 }],
  isCompleted: true,
  isStarted: true,
  isParentComplete: true,
  effectObject: null,
  operatorStates: [{ type: "tap", next: "[Function]" }],
  complete: "[Function]",
  observables: [],
};
