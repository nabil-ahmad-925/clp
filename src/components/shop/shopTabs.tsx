'use client';

import { createContext, useContext, type ReactNode } from 'react';

/** The shop's tabs (ShopView makes them), shown by each view under its heading; null where ShopView shows them on top. */
export const ShopTabsContext = createContext<ReactNode>(null);

export default function ShopTabs() {
  return <>{useContext(ShopTabsContext)}</>;
}
