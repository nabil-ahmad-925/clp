import type { NextConfig } from 'next';

// `STATIC_EXPORT=1 next build` writes a fully static site to out/ (for S3 + CloudFront, see
// scripts/deploy-aws.sh). A static export can't run redirects, so there they live in the CloudFront Function
// (scripts/aws/cloudfront-function.js) instead.
const staticExport = process.env.STATIC_EXPORT === '1';

// The original site's 301 redirects for pages that moved (keep in sync with scripts/aws/cloudfront-function.js).
export const siteRedirects = [
  ['/event-project-management/', '/services/event-project-management-services/'],
  ['/event-project-management/inquiry/', '/brand-product-development/inquiry/'],
  ['/event-project-management/articles/', '/brand-product-development/articles/'],
  ['/event-project-management/photos/', '/experiences/baseball/photos/'],
];

const nextConfig: NextConfig = {
  ...(staticExport ? { output: 'export' } : {}),
  // Keep the same URLs as the WordPress site (e.g. /about-us/).
  trailingSlash: true,
  images: {
    // Images are served directly from competelikepros.com. Its Cloudflare protection rejects
    // server-side fetches, so Next's image optimizer can't proxy them — the browser loads them as-is.
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: 'competelikepros.com', pathname: '/wp-content/uploads/**' }],
  },
  ...(staticExport
    ? {}
    : {
        async redirects() {
          return siteRedirects.map(([source, destination]) => ({ source, destination, statusCode: 301 as const }));
        },
      }),
};

export default nextConfig;
