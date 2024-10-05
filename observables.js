export const from =
  (array) =>
  ({ next, complete }) => {
    array.forEach((value) => next(value));

    complete();
  };
