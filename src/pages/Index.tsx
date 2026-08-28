import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/Header";
import { statisticsService } from "@/lib/auth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAppStore } from "@/store/useAppStore";
import { Droplets, Heart, Search, Shield, Activity, Users, AlertCircle, MapPin } from "lucide-react";

export default function Index() {
  usePageTitle("Connect Donors & Save Lives");
  const navigate = useNavigate();
  const { setBloodGroup, setSearchQuery } = useAppStore();
  const [stats, setStats] = useState({ totalBags: 0, totalUsers: 0, totalDonors: 0 });

  const [quickBloodGroup, setQuickBloodGroup] = useState("ALL");
  const [quickArea, setQuickArea] = useState("ALL");

  useEffect(() => {
    const statistics = statisticsService.getStatistics();
    setStats(statistics);
  }, []);

  const handleEmergencySearch = () => {
    setBloodGroup(quickBloodGroup);
    setSearchQuery(quickArea === "ALL" ? "" : quickArea);
    const queryParams = new URLSearchParams();
    if (quickBloodGroup !== "ALL") queryParams.set("bloodGroup", quickBloodGroup);
    if (quickArea !== "ALL") queryParams.set("query", quickArea);
    navigate(`/search?${queryParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* 1. HERO SECTION & EMERGENCY CALL-TO-ACTION (Top Priority) */}
      <section className="container py-16 text-center space-y-6">
        <div className="flex justify-center mb-2">
          <Droplets className="h-16 w-16 text-accent animate-pulse" aria-hidden="true" />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          UAP Blood Bank <span className="text-accent">Save Lives</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Immediate voluntary blood donor matching within the University of Asia Pacific community.
        </p>

        {/* Emergency Call-To-Action Dual Buttons */}
        <div className="flex gap-4 justify-center pt-2 flex-wrap">
          <Button
            size="lg"
            variant="default"
            className="gap-2.5 min-h-[44px] bg-destructive hover:bg-destructive/90 text-destructive-foreground px-6 text-base font-bold shadow-md"
            onClick={handleEmergencySearch}
            aria-label="Need Blood Urgently"
          >
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
            Need Blood Urgently?
          </Button>

          <Link to="/register">
            <Button
              size="lg"
              variant="outline"
              className="gap-2.5 min-h-[44px] px-6 text-base font-semibold border-primary text-primary hover:bg-primary/5"
              aria-label="Join as a Donor"
            >
              <Heart className="h-5 w-5 text-accent" aria-hidden="true" />
              Join as a Donor
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. EMERGENCY QUICK-FILTER BAR */}
      <section className="container pb-12">
        <Card className="max-w-4xl mx-auto border-2 border-accent/30 shadow-lg bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <Search className="h-5 w-5 text-accent" aria-hidden="true" />
              Emergency Quick Donor Lookup
            </CardTitle>
            <CardDescription>
              Select required blood group and area for instant 1-click matching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Blood Group</label>
                <Select value={quickBloodGroup} onValueChange={setQuickBloodGroup}>
                  <SelectTrigger aria-label="Quick select blood group" className="min-h-[44px]">
                    <SelectValue placeholder="All Groups" />
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  Campus / Area
                </label>
                <Select value={quickArea} onValueChange={setQuickArea}>
                  <SelectTrigger aria-label="Quick select location area" className="min-h-[44px]">
                    <SelectValue placeholder="All Areas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Locations</SelectItem>
                    <SelectItem value="Dhanmondi">Dhanmondi, Dhaka</SelectItem>
                    <SelectItem value="Green Road">Green Road, Dhaka</SelectItem>
                    <SelectItem value="Uttara">Uttara, Dhaka</SelectItem>
                    <SelectItem value="Mirpur">Mirpur, Dhaka</SelectItem>
                    <SelectItem value="Mohammadpur">Mohammadpur, Dhaka</SelectItem>
                    <SelectItem value="Farmgate">Farmgate, Dhaka</SelectItem>
                    <SelectItem value="Gulshan">Gulshan, Dhaka</SelectItem>
                    <SelectItem value="Banani">Banani, Dhaka</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleEmergencySearch}
                className="min-h-[44px] gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base"
                aria-label="Find Donors Now"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Find Donors Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. LIVE PLATFORM METRICS */}
      <section className="container py-12 border-t border-b bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-accent/10 rounded-full">
                    <Droplets className="h-8 w-8 text-accent" aria-hidden="true" />
                  </div>
                  <p className="text-4xl font-bold text-accent">{stats.totalBags}</p>
                  <p className="text-sm text-muted-foreground font-medium">Blood Bags Donated</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Users className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                  <p className="text-4xl font-bold text-primary">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground font-medium">Registered Users</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-secondary/20 bg-secondary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-secondary/10 rounded-full">
                    <Activity className="h-8 w-8 text-secondary" aria-hidden="true" />
                  </div>
                  <p className="text-4xl font-bold text-secondary">{stats.totalDonors}</p>
                  <p className="text-sm text-muted-foreground font-medium">Active Donors</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="container py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <Shield className="h-12 w-12 text-primary" aria-hidden="true" />
                </div>
                <CardTitle className="text-center">Verified UAP Community</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground text-sm">
                All donors are verified members of the UAP community via student registration IDs.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <Search className="h-12 w-12 text-accent" aria-hidden="true" />
                </div>
                <CardTitle className="text-center">Instant Group Search</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground text-sm">
                Filter donors by blood group, department, or city area in real time.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <Heart className="h-12 w-12 text-destructive" aria-hidden="true" />
                </div>
                <CardTitle className="text-center">90-Day Safety Protocol</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground text-sm">
                Automatic cooldown tracking ensures donor health and eligibility safety.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="container">
          <p>© {new Date().getFullYear()} UAP Blood Bank. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
