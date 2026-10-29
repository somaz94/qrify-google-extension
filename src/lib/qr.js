/** Light modules a scanner needs around the code (ISO/IEC 18004). */
export const QUIET_MODULES = 4;

/**
 * Rows of modules for `text`, `true` where dark, at the highest error correction, or `null` when the text is
 * too long for any QR code. `qrcode` is the vendored qrcode-generator.
 */
export function encode(text, qrcode) {
  const code = qrcode(0, 'H');
  // The generator takes one character per byte; TextEncoder gives the UTF-8 bytes, surrogate pairs included.
  code.addData(String.fromCharCode(...new TextEncoder().encode(text)), 'Byte');
  try {
    code.make();
  } catch (error) {
    if (String(error).includes('code length overflow')) return null;
    throw error;
  }
  const count = code.getModuleCount();
  return Array.from({ length: count }, (_, row) => Array.from({ length: count }, (_, column) => code.isDark(row, column)));
}

/** Whole-pixel modules for a code about `size` px wide, so edges stay sharp, and the canvas size with the margin. */
export function layout(size, count) {
  const module = Math.max(1, Math.floor(size / count));
  const margin = module * QUIET_MODULES;
  return { module, margin, total: module * count + 2 * margin };
}

/** Paints `modules` on a canvas 2D `context` that is `box.total` px square. */
export function paint(context, modules, box, { dark, light }) {
  context.fillStyle = light;
  context.fillRect(0, 0, box.total, box.total);
  context.fillStyle = dark;
  modules.forEach((row, y) => row.forEach((isDark, x) => {
    if (isDark) context.fillRect(box.margin + x * box.module, box.margin + y * box.module, box.module, box.module);
  }));
}
