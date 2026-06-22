import { useRoute, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useGetOrder } from "@workspace/api-client-react";
import { CheckCircle2, ChevronRight, Download, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function OrderConfirmation() {
  const [, params] = useRoute("/order-confirmation/:id");
  const orderId = params?.id ? parseInt(params.id) : 0;

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { enabled: !!orderId, retry: false }
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 max-w-3xl flex flex-col items-center">
          <Skeleton className="h-16 w-16 rounded-full mb-6" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-12" />
          <div className="w-full space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-3xl font-serif mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-8">We couldn't find the details for this order.</p>
          <Button asChild><Link href="/shop">Continue Shopping</Link></Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-foreground mb-4">
            Thank you for your order
          </h1>
          <p className="text-lg text-muted-foreground font-serif italic max-w-xl">
            We've received your order and will begin processing it right away. 
            A confirmation email has been sent.
          </p>
        </div>

        <div className="bg-secondary/20 border border-border/50 p-6 md:p-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-8 border-b border-border/50">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Order Number</p>
              <p className="text-2xl font-serif">#{order.id}</p>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Date</p>
              <p className="text-lg">{format(new Date(order.createdAt), "MMMM d, yyyy")}</p>
            </div>
            <div>
              <Button variant="outline" className="rounded-none uppercase tracking-widest font-bold text-xs" asChild>
                <Link href={`/orders/${order.id}`}>
                  <Package className="mr-2 h-4 w-4" /> Track Order
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-serif text-xl mb-6">Order Items</h3>
              <ul className="space-y-6">
                {order.items.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    <div className="w-16 h-20 bg-secondary shrink-0">
                      {item.productImage && (
                        <img src={item.productImage} alt={item.productName || 'Product'} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">Size EU {item.sku.sizeEu} / {item.sku.colour}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-xl mb-6">Order Summary</h3>
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
                  <div className="flex justify-between pt-3 border-t border-border/50 font-serif text-xl">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {order.shippingAddress && (
                <div>
                  <h3 className="font-serif text-xl mb-4">Shipping Address</h3>
                  <div className="text-sm text-muted-foreground bg-background p-4 border border-border/50">
                    <p className="font-medium text-foreground mb-1">{order.shippingAddress.label}</p>
                    <p>{order.shippingAddress.street}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg" className="rounded-none uppercase tracking-widest font-bold px-12">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
