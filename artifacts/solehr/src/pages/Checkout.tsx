import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartStore, useAuthStore } from "@/lib/store";
import { useListAddresses, usePlaceOrder, useCreateAddress } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    street: "",
    city: "",
    country: "",
    postalCode: "",
  });

  const { data: addresses, isLoading: isLoadingAddresses } = useListAddresses({
    query: { enabled: !!token }
  });
  
  const placeOrder = usePlaceOrder();
  const createAddress = useCreateAddress();

  useEffect(() => {
    if (!token) {
      setLocation("/login?redirect=/checkout");
    }
  }, [token, setLocation]);

  useEffect(() => {
    if (items.length === 0) {
      setLocation("/cart");
    }
  }, [items, setLocation]);

  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId && !isNewAddress) {
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    } else if (addresses && addresses.length === 0) {
      setIsNewAddress(true);
    }
  }, [addresses]);

  if (!token || items.length === 0) return null;

  const subtotal = getSubtotal();
  const shipping = 15;
  const taxes = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + taxes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let finalAddressId = selectedAddressId;

      // Create address if new
      if (isNewAddress) {
        const addr = await createAddress.mutateAsync({ data: addressForm });
        finalAddressId = addr.id;
        queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      }

      if (!finalAddressId) {
        toast.error("Please select or enter a shipping address");
        return;
      }

      // Place order
      const orderItems = items.map(item => ({
        skuId: item.skuId,
        quantity: item.quantity
      }));

      const order = await placeOrder.mutateAsync({
        data: {
          items: orderItems,
          shippingAddressId: finalAddressId
        }
      });

      clearCart();
      toast.success("Order placed successfully!");
      setLocation(`/order-confirmation/${order.id}`);

    } catch (err: any) {
      toast.error(err.message || "Failed to place order. Please try again.");
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12">
        <Link href="/cart" className="inline-flex items-center text-sm font-medium hover:text-primary/70 transition-colors mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Cart
        </Link>
        
        <h1 className="text-4xl font-serif tracking-tight mb-8">Checkout</h1>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-7 space-y-12">
            
            {/* Shipping Details */}
            <section>
              <h2 className="text-2xl font-serif tracking-tight mb-6 pb-4 border-b border-border/50">1. Shipping Address</h2>
              
              {isLoadingAddresses ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-6">
                  {addresses && addresses.length > 0 && (
                    <RadioGroup 
                      value={isNewAddress ? "new" : selectedAddressId?.toString()} 
                      onValueChange={(val) => {
                        if (val === "new") {
                          setIsNewAddress(true);
                          setSelectedAddressId(null);
                        } else {
                          setIsNewAddress(false);
                          setSelectedAddressId(parseInt(val));
                        }
                      }}
                      className="gap-4"
                    >
                      {addresses.map((addr) => (
                        <div key={addr.id} className={`flex items-start space-x-3 p-4 border transition-colors ${selectedAddressId === addr.id && !isNewAddress ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                          <RadioGroupItem value={addr.id.toString()} id={`addr-${addr.id}`} className="mt-1" />
                          <div className="grid gap-1">
                            <Label htmlFor={`addr-${addr.id}`} className="font-bold text-base cursor-pointer">
                              {addr.label} {addr.isDefault && <span className="ml-2 text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-sm">Default</span>}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {addr.street}<br/>
                              {addr.city}, {addr.postalCode} {addr.country}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      <div className={`flex items-start space-x-3 p-4 border transition-colors ${isNewAddress ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                        <RadioGroupItem value="new" id="addr-new" className="mt-1" />
                        <Label htmlFor="addr-new" className="font-bold text-base cursor-pointer mt-0.5">
                          Use a new address
                        </Label>
                      </div>
                    </RadioGroup>
                  )}

                  {isNewAddress && (
                    <div className="bg-secondary/20 p-6 border border-border/50 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="label">Address Label (e.g. Work, Home)</Label>
                          <Input id="label" required={isNewAddress} value={addressForm.label} onChange={e => setAddressForm({...addressForm, label: e.target.value})} className="rounded-none bg-background" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="street">Street Address</Label>
                          <Input id="street" required={isNewAddress} value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} className="rounded-none bg-background" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input id="city" required={isNewAddress} value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="rounded-none bg-background" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Input id="postalCode" required={isNewAddress} value={addressForm.postalCode} onChange={e => setAddressForm({...addressForm, postalCode: e.target.value})} className="rounded-none bg-background" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="country">Country</Label>
                          <Input id="country" required={isNewAddress} value={addressForm.country} onChange={e => setAddressForm({...addressForm, country: e.target.value})} className="rounded-none bg-background" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Payment Section (UI Only) */}
            <section>
              <h2 className="text-2xl font-serif tracking-tight mb-6 pb-4 border-b border-border/50 flex items-center gap-2">
                2. Payment <ShieldCheck className="h-5 w-5 text-green-600" />
              </h2>
              
              <div className="bg-secondary/20 p-6 border border-border/50 text-center">
                <p className="text-muted-foreground font-serif italic mb-4">Secure payment processing is handled in the next step.</p>
                <div className="flex justify-center gap-2 text-muted-foreground/50">
                  <CreditCardIcon className="h-8 w-12" />
                  <PaypalIcon className="h-8 w-12" />
                  <ApplePayIcon className="h-8 w-12" />
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-5">
            <div className="bg-background border border-border/50 p-6 sticky top-24 shadow-sm">
              <h3 className="font-serif text-xl tracking-tight mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.skuId} className="flex gap-4">
                    <div className="w-16 h-20 bg-secondary shrink-0 overflow-hidden relative">
                      {item.productImage && <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />}
                      <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold z-10">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="font-medium text-sm leading-tight">{item.productName}</p>
                      <p className="text-xs text-muted-foreground mt-1">EU {item.sizeEu} / {item.colour}</p>
                      <p className="text-sm font-medium mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-border/50 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes (Estimated)</span>
                  <span>${taxes.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center pt-4 mt-2 border-t border-border/50 font-serif text-2xl">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full mt-8 rounded-none tracking-widest uppercase font-bold"
                disabled={placeOrder.isPending || createAddress.isPending || (!selectedAddressId && !isNewAddress)}
              >
                {placeOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Place Order
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

// Dummy icons
function CreditCardIcon(props: any) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>;
}
function PaypalIcon(props: any) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 11v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3a4 4 0 0 0 4-4V4a1 1 0 0 1 1-1h3a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4H7Z" /></svg>;
}
function ApplePayIcon(props: any) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 1.44C10.54 6.44 8 5 6 5a5.2 5.2 0 0 0-5.24 5.38C.76 16.39 8.67 22 12 22ZM12 5a2.53 2.53 0 0 1 2.53-2.53c0-1.45-1.12-2.47-2.53-2.47S9.47 1.02 9.47 2.47A2.53 2.53 0 0 1 12 5Z" /></svg>;
}
