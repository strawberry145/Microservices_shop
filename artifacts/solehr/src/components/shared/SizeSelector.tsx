import { cn } from "@/lib/utils";
import { Sku } from "@workspace/api-client-react";

interface SizeSelectorProps {
  skus: Sku[];
  selectedSkuId?: number;
  onSelectSku: (sku: Sku) => void;
  className?: string;
}

export function SizeSelector({ skus, selectedSkuId, onSelectSku, className }: SizeSelectorProps) {
  // Group and sort SKUs by size
  const sortedSkus = [...skus].sort((a, b) => a.sizeEu - b.sizeEu);

  return (
    <div className={cn("grid grid-cols-4 sm:grid-cols-5 gap-2", className)}>
      {sortedSkus.map((sku) => {
        const isOutOfStock = sku.stockQuantity === 0;
        const isSelected = sku.id === selectedSkuId;
        const isLowStock = sku.stockQuantity > 0 && sku.stockQuantity <= 3;

        return (
          <button
            key={sku.id}
            disabled={isOutOfStock}
            onClick={() => onSelectSku(sku)}
            className={cn(
              "relative flex flex-col items-center justify-center py-3 border transition-all duration-200",
              isSelected
                ? "border-primary bg-primary text-primary-foreground font-medium"
                : "border-border hover:border-primary/50 text-foreground bg-background",
              isOutOfStock && "opacity-50 cursor-not-allowed hover:border-border line-through text-muted-foreground"
            )}
          >
            <span className="text-sm font-medium">{sku.sizeEu}</span>
            {isLowStock && !isSelected && (
              <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground" title={`Only ${sku.stockQuantity} left`}>
                {sku.stockQuantity}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
