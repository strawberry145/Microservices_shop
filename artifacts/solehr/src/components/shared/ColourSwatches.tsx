import { cn } from "@/lib/utils";

interface ColourSwatchesProps {
  colours: { name: string; hex?: string | null }[];
  selectedColour: string;
  onSelectColour: (colour: string) => void;
  className?: string;
}

export function ColourSwatches({ colours, selectedColour, onSelectColour, className }: ColourSwatchesProps) {
  // Deduplicate colours
  const uniqueColours = colours.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {uniqueColours.map((colour) => {
        const isSelected = colour.name === selectedColour;
        return (
          <button
            key={colour.name}
            onClick={() => onSelectColour(colour.name)}
            title={colour.name}
            className={cn(
              "relative flex items-center justify-center rounded-full w-8 h-8 transition-all",
              isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "ring-1 ring-border hover:ring-primary/50"
            )}
            style={{ backgroundColor: colour.hex || '#ccc' }}
          >
            <span className="sr-only">{colour.name}</span>
          </button>
        );
      })}
    </div>
  );
}
