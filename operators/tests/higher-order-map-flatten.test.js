import { cleanState } from "./utils/index.js";
import { Observable, of, map as rxMap } from "rxjs";
import _ from "lodash";
import { map } from "../map.js";
import { mergeAll } from "../mergeAll.js";
import { makeStoreWithExtra } from "../redux/store.js";

test("create and merge higher order observable", (done) => {
  of(0, 1, 2)
    .pipe(
      map(
        (_) =>
          new Observable((subscriber) => {
            subscriber.next(5);
            subscriber.next(10);
            subscriber.complete();
          }),
      ),
      mergeAll({ concurrentLimit: Infinity }),
    )
    .subscribe({
      complete: (store) => {
        const intetegerEmmissionEvents = store.debug.events.filter(
          (event) =>
            event.effect.type == "EMIT" &&
            Number.isInteger(event.effect.emittedValue),
        );
        expect(
          intetegerEmmissionEvents.map((event) => event.effect.emittedValue),
        ).toMatchObject([5, 10, 5, 10, 5, 10]);
        done();
      },
    });
});
