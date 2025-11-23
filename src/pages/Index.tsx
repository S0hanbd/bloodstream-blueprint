import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Droplets, Heart, Search, Shield } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
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
