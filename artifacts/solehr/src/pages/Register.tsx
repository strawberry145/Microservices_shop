import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister, useGetMe } from "@workspace/api-client-react";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const register = useRegister();
  const setToken = useAuthStore(state => state.setToken);
  const { data: user, isLoading: isCheckingAuth } = useGetMe({ query: { retry: false } });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (user && !isCheckingAuth) {
    setLocation("/account");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    register.mutate(
      { data: { fullName, email, password } },
      {
        onSuccess: (data) => {
          setToken(data.token);
          toast.success("Account created successfully");
          setLocation("/account");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to register. Please try again.");
        }
      }
    );
  };

  return (
    <AppLayout>
      <div className="flex-1 flex items-center justify-center py-12 px-4 bg-secondary/30">
        <div className="w-full max-w-md bg-background p-8 border border-border/50 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif tracking-tight text-foreground mb-2">Create Account</h1>
            <p className="text-muted-foreground font-serif italic">Join SoleHer for exclusive benefits.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                type="text" 
                required 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-none border-border focus-visible:ring-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-none border-border focus-visible:ring-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-none border-border focus-visible:ring-primary"
              />
              <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full rounded-none tracking-widest font-bold uppercase" 
              disabled={register.isPending}
            >
              {register.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
            </Button>
          </form>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground hover:text-primary transition-colors font-medium underline underline-offset-4">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
