import { useRoute, Link, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useGetOrder } from "@workspace/api-client-react";
import { useAuthStore, useCartStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Package, ArrowLeft, Check, Truck, Home } from "lucide-react";
import { toast } from "sonner";

export default function OrderTracking() {
  const [, params] = useRoute("/orders/:id");
  const [, setLocation] = useLocation();
  const orderId = params?.id ? parseInt(params.id) : 0;
  const { token } = useAuthStore();
  const { addItem } = useCartStore();

  if (!token) {
    setLocation("/login");
    return null;
  }

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { enabled: !!orderId && !!token }
  });

  const handleReorder = () => {
    if (!order) return;
    
    order.items.forEach(item => {
      addItem({
        skuId: item.skuId,
        productId: item.sku.productId,
        productName: item.productName || "Shoe",
        productImage: item.productImage,
        colour: item.sku.colour,
        sizeEu: item.sku.sizeEu,
        price: item.sku.price,
        quantity: item.quantity
      });
    });
    
    toast.success("Items added to cart");
    setLocation("/cart");
  };

  const getStatusStep = (status: string) => {
    switch(status) {
      case 'pending': return 1;
      case 'confirmed': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-32 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!order) return null;

  const currentStep = getStatusStep(order.status);
  const isCancelled = currentStep === -1;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        <Link href="/orders" className="inline-flex items-center text-sm font-medium hover:text-primary/70 transition-colors mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-serif tracking-tight text-foreground mb-2">Order #{order.id}</h1>
            <p className="text-muted-foreground">Placed on {format(new Date(order.createdAt), "MMMM d, yyyy")}</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="rounded-none uppercase tracking-widest font-bold" onClick={handleReorder}>
              Order Again
            </Button>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-secondary/10 border border-border/50 p-8 mb-12">
          <h2 className="font-serif text-2xl mb-8">Tracking Status</h2>
          
          {isCancelled ? (
            <div className="p-4 bg-destructive/10 text-destructive font-bold text-center">
              This order has been cancelled.
            </div>
          ) : (
            <div className="relative">
              {/* Line */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-border z-0">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(Math.max(0, currentStep - 1) / 3) * 100}%` }}
                />
              </div>
              
              {/* Steps */}
              <div className="relative z-10 flex justify-between">
                {[
                  { label: "Order Placed", icon: Package, step: 1 },
                  { label: "Confirmed", icon: Check, step: 2 },
                  { label: "Shipped", icon: Truck, step: 3 },
                  { label: "Delivered", icon: Home, step: 4 }
                ].map((s) => {
                  const isCompleted = currentStep >= s.step;
                  const isCurrent = currentStep === s.step;
                  const Icon = s.icon;
                  
                  return (
                    <div key={s.step} className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors
                        ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground'}`
                      }>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className={`mt-3 text-sm font-bold uppercase tracking-wider text-center ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {s.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {order.trackingNumber && (
            <div className="mt-12 p-4 bg-background border border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-1">Carrier</p>
                <p className="font-medium">{order.carrier || 'Standard Shipping'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-1">Tracking Number</p>
                <p className="font-medium font-mono">{order.trackingNumber}</p>
              </div>
              {order.estimatedDelivery && (
                <div>
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-1">Est. Delivery</p>
                  <p className="font-medium">{format(new Date(order.estimatedDelivery), "MMM d, yyyy")}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <h3 className="font-serif text-xl mb-6 pb-2 border-b border-border/50">Items</h3>
            <ul className="space-y-6">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4">
                  <div className="w-20 h-28 bg-secondary shrink-0 border border-border/50">
                    {item.productImage && (
                      <img src={item.productImage} alt={item.productName || 'Product'} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="font-medium text-lg mb-1">{item.productName}</p>
                    <p className="text-sm text-muted-foreground mb-2">Size EU {item.sku.sizeEu} / {item.sku.colour}</p>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                      <span className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-8">
            <div className="bg-secondary/10 p-6 border border-border/50">
              <h3 className="font-serif text-xl mb-6">Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${(order.total - 15 - (order.total * 0.08)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>$15.00</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxes</span>
                  <span>${(order.total * 0.08).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-4 mt-2 border-t border-border/50 font-serif text-2xl">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {order.shippingAddress && (
              <div className="bg-secondary/10 p-6 border border-border/50">
                <h3 className="font-serif text-xl mb-4">Shipping Address</h3>
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">{order.shippingAddress.label}</p>
                  <p className="text-muted-foreground">{order.shippingAddress.street}</p>
                  <p className="text-muted-foreground">{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                  <p className="text-muted-foreground">{order.shippingAddress.country}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
