/**
 * StayNest brand assets.
 *
 * The primary files are served from managed webdev storage. The inline SVG
 * fallbacks guarantee that a transient storage or CDN failure never renders a
 * broken-image placeholder in the application shell.
 */
export const STAYNEST_WORDMARK_SRC = "/manus-storage/staynest-wordmark_f8455850.png";
export const STAYNEST_EMBLEM_SRC = "/manus-storage/staynest-square_3ac24101.png";
export const STAYNEST_LOGO_ALT = "StayNest";

const svgDataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const STAYNEST_WORDMARK_FALLBACK_SRC = svgDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="420" height="120" viewBox="0 0 420 120">
    <rect width="420" height="120" rx="18" fill="#ffffff"/>
    <g fill="none" stroke-linecap="round" stroke-width="7">
      <path d="M22 67c18-28 38-28 56 0" stroke="#73344a"/>
      <path d="M29 54c14-20 28-20 42 0" stroke="#b78836"/>
      <path d="M39 42c8-11 14-11 22 0" stroke="#73344a"/>
    </g>
    <text x="100" y="78" fill="#73344a" font-family="Georgia,serif" font-size="48">Stay</text>
    <text x="206" y="78" fill="#b78836" font-family="Georgia,serif" font-size="48">Nest</text>
  </svg>
`);

export const STAYNEST_EMBLEM_FALLBACK_SRC = svgDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="24" fill="#ffffff"/>
    <g fill="none" stroke-linecap="round" stroke-width="8">
      <path d="M20 74c24-36 56-36 80 0" stroke="#73344a"/>
      <path d="M32 57c16-23 40-23 56 0" stroke="#b78836"/>
      <path d="M48 42c8-11 16-11 24 0" stroke="#73344a"/>
    </g>
  </svg>
`);
