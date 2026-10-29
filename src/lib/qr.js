/** Options for the vendored `QRCode` constructor; `correctLevels` is its `QRCode.CorrectLevel`. */
export function qrOptions({ text, size, dark, light }, correctLevels) {
  const pixels = Number.parseInt(size, 10);
  return { text, width: pixels, height: pixels, colorDark: dark, colorLight: light, correctLevel: correctLevels.H };
}

/** Light modules a scanner needs around the code (ISO/IEC 18004). */
export const QUIET_MODULES = 4;

/** Pixels of margin on each side of a `size` px code that is `modules` modules wide. */
export const quietZone = (size, modules) => Math.ceil((size / modules) * QUIET_MODULES);
