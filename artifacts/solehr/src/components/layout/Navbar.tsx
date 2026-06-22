import { Link } from "wouter";
import { useCartStore, useAuthStore } from "@/lib/store";
import { ShoppingBag, User, Search, Heart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const { token } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavLinks = () => (
    <>
      <Link href="/shop" className="text-sm font-medium uppercase tracking-wider hover:text-primary/70 transition-colors">Shop All</Link>
      <Link href="/shop?style=heels" className="text-sm font-medium uppercase tracking-wider hover:text-primary/70 transition-colors">Heels</Link>
      <Link href="/shop?style=boots" className="text-sm font-medium uppercase tracking-wider hover:text-primary/70 transition-colors">Boots</Link>
      <Link href="/shop?style=sneakers" className="text-sm font-medium uppercase tracking-wider hover:text-primary/70 transition-colors">Sneakers</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Mobile Menu & Search */}
        <div className="flex items-center gap-4 lg:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 -ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 py-6">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="font-serif text-2xl tracking-tighter">
                  SoleHer.
                </Link>
                <div className="flex flex-col gap-4 mt-8">
                  <NavLinks />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/search">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Link>
          </Button>
        </div>

        {/* Desktop Left: Nav Links */}
        <nav className="hidden lg:flex items-center gap-8 flex-1">
          <NavLinks />
        </nav>

        {/* Center: Logo */}
        <Link href="/" className="font-serif text-2xl md:text-3xl tracking-tighter hover:opacity-80 transition-opacity">
          SoleHer.
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2 md:gap-4 flex-1">
          <Button variant="ghost" size="icon" asChild className="hidden lg:inline-flex shrink-0">
            <Link href="/search">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Link>
          </Button>
          
          <Button variant="ghost" size="icon" asChild className="shrink-0 hidden sm:inline-flex">
            <Link href={token ? "/wishlist" : "/login"}>
              <Heart className="h-5 w-5" />
              <span className="sr-only">Wishlist</span>
            </Link>
          </Button>
          
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href={token ? "/account" : "/login"}>
              <User className="h-5 w-5" />
              <span className="sr-only">Account</span>
            </Link>
          </Button>
          
          <Button variant="ghost" size="icon" asChild className="shrink-0 relative">
            <Link href="/cart">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute 2 top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
