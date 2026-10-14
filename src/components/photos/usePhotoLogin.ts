'use client';

import { useSyncExternalStore } from 'react';
import { loginEmail, onLoginChange } from '@/content/albums';

/** The signed-in photo login's e-mail (null when signed out, and while the page is built). */
export default function usePhotoLogin() {
  return useSyncExternalStore(onLoginChange, loginEmail, () => null);
}
