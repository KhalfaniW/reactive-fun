import { Observable, timer } from "rxjs";
import { createOperator } from "./createOperator.js";

import { switchAll } from "./switchAll";
import { map } from "./map";

export function debounceTime(delayTime) {
  return (source$) => {
    return source$.pipe(
      map((value) => timer(delayTime).pipe(map(() => value))),
      switchAll(),
    );
  };
}
 
