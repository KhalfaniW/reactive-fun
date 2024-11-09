import { cleanState } from "./utils/index.js";
import { Observable, tap as rxTap } from "rxjs";
import _ from "lodash";
import { tap } from "../tap.js";

test("testing tap composed", (done) => {
  const obs = new Observable((subscriber) => {
    subscriber.next(10);
    subscriber.next(20);
    setTimeout(() => {
      subscriber.complete();
    }, 6);
  });

  obs
    .pipe(
      tap({
        complete: (store) => {
          expect(cleanState(store.getState())).toMatchObject({
            0: {
              emittedValues: [
                { id: undefined, emittedValue: 10 },
                { id: undefined, emittedValue: 20 },
              ],
              isCompleted: true,
              isStarted: true,
              effectObject: null,
              operatorStates: [
                {
                  type: "tap",
                  next: "[Function]",
                  complete: undefined,
                },
              ],
              complete: "[Function]",
              observables: [],
            },
            1: {
              emittedValues: [
                { id: undefined, emittedValue: 10 },
                { id: undefined, emittedValue: 20 },
              ],
              isCompleted: true,
              isStarted: true,
              effectObject: null,
              operatorStates: [
                {
                  type: "tap",
                  next: "[Function]",
                  complete: undefined,
                  // isCompleted: true,
                },
              ],
              complete: "[Function]",
              observables: [],
              isParentComplete: true,
            },
          });
        },
      }),

      tap({
        complete: (store) => {
          try {
            expect(cleanState(store.getState())).toMatchObject({
              0: {
                emittedValues: [
                  { id: undefined, emittedValue: 10 },
                  { id: undefined, emittedValue: 20 },
                ],
                isCompleted: true,
                isStarted: true,
                effectObject: null,
                operatorStates: [
                  {
                    type: "tap",
                    next: "[Function]",
                    complete: undefined,
                    isCompleted: true,
                  },
                ],
                complete: "[Function]",
                observables: [],
                isParentComplete: true,
              },
              1: {
                emittedValues: [
                  { id: undefined, emittedValue: 10 },
                  { id: undefined, emittedValue: 20 },
                ],
                isCompleted: true,
                isStarted: true,
                effectObject: null,
                operatorStates: [
                  {
                    type: "tap",
                    next: "[Function]",
                    complete: undefined,
                    isCompleted: true,
                  },
                ],
                complete: "[Function]",
                observables: [],
                isParentComplete: true,
              },
            });
            done();
          } catch (error) {
            done(error);
          }
        },
      }),
    )
    .subscribe();
});
