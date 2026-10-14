/**
 * Real photography used across the site (Unsplash — free for commercial use,
 * no attribution required: https://unsplash.com/license). Each entry is the
 * photo's stable CDN id; width/quality are added per use so every <img> can
 * request the right size for its layout instead of shipping one huge file.
 */
export const STOCK_PHOTOS = {
  heroTaxiNight: 'https://images.unsplash.com/photo-1761227783777-d7eff1c85b2c',
  fleetSedan: 'https://images.unsplash.com/photo-1573710459621-bb101783ca0f',
  fleetSuv: 'https://images.unsplash.com/photo-1642274727246-b16d384df55a',
  airportTerminal: 'https://images.unsplash.com/photo-1757206637740-04a87ed75905',
};

/** Appends Unsplash's imgix-style sizing params to a base photo URL. */
export function photoUrl(base, { w = 1600, q = 75 } = {}) {
  return `${base}?auto=format&fit=crop&w=${w}&q=${q}`;
}

/** A ready-to-use srcSet string across common breakpoints, for crisp images at every size. */
export function photoSrcSet(base, widths = [480, 768, 1080, 1600, 2000]) {
  return widths.map((w) => `${photoUrl(base, { w })} ${w}w`).join(', ');
}

const isUnsplash = (url) => typeof url === 'string' && url.startsWith('https://images.unsplash.com/');

/**
 * Safe img props for ANY stored image URL — our known Unsplash photos get full
 * responsive sizing query params; an admin's own upload (data: URL) or a
 * pasted external link is used exactly as given, untouched.
 */
export function smartImageProps(url, { w = 1600 } = {}) {
  if (isUnsplash(url)) return { src: photoUrl(url, { w }), srcSet: photoSrcSet(url) };
  return { src: url, srcSet: undefined };
}
