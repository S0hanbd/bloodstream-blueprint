import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { authService, donorService, confirmationService, type DonorDetails, type User } from "@/lib/auth";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { Search as SearchIcon, Phone, Calendar, MapPin, GraduationCap, Users, CheckCircle2, IdCard, RefreshCw } from "lucide-react";

export default function Search() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bloodGroup, setBloodGroup] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<DonorDetails & { user: User; isAvailable: boolean }>>([]);
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());

  const executeSearch = (group = bloodGroup, query = searchQuery) => {
    const results = donorService.searchDonors(group, query);
    setSearchResults(results);
  };

  useEffect(() => {
    executeSearch(bloodGroup, searchQuery);
  }, [bloodGroup, searchQuery]);

  const handleSearch = () => {
    executeSearch(bloodGroup, searchQuery);
  };

  const handleResetData = () => {
    localStorage.removeItem("bloodbank_users");
    localStorage.removeItem("bloodbank_donors");
    executeSearch("ALL", "");
    toast({
      title: "Data Reset",
      description: "Dummy donors reloaded into localStorage!",
    });
  };

  const handleConfirm = (donorUserId: string) => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to confirm a donor",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    
    try {
      confirmationService.confirmDonor(currentUser.user_id, donorUserId);
      toast({
        title: "Donor Confirmed",
        description: "You have successfully confirmed this donor",
      });
      executeSearch();
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SearchIcon className="h-5 w-5 text-primary" />
                  <CardTitle>Find Blood Donors</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={handleResetData} className="text-xs text-muted-foreground gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reload Dummy Donors
                </Button>
              </div>
              <CardDescription>
                Search for available blood donors by blood group, registration number, or name
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-48">
                  <Select value={bloodGroup} onValueChange={(val) => { setBloodGroup(val); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Blood Groups</SelectItem>
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
                <div className="flex-1">
                  <Input 
                    placeholder="Search by Reg No (e.g. 14101095) or Name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} className="gap-2">
                  <SearchIcon className="h-4 w-4" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              {searchResults.length > 0 
                ? `Found ${searchResults.length} donor${searchResults.length !== 1 ? 's' : ''}`
                : "No donors found"}
            </h2>

            {searchResults.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                  <p className="text-muted-foreground text-center">
                    No donors matching your search criteria were found in your browser cache.
                  </p>
                  <Button variant="outline" size="sm" onClick={handleResetData} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Load 15 Dummy Bangladeshi Donors
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {searchResults.map((donor) => {
                  const confirmationCount = getConfirmationCount(donor.user_id);
                  return (
                    <Card key={donor.donor_id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-start justify-between">
                          <div>
                            <span className="block font-semibold text-lg">{donor.user.full_name}</span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal mt-0.5">
                              <IdCard className="h-3.5 w-3.5 text-primary" />
                              <span>Reg No: <strong>{donor.user.uap_id}</strong></span>
                            </div>
                          </div>
                          <span className="text-accent font-bold text-xl bg-accent/10 px-2.5 py-1 rounded-md">
                            {donor.blood_group}
                          </span>
                        </CardTitle>
                        <div className="flex gap-2 mt-2 flex-wrap">
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
                          <a href={`tel:${donor.user.phone_number}`} className="text-primary hover:underline font-medium">
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
        </div>
      </div>
    </div>
  );
}
