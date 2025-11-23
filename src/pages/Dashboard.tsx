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
import { User, Heart, Droplet, EyeOff, Trash2 } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [donorDetails, setDonorDetails] = useState<DonorDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [donorForm, setDonorForm] = useState({
    blood_group: "",
    last_donation_date: "",
    department: "",
    batch_name: "",
    city_area: "",
  });

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setCurrentUser(user);

    // Load donor details if user is a donor
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
  }, [navigate]);

  const handleDonorToggle = async (checked: boolean) => {
    if (!currentUser) return;

    if (!checked) {
      // User wants to stop being a donor
      authService.updateUser(currentUser.user_id, { is_donor: false });
      setCurrentUser({ ...currentUser, is_donor: false });
      toast({
        title: "Donor status updated",
        description: "You are no longer listed as a donor",
      });
    } else {
      // User wants to become a donor - show the form
      setCurrentUser({ ...currentUser, is_donor: true });
    }
  };

  const handleDonorFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);

    try {
      if (donorDetails) {
        // Update existing donor
        donorService.updateDonor(currentUser.user_id, donorForm);
        toast({
          title: "Donor details updated",
          description: "Your information has been updated successfully",
        });
      } else {
        // Register new donor
        donorService.registerDonor({
          user_id: currentUser.user_id,
          total_donations: 0,
          ...donorForm,
        });
        toast({
          title: "Registered as donor",
          description: "You are now listed as a blood donor",
        });
      }
      
      // Reload donor details
      const details = donorService.getDonorByUserId(currentUser.user_id);
      setDonorDetails(details);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsDonated = () => {
    if (!currentUser) return;
    
    try {
      const updatedDonor = donorService.markAsDonated(currentUser.user_id);
      setDonorDetails(updatedDonor);
      setDonorForm({
        ...donorForm,
        last_donation_date: updatedDonor.last_donation_date
      });
      toast({
        title: "Donation Recorded",
        description: "Thank you! You'll be available again in 3.5 months",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleHideAccount = () => {
    if (!currentUser) return;
    
    authService.updateUser(currentUser.user_id, { account_status: 'hidden' });
    toast({
      title: "Account Hidden",
      description: "Your profile is now temporarily hidden from search results",
    });
    setCurrentUser({ ...currentUser, account_status: 'hidden' });
  };

  const handleShowAccount = () => {
    if (!currentUser) return;
    
    authService.updateUser(currentUser.user_id, { account_status: 'active' });
    toast({
      title: "Account Visible",
      description: "Your profile is now visible in search results",
    });
    setCurrentUser({ ...currentUser, account_status: 'active' });
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;
    
    authService.updateUser(currentUser.user_id, { account_status: 'deleted' });
    authService.logout();
    toast({
      title: "Account Deleted",
      description: "Your account has been permanently deleted",
    });
    navigate("/");
  };

  if (!currentUser) {
    return null;
  }

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
                  <p className="font-medium">{currentUser.uap_id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{currentUser.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone Number</Label>
                  <p className="font-medium">{currentUser.phone_number}</p>
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
                  checked={currentUser.is_donor}
                  onCheckedChange={handleDonorToggle}
                />
              </div>

              {currentUser.is_donor && donorDetails && (
                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleMarkAsDonated}
                    variant="default"
                    className="w-full gap-2 bg-accent hover:bg-accent/90"
                  >
                    <Droplet className="h-4 w-4" />
                    I Have Donated Blood
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Total Donations: {donorDetails.total_donations || 0}
                  </p>
                </div>
              )}

              {currentUser.is_donor && (
                <form onSubmit={handleDonorFormSubmit} className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="blood_group">Blood Group</Label>
                    <Select
                      value={donorForm.blood_group}
                      onValueChange={(value) => setDonorForm({ ...donorForm, blood_group: value })}
                      required
                    >
                      <SelectTrigger>
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
                      value={donorForm.last_donation_date}
                      onChange={(e) => setDonorForm({ ...donorForm, last_donation_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      placeholder="e.g., CSE, BBA, EEE"
                      value={donorForm.department}
                      onChange={(e) => setDonorForm({ ...donorForm, department: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batch_name">Batch Name</Label>
                    <Input
                      id="batch_name"
                      placeholder="e.g., Projjolon-55, Pronoyon-50"
                      value={donorForm.batch_name}
                      onChange={(e) => setDonorForm({ ...donorForm, batch_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city_area">City/Area</Label>
                    <Input
                      id="city_area"
                      placeholder="e.g., Dhaka, Uttara"
                      value={donorForm.city_area}
                      onChange={(e) => setDonorForm({ ...donorForm, city_area: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Saving..." : donorDetails ? "Update Donor Details" : "Register as Donor"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
              <CardDescription>
                Manage your account visibility and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentUser.account_status === 'active' ? (
                <Button 
                  onClick={handleHideAccount}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <EyeOff className="h-4 w-4" />
                  Hide My Profile Temporarily
                </Button>
              ) : (
                <Button 
                  onClick={handleShowAccount}
                  variant="default"
                  className="w-full gap-2"
                >
                  <User className="h-4 w-4" />
                  Show My Profile
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    className="w-full gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account Permanently
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our system.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
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
}
