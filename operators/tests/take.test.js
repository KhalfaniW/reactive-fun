import { cleanState } from "./utils/index.js";
import { Observable } from "rxjs";
import _ from "lodash";
import { jest } from "@jest/globals";
import { take } from "../take.js";

test("take 2 items", (done) => {
  const obs = new Observable((subscriber) => {
    subscriber.next(10);
    subscriber.next(20);
    subscriber.next(30);
    subscriber.next(40);

    subscriber.complete();
  });

  const nextMock = jest.fn();

  obs.pipe(take(2)).subscribe({
    next: nextMock,
    complete: (store) => {
      expect(nextMock).toHaveBeenCalledTimes(2);
      expect(nextMock).toHaveBeenCalledWith(10);
      expect(nextMock).toHaveBeenCalledWith(20);
    },
  });
  setTimeout(() => {
    done();
  }, 4);
});

test("take immediate exit", (done) => {
  const obs = new Observable((subscriber) => {
    subscriber.next(10);
    subscriber.next(20);
    subscriber.next(30);
    subscriber.next(40);
    subscriber.complete();
  });

  const nextMock = jest.fn();

  obs.pipe(take(0)).subscribe({
    next: nextMock,
    complete: (store) => {
      expect(nextMock).toHaveBeenCalledTimes(0);
    },
  });
  setTimeout(() => {
    done();
  }, 4);
});
