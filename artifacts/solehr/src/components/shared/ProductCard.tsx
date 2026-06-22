import { Link } from "wouter";
import { ProductSummary } from "@workspace/api-client-react";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <div className="group relative flex flex-col cursor-pointer gap-3">
      <Link href={`/shop/${product.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">View {product.name}</span>
      </Link>
      
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary/50">
        {product.primaryImage ? (
          <img
            src={product.primaryImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground font-serif text-sm italic">
            No image available
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {product.isNew && (
            <span className="bg-primary text-primary-foreground text-[10px] uppercase tracking-wider px-2 py-1">
              New
            </span>
          )}
          {product.salePrice && (
            <span className="bg-destructive text-destructive-foreground text-[10px] uppercase tracking-wider px-2 py-1">
              Sale
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-serif text-base leading-tight tracking-tight text-foreground line-clamp-2">
            {product.name}
          </h3>
          <div className="flex flex-col items-end shrink-0">
            {product.salePrice ? (
              <>
                <span className="text-sm font-medium text-destructive">${product.salePrice.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground line-through">${product.basePrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-sm font-medium">${product.basePrice.toFixed(2)}</span>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-wider mt-1">
          <span>{product.brand || 'SoleHer'}</span>
          {product.colourCount > 1 && (
            <span>{product.colourCount} Colors</span>
          )}
        </div>
      </div>
    </div>
  );
}
