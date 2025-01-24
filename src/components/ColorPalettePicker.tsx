import { Palette } from "lucide-react";

import {
  colorPalettes,
  useColorPaletteStore,
} from "~/stores/useColorPaletteStore";

import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function ColorPalettePicker() {
  const { selectedColors, setSelectedColors, avatarVariant, setAvatarVariant } =
    useColorPaletteStore();

  const avatarVariants = [
    "marble",
    "beam",
    "pixel",
    "sunset",
    "ring",
    "bauhaus",
  ] as const;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px]">
        <div className="space-y-4">
          <div>
            <Label>Avatar Style</Label>
            <Select value={avatarVariant} onValueChange={setAvatarVariant}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {avatarVariants.map((variant) => (
                  <SelectItem key={variant} value={variant}>
                    {variant.charAt(0).toUpperCase() + variant.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Color Palette</Label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {colorPalettes.map((colors, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedColors(colors)}
                  className={`flex h-8 cursor-pointer flex-col rounded-md border p-1 transition-all hover:scale-105 ${
                    selectedColors === colors ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="flex h-full w-full gap-1">
                    {colors.map((color, colorIndex) => (
                      <div
                        key={colorIndex}
                        className="h-full flex-1 rounded-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
