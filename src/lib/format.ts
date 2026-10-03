const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '-': '⁻',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

function toSuperscript(n: number): string {
  return String(n)
    .split('')
    .map((c) => SUPERSCRIPT_DIGITS[c] ?? c)
    .join('');
}

/** "3.30 × 10²³ kg" */
export function formatScientific(value: number, exponent: number, unit: string): string {
  return `${value.toFixed(2)} × 10${toSuperscript(exponent)} ${unit}`;
}

/** Exposes superscript conversion for inline table formatting. */
export { toSuperscript };

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDistance(km: number): string {
  return `${formatNumber(km)} km`;
}

const AU_KM = 149_597_870.7;

/** "5.20 AU" — for orbital distances. */
export function formatAu(km: number): string {
  return `${(km / AU_KM).toFixed(2)} AU`;
}

/** "288 K (−15 °C)" — the API returns Kelvin. */
export function formatTemp(kelvin: number): string {
  const celsius = kelvin - 273.15;
  return `${formatNumber(kelvin)} K (${formatNumber(Math.round(celsius))} °C)`;
}

/** "9.93 h" or "243.0 days (retrograde)". */
export function formatRotation(hours: number): string {
  const retro = hours < 0;
  const abs = Math.abs(hours);
  const main = abs >= 48 ? `${(abs / 24).toFixed(1)} days` : `${abs.toFixed(2)} h`;
  return retro ? `${main} (retrograde)` : main;
}

/** "87.97 days" or "4,332.59 days (11.9 yr)". */
export function formatPeriod(days: number): string {
  if (days >= 730) {
    return `${formatNumber(days, 2)} days (${(days / 365.25).toFixed(1)} yr)`;
  }
  return `${formatNumber(days, 2)} days`;
}

export function formatAngle(deg: number): string {
  return `${deg.toFixed(2)}°`;
}

/** Compact temperature for table cells: "-15 °C". */
export function formatTempShort(kelvin: number): string {
  return `${formatNumber(Math.round(kelvin - 273.15))} °C`;
}
