import { mergeAll } from "./mergeAll";
import { map } from "./map";

export function mergeMap(observableMapFn) {
  return (source$) => {
    return source$.pipe(map(observableMapFn), mergeAll());
  };
}
