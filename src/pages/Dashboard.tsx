import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { authService, donorService, type DonorDetails, type User as LocalUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateDonor, useRecordDonation, useHideProfile, useShowProfile, useDeleteProfile } from "@/hooks/useDonors";
import { DonationForm } from "@/components/donations/DonationForm";
import { usePageTitle } from "@/hooks/usePageTitle";
import { maskPhoneNumber } from "@/logic/masking";
import { calculateDonationEligibility } from "@/logic/cooldown";
import { User, Heart, EyeOff, Trash2, Loader2, Save, MapPin, GraduationCap, Calendar, Phone, Shield, Award } from "lucide-react";

export default function Dashboard() {
  usePageTitle("Donor Dashboard - UAP Blood Bank");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: supabaseUser, signOut } = useAuth();
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(authService.getCurrentUser());
  const [donorDetails, setDonorDetails] = useState<DonorDetails | null>(null);
  const [isDonorActive, setIsDonorActive] = useState(true);

  const updateDonorMutation = useUpdateDonor();
  const recordDonationMutation = useRecordDonation();
  const hideProfileMutation = useHideProfile();
  const showProfileMutation = useShowProfile();
  const deleteProfileMutation = useDeleteProfile();

  // Unified Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone_number: "",
    blood_group: "",
    last_donation_date: "",
    department: "",
    batch_name: "",
    city_area: "",
  });

  useEffect(() => {
    const localUser = authService.getCurrentUser();
    if (!localUser && !supabaseUser) {
      navigate("/login");
      return;
    }

    if (localUser) {
      setCurrentUser(localUser);
      setIsDonorActive(localUser.is_donor ?? true);
      const details = donorService.getDonorByUserId(localUser.user_id);
      if (details) {
        setDonorDetails(details);
        setProfileForm({
          full_name: localUser.full_name || "",
          phone_number: localUser.phone_number || "",
          blood_group: details.blood_group || "",
          last_donation_date: details.last_donation_date || "",
          department: details.department || "",
          batch_name: details.batch_name || "",
          city_area: details.city_area || "",
        });
      } else {
        setProfileForm((prev) => ({
          ...prev,
          full_name: localUser.full_name || "",
          phone_number: localUser.phone_number || "",
        }));
      }
    }

    // Fetch profile from Supabase if using Supabase Auth
    if (supabaseUser && supabase) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile) {
            const formattedDate = profile.last_donation_date
              ? new Date(profile.last_donation_date).toISOString().split("T")[0]
              : "";
            
            setProfileForm((prev) => ({
              ...prev,
              full_name: profile.full_name || prev.full_name || supabaseUser.user_metadata?.full_name || "",
              phone_number: profile.phone || prev.phone_number || supabaseUser.user_metadata?.phone || "",
              blood_group: profile.blood_type && profile.blood_type !== "hidden" ? profile.blood_type : prev.blood_group,
              last_donation_date: formattedDate || prev.last_donation_date,
              department: profile.department || prev.department,
              batch_name: profile.batch_name || prev.batch_name,
              city_area: profile.city_area || prev.city_area,
            }));

            if (profile.blood_type && profile.blood_type !== "hidden") {
              setDonorDetails((prev) => ({
                donor_id: prev?.donor_id || profile.id,
                user_id: profile.id,
                blood_group: profile.blood_type,
                last_donation_date: formattedDate,
                department: profile.department || prev?.department || "General",
                batch_name: profile.batch_name || prev?.batch_name || "UAP",
                city_area: profile.city_area || prev?.city_area || "Dhaka",
                total_donations: prev?.total_donations || 0,
              }));
            }
          }
        });
    }
  }, [supabaseUser, navigate]);

  const handleDonorToggle = (checked: boolean) => {
    setIsDonorActive(checked);
    if (checked) {
      handleShowAccount();
    } else {
      handleHideAccount();
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = currentUser?.user_id || supabaseUser?.id;
    if (!userId) return;

    try {
      // 1. Update local user state
      if (currentUser) {
        authService.updateUser(userId, {
          full_name: profileForm.full_name,
          phone_number: profileForm.phone_number,
        });
      }

      // 2. Update donor details (local + Supabase)
      await updateDonorMutation.mutateAsync({
        userId,
        updates: {
          blood_group: profileForm.blood_group,
          last_donation_date: profileForm.last_donation_date,
          department: profileForm.department,
          batch_name: profileForm.batch_name,
          city_area: profileForm.city_area,
        },
      });

      // 3. Sync state
      setDonorDetails({
        donor_id: donorDetails?.donor_id || userId,
        user_id: userId,
        blood_group: profileForm.blood_group,
        last_donation_date: profileForm.last_donation_date,
        department: profileForm.department,
        batch_name: profileForm.batch_name,
        city_area: profileForm.city_area,
        total_donations: donorDetails?.total_donations || 0,
      });

      toast({
        title: "Profile & Donation Details Saved!",
        description: "Your details have been updated successfully and are live in search results.",
      });
    } catch (error) {
      toast({
        title: "Save Error",
        description: error instanceof Error ? error.message : "An error occurred while saving profile",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsDonated = async () => {
    const userId = currentUser?.user_id || supabaseUser?.id;
    if (!userId) return;

    try {
      await recordDonationMutation.mutateAsync({ userId });
      const todayStr = new Date().toISOString().split("T")[0];
      setProfileForm((prev) => ({ ...prev, last_donation_date: todayStr }));
      if (donorDetails) {
        setDonorDetails({
          ...donorDetails,
          last_donation_date: todayStr,
          total_donations: (donorDetails.total_donations || 0) + 1,
        });
      }
      toast({
        title: "Donation Recorded!",
        description: "Thank you for saving lives! Your 90-day recovery cooldown is now active.",
      });
    } catch (error) {
      toast({
        title: "Cannot Record Donation",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleHideAccount = async () => {
    const userId = currentUser?.user_id || supabaseUser?.id;
    if (!userId) return;

    try {
      await hideProfileMutation.mutateAsync(userId);
      setIsDonorActive(false);
      toast({
        title: "Profile Hidden",
        description: "Your profile is temporarily hidden from donor search results.",
      });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not hide account",
        variant: "destructive",
      });
    }
  };

  const handleShowAccount = async () => {
    const userId = currentUser?.user_id || supabaseUser?.id;
    if (!userId) return;

    try {
      await showProfileMutation.mutateAsync({ userId, bloodGroup: profileForm.blood_group || "A+" });
      setIsDonorActive(true);
      toast({
        title: "Profile Active",
        description: "Your profile is now visible in donor search results.",
      });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not activate profile",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    const userId = currentUser?.user_id || supabaseUser?.id;
    if (!userId) return;

    try {
      await deleteProfileMutation.mutateAsync(userId);
      if (currentUser) {
        authService.updateUser(currentUser.user_id, { account_status: "deleted" });
      }
      authService.logout();
      await signOut();
      toast({
        title: "Account Deleted",
        description: "Your account and profile details have been permanently deleted.",
      });
      navigate("/");
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not delete account",
        variant: "destructive",
      });
    }
  };

  if (!currentUser && !supabaseUser) {
    return null;
  }

  const userDisplayName = profileForm.full_name || currentUser?.full_name || supabaseUser?.user_metadata?.full_name || "Donor";
  const userUapId = currentUser?.uap_id || supabaseUser?.user_metadata?.uap_id || "N/A";
  const isSubmitting = updateDonorMutation.isPending || recordDonationMutation.isPending;

  const eligibilityStatus = calculateDonationEligibility(profileForm.last_donation_date || donorDetails?.last_donation_date);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 max-w-4xl mx-auto space-y-6">
        
        {/* Donor Overview Badge Header */}
        <Card className="bg-card border-primary/20 shadow-sm overflow-hidden">
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center text-accent text-2xl font-bold">
                {profileForm.blood_group || donorDetails?.blood_group || <Heart className="h-8 w-8" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {userDisplayName}
                  {profileForm.blood_group && (
                    <Badge variant="destructive" className="text-xs px-2.5 py-0.5 font-bold">
                      {profileForm.blood_group}
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                  <span>UAP ID: <strong className="text-foreground">{userUapId}</strong></span>
                  <span>•</span>
                  <span>Total Donations: <strong className="text-accent">{donorDetails?.total_donations || 0} bags</strong></span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isDonorActive ? (
                eligibilityStatus.isEligible ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-sm px-3 py-1 gap-1">
                    <Shield className="h-4 w-4" /> Ready to Donate
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-sm px-3 py-1 gap-1">
                    <Calendar className="h-4 w-4" /> Cooldown ({eligibilityStatus.daysRemaining}d left)
                  </Badge>
                )
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-sm px-3 py-1 gap-1">
                  <EyeOff className="h-4 w-4" /> Profile Hidden
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="p-4 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id="donor-toggle"
                checked={isDonorActive}
                onCheckedChange={handleDonorToggle}
              />
              <Label htmlFor="donor-toggle" className="cursor-pointer font-medium text-sm">
                Visible in Blood Donor Search Results
              </Label>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {isDonorActive ? "Patients & searchers can reach you" : "Hidden from search queries"}
            </span>
          </CardContent>
        </Card>

        {/* Record Blood Donation Section */}
        <Card className="border-accent/30 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              <CardTitle>Have You Donated Blood Recently?</CardTitle>
            </div>
            <CardDescription>
              Click below whenever you donate blood to record your contribution and automatically start your mandatory 90-day medical recovery cooldown.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DonationForm
              lastDonationDate={profileForm.last_donation_date || donorDetails?.last_donation_date}
              onConfirmDonation={handleMarkAsDonated}
              isLoading={recordDonationMutation.isPending}
            />
          </CardContent>
        </Card>

        {/* Unified Profile & Donor Details Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>My Details & Donor Information</CardTitle>
            </div>
            <CardDescription>
              View and edit your user profile and blood donation information in one single place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              {/* Account Information Sub-Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">
                  Personal & Account Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="uap_id_display" className="text-muted-foreground">UAP ID (Read-only)</Label>
                    <Input id="uap_id_display" value={userUapId} disabled className="bg-muted font-medium min-h-[44px]" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      required
                      className="min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <div className="relative">
                    <Input
                      id="phone_number"
                      type="tel"
                      value={profileForm.phone_number}
                      onChange={(e) => setProfileForm({ ...profileForm, phone_number: maskPhoneNumber(e.target.value) })}
                      required
                      className="pl-9 min-h-[44px]"
                    />
                    <Phone className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Donor Information Sub-Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">
                  Blood Donation & Location Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="blood_group">Blood Group *</Label>
                    <Select
                      value={profileForm.blood_group}
                      onValueChange={(val) => setProfileForm({ ...profileForm, blood_group: val })}
                      required
                    >
                      <SelectTrigger id="blood_group" className="min-h-[44px]">
                        <SelectValue placeholder="Select blood group" />
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city_area">Location / City Area *</Label>
                    <div className="relative">
                      <Input
                        id="city_area"
                        placeholder="e.g. Dhanmondi, Dhaka"
                        value={profileForm.city_area}
                        onChange={(e) => setProfileForm({ ...profileForm, city_area: e.target.value })}
                        required
                        className="pl-9 min-h-[44px]"
                      />
                      <MapPin className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <div className="relative">
                      <Input
                        id="department"
                        placeholder="e.g. Computer Science & Engineering"
                        value={profileForm.department}
                        onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                        required
                        className="pl-9 min-h-[44px]"
                      />
                      <GraduationCap className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batch_name">Batch / Semester *</Label>
                    <Input
                      id="batch_name"
                      placeholder="e.g. Fall 2021"
                      value={profileForm.batch_name}
                      onChange={(e) => setProfileForm({ ...profileForm, batch_name: e.target.value })}
                      required
                      className="min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_donation_date" className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Last Donation Date
                  </Label>
                  <Input
                    id="last_donation_date"
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={profileForm.last_donation_date}
                    onChange={(e) => setProfileForm({ ...profileForm, last_donation_date: e.target.value })}
                    className="min-h-[44px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank if you have not donated blood yet.
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full min-h-[44px] gap-2 font-medium" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Saving changes...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" aria-hidden="true" />
                    Save All Details
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone / Account Settings */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-lg">Account Visibility & Privacy</CardTitle>
            <CardDescription>Manage how your details are displayed to the public</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isDonorActive ? (
              <Button
                variant="outline"
                onClick={handleShowAccount}
                className="w-full justify-start gap-2 min-h-[44px]"
              >
                <EyeOff className="h-4 w-4" aria-hidden="true" />
                Make Profile Visible Again
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleHideAccount}
                className="w-full justify-start gap-2 text-amber-600 hover:text-amber-700 min-h-[44px]"
              >
                <EyeOff className="h-4 w-4" aria-hidden="true" />
                Hide Profile Temporarily from Search Results
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive min-h-[44px]"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete Account & Donor Profile Permanently
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete your account and remove your profile from the UAP blood donor registry.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[44px]"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
