import { cleanState } from "../utils/index.js";
import { Observable, tap as rxTap } from "rxjs";
import _ from "lodash";
import { tap } from "../../tap.js";

test("testing tap composed", (done) => {
  const obs = new Observable((subscriber) => {
    subscriber.next(10);
    subscriber.next(20);
    setTimeout(() => {
      subscriber.complete();
    }, 6);
  });
  obs.baseID = "start";
  const tapped = tap({
    next: (...p) => {
      debugger;
    },

    complete: (store_, mainStore) => {
      const state = store_.debug.getFullStateReadable();
      expect(cleanState(state)).toMatchObject({
        0: {
          emittedValues: [
            { id: undefined, emittedValue: 10 },
            { id: undefined, emittedValue: 20 },
          ],
          isCompleted: false,
          isStarted: true,
          effectObject: null,
          operatorStates: [
            {
              type: "tap",
              next: "[Function]",
              complete: "[Function]",
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
          isCompleted: false,
          isStarted: true,
          effectObject: null,
          operatorStates: [
            {
              type: "tap",
              next: "[Function]",
              complete: "[Function]",
            },
          ],
          complete: "[Function]",
          observables: [],
        },
      });
    },
  })(obs);
  tapped.id = "tapped";
  const tapped2Times = tap({
    complete: (store) => {
      const fullState = store.debug.getFullStateReadable();
      try {
        expect(cleanState(fullState)).toMatchObject({
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
                complete: "[Function]",
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
            isCompleted: false,
            isStarted: true,
            effectObject: null,
            operatorStates: [
              {
                type: "tap",
                next: "[Function]",
                complete: "[Function]",
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
  })(tapped);
  tapped2Times.subscribe();
});
