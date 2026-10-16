import { Bebas_Neue, Graduate, Permanent_Marker, Yellowtail } from 'next/font/google';

// The design studio's text fonts beyond the site's own (Montserrat, Oswald, Playfair): Block, College, Script, Brush.
const bebas = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-bebas', display: 'swap' });
const graduate = Graduate({ subsets: ['latin'], weight: '400', variable: '--font-graduate', display: 'swap' });
const yellowtail = Yellowtail({ subsets: ['latin'], weight: '400', variable: '--font-yellowtail', display: 'swap' });
const marker = Permanent_Marker({ subsets: ['latin'], weight: '400', variable: '--font-marker', display: 'swap' });

export const studioFontVariables = [bebas, graduate, yellowtail, marker].map((f) => f.variable).join(' ');
