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
      return (value.toJSON());
    }
    if (_.isFunction(value)) {
      return "[Function]";
    }
  });
}
