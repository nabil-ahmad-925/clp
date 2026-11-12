import type { Metadata } from 'next';
import { Suspense } from 'react';
import UploadPage from '@/components/upload/UploadPage';

// An order's upload link (/upload/?id=…&k=…): the client's designer, or the client from a reminder, no account. A static
// export knows the order only in the browser; it's private, so search engines never list it.
export const metadata: Metadata = {
  title: { absolute: 'Send the Files - Compete Like Pros™' },
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense>
      <UploadPage />
    </Suspense>
  );
}
