import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to convert HSL to RGB
function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  s /= 100; // Convert saturation to 0-1 range
  l /= 100; // Convert lightness to 0-1 range

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return { r, g, b };
}

export function getContrastTextColor(
  colorInput: string | null | undefined,
): string {
  const defaultColor = "#ffffff"; // Default contrast color

  if (!colorInput) {
    return defaultColor;
  }

  let r: number | undefined;
  let g: number | undefined;
  let b: number | undefined;

  try {
    const trimmedInput = colorInput.trim();

    if (trimmedInput.startsWith("hsl(")) {
      const match = /hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/.exec(
        trimmedInput,
      );
      if (match?.[1] && match[2] && match[3]) {
        const h = parseInt(match[1], 10);
        const s = parseInt(match[2], 10);
        const l = parseInt(match[3], 10);
        if (
          h >= 0 &&
          h < 360 &&
          s >= 0 &&
          s <= 100 &&
          l >= 0 &&
          l <= 100 &&
          !isNaN(h) &&
          !isNaN(s) &&
          !isNaN(l)
        ) {
          const rgb = hslToRgb(h, s, l);
          r = rgb.r;
          g = rgb.g;
          b = rgb.b;
        } else {
          console.warn("Invalid HSL values:", trimmedInput);
        }
      } else {
        console.warn("Invalid HSL format:", trimmedInput);
      }
    } else {
      let hexColor = trimmedInput.startsWith("#")
        ? trimmedInput.substring(1)
        : trimmedInput;

      if (hexColor.length === 3 && /^[0-9a-fA-F]{3}$/.test(hexColor)) {
        hexColor = hexColor
          .split("")
          .map((char) => char + char)
          .join("");
      }

      if (hexColor.length === 6 && /^[0-9a-fA-F]{6}$/.test(hexColor)) {
        const rHex = hexColor.substring(0, 2);
        const gHex = hexColor.substring(2, 4);
        const bHex = hexColor.substring(4, 6);
        r = parseInt(rHex, 16);
        g = parseInt(gHex, 16);
        b = parseInt(bHex, 16);
      } else {
        console.warn("Invalid HEX format:", trimmedInput);
      }
    }
  } catch (error) {
    console.error("Error parsing color:", colorInput, error);
  }

  // Check if RGB values were successfully parsed and are valid numbers
  if (
    r === undefined ||
    g === undefined ||
    b === undefined ||
    isNaN(r) ||
    isNaN(g) ||
    isNaN(b)
  ) {
    console.debug(
      "Failed to parse color or resulted in NaN, returning default:",
      colorInput,
    );
    return defaultColor;
  }

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return contrast color
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
