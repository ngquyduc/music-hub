"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import { SpotifyConnectButton } from "./components/SpotifyConnectButton";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
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
      toast({
        title: "Success",
        description: "Your Spotify account has been successfully connected!",
        duration: 5000,
      });
      // Remove the query parameters from the URL
      router.replace("/dashboard", undefined, { shallow: true });
    } else if (error) {
      toast({
        title: "Error",
        description: `There was an error connecting your Spotify account: ${error}`,
        variant: "destructive",
        duration: 5000,
      });
      // Remove the query parameters from the URL
      router.replace("/dashboard", undefined, { shallow: true });
    }
  }, [searchParams, toast, router]);

  const fetchOnboardingStatus = async () => {
    try {
      const response = await fetch(
        `/api/user/onboarding-status?userId=${session?.user?.id}`
      );
      const data = await response.json();
      setIsOnboarded(data.isOnboarded);
      setIsSpotifyConnected(data.isSpotifyConnected);
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

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Access Denied</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your Dashboard, {session.user?.name}</CardTitle>
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
              {/* Add other music service connect buttons here */}
              <Button onClick={handleContinue} className="mt-4">
                Continue to Dashboard
              </Button>
            </div>
          ) : (
            <div>
              <p className="mb-4">
                Here's an overview of your connected accounts and playlists.
              </p>
              {isSpotifyConnected && (
                <Alert className="mb-4">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Spotify Connected</AlertTitle>
                  <AlertDescription>
                    Your Spotify account is successfully connected.
                  </AlertDescription>
                </Alert>
              )}
              {/* Add dashboard content here */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
