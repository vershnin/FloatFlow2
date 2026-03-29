import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await requestPasswordReset(email);
    setSent(true);
    setIsLoading(false);
    toast.success("Reset link sent!");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight">FloatFlow</span>
        </div>

        <div className="glass-card-elevated p-8">
          {sent ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
              </div>
              <h1 className="text-xl font-bold">Check your email</h1>
              <p className="text-sm text-muted-foreground mt-2">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <Link to="/login">
                <Button variant="outline" className="mt-6 w-full">Back to Login</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold">Forgot password?</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email and we'll send you a reset link
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
              <Link to="/login" className="flex items-center justify-center gap-1 mt-4 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3 w-3" /> Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
