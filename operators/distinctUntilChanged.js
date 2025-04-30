import { scan } from "./scan.js";
import { map } from "./map.js";
import { filter } from "./filter.js";

export function distinctUntilChanged() {
  return function (source) {
    return source.pipe(
      scan((acc, curr) => ({ current: curr, previous: acc.current }), {
        current: undefined,
        previous: undefined,
      }),
      filter((pair) => pair.current !== pair.previous),
      map((pair) => pair.current)
    );
  };
}
