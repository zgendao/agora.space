import { writable, derived } from "svelte/store";

/**
 * Same as derived, but has a triggerUpdate function
 * that we can call manually to run it's setter function
 *
 * @param stores - input stores
 * @param fn - the first prop is an array so you need to destruct it
 * @param initialValue - before the function gets called
 */
export const triggerableDerived = (stores, fn, initialValue) =>
  (() => {
    if (!Array.isArray(stores)) stores = [stores];

    // helper store that we can update manually which the real store derives from
    const shouldUpdate = writable(0);

    const { subscribe } = derived(
      [...stores, shouldUpdate],
      (storeVals, set) => fn(storeVals, set),
      initialValue
    );

    return {
      subscribe,
      triggerUpdate: () => {
        shouldUpdate.set(Math.random());
      },
    };
  })();
