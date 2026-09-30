# Compete Like Pros™ — Next.js

A Next.js rebuild of [competelikepros.com](https://competelikepros.com) (originally WordPress + the Salient theme).
Pure Next.js: React components, CSS Modules, typed content files. No WordPress, theme or plugin code.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (all pages are pre-rendered as static HTML)
npm start
```

Requires Node 20+.

## Pages

| URL | Source |
| --- | --- |
| `/` | `src/app/page.tsx` + `src/content/home.ts` |
| `/experiences/`, `/experiences/<sport>/` | `src/app/experiences/` + `src/content/experiences.ts`, `sports.ts` |
| `/resources/`, `/resources/<sport>/` | `src/app/resources/` + `src/content/sports.ts` |
| 7 service pages (e.g. `/brand-product-development/`) | `src/app/[slug]/` + `src/content/services.ts` |
| 4 policy pages (e.g. `/terms-conditions/`) | `src/app/[slug]/` + `src/content/legal.ts` |
| `/about-us/`, `/partnerships/`, `/our-expectations/`, `/updates/` | own folders in `src/app/` + matching file in `src/content/` |

URLs keep WordPress's trailing slash (`trailingSlash: true`) so existing links and SEO carry over.
Links to pages that are not part of this build (blog posts, booking pages, partner profiles, …) point to the live site.

## Structure

```
src/
  app/                 routes, root layout, fonts, sitemap/robots, 404
  components/
    layout/            SiteHeader, FullscreenMenu, SiteFooter, BackToTop
    sections/          PageHero, FeatureRow, FacilityCards + BioModal, Faq, QuoteSlider,
                       TestimonialSlider, TileCarousel, PostSection, PartnerCarousel, …
    pages/             page templates shared by many routes (sport / service / legal)
    home/, about/      sections used by a single page
    ui/                Button, Section/Container, Reveal (scroll animation), SplitHeading, RichText, …
  content/             all text, links and image URLs as typed data (edit content here)
  styles/globals.css   design tokens (colours, fonts, container) + base typography
```

Sliders use [Embla Carousel](https://www.embla-carousel.com/); icons come from `react-icons`; fonts load through `next/font`.
Colours, sizes, spacing, breakpoints and animation timings were measured from the original site's CSS.

## Images

Every image/video path lives in `src/content/*` as `upload('/2024/03/file.png')` (its path inside WordPress's
`wp-content/uploads`). `upload()` (in `src/content/site.ts`) serves the file from `public/uploads/` when it is
there, and from `https://competelikepros.com/wp-content/uploads/…` otherwise.

- `public/uploads/` holds all images the site uses, in the same `2024/03`, `2025/07`, … folders WordPress uses.
- `npm run dev` / `npm run build` first run `scripts/sync-uploads.mjs`, which refreshes the list of local files
  and writes any referenced image that is missing locally to `scripts/missing-uploads.txt`.
- **After adding new images to `src/content`:** run `node scripts/fetch-uploads.mjs`. competelikepros.com's
  Cloudflare firewall rejects scripted downloads, so it fetches the originals through WordPress.com's image
  CDN (`i0.wp.com`), which serves the original pixels (metadata stripped), and checks each file's type.
- To copy media from a saved copy of the site instead: `npm run sync-uploads -- <saved folder>`.

## Content notes

Content matches the live site as last archived (May 2026), including a few places where the live site itself still
shows theme placeholder text (e.g. the "We Make Beautiful Things" heading and FAQ on `/experiences/`, and some service
card bios). The live `/resources/` page has no body content, and this build mirrors that.
Replace the placeholder text in `src/content/*` when real copy is ready.

## Environment variables

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for metadata/sitemap (default `https://competelikepros.com`) |
| `NEXT_PUBLIC_UPLOADS_URL` | Where images that aren't in `public/uploads` load from (default: the live site's uploads folder) |
