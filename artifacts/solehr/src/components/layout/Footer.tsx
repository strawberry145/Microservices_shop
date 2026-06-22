import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-12 md:py-16 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="font-serif text-3xl tracking-tighter mb-4 block">
            SoleHer.
          </Link>
          <p className="text-primary-foreground/70 max-w-sm font-serif italic">
            Curated women's footwear for the modern, confident individual. 
            Crafted with intention. Worn with pride.
          </p>
        </div>
        
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-6">Shop</h4>
          <ul className="space-y-4">
            <li><Link href="/shop" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">All Shoes</Link></li>
            <li><Link href="/shop?style=heels" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Heels</Link></li>
            <li><Link href="/shop?style=boots" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Boots</Link></li>
            <li><Link href="/shop?style=sneakers" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Sneakers</Link></li>
            <li><Link href="/shop?sale=true" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Sale</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-6">Customer Care</h4>
          <ul className="space-y-4">
            <li><Link href="/account" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">My Account</Link></li>
            <li><Link href="/orders" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Track Order</Link></li>
            <li><span className="text-primary-foreground/70 cursor-not-allowed">Shipping & Returns</span></li>
            <li><span className="text-primary-foreground/70 cursor-not-allowed">Size Guide</span></li>
            <li><span className="text-primary-foreground/70 cursor-not-allowed">Contact Us</span></li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/50">
        <p>&copy; {new Date().getFullYear()} SoleHer. All rights reserved.</p>
        <div className="flex gap-6">
          <span className="cursor-not-allowed hover:text-primary-foreground transition-colors">Privacy Policy</span>
          <span className="cursor-not-allowed hover:text-primary-foreground transition-colors">Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}
