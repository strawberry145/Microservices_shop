import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, useGetMe } from "@workspace/api-client-react";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const login = useLogin();
  const setToken = useAuthStore(state => state.setToken);
  const { data: user, isLoading: isCheckingAuth } = useGetMe({ query: { retry: false } });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (user && !isCheckingAuth) {
    setLocation("/account");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          setToken(data.token);
          toast.success("Welcome back to SoleHer");
          setLocation("/account");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to login. Please check your credentials.");
        }
      }
    );
  };

  return (
    <AppLayout>
      <div className="flex-1 flex items-center justify-center py-12 px-4 bg-secondary/30">
        <div className="w-full max-w-md bg-background p-8 border border-border/50 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif tracking-tight text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground font-serif italic">Sign in to your SoleHer account.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4">
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-none border-border focus-visible:ring-primary"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full rounded-none tracking-widest font-bold uppercase" 
              disabled={login.isPending}
            >
              {login.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-foreground hover:text-primary transition-colors font-medium underline underline-offset-4">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
