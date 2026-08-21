// Client-Side Pixelation and Dithering Engine for Retro Image Processing

export interface PixelateOptions {
  resolution?: number; // e.g. 48, 64, 80, 96
  palette?: 'retro16' | 'gameboy' | 'nes' | 'cyberpunk' | 'vibrant';
  dither?: boolean;
  contrast?: number; // -50 to 50
  brightness?: number; // -50 to 50
}

type RGB = [number, number, number];

const PALETTES: Record<string, RGB[]> = {
  retro16: [
    [14, 18, 26], [252, 163, 17], [229, 146, 11], [72, 202, 228],
    [0, 150, 199], [240, 246, 252], [139, 155, 180], [255, 77, 109],
    [46, 196, 182], [5, 7, 10], [33, 42, 58], [255, 255, 255],
    [114, 9, 183], [247, 37, 133], [251, 86, 7], [56, 176, 0],
  ],
  gameboy: [
    [15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15],
  ],
  nes: [
    [28, 25, 54], [42, 37, 80], [248, 56, 0], [216, 40, 0],
    [252, 176, 0], [252, 252, 252], [156, 156, 184], [0, 184, 0],
    [10, 8, 21], [0, 120, 248], [248, 184, 0], [184, 248, 24],
    [0, 0, 0], [248, 120, 248], [0, 232, 216], [124, 124, 124],
  ],
  cyberpunk: [
    [11, 2, 23], [26, 8, 51], [255, 0, 127], [230, 0, 115],
    [0, 240, 255], [0, 194, 204], [253, 242, 248], [168, 85, 247],
    [255, 0, 85], [0, 255, 159], [0, 0, 0], [255, 255, 0],
  ],
  vibrant: [
    [0, 0, 0], [255, 255, 255], [230, 57, 70], [241, 250, 238],
    [168, 218, 220], [69, 123, 157], [29, 53, 87], [255, 183, 3],
    [251, 133, 0], [2, 48, 71], [144, 224, 239], [19, 42, 31],
    [45, 106, 79], [82, 183, 136], [183, 228, 199], [216, 243, 220],
  ],
};

function findClosestColor(r: number, g: number, b: number, palette: RGB[]): RGB {
  let minDistance = Infinity;
  let closest: RGB = palette[0];

  for (let i = 0; i < palette.length; i++) {
    const [pr, pg, pb] = palette[i];
    // Weighted Euclidean distance based on human eye perception
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    const distance = 0.299 * (dr * dr) + 0.587 * (dg * dg) + 0.114 * (db * db);

    if (distance < minDistance) {
      minDistance = distance;
      closest = palette[i];
    }
  }

  return closest;
}

export function autoPixelateImage(
  imageSource: HTMLImageElement,
  options: PixelateOptions = {}
): string {
  const {
    resolution = 64,
    palette = 'retro16',
    dither = true,
    contrast = 10,
    brightness = 0,
  } = options;

  const paletteColors = PALETTES[palette] || PALETTES.retro16;

  // Calculate target low-res dimensions preserving aspect ratio
  const aspect = imageSource.width / imageSource.height;
  let lowW = resolution;
  let lowH = Math.round(resolution / aspect);

  if (lowH > resolution) {
    lowH = resolution;
    lowW = Math.round(resolution * aspect);
  }

  // 1. Draw downsampled image onto small offscreen canvas
  const smallCanvas = document.createElement('canvas');
  smallCanvas.width = lowW;
  smallCanvas.height = lowH;
  const smallCtx = smallCanvas.getContext('2d');
  if (!smallCtx) return '';

  smallCtx.imageSmoothingEnabled = true;
  smallCtx.drawImage(imageSource, 0, 0, lowW, lowH);

  const imgData = smallCtx.getImageData(0, 0, lowW, lowH);
  const data = imgData.data;

  // Apply brightness & contrast adjustment factor
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    // Brightness
    let r = data[i] + brightness;
    let g = data[i + 1] + brightness;
    let b = data[i + 2] + brightness;

    // Contrast
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  // 2. Color quantization + Floyd-Steinberg Error Diffusion Dithering
  if (dither) {
    for (let y = 0; y < lowH; y++) {
      for (let x = 0; x < lowW; x++) {
        const idx = (y * lowW + x) * 4;
        const oldR = data[idx];
        const oldG = data[idx + 1];
        const oldB = data[idx + 2];

        const [newR, newG, newB] = findClosestColor(oldR, oldG, oldB, paletteColors);

        data[idx] = newR;
        data[idx + 1] = newG;
        data[idx + 2] = newB;

        const errR = oldR - newR;
        const errG = oldG - newG;
        const errB = oldB - newB;

        // Distribute quantization error to neighboring pixels
        // (x + 1, y) => 7/16
        if (x + 1 < lowW) {
          const neighborIdx = (y * lowW + (x + 1)) * 4;
          data[neighborIdx] = Math.min(255, Math.max(0, data[neighborIdx] + (errR * 7) / 16));
          data[neighborIdx + 1] = Math.min(255, Math.max(0, data[neighborIdx + 1] + (errG * 7) / 16));
          data[neighborIdx + 2] = Math.min(255, Math.max(0, data[neighborIdx + 2] + (errB * 7) / 16));
        }

        // (x - 1, y + 1) => 3/16
        if (x - 1 >= 0 && y + 1 < lowH) {
          const neighborIdx = ((y + 1) * lowW + (x - 1)) * 4;
          data[neighborIdx] = Math.min(255, Math.max(0, data[neighborIdx] + (errR * 3) / 16));
          data[neighborIdx + 1] = Math.min(255, Math.max(0, data[neighborIdx + 1] + (errG * 3) / 16));
          data[neighborIdx + 2] = Math.min(255, Math.max(0, data[neighborIdx + 2] + (errB * 3) / 16));
        }

        // (x, y + 1) => 5/16
        if (y + 1 < lowH) {
          const neighborIdx = ((y + 1) * lowW + x) * 4;
          data[neighborIdx] = Math.min(255, Math.max(0, data[neighborIdx] + (errR * 5) / 16));
          data[neighborIdx + 1] = Math.min(255, Math.max(0, data[neighborIdx + 1] + (errG * 5) / 16));
          data[neighborIdx + 2] = Math.min(255, Math.max(0, data[neighborIdx + 2] + (errB * 5) / 16));
        }

        // (x + 1, y + 1) => 1/16
        if (x + 1 < lowW && y + 1 < lowH) {
          const neighborIdx = ((y + 1) * lowW + (x + 1)) * 4;
          data[neighborIdx] = Math.min(255, Math.max(0, data[neighborIdx] + (errR * 1) / 16));
          data[neighborIdx + 1] = Math.min(255, Math.max(0, data[neighborIdx + 1] + (errG * 1) / 16));
          data[neighborIdx + 2] = Math.min(255, Math.max(0, data[neighborIdx + 2] + (errB * 1) / 16));
        }
      }
    }
  } else {
    // Pure nearest palette match without dithering
    for (let i = 0; i < data.length; i += 4) {
      const [newR, newG, newB] = findClosestColor(data[i], data[i + 1], data[i + 2], paletteColors);
      data[i] = newR;
      data[i + 1] = newG;
      data[i + 2] = newB;
    }
  }

  smallCtx.putImageData(imgData, 0, 0);

  // 3. Upscale onto export canvas using strict nearest-neighbor (no blur)
  const scale = 6;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = lowW * scale;
  outCanvas.height = lowH * scale;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return '';

  outCtx.imageSmoothingEnabled = false;
  outCtx.drawImage(smallCanvas, 0, 0, outCanvas.width, outCanvas.height);

  return outCanvas.toDataURL('image/png');
}
