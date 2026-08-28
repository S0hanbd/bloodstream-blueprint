import { Link } from "react-router-dom";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { LoginForm } from "@/components/auth/LoginForm";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Droplets } from "lucide-react";

export default function Login() {
  usePageTitle("Login");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <Droplets className="h-12 w-12 text-accent" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl">Login to UAP Blood Bank</CardTitle>
            <CardDescription>
              Enter your UAP ID or Email and password to access your account
            </CardDescription>
          </CardHeader>
          <LoginForm />
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground text-center">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline min-h-[44px] inline-flex items-center">
                Register here
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
