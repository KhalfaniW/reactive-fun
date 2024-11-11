import { cleanState } from "./utils/index.js";
import { Observable, tap as rxTap } from "rxjs";
import _ from "lodash";
import { tap } from "../tap.js";
import { map } from "../map.js";

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
      map((emission) => `${emission}+1`),
      map((emission) => `${emission}+2`),
      tap({
        complete: (store_, mainStore) => {
          const state = store_.debug.getFullStateReadable();
          expect(cleanState(state)).toMatchObject({
            0: {
              emittedValues: [
                { id: undefined, emittedValue: "10+1" },
                { id: undefined, emittedValue: "20+1" },
              ],
              isCompleted: true,
              isStarted: true,
              effectObject: null,
              operatorStates: [
                {
                  type: "map",
                  next: "[Function]",
                },
              ],
              complete: "[Function]",
              observables: [],
            },
            1: {
              emittedValues: [
                { id: undefined, emittedValue: "10+1+2" },
                { id: undefined, emittedValue: "20+1+2" },
              ],
              isCompleted: true,
              isStarted: true,
              effectObject: null,
              operatorStates: [
                {
                  type: "map",
                  next: "[Function]",
                },
              ],
              complete: "[Function]",
              observables: [],
              isParentComplete: true,
            },
            2: {
              complete: "[Function]",
              effectObject: null,
              emittedValues: [
                {
                  emittedValue: "10+1+2",
                  id: undefined,
                },
                {
                  emittedValue: "20+1+2",
                  id: undefined,
                },
              ],
              isCompleted: false,
              isParentComplete: true,
              isStarted: true,
              observables: [],
              operatorStates: [
                {
                  complete: "[Function]",
                  next: "[Function]",
                  type: "tap",
                },
              ],
            },
          });
          done();
        },
      }),
    )
    .subscribe();
});
