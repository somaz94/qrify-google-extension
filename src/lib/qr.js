/** Options for the vendored `QRCode` constructor; `correctLevels` is its `QRCode.CorrectLevel`. */
export function qrOptions({ text, size, dark, light }, correctLevels) {
  const pixels = Number.parseInt(size, 10);
  return { text, width: pixels, height: pixels, colorDark: dark, colorLight: light, correctLevel: correctLevels.H };
}
