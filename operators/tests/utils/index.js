import _ from "lodash";
import { isObservable } from "rxjs";

export function cleanState(programState) {
  //hack for compatibility
  const state =
    Object.keys(programState).length === 1 && !programState.isCompleted
      ? Object.values(programState)[0]
      : programState;

  return _.cloneDeepWith(state, (value) => {
    if (isObservable(value)) {
      return value.toJSON();
    }
    if (_.isFunction(value)) {
      return "[Function]";
    }
  });
}

/**
 * Converts test output into a clean marble diagram string.
 * @param {Array} testOutput - The array of test output objects.
 * @returns {string} - The cleaned marble diagram string.
 */
export function cleanMarbles(testOutput) {
  return testOutput
    .map((frame, i) => {
      const newValue =
        frame.notification.kind === "C" ? "|" : frame.notification.value;
      return {
        frameNumber: frame.frame,
        kind: frame.notification.kind,
        value: newValue,
        error: frame.error,
      };
    })
    .reduce(joinSimultaneousFrames, [])
    .map((frame, i, allFramesList) =>
      frame.value.length > 1 ? { ...frame, value: `(${frame.value})` } : frame,
    )
    .map((frame, i, allFramesList) => {
      const padding = "-".repeat(
        i === 0
          ? frame.frameNumber
          : frame.frameNumber - allFramesList[i - 1].frameNumber - 1,
      );
      return padding + frame.value;
    })

    .join("");
}

function joinSimultaneousFrames(joinedSameFramesList, frame, i, allFramesList) {
  const previousFrameNumber = allFramesList[i - 1]?.frameNumber;
  if (frame.frameNumber === previousFrameNumber) {
    const previousFrame = allFramesList[i - 1];
    return joinedSameFramesList.slice(0, -1).concat({
      ...joinedSameFramesList.at(-1),
      kind: joinedSameFramesList.at(-1).kind + frame.kind,
      value: joinedSameFramesList.at(-1).value + frame.value,
    });
  }
  return joinedSameFramesList.concat(frame);
}
