import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { authService, donorService, type DonorDetails } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateDonor, useRegisterDonor, useRecordDonation, useHideProfile, useShowProfile, useDeleteProfile } from "@/hooks/useDonors";
import { DonationForm } from "@/components/donations/DonationForm";
import { usePageTitle } from "@/hooks/usePageTitle";
import { User, Heart, EyeOff, Trash2, Loader2 } from "lucide-react";

export default function Dashboard() {
  usePageTitle("Donor Dashboard");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: supabaseUser, signOut } = useAuth();
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [donorDetails, setDonorDetails] = useState<DonorDetails | null>(null);

  const updateDonorMutation = useUpdateDonor();
  const registerDonorMutation = useRegisterDonor();
  const recordDonationMutation = useRecordDonation();

  const [donorForm, setDonorForm] = useState({
    blood_group: "",
    last_donation_date: "",
    department: "",
    batch_name: "",
    city_area: "",
  });

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user && !supabaseUser) {
      navigate("/login");
      return;
    }
    if (user) {
      setCurrentUser(user);
      if (user.is_donor) {
        const details = donorService.getDonorByUserId(user.user_id);
        if (details) {
          setDonorDetails(details);
          setDonorForm({
            blood_group: details.blood_group,
            last_donation_date: details.last_donation_date,
            department: details.department,
            batch_name: details.batch_name,
            city_area: details.city_area,
          });
        }
      }
    }
  }, [navigate, supabaseUser]);

  const handleDonorToggle = async (checked: boolean) => {
    if (!currentUser) return;

    if (!checked) {
      authService.updateUser(currentUser.user_id, { is_donor: false });
      setCurrentUser({ ...currentUser, is_donor: false });
      toast({
        title: "Donor status updated",
        description: "You are no longer listed as a donor",
      });
    } else {
      setCurrentUser({ ...currentUser, is_donor: true });
    }
  };

  const handleDonorFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      if (donorDetails) {
        await updateDonorMutation.mutateAsync({
          userId: currentUser.user_id,
          updates: donorForm,
        });
        toast({
          title: "Donor details updated",
          description: "Your information has been updated successfully",
        });
      } else {
        await registerDonorMutation.mutateAsync({
          user_id: currentUser.user_id,
          total_donations: 0,
          ...donorForm,
        });
        toast({
          title: "Registered as donor",
          description: "You are now listed as a blood donor",
        });
      }
      
      const details = donorService.getDonorByUserId(currentUser.user_id);
      setDonorDetails(details);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsDonated = async () => {
    if (!currentUser) return;
    
    try {
      await recordDonationMutation.mutateAsync({ userId: currentUser.user_id });
      const updatedDonor = donorService.getDonorByUserId(currentUser.user_id);
      if (updatedDonor) {
        setDonorDetails(updatedDonor);
        setDonorForm({
          ...donorForm,
          last_donation_date: updatedDonor.last_donation_date,
        });
      }
      toast({
        title: "Donation Recorded",
        description: "Thank you! You'll be available again in 3.5 months (105 days).",
      });
    } catch (error) {
      toast({
        title: "Cannot Record Donation",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const hideProfileMutation = useHideProfile();
  const showProfileMutation = useShowProfile();
  const deleteProfileMutation = useDeleteProfile();

  const handleHideAccount = async () => {
    const userId = currentUser?.user_id || supabaseUser?.id;
    if (!userId) return;

    try {
      await hideProfileMutation.mutateAsync(userId);
      if (currentUser) {
        authService.updateUser(currentUser.user_id, { account_status: 'hidden' });
        setCurrentUser({ ...currentUser, account_status: 'hidden' });
      }
      toast({
        title: "Account Hidden",
        description: "Your profile is now temporarily hidden from donor search results.",
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
      await showProfileMutation.mutateAsync({ userId, bloodGroup: donorForm.blood_group || "A+" });
      if (currentUser) {
        authService.updateUser(currentUser.user_id, { account_status: 'active' });
        setCurrentUser({ ...currentUser, account_status: 'active' });
      }
      toast({
        title: "Account Visible",
        description: "Your profile is now visible in donor search results.",
      });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not make account visible",
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
        authService.updateUser(currentUser.user_id, { account_status: 'deleted' });
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

  const userDisplayName = currentUser?.full_name || supabaseUser?.user_metadata?.full_name || "User";
  const userUapId = currentUser?.uap_id || supabaseUser?.user_metadata?.uap_id || "N/A";
  const userPhone = currentUser?.phone_number || supabaseUser?.user_metadata?.phone || "N/A";
  const isSubmitting = updateDonorMutation.isPending || registerDonorMutation.isPending || recordDonationMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">UAP ID</Label>
                  <p className="font-medium">{userUapId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{userDisplayName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone Number</Label>
                  <p className="font-medium">{userPhone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-accent" />
                <CardTitle>Donor Status</CardTitle>
              </div>
              <CardDescription>
                Make yourself available to donate blood to those in need
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="donor-toggle">Available to donate blood</Label>
                <Switch
                  id="donor-toggle"
                  checked={currentUser?.is_donor ?? true}
                  onCheckedChange={handleDonorToggle}
                />
              </div>

              {currentUser?.is_donor && donorDetails && (
                <div className="pt-4 border-t">
                  <DonationForm
                    lastDonationDate={donorDetails.last_donation_date}
                    onConfirmDonation={handleMarkAsDonated}
                    isLoading={recordDonationMutation.isPending}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {currentUser?.is_donor && (
            <Card>
              <CardHeader>
                <CardTitle>{donorDetails ? "Edit Donor Profile" : "Register as Donor"}</CardTitle>
                <CardDescription>
                  Keep your blood group, donation dates, and location up to date so patients can find you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDonorFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="blood_group">Blood Group</Label>
                      <Select 
                        value={donorForm.blood_group} 
                        onValueChange={(val) => setDonorForm({ ...donorForm, blood_group: val })}
                      >
                        <SelectTrigger id="blood_group">
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
                      <Label htmlFor="last_donation_date">Last Donation Date</Label>
                      <Input
                        id="last_donation_date"
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        value={donorForm.last_donation_date}
                        onChange={(e) => setFormDataDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      placeholder="e.g. Computer Science & Engineering"
                      value={donorForm.department}
                      onChange={(e) => setDonorForm({ ...donorForm, department: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batch_name">Batch / Semester</Label>
                    <Input
                      id="batch_name"
                      placeholder="e.g. Fall 2021"
                      value={donorForm.batch_name}
                      onChange={(e) => setDonorForm({ ...donorForm, batch_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city_area">Location / City Area</Label>
                    <Input
                      id="city_area"
                      placeholder="e.g. Dhanmondi, Dhaka"
                      value={donorForm.city_area}
                      onChange={(e) => setDonorForm({ ...donorForm, city_area: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving changes...
                      </span>
                    ) : donorDetails ? (
                      "Update Donor Details"
                    ) : (
                      "Register as Donor"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-lg">Account Actions</CardTitle>
              <CardDescription>Privacy and visibility settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentUser?.account_status === 'hidden' ? (
                <Button 
                  variant="outline" 
                  onClick={handleShowAccount}
                  className="w-full justify-start gap-2"
                >
                  <EyeOff className="h-4 w-4" />
                  Make Profile Visible Again
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={handleHideAccount}
                  className="w-full justify-start gap-2 text-amber-600 hover:text-amber-700"
                >
                  <EyeOff className="h-4 w-4" />
                  Hide Profile from Search Results
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account Permanently
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete your account and remove your profile from the blood donor search registry.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
    </div>
  );

  function setFormDataDate(val: string) {
    setDonorForm((prev) => ({ ...prev, last_donation_date: val }));
  }
}
