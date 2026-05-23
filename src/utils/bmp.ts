export function canvasToBMP(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const pixels = imageData.data;

  const rowBytes = w * 3;
  const rowPadded = (rowBytes + 3) & ~3;
  const dataSize = rowPadded * h;
  const fileSize = 54 + dataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4D);
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, 54, true);

  view.setUint32(14, 40, true);
  view.setInt32(18, w, true);
  view.setInt32(22, h, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(30, 0, true);
  view.setUint32(34, dataSize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  const u8 = new Uint8Array(buffer);

  for (let y = 0; y < h; y++) {
    const srcRow = (h - 1 - y) * w * 4;
    const dstRow = 54 + y * rowPadded;

    for (let x = 0; x < w; x++) {
      const si = srcRow + x * 4;
      const di = dstRow + x * 3;
      u8[di] = pixels[si + 2];
      u8[di + 1] = pixels[si + 1];
      u8[di + 2] = pixels[si];
    }

    for (let p = rowBytes; p < rowPadded; p++) {
      u8[dstRow + p] = 0;
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}
