import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, AlertCircle, Mail, KeyRound } from "lucide-react";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnconfirmed, setIsUnconfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot password state
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithEmailOrUapId, resetPassword, resendConfirmationEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setIsUnconfirmed(false);

    try {
      const { data, error } = await signInWithEmailOrUapId(identifier, password);

      if (error) {
        setErrorMessage(error.message);
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setIsUnconfirmed(true);
        }
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (data.session) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during login.";
      setErrorMessage(msg);
      toast({
        title: "Login failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const emailToResend = identifier.includes("@") ? identifier : `${identifier}@uap-bd.edu`;
    const { error } = await resendConfirmationEmail(emailToResend);
    if (error) {
      toast({
        title: "Resend failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Verification email sent",
        description: `Confirmation link has been resent to ${emailToResend}. Please check your inbox.`,
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setIsResetting(true);

    try {
      const { error } = await resetPassword(resetEmail);
      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password reset email sent",
          description: `Instructions have been sent to ${resetEmail}`,
        });
        setResetDialogOpen(false);
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div
            id="login-error-banner"
            role="alert"
            aria-live="polite"
            className="p-3.5 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20 space-y-2"
          >
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
            {isUnconfirmed && (
              <div className="pt-1 border-t border-destructive/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendConfirmation}
                  className="w-full text-xs gap-1.5 border-destructive/30 hover:bg-destructive/10 text-destructive min-h-[44px]"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  Resend Verification Email
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="uap_id">UAP ID or Email</Label>
          <Input
            id="uap_id"
            type="text"
            placeholder="Enter your UAP ID or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
            className="min-h-[44px]"
            aria-describedby={errorMessage ? "login-error-banner" : undefined}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="link" className="px-0 font-normal text-xs text-primary h-auto">
                  Forgot Password?
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
                      Reset Your Password
                    </DialogTitle>
                    <DialogDescription>
                      Enter your registered email address to receive password reset instructions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">Registered Email</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="your.email@domain.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="min-h-[44px]"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isResetting} className="min-h-[44px] w-full sm:w-auto">
                      {isResetting ? "Sending..." : "Send Password Reset Email"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="min-h-[44px] pr-10"
              aria-describedby={errorMessage ? "login-error-banner" : undefined}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        <Button type="submit" className="w-full min-h-[44px]" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </CardContent>
  );
}
