import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { authService, donorService, confirmationService, type DonorDetails, type User } from "@/lib/auth";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { Search as SearchIcon, Phone, Calendar, MapPin, GraduationCap, Users, CheckCircle2 } from "lucide-react";

export default function Search() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bloodGroup, setBloodGroup] = useState("");
  const [searchResults, setSearchResults] = useState<Array<DonorDetails & { user: User; isAvailable: boolean }>>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate("/login");
    }
  }, [navigate]);

  const handleSearch = () => {
    if (!bloodGroup) return;
    
    const results = donorService.searchDonors(bloodGroup);
    setSearchResults(results);
    setHasSearched(true);
  };

  const handleConfirm = (donorUserId: string) => {
    if (!currentUser) return;
    
    try {
      confirmationService.confirmDonor(currentUser.user_id, donorUserId);
      toast({
        title: "Donor Confirmed",
        description: "You have successfully confirmed this donor",
      });
      // Refresh results to update confirmation counts
      handleSearch();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not confirm donor",
        variant: "destructive",
      });
    }
  };

  const getConfirmationCount = (donorUserId: string): number => {
    return confirmationService.getConfirmationsForDonor(donorUserId).length;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <SearchIcon className="h-5 w-5 text-primary" />
                <CardTitle>Find Blood Donors</CardTitle>
              </div>
              <CardDescription>
                Search for available blood donors by blood group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select value={bloodGroup} onValueChange={setBloodGroup}>
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
                <Button onClick={handleSearch} className="gap-2" disabled={!bloodGroup}>
                  <SearchIcon className="h-4 w-4" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {hasSearched && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">
                {searchResults.length > 0 
                  ? `Found ${searchResults.length} donor${searchResults.length !== 1 ? 's' : ''}`
                  : "No donors found"}
              </h2>

              {searchResults.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground text-center">
                      No donors with blood group {bloodGroup} are currently available.
                      <br />
                      Please try again later or search for a different blood group.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {searchResults.map((donor) => {
                    const confirmationCount = getConfirmationCount(donor.user_id);
                    return (
                      <Card key={donor.donor_id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{donor.user.full_name}</span>
                            <span className="text-accent font-bold text-xl">{donor.blood_group}</span>
                          </CardTitle>
                          <div className="flex gap-2 mt-2">
                            {!donor.isAvailable && (
                              <Badge variant="secondary" className="text-xs">
                                Unavailable (Recently Donated)
                              </Badge>
                            )}
                            {confirmationCount > 0 && (
                              <Badge variant="default" className="text-xs gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {confirmationCount} Confirmed Today
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${donor.user.phone_number}`} className="text-primary hover:underline">
                            {donor.user.phone_number}
                          </a>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Last donated: {donor.last_donation_date}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span>{donor.department}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{donor.batch_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{donor.city_area}</span>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="default" 
                            className="flex-1 gap-2 bg-accent hover:bg-accent/90"
                            asChild
                          >
                            <a href={`tel:${donor.user.phone_number}`}>
                              <Phone className="h-4 w-4" />
                              Call
                            </a>
                          </Button>
                          {currentUser && currentUser.user_id !== donor.user_id && (
                            <Button 
                              variant="outline"
                              className="flex-1 gap-2"
                              onClick={() => handleConfirm(donor.user_id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Confirm
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
