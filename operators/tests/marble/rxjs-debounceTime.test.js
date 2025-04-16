import { TestScheduler } from "rxjs/testing";
import { of, interval } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { mergeAll } from "../../mergeAll.js";
import { makeStoreWithExtra } from "../../redux/store.js";

import { cleanMarbles } from "../utils/index.js";

describe("RxJS Jest Tests for Debounce", () => {
  let testScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      try {
        expect(actual).toEqual(expected);
      } catch (error) {
        throw new Error(`
 expected ${cleanMarbles(expected)}
 received ${cleanMarbles(actual)}
`);
      }
    });
  });

  it("should debounce values and emit the most recent after the specified delay", () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const source = hot("--a--b----c-|");
      const actual = source.pipe(debounceTime(5));
      const expected = "------------(c|)";

      expectObservable(actual).toBe(expected);
    });
  });

  it("should emit immediately after debounce period if no new values arrive", () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const source = hot("--a-----------|");
      const actual = source.pipe(debounceTime(3));
      const expected = "-----a--------|";

      expectObservable(actual).toBe(expected);
    });
  });

  it("should debounce multiple rapid emissions", () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const source = hot("--abcd---e----|");
      const actual = source.pipe(debounceTime(3));
      const expected = "--------d---e-|";

      expectObservable(actual).toBe(expected);
    });
  });
});

describe.skip("debounce operator", () => {
  let testScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      try {
        expect(actual).toEqual(expected);
      } catch (error) {
        throw new Error(`
 expected ${cleanMarbles(expected)}
 received ${cleanMarbles(actual)}
`);
      }
    });
  });

  it("should concat inner observables", () => {
    const storeWithExtra = makeStoreWithExtra();
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const innerObs1 = cold("--a--b--c|");
      const innerObs2 = cold("--1--2--3|");
      const innerObs3 = cold("--x--y--z|");

      const source$ = hot("---x---y---z---|", {
        x: innerObs1,
        y: innerObs2,
        z: innerObs3,
      });

      const result$ = source$.pipe(
        mergeAll({ concurrentLimit: 1 }, { ...storeWithExtra })
      );

      const expectedMarble = "-----a--b--c--1--2--3--x--y--z|";
      const expectedValues = {
        a: "a",
        b: "b",
        c: "c",
        1: "1",
        2: "2",
        3: "3",
        x: "x",
        y: "y",
        z: "z",
      };
      expectObservable(result$).toBe(expectedMarble, expectedValues);
    });
  });

  it("should merge inner observables simultaneously", () => {
    const storeWithExtra = makeStoreWithExtra();
    testScheduler.run(({ cold, hot, expectObservable }) => {
      const innerObs1 = cold("--a--b--c|");
      const innerObs2 = cold("--1--2--3|");
      const innerObs3 = cold("--x--y--z|");

      const source$ = hot("---x---y---z---|", {
        x: innerObs1,
        y: innerObs2,
        z: innerObs3,
      });

      const result$ = source$.pipe(
        mergeAll({ concurrentLimit: 10 }, { ...storeWithExtra })
      );

      const expectedMarble = "-----a--b1-c2x-3y--z|";
      const expectedValues = {
        a: "a",
        b: "b",
        c: "c",
        1: "1",
        2: "2",
        3: "3",
        x: "x",
        y: "y",
        z: "z",
      };
      expectObservable(result$).toBe(expectedMarble, expectedValues);
      // Expect the output to match the expected marble
    });

    //  '-----a--b1-c2x-3y--z|'
  });
});
