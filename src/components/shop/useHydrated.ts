'use client';

import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/** True once the page runs in the browser (false on the server's paint and the first hydration pass). */
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);
