export const STYLE_KEY = 'qrStyle';
export const SIZES = Object.freeze(['64', '128', '256', '512']);
export const DEFAULT_STYLE = Object.freeze({ qrColor: '#000000', bgColor: '#ffffff', size: '128' });

const COLOR = /^#[0-9a-f]{6}$/i;

/** `style` with any missing or invalid field replaced by the default. */
export function validStyle(style) {
  const { qrColor, bgColor, size } = style ?? {};
  return {
    qrColor: COLOR.test(qrColor) ? qrColor : DEFAULT_STYLE.qrColor,
    bgColor: COLOR.test(bgColor) ? bgColor : DEFAULT_STYLE.bgColor,
    size: SIZES.includes(size) ? size : DEFAULT_STYLE.size,
  };
}

/** The colors and size picked last, so the popup reopens on them. */
export async function loadStyle(storage) {
  const { [STYLE_KEY]: style } = await storage.get([STYLE_KEY]);
  return validStyle(style);
}

export function saveStyle(storage, style) {
  return storage.set({ [STYLE_KEY]: validStyle(style) });
}
