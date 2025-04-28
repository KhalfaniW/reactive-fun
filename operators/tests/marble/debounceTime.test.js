import { TestScheduler } from "rxjs/testing";
import { of, interval } from "rxjs";
import { debounceTime } from "../../debounceTime.js";
import { makeStoreWithExtra } from "../../redux/store.js";

import { cleanMarbles } from "../utils/index.js";

describe("my version of debounceTime", () => {
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

  it("should emit immediately after debounce period if no new values arrive", () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const source = hot("--a-----------|");
      const actual = source.pipe(debounceTime(3));
      const expected = "  -----a--------|";

      expectObservable(actual).toBe(expected);
    });
  });
  it.only("should debounce multiple rapid emissions", () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const source = hot("--abcd---e----|");
      const actual = source.pipe(debounceTime(3));
      const expected = "  --------d---e-|"; 

      expectObservable(actual).toBe(expected);
    });
  });
  it.skip("should debounce values and emit the most recent after the specified delay", () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const source = hot("--a--b----c-|");
      const actual = source.pipe(debounceTime(5));
      const expected = "  ------------(c|)";

      expectObservable(actual).toBe(expected);
    });
  });
});
