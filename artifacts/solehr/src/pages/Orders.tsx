import { useLocation, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useListOrders } from "@workspace/api-client-react";
import { useAuthStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Package, ArrowRight } from "lucide-react";

export default function Orders() {
  const [, setLocation] = useLocation();
  const { token } = useAuthStore();

  if (!token) {
    setLocation("/login");
    return null;
  }

  const { data: orders, isLoading } = useListOrders();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 md:py-20 flex-1">
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-foreground mb-4">Order History</h1>
        <p className="text-muted-foreground font-serif italic mb-12 text-lg">Track and review your past purchases.</p>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border border-border/50 bg-secondary/10 flex flex-col md:flex-row">
                {/* Order Header Info */}
                <div className="p-6 border-b md:border-b-0 md:border-r border-border/50 md:w-64 shrink-0 bg-secondary/30">
                  <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Order #{order.id}</p>
                  <p className="font-medium mb-4">{format(new Date(order.createdAt), "MMMM d, yyyy")}</p>
                  
                  <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                  <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs uppercase tracking-wider font-bold mb-4">
                    {order.status}
                  </span>
                  
                  <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Total</p>
                  <p className="font-serif text-xl">${order.total.toFixed(2)}</p>
                </div>
                
                {/* Order Summary & Actions */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-20 bg-secondary shrink-0 border border-border/50">
                        {order.primaryImage && <img src={order.primaryImage} alt="Product" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-medium">{order.itemCount} Item{order.itemCount !== 1 ? 's' : ''}</p>
                        {order.trackingNumber && (
                          <p className="text-sm text-muted-foreground mt-1">Tracking: {order.trackingNumber}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-border/50">
                    <Button asChild variant="outline" className="rounded-none uppercase tracking-widest font-bold text-xs">
                      <Link href={`/orders/${order.id}`}>View Details <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-border/50 bg-secondary/20">
            <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-serif mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md font-serif italic">
              When you place an order, it will appear here.
            </p>
            <Button size="lg" asChild className="rounded-none tracking-widest uppercase font-bold px-12">
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
