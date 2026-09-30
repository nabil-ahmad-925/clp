// Countries for the phone-number fields (booking form, enquiry forms).

/** Phone country codes offered by the site's phone fields: [ISO code, name, dial code]. */
export const COUNTRIES: [string, string, string][] = [
  ['US', 'United States', '1'],
  ['CA', 'Canada', '1'],
  ['GB', 'United Kingdom', '44'],
  ['AU', 'Australia', '61'],
  ['MX', 'Mexico', '52'],
  ['BR', 'Brazil', '55'],
  ['DE', 'Germany', '49'],
  ['FR', 'France', '33'],
  ['ES', 'Spain', '34'],
  ['IT', 'Italy', '39'],
  ['IE', 'Ireland', '353'],
  ['NL', 'Netherlands', '31'],
  ['IN', 'India', '91'],
  ['PK', 'Pakistan', '92'],
  ['AE', 'United Arab Emirates', '971'],
  ['SA', 'Saudi Arabia', '966'],
  ['NG', 'Nigeria', '234'],
  ['ZA', 'South Africa', '27'],
  ['JP', 'Japan', '81'],
  ['KR', 'South Korea', '82'],
  ['CN', 'China', '86'],
  ['PH', 'Philippines', '63'],
  ['DO', 'Dominican Republic', '1'],
  ['PR', 'Puerto Rico', '1'],
];
/** Flag emoji for an ISO country code. */
export const flag = (code: string) => String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));
