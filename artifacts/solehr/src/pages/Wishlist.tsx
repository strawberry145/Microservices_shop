import { useLocation, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useGetWishlist, useRemoveFromWishlist } from "@workspace/api-client-react";
import { useAuthStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ProductCard } from "@/components/shared/ProductCard";
import { HeartCrack, Heart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Wishlist() {
  const [, setLocation] = useLocation();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  if (!token) {
    setLocation("/login");
    return null;
  }

  const { data: wishlistItems, isLoading } = useGetWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const handleRemove = (productId: number) => {
    removeFromWishlist.mutate(
      { id: productId },
      {
        onSuccess: () => {
          toast.success("Item removed from wishlist");
          queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
        },
        onError: () => toast.error("Failed to remove item")
      }
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 md:py-20 flex-1">
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-foreground mb-4">Your Wishlist</h1>
        <p className="text-muted-foreground font-serif italic mb-12 text-lg">Curated pieces waiting for you.</p>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[3/4] w-full rounded-none" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        ) : wishlistItems && wishlistItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {wishlistItems.map((item) => (
              <div key={item.id} className="relative group">
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 z-30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background backdrop-blur-sm shadow-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(item.productId);
                  }}
                  title="Remove from wishlist"
                >
                  <HeartCrack className="h-4 w-4 text-foreground" />
                </Button>
                <ProductCard product={item.product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-border/50 bg-secondary/20">
            <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-serif mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-8 max-w-md font-serif italic">
              Save your favorite items here while you decide.
            </p>
            <Button size="lg" asChild className="rounded-none tracking-widest uppercase font-bold px-12">
              <Link href="/shop">Explore Collection</Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
