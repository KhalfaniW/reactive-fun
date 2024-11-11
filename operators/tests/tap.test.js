import { jest } from "@jest/globals";
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

  const tapComplete = jest.fn();
  const tapNext = jest.fn();
  obs
    .pipe(
      tap({
        next: (emmison, { getState }) => {
          tapNext();
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
          tapComplete();
          expect(cleanState(completeStore.getState())).toMatchObject({
            emittedValues: [{ emittedValue: 10 }],
            isCompleted: false,
            isStarted: true,
            isParentComplete: true,
            effectObject: null,
            operatorStates: [{ type: "tap", next: "[Function]" }],
            complete: "[Function]",
            observables: [],
          });
        },
      }),
    )
    .subscribe({
      complete: (store) => {
        try {
          expect(tapNext).toHaveBeenCalled();
          expect(tapComplete).toHaveBeenCalled();
          done();
        } catch (error) {
          done(error);
        }
      },
    });
});
