import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { maskNumericId, maskPhoneNumber, validatePhoneNumber } from "@/logic/masking";
import { usePageTitle } from "@/hooks/usePageTitle";
import { authService } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Droplets, Eye, EyeOff, AlertCircle, User, Heart, Calendar, MapPin, GraduationCap } from "lucide-react";

export default function Register() {
  usePageTitle("Register - UAP Blood Bank");
  const [formData, setFormData] = useState({
    uap_id: "",
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    phone_number: "",
    blood_group: "",
    department: "",
    batch_name: "",
    city_area: "",
    has_donated_before: false,
    last_donation_date: "",
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

    if (!formData.blood_group) {
      newErrors.blood_group = "Please select your blood group";
    }

    if (!formData.department.trim()) {
      newErrors.department = "Department is required";
    }

    if (!formData.batch_name.trim()) {
      newErrors.batch_name = "Batch / Semester is required";
    }

    if (!formData.city_area.trim()) {
      newErrors.city_area = "City Area / Location is required";
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
        description: "Please fix the highlighted errors in the form.",
        variant: "destructive",
      });
      return;
    }

    setErrors({});

    try {
      const email = formData.email.trim() || `${formData.uap_id}@uap-bd.edu`;
      const lastDonation = formData.has_donated_before && formData.last_donation_date ? formData.last_donation_date : "";

      // 1. Register in Local Storage mock service (atomic user + donor creation)
      authService.register({
        uap_id: formData.uap_id,
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        email: email,
        is_donor: true,
        blood_group: formData.blood_group,
        last_donation_date: lastDonation,
        department: formData.department,
        batch_name: formData.batch_name,
        city_area: formData.city_area,
      });

      // 2. Register with Supabase Auth if connected
      let isConfirmed = false;
      try {
        const { data } = await signUp(email, formData.password, {
          full_name: formData.full_name,
          phone: formData.phone_number,
          uap_id: formData.uap_id,
          blood_type: formData.blood_group,
          department: formData.department,
          batch_name: formData.batch_name,
          city_area: formData.city_area,
          last_donation_date: lastDonation || null,
        });

        isConfirmed = Boolean(data?.session);

        // Update profiles table if Supabase session or user exists
        if (data?.user && supabase) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: formData.full_name,
            phone: formData.phone_number,
            national_id: formData.uap_id,
            blood_type: formData.blood_group,
            last_donation_date: lastDonation ? new Date(lastDonation).toISOString() : null,
            department: formData.department,
            batch_name: formData.batch_name,
            city_area: formData.city_area,
          });
        }
      } catch (sbError) {
        console.warn("Supabase signup skipped or failed:", sbError);
      }

      toast({
        title: "Registration Successful!",
        description: isConfirmed 
          ? "Welcome to UAP Blood Bank! Your donor profile is now active." 
          : "Account created! You can now log in with your UAP ID / Email.",
      });

      // Automatically log in locally and navigate to dashboard or login
      try {
        authService.login(formData.uap_id);
        navigate("/dashboard");
      } catch {
        navigate("/login");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "An error occurred during registration";
      setErrors({ general: msg });
      toast({
        title: "Registration Failed",
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
        <Card className="w-full max-w-2xl shadow-lg border-primary/10">
          <CardHeader className="space-y-1 text-center pb-6 border-b">
            <div className="flex justify-center mb-2">
              <Droplets className="h-12 w-12 text-accent animate-pulse" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold">UAP Blood Bank Registration</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Fill in your account details and blood donation profile in a single simple form.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Section 1: Account & Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-lg border-b pb-2">
                  <User className="h-5 w-5" />
                  <span>1. Account & Personal Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="uap_id">UAP ID *</Label>
                    <Input
                      id="uap_id"
                      inputMode="numeric"
                      placeholder="e.g. 14101095"
                      value={formData.uap_id}
                      onChange={(e) => setFormData({ ...formData, uap_id: maskNumericId(e.target.value) })}
                      required
                      aria-invalid={Boolean(errors.uap_id)}
                      className="min-h-[44px]"
                    />
                    {errors.uap_id && (
                      <p className="text-xs text-destructive mt-1">{errors.uap_id}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      placeholder="e.g. Tanvir Hasan"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                      className="min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number *</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      inputMode="tel"
                      placeholder="e.g. 01711223344"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: maskPhoneNumber(e.target.value) })}
                      required
                      aria-invalid={Boolean(errors.phone_number)}
                      className="min-h-[44px]"
                    />
                    {errors.phone_number && (
                      <p className="text-xs text-destructive mt-1">{errors.phone_number}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@uap-bd.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create password (min 6 chars)"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        autoComplete="new-password"
                        className="pr-10 min-h-[44px]"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        autoComplete="new-password"
                        className="pr-10 min-h-[44px]"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px]"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Blood Donation & Profile Information */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-accent font-semibold text-lg border-b pb-2">
                  <Heart className="h-5 w-5" />
                  <span>2. Blood Donation & Profile Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="blood_group">Blood Group *</Label>
                    <Select
                      value={formData.blood_group}
                      onValueChange={(val) => setFormData({ ...formData, blood_group: val })}
                      required
                    >
                      <SelectTrigger id="blood_group" className="min-h-[44px]">
                        <SelectValue placeholder="Select Blood Group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.blood_group && <p className="text-xs text-destructive mt-1">{errors.blood_group}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city_area">Location / City Area *</Label>
                    <div className="relative">
                      <Input
                        id="city_area"
                        placeholder="e.g. Dhanmondi, Dhaka"
                        value={formData.city_area}
                        onChange={(e) => setFormData({ ...formData, city_area: e.target.value })}
                        required
                        className="pl-9 min-h-[44px]"
                      />
                      <MapPin className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                    </div>
                    {errors.city_area && <p className="text-xs text-destructive mt-1">{errors.city_area}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <div className="relative">
                      <Input
                        id="department"
                        placeholder="e.g. Computer Science & Engineering"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        required
                        className="pl-9 min-h-[44px]"
                      />
                      <GraduationCap className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                    </div>
                    {errors.department && <p className="text-xs text-destructive mt-1">{errors.department}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batch_name">Batch / Semester *</Label>
                    <Input
                      id="batch_name"
                      placeholder="e.g. Fall 2021"
                      value={formData.batch_name}
                      onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                      required
                      className="min-h-[44px]"
                    />
                    {errors.batch_name && <p className="text-xs text-destructive mt-1">{errors.batch_name}</p>}
                  </div>
                </div>

                <div className="pt-2 space-y-3 bg-accent/5 p-4 rounded-lg border border-accent/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="has_donated_before" className="text-sm font-medium">
                        Have you donated blood before?
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        If yes, specify your last donation date to calculate eligibility.
                      </p>
                    </div>
                    <Switch
                      id="has_donated_before"
                      checked={formData.has_donated_before}
                      onCheckedChange={(checked) => setFormData({ ...formData, has_donated_before: checked })}
                    />
                  </div>

                  {formData.has_donated_before && (
                    <div className="space-y-2 pt-2 border-t border-accent/20">
                      <Label htmlFor="last_donation_date" className="flex items-center gap-1.5 text-xs font-semibold">
                        <Calendar className="h-3.5 w-3.5 text-accent" />
                        Last Donation Date
                      </Label>
                      <Input
                        id="last_donation_date"
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        value={formData.last_donation_date}
                        onChange={(e) => setFormData({ ...formData, last_donation_date: e.target.value })}
                        className="min-h-[44px]"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full min-h-[48px] text-base font-medium" disabled={isLoading}>
                {isLoading ? "Creating Account & Donor Profile..." : "Complete Registration"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 border-t pt-4">
            <div className="text-sm text-muted-foreground text-center">
              Already registered?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline min-h-[44px] inline-flex items-center">
                Login here
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
