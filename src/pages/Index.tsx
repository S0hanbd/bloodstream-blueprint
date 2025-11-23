import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { statisticsService } from "@/lib/auth";
import { Droplets, Heart, Search, Shield, Activity, Users } from "lucide-react";

export default function Index() {
  const [stats, setStats] = useState({ totalBags: 0, totalUsers: 0, totalDonors: 0 });

  useEffect(() => {
    const statistics = statisticsService.getStatistics();
    setStats(statistics);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Statistics Section */}
      <section className="container py-12 border-b">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-accent/10 rounded-full">
                    <Droplets className="h-8 w-8 text-accent" />
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
                    <Users className="h-8 w-8 text-primary" />
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
                    <Activity className="h-8 w-8 text-secondary" />
                  </div>
                  <p className="text-4xl font-bold text-secondary">{stats.totalDonors}</p>
                  <p className="text-sm text-muted-foreground font-medium">Active Donors</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Hero Section */}
      <section className="container py-20 text-center space-y-6">
        <div className="flex justify-center mb-4">
          <Droplets className="h-20 w-20 text-accent" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight">UAP Blood Bank</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect blood donors with those in need. Save lives within the UAP community.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link to="/register">
            <Button size="lg" className="gap-2">
              <Heart className="h-5 w-5" />
              Become a Donor
            </Button>
          </Link>
          <Link to="/search">
            <Button size="lg" variant="outline" className="gap-2">
              <Search className="h-5 w-5" />
              Find Donors
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <Shield className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-center">Verified UAP Community</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  All users are verified with their UAP ID, ensuring a safe and trusted platform for students and staff.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <Search className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-center">Quick Search</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Find blood donors by blood group instantly. Get contact information and reach out to donors in seconds.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <Heart className="h-12 w-12 text-accent" />
                </div>
                <CardTitle className="text-center">Save Lives</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Register as a donor and make yourself available to help fellow students and staff in times of emergency.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl font-bold">Ready to Make a Difference?</h2>
          <p className="text-lg text-muted-foreground">
            Join our community of blood donors and help save lives at UAP.
          </p>
          <Link to="/register">
            <Button size="lg" className="gap-2">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
