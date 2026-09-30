import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep the same URLs as the WordPress site (e.g. /about-us/).
  trailingSlash: true,
  images: {
    // Images are served directly from competelikepros.com. Its Cloudflare protection rejects
    // server-side fetches, so Next's image optimizer can't proxy them — the browser loads them as-is.
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: 'competelikepros.com', pathname: '/wp-content/uploads/**' }],
  },
  // The original site's 301 redirects for pages that moved.
  async redirects() {
    return [
      ['/event-project-management/', '/services/event-project-management-services/'],
      ['/event-project-management/inquiry/', '/brand-product-development/inquiry/'],
      ['/event-project-management/articles/', '/brand-product-development/articles/'],
      ['/event-project-management/photos/', '/experiences/baseball/photos/'],
    ].map(([source, destination]) => ({ source, destination, statusCode: 301 }));
  },
};

export default nextConfig;
