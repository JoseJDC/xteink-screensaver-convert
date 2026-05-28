export type DitherAlgorithm = 'none' | 'floyd-steinberg' | 'atkinson' | 'bayer4x4' | 'bayer8x8';

const BAYER_4: readonly number[][] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const BAYER_8: readonly number[][] = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

function applyBayer(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  matrix: readonly number[][],
  levels: number
): void {
  const size = matrix.length;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    const thresholdRow = y % size;
    for (let x = 0; x < w; x++) {
      const idx = (row + x) * 4;
      const threshold = (matrix[thresholdRow][x % size] / levels) * 255;
      const val = data[idx] < threshold ? 0 : 255;
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
    }
  }
}

function applyErrorDiffusion(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  kernel: readonly (readonly [number, number, number])[]
): void {
  const copy = new Float32Array(data);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const idx = (row + x) * 4;
      const old = copy[idx];
      const newVal = old < 128 ? 0 : 255;
      const error = old - newVal;

      data[idx] = newVal;
      data[idx + 1] = newVal;
      data[idx + 2] = newVal;

      for (const [dx, dy, weight] of kernel) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const nidx = (ny * w + nx) * 4;
          copy[nidx] += error * weight;
        }
      }
    }
  }
}

const FLOYD_STEINBERG: readonly (readonly [number, number, number])[] = [
  [1, 0, 7 / 16],
  [-1, 1, 3 / 16],
  [0, 1, 5 / 16],
  [1, 1, 1 / 16],
];

const ATKINSON: readonly (readonly [number, number, number])[] = [
  [1, 0, 1 / 8],
  [2, 0, 1 / 8],
  [-1, 1, 1 / 8],
  [0, 1, 1 / 8],
  [1, 1, 1 / 8],
  [0, 2, 1 / 8],
];

export function applyDither(
  imageData: ImageData,
  algorithm: DitherAlgorithm
): ImageData {
  if (algorithm === 'none') return imageData;

  const { data, width, height } = imageData;

  if (algorithm === 'bayer4x4') {
    applyBayer(data, width, height, BAYER_4, 17);
  } else if (algorithm === 'bayer8x8') {
    applyBayer(data, width, height, BAYER_8, 65);
  } else if (algorithm === 'floyd-steinberg') {
    applyErrorDiffusion(data, width, height, FLOYD_STEINBERG);
  } else if (algorithm === 'atkinson') {
    applyErrorDiffusion(data, width, height, ATKINSON);
  }

  return imageData;
}
