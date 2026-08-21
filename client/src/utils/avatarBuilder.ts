// Modular Custom Pixel Avatar Generator Engine (12x12 Sprite Matrix)

export interface CustomAvatarConfig {
  skin: string;
  hairStyle: string;
  hairColor: string;
  outfit: string;
  outfitColor: string;
  accessory: string;
}

export interface SpritePixel {
  x: number;
  y: number;
  color: string;
  isEyeOpen?: boolean;
  isEyeClosed?: boolean;
}

export const SKIN_TONES = [
  { id: 'fair', name: 'Fair', hex: '#ffd8be', shadow: '#e5b89a' },
  { id: 'warm', name: 'Warm', hex: '#ffcdb2', shadow: '#e5989b' },
  { id: 'tan', name: 'Tan', hex: '#ddb892', shadow: '#b08968' },
  { id: 'dark', name: 'Dark', hex: '#7f4f24', shadow: '#582f0e' },
  { id: 'deep', name: 'Deep', hex: '#432818', shadow: '#2c1810' },
  { id: 'pale', name: 'Cool grey', hex: '#dce1de', shadow: '#9cc5a1' },
  { id: 'alien', name: 'Olive', hex: '#8bac0f', shadow: '#306230' },
  { id: 'cyber', name: 'Cool blue', hex: '#48cae4', shadow: '#0077b6' },
  { id: 'demon', name: 'Deep red', hex: '#dc2f02', shadow: '#6a040f' },
];

export const HAIR_STYLES = [
  { id: 'spiky', name: 'Short spikes' },
  { id: 'short', name: 'Classic Part' },
  { id: 'bob', name: 'Sleek Bob' },
  { id: 'long', name: 'Long Locks' },
  { id: 'ponytail', name: 'Top Ponytail' },
  { id: 'afro', name: 'Retro Afro' },
  { id: 'wizard_hat', name: 'Hat' },
  { id: 'helmet', name: 'Helmet' },
  { id: 'ninja_hood', name: 'Hood' },
  { id: 'cat_ears', name: 'Ears' },
  { id: 'bandana', name: 'Bandana' },
];

export const HAIR_COLORS = [
  { id: 'black', name: 'Midnight Black', hex: '#111118' },
  { id: 'brown', name: 'Chestnut Brown', hex: '#6f4e37' },
  { id: 'blonde', name: 'Golden Blonde', hex: '#ffd166' },
  { id: 'crimson', name: 'Fire Crimson', hex: '#e63946' },
  { id: 'pink', name: 'Pink', hex: '#ff006e' },
  { id: 'purple', name: 'Purple', hex: '#8338ec' },
  { id: 'cyan', name: 'Cyan', hex: '#00f0ff' },
  { id: 'mint', name: 'Mint', hex: '#2ec4b6' },
  { id: 'silver', name: 'Silver', hex: '#edf2f4' },
  { id: 'orange', name: 'Amber', hex: '#fb5607' },
];

export const OUTFITS = [
  { id: 'armor', name: 'Jacket' },
  { id: 'robe', name: 'Coat' },
  { id: 'ninja', name: 'Uniform' },
  { id: 'jacket', name: 'Blazer' },
  { id: 'tunic', name: 'Shirt' },
  { id: 'spacesuit', name: 'Coverall' },
  { id: 'hoodie', name: 'Hoodie' },
  { id: 'cloak', name: 'Shawl' },
];

export const OUTFIT_COLORS = [
  { id: 'blue', name: 'Sapphire Blue', hex: '#3a86ff' },
  { id: 'red', name: 'Crimson Ruby', hex: '#e63946' },
  { id: 'green', name: 'Jade Emerald', hex: '#38b000' },
  { id: 'dark', name: 'Shadow Obsidian', hex: '#1a1a24' },
  { id: 'amber', name: 'Gold Amber', hex: '#fca311' },
  { id: 'purple', name: 'Amethyst Purple', hex: '#7b2cbf' },
  { id: 'cyan', name: 'Cyan', hex: '#00f0ff' },
  { id: 'white', name: 'Ivory White', hex: '#edf2f4' },
];

export const ACCESSORIES = [
  { id: 'none', name: 'None' },
  { id: 'shades', name: 'Sunglasses' },
  { id: 'eyepatch', name: 'Eyepatch' },
  { id: 'blush', name: 'Blush' },
  { id: 'scars', name: 'Scar' },
];

export const DEFAULT_AVATAR_CONFIG: CustomAvatarConfig = {
  skin: 'fair',
  hairStyle: 'spiky',
  hairColor: '#ffd166',
  outfit: 'armor',
  outfitColor: '#3a86ff',
  accessory: 'none',
};

// Encode config to a compact string
export function encodeAvatarConfig(config: CustomAvatarConfig): string {
  return `custom_v1:${config.skin}:${config.hairStyle}:${encodeURIComponent(config.hairColor)}:${config.outfit}:${encodeURIComponent(config.outfitColor)}:${config.accessory}`;
}

// Decode compact string back to config
export function decodeAvatarConfig(str: string): CustomAvatarConfig {
  if (!str.startsWith('custom_v1:')) {
    return DEFAULT_AVATAR_CONFIG;
  }
  const parts = str.slice(10).split(':');
  return {
    skin: parts[0] || 'fair',
    hairStyle: parts[1] || 'spiky',
    hairColor: decodeURIComponent(parts[2] || '#ffd166'),
    outfit: parts[3] || 'armor',
    outfitColor: decodeURIComponent(parts[4] || '#3a86ff'),
    accessory: parts[5] || 'none',
  };
}

export function isCustomAvatarString(str?: string): boolean {
  return typeof str === 'string' && str.startsWith('custom_v1:');
}

export function randomizeAvatarConfig(): CustomAvatarConfig {
  const randomSkin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].id;
  const randomHair = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id;
  const randomHairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].hex;
  const randomOutfit = OUTFITS[Math.floor(Math.random() * OUTFITS.length)].id;
  const randomOutfitColor = OUTFIT_COLORS[Math.floor(Math.random() * OUTFIT_COLORS.length)].hex;
  const randomAccessory = ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)].id;

  return {
    skin: randomSkin,
    hairStyle: randomHair,
    hairColor: randomHairColor,
    outfit: randomOutfit,
    outfitColor: randomOutfitColor,
    accessory: randomAccessory,
  };
}

// Generate the 12x12 pixel matrix grid with stepped idle blink frames
export function generateCompositeMatrix(config: CustomAvatarConfig): SpritePixel[] {
  const skinData = SKIN_TONES.find((s) => s.id === config.skin) || SKIN_TONES[0];
  const pixels: SpritePixel[] = [];

  const setPixel = (x: number, y: number, color: string) => {
    if (x >= 0 && x < 12 && y >= 0 && y < 12 && color) {
      const existingIdx = pixels.findIndex((p) => p.x === x && p.y === y && !p.isEyeOpen && !p.isEyeClosed);
      if (existingIdx > -1) {
        pixels[existingIdx].color = color;
      } else {
        pixels.push({ x, y, color });
      }
    }
  };

  // 1. Base Head & Neck (Skin)
  for (let x = 3; x <= 8; x++) {
    for (let y = 3; y <= 7; y++) {
      setPixel(x, y, skinData.hex);
    }
  }
  setPixel(4, 2, skinData.hex);
  setPixel(5, 2, skinData.hex);
  setPixel(6, 2, skinData.hex);
  setPixel(7, 2, skinData.hex);
  // Chin shadow
  setPixel(5, 7, skinData.shadow);
  setPixel(6, 7, skinData.shadow);
  // Neck
  setPixel(5, 8, skinData.shadow);
  setPixel(6, 8, skinData.shadow);

  // 2. Outfits (Bottom torso rows 8 to 11)
  const oColor = config.outfitColor;
  const oAccent = '#ffd166';

  switch (config.outfit) {
    case 'armor':
      for (let x = 2; x <= 9; x++) {
        setPixel(x, 9, oColor);
        setPixel(x, 10, oColor);
      }
      setPixel(3, 8, oAccent);
      setPixel(8, 8, oAccent);
      setPixel(5, 9, oAccent);
      setPixel(6, 9, oAccent);
      setPixel(4, 11, oColor);
      setPixel(7, 11, oColor);
      break;

    case 'robe':
      for (let x = 3; x <= 8; x++) {
        for (let y = 9; y <= 11; y++) {
          setPixel(x, y, oColor);
        }
      }
      setPixel(5, 9, oAccent);
      setPixel(6, 9, oAccent);
      setPixel(5, 10, oAccent);
      setPixel(6, 10, oAccent);
      setPixel(2, 10, oColor);
      setPixel(9, 10, oColor);
      break;

    case 'ninja':
      for (let x = 3; x <= 8; x++) {
        for (let y = 9; y <= 11; y++) {
          setPixel(x, y, '#161a1d');
        }
      }
      setPixel(4, 10, oColor);
      setPixel(5, 10, oColor);
      setPixel(6, 10, oColor);
      setPixel(7, 10, oColor);
      setPixel(2, 9, '#161a1d');
      setPixel(9, 9, '#161a1d');
      break;

    case 'jacket':
      for (let x = 2; x <= 9; x++) {
        setPixel(x, 9, oColor);
        setPixel(x, 10, oColor);
      }
      setPixel(5, 9, '#ffffff');
      setPixel(6, 9, '#ffffff');
      setPixel(5, 10, '#ffffff');
      setPixel(6, 10, '#ffffff');
      setPixel(4, 11, '#111118');
      setPixel(7, 11, '#111118');
      break;

    case 'spacesuit':
      for (let x = 2; x <= 9; x++) {
        for (let y = 9; y <= 11; y++) {
          setPixel(x, y, '#edf2f4');
        }
      }
      setPixel(5, 9, oColor);
      setPixel(6, 9, oColor);
      setPixel(5, 10, oAccent);
      setPixel(6, 10, oAccent);
      break;

    case 'cloak':
      for (let x = 2; x <= 9; x++) {
        for (let y = 8; y <= 11; y++) {
          setPixel(x, y, oColor);
        }
      }
      setPixel(4, 8, oAccent);
      setPixel(7, 8, oAccent);
      setPixel(5, 9, '#111118');
      setPixel(6, 9, '#111118');
      break;

    case 'hoodie':
    default:
      for (let x = 2; x <= 9; x++) {
        for (let y = 9; y <= 11; y++) {
          setPixel(x, y, oColor);
        }
      }
      setPixel(5, 9, '#ffffff');
      setPixel(6, 9, '#ffffff');
      setPixel(5, 10, '#ffffff');
      setPixel(6, 10, '#ffffff');
      break;
  }

  // 3. Hair Styles & Headgear
  const hColor = config.hairColor;

  switch (config.hairStyle) {
    case 'spiky':
      setPixel(4, 1, hColor);
      setPixel(5, 0, hColor);
      setPixel(7, 0, hColor);
      setPixel(8, 1, hColor);
      for (let x = 3; x <= 8; x++) setPixel(x, 2, hColor);
      setPixel(2, 3, hColor);
      setPixel(9, 3, hColor);
      setPixel(4, 3, hColor);
      setPixel(6, 3, hColor);
      break;

    case 'bob':
      for (let x = 3; x <= 8; x++) {
        setPixel(x, 1, hColor);
        setPixel(x, 2, hColor);
      }
      setPixel(2, 3, hColor);
      setPixel(2, 4, hColor);
      setPixel(2, 5, hColor);
      setPixel(9, 3, hColor);
      setPixel(9, 4, hColor);
      setPixel(9, 5, hColor);
      setPixel(4, 3, hColor);
      break;

    case 'long':
      for (let x = 3; x <= 8; x++) {
        setPixel(x, 1, hColor);
        setPixel(x, 2, hColor);
      }
      for (let y = 3; y <= 8; y++) {
        setPixel(2, y, hColor);
        setPixel(9, y, hColor);
      }
      setPixel(3, 3, hColor);
      setPixel(8, 3, hColor);
      break;

    case 'ponytail':
      setPixel(5, 0, hColor);
      setPixel(6, 0, hColor);
      setPixel(5, 1, hColor);
      setPixel(6, 1, hColor);
      setPixel(7, 1, hColor);
      setPixel(8, 2, hColor);
      for (let x = 3; x <= 8; x++) setPixel(x, 2, hColor);
      setPixel(2, 3, hColor);
      setPixel(9, 3, hColor);
      break;

    case 'afro':
      for (let x = 2; x <= 9; x++) {
        setPixel(x, 0, hColor);
        setPixel(x, 1, hColor);
        setPixel(x, 2, hColor);
      }
      setPixel(1, 2, hColor);
      setPixel(1, 3, hColor);
      setPixel(1, 4, hColor);
      setPixel(10, 2, hColor);
      setPixel(10, 3, hColor);
      setPixel(10, 4, hColor);
      break;

    case 'wizard_hat':
      setPixel(5, 0, oColor);
      setPixel(6, 0, oColor);
      setPixel(5, 1, oColor);
      setPixel(6, 1, oColor);
      for (let x = 4; x <= 7; x++) setPixel(x, 2, oColor);
      for (let x = 2; x <= 9; x++) setPixel(x, 3, oAccent);
      break;

    case 'helmet':
      for (let x = 3; x <= 8; x++) {
        setPixel(x, 1, '#8d99ae');
        setPixel(x, 2, '#8d99ae');
      }
      setPixel(2, 3, '#8d99ae');
      setPixel(9, 3, '#8d99ae');
      setPixel(2, 4, '#8d99ae');
      setPixel(9, 4, '#8d99ae');
      setPixel(5, 0, '#fca311');
      setPixel(6, 0, '#fca311');
      // Visor slit
      setPixel(4, 4, '#111118');
      setPixel(5, 4, '#111118');
      setPixel(6, 4, '#111118');
      setPixel(7, 4, '#111118');
      break;

    case 'ninja_hood':
      for (let x = 3; x <= 8; x++) {
        setPixel(x, 1, '#161a1d');
        setPixel(x, 2, '#161a1d');
      }
      setPixel(2, 3, '#161a1d');
      setPixel(9, 3, '#161a1d');
      setPixel(2, 4, '#161a1d');
      setPixel(9, 4, '#161a1d');
      setPixel(2, 5, '#161a1d');
      setPixel(9, 5, '#161a1d');
      // Forehead plate
      for (let x = 4; x <= 7; x++) setPixel(x, 3, oColor);
      break;

    case 'cat_ears':
      setPixel(2, 1, '#ff006e');
      setPixel(3, 2, '#ff006e');
      setPixel(9, 1, '#ff006e');
      setPixel(8, 2, '#ff006e');
      for (let x = 3; x <= 8; x++) {
        setPixel(x, 2, hColor);
      }
      setPixel(2, 3, hColor);
      setPixel(9, 3, hColor);
      break;

    case 'bandana':
      for (let x = 2; x <= 9; x++) {
        setPixel(x, 3, '#e63946');
      }
      setPixel(1, 4, '#e63946');
      setPixel(1, 5, '#e63946');
      for (let x = 3; x <= 8; x++) setPixel(x, 2, hColor);
      break;

    case 'short':
    default:
      for (let x = 3; x <= 8; x++) {
        setPixel(x, 1, hColor);
        setPixel(x, 2, hColor);
      }
      setPixel(2, 3, hColor);
      setPixel(9, 3, hColor);
      setPixel(4, 3, hColor);
      break;
  }

  // 4. Eyes & Stepped Blink Frames
  if (config.accessory === 'shades') {
    setPixel(3, 5, '#111118');
    setPixel(4, 5, '#111118');
    setPixel(5, 5, '#111118');
    setPixel(6, 5, '#111118');
    setPixel(7, 5, '#111118');
    setPixel(8, 5, '#111118');
    setPixel(4, 6, '#111118');
    setPixel(7, 6, '#111118');
  } else if (config.accessory === 'eyepatch') {
    // Left eye patch
    setPixel(4, 5, '#111118');
    setPixel(3, 4, '#111118');
    setPixel(5, 6, '#111118');
    // Right eye blinks
    pixels.push({ x: 7, y: 5, color: '#111118', isEyeOpen: true });
    pixels.push({ x: 7, y: 5, color: skinData.shadow, isEyeClosed: true });
  } else {
    // Both eyes blink: Frame 0 (Open), Frame 1 (Closed Eyelid)
    pixels.push({ x: 4, y: 5, color: '#111118', isEyeOpen: true });
    pixels.push({ x: 4, y: 5, color: skinData.shadow, isEyeClosed: true });
    pixels.push({ x: 7, y: 5, color: '#111118', isEyeOpen: true });
    pixels.push({ x: 7, y: 5, color: skinData.shadow, isEyeClosed: true });
  }

  // 5. Additional Accessories
  switch (config.accessory) {
    case 'blush':
      setPixel(3, 6, '#ff006e');
      setPixel(8, 6, '#ff006e');
      break;

    case 'scars':
      setPixel(7, 4, '#9d0208');
      setPixel(7, 5, '#9d0208');
      setPixel(6, 6, '#9d0208');
      break;
  }

  return pixels;
}
