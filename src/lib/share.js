/** Whether the browser can share a PNG file; Chrome on Linux, for one, cannot. */
export function canShareImage(nav = globalThis.navigator, FileType = globalThis.File) {
  if (!nav?.canShare || !FileType) return false;
  try {
    return nav.canShare({ files: [new FileType([], 'qrcode.png', { type: 'image/png' })] });
  } catch {
    return false;
  }
}
