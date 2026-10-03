export type Lang = 'en' | 'es';

// Module-level locale used by format.ts (number formatting
// follows the active UI language).
let current: Lang = 'en';

export function setLocale(l: Lang): void {
  current = l;
}

export function getLocale(): Lang {
  return current;
}
