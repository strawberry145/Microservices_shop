import { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListProducts } from "@workspace/api-client-react";
import { ProductCard } from "@/components/shared/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon } from "lucide-react";

export default function Search() {
  const [searchParams] = useLocation();
  const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  const { data: results, isLoading } = useListProducts(
    { search: activeQuery, limit: 24 },
    { query: { enabled: activeQuery.length > 0 } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setActiveQuery(query.trim());
      // Update URL without reloading
      window.history.pushState({}, '', `/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 md:py-20 flex-1">
        <div className="max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-serif tracking-tight text-center mb-8">Search</h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by brand, style, name..."
                className="pl-12 h-14 rounded-none border-border text-lg focus-visible:ring-primary bg-secondary/10"
                autoFocus
              />
            </div>
            <Button type="submit" className="h-14 px-8 rounded-none tracking-widest uppercase font-bold">
              Search
            </Button>
          </form>
        </div>

        {activeQuery && (
          <div>
            <h2 className="text-xl font-serif mb-8 border-b border-border/50 pb-4">
              Results for "{activeQuery}" 
              <span className="text-muted-foreground text-base ml-2">
                ({results?.total || 0})
              </span>
            </h2>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <Skeleton className="aspect-[3/4] w-full rounded-none" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ))}
              </div>
            ) : results && results.items.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {results.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-muted-foreground font-serif italic">
                No products found matching your search. Try different keywords.
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
