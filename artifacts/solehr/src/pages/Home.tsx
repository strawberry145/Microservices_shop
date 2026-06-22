import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetFeaturedProducts, useGetNewArrivals } from "@workspace/api-client-react";
import { ProductCard } from "@/components/shared/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const { data: featuredProducts, isLoading: isLoadingFeatured } = useGetFeaturedProducts({ limit: 4 });
  const { data: newArrivals, isLoading: isLoadingNew } = useGetNewArrivals({ limit: 8 });

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden bg-secondary">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=2000&auto=format&fit=crop" 
            alt="Hero background showing elegant shoes" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent mix-blend-multiply" />
        </div>
        
        <div className="container relative z-10 px-4 flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif tracking-tighter text-foreground drop-shadow-sm">
            Step Into <br/>Confidence.
          </h1>
          <p className="text-lg md:text-xl font-serif italic text-foreground/80 max-w-xl drop-shadow-sm">
            Curated footwear for the modern woman. Effortless style meets uncompromising quality.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button size="lg" className="rounded-none px-8 font-bold tracking-widest uppercase" asChild>
              <Link href="/shop">Shop Collection</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-none px-8 font-bold tracking-widest uppercase bg-background/50 backdrop-blur border-primary/20" asChild>
              <Link href="/shop?style=heels">Explore Heels</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-20 md:py-32 container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 h-[600px]">
          <Link href="/shop?style=boots" className="group relative overflow-hidden block h-full md:col-span-2">
            <img 
              src="https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=800&auto=format&fit=crop" 
              alt="Boots" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
            <div className="absolute bottom-8 left-8">
              <h2 className="text-3xl font-serif text-white tracking-tight mb-2">The Boot Edit</h2>
              <span className="inline-flex items-center text-white/90 text-sm font-bold tracking-widest uppercase group-hover:underline underline-offset-4">
                Shop Now <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </div>
          </Link>
          
          <div className="flex flex-col gap-4 md:gap-8 h-full">
            <Link href="/shop?style=heels" className="group relative overflow-hidden block flex-1">
              <img 
                src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=600&auto=format&fit=crop" 
                alt="Heels" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
              <div className="absolute bottom-6 left-6">
                <h2 className="text-2xl font-serif text-white tracking-tight mb-1">Evening Heels</h2>
                <span className="inline-flex items-center text-white/90 text-xs font-bold tracking-widest uppercase">
                  Shop Now <ArrowRight className="ml-1 h-3 w-3" />
                </span>
              </div>
            </Link>
            
            <Link href="/shop?style=sneakers" className="group relative overflow-hidden block flex-1">
              <img 
                src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600&auto=format&fit=crop" 
                alt="Sneakers" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
              <div className="absolute bottom-6 left-6">
                <h2 className="text-2xl font-serif text-white tracking-tight mb-1">Everyday Sneakers</h2>
                <span className="inline-flex items-center text-white/90 text-xs font-bold tracking-widest uppercase">
                  Shop Now <ArrowRight className="ml-1 h-3 w-3" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-secondary/30">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif tracking-tight text-foreground">Bestsellers</h2>
              <p className="text-muted-foreground font-serif italic mt-2">Loved by everyone, curated for you.</p>
            </div>
            <Link href="/shop" className="hidden sm:inline-flex items-center text-sm font-bold tracking-widest uppercase hover:text-primary/70 transition-colors">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {isLoadingFeatured ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-[3/4] w-full rounded-none" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))
            ) : featuredProducts && featuredProducts.length > 0 ? (
              featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="col-span-full text-center py-10 text-muted-foreground">No featured products found.</p>
            )}
          </div>
          
          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" className="w-full rounded-none tracking-widest uppercase font-bold" asChild>
              <Link href="/shop">View All</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-20 md:py-32 container px-4 mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif tracking-tight text-foreground mb-4">New Arrivals</h2>
          <p className="text-muted-foreground font-serif italic text-lg">
            Fresh styles for the new season. Discover the latest additions to our collection.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {isLoadingNew ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[3/4] w-full rounded-none" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))
          ) : newArrivals && newArrivals.length > 0 ? (
            newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <p className="col-span-full text-center py-10 text-muted-foreground">No new arrivals found.</p>
          )}
        </div>
        
        <div className="mt-16 flex justify-center">
          <Button size="lg" className="rounded-none px-12 font-bold tracking-widest uppercase" asChild>
            <Link href="/shop">Shop New Arrivals</Link>
          </Button>
        </div>
      </section>
      
      {/* Newsletter */}
      <section className="bg-primary text-primary-foreground py-24 px-4 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-serif tracking-tight">Join The Club</h2>
          <p className="font-serif italic text-primary-foreground/80 text-lg">
            Sign up for 10% off your first order, exclusive access to sales, and early drops.
          </p>
          <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-4" onSubmit={e => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Email Address" 
              className="flex-1 bg-transparent border-b border-primary-foreground/30 px-4 py-3 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:border-primary-foreground transition-colors"
              required
            />
            <Button type="submit" variant="secondary" className="rounded-none px-8 font-bold tracking-widest uppercase shrink-0 mt-4 sm:mt-0">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </AppLayout>
  );
}
