import { makeStoreWithExtra } from "./redux/store.js";

const storeWithExtra = makeStoreWithExtra();
export const getState = storeWithExtra.getState;
export const dispatch = storeWithExtra.dispatch;

globalThis.getStateForDebugging = () => ({
    ...getState(),
    debug: storeWithExtra.debug,
});
