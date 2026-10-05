export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
  /** Shown as an icon instead of its label (the menu's shopping-cart entry). */
  icon?: 'cart';
  children?: NavItem[];
};

export type SocialNetwork = 'instagram' | 'linkedin' | 'facebook' | 'x' | 'tiktok' | 'youtube' | 'twitter' | 'email';

export type SocialLink = { network: SocialNetwork; label: string; href: string };

export type Link = { label: string; href: string; external?: boolean };

/** Controls the header colour while it sits over a section (Salient "midnight" behaviour). */
export type HeaderTone = 'light' | 'dark';

export type Cta = { label: string; href: string; newTab?: boolean };

export type FacilityCard = {
  image: string;
  subtitle: string;
  title: string;
  excerpt: string;
  /** Shown in the full-screen bio overlay; a blank line ("\n\n") separates paragraphs. */
  bio: string;
  /** Large photo on the overlay's right half. Without one the original shows an empty grey panel. */
  bioImage?: string;
  /** Several photos for the overlay (shown as a carousel, `bioImage` being the first); listings from the admin. */
  bioImages?: string[];
  cta?: Cta;
  socials: { network?: string; href: string }[];
  /** The original wraps `bio` in <i> (shown in the display font, see globals.css). */
  bioItalic?: boolean;
  /** Rich-text bio (sanitized HTML); used instead of `bio` when present. */
  bioHtml?: string;
  /** Buttons under the bio (team-directory popups can have several, e.g. "Hire" and "contact"). */
  buttons?: Cta[];
};

/** A card in a filterable team directory: filter terms it belongs to (e.g. "boston", "youth-5-12"). */
export type DirectoryItem = FacilityCard & { id: string; tags: string[] };

/**
 * One drop-menu filter. `preset` is the option the original page selects on load (each sport page pre-selects its
 * sport); `hidden` filters still apply but are not shown (the page hides that menu after selecting it).
 */
export type DirectoryFilter = { key?: string; label: string; options: { value: string; label: string }[]; preset?: string; hidden?: boolean };

/** Grid settings of a directory widget (the plugin's per-widget CSS variables). */
export type DirectoryLayout = {
  width?: string;
  colGap?: number;
  rowGap?: number;
  /** Filter menus per row on tablets and up (the site's CSS puts some widgets' filters three to a row). */
  filterColumns?: number;
};

/** One block of a page-builder page (the original WPBakery column content). */

export type Block =
  | { type: 'divider'; height: number }
  | { type: 'text'; html: string; className?: string; /** WPBakery design options (padding/margins) of the text block. */ style?: Record<string, string> }
  | {
      type: 'team';
      widgetId?: number;
      /** Widgets loaded in pages: the first page of cards, then "Load More" adds `more` at a time. */
      paging?: { first: number; more: number };
      layout: DirectoryLayout;
      filters: DirectoryFilter[];
      items: DirectoryItem[];
    }
  | { type: 'booking'; /** An empty paragraph follows the form on some pages. */ trailingBlank?: boolean }
  | { type: 'serviceNav'; previous?: ServiceNavLink; next?: ServiceNavLink }
  | { type: 'album'; items: AlbumItem[] }
  | { type: 'faq'; items: FaqItem[]; compact?: boolean; title?: string; viewAll?: Cta }
  | { type: 'gradientTiles'; tiles: GradientTile[] }
  | { type: 'zoomProjects'; slides: { title: string; href: string; label: string }[] }
  | { type: 'demoSlider'; height: number; slides: { title: string; caption: string }[] }
  | { type: 'imageGrid'; columns?: number; /** Padding round each image, in px (15 by default). */ gutter?: number; images: GridImage[] }
  | { type: 'teamCards'; items: FacilityCard[]; gap?: number }
  | MapDirectoryBlock
  | { type: 'enquiryForm'; formId: string; submit: string; items: EnquiryItem[] }
  | { type: 'contactForm'; formId: string; submit: string; paragraphs: ContactField[][] }
  | {
      type: 'postFilter';
      /** Category buttons (with the search box); none on grids showing a single category. */
      categories: { id: string; label: string; count: number }[];
      posts: FilterPost[];
    }
  | { type: 'gallery'; id: string; name: string; breadcrumbs: { label: string; href?: string }[]; images: GalleryImage[] };

/** A post card in the category-filtered post grid (Blog Filter plugin); `categories` are category ids. */
export type FilterPost = {
  id: string;
  categories: string[];
  day: string;
  month: string;
  image: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  title: string;
  href: string;
  excerpt: string;
  comments: string;
};

/** A field of an inquiry form (Contact Form 7); every field is required. */
export type ContactField = { name: string; label: string; type: 'text' | 'email' | 'select'; autocomplete?: string; options?: string[] };

/** A field of an enquiry form (WPForms). Address fields have `parts` (line, city, state); checkboxes `choices` (HTML). */
export type EnquiryField = {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'address' | 'textarea' | 'checkbox';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string; placeholder?: boolean }[];
  selected?: string;
  parts?: { label: string; options?: { value: string; label: string }[] }[];
  choices?: string[];
};

/** A full-width field, or a row of side-by-side columns (widths in %). */
export type EnquiryItem = EnquiryField | { kind: 'row'; columns: { width: number; fields: EnquiryField[] }[] };

/** A location in a map directory (WP Google Map Pro). */
export type MapPlace = {
  id: string;
  title: string;
  address: string;
  content: string;
  lat: number;
  lng: number;
  city: string;
  zoom: number;
  categories: string[];
  categoryIds: string[];
  image?: string;
  learnMore: string;
  extra: Record<string, string>;
};

/** Map + filterable location listing. `skin` "image" shows photo and a Learn More button; "text" prints the link. */
export type MapDirectoryBlock = {
  type: 'mapDirectory';
  center: { lat: number; lng: number };
  zoom: number;
  height: number;
  /** Google Maps style JSON of the original map. */
  styles: string;
  skin: 'image' | 'text';
  perPage: number;
  categories: { id: string; name: string }[];
  filters: { key: string; label: string; options: { value: string; label: string }[] }[];
  radius: { label: string; options: number[]; unit: string };
  markerIcon: string;
  places: MapPlace[];
};

/** A gold tile with a heading and button; `to` is the colour its gradient fades to. */
export type GradientTile = { title: string; fontSize: number; button: Cta; to: string };

/** A thumbnail of an image-grid gallery; `full` is the photo its lightbox shows. */
export type GridImage = { src: string; full: string; alt: string; width: number; height: number };

/** A gallery card in a photo album overview (NextGEN compact album). */
export type AlbumItem = { title: string; href: string; image: string; count: number };

/** One photo of a gallery: `src` is the 400px-high mosaic version, `thumb` the lightbox strip thumbnail. */
/** `download`: price of the photo's HD digital download, when the original sells one. */
export type GalleryImage = { id: string; src: string; full: string; thumb: string; width: number; height: number; title: string; alt: string; download?: number };

export type BuilderRow = {
  id?: string;
  paddingTop?: string;
  paddingBottom?: string;
  fullWidth?: boolean;
  background?: string;
  /** "light" = white text (rows on a dark or gold background). */
  tone?: 'light';
  /** Full-width section with contained content: no gap below it. */
  flush?: boolean;
  /** Left/right padding of a full-width row (e.g. "10%"). */
  paddingSides?: string;
  /** `centered`: the column centres its text. */
  columns: { width?: string; centered?: boolean; blocks: Block[] }[];
};

/** A page rebuilt from the original page-builder layout: title header + rows of blocks. */
export type BuilderPage = {
  path: string;
  meta: { title: string; description: string };
  hero: PageHeroData | null;
  /** Without a hero: extra space below the solid header before the first row (Salient's 40px top padding). */
  topSpacing?: number;
  rows: BuilderRow[];
  /** Portfolio pages: the gold "Previous / Next Partnership" links under the content. */
  portfolioNav?: PortfolioNavLink[];
};

export type PortfolioNavLink = { kind: 'previous' | 'next'; label: string; title: string[]; href: string };

export type Tile = { title: string; image: string; width: number; height: number; href: string; newTab?: boolean };

/** `answer` is plain text; `html` is sanitized rich text (paragraphs, lists, links) from the original site. */
export type FaqItem = { question: string; answer?: string; html?: string };

/** `italic`: the original wraps each answer in <i> (shown in the display font, see globals.css). */
export type FaqData = { title?: string; items: FaqItem[]; viewAll?: Cta; italic?: boolean };

export type LegalPage = {
  slug: string;
  meta: { title: string; description: string };
  hero: PageHeroData;
  statement: string;
  /** Sanitized HTML intro paragraph(s). */
  intro: string;
  sections: { title: string; html: string }[];
};

export type SportPage = {
  section: 'experiences' | 'resources';
  slug: string;
  meta: { title: string; description: string };
  hero: { title: string[]; backgroundImage: string; backgroundColor: string };
  quotes: { text: string; author: string }[];
  features: { title: string; text: string; image: string; cta: Cta }[];
  facilities: { title: string; items: FacilityCard[]; viewAll?: Cta };
  updates: { title: string; tiles: Tile[] };
  faq: FaqData;
};

export type Post = { title: string; href: string; image: string; alt: string; date?: string };

export type PostSectionData = {
  title: string;
  /** "carousel" = sliding row of cards with dates; "masonry" = three cards, the middle one wide. */
  layout: 'carousel' | 'masonry';
  /** Top/bottom padding in vw, as set on the original rows. */
  spacing: { top: number; bottom: number };
  posts: Post[];
  viewAll: Cta;
};

export type ServicePage = {
  slug: string;
  meta: { title: string; description: string };
  hero: PageHeroData;
  /** Large statement on the gold band under the hero. */
  intro: string;
  /** `italic`: the original sets this paragraph in italics. */
  support: { title: string; text: string; italic?: boolean };
  services: { items: FacilityCard[]; viewAll?: Cta };
  recent: { title: string; tiles: Tile[] };
  faq: FaqData;
};

export type PageHeroData = {
  /** Lines of the H1; rendered with <br /> between them. */
  title: string[];
  /** Optional line under the title, with an optional smaller second line. */
  subtitle?: { text: string; small?: string };
  /** "fullscreen" = full viewport height; otherwise a fixed pixel height. */
  height: 'fullscreen' | number;
  backgroundColor: string;
  backgroundImage?: string;
  video?: string;
  /** Home hero rotates the heading in; others are static. */
  textEffect?: 'rotate-in';
  /** Solid-header pages (no transparent hero). */
  headerTone?: HeaderTone;
  /** Round "scroll down" button at the bottom of the hero. */
  scrollArrow?: boolean;
  /** Colour laid over the background photo (blog posts and archives darken it). */
  overlay?: string;
  /** Narrower title column (blog posts cap it at 1000px). */
  titleMaxWidth?: number;
  /** Blog-post meta line under the title (author, date, comments, reading time). */
  meta?: { label: string; href?: string; prefix?: string }[];
};

export type ServiceNavLink = { label: string; title: string[]; href: string };

/** A /services/<slug>/ page: dark title header, four service cards (with full-screen details) and previous/next links. */
export type ServiceDetailPage = {
  slug: string;
  meta: { title: string; description: string };
  title: string[];
  cards: FacilityCard[];
  previous?: ServiceNavLink;
  next?: ServiceNavLink;
};

/** A post card (title, link, photo, author, date) as shown in post grids. */
export type PostCard = { title: string; href: string; image: string; author?: string; date?: string };

export type PostNavLink = { label: string; title: string; href: string; image?: string };

/** A blog post (WordPress single post). */
export type BlogPost = {
  path: string;
  meta: { title: string; description: string };
  hero: {
    title: string;
    image?: string;
    categories: Link[];
    author: { name: string; href: string };
    date: string;
    comments: { label: string; href: string };
    readingTime: string;
  };
  /** Sanitized article HTML. */
  html: string;
  next?: PostNavLink;
  previous?: PostNavLink;
  related: { title: string; posts: PostCard[] };
};
