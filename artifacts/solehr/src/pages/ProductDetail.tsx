import { useState, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { 
  useGetProduct, 
  useAddToWishlist, 
  useGetWishlist,
  useRemoveFromWishlist,
  Sku
} from "@workspace/api-client-react";
import { useCartStore, useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { SizeSelector } from "@/components/shared/SizeSelector";
import { ColourSwatches } from "@/components/shared/ColourSwatches";
import { SizeGuideModal } from "@/components/shared/SizeGuideModal";
import { Heart, Loader2, ArrowLeft, ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function ProductDetail() {
  const [, params] = useRoute("/shop/:id");
  const productId = params?.id ? parseInt(params.id) : 0;
  
  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId }
  });
  
  const { token } = useAuthStore();
  const addItem = useCartStore(state => state.addItem);
  const queryClient = useQueryClient();
  
  const { data: wishlist } = useGetWishlist({
    query: { enabled: !!token }
  });
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  
  const [selectedColour, setSelectedColour] = useState<string>("");
  const [selectedSku, setSelectedSku] = useState<Sku | null>(null);
  
  // Set initial colour when product loads
  useMemo(() => {
    if (product && !selectedColour && product.skus.length > 0) {
      setSelectedColour(product.skus[0].colour);
    }
  }, [product, selectedColour]);

  const skusForSelectedColour = useMemo(() => {
    if (!product) return [];
    return product.skus.filter(s => s.colour === selectedColour);
  }, [product, selectedColour]);

  const isInWishlist = useMemo(() => {
    return wishlist?.some(item => item.productId === productId);
  }, [wishlist, productId]);

  const handleAddToCart = () => {
    if (!selectedSku || !product) {
      toast.error("Please select a size first");
      return;
    }
    
    addItem({
      skuId: selectedSku.id,
      productId: product.id,
      productName: product.name,
      productImage: product.primaryImage,
      colour: selectedSku.colour,
      sizeEu: selectedSku.sizeEu,
      price: selectedSku.price,
      quantity: 1
    });
    
    toast.success("Added to cart");
  };

  const handleWishlistToggle = () => {
    if (!token) {
      toast.error("Please sign in to save items to your wishlist");
      return;
    }
    
    if (isInWishlist) {
      removeFromWishlist.mutate(
        { id: productId },
        {
          onSuccess: () => {
            toast.success("Removed from wishlist");
            queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
          }
        }
      );
    } else {
      addToWishlist.mutate(
        { data: { productId } },
        {
          onSuccess: () => {
            toast.success("Added to wishlist");
            queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
          }
        }
      );
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!product) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-3xl font-serif mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">The item you're looking for doesn't exist or has been removed.</p>
          <Button asChild><Link href="/shop">Back to Shop</Link></Button>
        </div>
      </AppLayout>
    );
  }

  const images = product.images.length > 0 
    ? [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  const displayPrice = selectedSku ? selectedSku.price : product.basePrice;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-muted-foreground mb-8 uppercase tracking-wider font-bold text-[10px]">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-3 w-3 mx-2" />
          <Link href="/shop" className="hover:text-foreground">Shop</Link>
          <ChevronRight className="h-3 w-3 mx-2" />
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Images */}
          <div className="md:col-span-1 lg:col-span-7 flex flex-col md:flex-row gap-4">
            <div className="flex md:flex-col order-2 md:order-1 gap-4 overflow-x-auto md:w-24 shrink-0 pb-4 md:pb-0">
              {images.map((img) => (
                <button key={img.id} className="w-20 h-24 md:w-full md:h-32 shrink-0 border border-border/50 hover:border-primary transition-colors focus:outline-none">
                  <img src={img.url} alt={img.altText || product.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="order-1 md:order-2 flex-1 bg-secondary/30 aspect-[3/4] relative">
              {product.primaryImage ? (
                <img src={product.primaryImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif italic">No image available</div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-1 lg:col-span-5 flex flex-col space-y-8">
            <div>
              <div className="flex justify-between items-start">
                <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-foreground">{product.name}</h1>
                <Button variant="ghost" size="icon" onClick={handleWishlistToggle} className="rounded-full">
                  <Heart className={`h-6 w-6 ${isInWishlist ? 'fill-primary text-primary' : ''}`} />
                </Button>
              </div>
              
              <div className="mt-4 flex items-center gap-4">
                <span className="text-xl font-medium">${displayPrice.toFixed(2)}</span>
                {product.style && (
                  <span className="px-2 py-1 bg-secondary text-xs uppercase tracking-wider font-bold">
                    {product.style}
                  </span>
                )}
                {product.heelHeight && (
                  <span className="px-2 py-1 bg-secondary text-xs uppercase tracking-wider font-bold">
                    {product.heelHeight}
                  </span>
                )}
              </div>
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Colors */}
            <div className="space-y-4">
              <h3 className="font-bold uppercase tracking-wider text-xs">
                Colour: <span className="text-muted-foreground capitalize font-normal ml-2">{selectedColour}</span>
              </h3>
              <ColourSwatches 
                colours={product.skus.map(s => ({ name: s.colour, hex: s.colourHex }))}
                selectedColour={selectedColour}
                onSelectColour={(c) => {
                  setSelectedColour(c);
                  setSelectedSku(null); // Reset size selection on color change
                }}
              />
            </div>

            {/* Sizes */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold uppercase tracking-wider text-xs">Size (EU)</h3>
                <SizeGuideModal />
              </div>
              
              <SizeSelector 
                skus={skusForSelectedColour}
                selectedSkuId={selectedSku?.id}
                onSelectSku={setSelectedSku}
              />
              
              {selectedSku?.stockQuantity && selectedSku.stockQuantity <= 3 ? (
                <p className="text-destructive text-sm font-medium mt-2">
                  Only {selectedSku.stockQuantity} left in your size!
                </p>
              ) : null}
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-border/50">
              <Button 
                size="lg" 
                className="w-full rounded-none tracking-widest uppercase font-bold h-14"
                onClick={handleAddToCart}
                disabled={!selectedSku}
              >
                {selectedSku ? "Add to Cart" : "Select a Size"}
              </Button>
            </div>

            {/* Additional Info */}
            <div className="pt-8 space-y-4 text-sm text-muted-foreground">
              {product.material && (
                <div className="grid grid-cols-3 py-3 border-b border-border/50">
                  <span className="font-bold uppercase tracking-wider text-xs text-foreground">Material</span>
                  <span className="col-span-2">{product.material}</span>
                </div>
              )}
              {product.brand && (
                <div className="grid grid-cols-3 py-3 border-b border-border/50">
                  <span className="font-bold uppercase tracking-wider text-xs text-foreground">Brand</span>
                  <span className="col-span-2">{product.brand}</span>
                </div>
              )}
              <div className="grid grid-cols-3 py-3 border-b border-border/50">
                <span className="font-bold uppercase tracking-wider text-xs text-foreground">Shipping</span>
                <span className="col-span-2">Free standard shipping on orders over $150. Returns accepted within 30 days.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
