import type { Metadata } from 'next';
import { Suspense } from 'react';
import PhotoLink from '@/components/photos/PhotoLink';

// Find your game photos (every sport's albums, an album code). The links the admin shares: /photos/?album=<id> (an
// album) and /photos/?code=<code> (a private album's code). They open the album on its sport's photo page (a static
// export knows the album only in the browser). /photos/?signin=1 (the photo login's invitation e-mail) signs in and
// lists the families-only albums and client galleries it can see.
export const metadata: Metadata = {
  title: { absolute: 'Find Your Game Photos - Compete Like Pros™' },
  description: 'Download your game photos or put them on canvas, metal, frames, mugs and tees, printed in the USA and shipped to your door.',
  alternates: { canonical: '/photos/' },
};

export default function PhotoLinkPage() {
  return (
    <Suspense>
      <PhotoLink />
    </Suspense>
  );
}
