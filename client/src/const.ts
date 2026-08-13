export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const STAYNEST_LOGO_URL = "/brand/wordmark.png";
export const STAYNEST_EMBLEM_URL = "/brand/emblem.png";
export const STAYNEST_LOGO_ALT = "StayNest";

let openAuthModalFn: (() => void) | null = null;

export const registerAuthModalOpener = (fn: () => void) => {
  openAuthModalFn = fn;
};

export const startLogin = () => {
  if (openAuthModalFn) {
    openAuthModalFn();
  } else {
    window.location.href = "/account";
  }
};
