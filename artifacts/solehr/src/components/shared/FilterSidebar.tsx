import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CatalogueStats } from "@workspace/api-client-react";
import { ColourSwatches } from "./ColourSwatches";

interface FilterSidebarProps {
  stats: CatalogueStats | undefined;
  filters: any;
  setFilters: (filters: any) => void;
  className?: string;
}

export function FilterSidebar({ stats, filters, setFilters, className }: FilterSidebarProps) {
  if (!stats) return null;

  const handleCheckboxChange = (key: string, value: string, checked: boolean) => {
    setFilters((prev: any) => {
      // For simple single-select in the API (like style, brand)
      if (checked) {
        return { ...prev, [key]: value };
      } else {
        const next = { ...prev };
        delete next[key];
        return next;
      }
    });
  };

  const handleClear = () => {
    setFilters({});
  };

  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-xl tracking-tight">Filters</h3>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground h-auto p-0">
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      <Accordion type="multiple" defaultValue={["style", "size", "price", "colour"]} className="w-full">
        
        {/* Style */}
        {stats.styles.length > 0 && (
          <AccordionItem value="style" className="border-border">
            <AccordionTrigger className="text-sm font-bold uppercase tracking-wider hover:no-underline">Style</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {stats.styles.map(style => (
                  <div key={style} className="flex items-center space-x-3">
                    <Checkbox 
                      id={`style-${style}`} 
                      checked={filters.style === style}
                      onCheckedChange={(checked) => handleCheckboxChange("style", style, checked as boolean)}
                      className="rounded-none border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor={`style-${style}`} className="text-sm font-normal capitalize cursor-pointer">{style}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Size */}
        {stats.availableSizes.length > 0 && (
          <AccordionItem value="size" className="border-border">
            <AccordionTrigger className="text-sm font-bold uppercase tracking-wider hover:no-underline">Size (EU)</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-4 gap-2 pt-2">
                {stats.availableSizes.sort((a,b)=>a-b).map(size => (
                  <button
                    key={size}
                    onClick={() => {
                      if (filters.sizeEu === size) {
                        const { sizeEu, ...rest } = filters;
                        setFilters(rest);
                      } else {
                        setFilters({ ...filters, sizeEu: size });
                      }
                    }}
                    className={`py-2 text-xs border transition-colors ${
                      filters.sizeEu === size 
                        ? 'border-primary bg-primary text-primary-foreground font-bold' 
                        : 'border-border hover:border-primary/50 text-foreground bg-background'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Price */}
        <AccordionItem value="price" className="border-border">
          <AccordionTrigger className="text-sm font-bold uppercase tracking-wider hover:no-underline">Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="pt-4 px-2 pb-2">
              <Slider 
                defaultValue={[stats.minPrice, stats.maxPrice]} 
                max={stats.maxPrice} 
                min={stats.minPrice} 
                step={10}
                value={[filters.minPrice || stats.minPrice, filters.maxPrice || stats.maxPrice]}
                onValueChange={([min, max]) => {
                  setFilters({ ...filters, minPrice: min, maxPrice: max });
                }}
                className="mb-6"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>${filters.minPrice || stats.minPrice}</span>
                <span>${filters.maxPrice || stats.maxPrice}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Colour */}
        {stats.colours.length > 0 && (
          <AccordionItem value="colour" className="border-border">
            <AccordionTrigger className="text-sm font-bold uppercase tracking-wider hover:no-underline">Colour</AccordionTrigger>
            <AccordionContent>
              <div className="pt-2">
                <ColourSwatches 
                  colours={stats.colours.map(c => {
                    // Simple map for hex values of basic colors
                    const map: Record<string, string> = {
                      black: '#000000', white: '#ffffff', red: '#e53e3e', 
                      blue: '#3182ce', green: '#38a169', yellow: '#d69e2e',
                      brown: '#744210', beige: '#dcd0c0', grey: '#a0aec0',
                      pink: '#d53f8c', purple: '#805ad5', silver: '#cbd5e0', gold: '#ecc94b'
                    };
                    return { name: c, hex: map[c.toLowerCase()] || '#ccc' };
                  })}
                  selectedColour={filters.colour || ""}
                  onSelectColour={(c) => {
                    if (filters.colour === c) {
                      const { colour, ...rest } = filters;
                      setFilters(rest);
                    } else {
                      setFilters({ ...filters, colour: c });
                    }
                  }}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Brand */}
        {stats.brands.length > 0 && (
          <AccordionItem value="brand" className="border-border">
            <AccordionTrigger className="text-sm font-bold uppercase tracking-wider hover:no-underline">Brand</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {stats.brands.map(brand => (
                  <div key={brand} className="flex items-center space-x-3">
                    <Checkbox 
                      id={`brand-${brand}`} 
                      checked={filters.brand === brand}
                      onCheckedChange={(checked) => handleCheckboxChange("brand", brand, checked as boolean)}
                      className="rounded-none border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor={`brand-${brand}`} className="text-sm font-normal cursor-pointer">{brand}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

      </Accordion>
    </div>
  );
}
