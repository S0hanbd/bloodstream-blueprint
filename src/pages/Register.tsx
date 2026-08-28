import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { maskNumericId, maskPhoneNumber, validatePhoneNumber } from "@/logic/masking";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Droplets, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function Register() {
  usePageTitle("Register as Donor");
  const [formData, setFormData] = useState({
    uap_id: "",
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    phone_number: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();

  const validateUapId = (uapId: string) => {
    return uapId.length >= 5;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const newErrors: Record<string, string> = {};

    if (!validateUapId(formData.uap_id)) {
      newErrors.uap_id = "Please enter a valid numeric UAP ID (at least 5 digits)";
    }

    if (!validatePhoneNumber(formData.phone_number)) {
      newErrors.phone_number = "Please enter a valid phone number (e.g., +880 1711-223344 or 01711223344)";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      toast({
        title: "Validation Error",
        description: "Please fix the errors indicated in the form below.",
        variant: "destructive",
      });
      return;
    }

    setErrors({});

    try {
      const email = formData.email || `${formData.uap_id}@uap-bd.edu`;
      
      const { data, error } = await signUp(email, formData.password, {
        full_name: formData.full_name,
        phone: formData.phone_number,
        uap_id: formData.uap_id,
      });

      if (error) {
        setErrors({ general: error.message });
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        const isConfirmed = Boolean(data.session);
        toast({
          title: "Registration successful",
          description: isConfirmed 
            ? "Welcome to UAP Blood Bank!" 
            : `Account created! Check your email (${email}) to confirm your account if required, then login.`,
        });
        navigate("/login");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "An error occurred during registration";
      setErrors({ general: msg });
      toast({
        title: "Registration failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <Droplets className="h-12 w-12 text-accent" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl">Register for UAP Blood Bank</CardTitle>
            <CardDescription>
              Create an account to find blood donors or become one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{errors.general}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="uap_id">UAP ID</Label>
                <Input
                  id="uap_id"
                  inputMode="numeric"
                  placeholder="e.g. 14101095"
                  value={formData.uap_id}
                  onChange={(e) => setFormData({ ...formData, uap_id: maskNumericId(e.target.value) })}
                  required
                  aria-invalid={Boolean(errors.uap_id)}
                  aria-describedby={errors.uap_id ? "uap_id-error" : undefined}
                />
                {errors.uap_id && (
                  <p id="uap_id-error" className="text-xs text-destructive mt-1">
                    {errors.uap_id}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email (optional)"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g. +880 1711-223344"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: maskPhoneNumber(e.target.value) })}
                  required
                  aria-invalid={Boolean(errors.phone_number)}
                  aria-describedby={errors.phone_number ? "phone_number-error" : undefined}
                />
                {errors.phone_number && (
                  <p id="phone_number-error" className="text-xs text-destructive mt-1">
                    {errors.phone_number}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "password-error" : undefined}
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
                {errors.password && (
                  <p id="password-error" className="text-xs text-destructive mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="text-xs text-destructive mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full min-h-[44px]" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Register"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline min-h-[44px] inline-flex items-center">
                Login here
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
