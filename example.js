import { pipe, flow, filter, map, delay } from "./functions.js";

const observableSimple = ({ next, complete }) => {
  next(1);
  next(2);
  setTimeout(() => {
    next(3);
    complete();
  }, 1000);
};

let continuations = [];

const pipedFuncton = pipe(
  [
    map((state) => `${state} mapped`),
    (state, next) => {
      console.log("state", state);
      next(state);
    },
  ],
  (newState) => {},
);

observableSimple({
  next: pipedFuncton,
  complete: () => {
    console.log("completed");
  },
});
