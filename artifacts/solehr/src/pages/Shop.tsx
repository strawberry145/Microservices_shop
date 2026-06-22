import { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListProducts, useGetCatalogueStats, ListProductsSort } from "@workspace/api-client-react";
import { ProductCard } from "@/components/shared/ProductCard";
import { FilterSidebar } from "@/components/shared/FilterSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Shop() {
  const [searchParams] = useLocation();
  // Simple extraction of initial style if coming from a link
  const initialStyle = new URLSearchParams(window.location.search).get("style") || undefined;
  
  const [filters, setFilters] = useState<any>({
    style: initialStyle
  });
  const [sort, setSort] = useState<ListProductsSort>(ListProductsSort.newest);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const { data: stats } = useGetCatalogueStats();
  
  const { data: productResponse, isLoading } = useListProducts({
    ...filters,
    sort,
    limit: 24,
  });

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 md:py-20 flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 pb-6 border-b border-border/50">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-foreground mb-4">
              {filters.style ? <span className="capitalize">{filters.style}</span> : "All Collection"}
            </h1>
            <p className="text-muted-foreground font-serif italic text-lg">
              {productResponse ? `${productResponse.total} Products` : 'Loading...'}
            </p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden flex-1 rounded-none uppercase tracking-widest font-bold">
                  <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/30">
                    <h2 className="font-serif tracking-tight text-2xl">Filters</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileFiltersOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <FilterSidebar stats={stats} filters={filters} setFilters={setFilters} />
                  </div>
                  <div className="p-4 border-t border-border bg-background">
                    <Button className="w-full rounded-none tracking-widest uppercase font-bold" onClick={() => setIsMobileFiltersOpen(false)}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Select value={sort} onValueChange={(v) => setSort(v as ListProductsSort)}>
              <SelectTrigger className="w-full md:w-[200px] rounded-none border-border focus:ring-primary uppercase tracking-widest font-bold text-xs h-10">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                <SelectItem value={ListProductsSort.newest}>Newest</SelectItem>
                <SelectItem value={ListProductsSort.price_asc}>Price: Low to High</SelectItem>
                <SelectItem value={ListProductsSort.price_desc}>Price: High to Low</SelectItem>
                <SelectItem value={ListProductsSort.popular}>Popularity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Desktop Filters */}
          <div className="hidden md:block w-[240px] shrink-0 sticky top-24 h-[calc(100vh-100px)] overflow-y-auto pr-4 custom-scrollbar">
            <FilterSidebar stats={stats} filters={filters} setFilters={setFilters} />
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                {Array(12).fill(0).map((_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <Skeleton className="aspect-[3/4] w-full rounded-none" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ))}
              </div>
            ) : productResponse && productResponse.items.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                {productResponse.items.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center border border-border/50 bg-secondary/20">
                <h3 className="text-2xl font-serif mb-2">No products found</h3>
                <p className="text-muted-foreground font-serif italic mb-6">Try adjusting your filters to see more results.</p>
                <Button variant="outline" onClick={() => setFilters({})} className="rounded-none uppercase tracking-widest font-bold">
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
