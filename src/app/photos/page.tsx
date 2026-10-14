import type { Metadata } from 'next';
import { Suspense } from 'react';
import PhotoLink from '@/components/photos/PhotoLink';

// The links the admin shares: /photos/?album=<id> (an album) and /photos/?code=<code> (a private album's code). They
// open the album on its sport's photo page (a static export knows the album only in the browser). /photos/?signin=1
// (the photo login's invitation e-mail) signs in and lists the families-only albums and client galleries it can see.
export const metadata: Metadata = {
  title: { absolute: 'Photos - Compete Like Pros™' },
  robots: { index: false },
};

export default function PhotoLinkPage() {
  return (
    <Suspense>
      <PhotoLink />
    </Suspense>
  );
}
