import { Observable, timer } from "rxjs";
import { createOperator } from "./createOperator.js";
import { mergeMap } from "./mergeMap";
import { map } from "./map";


export function delayTime(delayTime) {
  return (source$) => {
    return source$.pipe(
      mergeMap((value) => timer(delayTime).pipe(map(() => value))),
    );
  };
}


