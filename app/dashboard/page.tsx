"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, LogOut } from "lucide-react";
import { SpotifyConnectButton } from "./components/SpotifyConnectButton";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [isYouTubeAvailable, setIsYouTubeAvailable] = useState(false);
  const [isDeezerAvailable, setIsDeezerAvailable] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.id) {
      fetchOnboardingStatus();
    }
  }, [session]);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "spotify_connected") {
      setIsSpotifyConnected(true);
      showSuccessToast("Spotify");
    } else if (error) {
      showErrorToast(error);
    }

    // Remove the query parameters from the URL
    router.replace("/dashboard", undefined);
  }, [searchParams, toast, router]);

  const showSuccessToast = (service: string) => {
    toast({
      title: "Success",
      description: `Your ${service} account has been successfully connected!`,
      duration: 5000,
    });
  };

  const showErrorToast = (error: string) => {
    toast({
      title: "Error",
      description: `There was an error connecting your account: ${error}`,
      variant: "destructive",
      duration: 5000,
    });
  };

  const fetchOnboardingStatus = async () => {
    try {
      const response = await fetch(
        `/api/user/onboarding-status?userId=${session?.user?.id}`
      );
      const data = await response.json();
      setIsOnboarded(data.isOnboarded);
      setIsSpotifyConnected(data.isSpotifyConnected);
      setIsYouTubeAvailable(data.isYouTubeAvailable);
    } catch (error) {
      console.error("Error fetching onboarding status:", error);
    }
  };

  const handleContinue = async () => {
    if (!session?.user?.id) return;

    const response = await fetch("/api/user/complete-onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.id }),
    });

    if (response.ok) {
      setIsOnboarded(true);
      toast({
        title: "Onboarding Complete",
        description: "Your account setup is now complete!",
        duration: 3000,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/"); // Redirect to home page after signing out
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
      duration: 3000,
    });
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Access Denied</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Welcome to Your Dashboard, {session.user?.name}</CardTitle>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardHeader>
        <CardContent>
          {!isOnboarded ? (
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                Let's get started!
              </h2>
              <p className="mb-4">
                Connect your music accounts to get the most out of Music Hub.
              </p>
              <div className="flex flex-col">
                {isSpotifyConnected ? (
                  <Alert className="mb-4">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Spotify Connected</AlertTitle>
                    <AlertDescription>
                      Your Spotify account is successfully connected.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <SpotifyConnectButton />
                )}
                {isYouTubeAvailable ? (
                  <Alert className="mb-4">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>YouTube Music Available</AlertTitle>
                    <AlertDescription>
                      YouTube Music functionality is available.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Button className="mt-4">Connect YouTube Music</Button>
                )}
                {isDeezerAvailable ? (
                  <Alert className="mb-4">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Deezer Available</AlertTitle>
                    <AlertDescription>
                      Deezer functionality is available.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Button className="mt-4">Connect Deezer</Button>
                )}
                <Button onClick={handleContinue} className="mt-4">
                  Continue to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-4">
                Here's an overview of your connected accounts and available
                services.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
