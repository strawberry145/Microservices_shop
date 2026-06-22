import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Cart() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();

  const handleUpdateQuantity = (skuId: number, current: number, delta: number) => {
    const next = current + delta;
    if (next < 1) {
      removeItem(skuId);
      toast.success("Item removed from cart");
    } else {
      updateQuantity(skuId, next);
    }
  };

  const handleRemove = (skuId: number) => {
    removeItem(skuId);
    toast.success("Item removed from cart");
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 md:py-20 flex-1">
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-foreground mb-8">Your Cart</h1>
        
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-border/50 bg-secondary/20">
            <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6">
              <ShoppingBagIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-serif mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8 max-w-md font-serif italic">
              Looks like you haven't added anything to your cart yet. Discover our latest arrivals to find your perfect pair.
            </p>
            <Button size="lg" asChild className="rounded-none tracking-widest uppercase font-bold px-12">
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="hidden sm:grid grid-cols-12 gap-4 pb-4 border-b border-border/50 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <div className="col-span-6">Product</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>

              {/* Items */}
              <ul className="space-y-6 sm:space-y-0">
                {items.map((item) => (
                  <li key={item.skuId} className="flex flex-col sm:grid sm:grid-cols-12 gap-4 py-6 border-b border-border/50 items-center">
                    <div className="col-span-12 sm:col-span-6 flex items-center gap-4 w-full">
                      <Link href={`/shop/${item.productId}`} className="shrink-0">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-24 h-32 object-cover bg-secondary" />
                        ) : (
                          <div className="w-24 h-32 bg-secondary flex items-center justify-center text-xs text-muted-foreground italic">No image</div>
                        )}
                      </Link>
                      <div className="flex flex-col">
                        <Link href={`/shop/${item.productId}`} className="font-serif text-lg hover:text-primary/70 transition-colors">
                          {item.productName}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">${item.price.toFixed(2)}</p>
                        <div className="flex gap-3 text-sm mt-2 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            Size: <strong className="text-foreground">{item.sizeEu}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            Color: <strong className="text-foreground capitalize">{item.colour}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-12 sm:col-span-3 flex sm:justify-center items-center w-full sm:w-auto justify-between mt-4 sm:mt-0">
                      <div className="flex items-center border border-border">
                        <button 
                          onClick={() => handleUpdateQuantity(item.skuId, item.quantity, -1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.skuId, item.quantity, 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      
                      <div className="sm:hidden font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="col-span-2 hidden sm:flex justify-end items-center font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    
                    <div className="col-span-1 hidden sm:flex justify-end items-center">
                      <button 
                        onClick={() => handleRemove(item.skuId)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-2"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-secondary/30 p-6 border border-border/50 sticky top-24">
                <h2 className="text-2xl font-serif tracking-tight mb-6">Order Summary</h2>
                
                <div className="space-y-4 text-sm mb-6 pb-6 border-b border-border/50">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxes</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-8 font-serif text-xl">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                <Button size="lg" className="w-full rounded-none tracking-widest uppercase font-bold flex items-center justify-center gap-2" asChild>
                  <Link href="/checkout">
                    Proceed to Checkout <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                
                <p className="text-xs text-center text-muted-foreground mt-4 font-serif italic">
                  Taxes and shipping calculated at checkout.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function ShoppingBagIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
