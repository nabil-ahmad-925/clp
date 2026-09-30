import { Lato, Montserrat, Open_Sans, Oswald, Playfair_Display, Poppins, Roboto } from 'next/font/google';

export const openSans = Open_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-open-sans',
  display: 'swap',
});

// The original site loads Montserrat 700 and Playfair 400/700/900 only; matching that keeps weights identical.
export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const oswald = Oswald({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-oswald',
  display: 'swap',
});

export const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

export const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  style: ['normal', 'italic'],
  variable: '--font-roboto',
  display: 'swap',
});

// The photo lightbox (NextGEN Pro Lightbox) sets its captions and cart in Lato.
export const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
  display: 'swap',
});

// The "Book a Session" form (BookingPress) is set in Poppins.
export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
});

export const fontVariables = [openSans, montserrat, oswald, playfair, roboto, lato, poppins].map((f) => f.variable).join(' ');
