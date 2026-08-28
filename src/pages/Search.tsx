import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { confirmationService } from "@/lib/auth";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { useDonors } from "@/hooks/useDonors";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Search as SearchIcon, Phone, Calendar, MapPin, GraduationCap, Users, CheckCircle2, IdCard, Loader2, AlertCircle } from "lucide-react";

export default function Search() {
  usePageTitle("Search Blood Donors");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const { bloodGroup, searchQuery, setBloodGroup, setSearchQuery } = useAppStore();

  useEffect(() => {
    const bgParam = searchParams.get("bloodGroup");
    const qParam = searchParams.get("query");
    if (bgParam) setBloodGroup(bgParam);
    if (qParam !== null) setSearchQuery(qParam);
  }, [searchParams, setBloodGroup, setSearchQuery]);

  const { data: searchResults = [], isLoading, isError, error, refetch } = useDonors({ bloodGroup, searchQuery });

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
      confirmationService.confirmDonor(currentUser.id, donorUserId);
      toast({
        title: "Donor Confirmed",
        description: "You have successfully confirmed this donor",
      });
      refetch();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not confirm donor",
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
                  <SearchIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <CardTitle>Find Blood Donors</CardTitle>
                </div>
              </div>
              <CardDescription>
                Search for available blood donors by blood group, registration number, or name
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-48">
                  <Select value={bloodGroup} onValueChange={(val) => setBloodGroup(val)}>
                    <SelectTrigger aria-label="Select blood group filter">
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
                    aria-label="Search by registration number or name"
                    placeholder="Search by Reg No (e.g. 14101095) or Name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={() => refetch()} className="gap-2 min-h-[44px]" aria-label="Search blood donors">
                  <SearchIcon className="h-4 w-4" aria-hidden="true" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center justify-between">
              <span>
                {isLoading
                  ? "Fetching donors..."
                  : searchResults.length > 0 
                  ? `Found ${searchResults.length} donor${searchResults.length !== 1 ? 's' : ''}`
                  : "No donors found"}
              </span>
            </h2>

            {/* Error UI State */}
            {isError && (
              <Card className="border-destructive">
                <CardContent className="flex items-center gap-3 py-6 text-destructive">
                  <AlertCircle className="h-6 w-6" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">Failed to fetch donor data</p>
                    <p className="text-sm opacity-90">{error instanceof Error ? error.message : "Network error"}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto min-h-[44px]" aria-label="Retry search query">
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Loading UI State */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                <p className="text-muted-foreground text-sm">Loading donor registry from Supabase...</p>
              </div>
            ) : searchResults.length === 0 && !isError ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                  <p className="text-muted-foreground text-center">
                    No donors matching your search criteria were found in the database.
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
                        <CardTitle className="flex items-start justify-between">
                          <div>
                            <span className="block font-semibold text-lg">{donor.user.full_name}</span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal mt-0.5">
                              <IdCard className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
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
                              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                              {confirmationCount} Confirmed Today
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <a href={`tel:${donor.user.phone_number}`} className="text-primary hover:underline font-medium min-h-[44px] inline-flex items-center" aria-label={`Call donor ${donor.user.full_name}`}>
                            {donor.user.phone_number}
                          </a>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span>Last donated: {donor.last_donation_date || "Never"}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span>{donor.department}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span>{donor.batch_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span>{donor.city_area}</span>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="default" 
                            className="flex-1 gap-2 bg-accent hover:bg-accent/90 min-h-[44px]"
                            aria-label={`Call ${donor.user.full_name}`}
                            asChild
                          >
                            <a href={`tel:${donor.user.phone_number}`}>
                              <Phone className="h-4 w-4" aria-hidden="true" />
                              Call
                            </a>
                          </Button>
                          {currentUser && currentUser.id !== donor.user_id && (
                            <Button 
                              variant="outline"
                              className="flex-1 gap-2 min-h-[44px]"
                              aria-label={`Confirm donor ${donor.user.full_name}`}
                              onClick={() => handleConfirm(donor.user_id)}
                            >
                              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
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
