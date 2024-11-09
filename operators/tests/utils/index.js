import _ from "lodash";

export function cleanState(programState) {
  //hack for compaitbilty
  const state =
    Object.keys(programState).length === 1 && !programState.isCompleted
      ? Object.values(programState)[0]
      : programState;

  return _.cloneDeepWith(state, (value) => {
    if (_.isFunction(value)) {
      return "[Function]";
    }
  });
}
