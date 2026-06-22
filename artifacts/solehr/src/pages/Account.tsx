import { useLocation, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useGetMe, useListOrders, useListAddresses, useDeleteAddress } from "@workspace/api-client-react";
import { useAuthStore } from "@/lib/store";
import { Loader2, LogOut, Package, MapPin, Heart } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Account() {
  const [, setLocation] = useLocation();
  const { token, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isLoadingUser, error } = useGetMe({ 
    query: { 
      retry: false,
      enabled: !!token
    } 
  });
  
  const { data: orders, isLoading: isLoadingOrders } = useListOrders({
    query: { enabled: !!user }
  });

  const { data: addresses, isLoading: isLoadingAddresses } = useListAddresses({
    query: { enabled: !!user }
  });

  const deleteAddress = useDeleteAddress();

  if (!token || error) {
    setLocation("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    queryClient.clear();
    toast.success("Logged out successfully");
    setLocation("/");
  };

  const handleDeleteAddress = (id: number) => {
    if (confirm("Are you sure you want to delete this address?")) {
      deleteAddress.mutate(
        { id },
        {
          onSuccess: () => {
            toast.success("Address deleted");
            queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
          },
          onError: () => toast.error("Failed to delete address")
        }
      );
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-border/50 pb-8">
          <div>
            <h1 className="text-4xl font-serif tracking-tight text-foreground">My Account</h1>
            {isLoadingUser ? (
              <Skeleton className="h-6 w-48 mt-2" />
            ) : (
              <p className="text-muted-foreground font-serif italic text-lg mt-2">
                Welcome back, {user?.fullName || user?.email}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={handleLogout} className="rounded-none tracking-widest font-bold uppercase">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Quick Links / Sidebar */}
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start rounded-none text-left font-serif text-lg py-6 bg-secondary/50">
              <UserIcon className="mr-4 h-5 w-5" /> Profile Overview
            </Button>
            <Button variant="ghost" className="w-full justify-start rounded-none text-left font-serif text-lg py-6" asChild>
              <Link href="/orders"><Package className="mr-4 h-5 w-5" /> Order History</Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start rounded-none text-left font-serif text-lg py-6" asChild>
              <Link href="/wishlist"><Heart className="mr-4 h-5 w-5" /> Saved Items</Link>
            </Button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-16">
            
            {/* Recent Orders */}
            <section>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-serif tracking-tight">Recent Orders</h2>
                <Link href="/orders" className="text-sm uppercase tracking-widest font-bold hover:text-primary/70 transition-colors underline underline-offset-4">
                  View All
                </Link>
              </div>

              {isLoadingOrders ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border/50 gap-4">
                      <div>
                        <p className="font-bold">Order #{order.id}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(order.createdAt), "MMM d, yyyy")}</p>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:gap-1">
                        <span className="capitalize text-sm font-medium px-2 py-1 bg-secondary text-secondary-foreground">{order.status}</span>
                        <p className="font-medium">${order.total.toFixed(2)}</p>
                      </div>
                      <Button variant="outline" className="sm:hidden rounded-none" asChild>
                        <Link href={`/orders/${order.id}`}>View Details</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-border/50 bg-secondary/20">
                  <p className="text-muted-foreground font-serif italic mb-4">You haven't placed any orders yet.</p>
                  <Button asChild className="rounded-none tracking-widest uppercase font-bold">
                    <Link href="/shop">Start Shopping</Link>
                  </Button>
                </div>
              )}
            </section>

            {/* Saved Addresses */}
            <section>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-serif tracking-tight">Saved Addresses</h2>
              </div>

              {isLoadingAddresses ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : addresses && addresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="p-4 border border-border/50 relative">
                      {address.isDefault && (
                        <span className="absolute top-4 right-4 text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-2 py-1">Default</span>
                      )}
                      <h3 className="font-bold mb-2">{address.label}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {address.street}<br />
                        {address.city}, {address.country} {address.postalCode}
                      </p>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 -ml-2" onClick={() => handleDeleteAddress(address.id)}>
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-border/50 bg-secondary/20">
                  <p className="text-muted-foreground font-serif italic">No saved addresses.</p>
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function UserIcon(props: any) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
